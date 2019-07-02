// RobloxPresence
// Coded by JiveOff

const DiscordRPC = require('discord-rpc')
const Fetch = require('node-fetch')
const Notifier = require('node-notifier')
const Path = require('path')
const Open = require('open')
const Config = require('./config.json')

const clientId = '595172822410592266'

const RPC = new DiscordRPC.Client({ transport: 'ipc' })

var robloxUser = {}

var elapsed = new Date()
var elapsedLoc = ''

var tipLoc = false
var loaded = false
var tipSuccess = false

var busyRetrying = false

async function getROBLOXPresence () {
  console.log('Presence API: Updating ROBLOX presence for ' + robloxUser.robloxUsername + '.')
  try {
    let data = await Fetch('http://51.75.204.210:3000/presences/' + robloxUser.robloxId)
    let main = await data.json()
    return main
  } catch (e) {
    console.error(e)
    return false
  }
}

function sendTip () {
  if (tipLoc === false && Config.showTips == true) {
    tipLoc = true
    tipSuccess = false
    Notifier.notify({
      title: 'roPresence Tip',
      message: 'To show your game, review your ROBLOX privacy settings to "Friends and Users I follow" and follow the "roPresence_bot" account.',
      sound: true,
      icon: Path.join(__dirname, 'img/game.png'),
      wait: true
    })
  }
}

function successTip () {
  if (tipLoc === true && tipSuccess === false) {
    tipSuccess = true
    tipLoc = false
    Notifier.notify({
      title: 'roPresence',
      message: 'Great! Your game names are now shown on your presence.',
      sound: true,
      icon: Path.join(__dirname, 'img/game.png'),
      wait: true
    })
  }
}

function exitRoPresence () {
  console.log('roPresence: Stopping.')
  RPC.destroy()
  setTimeout(() => {
    process.exit()
  }, 2e3)
}

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
    Notifier.notify({
      title: 'roPresence API Error',
      message: 'roPresence ran into an error and had to stop.',
      sound: true,
      icon: Path.join(__dirname, 'img/no.png')
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
      rpcInfo.details = 'Not playing'
      rpcInfo.state = 'IGN: ' + robloxUser.robloxUsername
      elapsedLoc = 'Not playing'
      break
    case 1:
      rpcInfo.startTimestamp = elapsed
      rpcInfo.details = 'On the website'
      rpcInfo.smallImageKey = 'online'
      rpcInfo.smallImageText = 'Browsing the website'
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

  rpcInfo.largeImageKey = 'logo'
  rpcInfo.largeImageText = 'ROBLOX: ' + robloxUser.robloxUsername
  rpcInfo.instance = false

  RPC.setActivity(rpcInfo)

  if (loaded === false) {
    loaded = true
    Notifier.notify({
      title: 'roPresence Loaded',
      message: 'Glad to see you, ' + robloxUser.robloxUsername + '!\nYour presence will be updated once you interact with ROBLOX.',
      sound: true,
      icon: Path.join(__dirname, 'img/yes.png')
    })
  }
}

async function getRoverUser () {
  let data = await Fetch('https://verify.eryn.io/api/user/' + RPC.user.id)
  let main = await data.json()
  return main
}

Notifier.on('click', function (notifyObject, opt) {
  if (opt.title === 'roPresence Error') {
    Open('https://verify.eryn.io/')
  } else if (opt.title === 'roPresence Tip') {
    Open('https://www.roblox.com/users/1143479593/profile')
  }
})

async function robloxVerify () {
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
    Notifier.notify({
      title: 'roPresence Error',
      message: 'To use roPresence, please link your Discord account with verify.eryn.io\n\nClick this bubble to get there.',
      sound: true,
      icon: Path.join(__dirname, 'img/no.png'),
      wait: true
    })
    console.error('RoVer: API returned an error: ' + result.error)
    var count = 0
    var retry = setInterval(async () => {
      let result = await getRoverUser()
      console.log('RoVer: Retrying..')
      if (result.status === 'ok') {
        init()
        busyRetrying = false
        clearInterval(retry)
      } else {
        if (count === 25) {
          Notifier.notify({
            title: 'roPresence Error',
            message: "We couldn't find your ROBLOX account in time, roPresence has been stopped.\nRelaunch it to retry!",
            sound: true,
            icon: Path.join(__dirname, 'img/no.png'),
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

RPC.on('ready', async () => {
  console.log('RPC: Logged in as ' + RPC.user.username + ' (' + RPC.user.id + ').')
  init()
})

console.log('RPC: Attempting to login thru IPC.')
RPC.login({ clientId }).catch(console.error)
