import { d as defineEventHandler } from '../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import '@iconify/utils';
import 'node:crypto';
import 'consola';
import 'node:fs';
import 'node:path';

const testEnv_get = defineEventHandler(async (event) => {
  return {
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
    GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    has_private_key: !!process.env.GOOGLE_PRIVATE_KEY,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
});

export { testEnv_get as default };
//# sourceMappingURL=test-env.get.mjs.map
