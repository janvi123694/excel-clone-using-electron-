
const electron = require('electron');
const app = electron.app; 
const BrowserWindow = electron.BrowserWindow;
const ejse = require('ejs-electron'); 

function createWindow(){

    const win = new BrowserWindow({
        width: 800, 
        height:600,
        webPreferences : {
            nodeIntegration : true 
        }
    });
    
    win.loadFile('index.ejs').then(function(){
        win.maximize()   // opens the pg full size 
    })
    win.webContents.openDevTools() // opens dev tools by default 

}

app.whenReady().then(createWindow); // app.whenReady() gives a pending promise. on success cb-> call createWindow()