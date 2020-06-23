/* roPresence Client
 * Created by JiveOff
 * Thanks to ddavness for the awesome PRs!
 */

const DiscordRPC = require('discord-rpc')
const io = require('socket.io-client')
const Fetch = require('node-fetch')
const {
  app,
  Menu,
  Tray,
  Notification
} = require('electron')
const Open = require('open')
const Config = require('./config/config.json')
const File = require('fs')

const path = require('path')

const self = require('./package.json')

// FUN squirrel stuff
if (require('electron-squirrel-startup')) return;
if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};

async function logToFile(text) {
  console.log(text)
  File.appendFile('roPresence_log.txt', '\n' + text, (err) => {
    if (err) throw err
  })
}

const clientId = '595172822410592266'

const RPC = new DiscordRPC.Client({
  transport: 'ipc'
})

var robloxUser = {}

var elapsed = new Date()
var elapsedLoc = ''

var tipLoc = false
var loaded = false
var tipSuccess = false

var socketPresence = false

var busyRetrying = false

async function getROBLOXPresence() {
  try {
    const data = await Fetch('http://vps1.jiveoff.fr:3000/presences/' + robloxUser.robloxId)
    const main = await data.json()
    return main
  } catch (e) {
    logToFile(e)
    return false
  }
}

function sendTip() {
  if (tipLoc === false && Config.showTips === true) {
    tipLoc = true
    tipSuccess = false
    logToFile('roPresence Tip: To show your game name, head to the README.md in your folder or here: https://github.com/JiveOff/roPresence/blob/master/README.md#making-the-game-name-show')
    let myNotification = new Notification({
      title: 'roPresence Tip',
      body: 'Click this notification to know how to make your game name appear.',
      icon: path.join(__dirname, 'img/game.png'),
      timeoutType: "never"
    })
    myNotification.show()
    myNotification.onclick = () => {
      Open('https://github.com/JiveOff/roPresence/blob/master/README.md#making-the-game-name-show')
    }
  }
}

function successTip() {
  if (tipLoc === true && tipSuccess === false) {
    tipSuccess = true
    tipLoc = false
    logToFile('roPresence: Great! Your game names are now shown on your presence.')
    let myNotification = new Notification({
      title: 'roPresence',
      body: 'Great! Your game names are now shown on your presence.',
      timeoutType: "never",
      icon: path.join(__dirname, 'img/game.png')
    })
    myNotification.show()
  }
}

function exitRoPresence() {
  logToFile('roPresence: Stopping. Exiting cmd in 10 seconds.')
  RPC.destroy()
  setTimeout(() => {
    process.exit()
  }, 10e3)
}

