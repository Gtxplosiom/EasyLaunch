const {app, BrowserWindow, ipcMain, Tray, Menu} = require('electron')
const path = require("node:path")
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'local.sqlite')

app.whenReady().then(() => {
    let db = new sqlite3.Database(dbPath, (err) => {
        if(err) console.error(err.message)
        console.log('Connected to local database')
    })

    let itemList

    db.serialize(() => {

        db.run(`
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_name TEXT NOT NULL,
                path TEXT NOT NULL,
                type TEXT DEFAULT 'executable',
                condition TEXT DEFAULT 'default',
                open_with_path TEXT NULL,
                launch_script TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) return console.error(err.message)
            console.log("Items table ready")
        })

        loadItemList()
    })

    function loadItemList() {
        db.all("SELECT * FROM items", [], (err, rows) => {

            if (err) {
                console.error(err.message)
                return
            }

            // TODO: add click function
            let items = rows.map(row => ({
                label: row.item_name
            }))

            itemList = Menu.buildFromTemplate(items)
        })
    }

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

    window.setMenuBarVisibility(false)

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

    tray.on("click", () => {
        tray.popUpContextMenu(itemList)
    })

    tray.on("right-click", () => {
        tray.popUpContextMenu(contextMenu)
    })
    
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

    ipcMain.on("add-item", (event, data) => {

        db.run(
            "INSERT INTO items (item_name, path, type, condition, open_with_path, launch_script) VALUES (?, ?, ?, ?, ?, ?)",
            [data.itemName, data.itemPath, data.itemType, data.condition, data.openWithPath, data.launchScript],
            function(err) {
                if (err) {
                    return console.error(err.message)
                }

                console.log("inserted row")
            }
        )
    })

    ipcMain.on("close-modals", () => {
        if (addWindow && addWindow.isVisible()) {
            addWindow.close()
        }

        if (editWindow && editWindow.isVisible()) {
            editWindow.close()
        }
    })

    ipcMain.on("refresh", () => {
        loadItemList()
        window.reload()
    })

    ipcMain.handle("get-items", async () => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM items", [], (err, rows) => {
                if (err) reject(err)
                else resolve(rows)
            })
        })
    })
})
