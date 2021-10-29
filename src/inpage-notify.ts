export function inPageNotify(title: string, msg: string) {
    console.log('inPageNotify', title, msg)
    const oriEl = document.getElementById('copyAsOrgModeNotify')
    if (oriEl) {
        oriEl.remove()
    }
    const rootEl = document.createElement('div')
    rootEl.id = 'copyAsOrgModeNotify'
    rootEl.style.display = 'block'
    rootEl.style.position = 'fixed'
    rootEl.style.zIndex = '99999999999999999'
    rootEl.style.top = '16px'
    rootEl.style.right = '16px'
    rootEl.style.width = '550px'
    rootEl.style.height = '260px'
    rootEl.style.padding = '16px'
    rootEl.style.backgroundColor = '#c3f0e1' // '#77AA99'
    rootEl.style.color = '#2d4f28'
    rootEl.style.borderColor = '#2d4f28'
    rootEl.style.borderStyle = 'solid'
    rootEl.style.borderWidth = '1px'
    rootEl.style.cursor = 'pointer'
    rootEl.style.overflowY = 'auto'
    rootEl.title = 'Click to close'
    function close() { rootEl.remove() }
    rootEl.onclick = close
    window.setTimeout(() => {
        close()
    }, 16000)
    // title
    const titleEl = document.createElement('b')
    titleEl.style.display = 'flex'
    titleEl.style.alignItems = 'center'
    titleEl.style.fontSize = '1.2em'
    titleEl.innerText = title
    // icon
    const imgEl = document.createElement('img')
    imgEl.src = browser.runtime.getURL('img/icon.png')
    imgEl.width = 32
    imgEl.height = 32
    titleEl.prepend(imgEl)
    // content
    const contentEl = document.createElement('p')
    contentEl.style.display = 'block'
    contentEl.style.whiteSpace = 'pre-wrap'
    contentEl.style.fontFamily = 'monospace'
    contentEl.style.fontSize = '0.8em'
    contentEl.style.lineHeight = '1rem'
    contentEl.innerText = msg
    // final
    rootEl.appendChild(titleEl)
    rootEl.appendChild(contentEl)
    document.body.appendChild(rootEl)
}