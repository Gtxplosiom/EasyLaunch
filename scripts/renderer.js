const { ipcRenderer } = require('electron')

const addBtn = document.getElementById("add-modal-btn");
if (addBtn) {
  addBtn.addEventListener("click", () => {
    ipcRenderer.send("open-add-modal");
  });
}

const closeBtn = document.getElementById("close-modal-btn");
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    ipcRenderer.send("close-modals");
  });
}

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
        fileInput.id = 'app-path'

        newRow.appendChild(fileInput)
    } else if (condition === 'script') {
        const textInput = document.createElement('input')
        textInput.type = 'text'
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
