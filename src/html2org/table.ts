/*!
 * Copyright (c) 2021 ono ono (kuanyui) All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0 (MPL-2.0). If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * You may not remove or alter the substance of any license notices (including
 * copyright notices, patent notices, disclaimers of warranty, or limitations of
 * liability) contained within the Source Code Form of the Covered Software,
 * except that You may alter any license notices to the extent required to
 * remedy known factual inaccuracies. (Cited from MPL - 2.0, chapter 3.3)
 */

import TurndownService from "./turndown";

type section_t = 'thead' | 'tbody' | 'tfoot'

interface TableModel {
  maxRowsCount: number
  maxColsCount: number
  rows: RowModel[]
}
type RowModel = CellModel[]
interface CellModel {
  /** Formatted org-mode content */
  orgContent: string
  /**
   * Browser behavior: rowspan="0" means merging from current row # to last row #.
   *  if its value is set to 0, it extends until the end of the table section
   *
   * #### rowspan [MDN Doc]
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#attr-rowspan
   *
   * This attribute contains a non-negative integer value that indicates for how
   * many rows the cell extends. Its default value is 1; if its value is set to
   * 0, it extends until the end of the table section (<thead>, <tbody>,
   * <tfoot>, even if implicitly defined), that the cell belongs to. Values
   * higher than 65534 are clipped down to 65534.
   *
   */
  rowSpan: number
  /** Browser behavior: ~When greater than actual column amount across all tr,
   * it will be set to colSpan~. Donnot what were I writing.
   *
   * When a cell (td / tr) has `colspan` greater than actual remaining column
   * amount across all rows (tr), this cell (td or th) will be extends to the
   * last column.
   *
   * #### colspan [MDN Doc]
   *
   * @see
   * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#attr-colspan
   *
   * This attribute contains a non-negative integer value that indicates for how
   * many columns the cell extends. Its default value is 1. Values higher than
   * 1000 will be considered as incorrect and will be set to the default value
   * (1).
  */
  colSpan: number
  inSection: section_t
  tag: 'th' | 'td'
}

type CookedTableModel = CookedRowModel[]
type CookedRowModel = CookedCellModel[]
interface CookedCellModel {
  /** may be empty because of rowspan / colspan */
  text: string
  /** if draw a horizontal line in bottom of this cell & row */
  inSection: section_t
}


/** Get string's "real" width.
* http://www.rikai.com/library/kanjitables/kanji_codes.unicode.shtml
* CJK characters will be replaced with "xx", and be counted as 2-width character.
*/
function getTextWidth(str: string) {
  return str.replace(/[\u4e00-\u9faf\u3000-\u30ff\uff00-\uff60\uffe0-\uffe6]/g, "xx").length;
}

/**
 * Fill string with spaces to a specific width.
 * String.prototype.padEnd is not safe when string contains CJK characters.
 */
function fillWithSpaces(str: string, toWidth: number){
  var stringWidth = getTextWidth(str);
  return str + Array((toWidth - stringWidth) + 1).join(" ");
};

function deepCopy<T>(x: T): T {
  return JSON.parse(JSON.stringify(x))
}

export function isTable(node: Node): node is HTMLTableElement { return node.nodeName === 'TABLE' }
function isThead(node: Node): node is HTMLTableSectionElement { return node.nodeName === 'THEAD' }
function isTbody(node: Node): node is HTMLTableSectionElement { return node.nodeName === 'TBODY' }
function isTfoot(node: Node): node is HTMLTableSectionElement { return node.nodeName === 'TFOOT' }
function isTr(node: Node): node is HTMLTableRowElement { return node.nodeName === 'TR' }
function isTh(node: Node): node is HTMLTableHeaderCellElement { return node.nodeName === 'TH' }
function isTd(node: Node): node is HTMLTableDataCellElement { return node.nodeName === 'TD' }

