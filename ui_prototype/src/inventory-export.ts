import { fields, type Device } from "./model";
export async function exportWorkbook(devices: Device[]) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Devices");
  const columns = [...fields, "status", "uptime", "error", "downtime"] as const;
  sheet.columns = columns.map((key) => ({ header: key, key, width: 26 }));
  for (const device of devices)
    sheet.addRow(
      Object.fromEntries(columns.map((key) => [key, device[key] ?? ""])),
    );
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  return workbook.xlsx.writeBuffer();
}
