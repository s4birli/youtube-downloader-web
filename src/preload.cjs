const { contextBridge, ipcRenderer } = require('electron');

// Expose API to window object
contextBridge.exposeInMainWorld('api', {
    // You can add functions here to communicate with the main process
    // Example: invoke main process functions using ipcRenderer
}); 