/**
* - Convert HTMLTableElement to Org-Mode string.
* This will apply rules on td & th only. */
export function replacementForTable(service: TurndownService, tableElem: HTMLTableElement): string {
  console.log('TABLE ENTRY POINT!')
  const table: TableModel = {
    maxRowsCount: -1,
    maxColsCount: -1,
    rows: [],
  }
  for (const el of tableElem.children) {
    if (isThead(el) || isTfoot(el)) {
      for (const row of el.children) {
        if (!isTr(row)) { continue }
        const section: section_t = isThead(el) ? 'thead' : 'tfoot'
        processRow(service, table, row, section)
      }
    } else if (isTbody(el)) {
      for (const row of el.children) {
        if (!isTr(row)) { continue }
        processRow(service, table, row, 'tbody')
      }
    } else if (isTr(el)) {
      processRow(service, table, el, 'tbody')
    } else {
      continue
    }
  }


  return '\n\n' + tableModelToOrg(table) + '\n\n'
}

function calculateMaxRowAndCol(table: TableModel): void {
  // maxRow
  for (const tr of table.rows) {
    for (const td of tr) {
      if (td.)
    }
  }
}

function processRow(service: TurndownService, table: TableModel, row: HTMLTableRowElement, inSection: section_t): void {
  const rowModel: RowModel = []
  for (const cell of row.children) {
    if (isTh(cell) || isTd(cell)) {
      const orgContent = service.processChildrenOfNode(cell)
      rowModel.push({
        orgContent: orgContent.trim().replace(/[\n|]/g, ' '),  // | is absolutely not allowed in org-mode's table cell
        colSpan: cell.colSpan,
        rowSpan: cell.rowSpan,
        inSection: inSection,
        tag: isTh(cell) ? 'th' : 'td'
      })
    } else {
      continue
    }
  }
  table.rows.push(rowModel)
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
    let inSection: section_t = 'tbody'
    let fmtRow: string = cookedTable[r].map((col, c) => {
      let expectedColWidth = expectedColWidthList[c]
      inSection = col.inSection
      return fillWithSpaces(col.text, expectedColWidth)
    }).join(' | ')
    fmtRow = `| ${fmtRow} |`
    fmtRows.push(fmtRow)
    if (inSection as section_t === 'thead') {
      fmtRows.push(makeHorizontalLine(expectedColWidthList))
    } else if (inSection as section_t === 'tfoot') {
      fmtRows.splice(fmtRows.length - 2, 0, makeHorizontalLine(expectedColWidthList))
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
  const rawTable = deepCopy(table)
  const cookedTable: CookedTableModel = Array.from(Array(table.length)).map(() => [])
  let nthCol = 0
  let hasMoreCells = true
  while (hasMoreCells) {
    hasMoreCells = cookColumn(rawTable, cookedTable, nthCol)
    nthCol += 1
  }
  console.log('table', table, 'cooked', cookedTable)
  return cookedTable
}

/**
 * @return if there's no cell in this column, return false.
 */
function cookColumn(rawTable: TableModel, cookedTable: CookedTableModel, nthCol: number): boolean {
  console.log(`cooking column num ${nthCol}`)
  let hasCellInThisColNum = false
  const maxRowAmount = rawTable.length
  let rowAmount = 0
  for (let r = 0;r < maxRowAmount;r++) {
    const cell = rawTable[r].shift()
    if (!cell) { continue }
    hasCellInThisColNum = true
    if (cell.rowSpan === 0) {
      cell.rowSpan = maxRowAmount - r
    }
    rowAmount += cell.rowSpan
    for (let deltaR = 0;deltaR < cell.rowSpan;deltaR++) {
      const currR = r + deltaR
      for (let deltaC = 0;deltaC < cell.colSpan;deltaC++) {
        if (deltaR === 0 && deltaC === 0) {
          // console.log(`Cell column ${c}`, cell, `curR = ${currR}`, cookedTable)
          cookedTable[currR].push({ text: cell.orgContent, inSection: cell.inSection })
        } else {
          cookedTable[currR].push({ text: '', inSection: cell.inSection })
        }
      }
    }
    if (rowAmount >= maxRowAmount) {
      break
    }
  }
  return hasCellInThisColNum
}

