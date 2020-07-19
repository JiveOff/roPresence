/* roPresence Client
 * Created by JiveOff
 * Thanks to ddavness for the awesome PRs!
 */

const APP_VERSION = require('./package.json').version
const UPDATE_SERVER = "https://ropresence-hazel.vercel.app"
const AUTO_UPDATE_URL = UPDATE_SERVER + "/update/" + process.platform + "/" + APP_VERSION

const DiscordRPC = require('discord-rpc')
const io = require('socket.io-client')
const Axios = require('axios')
const {
  app,
  autoUpdater,
  Menu,
  Tray,
  Notification,
} = require('electron')
const Open = require('open')
const Config = require('./config/config.json')
const File = require('fs')

const operateWindows = process.platform === 'win32'

const path = require('path')

if (require('electron-squirrel-startup')) {
  process.exit(0)
}
if (handleSquirrelEvent(app)) {
  process.exit(0)
}

let tray

function handleSquirrelEvent (application) {
  if (process.argv.length === 1) {
    return false
  }

  const ChildProcess = require('child_process')
  const path = require('path')

  const appFolder = path.resolve(process.execPath, '..')
  const rootAtomFolder = path.resolve(appFolder, '..')
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'))
  const exeName = path.basename(process.execPath)

  const spawn = function (command, args) {
    let spawnedProcess

    try {
      spawnedProcess = ChildProcess.spawn(command, args, { detached: true })
    } catch (err) {
      console.log(err)
    }

    return spawnedProcess
  }

  const spawnUpdate = function (args) {
    return spawn(updateDotExe, args)
  }

  const squirrelEvent = process.argv[1]
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      spawnUpdate(['--createShortcut', exeName])
      setTimeout(application.quit, 1000)
      return true
    case '--squirrel-uninstall':
      spawnUpdate(['--removeShortcut', exeName])
      setTimeout(application.quit, 1000)
      return true
    case '--squirrel-obsolete':
      application.quit()
      return true
  }
}

async function logToFile (text) {
  console.log(text)
  File.appendFile('roPresence_log.txt', '\n' + text, (err) => {
    if (err) throw err
  })
}

const clientId = '595172822410592266'

const RPC = new DiscordRPC.Client({
  transport: 'ipc'
})

let robloxUser

let elapsed = new Date()
let elapsedLoc = ''

let tipLoc = false
let loaded = false
let tipSuccess = false

let socketPresence = false
let socketPresencePlace

let busyRetrying = false

async function getRobloxPresence () {
  if (operateWindows) {
    try {
      const bloxauth = require('./lib/bloxauth')
      const res = await bloxauth.post({ url: 'https://presence.roblox.com/v1/presence/users', data: { userIds: [robloxUser.robloxId] } })
      return {
        request: {
          status: 'ok',
          userId: robloxUser.robloxId
        },
        presence: res.data
      }
    } catch (e) {
      return false
    }
  } else {
    return false
  }
}

async function sendTip () {
  if (tipLoc === false && Config.showTips === true) {
    tipLoc = true
    tipSuccess = false
    await logToFile('roPresence Tip: To show your game name, head to the README.md in your folder or here: https://github.com/JiveOff/roPresence/blob/master/README.md#making-the-game-name-show')
    const notification = new Notification({
      title: 'roPresence Tip',
      body: 'Click this notification to know how to make your game name appear.',
      icon: path.join(__dirname, 'img/game.png'),
      timeoutType: 'never'
    })
    notification.on('click', (event) => {
      Open('https://github.com/JiveOff/roPresence/blob/master/README.md#making-the-game-name-show')
    })
    notification.show()
  }
}

async function successTip () {
  if (tipLoc === true && tipSuccess === false) {
    tipSuccess = true
    tipLoc = false
    await logToFile('roPresence: Great! Your game names are now shown on your presence.')
    const notification = new Notification({
      title: 'roPresence',
      body: 'Great! Your game names are now shown on your presence.',
      timeoutType: 'never',
      icon: path.join(__dirname, 'img/game.png')
    })
    notification.show()
  }
}

async function exitRoPresence () {
  await logToFile('roPresence: Stopping. Exiting cmd in 5 seconds.')
  await RPC.destroy()
  setTimeout(() => {
    process.exit()
  }, 5e3)
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([{
    label: 'Logged in.',
    type: 'normal'
  },
    {
      label: 'Roblox: ' + robloxUser.robloxUsername,
      type: 'normal'
    },
    {
      label: 'Discord: ' + RPC.user.username + '#' + RPC.user.discriminator,
      type: 'normal'
    },
    {
      label: 'Item2',
      type: 'separator'
    },
    {
      label: 'Start on login',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: () => {
        let settings = !app.getLoginItemSettings().openAtLogin;
        app.setLoginItemSettings({
          openAtLogin: settings,
          path: app.getPath("exe")
        });
        updateTrayMenu()
      }
    },
    {
      label: 'Item2',
      type: 'separator'
    },
    {
      label: 'Exit roPresence',
      type: 'normal',
      click: async function () {
        exitRoPresence()
        tray.destroy()
      }
    },
    {
      label: 'View Logs',
      type: 'normal',
      click: function () {
        Open('./roPresence_log.txt')
      }
    }
  ])
  tray.setContextMenu(contextMenu)
}

