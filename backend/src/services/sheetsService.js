const { getSheetsClient } = require('../config/googleConfig');

class SheetsService {
  async ensureSheetExists(spreadsheetId, sheetName) {
    const sheets = await getSheetsClient();
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    
    const exists = spreadsheet.data.sheets.some(
      s => s.properties.title === sheetName
    );

    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [{ addSheet: { properties: { title: sheetName } } }]
        }
      });

      const headers = ['Timestamp', 'Tipo', 'Código', 'Visitante', 'Residente', 'Casa', 'Fecha', 'Hora', 'Resultado', 'TipoServicio', 'FotoURL', 'Mes', 'Año'];
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:M1`,
        valueInputOption: 'RAW',
        resource: { values: [headers] }
      });
    }
  }

  async registerCode(data) {
    const { sheetId, sheetName, codigo, visitante, residente, casa, fecha, hora, mes, año } = data;
    await this.ensureSheetExists(sheetId, sheetName);
    
    const sheets = await getSheetsClient();
    const row = [new Date().toISOString(), 'CODIGO_QR', codigo, visitante, residente, casa, fecha, hora, 'ACTIVO', '', '', mes, año];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:M`,
      valueInputOption: 'RAW',
      resource: { values: [row] }
    });

    return { success: true, codigo, sheetName };
  }

  async registerWorker(data) {
    const { sheetId, sheetName, trabajador, tipo_servicio, casa, foto_url, fecha, hora, mes, año } = data;
    await this.ensureSheetExists(sheetId, sheetName);
    
    const sheets = await getSheetsClient();
    const row = [new Date().toISOString(), 'TRABAJADOR', '', trabajador, '', casa, fecha, hora, 'REGISTRADO', tipo_servicio, foto_url, mes, año];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:M`,
      valueInputOption: 'RAW',
      resource: { values: [row] }
    });

    return { success: true, sheetName };
  }

  async validateCode(spreadsheetId, codigo) {
    const sheets = await getSheetsClient();
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });

    for (const sheet of spreadsheet.data.sheets) {
      const sheetName = sheet.properties.title;
      if (!sheetName.startsWith('Registros_Casa_')) continue;

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:M`
      });

      const rows = response.data.values || [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[2] === codigo.toUpperCase() && row[8] === 'ACTIVO') {
          const created = new Date(row[0]);
          const hours = (new Date() - created) / (1000 * 60 * 60);

          if (hours > 24) {
            await this.updateStatus(spreadsheetId, sheetName, i + 1, 'EXPIRADO');
            return { status: 'DENEGADO', message: 'Código expirado' };
          }

          await this.updateStatus(spreadsheetId, sheetName, i + 1, 'VALIDADO');
          return { status: 'VALIDADO', nombre: row[3], casa: row[5] };
        }
      }
    }

    return { status: 'DENEGADO', message: 'Código no encontrado' };
  }

  async updateStatus(spreadsheetId, sheetName, rowIndex, status) {
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!I${rowIndex}`,
      valueInputOption: 'RAW',
      resource: { values: [[status]] }
    });
  }

  async getHistory(spreadsheetId, sheetName, casa) {
    await this.ensureSheetExists(spreadsheetId, sheetName);
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:M`
    });

    const rows = response.data.values || [];
    const codes = [];
    
    for (let i = rows.length - 1; i >= 1; i--) {
      const row = rows[i];
      if (row[5] === casa && row[1] === 'CODIGO_QR') {
        codes.push({
          code: row[2],
          visitante: row[3],
          residente: row[4],
          casa: row[5],
          fecha: row[6],
          hora: row[7],
          resultado: row[8]
        });
        if (codes.length >= 5) break;
      }
    }

    return codes;
  }

  async getCounters(spreadsheetId) {
    const sheets = await getSheetsClient();
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });

    let generados = 0, validados = 0, negados = 0;

    for (const sheet of spreadsheet.data.sheets) {
      const sheetName = sheet.properties.title;
      if (!sheetName.startsWith('Registros_Casa_')) continue;

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:M`
      });

      const rows = response.data.values || [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[1] === 'CODIGO_QR') {
          generados++;
          if (row[8] === 'VALIDADO') validados++;
          else if (row[8] === 'EXPIRADO') negados++;
        }
      }
    }

    return { generados, validados, negados };
  }
}

module.exports = new SheetsService();
