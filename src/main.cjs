const { app, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let pythonProcess;

// Start Python server
function startPythonServer() {
    let scriptPath;
    if (isDev) {
        scriptPath = path.join(__dirname, '../python/app.py');
    } else {
        scriptPath = path.join(process.resourcesPath, 'python/app.py');
    }

    let pythonPath;
    if (process.platform === 'win32') {
        pythonPath = 'python'; // 'python' command for Windows
    } else {
        pythonPath = 'python3'; // 'python3' command for macOS and Linux
    }

    pythonProcess = spawn(pythonPath, [scriptPath]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });

    // Load React app
    if (isDev) {
        mainWindow.loadURL('http://localhost:3001'); // Development mode
        mainWindow.webContents.openDevTools(); // Open DevTools
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html')); // Production mode
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
        // Terminate Python process
        if (pythonProcess) {
            pythonProcess.kill();
        }
    });
}

// App startup
app.whenReady().then(() => {
    startPythonServer(); // Start Python server
    setTimeout(createWindow, 1000); // Wait a bit for Python server to start
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Cleanup when app closes
app.on('quit', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
}); 