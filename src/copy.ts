import { copyToClipboard, MyStorage, storageManager } from "./common";
import { convertSelectionToOrgMode } from "./converter/converter";




async function main() {
  try {
    console.log('main() in copy.ts')
    let options = await storageManager.getData()
    let title = document.title;
    if (options.titleBlackList !== "") {
      title = replaceTitleBlackList(title, options.titleBlackList);
    }
    const url = document.URL
    let ref = getFormattedReferenceLink(title, url, options)
    let html = `<a href="${document.URL}">${title}</a>`;
    let text = ''
    const result = await convertSelectionToOrgMode(options)
    // console.log('Selection ===>', selection)
    if (result.output !== "") {
      if (options.insertReferenceLink.enabled) {
        if (options.insertReferenceLink.pos === 'append') {
          text = result.output + '\n\n' + ref
        } else {
          text = ref + '\n\n' + result.output
        }
        html += `<br><br><blockquote>${result.html}</blockquote>`;
      } else {
        text = result.output;
        html = result.html;
      }
    }
    copyToClipboard(text, html);
  } catch (e) {
    console.error(e);
  }
}

main();

function getFormattedReferenceLink(title: string, url: string, options: MyStorage): string {
  const template = options.insertReferenceLink.format
  let s: string = template
  s = s.replaceAll('%t', title)
  s = s.replaceAll('%u', url)
  return s
}