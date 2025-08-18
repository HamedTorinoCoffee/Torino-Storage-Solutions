import { d as defineEventHandler } from '../../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import '@iconify/utils';
import 'node:crypto';
import 'consola';
import 'node:fs';
import 'node:path';

const testAuth_get = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e;
  try {
    console.log("\u{1F527} Testing Google Sheets authentication...");
    const hasClientEmail = !!process.env.GOOGLE_CLIENT_EMAIL;
    const hasPrivateKey = !!process.env.GOOGLE_PRIVATE_KEY;
    const hasProjectId = !!process.env.GOOGLE_PROJECT_ID;
    const hasSheetId = !!process.env.GOOGLE_SHEET_ID;
    console.log("Environment check:", {
      hasClientEmail,
      hasPrivateKey,
      hasProjectId,
      hasSheetId,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL
    });
    const serverTime = /* @__PURE__ */ new Date();
    console.log("Server time:", serverTime.toISOString());
    const { google } = await import('googleapis');
    const jwtClient = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: (_a = process.env.GOOGLE_PRIVATE_KEY) == null ? void 0 : _a.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
    console.log("Attempting to get access token...");
    await jwtClient.authorize();
    const token = await jwtClient.getAccessToken();
    console.log("Token obtained:", !!token);
    const sheets = google.sheets({ version: "v4", auth: jwtClient });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    console.log("Testing spreadsheet access...");
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "properties.title,sheets.properties.title"
    });
    const title = (_b = spreadsheetInfo.data.properties) == null ? void 0 : _b.title;
    const sheetNames = ((_c = spreadsheetInfo.data.sheets) == null ? void 0 : _c.map((s) => {
      var _a2;
      return (_a2 = s.properties) == null ? void 0 : _a2.title;
    })) || [];
    return {
      success: true,
      serverTime: serverTime.toISOString(),
      authentication: "Working",
      spreadsheet: {
        title,
        sheets: sheetNames
      },
      message: "Authentication is working correctly!"
    };
  } catch (error) {
    console.error("Test failed:", error);
    return {
      success: false,
      serverTime: (/* @__PURE__ */ new Date()).toISOString(),
      error: {
        message: error.message,
        code: error.code,
        type: error.constructor.name
      },
      hint: ((_d = error.message) == null ? void 0 : _d.includes("JWT")) ? "JWT error - Check server time synchronization" : ((_e = error.message) == null ? void 0 : _e.includes("permission")) ? `Permission error - Add ${process.env.GOOGLE_CLIENT_EMAIL} as Editor to your sheet` : "Unknown error - Check logs"
    };
  }
});

export { testAuth_get as default };
//# sourceMappingURL=test-auth.get.mjs.map
