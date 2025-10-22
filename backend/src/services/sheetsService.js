const { getSheetsClient } = require('../config/googleConfig');

class SheetsService {
  async ensureSheetExists(spreadsheetId, sheetName) {
    try {
      const sheets = await getSheetsClient();
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });

      const exists = spreadsheet.data.sheets.some(
        s => s.properties.title === sheetName
      );

      if (!exists) {
        console.log(`📝 Creando hoja: ${sheetName} en spreadsheet: ${spreadsheetId}`);
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
        console.log(`✅ Hoja ${sheetName} creada exitosamente`);
      }
    } catch (error) {
      console.error(`❌ Error en ensureSheetExists:`, error.message);
      throw new Error(`No se pudo verificar/crear la hoja ${sheetName}: ${error.message}`);
    }
  }

  async registerCode(data) {
    try {
      const { sheetId, sheetName, codigo, visitante, residente, casa, fecha, hora, mes, año } = data;

      // Validar datos requeridos
      if (!sheetId || !sheetName || !codigo) {
        throw new Error('Faltan datos requeridos: sheetId, sheetName, codigo');
      }

      console.log(`📝 Registrando código: ${codigo} para casa ${casa}`);
      await this.ensureSheetExists(sheetId, sheetName);

      const sheets = await getSheetsClient();
      const row = [new Date().toISOString(), 'CODIGO_QR', codigo, visitante, residente, casa, fecha, hora, 'ACTIVO', '', '', mes, año];

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${sheetName}!A:M`,
        valueInputOption: 'RAW',
        resource: { values: [row] }
      });

      console.log(`✅ Código ${codigo} registrado exitosamente`);
      return { success: true, codigo, sheetName };
    } catch (error) {
      console.error(`❌ Error en registerCode:`, error.message);
      throw new Error(`No se pudo registrar el código: ${error.message}`);
    }
  }

  async registerWorker(data) {
    try {
      const { sheetId, sheetName, trabajador, tipo_servicio, casa, foto_url, fecha, hora, mes, año } = data;

      // Validar datos requeridos
      if (!sheetId || !sheetName || !trabajador) {
        throw new Error('Faltan datos requeridos: sheetId, sheetName, trabajador');
      }

      console.log(`📝 Registrando trabajador: ${trabajador} para casa ${casa}`);
      await this.ensureSheetExists(sheetId, sheetName);

      const sheets = await getSheetsClient();
      const row = [new Date().toISOString(), 'TRABAJADOR', '', trabajador, '', casa, fecha, hora, 'REGISTRADO', tipo_servicio, foto_url, mes, año];

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${sheetName}!A:M`,
        valueInputOption: 'RAW',
        resource: { values: [row] }
      });

      console.log(`✅ Trabajador ${trabajador} registrado exitosamente`);
      return { success: true, sheetName };
    } catch (error) {
      console.error(`❌ Error en registerWorker:`, error.message);
      throw new Error(`No se pudo registrar el trabajador: ${error.message}`);
    }
  }

  async validateCode(spreadsheetId, codigo) {
    try {
      // Validar datos requeridos
      if (!spreadsheetId || !codigo) {
        throw new Error('Faltan datos requeridos: spreadsheetId, codigo');
      }

      console.log(`🔍 Validando código: ${codigo}`);
      const sheets = await getSheetsClient();
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });

      for (const sheet of spreadsheet.data.sheets) {
        const sheetName = sheet.properties.title;
        // Buscar en todas las hojas de registros por condominio
        if (!sheetName.startsWith('Registros_')) continue;

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
              console.log(`⏰ Código ${codigo} expirado (${hours.toFixed(1)} horas)`);
              return { status: 'DENEGADO', message: 'Código expirado' };
            }

            await this.updateStatus(spreadsheetId, sheetName, i + 1, 'VALIDADO');
            console.log(`✅ Código ${codigo} validado para casa ${row[5]}`);
            return { status: 'VALIDADO', nombre: row[3], casa: row[5] };
          }
        }
      }

      console.log(`❌ Código ${codigo} no encontrado`);
      return { status: 'DENEGADO', message: 'Código no encontrado' };
    } catch (error) {
      console.error(`❌ Error en validateCode:`, error.message);
      throw new Error(`No se pudo validar el código: ${error.message}`);
    }
  }

  async updateStatus(spreadsheetId, sheetName, rowIndex, status) {
    try {
      const sheets = await getSheetsClient();
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!I${rowIndex}`,
        valueInputOption: 'RAW',
        resource: { values: [[status]] }
      });
      console.log(`🔄 Estado actualizado a ${status} en fila ${rowIndex}`);
    } catch (error) {
      console.error(`❌ Error en updateStatus:`, error.message);
      throw new Error(`No se pudo actualizar el estado: ${error.message}`);
    }
  }

  async getHistory(spreadsheetId, sheetName, casa) {
    try {
      // Validar datos requeridos
      if (!spreadsheetId || !sheetName || !casa) {
        throw new Error('Faltan datos requeridos: spreadsheetId, sheetName, casa');
      }

      console.log(`📜 Obteniendo historial para casa ${casa}`);
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

      console.log(`✅ Historial obtenido: ${codes.length} códigos encontrados`);
      return codes;
    } catch (error) {
      console.error(`❌ Error en getHistory:`, error.message);
      throw new Error(`No se pudo obtener el historial: ${error.message}`);
    }
  }

  async getCounters(spreadsheetId) {
    try {
      // Validar datos requeridos
      if (!spreadsheetId) {
        throw new Error('Falta dato requerido: spreadsheetId');
      }

      console.log(`📊 Obteniendo contadores para spreadsheet ${spreadsheetId}`);
      const sheets = await getSheetsClient();
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });

      let generados = 0, validados = 0, negados = 0;

      for (const sheet of spreadsheet.data.sheets) {
        const sheetName = sheet.properties.title;
        // Buscar en todas las hojas de registros por condominio
        if (!sheetName.startsWith('Registros_')) continue;

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

      console.log(`✅ Contadores: ${generados} generados, ${validados} validados, ${negados} negados`);
      return { generados, validados, negados };
    } catch (error) {
      console.error(`❌ Error en getCounters:`, error.message);
      throw new Error(`No se pudieron obtener los contadores: ${error.message}`);
    }
  }
}

module.exports = new SheetsService();
