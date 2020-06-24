/* roPresence Client
 * Created by JiveOff
 * Thanks to ddavness for the awesome PRs!
 */

const DiscordRPC = require('discord-rpc');
const io = require('socket.io-client');
const Fetch = require('node-fetch');
const {
  app,
  Menu,
  Tray,
  Notification
} = require('electron');
const Open = require('open');
const Config = require('./config/config.json');
const File = require('fs');

const path = require('path');

if (require('electron-squirrel-startup')) return;
if (handleSquirrelEvent(app)) {
  return;
}

function handleSquirrelEvent(application) {
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
    let spawnedProcess;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (err) {
      console.log(err)
    }

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      spawnUpdate(['--createShortcut', exeName]);
      setTimeout(application.quit, 1000);
      return true;
    case '--squirrel-uninstall':
      spawnUpdate(['--removeShortcut', exeName]);
      setTimeout(application.quit, 1000);
      return true;
    case '--squirrel-obsolete':
      application.quit();
      return true;
  }
}

async function logToFile(text) {
  console.log(text);
  File.appendFile('roPresence_log.txt', '\n' + text, (err) => {
    if (err) throw err
  })
}

const clientId = '595172822410592266';

const RPC = new DiscordRPC.Client({
  transport: 'ipc'
});

let robloxUser = {};

let elapsed = new Date();
let elapsedLoc = '';

let tipLoc = false;
let loaded = false;
let tipSuccess = false;

let socketPresence = false;

let busyRetrying = false;

async function getRobloxPresence() {
  try {
    const data = await Fetch('http://vps1.jiveoff.fr:3000/presences/' + robloxUser.robloxId);
    return await data.json();
  } catch (e) {
    await logToFile(e);
    return false
  }
}

async function sendTip() {
  if (tipLoc === false && Config.showTips === true) {
    tipLoc = true;
    tipSuccess = false;
    await logToFile('roPresence Tip: To show your game name, head to the README.md in your folder or here: https://github.com/JiveOff/roPresence/blob/master/README.md#making-the-game-name-show');
    let notification = new Notification({
      title: 'roPresence Tip',
      body: 'Click this notification to know how to make your game name appear.',
      icon: path.join(__dirname, 'img/game.png'),
      timeoutType: "never"
    });
    notification.show();
    notification.onclick = () => {
      Open('https://github.com/JiveOff/roPresence/blob/master/README.md#making-the-game-name-show')
    }
  }
}

async function successTip() {
  if (tipLoc === true && tipSuccess === false) {
    tipSuccess = true;
    tipLoc = false;
    await logToFile('roPresence: Great! Your game names are now shown on your presence.');
    let notification = new Notification({
      title: 'roPresence',
      body: 'Great! Your game names are now shown on your presence.',
      timeoutType: "never",
      icon: path.join(__dirname, 'img/game.png')
    });
    notification.show()
  }
}

async function exitRoPresence() {
  await logToFile('roPresence: Stopping. Exiting cmd in 5 seconds.');
  await RPC.destroy();
  setTimeout(() => {
    process.exit()
  }, 5e3)
}

