import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { initialState } from "./model";
import { exportWorkbook } from "./inventory-export";
test("Excel export preserves network addresses and metadata as literal cells", async () => {
  const device = { ...initialState().devices[0], name: "=not_a_formula" };
  const bytes = await exportWorkbook([device]);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const sheet = workbook.worksheets[0];
  assert.equal(sheet.rowCount, 2);
  assert.equal(sheet.getCell("A2").value, "=not_a_formula");
  assert.equal(sheet.getCell("C2").value, device.ipv4);
  assert.equal(sheet.getCell("E2").value, device.network);
  assert.equal(sheet.getCell("J2").value, device.status);
});
