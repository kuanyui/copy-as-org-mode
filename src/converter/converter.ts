/**
 * This file is derived from copy-selection-as-markdown by 0x6b
 * @see https://github.com/0x6b/copy-selection-as-markdown
 *
 * MIT License
 *
 * Copyright (c) 2021 ono ono (kuanyui)
 * Copyright (c) 2017-2019 0x6b
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { MyStorage } from "../common";
import TurndownService from "../html2org/turndown";
import { getSelectionAsCleanHtml } from "./selection";

interface ConversionResult {
    /** Org-Mode formatted text */
    output: string
    /** Clean HTML. See selection.ts */
    html: string
}

export async function convertSelectionToOrgMode(options: MyStorage): Promise<ConversionResult> {
    const html = await getSelectionAsCleanHtml(options)
    var turndownService = new TurndownService({
        unorderedListMarker: options.ulBulletChar,
        orderedListMarker: options.olBulletChar,
        codeDelimiter: options.codeChar,
        listIndentSize: options.listIndentSize,
        codeBlockStyle: options.codeBlockStyle,

    })
    const orgStr = turndownService.turndown(html)
    return {
        html: html,
        output: orgStr
    }
}