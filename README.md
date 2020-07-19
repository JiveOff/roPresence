
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

## Frequently Asked Questions

This part can be updated anytime with the questions I will receive.

- **My presence is not showing!** Check if your game is showing on your Discord preferences:
<img src="https://i.jiveoff.fr/Tbl4e.png" alt="Discord Settings"/>

- **Does it support MacOS and Linux?**
No. Only Windows is supported.

- **I'm having an error, where do I report it?**
On our [issue page](https://github.com/JiveOff/roPresence/issues)!

- **I want to contribute, how can I do so?**
Just push a pull request and I will analyze it asap.

- **Why does my Rich Presence take so long to update?**
Discord has a 15 seconds limit between Rich Presences updates.

## Prerequisites (Development purposes only)

- [**node.js**](https://nodejs.org/en/download/current/)
- [**Discord Desktop App**](https://discordapp.com/download)
- [Being registered in verify.eryn.io](http://verify.eryn.io/) (roPresence will verify anyways ``¯\_(ツ)_/¯``)

## Installation (Development purposes only)

- Install [**node.js**](https://nodejs.org/en/download/current/)
- Download a release [**here**](https://github.com/JiveOff/roPresence/releases) and **unzip** the content in a folder.
- Open a terminal in the folder, to do that, hold Control + Caps and Right Click in a blank space of the folder to open a Powershell terminal. 
- Once on the Terminal, run:
```bash
# Run this to install all of the dependencies of roPresence.
$ npm install
```
- **That's it!** You are done for the installation, you may head to the Usage section.

## Usage (Development purposes only)

- Once roPresence is fully installed *(refer to the Installation part)*, just open the **Other_Presence.sh** file and you're done, the Discord Rich Presence will show up! 

- *You can still use a terminal in the folder to launch roPresence:*
```bash
# Run this to launch roPresence.
$ npm start
```

- To stop roPresence, just close the terminal. If you launched it in the background, click [**here**](http://127.0.0.1:3000/killRoPresence) or browse to http://127.0.0.1:3000/killRoPresence

## License

This project is under the MIT license. [See the LICENSE file](https://github.com/JiveOff/roPresence/blob/master/LICENSE) for more details.
