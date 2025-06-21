const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;

function createMainWindow() {
    // Create the main browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load the index.html file
    mainWindow.loadFile('index.html');

    // Open the DevTools in development (optional)
    // mainWindow.webContents.openDevTools();
}

// IPC handlers for communication with renderer
ipcMain.handle('start-stagehand-youtube', async (event, userQuery) => {
    try {
        console.log('Starting Stagehand automation with user query:', userQuery);
        mainWindow.webContents.send('stagehand-status', `Starting AI automation for: ${userQuery}`);
        const stagehandProcess = spawn('npm', ['start'], {
            cwd: path.join(__dirname, 'stagehand-browser'),
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                USER_QUERY: userQuery
            }
        });

        let output = '';
        let errorOutput = '';

        // Capture stdout
        stagehandProcess.stdout.on('data', (data) => {
            const message = data.toString();
            output += message;
            console.log('Stagehand output:', message);
            
            // Send output to renderer
            mainWindow.webContents.send('stagehand-output', {
                type: 'log',
                message: message
            });
        });

        // Capture stderr
        stagehandProcess.stderr.on('data', (data) => {
            const message = data.toString();
            errorOutput += message;
            console.error('Stagehand error:', message);
            
            // Send error to renderer
            mainWindow.webContents.send('stagehand-output', {
                type: 'error',
                message: message
            });
        });

        // Handle process completion
        return new Promise((resolve, reject) => {
            stagehandProcess.on('close', (code) => {
                console.log(`Stagehand process exited with code ${code}`);
                
                if (code === 0) {
                    mainWindow.webContents.send('stagehand-status', 'Stagehand YouTube automation completed successfully!');
                    resolve({
                        success: true,
                        output: output,
                        error: errorOutput
                    });
                } else {
                    mainWindow.webContents.send('stagehand-status', `Stagehand process exited with code ${code}`);
                    reject(new Error(`Stagehand process exited with code ${code}`));
                }
            });

            stagehandProcess.on('error', (error) => {
                console.error('Failed to start Stagehand process:', error);
                mainWindow.webContents.send('stagehand-status', `Failed to start Stagehand: ${error.message}`);
                reject(error);
            });
        });

    } catch (error) {
        console.error('Error running Stagehand:', error);
        mainWindow.webContents.send('stagehand-status', `Error: ${error.message}`);
        throw error;
    }
});

ipcMain.handle('check-stagehand-status', async () => {
    try {
        // Check if the stagehand-browser directory exists and has the necessary files
        const fs = require('fs');
        const stagehandPath = path.join(__dirname, 'stagehand-browser');
        const packageJsonPath = path.join(stagehandPath, 'package.json');
        
        if (fs.existsSync(stagehandPath) && fs.existsSync(packageJsonPath)) {
            return { 
                available: true, 
                message: 'Stagehand browser app is ready' 
            };
        } else {
            return { 
                available: false, 
                message: 'Stagehand browser app not found' 
            };
        }
    } catch (error) {
        return { 
            available: false, 
            message: `Error checking Stagehand: ${error.message}` 
        };
    }
});

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});