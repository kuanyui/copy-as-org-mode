import { MyStorage } from "../common";

export function convertHtmlToOrg(options: MyStorage, html: string): string {
    const container = document.createElement("div");
    container.outerHTML = html
    // pre (containing code....)
    // code
    for (const codeEl of container.getElementsByTagName('code')) {
        codeEl.outer
        const ch = options.codeChar
        const text = codeEl.innerText.trim()
        codeEl.
    }
}