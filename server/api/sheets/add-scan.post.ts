// server/api/sheets/add-scan.post.ts
// نسخه اصلاح شده با استفاده از user_sheet_name

export default defineEventHandler(async (event) => {
  try {
    // فقط POST method قبول کن
    if (getMethod(event) !== 'POST') {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed'
      })
    }

    const body = await readBody(event)
    const { 
      user_sheet_name,  // نام sheet کاربر
      user_email,
      user_full_name, 
      barcode_value, 
      barcode_type, 
      device_type,
      scanned_at 
    } = body

    // استفاده از user_sheet_name یا ایمیل به عنوان نام sheet
    const sheetName = user_sheet_name || user_email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '_') || `User_${Date.now()}`
    
    console.log(`📋 Processing scan for sheet: ${sheetName}`)
    console.log(`👤 User: ${user_full_name} (${user_email})`)
    console.log(`📱 Barcode: ${barcode_value} (${barcode_type})`)

    try {
      // Import Google Sheets
      const { google } = await import('googleapis')
      
      // تنظیمات اتصال
      const credentials = {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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

      // بررسی وجود sheet
      console.log('🔍 Checking if sheet exists...')
      const spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties'
      })

      const existingSheets = spreadsheetInfo.data.sheets?.map(s => s.properties?.title) || []
      const sheetExists = existingSheets.includes(sheetName)

      console.log('📊 Existing sheets:', existingSheets)
      console.log(`📄 Sheet "${sheetName}" exists:`, sheetExists)

      // اگر sheet وجود نداره، بسازش
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
                      columnCount: 10
                    }
                  }
                }
              }
            ]
          }
        })

        // اضافه کردن headers
        console.log('📝 Adding headers...')
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:G1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
              'ردیف',
              'نام کاربر',
              'ایمیل',
              'مقدار بارکد',
              'نوع بارکد',
              'دستگاه',
              'زمان اسکن'
            ]]
          }
        })

        console.log(`✅ Sheet "${sheetName}" created with headers`)
      }

      // دریافت آخرین ردیف
      console.log('🔢 Getting last row...')
      const rangeData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:A`
      })

      const lastRow = rangeData.data.values ? rangeData.data.values.length : 1
      const nextRow = lastRow + 1
      const rowNumber = sheetExists ? lastRow : 1 // شماره ردیف (بدون احتساب header)

      console.log(`📍 Adding data to row ${nextRow}`)

      // اضافه کردن داده جدید
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

      console.log('✅ Data added successfully')

      // فرمت کردن sheet (اختیاری)
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
        console.log('✅ Formatting applied')
      } catch (formatError) {
        console.warn('⚠️ Formatting failed (non-critical):', formatError)
      }

      return {
        success: true,
        message: `اسکن با موفقیت در sheet "${sheetName}" ذخیره شد`,
        data: {
          sheet_name: sheetName,
          row_number: nextRow,
          sheet_existed: sheetExists
        }
      }

    } catch (error) {
      console.error('❌ Google Sheets Error:', error)
      
      return {
        success: false,
        message: 'خطا در ذخیره در Google Sheets',
        error: error instanceof Error ? error.message : 'خطای نامشخص',
        error_details: error
      }
    }

  } catch (error) {
    console.error('❌ General Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'خطای سرور در ذخیره اسکن'
    })
  }
})