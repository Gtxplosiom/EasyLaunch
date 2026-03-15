const {app, BrowserWindow, ipcMain, Tray, Menu} = require('electron')
const path = require("node:path")
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'local.sqlite')

app.whenReady().then(() => {
    let db = new sqlite3.Database(dbPath, (err) => {
        if(err) console.error(err.message)
        console.log('Connected to local database')
    })

    db.run(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            type TEXT DEFAULT 'executable',
            condition TEXT DEFAULT 'default',
            open_with_path TEXT NULL,
            launch_script TEXT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        `, (err) => {
        if (err) return console.error('Table creation error:', err.message)
        console.log('Users table ready.')
    });

    const window = new BrowserWindow({
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        },

        width: 640,
        height: 480,
        minWidth: 640,
        minHeight: 480,

        show: false
    })

    let addWindow, editWindow

    const iconPath = path.join(__dirname, "assets/launch.ico")
    const tray = new Tray(iconPath)
    tray.setToolTip("EasyLaunch")

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Configure Application",
            click: () => {
                if(window.isVisible()) {
                    window.hide()
                } else {
                    window.show()
                }
            }
        },
        {
            label: "Exit Application",
            click: () => app.quit()
        }
    ])

    const appMenu = Menu.buildFromTemplate([
        {label: "App 1"},
        {label: "App 2"},
        {label: "App 3"}
    ])

    tray.on("click", () => {
        tray.popUpContextMenu(appMenu)
    })

    tray.on("right-click", () => {
        tray.popUpContextMenu(contextMenu)
    })

    window.setMenuBarVisibility(false)
    
    window.loadFile("index.html")

    ipcMain.on("open-add-modal", () => {
        if (addWindow && addWindow.isVisible()) {
            addWindow.focus();
        } else {
            addWindow = new BrowserWindow({
                frame: false,
                width: 400,
                height: 300,
                modal: true,
                parent: BrowserWindow.getFocusedWindow(),
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            });

            addWindow.loadFile('modals/add-modal.html');

            addWindow.on('closed', () => {
            addWindow = null;
            });
        }
    })

    ipcMain.on("close-modals", () => {
        if (addWindow && addWindow.isVisible()) {
            addWindow.close()
        }

        if (editWindow && editWindow.isVisible()) {
            editWindow.close()
        }
    })
})
