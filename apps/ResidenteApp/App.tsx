import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CONFIG = {
  BACKEND_URL: 'https://qr-manager-3z8x.onrender.com',
  ALPHA_CODE_LENGTH: 6,
  TIMEOUT: 30000,
  SHEET_ID: '1h_fEz5tDjNmdZ-57F2CoL5W6RjjAF7Yhw4ttJgypb7o',
  CODE_EXPIRATION_HOURS: 24,
};

const COLORS = {
  PRIMARY: '#4CAF50',
  SECONDARY: '#8BC34A',
  ACCENT: '#2E7D32',
  BACKGROUND: '#F1F8E9',
  SURFACE: '#FFFFFF',
  TEXT_PRIMARY: '#1B5E20',
  TEXT_SECONDARY: '#558B2F',
  BORDER: '#C5E1A5',
  ERROR: '#F44336',
  WARNING: '#FFC107',
  INFO: '#2196F3',
};

const logger = {
  info: (tag: string, message: string, data: any = null) => {
    console.log('[INFO] [' + tag + '] ' + message, data || '');
  },
  error: (tag: string, message: string, error: any = null) => {
    console.error('[ERROR] [' + tag + '] ' + message, error || '');
  }
};

const formatDate = (): string => new Date().toLocaleDateString('es-MX');
const formatTime = (): string => new Date().toLocaleTimeString('es-MX', { 
  hour: '2-digit', 
  minute: '2-digit', 
  hour12: false 
});

const generateCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < CONFIG.ALPHA_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

interface GeneratedCode {
  code: string;
  visitante: string;
  residente: string;
  casa: string;
  fecha: string;
  hora: string;
}

