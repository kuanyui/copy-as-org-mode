import fetch from 'node-fetch'
import * as fs from 'fs'
import * as path from 'path'
// Custom constants
const PACKAGE_URL = 'copy-as-org-mode'

// Fixed constants
const README_PATH = path.join(__dirname, '../README.org')

function fetchAddonDetails() {
    return fetch(`https://addons.mozilla.org/api/v5/addons/addon/${PACKAGE_URL}/`)
}

interface ImageInfo {
    url: string
}
function fetchAddonAllImageInfo(): Promise<ImageInfo[]> {
    return fetchAddonDetails().then(resp => {
        return resp.json().then(root => {
            return root.previews.map((x: any): ImageInfo => ({ url: x.image_url.split('?')[0] }))
        })
    })
}

async function updateScreenshotsInReadme() {
    const imageInfos = await fetchAddonAllImageInfo()
    const formattedImageUrlLines: string[] = imageInfos.map(x => `[[${x.url}]]`)
    const raw = fs.readFileSync(README_PATH, { encoding: 'utf8' })
    const oldLines = raw.split('\n')
    const newLines = []
    let inScreenshotBlock = false
    for (const line of oldLines) {
        if (!inScreenshotBlock) {
            newLines.push(line)
            if (line.match(/^[*]+ Screenshot/)) {
                inScreenshotBlock = true
                newLines.push(...formattedImageUrlLines)
            }
        } else {
            if (line.match(/^[*]+ /)) {
                inScreenshotBlock = false
                newLines.push('')  // append 1 empty line after screenshots
                newLines.push(line)
            }
        }
    }
    fs.writeFileSync(README_PATH, newLines.join('\n'), { encoding: 'utf8' })
}

updateScreenshotsInReadme()