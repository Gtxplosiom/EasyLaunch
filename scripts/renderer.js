const { ipcRenderer } = require('electron')

// opening add item modal
const addBtn = document.getElementById("add-modal-btn")
if (addBtn) {
  addBtn.addEventListener("click", () => {
    ipcRenderer.send("open-add-modal")
  })
}

// closing modals
const closeBtn = document.getElementById("close-modal-btn")
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    ipcRenderer.send("close-modals")
  })
}

// adding items
const itemForm = document.getElementById("item-form")
if (itemForm) {
    itemForm.addEventListener("submit", (e) => {
        e.preventDefault()

        const itemName = document.getElementById("item-name").value
        const itemPath = document.getElementById("item-path").value
        const itemType = document.getElementById("item-type").value
        const condition = document.getElementById("conditions").value

        let openWithPath, launchScript = ''
        
        if (document.getElementById("open-with-path")) {
            openWithPath = document.getElementById("open-with-path").value
        }

        if (document.getElementById("launch-script")) {
            launchScript = document.getElementById("launch-script").value
        }

        ipcRenderer.send("add-item", {itemName, itemPath, itemType, condition, openWithPath, launchScript})
        ipcRenderer.send("close-modals")
        ipcRenderer.send("refresh")
        loadItemList()
    })
}

// populate index.html with items
function loadItemList() {
    ipcRenderer.invoke("get-items").then(rows => {

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

const container = document.getElementById('modal-inputs')
const currType = document.getElementById('item-type')
const currConditions = document.getElementById('conditions')

const typeExe = [
    { value: 'normal', text: 'Run normally' },
    { value: 'admin', text: 'Run as administrator' }
]

const typeOthers = [
    { value: 'application', text: 'Open with an application' },
    { value: 'script', text: 'Custom script' }
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

function addNewInput(condition) {

    const existing = document.getElementById('new-input')
    if (existing) existing.remove()

    const newRow = document.createElement('div')
    newRow.classList.add('modal-input')
    newRow.id = 'new-input'

    if (condition === 'application') {
        const fileInput = document.createElement('input')
        fileInput.type = 'file'
        fileInput.id = 'open-with-path'

        newRow.appendChild(fileInput)
    } else if (condition === 'script') {
        const textInput = document.createElement('input')
        textInput.type = 'text'
        textInput.id = 'launch-script'
        textInput.placeholder = "Input custom script here..."

        newRow.appendChild(textInput)
    }

    container.appendChild(newRow)
}

if (currConditions) {

    currConditions.addEventListener('change', () => {

        const value = currConditions.value

        if (value === 'application' || value === 'script') {
            addNewInput(value)
        } else {
            const existing = document.getElementById('new-input')
            if (existing) existing.remove()
        }
    })

}

if (currType) {
    currType.addEventListener('change', () => {

        const existing = document.getElementById('new-input')
        if (existing) existing.remove()

        if (currType.value === 'executable') {
            populateConditions(typeExe)
        } else {
            populateConditions(typeOthers)
        }

        currConditions.dispatchEvent(new Event('change'))
    })

    populateConditions(typeExe)
}
