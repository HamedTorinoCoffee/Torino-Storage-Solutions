import { d as defineEventHandler, c as createError } from '../../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import '@iconify/utils';
import 'node:crypto';
import 'consola';
import 'node:fs';
import 'node:path';

const list_get = defineEventHandler(async (event) => {
  var _a;
  try {
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error("\u274C Missing Google credentials");
      throw createError({
        statusCode: 500,
        statusMessage: "Missing Google credentials in environment variables"
      });
    }
    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    });
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      console.error("\u274C No GOOGLE_SHEET_ID found");
      throw createError({
        statusCode: 500,
        statusMessage: "Google Sheet ID is not configured"
      });
    }
    console.log("\u{1F4CB} Getting list of sheets from spreadsheet ID:", spreadsheetId);
    let spreadsheetInfo;
    try {
      spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets.properties"
      });
    } catch (apiError) {
      console.error("\u274C Google Sheets API Error:", {
        message: apiError.message,
        code: apiError.code,
        errors: apiError.errors
      });
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to access spreadsheet: ${apiError.message}`
      });
    }
    const allSheets = ((_a = spreadsheetInfo.data.sheets) == null ? void 0 : _a.map((sheet) => {
      var _a2, _b, _c;
      return {
        id: (_a2 = sheet.properties) == null ? void 0 : _a2.sheetId,
        name: ((_b = sheet.properties) == null ? void 0 : _b.title) || "",
        index: ((_c = sheet.properties) == null ? void 0 : _c.index) || 0
      };
    })) || [];
    console.log("\u{1F4CA} All sheets found in spreadsheet:", allSheets.map((s) => s.name).join(", "));
    const systemSheets = [
      "Sheet1",
      "real-time inventory",
      "QR Code Dashboard",
      "QR DB",
      "Tabel",
      // Added Tabel as it appears to be a system sheet
      "Table1"
      // Added just in case
    ];
    const cafeSheets = allSheets.filter((sheet) => {
      const isSystemSheet = systemSheets.some(
        (sysSheet) => sheet.name.toLowerCase() === sysSheet.toLowerCase()
      );
      return !isSystemSheet && sheet.name.trim() !== "";
    }).sort((a, b) => a.index - b.index);
    console.log("\u2615 Found cafe sheets:", cafeSheets.map((s) => s.name).join(", "));
    console.log("\u{1F4C8} Total cafe sheets:", cafeSheets.length);
    if (cafeSheets.length === 0) {
      console.warn("\u26A0\uFE0F No cafe sheets found! All sheets:", allSheets.map((s) => s.name));
    }
    return {
      success: true,
      sheets: cafeSheets,
      total: cafeSheets.length,
      // Include debug info in development
      ...false
    };
  } catch (error) {
    console.error("\u274C Error getting sheets list:", {
      message: error.message,
      stack: error.stack
    });
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Server error getting sheets list"
    });
  }
});

export { list_get as default };
//# sourceMappingURL=list.get.mjs.map
