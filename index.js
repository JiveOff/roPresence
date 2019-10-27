// RobloxPresence
// Coded by JiveOff

const DiscordRPC = require('discord-rpc')
const Fetch = require('node-fetch')
const Notifier = require('node-notifier')
const Open = require('open')
const Config = require('./config.json')
const File = require('fs')
const Express = require('express')

const path = require('path')

const thread = require('child_process')
const self = require('./package.json')

async function logToFile (text) {
  console.log(text)
  File.appendFile('roPresence_log.txt', '\n' + text, (err) => {
    if (err) throw err
  })
}

if (!process.env.terminal) {
  var t = thread.spawnSync(process.argv[0], [process.argv[1]], {
    // Copy MacOS/Unix env stats to the child processes. This might fix (or not) some issues with it not working on mac.

    env: { terminal: '0', XDG_RUNTIME_DIR: process.env.XDG_RUNTIME_DIR, TMPDIR: process.env.TMPDIR, TMP: process.env.TMP, TEMP: process.env.TEMP },
    stdio: [process.stdin, process.stdout, process.stderr]
  })

  if (t.status === 1) {
    thread.spawnSync(process.argv[0], [process.argv[1]], {
      // Copy MacOS/Unix env stats to the child processes. This might fix (or not) some issues with it not working on mac.

      env: { terminal: '1', XDG_RUNTIME_DIR: process.env.XDG_RUNTIME_DIR, TMPDIR: process.env.TMPDIR, TMP: process.env.TMP, TEMP: process.env.TEMP },
      stdio: [process.stdin, process.stdout, process.stderr]
    })

    process.exit()
  } else {
    process.exit()
  }
}

const ExpressApp = Express()
const clientId = '595172822410592266'

const RPC = new DiscordRPC.Client({ transport: 'ipc' })

var robloxUser = {}

var elapsed = new Date()
var elapsedLoc = ''

var tipLoc = false
var loaded = false
var tipSuccess = false

var busyRetrying = false

if (process.env.terminal === '0') {
  var launchstr = `*** roPresence v${self.version} Launched: ${new Date().toString()} ***`
  logToFile('\n ' + '*'.repeat(launchstr.length) + '\n ' + launchstr + '\n ' + '*'.repeat(launchstr.length) + '\n')
  logToFile(' * Non-terminal slave process launched.')
} else if (process.env.terminal === '1') {
  logToFile(' * Terminal slave process launched.')
}

async function getROBLOXPresence () {
  try {
    const data = await Fetch('http://vps1.jiveoff.fr:3000/presences/' + robloxUser.robloxId)
    const main = await data.json()
    return main
  } catch (e) {
    logToFile(e)
    return false
  }
}

function sendTip () {
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

function successTip () {
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

function exitRoPresence () {
  logToFile('roPresence: Stopping. Exiting cmd in 10 seconds.')
  RPC.destroy()
  setTimeout(() => {
    process.exit()
  }, 10e3)
}

ExpressApp.get('/killRoPresence', function (req, res) {
  res.sendFile(path.join(__dirname, '/pages/shuttingdown.html'))
  exitRoPresence()
})

async function setActivity () {
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

  const presenceInfo = presence.presence.userPresences[0]

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

async function getRoverUser () {
  const data = await Fetch('https://verify.eryn.io/api/user/' + RPC.user.id)
  const main = await data.json()
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

async function robloxVerify () {
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
      const result = await getRoverUser()
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

async function init () {
  robloxVerify()

  var busy = setInterval(() => {
    if (busyRetrying) {
      clearInterval(busy)
    } else {
      robloxVerify()
    }
  }, 15e3)
}

ExpressApp.listen(3000, function () {
  logToFile('roPresence Express kill server online.')
})

logToFile('RPC: Attempting to login through IPC.')
RPC.on('ready', async () => {
  logToFile('RPC: Logged in as ' + RPC.user.username + ' (' + RPC.user.id + ').')
  init()
})

RPC.login({ clientId }).catch((str) => {
  logToFile(str)
  logToFile('Failed to connect to Discord!')

  if (Config.attemptToOpenDiscordOnConnectionFailure === true && process.env.terminal !== '1') {
    logToFile('Attempting to forcefully open Discord...')
    Open('Discord.exe', { wait: 'true' })

    setInterval(() => {
      // Restart process and pass in a flag to give up after first attempt
      logToFile('Restarting process with terminal flag...')

      process.exit(1) // Failure, ask master process to launch terminal process.
    }, Config.discordOpenedTimeout * 1000)
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
    setInterval(() => { process.exit() }, 5000)
  }
})
