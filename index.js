// RobloxPresence
// Coded by JiveOff

// Modules to control application life and create native browser window
var ipcMain = require('electron').ipcMain;
const {
  app,
  BrowserWindow
} = require('electron')
const os = require("os")
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon:  __dirname + '/img/roPresence-logo.ico',
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('./views/index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
const DiscordRPC = require('discord-rpc')
const Fetch = require('node-fetch')
const Notifier = require('node-notifier')

const Open = require('open')
const Config = require('./config.json')
const File = require('fs')
const path = require('path')

const self = require('./package.json')

async function logToFile(text) {
  console.log(text)
  File.appendFile('roPresence_log.txt', '\n' + text, (err) => {
    if (err) throw err
  })
}

/*if (!process.env.terminal) {
  var t = thread.spawnSync(process.argv[0], [process.argv[1]], {
    env: {
      terminal: '0'
    },
    stdio: [process.stdin, process.stdout, process.stderr]
  })
  if (t.status === 1) {
    thread.spawnSync(process.argv[0], [process.argv[1]], {
      env: {
        terminal: '1'
      },
      stdio: [process.stdin, process.stdout, process.stderr]
    })
    process.exit()
  } else {
    process.exit()
  }
}*/

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

var busyRetrying = false

/*if (process.env.terminal === '0') {
  var launchstr = `*** roPresence v${self.version} Launched: ${new Date().toString()} ***`
  logToFile('\n ' + '*'.repeat(launchstr.length) + '\n ' + launchstr + '\n ' + '*'.repeat(launchstr.length) + '\n')
  logToFile(' * Non-terminal slave process launched.')
} else if (process.env.terminal === '1') {
  logToFile(' * Terminal slave process launched.')
}*/

var version = os.type
if (version == "Windows_NT") { // If this is windows then...
  process.env.terminal = '0'
} else {
  process.env.terminal = '1'
}

var launchstr = `*** roPresence v${self.version} Launched: ${new Date().toString()} ***`
logToFile('\n ' + '*'.repeat(launchstr.length) + '\n ' + launchstr + '\n ' + '*'.repeat(launchstr.length) + '\n')

async function getROBLOXPresence() {
  try {
    let data = await Fetch('http://vps1.jiveoff.fr:3000/presences/' + robloxUser.robloxId)
    let main = await data.json()
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
    logToFile('roPresence Tip - To show your game name, head to the README.md in your folder or here: https://github.com/JiveOff/roPresence/blob/master/README.md#making-the-game-name-show')
    Notifier.notify({
      title: 'roPresence Tip',
      message: 'Click this notification to know how to make your game name appear.',
      sound: true,
      icon: path.join(__dirname, 'img/game.png'),
      wait: true
    })
  }
}

function successTip() {
  if (tipLoc === true && tipSuccess === false) {
    tipSuccess = true
    tipLoc = false
    logToFile('roPresence - Great! Your game names are now shown on your presence.')
    Notifier.notify({
      title: 'roPresence',
      message: 'Great! Your game names are now shown on your presence.',
      sound: true,
      icon: path.join(__dirname, 'img/game.png'),
      wait: true
    })
  }
}

function exitRoPresence() {
  logToFile('roPresence: Stopping. Exiting cmd in 10 seconds.')
  RPC.destroy()
  setTimeout(() => {
    process.exit()
  }, 10e3)
}

ipcMain.on('shutdown', function () {
  exitRoPresence()
});

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
    logToFile('roPresence API Error - roPresence ran into an error and had to stop. This error is mainly due to a remote API problem.\nPlease restart the presence.')
    Notifier.notify({
      title: 'roPresence API Error',
      message: 'roPresence ran into an error and had to stop.',
      sound: true,
      icon: path.join(__dirname, 'img/no.png')
    })
    exitRoPresence()
    return
  }

  let presenceInfo = presence.presence.userPresences[0]

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
    logToFile('roPresence Loaded - Glad to see you, ' + robloxUser.robloxUsername + '! Your presence will be updated once you interact with ROBLOX.')
    Notifier.notify({
      title: 'roPresence Loaded',
      message: 'Glad to see you, ' + robloxUser.robloxUsername + '!\nYour presence will be updated once you interact with ROBLOX.',
      sound: true,
      icon: path.join(__dirname, 'img/yes.png')
    })
    logToFile('Presence API: Your Discord presence will now be updated every 15 seconds with the ' + robloxUser.robloxUsername + ' ROBLOX Account.\nIf you unverify, roPresence will stop showing the Discord Presence and ask you to verify yourself again.\n\nTo keep the Discord Presence, DO NOT close this window. You can close it when you will be done.')
  }
}