async function setActivity() {
  if (!RPC) {
    return
  }

  let presence;
  let error = false;
  presence = await getRobloxPresence();
  if (presence === false || presence.request.status === 'error') {
    error = true
  }

  if (error) {
    await logToFile('roPresence API Error: roPresence ran into an error and had to stop. This error is mainly due to a remote API problem.\nPlease restart the presence.');
    let notif = new Notification({
      title: 'roPresence API Error',
      body: 'roPresence ran into an error and had to stop.',
      icon: path.join(__dirname, 'img/no.png')
    });
    notif.show();
    await exitRoPresence();
    return
  }

  const presenceInfo = presence.presence.userPresences[0];

  if (socketPresence) {
    return
  }

  let rpcInfo = {};

  if (presenceInfo.lastLocation !== elapsedLoc) {
    elapsed = new Date();
    elapsedLoc = presenceInfo.lastLocation
  }

  switch (presenceInfo.userPresenceType) {
    case 0:
      if (Config.showOfflinePresence === true) {
        rpcInfo.details = 'Not playing';
        rpcInfo.state = 'IGN: ' + robloxUser.robloxUsername;
        elapsedLoc = 'Not playing'
      } else {
        rpcInfo = null
      }
      break;
    case 1:
      if (Config.showWebsitePresence === true) {
        rpcInfo.startTimestamp = elapsed;
        rpcInfo.details = 'On the website';
        rpcInfo.smallImageKey = 'online';
        rpcInfo.smallImageText = 'Browsing the website'
      } else {
        rpcInfo = null
      }
      break;
    case 2:
      rpcInfo.startTimestamp = elapsed;
      if (presenceInfo.lastLocation === '') {
        rpcInfo.details = 'Playing a secret game';
        rpcInfo.smallImageKey = 'playing';
        rpcInfo.smallImageText = 'A secret game';
        await sendTip()
      } else {
        await successTip();
        rpcInfo.details = 'Playing a game';
        rpcInfo.state = presenceInfo.lastLocation;
        rpcInfo.smallImageKey = 'playing';
        rpcInfo.smallImageText = presenceInfo.lastLocation
      }
      break;
    case 3:
      rpcInfo.startTimestamp = elapsed;
      if (presenceInfo.lastLocation === '') {
        rpcInfo.details = 'Creating a secret game';
        rpcInfo.smallImageKey = 'creating';
        rpcInfo.smallImageText = 'A secret game';
        await sendTip()
      } else {
        await successTip();
        rpcInfo.details = 'Creating on Studio';
        rpcInfo.state = presenceInfo.lastLocation;
        rpcInfo.smallImageKey = 'creating';
        rpcInfo.smallImageText = presenceInfo.lastLocation
      }
      break;
    default:
      break
  }

  if (rpcInfo) {
    rpcInfo.largeImageKey = 'logo';
    if (Config.showUsernameInPresence === true) {
      rpcInfo.largeImageText = 'ROBLOX: ' + robloxUser.robloxUsername
    } else {
      rpcInfo.largeImageText = 'Hidden user'
    }
    rpcInfo.instance = false;

    await RPC.setActivity(rpcInfo)
  } else {
    await RPC.clearActivity()
  }

  if (loaded === false) {
    loaded = true;
    await logToFile('roPresence Loaded: Glad to see you, ' + robloxUser.robloxUsername + '! Your presence will be updated once you interact with ROBLOX.');
    let notification = new Notification({
      title: 'roPresence Loaded',
      body: 'Glad to see you, ' + robloxUser.robloxUsername + '!\nYour presence will be updated once you interact with ROBLOX.',
      icon: path.join(__dirname, 'img/yes.png')
    });
    notification.show();
    await logToFile('Presence API: Your Discord presence will now be updated every 15 seconds with the ' + robloxUser.robloxUsername + ' ROBLOX Account.\nIf you unverify, roPresence will stop showing the Discord Presence and ask you to verify yourself again.\n\nTo keep the Discord Presence, DO NOT close this window. You can close it when you will be done.');
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
        exitRoPresence();
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
  ]);
  tray.setToolTip("roPresence");
  tray.setContextMenu(contextMenu)
  }
}

async function getRoverUser() {
  const data = await Fetch('https://verify.eryn.io/api/user/' + RPC.user.id);
  return await data.json();
}

async function initSocket() {
  await logToFile('Socket Client: Starting.');

  let socket = io.connect('http://presences.jiveoff.fr/client/subSocket', {
    reconnect: true,
    query: {
      robloxId: robloxUser.robloxId,
      robloxUsername: robloxUser.robloxUsername
    }
  });

  socket.on('connect', () => {
    logToFile('Socket Client: Connected to socket, authenticating.')
  });

  socket.on('disconnect', () => {
    logToFile('Socket Client: Disconnected from socket, retrying to connect.')
  });

  socket.on('instanceReady', () => {
    logToFile('Socket Client: Authenticated to socket, ready.')
  });

  socket.on('serverMessage', (msg) => {
    logToFile('Remote Socket Server: ' + msg)
  });

  socket.on('setPresence', async (presence) => {
    await logToFile('Socket Client: Updating socket presence.. ');
    await RPC.setActivity(presence);
    socketPresence = true
  });

  socket.on('clearPresence', async () => {
    await logToFile('Socket Client: Clearing socket presence.. ');
    await setActivity();
    socketPresence = false
  })
}

