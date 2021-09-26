import { storageManager } from "../common"

console.log('options_ui.ts loaded!')

async function loadFromLocalStorage() {
    const d = await storageManager.getData()
}

async function saveFormToLocalStorage() {

}
function watchForm() {
    const form = document.querySelector('form')!
    form.addEventListener('change', (ev) => {
        console.log(ev)
        saveFormToLocalStorage()
    })
}

async function main() {
    watchForm()
}

main()