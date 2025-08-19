// server/api/sheets/inventory.post.ts
// نسخه جدید با Base64

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
                    columnCount: 15
                  }
                }
              }
            }
          ]
        }
      })

      // Add headers
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
    }

    // Get the last row
    const rangeData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`
    })

    const lastRow = rangeData.data.values ? rangeData.data.values.length : 1
    const nextRow = lastRow + 1
    const rowNumber = sheetExists ? lastRow : 1

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
          new Date(data['Timestamp']).toLocaleString('en-US')
        ]]
      }
    })

    console.log('✅ Data added successfully')

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
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    })
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Server error saving inventory'
    })
  }
})