// server/api/sheets/outbound.post.ts
// API endpoint for Outbound (خروج انبار / ورود کافه)

export default defineEventHandler(async (event) => {
  try {
    // Only accept POST method
    if (getMethod(event) !== 'POST') {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed'
      })
    }

    const body = await readBody(event)
    const { sheetName, data, isAdmin } = body

    console.log(`📦 Processing outbound for sheet: ${sheetName}`)
    console.log('👤 Is Admin:', isAdmin)
    console.log('📊 Data:', data)

    // Check environment variables
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Missing Google credentials in environment variables')
    }

    // Import Google Sheets
    const { google } = await import('googleapis')
    
    // Create auth with credentials
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    
    // Create sheets instance
    const sheets = google.sheets({ version: 'v4', auth })
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    if (!spreadsheetId) {
      throw new Error('Google Sheet ID is not configured')
    }

    // Check if sheet exists
    console.log('🔍 Checking if sheet exists...')
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties'
    })

    const existingSheets = spreadsheetInfo.data.sheets?.map(s => s.properties?.title) || []
    const sheetExists = existingSheets.includes(sheetName)

    console.log('📊 Existing sheets:', existingSheets)
    console.log(`📄 Sheet "${sheetName}" exists:`, sheetExists)

    // If sheet doesn't exist, create it
    if (!sheetExists) {
      console.log(`📝 Creating new sheet: ${sheetName}`)
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 12
                  }
                }
              }
            }
          ]
        }
      })

      // Add headers for cafe sheet
      console.log('📝 Adding headers...')
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:L1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Product',
            'Blend',
            'Origin',
            'Roast-Date',
            'Batch-Number',
            'Package-Weight',
            'Package-Amount',
            'Carton-Count',
            'Offset',
            'Total-In-Stock',
            'Timestamp',
            'Scanned-By'  // نشان میده توسط کی اسکن شده (Admin/Cafe)
          ]]
        }
      })

      console.log(`✅ Sheet "${sheetName}" created with headers`)
    }

    // Calculate amount based on user type
    // Admin = positive (ورودی برای کافه)
    // Cafe = negative (خروجی از کافه)
    const amount = isAdmin ? Math.abs(data['total-in-stock']) : -Math.abs(data['total-in-stock'])
    const scannedBy = isAdmin ? 'Admin' : 'Cafe'

    // Get the last row
    console.log('🔢 Getting last row...')
    const rangeData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`
    })

    const lastRow = rangeData.data.values ? rangeData.data.values.length : 1
    const nextRow = lastRow + 1

    console.log(`📍 Adding data to row ${nextRow}`)

    // Add new data
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A${nextRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          data['Product'] || '',
          data['Blend'] || '',
          data['Origin'] || '',
          data['Roast-Date'] || '',
          data['Batch-Number'] || '',
          data['Package-Weight'] || '',
          data['Package-Amount'] || '',
          data['cartoncount'] || 0,
          data['offset'] || 0,
          amount,  // مثبت برای ادمین، منفی برای کافه
          new Date(data['Timestamp']).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          scannedBy  // Admin یا Cafe
        ]]
      }
    })

    console.log('✅ Data added successfully')

    return {
      success: true,
      message: `Outbound saved successfully to sheet "${sheetName}"`,
      data: {
        sheet_name: sheetName,
        row_number: nextRow,
        amount: amount,
        scanned_by: scannedBy
      }
    }

  } catch (error: any) {
    console.error('❌ Full error details:', {
      message: error.message,
      code: error.code,
      errors: error.errors,
      stack: error.stack
    })
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Server error saving outbound'
    })
  }
})