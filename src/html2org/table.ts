import { CustomNode } from "./node";
import { Rule } from "./rules";
import TurndownService, { Html2OrgOptions } from "./turndown";

type TableModel = RowModel[]
type RowModel = CellModel[]
interface CellModel {
  /** Formatted org-mode content */
  orgContent: string
  rowSpan: number
  colSpan: number
  inThead: boolean
  tag: 'th' | 'td'
}

type CookedTableModel = CookedRowModel[]
type CookedRowModel = CookedCellModel[]
interface CookedCellModel {
  /** may be empty because of rowspan / colspan */
  text: string
  /** if draw a horizontal line in bottom of this cell & row */
  inThead: boolean
}


/** Get string's "real" width.
* http://www.rikai.com/library/kanjitables/kanji_codes.unicode.shtml
* CJK characters will be replaced with "xx", and be counted as 2-width character.
*/
function getTextWidth(str: string){
  return str.replace(/[\u4e00-\u9faf\u3000-\u30ff\uff00-\uff60\uffe0-\uffe6]/g, "xx").length;
}

export function isTable(node: Node): node is HTMLTableElement { return node.nodeName === 'TABLE' }
function isThead(node: Node): node is HTMLTableSectionElement { return node.nodeName === 'THEAD' }
function isTbody(node: Node): node is HTMLTableSectionElement { return node.nodeName === 'TBODY' }
function isTr(node: Node): node is HTMLTableRowElement { return node.nodeName === 'TR' }
function isTh(node: Node): node is HTMLTableHeaderCellElement { return node.nodeName === 'TH' }
function isTd(node: Node): node is HTMLTableDataCellElement { return node.nodeName === 'TD' }

/**
* - Convert HTMLTableElement to Org-Mode string.
* This will apply rules on td & th only. */
export function replacementForTable(service: TurndownService, tableElem: HTMLTableElement): string {
  console.log('TABLE ENTRY POINT!')
  const table: TableModel = []
  for (const el of tableElem.children) {
    if (isThead(el)) {
      for (const row of el.children) {
        if (!isTr(row)) { continue }
        processRow(service, table, row, true)
      }
    } else if (isTbody(el)) {
      for (const row of el.children) {
        if (!isTr(row)) { continue }
        processRow(service, table, row, false)
      }
    } else if (isTr(el)) {
      processRow(service, table, el, false)
    } else {
      continue
    }
  }
  return '\n\n' + tableModelToOrg(table) + '\n\n'
}

function processRow(service: TurndownService, table: TableModel, row: HTMLTableRowElement, inThead: boolean): void {
  const rowModel: RowModel = []
  for (const cell of row.children) {
    if (isTh(cell)) {
      const orgContent = service.processChildrenOfNode(cell)
      rowModel.push({
        orgContent: orgContent.trim().replace(/\n/g, ' '),
        colSpan: cell.colSpan || 1,
        rowSpan: cell.rowSpan || 1,
        inThead: inThead,
        tag: 'th'
      })
    } else if (isTd(cell)) {
      const orgContent = service.processChildrenOfNode(cell)
      rowModel.push({
        orgContent: orgContent.trim().replace(/\n/g, ' '),
        colSpan: cell.colSpan || 1,
        rowSpan: cell.rowSpan || 1,
        inThead: inThead,
        tag: 'td'
      })
    } else {
      continue
    }
  }
  table.push(rowModel)
}

function tableModelToOrg(table: TableModel): string {
  const cookedTable = cookTableModel(table)
  const totalRow = cookedTable.length
  const totalCol = cookedTable.length === 0 ? 0 : cookedTable[0].length
  const expectedColWidthList: number[] = []
  // stats the max width of each column
  for (let c = 0;c < totalCol;c++) {
    let curColTextMaxWidth = 1  // Org-mode table's cell has at least 1 space width (exclude the additional spaces around `|` as padding)
    for (let r = 0;r < totalRow;r++) {
      const cell = cookedTable[r][c]
      const cellTextWidth = getTextWidth(cell.text)
      curColTextMaxWidth = Math.max(curColTextMaxWidth, cellTextWidth)
    }
    expectedColWidthList.push(curColTextMaxWidth)
  }
  // Format lines
  const fmtRows: string[] = []
  for (let r = 0;r < totalRow;r++) {
    let inThead: boolean = false
    let fmtRow: string = cookedTable[r].map((col, c) => {
      let expectedColWidth = expectedColWidthList[c]
      inThead = col.inThead || inThead
      return col.text.padEnd(expectedColWidth, ' ')
    }).join(' | ')
    fmtRow = `| ${fmtRow} |`
    fmtRows.push(fmtRow)
    if (inThead) {
      fmtRows.push(makeHorizontalLine(expectedColWidthList))
    }
  }
  return fmtRows.join('\n')
}

function makeHorizontalLine(colWidthList: number[]): string {
  const innerDashes: string[] = colWidthList.map((textWidth) => {
    const w = Math.max(1, textWidth)
    return ''.padEnd(w + 2, '-')
  })
  return `|${innerDashes.join('+')}|`
}

/** process rowSpan / colSpan */
function cookTableModel(table: TableModel): CookedTableModel {
  const cookedTable: CookedTableModel = Array.from(Array(table.length)).map(() => [])
  for (let r = 0;r < table.length;r++) {
    const row = table[r]
    for (let c = 0; c < row.length; c++) {
      const cell = row[c]
      for (let deltaR = 0;deltaR < cell.rowSpan; deltaR++) {
        const currR = r + deltaR
        for (let deltaC = 0;deltaC < cell.colSpan; deltaC++) {
          if (deltaR === 0 && deltaC === 0) {
            // console.log(`Cell column ${c}`, cell, `curR = ${currR}`, cookedTable)
            cookedTable[currR].push({ text: cell.orgContent, inThead: cell.inThead })
          } else {
            cookedTable[currR].push({ text: '', inThead: cell.inThead })
          }
        }
      }
    }
  }
  // console.log('table', table, 'cooked', cookedTable)
  return cookedTable
}

