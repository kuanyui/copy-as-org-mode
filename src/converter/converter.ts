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
        bulletListMarker: options.ulBulletChar
    })
    const orgStr = turndownService.turndown(html)
    return {
        html: html,
        output: orgStr
    }
}