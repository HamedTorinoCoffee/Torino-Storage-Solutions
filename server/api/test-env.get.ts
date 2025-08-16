export default defineEventHandler(async (event) => {
  return {
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
    GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    has_private_key: !!process.env.GOOGLE_PRIVATE_KEY,
    timestamp: new Date().toISOString()
  }
})