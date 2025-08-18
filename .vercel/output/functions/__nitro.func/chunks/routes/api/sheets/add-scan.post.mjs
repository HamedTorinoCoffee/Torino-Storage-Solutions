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

const addScan_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  try {
    if (getMethod(event) !== "POST") {
      throw createError({
        statusCode: 405,
        statusMessage: "Method Not Allowed"
      });
    }
    const body = await readBody(event);
    const {
      user_sheet_name,
      // نام sheet کاربر
      user_email,
      user_full_name,
      barcode_value,
      barcode_type,
      device_type,
      scanned_at
    } = body;
    const sheetName = user_sheet_name || ((_a = user_email == null ? void 0 : user_email.split("@")[0]) == null ? void 0 : _a.replace(/[^a-zA-Z0-9_]/g, "_")) || `User_${Date.now()}`;
    console.log(`\u{1F4CB} Processing scan for sheet: ${sheetName}`);
    console.log(`\u{1F464} User: ${user_full_name} (${user_email})`);
    console.log(`\u{1F4F1} Barcode: ${barcode_value} (${barcode_type})`);
    try {
      const { google } = await import('googleapis');
      const credentials = {
        type: "service_account",
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: (_b = process.env.GOOGLE_PRIVATE_KEY) == null ? void 0 : _b.replace(/\\n/g, "\n"),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token"
      };
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"]
      });
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;
      console.log("\u{1F50D} Checking if sheet exists...");
      const spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets.properties"
      });
      const existingSheets = ((_c = spreadsheetInfo.data.sheets) == null ? void 0 : _c.map((s) => {
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
                      columnCount: 10
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
          range: `${sheetName}!A1:G1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[
              "\u0631\u062F\u06CC\u0641",
              "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631",
              "\u0627\u06CC\u0645\u06CC\u0644",
              "\u0645\u0642\u062F\u0627\u0631 \u0628\u0627\u0631\u06A9\u062F",
              "\u0646\u0648\u0639 \u0628\u0627\u0631\u06A9\u062F",
              "\u062F\u0633\u062A\u06AF\u0627\u0647",
              "\u0632\u0645\u0627\u0646 \u0627\u0633\u06A9\u0646"
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
            user_full_name,
            user_email,
            barcode_value,
            barcode_type,
            device_type,
            new Date(scanned_at).toLocaleString("fa-IR", {
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
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId: (_f = (_e = (_d = spreadsheetInfo.data.sheets) == null ? void 0 : _d.find((s) => {
                      var _a2;
                      return ((_a2 = s.properties) == null ? void 0 : _a2.title) === sheetName;
                    })) == null ? void 0 : _e.properties) == null ? void 0 : _f.sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
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
                    sheetId: (_i = (_h = (_g = spreadsheetInfo.data.sheets) == null ? void 0 : _g.find((s) => {
                      var _a2;
                      return ((_a2 = s.properties) == null ? void 0 : _a2.title) === sheetName;
                    })) == null ? void 0 : _h.properties) == null ? void 0 : _i.sheetId,
                    dimension: "COLUMNS",
                    startIndex: 0,
                    endIndex: 7
                  }
                }
              }
            ]
          }
        });
        console.log("\u2705 Formatting applied");
      } catch (formatError) {
        console.warn("\u26A0\uFE0F Formatting failed (non-critical):", formatError);
      }
      return {
        success: true,
        message: `\u0627\u0633\u06A9\u0646 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062F\u0631 sheet "${sheetName}" \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F`,
        data: {
          sheet_name: sheetName,
          row_number: nextRow,
          sheet_existed: sheetExists
        }
      };
    } catch (error) {
      console.error("\u274C Google Sheets Error:", error);
      return {
        success: false,
        message: "\u062E\u0637\u0627 \u062F\u0631 \u0630\u062E\u06CC\u0631\u0647 \u062F\u0631 Google Sheets",
        error: error instanceof Error ? error.message : "\u062E\u0637\u0627\u06CC \u0646\u0627\u0645\u0634\u062E\u0635",
        error_details: error
      };
    }
  } catch (error) {
    console.error("\u274C General Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u062E\u0637\u0627\u06CC \u0633\u0631\u0648\u0631 \u062F\u0631 \u0630\u062E\u06CC\u0631\u0647 \u0627\u0633\u06A9\u0646"
    });
  }
});

export { addScan_post as default };
//# sourceMappingURL=add-scan.post.mjs.map
