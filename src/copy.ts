import { copyToClipboard, storageManager } from "./common";
import { convertSelectionToOrgMode } from "./converter/converter";




async function main() {
  try {
    console.log('main() in copy.ts')
    let options = await storageManager.getData()
    let title = document.title;
    if (options.titleBlackList !== "") {
      title = replaceTitleBlackList(title, options.titleBlackList);
    }
    let text = `[[${document.URL}][${title}]]`;
    let html = `<a href="${document.URL}">${title}</a>`;
    let selection = await convertSelectionToOrgMode(options);
    // console.log('Selection ===>', selection)
    if (selection.output !== "") {
      if (options.insertReferenceLink.enabled) {
        text += `\n\n${selection.output}`;
        html += `<br><br><blockquote>${selection.html}</blockquote>`;
      } else {
        text = selection.output;
        html = selection.html;
      }
    }
    copyToClipboard(text, html);
  } catch (e) {
    console.error(e);
  }
}

main();
