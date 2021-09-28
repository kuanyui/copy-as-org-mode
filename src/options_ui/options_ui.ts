/**
 * Copyright (c) 2021 ono ono (kuanyui)
 * All rights reserved.
 *
 * This project is released under  Mozilla Public License, v. 2.0 (MPL-2.0). Each
 * file under this directory is licensed under MPL-2.0 by default, if the file
 * includes no license information.
 *
 * If a copy of the MPL was not distributed with this file, You can obtain one at
 * https://mozilla.org/MPL/2.0/.
 *
 * You may not remove or alter the substance of any license notices (including
 * copyright notices, patent notices, disclaimers of warranty, or limitations of
 * liability) contained within the Source Code Form of the Covered Software, except
 * that You may alter any license notices to the extent required to remedy known
 * factual inaccuracies. (Cited from MPL - 2.0, chapter 3.3)
 */


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
    setSelectValue('listIndentSize', d.listIndentSize + '')
    setSelectValue('ulBulletChar', d.ulBulletChar)
    setSelectValue('olBulletChar', d.olBulletChar)
    setSelectValue('codeChar', d.codeChar)
    setRadioValue('codeBlockStyle', d.codeBlockStyle)
    setCheckboxValue('insertReferenceLink_enabled', d.insertReferenceLink.enabled)
    setSelectValue('insertReferenceLink_pos', d.insertReferenceLink.pos)
    setTextAreaValue('insertReferenceLink_format', d.insertReferenceLink.format)
    setCheckboxValue('showNotificationWhenCopy', d.showNotificationWhenCopy)
}

async function resetToDefault() {
    storageManager.setData(storageManager.getDefaultData())
    await loadFromLocalStorage()
}
q<HTMLButtonElement>('resetBtn').onclick=resetToDefault

async function saveFormToLocalStorage() {
    storageManager.setData({
        listIndentSize: ~~getSelectValue('listIndentSize'),
        ulBulletChar: getSelectValue('ulBulletChar') as any,
        olBulletChar: getSelectValue('olBulletChar') as any,
        codeChar: getSelectValue('codeChar') as any,
        codeBlockStyle: getRadioValue('codeBlockStyle') as any,
        insertReferenceLink: {
            enabled: getCheckboxValue('insertReferenceLink_enabled'),
            pos: getSelectValue('insertReferenceLink_pos') as any,
            format: getTextAreaValue('insertReferenceLink_format') as any,
        },
        showNotificationWhenCopy: getCheckboxValue('showNotificationWhenCopy'),
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