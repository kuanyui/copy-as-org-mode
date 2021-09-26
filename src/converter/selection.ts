import { imgToCanvasToDataUrl, MyStorage } from "../common";


// https://github.com/defunctzombie/node-url/issues/54
// https://github.com/defunctzombie/node-url/issues/41
// @ts-ignore
import * as url from 'url'

/** Process or resolve img.src, a.href in HTML.
 *
 * Resolve URL, for example: ///image/foo.jpg  ->  https://domain.com/image/foo.jpg
 *
 * Or convert into Base64 data URL.
 */
export async function getSelectionAsCleanHtml (options: MyStorage): Promise<string> {

    let selection = document.getSelection();
    if (!selection) {
        console.error('[To Developer] document.getSelection() is null???')
        return 'ERROR'
    }
    if (selection.rangeCount === 0) {
        let frames = document.getElementsByTagName("iframe");
        if (frames) {
            for (let i = 0; i < frames.length; i++) {
                const frame = frames[i]
                const contentDocument = frame.contentDocument
                if (!contentDocument) { continue }
                const tmpSel = contentDocument.getSelection()
                if (!tmpSel) { continue }
                if (tmpSel.rangeCount > 0) {
                    selection = tmpSel
                    break  // NOTE: Right?
                }
            }
        }
    }

    if (selection.rangeCount === 0) {
        console.error('[To Developer] getSelection().rangeCount is 0. WHYYYYYYY? WRYYYYYY')
        return 'ERROR'
    }

    const container = document.createElement("div");

    for (let i = 0; i < selection.rangeCount; ++i) {
        container.appendChild(selection.getRangeAt(i).cloneContents())
    }

    for (let a of container.getElementsByTagName("a")) {
        const href = a.getAttribute("href")
        if (!href) { continue }
        if (href.startsWith("http")) { continue }
        const fixedHref = url.resolve(document.URL, href)
        a.setAttribute("href", fixedHref);
    }

    for (let img of container.getElementsByTagName("img")) {
        const src = img.getAttribute("src")
        if (!src) { continue }
        if (src.startsWith("http")) { continue }
        if (src.startsWith("data:")) { continue }
        const fixedSrc =  url.resolve(document.URL, src)
        img.setAttribute("src", fixedSrc)
    }

    if (options.convertImageAsDataUrl) {
        for (let img of container.getElementsByTagName("img")) {
            const src = img.getAttribute('src')
            if (!src) { continue }
            if (!src.startsWith("http")) { continue }
            const srcWithoutParam = src.split("?", 2)[0]
            if (srcWithoutParam.match(/(gif|jpe?g|png|webp)$/)) {
                img.setAttribute("src", await imgToCanvasToDataUrl(img))
            }
        }
    }

    const cleanHTML = container.innerHTML
    return cleanHTML
};