async function setActivity() {
  if (!RPC) {
    return
  }

  var presence
  var error = false
  presence = await getROBLOXPresence()
  if (presence === false || presence.request.status === 'error') {
    error = true
  }

  if (error) {
    logToFile('roPresence API Error: roPresence ran into an error and had to stop. This error is mainly due to a remote API problem.\nPlease restart the presence.')
    let notif = new Notification({
      title: 'roPresence API Error',
      body: 'roPresence ran into an error and had to stop.',
      icon: path.join(__dirname, 'img/no.png')
    })
    notif.show()
    exitRoPresence()
    return
  }

  const presenceInfo = presence.presence.userPresences[0]

  if (socketPresence) {
    return
  }

  var rpcInfo = {}

  if (presenceInfo.lastLocation !== elapsedLoc) {
    elapsed = new Date()
    elapsedLoc = presenceInfo.lastLocation
  }

  switch (presenceInfo.userPresenceType) {
    case 0:
      if (Config.showOfflinePresence === true) {
        rpcInfo.details = 'Not playing'
        rpcInfo.state = 'IGN: ' + robloxUser.robloxUsername
        elapsedLoc = 'Not playing'
      } else {
        rpcInfo = null
      }
      break
    case 1:
      if (Config.showWebsitePresence === true) {
        rpcInfo.startTimestamp = elapsed
        rpcInfo.details = 'On the website'
        rpcInfo.smallImageKey = 'online'
        rpcInfo.smallImageText = 'Browsing the website'
      } else {
        rpcInfo = null
      }
      break
    case 2:
      rpcInfo.startTimestamp = elapsed
      if (presenceInfo.lastLocation === '') {
        rpcInfo.details = 'Playing a secret game'
        rpcInfo.smallImageKey = 'playing'
        rpcInfo.smallImageText = 'A secret game'
        sendTip()
      } else {
        successTip()
        rpcInfo.details = 'Playing a game'
        rpcInfo.state = presenceInfo.lastLocation
        rpcInfo.smallImageKey = 'playing'
        rpcInfo.smallImageText = presenceInfo.lastLocation
      }
      break
    case 3:
      rpcInfo.startTimestamp = elapsed
      if (presenceInfo.lastLocation === '') {
        rpcInfo.details = 'Creating a secret game'
        rpcInfo.smallImageKey = 'creating'
        rpcInfo.smallImageText = 'A secret game'
        sendTip()
      } else {
        successTip()
        rpcInfo.details = 'Creating on Studio'
        rpcInfo.state = presenceInfo.lastLocation
        rpcInfo.smallImageKey = 'creating'
        rpcInfo.smallImageText = presenceInfo.lastLocation
      }
      break
    default:
      break
  }

  if (rpcInfo) {
    rpcInfo.largeImageKey = 'logo'
    if (Config.showUsernameInPresence === true) {
      rpcInfo.largeImageText = 'ROBLOX: ' + robloxUser.robloxUsername
    } else {
      rpcInfo.largeImageText = 'Hidden user'
    }
    rpcInfo.instance = false

    RPC.setActivity(rpcInfo)
  } else {
    RPC.clearActivity()
  }

  if (loaded === false) {
    loaded = true
    logToFile('roPresence Loaded: Glad to see you, ' + robloxUser.robloxUsername + '! Your presence will be updated once you interact with ROBLOX.')
    let myNotification = new Notification({
      title: 'roPresence Loaded',
      body: 'Glad to see you, ' + robloxUser.robloxUsername + '!\nYour presence will be updated once you interact with ROBLOX.',
      icon: path.join(__dirname, 'img/yes.png')
    })
    myNotification.show()
    logToFile('Presence API: Your Discord presence will now be updated every 15 seconds with the ' + robloxUser.robloxUsername + ' ROBLOX Account.\nIf you unverify, roPresence will stop showing the Discord Presence and ask you to verify yourself again.\n\nTo keep the Discord Presence, DO NOT close this window. You can close it when you will be done.')
    const contextMenu = Menu.buildFromTemplate([{
      label: 'Logged in.',
      type: 'normal'
    },
    {
      label: 'Roblox: '+robloxUser.robloxUsername,
      type: 'normal'
    },
    {
      label: 'Discord: '+RPC.user.username+"#"+RPC.user.discriminator,
      type: 'normal'
    },
    {
      label: 'Item2',
      type: 'separator'
    },
    {
      label: 'Exit roPresence',
      type: 'normal',
      click: function() {
        exitRoPresence()
        tray.destroy()
      }
    },
    {
      label: 'View Logs',
      type: 'normal',
      click: function() {
        Open("./roPresence_log.txt")
      }
    }
  ])
  tray.setToolTip(`roPresence`)
  tray.setContextMenu(contextMenu)
  }
}

async function getRoverUser() {
  const data = await Fetch('https://verify.eryn.io/api/user/' + RPC.user.id)
  const main = await data.json()
  return main
}

async function initSocket() {
  logToFile('Socket Client: Starting.')

  var socket = io.connect('http://presences.jiveoff.fr/client/subSocket', {
    reconnect: true,
    query: {
      robloxId: robloxUser.robloxId,
      robloxUsername: robloxUser.robloxUsername
    }
  })

  socket.on('connect', () => {
    logToFile('Socket Client: Connected to socket, authenticating.')
  })

  socket.on('disconnect', () => {
    logToFile('Socket Client: Disconnected from socket, retrying to connect.')
  })

  socket.on('instanceReady', () => {
    logToFile('Socket Client: Authenticated to socket, ready.')
  })

  socket.on('serverMessage', (msg) => {
    logToFile('Remote Socket Server: ' + msg)
  })

  socket.on('setPresence', (presence) => {
    logToFile('Socket Client: Updating socket presence.. ')
    RPC.setActivity(presence)
    socketPresence = true
  })

  socket.on('clearPresence', () => {
    logToFile('Socket Client: Clearing socket presence.. ')
    setActivity()
    socketPresence = false
  })
}

