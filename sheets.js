// Módulo de integração com Google Sheets para persistência de dados
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class SheetsDB {
  constructor(spreadsheetId, serviceAccount) {
    this.spreadsheetId = spreadsheetId;
    this.serviceAccount = serviceAccount || null;
    this.sheets = null;
    this.auth = null;
  }

  async init() {
    // Opção 1: Service Account injetada via parâmetro
    if (this.serviceAccount) {
      try {
        this.auth = new google.auth.GoogleAuth({
          credentials: this.serviceAccount,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
        console.log('📊 Google Sheets usando Service Account (injetada)');
        return true;
      } catch (error) {
        console.warn('⚠️  Erro ao usar Service Account injetada:', error.message);
      }
    }

    // Opção 2: Arquivo local
    const serviceAccountPath = path.join(__dirname, 'service-account.json');

    if (fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath));
        this.auth = new google.auth.GoogleAuth({
          credentials: serviceAccount,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
        console.log('📊 Google Sheets usando Service Account');
        return true;
      } catch (error) {
        console.warn('⚠️  Erro ao usar Service Account:', error.message);
      }
    }

    // Fallback: usar variável de ambiente GOOGLE_SERVICE_ACCOUNT
    if (process.env.GOOGLE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
        this.auth = new google.auth.GoogleAuth({
          credentials: serviceAccount,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
        console.log('📊 Google Sheets usando Service Account (env)');
        return true;
      } catch (error) {
        console.warn('⚠️  Erro ao usar Service Account do env:', error.message);
      }
    }

    console.warn('⚠️  Service Account não encontrada. Crie o arquivo service-account.json');
    return false;
  }

  // Garante que a aba existe, cria se não existir
  async ensureSheet(sheetName) {
    if (!this.sheets) return false;

    try {
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const sheetExists = spreadsheet.data.sheets.some(
        s => s.properties.title === sheetName
      );

      if (!sheetExists) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: { title: sheetName }
              }
            }]
          }
        });
        console.log(`📊 Aba '${sheetName}' criada`);
      }
      return true;
    } catch (error) {
      console.error(`Erro ao verificar/criar aba ${sheetName}:`, error.message);
      return false;
    }
  }

  // Salva estado completo em uma aba (sobrescreve)
  async saveState(sheetName, state) {
    if (!this.sheets) {
      throw new Error('Google Sheets não inicializado');
    }

    const ready = await this.ensureSheet(sheetName);
    if (!ready) {
      throw new Error('Não foi possível acessar a aba');
    }

    const stateJson = JSON.stringify(state);
    const timestamp = new Date().toISOString();

    // Formato: [timestamp, json_state]
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A1:B1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[timestamp, stateJson]]
      }
    });

    return { success: true, timestamp };
  }

  // Carrega estado de uma aba
  async loadState(sheetName) {
    if (!this.sheets) {
      return null;
    }

    try {
      const ready = await this.ensureSheet(sheetName);
      if (!ready) return null;

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:B1`
      });

      const values = response.data.values;
      if (!values || values.length === 0 || !values[0][1]) {
        return null;
      }

      return {
        timestamp: values[0][0],
        state: JSON.parse(values[0][1])
      };
    } catch (error) {
      if (error.code === 404 || error.message.includes('Unable to parse range')) {
        return null;
      }
      throw error;
    }
  }
}

module.exports = SheetsDB;
