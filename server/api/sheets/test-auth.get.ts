// server/api/sheets/test-auth.get.ts
// Test endpoint to verify Google Sheets authentication

export default defineEventHandler(async (event) => {
  try {
    console.log('ðŸ”§ Testing Google Sheets authentication...')
    
    // Check environment variables
    const hasClientEmail = !!process.env.GOOGLE_CLIENT_EMAIL
    const hasPrivateKey = !!process.env.GOOGLE_PRIVATE_KEY_BASE64
    const hasProjectId = !!process.env.GOOGLE_PROJECT_ID
    const hasSheetId = !!process.env.GOOGLE_SHEET_ID
    
    console.log('Environment check:', {
      hasClientEmail,
      hasPrivateKey,
      hasProjectId,
      hasSheetId,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL
    })
    
    // Check server time
    const serverTime = new Date()
    console.log('Server time:', serverTime.toISOString())
    
    // Import and test authentication
    const { google } = await import('googleapis')
    
    // Create a new JWT client - using object syntax for TypeScript compatibility
    const jwtClient = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY_BASE64?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })
    
    // Try to get an access token
    console.log('Attempting to get access token...')
    await jwtClient.authorize()
    const token = await jwtClient.getAccessToken()
    console.log('Token obtained:', !!token)
    
    // Try to access the spreadsheet
    const sheets = google.sheets({ version: 'v4', auth: jwtClient })
    const spreadsheetId = process.env.GOOGLE_SHEET_ID
    
    console.log('Testing spreadsheet access...')
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId!,
      fields: 'properties.title,sheets.properties.title'
    })
    
    const title = spreadsheetInfo.data.properties?.title
    const sheetNames = spreadsheetInfo.data.sheets?.map(s => s.properties?.title) || []
    
    return {
      success: true,
      serverTime: serverTime.toISOString(),
      authentication: 'Working',
      spreadsheet: {
        title,
        sheets: sheetNames
      },
      message: 'Authentication is working correctly!'
    }
    
  } catch (error: any) {
    console.error('Test failed:', error)
    
    return {
      success: false,
      serverTime: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code,
        type: error.constructor.name
      },
      hint: error.message?.includes('JWT') 
        ? 'JWT error - Check server time synchronization' 
        : error.message?.includes('permission')
        ? `Permission error - Add ${process.env.GOOGLE_CLIENT_EMAIL} as Editor to your sheet`
        : 'Unknown error - Check logs'
    }
  }
})