async function robloxVerify() {
  const result = await getRoverUser();
  if (result.status === 'ok') {
    robloxUser = result;
    await setActivity()
  } else {
    if (busyRetrying) {
      return
    }
    busyRetrying = true;
    await RPC.clearActivity();

    await logToFile('roPresence Error: To use roPresence, please link your Discord account with verify.eryn.io');
    let notification = new Notification({
      title: 'roPresence Error',
      body: 'To use roPresence, please link your Discord account with verify.eryn.io\n\nClick this bubble to get there.',
      icon: path.join(__dirname, 'img/no.png'),
      timeoutType: "never"
    });
    notification.show();
    notification.onclick = () => {
      Open('https://verify.eryn.io/')
    };
    await logToFile('RoVer: API returned an error: ' + result.error);
    let count = 0;
    let retry = setInterval(async () => {
      const result = await getRoverUser();
      await logToFile('RoVer: Retrying..');
      if (result.status === 'ok') {
        loaded = false;
        await init();
        busyRetrying = false;
        clearInterval(retry)
      } else {
        if (count === 25) {
          await logToFile('roPresence Error: We couldn\'t find your ROBLOX account in time, roPresence has been stopped. Relaunch it to retry.');
          let notification = new Notification({
            title: 'roPresence Error',
            body: "We couldn't find your ROBLOX account in time, roPresence has been stopped.\nRelaunch it to retry!",
            icon: path.join(__dirname, 'img/no.png'),
            timeoutType: "never"
          });
          notification.show();
          await exitRoPresence()
        }
        count = count + 1
      }
    }, 3e3)
  }
}

async function init() {
  await robloxVerify();
  await initSocket();

  let busy = setInterval(() => {
    if (busyRetrying) {
      clearInterval(busy)
    } else {
      robloxVerify()
    }
  }, 15e3)
}

app.whenReady().then(async () => {
  tray = new Tray('./resources/app/img/roPresence-logo.png');
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
      click: async function() {
        await exitRoPresence();
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
  ]);
  tray.setToolTip("roPresence - Loading...");
  tray.setContextMenu(contextMenu);
  let notification = new Notification({
    title: 'roPresence',
    body: "Now loading, this may take some seconds.",
    timeoutType: "never",
    icon: path.join(__dirname, 'img/roPresence-logo.png'),
  });
  notification.show();

  await logToFile('RPC: Attempting to login through IPC.');
  RPC.on('ready', async () => {
    await logToFile('RPC: Logged in as ' + RPC.user.username + ' (' + RPC.user.id + ').');
    await init()
  });

  RPC.login({
    clientId
  }).catch(async (str) => {
    await logToFile(str);
    await logToFile('Failed to connect to Discord!');

    if (Config.attemptToOpenDiscordOnConnectionFailure === true && process.env.terminal !== '1') {
      await logToFile('Attempting to forcefully open Discord...');
      Open('Discord.exe', {
        wait: 'true'
      });

      setInterval(async () => {
        // Restart process and pass in a flag to give up after first attempt
        await logToFile('Restarting process with terminal flag...');

        process.exit(1) // Failure, ask master process to launch terminal process.
      }, Config.discordOpenedTimeout * 1000)
    } else {
      let notification = new Notification({
        title: 'roPresence Discord Error',
        body: "Failed to connect to Discord! Make sure that Discord has been launched and that you're logged in, then launch roPresence again.",
        timeoutType: "never",
        icon: path.join(__dirname, 'img/no.png'),
      });
      notification.onclick = () => {
        Open('Discord.exe')
      };
      notification.show();
      await logToFile("Make sure that Discord has been launched and that you're logged in, then launch roPresence again.");
      await logToFile('Exiting in 5 seconds...');
      setInterval(() => {
        process.exit()
      }, 5000)
    }
  })
});