/**
* Modified from
* https://stackoverflow.com/questions/41884969/highlight-syntax-in-contenteditable
*/

type lang_id_t = 'template'
type LangSyntaxObj = {[tokenClassName: string]: RegExp}
const LANGS_SYNTAX: Record<lang_id_t, LangSyntaxObj> = {
    template: {
        blkh: /(^#\+(?:begin|end)_(?:src|quote|example|html|verse|center)(?: .*)?$)/gi,
        hr: /(^-----+$)/g,
        outl: /(^\*+ .*)/g,   // **** outline
        comt: /(^# .+$)/g,    // # comment
        link: /(\[\[.+?\]\[.+?\]\])/g, // [[][]]
        // time: /([<]%date(?:time)?%[>]|\[%date(?:time)?%\])/g,   // <YYYY-MM-DD W HH:mm>
        rplc: /(%(?:title|url|date|datetime)%)/g,  // replaceKeyword %title%
    },
}

function syntaxhl(el: HTMLElement) {
    const langId = el.dataset.langId as lang_id_t

    if(!langId) { throw new Error('[To Developer] Please add data-lang-id="template"') }
    const langObj = LANGS_SYNTAX[langId]
    const htmlLines = el.innerHTML.split('<br>')
    console.log('HTML===', htmlLines)
    Object.keys(langObj).forEach(function (tokenClassName) {
        for (let i = 0;i < htmlLines.length;i++) {
            htmlLines[i] = htmlLines[i].replace(langObj[tokenClassName], `<span class=${langId}_${tokenClassName}>$1</span>`);
        }
    });
    el.nextElementSibling!.innerHTML = htmlLines.join('<br>')
};

export function initSyntaxhlElements() {
    const editors = document.querySelectorAll(".syntaxhl-editor")
    editors.forEach((_el: Element) => {
        const editorEl = _el as HTMLElement
        if (editorEl.parentElement!.className !== 'syntaxhl-wrapper') {
            const rendererEl = document.createElement('div')
            rendererEl.className = 'syntaxhl-renderer'
            const wrapperEl = document.createElement('div')
            wrapperEl.className = 'syntaxhl-wrapper'
            editorEl.before(wrapperEl)
            wrapperEl.appendChild(editorEl)
            wrapperEl.appendChild(rendererEl)
        }

        editorEl.contentEditable = 'true'
        editorEl.spellcheck = false
        // el.autocorrect = "off"
        editorEl.autocapitalize = "off"
        editorEl.addEventListener("input", syntaxhl.bind(null, editorEl))
        editorEl.addEventListener("input", syntaxhl.bind(null, editorEl))
        syntaxhl(editorEl)
    });
}