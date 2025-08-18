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

const inventory_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  try {
    if (getMethod(event) !== "POST") {
      throw createError({
        statusCode: 405,
        statusMessage: "Method Not Allowed"
      });
    }
    const body = await readBody(event);
    const { sheetName, data } = body;
    console.log(`\u{1F4E6} Processing inventory for sheet: ${sheetName}`);
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
                    columnCount: 15
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
            "Row",
            "Product",
            "Blend",
            "Origin",
            "Roast-Date",
            "Batch-Number",
            "Package-Weight",
            "Package-Amount",
            "Carton Count",
            "Offset",
            "Total in Stock",
            "Timestamp"
          ]]
        }
      });
      console.log(`\u2705 Sheet "${sheetName}" created with headers`);
    }
    console.log("\u{1F522} Getting last row...");
    const rangeData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`
    });
    const lastRow = rangeData.data.values ? rangeData.data.values.length : 1;
    const nextRow = lastRow + 1;
    const rowNumber = sheetExists ? lastRow : 1;
    console.log(`\u{1F4CD} Adding data to row ${nextRow}`);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A${nextRow}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          rowNumber,
          data["Product"] || "",
          data["Blend"] || "",
          data["Origin"] || "",
          data["Roast-Date"] || "",
          data["Batch-Number"] || "",
          data["Package-Weight"] || "",
          data["Package-Amount"] || "",
          data["cartoncount"] || 0,
          data["offset"] || 0,
          data["total in stock"] || 0,
          new Date(data["Timestamp"]).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          })
        ]]
      }
    });
    console.log("\u2705 Data added successfully");
    try {
      const sheetId = (_d = (_c = (_b = spreadsheetInfo.data.sheets) == null ? void 0 : _b.find((s) => {
        var _a2;
        return ((_a2 = s.properties) == null ? void 0 : _a2.title) === sheetName;
      })) == null ? void 0 : _c.properties) == null ? void 0 : _d.sheetId;
      if (sheetId !== void 0) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: { red: 0.2, green: 0.5, blue: 0.2 },
                      textFormat: {
                        foregroundColor: { red: 1, green: 1, blue: 1 },
                        bold: true
                      }
                    }
                  },
                  fields: "userEnteredFormat(backgroundColor,textFormat)"
                }
              },
              {
                autoResizeDimensions: {
                  dimensions: {
                    sheetId,
                    dimension: "COLUMNS",
                    startIndex: 0,
                    endIndex: 12
                  }
                }
              }
            ]
          }
        });
        console.log("\u2705 Formatting applied");
      }
    } catch (formatError) {
      console.warn("\u26A0\uFE0F Formatting failed (non-critical):", formatError);
    }
    return {
      success: true,
      message: `Inventory saved successfully to sheet "${sheetName}"`,
      data: {
        sheet_name: sheetName,
        row_number: nextRow,
        sheet_existed: sheetExists
      }
    };
  } catch (error) {
    console.error("\u274C Full error details:", {
      message: error.message,
      code: error.code,
      errors: error.errors,
      stack: error.stack
    });
    if (((_e = error.message) == null ? void 0 : _e.includes("JWT")) || ((_f = error.message) == null ? void 0 : _f.includes("token")) || ((_g = error.message) == null ? void 0 : _g.includes("iat"))) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentication failed - JWT token issue. Check server time synchronization."
      });
    }
    if (((_h = error.message) == null ? void 0 : _h.includes("key")) || ((_i = error.message) == null ? void 0 : _i.includes("keyFile"))) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentication failed - Private key not configured properly. Check GOOGLE_PRIVATE_KEY in .env file."
      });
    }
    if (error.code === 403 || ((_j = error.message) == null ? void 0 : _j.includes("permission"))) {
      throw createError({
        statusCode: 403,
        statusMessage: `Permission denied - Please ensure ${process.env.GOOGLE_CLIENT_EMAIL} has Editor access to the Google Sheet`
      });
    }
    if (error.code === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: "Google Sheet not found - Please check the Sheet ID in your configuration"
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Server error saving inventory"
    });
  }
});

export { inventory_post as default };
//# sourceMappingURL=inventory.post.mjs.map
