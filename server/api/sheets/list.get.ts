// server/api/sheets/list.get.ts
// API endpoint to get list of sheets (tabs) from Google Spreadsheet

import type { EventHandler } from 'h3'

export default defineEventHandler(async (event): Promise<any> => {
  try {
    // Check environment variables
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error('❌ Missing Google credentials')
      throw createError({
        statusCode: 500,
        statusMessage: 'Missing Google credentials in environment variables'
      })
    }

    // Import Google Sheets dynamically
    const { google } = await import('googleapis')
    
    // Create auth with credentials
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })
    
    // Create sheets instance
    const sheets = google.sheets({ version: 'v4', auth })
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    if (!spreadsheetId) {
      console.error('❌ No GOOGLE_SHEET_ID found')
      throw createError({
        statusCode: 500,
        statusMessage: 'Google Sheet ID is not configured'
      })
    }

    console.log('📋 Getting list of sheets from spreadsheet ID:', spreadsheetId)

    // Get spreadsheet info with better error handling
    let spreadsheetInfo
    try {
      spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties'
      })
    } catch (apiError: any) {
      console.error('❌ Google Sheets API Error:', {
        message: apiError.message,
        code: apiError.code,
        errors: apiError.errors
      })
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to access spreadsheet: ${apiError.message}`
      })
    }

    // Get all sheet names
    const allSheets = spreadsheetInfo.data.sheets?.map(sheet => ({
      id: sheet.properties?.sheetId,
      name: sheet.properties?.title || '',
      index: sheet.properties?.index || 0
    })) || []

    // Log all sheets found for debugging
    console.log('📊 All sheets found in spreadsheet:', allSheets.map(s => s.name).join(', '))

    // Filter out system sheets - Updated list based on your actual sheets
    const systemSheets = [
      'Sheet1', 
      'real-time inventory', 
      'QR Code Dashboard', 
      'QR DB',
      'Tabel',  // Added Tabel as it appears to be a system sheet
      'Table1'  // Added just in case
    ]
    
    const cafeSheets = allSheets.filter(sheet => {
      // Filter out system sheets (case-insensitive)
      const isSystemSheet = systemSheets.some(sysSheet => 
        sheet.name.toLowerCase() === sysSheet.toLowerCase()
      )
      return !isSystemSheet && sheet.name.trim() !== ''
    }).sort((a, b) => a.index - b.index)

    console.log('☕ Found cafe sheets:', cafeSheets.map(s => s.name).join(', '))
    console.log('📈 Total cafe sheets:', cafeSheets.length)

    // If no cafe sheets found, log warning
    if (cafeSheets.length === 0) {
      console.warn('⚠️ No cafe sheets found! All sheets:', allSheets.map(s => s.name))
    }

    return {
      success: true,
      sheets: cafeSheets,
      total: cafeSheets.length,
      // Include debug info in development
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          allSheets: allSheets.map(s => s.name),
          systemSheets,
          spreadsheetId
        }
      })
    }

  } catch (error: any) {
    console.error('❌ Error getting sheets list:', {
      message: error.message,
      stack: error.stack
    })
    
    // If error is already a Nuxt error, throw it as is
    if (error.statusCode) {
      throw error
    }
    
    // Otherwise create a new error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Server error getting sheets list'
    })
  }
})