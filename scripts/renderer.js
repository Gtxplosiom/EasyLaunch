const container = document.getElementById('modal-inputs')
const currType = document.getElementById('item-type')
const currConditions = document.getElementById('conditions')
const closeBtn = document.getElementById("close-modal-btn")
const itemPathBtn = document.getElementById("item-path-btn")
const itemPathLabel = document.getElementById("item-path-label")
const addBtn = document.getElementById("add-modal-btn")

// opening add item modal
if (addBtn) {
    addBtn.addEventListener("click", () => {
        window.electronAPI.send("open-add-modal")
    })
}

// closing modals
if (closeBtn) {
    closeBtn.addEventListener("click", () => {
        window.electronAPI.send("close-modals")
    })
}

// item path picker
if (itemPathBtn) {
    setupFilePicker(itemPathBtn, itemPathLabel)
}

// adding items to db
const itemForm = document.getElementById("item-form")
if (itemForm) {
    itemForm.addEventListener("submit", (e) => {
        e.preventDefault()

        const itemName = document.getElementById("item-name").value
        const itemPath = document.getElementById("item-path-label").textContent
        const itemType = document.getElementById("item-type").value
        const condition = document.getElementById("conditions").value

        let openWithPath, url, launchScript = ''
        
        if (document.getElementById("open-with-path-label")) {
            openWithPath = document.getElementById("open-with-path-label").textContent
        }

        if (document.getElementById("url-text")) {
            url = document.getElementById("url-text").value
        }

        if (document.getElementById("launch-script")) {
            launchScript = document.getElementById("script-text").textContent
        }

        window.electronAPI.send("add-item", {itemName, itemPath, itemType, condition, openWithPath, url, launchScript})
        window.electronAPI.send("close-modals")
        window.electronAPI.send("refresh")
        loadItemList()
    })
}

// populate index.html with items
function loadItemList() {
    window.electronAPI.invoke("get-items").then(rows => {

        const container = document.getElementById("item-list-area")
        container.innerHTML = ""

        rows.forEach(row => {
            const div = document.createElement("div")
            div.classList.add("item")
            div.textContent = row.item_name

            div.addEventListener("click", () => {
                console.log("Clicked item:", row.item_name)
                ipcRenderer.send("launch-item", row.id)
            })

            container.appendChild(div)
        })

    }).catch(err => console.error(err))
}
loadItemList()

// Conditions
const typeExe = [
    { value: 'normal', text: 'Run normally' },
    { value: 'admin', text: 'Run as administrator' }
]

const typeOthers = [
    { value: 'application', text: 'Open with an application' }
]

const scriptTypes = [
    { value: 'bat', text: 'Windows Batch Script (.bat)' },
    { value: 'ps1', text: 'PowerShell Script (.ps1)' },
    { value: 'cmd', text: 'Windows Command Script (.cmd)' },
    { value: 'py', text: 'Python Script (.py)' },
    { value: 'sh', text: 'Shell Script (.sh)' },
    { value: 'node', text: 'Node.js Script (.js)' },
    { value: 'custom', text: 'Custom Command' }
]

// TODO: add more
const romTypes = [
    { value: 'ps2', text: 'PlayStation 2' },
    { value: 'psp', text: 'PlayStation Portable' }
]

function populateConditions(options) {
    currConditions.innerHTML = ''

    options.forEach(opt => {
        const optionElement = document.createElement('option')
        optionElement.value = opt.value
        optionElement.text = opt.text
        currConditions.appendChild(optionElement)
    })
}

// function to setup file picker with a button and label
function setupFilePicker(btn, label) {
    if (btn) {
        btn.addEventListener("click", async () => {
            const pathResult = await window.electronAPI.openFile()
            if (pathResult) {
                label.textContent = pathResult
            } else {
                label.textContent = '...'
            }
        })
    }
}

// input "fabricator"s
// for when type change
// TODO: clean this ahh
function addNewInput(value) {
    const existing = document.getElementById('new-input')
    if (existing) existing.remove()

    const newInputDiv = setupNewInputDiv()

    switch (value) {
        // TODO: clean this ahh
        case 'rom':
            addFilePicker('Emulator Path:', newInputDiv)
            break

        case 'custom-script':
            const textArea = document.createElement('textarea')
            textArea.id = 'launch-script'

            newInputDiv.appendChild(textArea)
            break
        
        case 'url':
            const urlTitle = document.createElement('label')
            urlTitle.innerHTML = 'URL:'

            const textField = document.createElement('input')
            textField.type = 'text'
            textField.id = 'url-text'

            newInputDiv.appendChild(urlTitle)
            newInputDiv.appendChild(textField)
            break

        case 'others':
            addFilePicker('Open With:', newInputDiv)
            break
    }

    if (newInputDiv) container.appendChild(newInputDiv)
}

// for when conditions change
function addNewInputToo(value) {
    const existing = document.getElementById('new-input')
    if (existing) existing.remove()

    const newInputDiv = setupNewInputDiv()

    if (value === 'application') {
        addFilePicker('Open With:', newInputDiv)
    } else if (value === 'ps2' || value === 'psp') {
        addFilePicker('Emulator Path:', newInputDiv)
    }

    if (newInputDiv) container.appendChild(newInputDiv)
}

function setupNewInputDiv() {
    const newInputDiv = document.createElement('div')
    newInputDiv.classList.add('modal-input')
    newInputDiv.id = 'new-input'
    return newInputDiv
}

function addFilePicker(labelText, newInputDiv) {
    const openWithPathDiv = document.createElement('div')
    openWithPathDiv.id = "open-with-path-container"

    const openWithPathTitle = document.createElement('span')
    openWithPathTitle.innerHTML = labelText

    const openWithPathBtn = document.createElement('button')
    openWithPathBtn.classList.add('item-path-btn')
    openWithPathBtn.type = 'button'
    openWithPathBtn.id = 'open-with-path-btn'

    const openWithPathLabel = document.createElement('label')
    openWithPathLabel.id = 'open-with-path-label'
    openWithPathLabel.textContent = '...'

    setupFilePicker(openWithPathBtn, openWithPathLabel)

    openWithPathDiv.appendChild(openWithPathTitle)
    openWithPathDiv.appendChild(openWithPathBtn)
    openWithPathDiv.appendChild(openWithPathLabel)

    newInputDiv.appendChild(openWithPathDiv)
}

// INPUT STATE CHECKERS
// conditions field state checker
if (currConditions) {
    currConditions.addEventListener('change', () => {
        addNewInputToo(currConditions.value)
    })

}

function elementVisibilityHandler(element, visibility) {
    document.getElementById(element).style.display = visibility
}

// type field state checker
if (currType) {
    currType.addEventListener('change', () => {

        const existing = document.getElementById('new-input')
        if (existing) existing.remove()

        addNewInput(currType.value)

        elementVisibilityHandler('item-path-div' ,'block')
        elementVisibilityHandler('conditions-div' ,'block')

        switch (currType.value) {
            case 'executable':
                populateConditions(typeExe)
                break

            case 'rom':
                populateConditions(romTypes)
                break
            
            case 'custom-script':
                elementVisibilityHandler('item-path-div' ,'none')

                addNewInput(currType.value)

                populateConditions(scriptTypes)
                break

            case 'url':
                elementVisibilityHandler('item-path-div' ,'none')
                elementVisibilityHandler('conditions-div' ,'none')

                addNewInput(currType.value)
                break

            case 'others':
                populateConditions(typeOthers)
                break
        }
    })

    populateConditions(typeExe)
}

// TODO: fix bug where when changing conditions it mess up with the newly(programatically) added inputs