async function getRoverUser() {
  let data = await Fetch('https://verify.eryn.io/api/user/' + RPC.user.id)
  let main = await data.json()
  return main
}

Notifier.on('click', function (notifyObject, opt) {
  if (opt.title === 'roPresence Error') {
    Open('https://verify.eryn.io/')
  } else if (opt.title === 'roPresence Discord Error' && Config.attemptToOpenDiscordOnConnectionFailurePopupClick === true && process.env.terminal !== '1') {
    Open('Discord.exe') // Leaving this as a "might work, not guaranteed" solution.
  } else if (opt.title === 'roPresence Tip') {
    Open('https://github.com/JiveOff/roPresence/blob/master/README.md#making-the-game-name-show')
  }
})

async function robloxVerify() {
  let result = await getRoverUser()
  if (result.status === 'ok') {
    robloxUser = result
    setActivity()
  } else {
    if (busyRetrying) {
      return
    }
    busyRetrying = true
    RPC.clearActivity()

    logToFile('roPresence Error - To use roPresence, please link your Discord account with verify.eryn.io')
    Notifier.notify({
      title: 'roPresence Error',
      message: 'To use roPresence, please link your Discord account with verify.eryn.io\n\nClick this bubble to get there.',
      sound: true,
      icon: path.join(__dirname, 'img/no.png'),
      wait: true
    })
    logToFile('RoVer: API returned an error: ' + result.error)
    var count = 0
    var retry = setInterval(async () => {
      let result = await getRoverUser()
      logToFile('RoVer: Retrying..')
      if (result.status === 'ok') {
        loaded = false
        init()
        busyRetrying = false
        clearInterval(retry)
      } else {
        if (count === 25) {
          logToFile('roPresence Error - We couldn\'t find your ROBLOX account in time, roPresence has been stopped. Relaunch it to retry.')
          Notifier.notify({
            title: 'roPresence Error',
            message: "We couldn't find your ROBLOX account in time, roPresence has been stopped.\nRelaunch it to retry!",
            sound: true,
            icon: path.join(__dirname, 'img/no.png'),
            wait: true
          })
          exitRoPresence()
        }
        count = count + 1
      }
    }, 3e3)
  }
}

async function init() {
  robloxVerify()

  var busy = setInterval(() => {
    if (busyRetrying) {
      clearInterval(busy)
    } else {
      setActivity()
    }
  }, 15e3)
}

RPC.on('ready', async () => {
  logToFile('RPC: Logged in as ' + RPC.user.username + ' (' + RPC.user.id + ').')
  init()
})

logToFile('RPC: Attempting to login thru IPC.')
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
    }, 10e3)
  } else {
    Notifier.notify({
      title: 'roPresence Discord Error',
      message: "Failed to connect to Discord! Make sure that Discord has been launched and that you're logged in, then launch roPresence again.",
      sound: true,
      icon: path.join(__dirname, 'img/no.png'),
      wait: true
    })
    logToFile("Make sure that Discord has been launched and that you're logged in, then launch roPresence again.")
    logToFile('Exiting in 5 seconds...')
    setInterval(() => {
      process.exit()
    }, 5000)
  }
})