const electron = require('electron');
const url = require('url');
const path = require('path');
const Parser = require('./parser.js');
const {Menu, app, BrowserWindow} = electron;

let mainWindow;
const parse = new Parser();

//Listen for app
app.on('ready', function() {
    //create window
    mainWindow = new BrowserWindow({});
    //load HTML
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'main.html'),
        protocol: 'file',
        slashes: true
    }));

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
});

//create menu template
const mainMenuTemplate = [
    {
        label: 'gView', 
        submenu: [
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+W' : "Ctrl+W",
                click() {
                    app.quit();
                }
            },
            {
                label: "log",
                click(){
                    parse.buildNodes();
                }
            }
        ]
    }
];
