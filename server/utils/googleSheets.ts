// server/utils/googleSheets.ts
import { google } from 'googleapis'

// تنظیمات Google Sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

// ساخت کلاینت Google Sheets
async function getGoogleSheetsClient() {
  try {
    const credentials = {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: '', // اختیاری
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: '', // اختیاری
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token'
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES
    })

    const sheets = google.sheets({ version: 'v4', auth })

    return sheets
  } catch (error) {
    console.error('خطا در اتصال به Google Sheets:', error)
    throw new Error('اتصال به Google Sheets برقرار نشد')
  }
}

// بررسی وجود worksheet برای کاربر (بر اساس ایمیل)
async function checkUserWorksheet(sheets: any, spreadsheetId: string, userEmail: string) {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties'
    })

    const worksheets = response.data.sheets
    // جستجو بر اساس ایمیل
    const userSheet = worksheets.find((sheet: any) => 
      sheet.properties.title === userEmail
    )

    return userSheet ? userSheet.properties.sheetId : null
  } catch (error) {
    console.error('خطا در بررسی worksheet:', error)
    return null
  }
}

// ساخت worksheet جدید برای کاربر (بر اساس ایمیل)
async function createUserWorksheet(sheets: any, spreadsheetId: string, userEmail: string) {
  try {
    // ساخت worksheet جدید با نام ایمیل
    const addSheetResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: userEmail, // ← نام sheet برابر ایمیل
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

    const newSheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId

    // اضافه کردن هدرها
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${userEmail}!A1:G1`, // یک ستون اضافه کردیم
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'ردیف',
          'ایمیل کاربر', // ← ستون جدید
          'کد اسکن شده', 
          'نوع کد',
          'تاریخ',
          'زمان',
          'نوع دستگاه'
        ]]
      }
    })

    // فرمت کردن هدرها
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: newSheetId,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                  textFormat: { bold: true },
                  horizontalAlignment: 'CENTER'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          }
        ]
      }
    })

    return newSheetId
  } catch (error) {
    console.error('خطا در ساخت worksheet:', error)
    throw new Error('worksheet جدید ساخته نشد')
  }
}

// اضافه کردن رکورد به worksheet
async function addScanToSheet(
  sheets: any, 
  spreadsheetId: string, 
  userEmail: string, 
  scanData: any
) {
  try {
    // تاریخ و زمان فارسی
    const now = new Date()
    const persianDate = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now)
    
    const persianTime = new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(now)

    // دریافت آخرین ردیف
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${userEmail}!A:A`
    })

    const rows = response.data.values || []
    const nextRowNumber = rows.length + 1
    const serialNumber = rows.length // ردیف اول هدر هست

    // اضافه کردن رکورد جدید
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${userEmail}!A${nextRowNumber}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          serialNumber,
          scanData.user_email, // ← ایمیل کاربر
          scanData.barcode_value,
          scanData.barcode_type,
          persianDate,
          persianTime,
          scanData.device_type || 'Web'
        ]]
      }
    })

    return { success: true, rowNumber: nextRowNumber }
  } catch (error) {
    console.error('خطا در اضافه کردن به sheet:', error)
    throw new Error('رکورد به sheet اضافه نشد')
  }
}

// تابع اصلی برای مدیریت کل فرآیند (آپدیت شده)
export async function handleUserScan(scanData: {
  user_full_name: string
  user_email: string
  user_sheet_name: string // ← فیلد جدید
  barcode_value: string
  barcode_type: string
  device_type: string
}) {
  try {
    console.log('🚀 شروع handleUserScan با داده:', scanData)
    
    const spreadsheetId = process.env.GOOGLE_SHEET_ID
    if (!spreadsheetId) {
      throw new Error('شناسه spreadsheet تنظیم نشده')
    }

    console.log('📊 اتصال به Google Sheets...')
    const sheets = await getGoogleSheetsClient()
    
    // استفاده از ایمیل برای نام sheet
    const userEmail = scanData.user_sheet_name || scanData.user_email

    // بررسی وجود worksheet کاربر
    console.log('🔍 بررسی وجود worksheet برای:', userEmail)
    let sheetId = await checkUserWorksheet(sheets, spreadsheetId, userEmail)

    // اگر worksheet وجود نداره، بسازش
    if (!sheetId) {
      console.log(`📝 ساخت worksheet جدید برای: ${userEmail}`)
      sheetId = await createUserWorksheet(sheets, spreadsheetId, userEmail)
    }

    // اضافه کردن رکورد
    console.log('💾 اضافه کردن رکورد به sheet...')
    const result = await addScanToSheet(sheets, spreadsheetId, userEmail, scanData)

    console.log('✅ موفقیت! داده به Google Sheets اضافه شد')
    return {
      success: true,
      message: 'اسکن با موفقیت به Google Sheets اضافه شد',
      sheetId,
      sheetName: userEmail,
      rowNumber: result.rowNumber
    }
  } catch (error) {
    console.error('❌ خطا در handleUserScan:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطای ناشناخته'
    }
  }
}

// Export کردن سایر توابع در صورت نیاز
export { getGoogleSheetsClient, checkUserWorksheet, createUserWorksheet, addScanToSheet }