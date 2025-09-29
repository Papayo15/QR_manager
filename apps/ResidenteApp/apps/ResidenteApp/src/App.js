import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CONFIG = {
  BACKEND_URL: 'https://qr-manager-3z8x.onrender.com',
  QR_CODE_SIZE: 200,
  ALPHA_CODE_LENGTH: 6,
  SHEETS: {
    RESIDENTE: '1dK5inIIoSy3939I3IZlR2ewWBq4oJH4pNdRZALEJD9M'
  }
};

const COLORS = {
  PRIMARY: '#2196F3',
  SECONDARY: '#4CAF50',
  ERROR: '#F44336',
  BACKGROUND: '#F5F5F5',
  SURFACE: '#FFFFFF',
  TEXT_PRIMARY: '#212121',
  TEXT_SECONDARY: '#757575',
  BORDER: '#E0E0E0'
};

const logger = {
  info: (tag, message, data = null) => {
    console.log(`[INFO] [${tag}] ${message}`, data || '');
  },
  error: (tag, message, error = null) => {
    console.error(`[ERROR] [${tag}] ${message}`, error || '');
  }
};

const generateAlphaCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  logger.info('CodeGenerator', 'Código generado', result);
  return result;
};

const formatDate = () => new Date().toLocaleDateString('es-MX');
const formatTime = () => new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });

const ResidenteApp = () => {
  const [formData, setFormData] = useState({
    residenteNombre: '',
    visitanteNombre: '',
    numeroCasa: '',
    telefono: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [alphaCode, setAlphaCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    logger.info('App', 'Inicializando ResidenteApp');
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      logger.info('Network', `Estado de red: ${state.isConnected ? 'Conectado' : 'Desconectado'}`);
    });
    return () => unsubscribe();
  }, []);

  const validateForm = () => {
    logger.info('Validation', 'Validando formulario');
    const newErrors = {};
    
    if (!formData.residenteNombre.trim()) {
      newErrors.residenteNombre = 'El nombre del residente es requerido';
    }
    
    if (!formData.visitanteNombre.trim()) {
      newErrors.visitanteNombre = 'El nombre del visitante es requerido';
    }
    
    if (!formData.numeroCasa.trim()) {
      newErrors.numeroCasa = 'El número de casa es requerido';
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    logger.info('Validation', `Formulario ${isValid ? 'válido' : 'inválido'}`, newErrors);
    return isValid;
  };

  const saveToGoogleSheets = async (qrDataObj) => {
    try {
      logger.info('GoogleSheets', 'Intentando guardar en Google Sheets');
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/sheets/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId: CONFIG.SHEETS.RESIDENTE,
          data: qrDataObj
        })
      });
      
      const success = response.ok;
      logger.info('GoogleSheets', `Guardado ${success ? 'exitoso' : 'fallido'}`);
      return success;
    } catch (error) {
      logger.error('GoogleSheets', 'Error al guardar', error);
      return false;
    }
  };

  const sendWhatsApp = async (qrDataObj, code) => {
    if (!formData.telefono.trim()) {
      logger.info('WhatsApp', 'No hay teléfono, omitiendo envío');
      return;
    }
    
    logger.info('WhatsApp', 'Preparando mensaje de WhatsApp');
    const message = `🏠 *ACCESO AUTORIZADO*

📝 *Detalles del Visitante:*
- Visitante: ${qrDataObj.visitante}
- Casa: ${qrDataObj.casa}
- Autorizado por: ${qrDataObj.residente}
- Fecha: ${qrDataObj.fecha}
- Hora: ${qrDataObj.hora}

🔐 *Código de Acceso:*
${code}

⚠️ *Importante:*
- Mostrar este código al vigilante
- Válido por 24 horas

🏘️ _Sistema de Control de Acceso_`;

    const cleanNumber = formData.telefono.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
    
    try {
      await Linking.openURL(url);
      logger.info('WhatsApp', 'WhatsApp abierto correctamente');
    } catch (error) {
      logger.error('WhatsApp', 'Error al abrir WhatsApp', error);
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    }
  };

  const generateQRCode = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    logger.info('QRGeneration', 'Iniciando generación de código QR');
    
    try {
      const code = generateAlphaCode(CONFIG.ALPHA_CODE_LENGTH);
      setAlphaCode(code);

      const qrDataObj = {
        residente: formData.residenteNombre.trim(),
        visitante: formData.visitanteNombre.trim(),
        casa: formData.numeroCasa.trim(),
        codigo: code,
        fecha: formatDate(),
        hora: formatTime(),
      };

      logger.info('QRGeneration', 'Datos del QR', qrDataObj);

      const qrString = JSON.stringify({
        tipo: 'visitante',
        ...qrDataObj,
        timestamp: new Date().toISOString(),
        version: '1.0'
      });

      setQrData(qrString);

      if (isConnected) {
        logger.info('QRGeneration', 'Guardando en línea');
        await saveToGoogleSheets(qrDataObj);
      } else {
        logger.info('QRGeneration', 'Guardando offline');
        const offlineData = await AsyncStorage.getItem('@qr_offline') || '[]';
        const parsedData = JSON.parse(offlineData);
        parsedData.push(qrDataObj);
        await AsyncStorage.setItem('@qr_offline', JSON.stringify(parsedData));
      }

      await sendWhatsApp(qrDataObj, code);

      Alert.alert(
        'Código QR Generado',
        `Código de acceso: ${code}\n\n${isConnected ? 'Guardado en línea' : 'Guardado offline'}`,
        [{ text: 'OK' }]
      );

      logger.info('QRGeneration', 'Proceso completado exitosamente');

    } catch (error) {
      logger.error('QRGeneration', 'Error en generación', error);
      Alert.alert('Error', 'Hubo un problema al generar el código QR');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    logger.info('Form', 'Reseteando formulario');
    setFormData({
      residenteNombre: '',
      visitanteNombre: '',
      numeroCasa: '',
      telefono: '',
    });
    setErrors({});
    setQrData(null);
    setAlphaCode('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderInput = (label, field, placeholder, keyboardType = 'default') => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[field] && styles.inputError]}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT_SECONDARY}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'phone-pad' ? 'none' : 'words'}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.header}>
              <Text style={styles.title}>Control de Acceso</Text>
              <Text style={styles.subtitle}>Generar código QR para visitantes</Text>
              <View style={[styles.connectionStatus, isConnected ? styles.online : styles.offline]}>
                <Text style={styles.connectionText}>
                  {isConnected ? '🟢 En línea' : '🔴 Sin conexión'}
                </Text>
              </View>
            </View>

            <View style={styles.form}>
              {renderInput('Nombre del Residente *', 'residenteNombre', 'Ingresa tu nombre completo')}
              {renderInput('Nombre del Visitante *', 'visitanteNombre', 'Nombre de la persona que visitará')}
              {renderInput('Número de Casa *', 'numeroCasa', 'Ej: 123, A-45, etc.')}
              {renderInput('Teléfono (Opcional)', 'telefono', 'Para enviar código por WhatsApp', 'phone-pad')}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.generateButton, loading && styles.buttonDisabled]}
                onPress={generateQRCode}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Generando...' : 'Generar Código QR'}
                </Text>
              </TouchableOpacity>

              {qrData && (
                <TouchableOpacity
                  style={[styles.button, styles.resetButton]}
                  onPress={resetForm}
                >
                  <Text style={[styles.buttonText, styles.resetButtonText]}>Nuevo Código</Text>
                </TouchableOpacity>
              )}
            </View>

            {qrData && (
              <View style={styles.qrContainer}>
                <Text style={styles.qrTitle}>Código QR Generado</Text>
                
                <View style={styles.qrCodeWrapper}>
                  <QRCode
                    value={qrData}
                    size={CONFIG.QR_CODE_SIZE}
                    backgroundColor="white"
                    color="black"
                  />
                </View>

                <View style={styles.codeContainer}>
                  <Text style={styles.codeLabel}>Código de Acceso:</Text>
                  <Text style={styles.codeValue}>{alphaCode}</Text>
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.infoText}>Residente: {formData.residenteNombre}</Text>
                  <Text style={styles.infoText}>Visitante: {formData.visitanteNombre}</Text>
                  <Text style={styles.infoText}>Casa: {formData.numeroCasa}</Text>
                  <Text style={styles.infoText}>Fecha: {formatDate()} - {formatTime()}</Text>
                </View>

                <Text style={styles.instructionsText}>
                  Muestra este código QR o el código alfanumérico al vigilante
                </Text>
              </View>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.TEXT_SECONDARY, textAlign: 'center', marginBottom: 16 },
  connectionStatus: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, alignItems: 'center' },
  online: { backgroundColor: '#E8F5E8' },
  offline: { backgroundColor: '#FEE8E8' },
  connectionText: { fontSize: 14, fontWeight: '500' },
  form: { marginBottom: 30 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.TEXT_PRIMARY, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: COLORS.BORDER, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, backgroundColor: COLORS.SURFACE, color: COLORS.TEXT_PRIMARY },
  inputError: { borderColor: COLORS.ERROR },
  errorText: { color: COLORS.ERROR, fontSize: 14, marginTop: 4 },
  buttonContainer: { marginBottom: 30 },
  button: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 48, marginBottom: 12 },
  generateButton: { backgroundColor: COLORS.PRIMARY },
  resetButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.PRIMARY },
  buttonDisabled: { backgroundColor: COLORS.BORDER },
  buttonText: { color: COLORS.SURFACE, fontSize: 16, fontWeight: '600' },
  resetButtonText: { color: COLORS.PRIMARY },
  qrContainer: { alignItems: 'center', backgroundColor: COLORS.SURFACE, borderRadius: 16, padding: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  qrTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY, marginBottom: 20 },
  qrCodeWrapper: { padding: 16, backgroundColor: 'white', borderRadius: 12, marginBottom: 20, elevation: 1 },
  codeContainer: { alignItems: 'center', marginBottom: 20, padding: 16, backgroundColor: COLORS.PRIMARY + '10', borderRadius: 12, borderWidth: 2, borderColor: COLORS.PRIMARY },
  codeLabel: { fontSize: 16, color: COLORS.TEXT_SECONDARY, marginBottom: 4 },
  codeValue: { fontSize: 32, fontWeight: 'bold', color: COLORS.PRIMARY, letterSpacing: 4 },
  infoContainer: { alignItems: 'center', marginBottom: 16 },
  infoText: { fontSize: 14, color: COLORS.TEXT_SECONDARY, marginBottom: 4 },
  instructionsText: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: 'center', fontStyle: 'italic' },
});

export default ResidenteApp;