async function setActivity () {
  if (!RPC) {
    return
  }

  let error = false
  const presence = await getRobloxPresence()
  if (presence === false || presence.request.status === 'error') {
    error = true
  }

  if (error) {
    await logToFile('roPresence API Error: roPresence ran into an error and had to stop. Please make sure that you opened Roblox Studio recently and re-open roPresence.\nPlease open Studio and restart roPresence.')
    const notif = new Notification({
      title: 'roPresence API Error',
      body: 'Please make sure that you opened Roblox Studio recently and re-open roPresence.',
      icon: path.join(__dirname, 'img/no.png')
    })
    notif.show()
    await exitRoPresence()
    return
  }

  console.log(presence)

  const presenceInfo = presence.presence.userPresences[0]

  if(socketPresence === true) {
    if(presenceInfo.placeId !== socketPresencePlace) {
      await logToFile('Socket Client: Clearing socket presence because not in game anymore.. ')
      await setActivity()
      socketPresence = false
    }
  }

  let rpcInfo = {}

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
        await sendTip()
      } else {
        await successTip()
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
        await sendTip()
      } else {
        await successTip()
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
      rpcInfo.largeImageText = robloxUser.robloxUsername + " is using roPresence " + APP_VERSION
    } else {
      rpcInfo.largeImageText = 'Hidden user'
    }
    rpcInfo.instance = false

    await RPC.setActivity(rpcInfo)
  } else {
    await RPC.clearActivity()
  }

  if (loaded === false) {
    loaded = true
    await logToFile('roPresence Loaded: Glad to see you, ' + robloxUser.robloxUsername + '! Your presence will be updated once you interact with ROBLOX.')
    const notification = new Notification({
      title: 'roPresence Loaded',
      body: 'Glad to see you, ' + robloxUser.robloxUsername + '!\nYour presence will be updated once you interact with ROBLOX.',
      icon: path.join(__dirname, 'img/yes.png')
    })
    notification.show()
    await logToFile('Presence API: Your Discord presence will now be updated every 15 seconds with the ' + robloxUser.robloxUsername + ' ROBLOX Account.')
    updateTrayMenu()
  }
}

// C:\Users\antoi\WebstormProjects\roPresence-electron\release-builds\ropresence-win32-x64

async function getRoverUser () {
  const res = await Axios.get('https://verify.eryn.io/api/user/' + RPC.user.id)
  return res.data
}

