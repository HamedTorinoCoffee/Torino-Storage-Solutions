// server/api/sheets/outbound.post.ts
// API endpoint for Outbound (خروج انبار / ورود کافه) - نسخه کامل با Base64

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
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY_BASE64) {
      console.error('Missing credentials:', {
        hasEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
        hasBase64Key: !!process.env.GOOGLE_PRIVATE_KEY_BASE64
      })
      throw new Error('Missing Google credentials in environment variables')
    }

    // Import Google Sheets
    const { google } = await import('googleapis')
    
    // 🔥 NEW: Decode Base64 private key
    const privateKeyBase64 = process.env.GOOGLE_PRIVATE_KEY_BASE64
    const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8')
    
    console.log('🔑 Key decoded, length:', privateKey.length)
    console.log('🔑 Key starts with BEGIN:', privateKey.includes('BEGIN PRIVATE KEY'))
    
    // Build service account object
    const serviceAccount = {
      type: 'service_account' as const,
      project_id: process.env.GOOGLE_PROJECT_ID || 'torino-storage',
      private_key: privateKey,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLIENT_EMAIL || '')}`
    }
    
    // Use GoogleAuth with complete credentials
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    
    // Get authenticated client
    const authClient = await auth.getClient()
    
    // Create sheets instance
    const sheets = google.sheets({ version: 'v4', auth: authClient as any })
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
            'Scanned-By'
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

    // Format sheet (optional)
    try {
      const sheetId = spreadsheetInfo.data.sheets?.find(s => s.properties?.title === sheetName)?.properties?.sheetId
      
      if (sheetId !== undefined) {
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
                  fields: 'userEnteredFormat(backgroundColor,textFormat)'
                }
              },
              {
                autoResizeDimensions: {
                  dimensions: {
                    sheetId,
                    dimension: 'COLUMNS',
                    startIndex: 0,
                    endIndex: 12
                  }
                }
              }
            ]
          }
        })
        console.log('✅ Formatting applied')
      }
    } catch (formatError) {
      console.warn('⚠️ Formatting failed (non-critical):', formatError)
    }

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
      response: error.response?.data
    })
    
    // Provide specific error messages
    if (error.message?.includes('DECODER') || error.message?.includes('routines')) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Private key format error. Please check GOOGLE_PRIVATE_KEY_BASE64 environment variable.'
      })
    }
    
    if (error.message?.includes('JWT') || error.message?.includes('token')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication failed - JWT token issue.'
      })
    }
    
    if (error.code === 403) {
      throw createError({
        statusCode: 403,
        statusMessage: `Permission denied - Please ensure ${process.env.GOOGLE_CLIENT_EMAIL} has Editor access to the Google Sheet`
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Server error saving outbound'
    })
  }
})