/*!
 * Copyright (c) 2021 ono ono (kuanyui) All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0 (MPL-2.0). If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * You may not remove or alter the substance of any license notices (including
 * copyright notices, patent notices, disclaimers of warranty, or limitations of
 * liability) contained within the Source Code Form of the Covered Software,
 * except that You may alter any license notices to the extent required to
 * remedy known factual inaccuracies. (Cited from MPL - 2.0, chapter 3.3)
 */


/** First item is default. DON'T REORDER */
enum __NotificationMethod { inPagePopup, notificationApi, none }
export type notification_method_t = keyof typeof __NotificationMethod
const ALL_NOTIFICATION_METHODS = getAllKeyAsStringArray(__NotificationMethod)
export type api_level_t =  1
export type list_indent_t = number
export type ul_mark_t = '-' | '+'
export type ol_mark_t = '.' | ')'
export type code_mark_t = '=' | '~'
export type codeblock_style_t = 'colon' | 'beginEnd'
export type source_link_insert_pos_t = 'prepend' | 'append'
type fmt_template_token_t =
    '%title%' |
    '%url%' |
    '%date%' |
    '%datetime%'

export type source_link_text_fmt_t =
    `${string}${fmt_template_token_t}${string}`


export interface CopyAsOrgModeOptions {
    apiLevel: api_level_t,
    /** Indent size for nested list item */
    listIndentSize: list_indent_t,
    /** The character of `ul > li` in Org-mode */
    ulBulletChar: ul_mark_t
    /** The character of `ul > li` in Org-mode */
    olBulletChar: ol_mark_t
    /** The character to mark `<code>`in Org-mode */
    codeChar: code_mark_t
    /** #+begin_src or : colon */
    codeBlockStyle: codeblock_style_t
    /** Replace angle brackets (`<>`) with HTML entities< */
    escapeHtmlEntities: boolean
    /** When copy selection, insert the link of current page as source reference. */
    insertReferenceLink: {
        enabled: boolean,
        pos: source_link_insert_pos_t,
        format: source_link_text_fmt_t
    }
    /** process uri with window.decodeURI() */
    decodeUri: boolean,
    /** Remove matched string or RegExp pattern in the title */
    titleBlackList: string
    convertImageAsDataUrl: boolean,
    /** NOTE: Add this option because it seems browser.notifications may freezed browser... Donno why... */
    notificationMethod: notification_method_t
}


type TypedStorageChange<T> = {
    oldValue: T
    newValue: T
}
/** Strong typed version ChangeDict for WebExtension (e.g. browser.storage.onChanged).
 * T is the custom storage interface
 */
type TypedChangeDict<T> = { [K in keyof T]: TypedStorageChange<T[K]> }


/**
 * @param value current value, may be wrong
 * @param availableValues All possible correct values. The first element is the default value.
 * @return if value doesn't exist in availableValues, return availableValues[0]. else, return original value.
 */
function fixValue<T>(value: T, availableValues: T[]): T {
    if (availableValues.includes(value)) { return value }
    return availableValues[0]
}

function getAllKeyAsStringArray<T>(enumObj: T): Array<keyof T> {
    const arr: Array<keyof T> = []
    for (const k in enumObj) {
        if (k.match(/^\d+$/)) { continue }
        arr.push(k)
    }
    return arr
}




function assertUnreachable (x: never) { x }
export function objectAssignPerfectly<T>(target: T, newValue: T) {
    return Object.assign(target, newValue)
}
export function deepCopy<T>(x: T): T {
    return JSON.parse(JSON.stringify(x))
}

export function storageSetSync (d: Partial<CopyAsOrgModeOptions>): void {
    browser.storage.sync.set(d)
}
class StorageManager {
    area: browser.storage.StorageArea
    constructor() {
        // Firefox for Android (90) doesn't support `sync` area yet,
        // so write a fallback for it.
        if (browser.storage.sync) {
            this.area = browser.storage.sync
        } else {
            this.area = browser.storage.local
        }
    }
    getDefaultData(): CopyAsOrgModeOptions {
        return {
            apiLevel: 1,
            listIndentSize: 2,
            ulBulletChar: '-',
            olBulletChar: '.',
            codeChar: '=',
            codeBlockStyle: 'beginEnd',
            escapeHtmlEntities: false,
            insertReferenceLink: {
                enabled: false,
                pos: 'append',
                format: '-----\nOriginal Reference: [[%url%][%title%]]\n(Retrieved at [%datetime%])\n'
            },
            titleBlackList: '',
            convertImageAsDataUrl: false,
            notificationMethod: 'inPagePopup',
            decodeUri: true,
        }
    }
    /** Set data object (can be partial) into LocalStorage. */
    setDataPartially(d: Partial<CopyAsOrgModeOptions>): void {
        console.log('[SET] TO STORAGE', deepCopy(d))
        this.area.set(deepCopy(d))
    }
    /** Get data object from LocalStorage */
    getData(): Promise<CopyAsOrgModeOptions> {
        return this.area.get().then((_ori) => {
            let needSave = false
            /** may be malformed */
            const ori = _ori as unknown as CopyAsOrgModeOptions
            console.log('[GET] ORIGINAL', deepCopy(ori))
            const DEFAULT = this.getDefaultData()
            if (!ori) {
                this.setDataPartially(DEFAULT)
                return DEFAULT
            }
            const final = this.getDefaultData()
            // Removed deprecated fields
            for (const _expectedKey in final) {
                const expectedKey = _expectedKey as keyof CopyAsOrgModeOptions
                if (ori[expectedKey] !== undefined) {  // expectedKey found in gotten object
                    // @ts-ignore
                    final[expectedKey] = ori[expectedKey]
                } else {
                    needSave = true
                }
            }
            // ==================================
            // Some fixes when no API Level. (This should be deprecated in future)
            // ==================================
            if (ori.apiLevel === undefined) {
                final.notificationMethod = fixValue(final.notificationMethod, ALL_NOTIFICATION_METHODS)
                final.insertReferenceLink.format = DEFAULT.insertReferenceLink.format
                final.apiLevel = 1
            }
            // ==================================
            // MIGRATION BEGINS
            // ==================================
            migrateLoop:
            while (final.apiLevel !== DEFAULT.apiLevel) {
                switch (final.apiLevel) {
                    case undefined: {
                        continue migrateLoop
                    }
                    case 1: {
                        // Latest
                        break
                    }
                    default: {
                        assertUnreachable(final.apiLevel)
                    }
                }
            }
            // ==================================
            // MIGRATION ENDS
            // ==================================
            console.log('[GET] FIXED', final)
            if (needSave) {
                this.setDataPartially(final)
            }
            return final
        }).catch((err) => {
            console.error('Error when getting settings from browser.storage:', err)
            return this.getDefaultData()
        })
    }
    onDataChanged(cb: (changes: TypedChangeDict<CopyAsOrgModeOptions>) => void) {
        browser.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'sync' || areaName === 'local') {
                cb(changes as TypedChangeDict<CopyAsOrgModeOptions>)
            }
        })
    }
}
export const storageManager = new StorageManager()
