// server/api/sheets/inventory.post.ts
// API endpoint for Real-Time Inventory management

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
    const { sheetName, data } = body

    console.log(`📦 Processing inventory for sheet: ${sheetName}`)
    console.log('📊 Data:', data)

    // Check environment variables
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Missing Google credentials in environment variables')
    }

    // Import Google Sheets
    const { google } = await import('googleapis')
    
    // Create auth with credentials - this is the working approach
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    
    // Create sheets instance with the auth directly
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
                    columnCount: 15
                  }
                }
              }
            }
          ]
        }
      })

      // Add headers for inventory sheet
      console.log('📝 Adding headers...')
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:L1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Row',
            'Product',
            'Blend',
            'Origin',
            'Roast-Date',
            'Batch-Number',
            'Package-Weight',
            'Package-Amount',
            'Carton Count',
            'Offset',
            'Total in Stock',
            'Timestamp'
          ]]
        }
      })

      console.log(`✅ Sheet "${sheetName}" created with headers`)
    }

    // Get the last row
    console.log('🔢 Getting last row...')
    const rangeData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`
    })

    const lastRow = rangeData.data.values ? rangeData.data.values.length : 1
    const nextRow = lastRow + 1
    const rowNumber = sheetExists ? lastRow : 1

    console.log(`📍 Adding data to row ${nextRow}`)

    // Add new data
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A${nextRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          rowNumber,
          data['Product'] || '',
          data['Blend'] || '',
          data['Origin'] || '',
          data['Roast-Date'] || '',
          data['Batch-Number'] || '',
          data['Package-Weight'] || '',
          data['Package-Amount'] || '',
          data['cartoncount'] || 0,
          data['offset'] || 0,
          data['total in stock'] || 0,
          new Date(data['Timestamp']).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
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
      message: `Inventory saved successfully to sheet "${sheetName}"`,
      data: {
        sheet_name: sheetName,
        row_number: nextRow,
        sheet_existed: sheetExists
      }
    }

  } catch (error: any) {
    console.error('❌ Full error details:', {
      message: error.message,
      code: error.code,
      errors: error.errors,
      stack: error.stack
    })
    
    // Provide more specific error messages
    if (error.message?.includes('JWT') || error.message?.includes('token') || error.message?.includes('iat')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication failed - JWT token issue. Check server time synchronization.'
      })
    }
    
    if (error.message?.includes('key') || error.message?.includes('keyFile')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication failed - Private key not configured properly. Check GOOGLE_PRIVATE_KEY in .env file.'
      })
    }
    
    if (error.code === 403 || error.message?.includes('permission')) {
      throw createError({
        statusCode: 403,
        statusMessage: `Permission denied - Please ensure ${process.env.GOOGLE_CLIENT_EMAIL} has Editor access to the Google Sheet`
      })
    }
    
    if (error.code === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Google Sheet not found - Please check the Sheet ID in your configuration'
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Server error saving inventory'
    })
  }
})