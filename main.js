const electron = require('electron');
const url = require('url');
const path = require('path');

const {Menu, app, BrowserWindow} = electron;

let mainWindow;

async function log (workingDir) {
    const git = require('simple-git/promise');
    
    let statusSummary = null;
    try {
       statusSummary = await git(workingDir).log();
    }
    catch (e) {
       // handle the error
    }
    
    return statusSummary;
 }

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
                label: 'Log',
                click() {
                    log(__dirname).then(status => console.log(status));
               
                }
            }
        ]
    }
];
