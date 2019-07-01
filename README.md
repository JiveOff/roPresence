
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

## Prerequisites

- [**node.js**](https://nodejs.org/en/download/current/)
- [Being registered in verify.eryn.io](http://verify.eryn.io/) (roPresence will verify anyways ``¯\_(ツ)_/¯``)

## Installation (Windows)

- Download a release [**here**](https://github.com/JiveOff/roPresence/releases) and drag the content in a folder.
- Run the Install.bat
- **That's it!** You are done for the installation, you may head to the 

If you can't run the Install.bat file, do the following:

- Open a terminal in the folder, to do that, hold Control + Caps and Right Click in a blank space of the folder to open a Powershell terminal. 
- Once on the Terminal, run:
```bash
# Run this to install all of the dependencies of roPresence.
$ npm install
```

## Usage (Windows)

- Once roPresence is fully installed *(refer to the Installation part)*, just double click the **LaunchPresence.bat** and you're done, the Discord Rich Presence will show up! 

- *You can still use a terminal in the folder to launch roPresence:*
```bash
# Run this to launch roPresence.
$ npm start
```


## Frequently Asked Questions

This part can be updated anytime with the questions I will receive.

- Does it support MacOS and Linux?
Probably. Windows is better to me. :eyes:

- My game name is not shown, but I want to show it, what do I do?
You will have to update your Privacy settings just like the following:
<img src="https://raw.githubusercontent.com/JiveOff/roPresence/master/img/Privacy.png" alt="Privacy settings"/>
and then follow the [**roPresence_bot**](https://www.roblox.com/users/1143479593/profile) ROBLOX Account like the following:
<img src="https://raw.githubusercontent.com/JiveOff/roPresence/master/img/Following.png" alt="Following"/>
Tada! Your presence will show your current game/ROBLOX Studio project!

- roPresence is always asking me to follow their bacon hair account to show my game name, but I don't want that!! What do I do?
You can hide this tip by just opening the ``config.json`` file in an editor like Notepad or Notepad++ and turn off the ``showTips`` option by replacing ``true`` by ``false``.

- I'm having an error, where do I report it?
On our [issue page](https://github.com/JiveOff/roPresence/issues)!

- I want to contribute, how can I do so?
Just push a pull request and I will analyze it asap.

- Can I become friends with roPresence_bot?
No.

## License

This project is under the MIT license.