async function robloxVerify() {
  const result = await getRoverUser()
  if (result.status === 'ok') {
    robloxUser = result
    setActivity()
  } else {
    if (busyRetrying) {
      return
    }
    busyRetrying = true
    RPC.clearActivity()

    logToFile('roPresence Error: To use roPresence, please link your Discord account with verify.eryn.io')
    let myNotification = new Notification({
      title: 'roPresence Error',
      body: 'To use roPresence, please link your Discord account with verify.eryn.io\n\nClick this bubble to get there.',
      icon: path.join(__dirname, 'img/no.png'),
      timeoutType: "never"
    })
    myNotification.show()
    myNotification.onclick = () => {
      Open('https://verify.eryn.io/')
    }
    logToFile('RoVer: API returned an error: ' + result.error)
    var count = 0
    var retry = setInterval(async () => {
      const result = await getRoverUser()
      logToFile('RoVer: Retrying..')
      if (result.status === 'ok') {
        loaded = false
        init()
        busyRetrying = false
        clearInterval(retry)
      } else {
        if (count === 25) {
          logToFile('roPresence Error: We couldn\'t find your ROBLOX account in time, roPresence has been stopped. Relaunch it to retry.')
          let myNotification = new Notification({
            title: 'roPresence Error',
            body: "We couldn't find your ROBLOX account in time, roPresence has been stopped.\nRelaunch it to retry!",
            icon: path.join(__dirname, 'img/no.png'),
            timeoutType: "never"
          })
          myNotification.show()
          exitRoPresence()
        }
        count = count + 1
      }
    }, 3e3)
  }
}

async function init() {
  await robloxVerify()
  initSocket()

  var busy = setInterval(() => {
    if (busyRetrying) {
      clearInterval(busy)
    } else {
      robloxVerify()
    }
  }, 15e3)
}
app.whenReady().then(() => {
  tray = new Tray('./img/roPresence-logo.png')
  const contextMenu = Menu.buildFromTemplate([{
      label: 'Logging in.',
      type: 'normal'
    },
    {
      label: 'Item2',
      type: 'separator'
    },
    {
      label: 'Exit roPresence',
      type: 'normal',
      click: function() {
        exitRoPresence()
        tray.destroy()
      }
    },
    {
      label: 'View Logs',
      type: 'normal',
      click: function() {
        Open("./roPresence_log.txt")
      }
    }
  ])
  tray.setToolTip(`roPresence`)
  tray.setContextMenu(contextMenu)
  logToFile('RPC: Attempting to login through IPC.')
  RPC.on('ready', async () => {
    logToFile('RPC: Logged in as ' + RPC.user.username + ' (' + RPC.user.id + ').')
    init()
  })

  RPC.login({
    clientId
  }).catch((str) => {
    logToFile(str)
    logToFile('Failed to connect to Discord!')

    if (Config.attemptToOpenDiscordOnConnectionFailure === true && process.env.terminal !== '1') {
      logToFile('Attempting to forcefully open Discord...')
      Open('Discord.exe', {
        wait: 'true'
      })

      setInterval(() => {
        // Restart process and pass in a flag to give up after first attempt
        logToFile('Restarting process with terminal flag...')

        process.exit(1) // Failure, ask master process to launch terminal process.
      }, Config.discordOpenedTimeout * 1000)
    } else {
      let myNotification = new Notification({
        title: 'roPresence Discord Error',
        body: "Failed to connect to Discord! Make sure that Discord has been launched and that you're logged in, then launch roPresence again.",
        timeoutType: "never",
        icon: path.join(__dirname, 'img/no.png'),
      })
      myNotification.onclick = () => {
        Open('Discord.exe')
      }
      myNotification.show()
      logToFile("Make sure that Discord has been launched and that you're logged in, then launch roPresence again.")
      logToFile('Exiting in 5 seconds...')
      setInterval(() => {
        process.exit()
      }, 5000)
    }
  })
})