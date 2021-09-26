import { MyStorage, storageManager } from "../common"

function q<T extends HTMLElement>(elementId: string): T {
    const el = document.getElementById(elementId)
    if (!el) { throw new TypeError(`[To Developer] The element id ${elementId} is not found`) }
    return el as T
}

function getSelectValue(id: string): string {
    return q<HTMLSelectElement>(id).value
}
function setSelectValue(id: string, value: string) {
    q<HTMLSelectElement>(id).value = value
}
function getRadioValue(radioGroupName: string): string {
    const radioList = document.querySelectorAll<HTMLInputElement>(`input[name="${radioGroupName}"]`)
    for (const radio of radioList) {
        if (radio.checked) {
            return radio.value
        }
    }
    return ''
}
function setRadioValue(radioGroupName: string, value: string) {
    const radioList = document.querySelectorAll<HTMLInputElement>(`input[name="${radioGroupName}"]`)
    for (const radio of radioList) {
        if (radio.value === value) {
            radio.checked = true
            return
        }
    }
}
function getTextAreaValue(id: string): string {
    return q<HTMLTextAreaElement>(id).value
}
function setTextAreaValue(id: string, value: string) {
    q<HTMLTextAreaElement>(id).value = value
}
function getCheckboxValue(id: string): boolean {
    return q<HTMLInputElement>(id).checked
}
function setCheckboxValue(id: string, checked: boolean) {
    q<HTMLInputElement>(id).checked = checked
}


async function loadFromLocalStorage() {
    const d = await storageManager.getData()
    setSelectValue('ulBulletChar', d.ulBulletChar)
    setSelectValue('olBulletChar', d.olBulletChar)
    setSelectValue('codeChar', d.codeChar)
    setRadioValue('codeBlockStyle', d.codeBlockStyle)
    setCheckboxValue('insertReferenceLink_enabled', d.insertReferenceLink.enabled)
    setSelectValue('insertReferenceLink_pos', d.insertReferenceLink.pos)
    setTextAreaValue('insertReferenceLink_format', d.insertReferenceLink.format)
}

async function resetToDefault() {
    storageManager.setData(storageManager.getDefaultData())
    await loadFromLocalStorage()
}
q<HTMLButtonElement>('resetBtn').onclick=resetToDefault

async function saveFormToLocalStorage() {
    storageManager.setData({
        ulBulletChar: getSelectValue('ulBulletChar') as any,
        olBulletChar: getSelectValue('olBulletChar') as any,
        codeChar: getSelectValue('codeChar') as any,
        codeBlockStyle: getRadioValue('codeBlockStyle') as any,
        insertReferenceLink: {
            enabled: getCheckboxValue('insertReferenceLink_enabled'),
            pos: getSelectValue('insertReferenceLink_pos') as any,
            format: getTextAreaValue('insertReferenceLink_format') as any,
        }
    })
}


function watchForm() {
    const form = document.querySelector('form')!
    form.addEventListener('change', (ev) => {
        console.log(ev)
        saveFormToLocalStorage()
    })
}

async function main() {
    await loadFromLocalStorage()
    watchForm()
}

main()