import { d as defineEventHandler, g as getMethod, c as createError, r as readBody } from '../../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import '@iconify/utils';
import 'node:crypto';
import 'consola';
import 'node:fs';
import 'node:path';

const outbound_post = defineEventHandler(async (event) => {
  var _a;
  try {
    if (getMethod(event) !== "POST") {
      throw createError({
        statusCode: 405,
        statusMessage: "Method Not Allowed"
      });
    }
    const body = await readBody(event);
    const { sheetName, data, isAdmin } = body;
    console.log(`\u{1F4E6} Processing outbound for sheet: ${sheetName}`);
    console.log("\u{1F464} Is Admin:", isAdmin);
    console.log("\u{1F4CA} Data:", data);
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error("Missing Google credentials in environment variables");
    }
    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      throw new Error("Google Sheet ID is not configured");
    }
    console.log("\u{1F50D} Checking if sheet exists...");
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties"
    });
    const existingSheets = ((_a = spreadsheetInfo.data.sheets) == null ? void 0 : _a.map((s) => {
      var _a2;
      return (_a2 = s.properties) == null ? void 0 : _a2.title;
    })) || [];
    const sheetExists = existingSheets.includes(sheetName);
    console.log("\u{1F4CA} Existing sheets:", existingSheets);
    console.log(`\u{1F4C4} Sheet "${sheetName}" exists:`, sheetExists);
    if (!sheetExists) {
      console.log(`\u{1F4DD} Creating new sheet: ${sheetName}`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: {
                    rowCount: 1e3,
                    columnCount: 12
                  }
                }
              }
            }
          ]
        }
      });
      console.log("\u{1F4DD} Adding headers...");
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:L1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            "Product",
            "Blend",
            "Origin",
            "Roast-Date",
            "Batch-Number",
            "Package-Weight",
            "Package-Amount",
            "Carton-Count",
            "Offset",
            "Total-In-Stock",
            "Timestamp",
            "Scanned-By"
            // نشان میده توسط کی اسکن شده (Admin/Cafe)
          ]]
        }
      });
      console.log(`\u2705 Sheet "${sheetName}" created with headers`);
    }
    const amount = isAdmin ? Math.abs(data["total-in-stock"]) : -Math.abs(data["total-in-stock"]);
    const scannedBy = isAdmin ? "Admin" : "Cafe";
    console.log("\u{1F522} Getting last row...");
    const rangeData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`
    });
    const lastRow = rangeData.data.values ? rangeData.data.values.length : 1;
    const nextRow = lastRow + 1;
    console.log(`\u{1F4CD} Adding data to row ${nextRow}`);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A${nextRow}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          data["Product"] || "",
          data["Blend"] || "",
          data["Origin"] || "",
          data["Roast-Date"] || "",
          data["Batch-Number"] || "",
          data["Package-Weight"] || "",
          data["Package-Amount"] || "",
          data["cartoncount"] || 0,
          data["offset"] || 0,
          amount,
          // مثبت برای ادمین، منفی برای کافه
          new Date(data["Timestamp"]).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          }),
          scannedBy
          // Admin یا Cafe
        ]]
      }
    });
    console.log("\u2705 Data added successfully");
    return {
      success: true,
      message: `Outbound saved successfully to sheet "${sheetName}"`,
      data: {
        sheet_name: sheetName,
        row_number: nextRow,
        amount,
        scanned_by: scannedBy
      }
    };
  } catch (error) {
    console.error("\u274C Full error details:", {
      message: error.message,
      code: error.code,
      errors: error.errors,
      stack: error.stack
    });
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Server error saving outbound"
    });
  }
});

export { outbound_post as default };
//# sourceMappingURL=outbound.post.mjs.map
