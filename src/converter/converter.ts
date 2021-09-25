import { MyStorage } from "../common";
import { getSelectionAsCleanHtml } from "./selection";

interface ConversionResult {
    /** Org-Mode formatted text */
    output: string
    /** Clean HTML. See selection.ts */
    html: string
}

export async function convertSelectionToOrgMode(options: MyStorage): Promise<ConversionResult> {
    const html = await getSelectionAsCleanHtml(options)
    const orgStr: string = convertHtmlToOrg(options)
    return {
        html: html,
        output: orgStr
    }
}