const ResidenteApp: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [visitante, setVisitante] = useState<string>('');
  const [residente, setResidente] = useState<string>('');
  const [casa, setCasa] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [errors, setErrors] = useState<{visitante?: string; residente?: string; casa?: string}>({});
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<(() => void)>(() => () => {});
  const [confirmMessage, setConfirmMessage] = useState<string>('');

  useEffect(() => {
    logger.info('App', 'Inicializando ResidenteApp');
    const cleanup = initializeApp();
    
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then((unsubscribe: any) => {
          if (unsubscribe && typeof unsubscribe === 'function') {
            unsubscribe();
          }
        });
      }
    };
  }, []);

  const initializeApp = async () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      logger.info('Network', 'Estado de red: ' + (state.isConnected ? 'Conectado' : 'Desconectado'));
    });
    return unsubscribe;
  };

  const showConfirmation = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const validateForm = (): boolean => {
    const newErrors: {visitante?: string; residente?: string; casa?: string} = {};
    
    if (!visitante.trim()) {
      newErrors.visitante = 'El nombre del visitante es obligatorio';
    }
    
    if (!residente.trim()) {
      newErrors.residente = 'Tu nombre es obligatorio';
    }
    
    if (!casa.trim()) {
      newErrors.casa = 'El numero de casa es obligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateCode = () => {
    if (!validateForm()) {
      Alert.alert('Campos Requeridos', 'Por favor completa todos los campos');
      return;
    }
    
    showConfirmation(
      'Generar codigo de acceso para ' + visitante.trim() + '?',
      confirmGenerateCode
    );
  };

  const confirmGenerateCode = async (): Promise<void> => {
    setLoading(true);
    let timeoutWarning: any = null;

    try {
      const code = generateCode();
      const codeData: GeneratedCode = {
        code: code,
        visitante: visitante.trim(),
        residente: residente.trim(),
        casa: casa.trim(),
        fecha: formatDate(),
        hora: formatTime(),
      };

      if (isConnected) {
        timeoutWarning = setTimeout(() => {
          Alert.alert('Espera', 'El servidor esta despertando...');
        }, 5000);

        const response = await fetch(CONFIG.BACKEND_URL + '/api/sheets/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheetId: CONFIG.SHEET_ID,
            data: {
              tipo: 'CODIGO_QR',
              codigo: code,
              visitante: codeData.visitante,
              residente: codeData.residente,
              casa: codeData.casa,
              fecha: codeData.fecha,
              hora: codeData.hora,
              resultado: 'ACTIVO'
            }
          })
        });

        if (timeoutWarning) clearTimeout(timeoutWarning);

        if (!response.ok) {
          throw new Error('Error al guardar el codigo');
        }

        await AsyncStorage.setItem('@last_code', JSON.stringify(codeData));
        setGeneratedCode(codeData);
        
        Alert.alert(
          'Codigo Generado',
          'Codigo: ' + code + '\n' +
          'Valido por 24 horas\n' +
          'Un solo uso\n\n' +
          'Visitante: ' + codeData.visitante + '\n' +
          'Casa: ' + codeData.casa
        );
      } else {
        Alert.alert('Sin Conexion', 'No se puede generar codigo sin internet');
      }
    } catch (error) {
      if (timeoutWarning) clearTimeout(timeoutWarning);
      logger.error('GenerateCode', 'Error', error);
      Alert.alert('Error', 'No se pudo generar el codigo');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = (): void => {
    setVisitante('');
    setResidente('');
    setCasa('');
    setGeneratedCode(null);
    setErrors({});
  };

  const handleClearForm = () => {
    showConfirmation('Limpiar formulario y codigo generado?', clearForm);
  };

  const shareCode = async (): Promise<void> => {
    if (!generatedCode) return;

    const message = 
      'Codigo de acceso: ' + generatedCode.code + '\n' +
      'Visitante: ' + generatedCode.visitante + '\n' +
      'Casa: ' + generatedCode.casa + '\n' +
      'Fecha: ' + generatedCode.fecha + ' ' + generatedCode.hora + '\n' +
      'Valido por 24 horas - Un solo uso';

    const whatsappUrl = 'whatsapp://send?text=' + encodeURIComponent(message);
    
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('WhatsApp', 'No se pudo abrir WhatsApp');
      }
    } catch (error) {
      logger.error('Share', 'Error', error);
      Alert.alert('Error', 'No se pudo compartir el codigo');
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    error: string | undefined,
    keyboardType: any = 'default'
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label} *</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          setErrors((prev) => ({ ...prev, [label.toLowerCase()]: undefined }));
        }}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT_SECONDARY}
        autoCapitalize="words"
        keyboardType={keyboardType}
        editable={!loading}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Generador de Codigos QR</Text>
        <View style={[styles.connectionStatus, isConnected ? styles.online : styles.offline]}>
          <Text style={styles.connectionText}>
            {isConnected ? 'En linea' : 'Sin conexion'}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Informacion del Visitante</Text>
          
          {renderInput(
            'Nombre del Visitante',
            visitante,
            setVisitante,
            'Nombre completo',
            errors.visitante
          )}
          
          {renderInput(
            'Tu Nombre (Residente)',
            residente,
            setResidente,
            'Tu nombre',
            errors.residente
          )}
          
          {renderInput(
            'Numero de Casa',
            casa,
            setCasa,
            'Numero de tu casa',
            errors.casa,
            'default'
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Informacion Importante</Text>
            <Text style={styles.infoBoxText}>
              - Los codigos expiran en 24 horas{'\n'}
              - Cada codigo solo puede usarse una vez{'\n'}
              - El visitante debe mostrar el codigo al vigilante
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              styles.generateButton,
              (!isConnected || loading) && styles.buttonDisabled
            ]}
            onPress={handleGenerateCode}
            disabled={!isConnected || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Generando...' : 'Generar Codigo'}
            </Text>
          </TouchableOpacity>

          {!isConnected && (
            <Text style={styles.offlineWarning}>
              Requiere conexion a internet para generar codigos
            </Text>
          )}
        </View>

        {generatedCode && (
          <View style={styles.codeSection}>
            <Text style={styles.sectionTitle}>Codigo Generado</Text>
            
            <View style={styles.qrContainer}>
              <QRCode
                value={generatedCode.code}
                size={200}
                color={COLORS.TEXT_PRIMARY}
                backgroundColor={COLORS.SURFACE}
              />
            </View>

            <View style={styles.codeDetails}>
              <Text style={styles.codeText}>Codigo: {generatedCode.code}</Text>
              <Text style={styles.detailText}>Visitante: {generatedCode.visitante}</Text>
              <Text style={styles.detailText}>Residente: {generatedCode.residente}</Text>
              <Text style={styles.detailText}>Casa: {generatedCode.casa}</Text>
              <Text style={styles.detailText}>
                Generado: {generatedCode.fecha} {generatedCode.hora}
              </Text>
              <Text style={styles.expirationText}>
                Valido por 24 horas - Un solo uso
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.shareButton]}
              onPress={shareCode}
            >
              <Text style={styles.buttonText}>Compartir por WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClearForm}
            >
              <Text style={[styles.buttonText, styles.clearButtonText]}>
                Generar Nuevo Codigo
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmacion</Text>
            <Text style={styles.modalMessage}>{confirmMessage}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={() => {
                  setShowConfirmModal(false);
                  confirmAction();
                }}
              >
                <Text style={[styles.modalButtonText, {color: '#FFF'}]}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.SURFACE,
    padding: 20,
    paddingBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 12,
  },
  connectionStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    alignSelf: 'center',
  },
  online: {
    backgroundColor: '#E8F5E8',
  },
  offline: {
    backgroundColor: '#FEE8E8',
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: COLORS.SURFACE,
    color: COLORS.TEXT_PRIMARY,
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 14,
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  shareButton: {
    backgroundColor: '#25D366',
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  buttonDisabled: {
    backgroundColor: COLORS.BORDER,
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '600',
  },
  clearButtonText: {
    color: COLORS.PRIMARY,
  },
  offlineWarning: {
    color: COLORS.WARNING,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  codeSection: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
  },
  codeDetails: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 6,
  },
  expirationText: {
    fontSize: 13,
    color: COLORS.WARNING,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.PRIMARY,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
});

export default ResidenteApp;