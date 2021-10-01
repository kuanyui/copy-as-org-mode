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
    rootEl.style.width = '450px'
    rootEl.style.height = '200px'
    rootEl.style.padding = '16px'
    rootEl.style.backgroundColor = '#77AA99'
    rootEl.style.color = '#2d4f28'
    rootEl.style.borderColor = '#2d4f28'
    rootEl.style.borderStyle = 'solid'
    rootEl.style.borderWidth = '1px'
    rootEl.style.cursor = 'pointer'
    rootEl.style.overflowY = 'auto'
    function close() { rootEl.remove() }
    rootEl.onclick = close
    window.setTimeout(() => {
        close()
    }, 7000)
    // title
    const titleEl = document.createElement('b')
    titleEl.style.display = 'block'
    titleEl.style.fontSize = '1.2rem'
    titleEl.innerText = title
    // content
    const contentEl = document.createElement('p')
    contentEl.style.display = 'block'
    contentEl.innerText = msg
    // final
    rootEl.appendChild(titleEl)
    rootEl.appendChild(contentEl)
    document.body.appendChild(rootEl)
}