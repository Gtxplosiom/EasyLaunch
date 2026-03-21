const { app, dialog, BrowserWindow, ipcMain, Tray, Menu } = require('electron')
const { exec } = require("child_process")
const path = require("node:path")
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'local.sqlite')

app.whenReady().then(() => {
    let itemList, addWindow, editWindow

    let db = new sqlite3.Database(dbPath, (err) => {
        if(err) console.error(err.message)
        console.log('Connected to local database')
    })

    // db initializer
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_name TEXT NULL,
                type TEXT DEFAULT 'executable',
                path TEXT NULL,
                condition TEXT DEFAULT 'normal',
                open_with_path TEXT NULL,
                url TEXT NULL,
                launch_script TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) return console.error(err.message)
            console.log("Items table ready")
        })

        loadItemList()
    })

    // tray item "loader"
    function loadItemList() {
        db.all("SELECT * FROM items", [], (err, rows) => {

            if (err) {
                console.error(err.message)
                return
            }

            let items = rows.map(row => ({
                id: row.id.toString(),
                label: row.item_name,
                click: () => {
                    switch (row.type) {
                        case 'executable':
                            launchItem(row.type, row.condition, row.path)
                            break
                        case 'rom':
                        case 'others':
                            launchItem(row.type, row.condition, row.path, row.open_with_path)
                            break
                        case 'url':
                            launchItem(row.type, row.condition, row.url)
                            break
                    }
                }
            }))

            itemList = Menu.buildFromTemplate(items)
        })
    }

    // TODO add custom-script, url
    // item mapper, new learningszxczszxczs, very cool
    // add error handlers
    const itemHandler = {
        executable: {
            normal: (path) => exec(`powershell -Command "Start-Process '${path}'"`),
            admin: (path) => exec(`powershell -Command "Start-Process '${path}' -Verb RunAs"`)
        },
        rom: {
            ps2: (path, openWithPath) => exec(`"${openWithPath}" "${path}" -fullscreen`),
            psp: (path, openWithPath) => exec(`"${openWithPath}" --fullscreen "${path}"`),
        },
        url: {
            normal: (urlText) => exec(`start "" "${urlText}"`)
        },
        others: {
            application: (path, openWithPath) => exec(`"${openWithPath}" "${path}"`)
        }
    }

    // item launcher
    function launchItem(type, condition, ...args) {
        itemHandler[type]?.[condition]?.(...args); 
    }

    const window = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        },

        width: 640,
        height: 480,

        resizable: false,

        show: false
    })

    window.setMenuBarVisibility(false)

    const iconPath = path.join(__dirname, "assets/launch.ico")
    const tray = new Tray(iconPath)

    // tray stuff
    tray.setToolTip("EasyLaunch")

    tray.on("click", () => {
        tray.popUpContextMenu(itemList)
    })

    tray.on("right-click", () => {
        tray.popUpContextMenu(contextMenu)
    })

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
    
    window.loadFile("index.html")

    // IPC Stuff
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
                    preload: path.join(__dirname, "preload.js"),
                    contextIsolation: true,
                    nodeIntegration: false
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
            "INSERT INTO items (item_name, path, type, condition, open_with_path, url, launch_script) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [data.itemName, data.itemPath, data.itemType, data.condition, data.openWithPath, data.url, data.launchScript],
            function(err) {
                if (err) {
                    return console.error(err.message)
                }

                console.log("inserted row")
            }
        )
    })

    ipcMain.on("delete-item", (event, id) => {
        db.run(
            "DELETE FROM items WHERE id = ?",
            [id],
            function (err) {
                if (err) {
                    console.error(err.message);
                    return;
                }

                console.log("Deleted item with ID:", id);
            }
        );
    });

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
    
    ipcMain.handle('dialog:openFile', async () => {
        const win = BrowserWindow.getFocusedWindow()
        const result = await dialog.showOpenDialog(win, { properties: ['openFile'] })
        if (!result.canceled) return result.filePaths[0]
        return null
    })
})
