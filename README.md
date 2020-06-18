
<h1 align="center">
    <img src="https://raw.githubusercontent.com/JiveOff/roPresence/master/img/roPresence.png" alt="roPresence" width="250"/>
    <br>
</h1>

<h4 align="center">A <a href="https://discordapp.com">Discord</a> Rich Presence for <a href="https://roblox.com">ROBLOX</a>.</h4>

<p align="center">
    <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-blue.svg?style=flat-square" alt="JavaScript Style Guide"/></a>
    <a href="https://travis-ci.org/JiveOff/roPresence"><img src="https://img.shields.io/travis/JiveOff/roPresence/master.svg?style=flat-square" alt="Travis Build Status"/></a>
</p>

roPresence is a Node.js program that allows you to show your current ROBLOX status with a Discord Rich Presence, that hooks up with [verify.eryn.io](http://verify.eryn.io/) to get your ROBLOX user with your Discord ID.

This integration shows 3 different states: Browsing, Playing, Creating.
The browsing one shows up if you are browsing the ROBLOX Website, the playing one shows up if you are playing a game on ROBLOX *(you will maybe need to update your privacy settings if needed to show the game details. Everything is explained below)* and the creating one if you are building on ROBLOX Studio, it also shows the name of your current project.

## NEW!

**You can now use roPresence without installing anything, just download the binary file in the release section!**
https://github.com/JiveOff/roPresence/releases

Everything under the prerequisites category is here if you want to use the source code instead of the binaries.
An installation video for Windows is out: https://www.youtube.com/watch?v=DrBC7BdlyO4

## Frequently Asked Questions

This part can be updated anytime with the questions I will receive.

- **My presence is not showing!** Check if your game is showing on your Discord preferences:
<img src="https://i.jiveoff.fr/Tbl4e.png" alt="Discord Settings"/>

- **My game name is not shown, but I want to show it, what do I do?** Check below.

- **Does it support MacOS and Linux?**
Probably. Windows is better to me. :eyes:

- **roPresence is always asking me to follow their bacon hair account to show my game name, but I don't want that!! What do I do?**
You can hide this tip by just opening the ``config.json`` file in an editor like Notepad or Notepad++ and turn off the ``showTips`` option by replacing ``true`` by ``false``.

- **I'm having an error, where do I report it?**
On our [issue page](https://github.com/JiveOff/roPresence/issues)!

- **I want to contribute, how can I do so?**
Just push a pull request and I will analyze it asap.

- **Why do you use an external API?**
The ROBLOX Presences API endpoint requires an user and I prefer to not mess with the .ROBLOSECURITY cookies in the client.

- **Why does my Rich Presence take so long to update?**
Discord has a 15 seconds limit between Rich Presences updates.

- **Why does roPresence crash because of an API error?**
The remote API is maybe down or restarted for an update, relaunch roPresence to see if it was a simple restart.

- **Can I become friends with roPresence_bot?**
No.

## Making the game name show

You will have to update your Privacy settings to make it public or just like the following:

<img src="https://raw.githubusercontent.com/JiveOff/roPresence/master/img/Privacy.png" alt="Privacy settings"/>

and then follow the roPresence ROBLOX Account (https://www.roblox.com/users/1143479593/profile) like the following:

<img src="https://raw.githubusercontent.com/JiveOff/roPresence/master/img/Following.png" alt="Following"/>

Tada! Your presence will show your current game/ROBLOX Studio project!

## Prerequisites

- [**node.js**](https://nodejs.org/en/download/current/)
- [**Discord Desktop App**](https://discordapp.com/download)
- [Being registered in verify.eryn.io](http://verify.eryn.io/) (roPresence will verify anyways ``¯\_(ツ)_/¯``)

## Installation (Windows)

- Installation Video: https://www.youtube.com/watch?v=DrBC7BdlyO4

- Install [**node.js**](https://nodejs.org/en/download/current/)
- Download a release [**here**](https://github.com/JiveOff/roPresence/releases) and **unzip** the content in a folder.
- Run the Windows_Install.bat
- **That's it!** You are done for the installation, you may head to the Usage section.

If you can't run the Windows_Install.bat file, do the following:

- Open a terminal in the folder, to do that, hold Control + Caps and Right Click in a blank space of the folder to open a Powershell terminal. 
- Once on the Terminal, run:
```bash
# Run this to install all of the dependencies of roPresence.
$ npm install
```

## Installation (Other)

- Install [**node.js**](https://nodejs.org/en/download/current/)
- Download a release [**here**](https://github.com/JiveOff/roPresence/releases) and **unzip** the content in a folder.
- Run the Other_Install.sh
- **That's it!** You are done for the installation, you may head to the Usage section.

If you can't run the Other_Install.sh file, do the following:

- Open a terminal in the folder, to do that, hold Control + Caps and Right Click in a blank space of the folder to open a Powershell terminal. 
- Once on the Terminal, run:
```bash
# Run this to install all of the dependencies of roPresence.
$ npm install
```

## Usage (Windows)

- Once roPresence is fully installed *(refer to the Installation part)*, just open the **Windows_Presence.bat** file and you're done, the Discord Rich Presence will show up! 

- You can also launch roPresence in the background by opening the **Windows_BackgroundPresence.vbs** file.

- *You can still use a terminal in the folder to launch roPresence:*
```bash
# Run this to launch roPresence.
$ npm start
```

- To stop roPresence, just close the terminal. If you launched it in the background, click [**here**](http://127.0.0.1:3000/killRoPresence) or browse to http://127.0.0.1:3000/killRoPresence

## Usage (Other)

- Once roPresence is fully installed *(refer to the Installation part)*, just open the **Other_Presence.sh** file and you're done, the Discord Rich Presence will show up! 

- *You can still use a terminal in the folder to launch roPresence:*
```bash
# Run this to launch roPresence.
$ npm start
```

- To stop roPresence, just close the terminal. If you launched it in the background, click [**here**](http://127.0.0.1:3000/killRoPresence) or browse to http://127.0.0.1:3000/killRoPresence

## License

This project is under the MIT license.
