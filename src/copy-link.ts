import { copyToClipboard } from "./common";

browser.runtime.onMessage.addListener((message: any) =>
  copyToClipboard(message.text, message.html)
);
