const electronInstaller = require('electron-winstaller');
async function run() {
    try {
        await electronInstaller.createWindowsInstaller({
          appDirectory: './release-builds/ropresence-win32-x64/',
          outputDirectory: './release-builds/build/installer64',
          authors: 'JiveOff',
          exe: 'roPresence.exe'
        });
        console.log('It worked!');
      } catch (e) {
        console.log(`No dice: ${e.message}`);
      }
}
run()