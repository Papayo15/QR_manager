/**
 * EJEMPLO DE CÓDIGO BACKEND PARA NOTIFICACIONES PUSH
 *
 * Este archivo contiene el código que debe agregarse al backend
 * para enviar notificaciones push cuando un código QR es validado.
 *
 * Backend URL: https://qr-manager-3z8x.onrender.com
 */

// ==========================================
// 1. INSTALAR DEPENDENCIA EN EL BACKEND
// ==========================================
// npm install expo-server-sdk


// ==========================================
// 2. CREAR TABLA EN LA BASE DE DATOS
// ==========================================
/*
-- SQL para crear tabla de tokens de notificación
CREATE TABLE IF NOT EXISTS push_tokens (
  id SERIAL PRIMARY KEY,
  house_number VARCHAR(10) NOT NULL,
  condominio VARCHAR(100) NOT NULL,
  push_token TEXT NOT NULL,
  platform VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(house_number, condominio)
);
*/


// ==========================================
// 3. AGREGAR ENDPOINT PARA REGISTRAR TOKENS
// ==========================================
/*
const express = require('express');
const router = express.Router();

// POST /api/register-push-token
router.post('/register-push-token', async (req, res) => {
  try {
    const { houseNumber, condominio, pushToken, platform } = req.body;

    if (!houseNumber || !condominio || !pushToken) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros requeridos'
      });
    }

    // Guardar o actualizar el token en la base de datos
    const query = `
      INSERT INTO push_tokens (house_number, condominio, push_token, platform, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (house_number, condominio)
      DO UPDATE SET
        push_token = EXCLUDED.push_token,
        platform = EXCLUDED.platform,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await pool.query(query, [
      houseNumber,
      condominio,
      pushToken,
      platform || 'unknown'
    ]);

    console.log('✅ Token registrado:', result.rows[0]);

    res.json({
      success: true,
      message: 'Token registrado correctamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error registrando token:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
*/


// ==========================================
// 4. SERVICIO PARA ENVIAR NOTIFICACIONES
// ==========================================
/*
const { Expo } = require('expo-server-sdk');

class NotificationService {
  constructor() {
    this.expo = new Expo();
  }

  async sendNotificationToResident(houseNumber, condominio, message, data = {}) {
    try {
      // Obtener el token del residente desde la base de datos
      const query = `
        SELECT push_token, platform
        FROM push_tokens
        WHERE house_number = $1 AND condominio = $2
      `;

      const result = await pool.query(query, [houseNumber, condominio]);

      if (result.rows.length === 0) {
        console.log('⚠️ No se encontró token para:', houseNumber, condominio);
        return { success: false, error: 'No se encontró token' };
      }

      const { push_token } = result.rows[0];

      // Verificar que el token es válido
      if (!Expo.isExpoPushToken(push_token)) {
        console.error('❌ Token inválido:', push_token);
        return { success: false, error: 'Token inválido' };
      }

      // Crear el mensaje de notificación
      const notification = {
        to: push_token,
        sound: 'default',
        title: '🔔 Código QR Utilizado',
        body: message,
        data: {
          ...data,
          type: 'qr_validated',
          houseNumber,
          condominio
        },
        badge: 1,
        priority: 'high',
        channelId: 'default'
      };

      // Enviar la notificación
      const chunks = this.expo.chunkPushNotifications([notification]);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('❌ Error enviando chunk:', error);
        }
      }

      console.log('✅ Notificación enviada:', tickets);

      return {
        success: true,
        tickets
      };

    } catch (error) {
      console.error('❌ Error en sendNotificationToResident:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const notificationService = new NotificationService();
module.exports = notificationService;
*/


// ==========================================
// 5. MODIFICAR EL ENDPOINT DE VALIDACIÓN
// ==========================================
/*
// En el archivo donde está el endpoint /api/validate-qr
// Agregar esta línea después de validar exitosamente el código:

const notificationService = require('./services/notificationService');

router.post('/validate-qr', async (req, res) => {
  try {
    const { code } = req.body;

    // ... código existente de validación ...

    if (validado) {
      // AGREGAR ESTA SECCIÓN PARA ENVIAR NOTIFICACIÓN
      const notificationMessage = `Tu código ${code} fue utilizado por la vigilancia en Casa ${casa}`;

      await notificationService.sendNotificationToResident(
        casa,
        condominio,
        notificationMessage,
        {
          code,
          validatedAt: new Date().toISOString(),
          visitante,
          residente
        }
      );

      // ... resto del código ...
    }

    res.json({
      success: true,
      data: {
        // ... respuesta existente ...
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});
*/


// ==========================================
// 6. TESTING - ENDPOINT DE PRUEBA
// ==========================================
/*
// Endpoint para probar notificaciones manualmente
router.post('/test-notification', async (req, res) => {
  try {
    const { houseNumber, condominio, message } = req.body;

    const result = await notificationService.sendNotificationToResident(
      houseNumber,
      condominio,
      message || 'Esta es una notificación de prueba',
      { test: true }
    );

    res.json(result);

  } catch (error) {
    console.error('Error en test-notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
*/


// ==========================================
// 7. MANEJO DE ERRORES Y TICKETS
// ==========================================
/*
// Crear un cron job para verificar los receipts de las notificaciones enviadas
// y limpiar tokens inválidos

const { Expo } = require('expo-server-sdk');

async function checkNotificationReceipts(tickets) {
  const expo = new Expo();
  const receiptIds = tickets
    .filter(ticket => ticket.id)
    .map(ticket => ticket.id);

  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

  for (const chunk of receiptIdChunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

      for (const receiptId in receipts) {
        const receipt = receipts[receiptId];

        if (receipt.status === 'error') {
          console.error('❌ Error en notificación:', receipt);

          // Si el token es inválido, eliminarlo de la base de datos
          if (receipt.details?.error === 'DeviceNotRegistered') {
            // Eliminar token de la base de datos
            console.log('🗑️ Eliminando token inválido');
          }
        }
      }
    } catch (error) {
      console.error('Error obteniendo receipts:', error);
    }
  }
}
*/


// ==========================================
// RESUMEN DE PASOS
// ==========================================
/*
1. ✅ Instalar dependencia: npm install expo-server-sdk
2. ✅ Crear tabla push_tokens en la base de datos
3. ✅ Agregar endpoint POST /api/register-push-token
4. ✅ Crear servicio de notificaciones (notificationService.js)
5. ✅ Modificar endpoint /api/validate-qr para enviar notificaciones
6. ✅ (Opcional) Crear endpoint de prueba /api/test-notification
7. ✅ (Opcional) Implementar verificación de receipts

NOTAS IMPORTANTES:
- Las notificaciones push SOLO funcionan en dispositivos físicos
- No funcionan en el simulador/emulador
- Requiere que las apps estén compiladas con expo-notifications
- El token expoPushToken se genera cuando la app se instala
*/
