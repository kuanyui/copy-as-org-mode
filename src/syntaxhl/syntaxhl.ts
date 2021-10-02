/**
* Modified from
* https://stackoverflow.com/questions/41884969/highlight-syntax-in-contenteditable
*/

type lang_id_t = 'template'
type LangSyntaxObj = {[tokenClassName: string]: RegExp}
const LANGS_SYNTAX: Record<lang_id_t, LangSyntaxObj> = {
    template: {
        rplc: /(%(:?title|url|date|datetime)%)/g,
    },
}

function syntaxhl(el: HTMLElement) {
    const langId = el.dataset.langId as lang_id_t

    if(!langId) { throw new Error('[To Developer] Please add data-lang-id="template"') }
    const langObj = LANGS_SYNTAX[langId]
    let html = el.innerHTML;
    Object.keys(langObj).forEach(function(tokenClassName) {
        html = html.replace(langObj[tokenClassName], `<span class=${langId}_${tokenClassName}>$1</span>`);
    });
    el.nextElementSibling!.innerHTML = html
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