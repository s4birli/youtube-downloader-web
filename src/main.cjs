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
    let pythonPath;

    if (isDev) {
        scriptPath = path.join(__dirname, '../python/app.py');
        // Use the virtual environment's Python interpreter
        if (process.platform === 'win32') {
            pythonPath = path.join(__dirname, '../venv/Scripts/python.exe');
        } else {
            pythonPath = path.join(__dirname, '../venv/bin/python');
        }
    } else {
        scriptPath = path.join(process.resourcesPath, 'python/app.py');
        // In production, we'll bundle the virtual environment
        if (process.platform === 'win32') {
            pythonPath = path.join(process.resourcesPath, 'venv/Scripts/python.exe');
        } else {
            pythonPath = path.join(process.resourcesPath, 'venv/bin/python');
        }
    }

    // Make the script executable
    try {
        fs.chmodSync(scriptPath, '755');
    } catch (err) {
        console.error('Failed to make script executable:', err);
    }

    // Check if the virtual environment's Python interpreter exists
    if (!fs.existsSync(pythonPath)) {
        console.error(`Python interpreter not found at ${pythonPath}`);
        console.log('Falling back to system Python');

        // Fall back to system Python
        if (process.platform === 'win32') {
            pythonPath = 'python';
        } else {
            pythonPath = 'python3';
        }
    }

    // Get the absolute path to the Python executable
    console.log(`Starting Python server with ${pythonPath} ${scriptPath}`);

    // Set environment variables for the Python process
    const env = { ...process.env };
    env.FLASK_ENV = isDev ? 'development' : 'production';
    env.PYTHONUNBUFFERED = '1'; // Ensure Python output is not buffered

    // Start the Python process with the environment variables
    pythonProcess = spawn(pythonPath, [scriptPath], { env });

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        if (code !== 0) {
            console.error('Python process crashed. Attempting to restart...');
            setTimeout(() => {
                startPythonServer();
            }, 1000);
        }
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