async function initSocket () {
  await logToFile('Socket Client: Starting.')

  const socket = io.connect('http://presences.jiveoff.fr/client/subSocket', {
    reconnect: true,
    query: {
      robloxId: robloxUser.robloxId,
      robloxUsername: robloxUser.robloxUsername,
      clientVersion: APP_VERSION
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

  socket.on('setPresence', async (presence) => {
    let prc = await getRobloxPresence();
    if(prc.presence.userPresences[0].placeId === presence.place) {
      await logToFile('Socket Client: Updating socket presence.. ')
      await RPC.setActivity(presence.presence)
      socketPresence = true
      socketPresencePlace = presence.place
    }
  })

  socket.on('clearPresence', async (presence) => {
    let prc = await getRobloxPresence();
    if(prc.presence.userPresences[0].placeId === presence.place) {
      await logToFile('Socket Client: Clearing socket presence.. ')
      await setActivity()
      socketPresence = false
    }
  })
}

async function robloxVerify () {
  if(robloxUser) {
    await setActivity()
    return
  }
  const result = await getRoverUser()
  if (result.status === 'ok') {
    robloxUser = result
    await initSocket()
    await setActivity()
  } else {
    if (busyRetrying) {
      return
    }
    busyRetrying = true
    await RPC.clearActivity()

    await logToFile('roPresence Error: To use roPresence, please link your Discord account with verify.eryn.io')
    const notification = new Notification({
      title: 'roPresence Error',
      body: 'To use roPresence, please link your Discord account with verify.eryn.io\n\nClick this bubble to get there.',
      icon: path.join(__dirname, 'img/no.png'),
      timeoutType: 'never'
    })
    notification.on('click', (event) => {
      Open('https://verify.eryn.io/')
    })
    notification.show()
    await logToFile('RoVer: API returned an error: ' + result.error)
    let count = 0
    const retry = setInterval(async () => {
      const result = await getRoverUser()
      await logToFile('RoVer: Retrying..')
      if (result.status === 'ok') {
        loaded = false
        await init()
        busyRetrying = false
        clearInterval(retry)
      } else {
        if (count === 25) {
          await logToFile('roPresence Error: We couldn\'t find your ROBLOX account in time, roPresence has been stopped. Relaunch it to retry.')
          const notification = new Notification({
            title: 'roPresence Error',
            body: "We couldn't find your ROBLOX account in time, roPresence has been stopped.\nRelaunch it to retry!",
            icon: path.join(__dirname, 'img/no.png'),
            timeoutType: 'never'
          })
          notification.show()
          await exitRoPresence()
        }
        count = count + 1
      }
    }, 3e3)
  }
}

async function initUpdater() {

  autoUpdater.on(
      'error',
      async (err) => await logToFile("roPresence Error: Autoupdater - " + err.message + "."))

  autoUpdater.on(
      'checking-for-update',
      async () => {
        await logToFile('roPresence Info: Autoupdater - Checking for updates...')
        tray.setToolTip("roPresence - Checking for updates...")
      })

  autoUpdater.on(
      'update-available',
      async () => {
        await logToFile('roPresence Info: Autoupdater - Update available.')
        tray.setToolTip("roPresence - Update available.")

        const notification = new Notification({
          title: 'roPresence Update Available',
          body: "A new roPresence update is available. Starting the download.",
          timeoutType: 'never',
          icon: path.join(__dirname, 'img/roPresence-logo.png')
        })
        notification.show()
      })

  autoUpdater.on(
      'update-not-available',
      async () => {
        await logToFile('roPresence Info: Autoupdater - No update available.')
        tray.setToolTip("roPresence " + APP_VERSION)
      })

  autoUpdater.on(
      'download-progress',
      (obj) => {
        tray.setToolTip("roPresence - Downloading update: " + Math.round(obj.percent) + "%")
      })

  autoUpdater.on(
      'update-downloaded',
      (event, releaseNotes, releaseName) => {

        const notification = new Notification({
          title: 'roPresence Update Downloaded',
          body: "Version " + releaseName + " was downloaded. Restart roPresence to install it.",
          timeoutType: 'never',
          icon: path.join(__dirname, 'img/roPresence-logo.png')
        })
        notification.on('click', (event) => {
          autoUpdater.quitAndInstall()
        })
        notification.show()

        tray.setToolTip("roPresence - Update downloaded.")
      }
  )

  autoUpdater.setFeedURL(AUTO_UPDATE_URL)
  autoUpdater.checkForUpdates()

  setInterval(() => {
    autoUpdater.checkForUpdates()
  }, 10 * 60 * 1000)
}

async function init () {

  if (process.platform === 'linux') {
    await logToFile('roPresence Information: Autoupdater is not available on Linux.')
  } else {
    initUpdater()
  }

  await robloxVerify()
  /*const busy = setInterval(async () => {
    if (busyRetrying) {
      clearInterval(busy)
    } else {
      await robloxVerify()
    }
  }, 15e3)*/
}

app.whenReady().then(async () => {
  tray = new Tray('./resources/app/img/roPresence-logo.png')
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
    click: async function () {
      await exitRoPresence()
      tray.destroy()
    }
  },
  {
    label: 'View Logs',
    type: 'normal',
    click: function () {
      Open('./roPresence_log.txt')
    }
  }
  ])
  tray.setToolTip('roPresence - Loading...')
  tray.setContextMenu(contextMenu)
  const notification = new Notification({
    title: 'roPresence',
    body: 'Now loading ' + require('./package.json').version + ', this may take some seconds.',
    timeoutType: 'never',
    icon: path.join(__dirname, 'img/roPresence-logo.png')
  })
  notification.show()

  await logToFile('RPC: Attempting to login through IPC.')
  RPC.on('ready', async () => {
    await logToFile('RPC: Logged in as ' + RPC.user.username + ' (' + RPC.user.id + ').')
    await init()
  })

  RPC.login({
    clientId
  }).catch(async (str) => {
    await logToFile(str)
    await logToFile('Failed to connect to Discord!')

    if (Config.attemptToOpenDiscordOnConnectionFailure === true && process.env.terminal !== '1') {
      await logToFile('Attempting to forcefully open Discord...')
      Open('Discord.exe', {
        wait: 'true'
      })

      setInterval(async () => {
        // Restart process and pass in a flag to give up after first attempt
        await logToFile('Restarting process with terminal flag...')

        process.exit(1) // Failure, ask master process to launch terminal process.
      }, Config.discordOpenedTimeout * 1000)
    } else {
      const notification = new Notification({
        title: 'roPresence Discord Error',
        body: "Failed to connect to Discord! Make sure that Discord has been launched and that you're logged in, then launch roPresence again.",
        timeoutType: 'never',
        icon: path.join(__dirname, 'img/no.png')
      })
      notification.on('click', (event) => {
        Open('Discord.exe')
      })
      notification.show()
      await logToFile("Make sure that Discord has been launched and that you're logged in, then launch roPresence again.")
      await logToFile('Exiting in 5 seconds...')
      setInterval(() => {
        process.exit()
      }, 5000)
    }
  })
})
