﻿// server/api/sheets/add-scan.post.ts
// Ù†Ø³Ø®Ù‡ Ø§ØµÙ„Ø§Ø­ Ø´Ø¯Ù‡ Ø¨Ø§ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ø§Ø² user_sheet_name

export default defineEventHandler(async (event) => {
  try {
    // ÙÙ‚Ø· POST method Ù‚Ø¨ÙˆÙ„ Ú©Ù†
    if (getMethod(event) !== 'POST') {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed'
      })
    }

    const body = await readBody(event)
    const { 
      user_sheet_name,  // Ù†Ø§Ù… sheet Ú©Ø§Ø±Ø¨Ø±
      user_email,
      user_full_name, 
      barcode_value, 
      barcode_type, 
      device_type,
      scanned_at 
    } = body

    // Ø§Ø³ØªÙØ§Ø¯Ù‡ Ø§Ø² user_sheet_name ÛŒØ§ Ø§ÛŒÙ…ÛŒÙ„ Ø¨Ù‡ Ø¹Ù†ÙˆØ§Ù† Ù†Ø§Ù… sheet
    const sheetName = user_sheet_name || user_email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '_') || `User_${Date.now()}`
    
    console.log(`ðŸ“‹ Processing scan for sheet: ${sheetName}`)
    console.log(`ðŸ‘¤ User: ${user_full_name} (${user_email})`)
    console.log(`ðŸ“± Barcode: ${barcode_value} (${barcode_type})`)

    try {
      // Import Google Sheets
      const { google } = await import('googleapis')
      
      // ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø§ØªØµØ§Ù„
      const credentials = {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY_BASE64?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token'
      }

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      })

      const sheets = google.sheets({ version: 'v4', auth })
      const spreadsheetId = process.env.GOOGLE_SHEET_ID

      // Ø¨Ø±Ø±Ø³ÛŒ ÙˆØ¬ÙˆØ¯ sheet
      console.log('ðŸ” Checking if sheet exists...')
      const spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties'
      })

      const existingSheets = spreadsheetInfo.data.sheets?.map(s => s.properties?.title) || []
      const sheetExists = existingSheets.includes(sheetName)

      console.log('ðŸ“Š Existing sheets:', existingSheets)
      console.log(`ðŸ“„ Sheet "${sheetName}" exists:`, sheetExists)

      // Ø§Ú¯Ø± sheet ÙˆØ¬ÙˆØ¯ Ù†Ø¯Ø§Ø±Ù‡ØŒ Ø¨Ø³Ø§Ø²Ø´
      if (!sheetExists) {
        console.log(`ðŸ“ Creating new sheet: ${sheetName}`)
        
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
                      columnCount: 10
                    }
                  }
                }
              }
            ]
          }
        })

        // Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù† headers
        console.log('ðŸ“ Adding headers...')
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:G1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
              'Ø±Ø¯ÛŒÙ',
              'Ù†Ø§Ù… Ú©Ø§Ø±Ø¨Ø±',
              'Ø§ÛŒÙ…ÛŒÙ„',
              'Ù…Ù‚Ø¯Ø§Ø± Ø¨Ø§Ø±Ú©Ø¯',
              'Ù†ÙˆØ¹ Ø¨Ø§Ø±Ú©Ø¯',
              'Ø¯Ø³ØªÚ¯Ø§Ù‡',
              'Ø²Ù…Ø§Ù† Ø§Ø³Ú©Ù†'
            ]]
          }
        })

        console.log(`âœ… Sheet "${sheetName}" created with headers`)
      }

      // Ø¯Ø±ÛŒØ§ÙØª Ø¢Ø®Ø±ÛŒÙ† Ø±Ø¯ÛŒÙ
      console.log('ðŸ”¢ Getting last row...')
      const rangeData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:A`
      })

      const lastRow = rangeData.data.values ? rangeData.data.values.length : 1
      const nextRow = lastRow + 1
      const rowNumber = sheetExists ? lastRow : 1 // Ø´Ù…Ø§Ø±Ù‡ Ø±Ø¯ÛŒÙ (Ø¨Ø¯ÙˆÙ† Ø§Ø­ØªØ³Ø§Ø¨ header)

      console.log(`ðŸ“ Adding data to row ${nextRow}`)

      // Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù† Ø¯Ø§Ø¯Ù‡ Ø¬Ø¯ÛŒØ¯
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A${nextRow}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            rowNumber,
            user_full_name,
            user_email,
            barcode_value,
            barcode_type,
            device_type,
            new Date(scanned_at).toLocaleString('fa-IR', {
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

      console.log('âœ… Data added successfully')

      // ÙØ±Ù…Øª Ú©Ø±Ø¯Ù† sheet (Ø§Ø®ØªÛŒØ§Ø±ÛŒ)
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId: spreadsheetInfo.data.sheets?.find(s => s.properties?.title === sheetName)?.properties?.sheetId,
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
                  fields: 'userEnteredFormat(backgroundColor,textFormat)'
                }
              },
              {
                autoResizeDimensions: {
                  dimensions: {
                    sheetId: spreadsheetInfo.data.sheets?.find(s => s.properties?.title === sheetName)?.properties?.sheetId,
                    dimension: 'COLUMNS',
                    startIndex: 0,
                    endIndex: 7
                  }
                }
              }
            ]
          }
        })
        console.log('âœ… Formatting applied')
      } catch (formatError) {
        console.warn('âš ï¸ Formatting failed (non-critical):', formatError)
      }

      return {
        success: true,
        message: `Ø§Ø³Ú©Ù† Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª Ø¯Ø± sheet "${sheetName}" Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯`,
        data: {
          sheet_name: sheetName,
          row_number: nextRow,
          sheet_existed: sheetExists
        }
      }

    } catch (error) {
      console.error('âŒ Google Sheets Error:', error)
      
      return {
        success: false,
        message: 'Ø®Ø·Ø§ Ø¯Ø± Ø°Ø®ÛŒØ±Ù‡ Ø¯Ø± Google Sheets',
        error: error instanceof Error ? error.message : 'Ø®Ø·Ø§ÛŒ Ù†Ø§Ù…Ø´Ø®Øµ',
        error_details: error
      }
    }

  } catch (error) {
    console.error('âŒ General Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Ø®Ø·Ø§ÛŒ Ø³Ø±ÙˆØ± Ø¯Ø± Ø°Ø®ÛŒØ±Ù‡ Ø§Ø³Ú©Ù†'
    })
  }
})
