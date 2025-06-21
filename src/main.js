const { app, BrowserWindow } = require('electron');
const path = require('node:path');

// stagehand
const { ipcMain } = require('electron');
const { Stagehand } = require('@browserbasehq/stagehand');

ipcMain.handle('run-agent', async (event) => {
    const agent = new Stagehand({
        env: 'LOCAL',
        modelName: 'google/gemini-2.0-flash',
        modelClientOptions: {
            apiKey: process.env.GOOGLE_API_KEY,
        },
         browser: {
            provider: "local", // ✅ Use local Playwright/Chromium browser
        },
    });
    await agent.init();
    return 'agent started';
//   const stagehand = new Stagehand({
//     env: 'LOCAL',
//     modelName: 'google/gemini-2.0-flash',
//     modelClientOptions: {
//       apiKey: process.env.GOOGLE_API_KEY,
//     },
//   });

//   await stagehand.init();

//   const page = stagehand.page;

//   await page.goto('https://www.google.com');
//   await page.act("Type in 'Browserbase' into the search bar");

//   const { title } = await page.extract({
//     instruction: 'The title of the first search result',
//     schema: {
//       title: String,
//     },
//   });

//   await stagehand.close();

//   return title;
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
//   mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
