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
  Image,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const CONFIG = {
  BACKEND_URL: 'https://qr-manager-backend.onrender.com',
  ALPHA_CODE_LENGTH: 6,
  SHEETS: {
    VIGILANCIA: '1hdSKlGGj4DMT4KOm6P3ZouY9csFJX3_eRjM5k_hH_j4',
    RESIDENTE: '1dK5inIIoSy3939I3IZlR2ewWBq4oJH4pNdRZALEJD9M'
  }
};

const COLORS = {
  PRIMARY: '#2196F3',
  SECONDARY: '#4CAF50',
  ERROR: '#F44336',
  WARNING: '#FFC107',
  SUCCESS: '#4CAF50',
  INFO: '#2196F3',
  BACKGROUND: '#F5F5F5',
  SURFACE: '#FFFFFF',
  TEXT_PRIMARY: '#212121',
  TEXT_SECONDARY: '#757575',
  BORDER: '#E0E0E0'
};

const formatDate = () => new Date().toLocaleDateString('es-MX');
const formatTime = () => new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });

const parseQRData = (qrData) => {
  try {
    const data = JSON.parse(qrData);
    return { valid: true, data: data };
  } catch (error) {
    return { valid: false, error: 'Código QR inválido' };
  }
};

const validateAlphaCode = (code) => {
  if (!code || code.trim().length === 0) {
    return { valid: false, message: 'El código es requerido' };
  }
  if (code.trim().length !== CONFIG.ALPHA_CODE_LENGTH) {
    return { valid: false, message: `El código debe tener ${CONFIG.ALPHA_CODE_LENGTH} caracteres` };
  }
  return { valid: true };
};

const validateNombre = (nombre) => {
  if (!nombre || nombre.trim().length === 0) {
    return { valid: false, message: 'El nombre es requerido' };
  }
  if (nombre.trim().length < 2) {
    return { valid: false, message: 'El nombre debe tener al menos 2 caracteres' };
  }
  return { valid: true };
};

const validateNumeroCasa = (numeroCasa) => {
  if (!numeroCasa || numeroCasa.trim().length === 0) {
    return { valid: false, message: 'El número de casa es requerido' };
  }
  return { valid: true };
};

const VigilanciaApp = () => {
  const [currentTab, setCurrentTab] = useState('manual'); // 'manual' | 'worker'
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados de validación manual
  const [manualCode, setManualCode] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  // Estados del registro de trabajadores
  const [workerData, setWorkerData] = useState({
    nombre: '',
    casa: '',
  });
  const [workerPhoto, setWorkerPhoto] = useState(null);
  const [workerErrors, setWorkerErrors] = useState({});

  // Contadores del día
  const [dailyStats, setDailyStats] = useState({
    visitantes: 0,
    trabajadores: 0,
  });

  useEffect(() => {
    initializeApp();
    requestPermissions();
  }, []);

  const initializeApp = async () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (state.isConnected) {
        syncOfflineData();
      }
    });

    loadDailyStats();
    return () => unsubscribe();
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);

        if (granted['android.permission.CAMERA'] !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permisos', 'Se necesita acceso a la cámara para tomar fotos.');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const loadDailyStats = async () => {
    try {
      const savedStats = await AsyncStorage.getItem('@daily_stats');
      if (savedStats) {
        setDailyStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const syncOfflineData = async () => {
    try {
      const pendingWorkers = await AsyncStorage.getItem('@workers_offline') || '[]';
      const workers = JSON.parse(pendingWorkers);
      
      for (const worker of workers) {
        await saveWorkerToSheets(worker);
      }
      
      if (workers.length > 0) {
        await AsyncStorage.removeItem('@workers_offline');
      }
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  };

  const validateQRCodeInSheets = async (codigo) => {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/sheets/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId: CONFIG.SHEETS.RESIDENTE,
          codigo: codigo
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result;
      }
      return { success: false, error: 'Error en la validación' };
    } catch (error) {
      console.error('Error validating code:', error);
      return { success: false, error: error.message };
    }
  };

  const saveWorkerToSheets = async (workerRecord) => {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/sheets/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId: CONFIG.SHEETS.VIGILANCIA,
          data: workerRecord
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error saving worker:', error);
      return false;
    }
  };

  const validateManualCode = async () => {
    try {
      setLoading(true);
      
      const validation = validateAlphaCode(manualCode);
      if (!validation.valid) {
        Alert.alert('Error', validation.message);
        return;
      }

      if (isConnected) {
        const result = await validateQRCodeInSheets(manualCode.toUpperCase());
        
        if (result.success && result.found) {
          setValidationResult({
            valid: true,
            data: result.data
          });
          updateDailyStats('visitantes');
        } else {
          setValidationResult({
            valid: false,
            message: 'Código no encontrado'
          });
        }
      } else {
        Alert.alert(
          'Sin Conexión',
          'No se puede validar el código sin conexión a internet.'
        );
      }

    } catch (error) {
      console.error('Error validating manual code:', error);
      Alert.alert('Error', 'Error al validar el código');
    } finally {
      setLoading(false);
    }
  };

  const clearManualValidation = () => {
    setManualCode('');
    setValidationResult(null);
  };

  const takeWorkerPhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    Alert.alert(
      'Tomar Foto',
      'Selecciona una opción',
      [
        { text: 'Cámara', onPress: () => launchCamera(options, handlePhotoResponse) },
        { text: 'Galería', onPress: () => launchImageLibrary(options, handlePhotoResponse) },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const handlePhotoResponse = (response) => {
    if (response.didCancel || response.error) {
      return;
    }

    if (response.assets && response.assets[0]) {
      setWorkerPhoto(response.assets[0]);
    }
  };

  const registerWorker = async () => {
    try {
      setLoading(true);
      
      const nombreValidation = validateNombre(workerData.nombre);
      const casaValidation = validateNumeroCasa(workerData.casa);
      
      const errors = {};
      if (!nombreValidation.valid) errors.nombre = nombreValidation.message;
      if (!casaValidation.valid) errors.casa = casaValidation.message;
      if (!workerPhoto) errors.photo = 'Se requiere foto del documento';

      if (Object.keys(errors).length > 0) {
        setWorkerErrors(errors);
        return;
      }

      const workerRecord = {
        trabajador: workerData.nombre.trim(),
        casa: workerData.casa.trim(),
        fecha: formatDate(),
        hora: formatTime(),
        foto_url: ''
      };

      if (isConnected) {
        await saveWorkerToSheets(workerRecord);
      } else {
        const offlineData = await AsyncStorage.getItem('@workers_offline') || '[]';
        const parsedData = JSON.parse(offlineData);
        parsedData.push(workerRecord);
        await AsyncStorage.setItem('@workers_offline', JSON.stringify(parsedData));
      }

      updateDailyStats('trabajadores');

      Alert.alert(
        'Trabajador Registrado',
        `${workerRecord.trabajador} registrado correctamente para la casa ${workerRecord.casa}`,
        [{ text: 'OK', onPress: clearWorkerForm }]
      );

    } catch (error) {
      console.error('Error registering worker:', error);
      Alert.alert('Error', 'Error al registrar trabajador');
    } finally {
      setLoading(false);
    }
  };

  const clearWorkerForm = () => {
    setWorkerData({ nombre: '', casa: '' });
    setWorkerPhoto(null);
    setWorkerErrors({});
  };

  const updateDailyStats = async (type) => {
    const newStats = {
      ...dailyStats,
      [type]: dailyStats[type] + 1
    };
    setDailyStats(newStats);
    await AsyncStorage.setItem('@daily_stats', JSON.stringify(newStats));
  };

  const handleWorkerInputChange = (field, value) => {
    setWorkerData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (workerErrors[field]) {
      setWorkerErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const renderTabButton = (tabId, title, icon) => (
    <TouchableOpacity
      style={[styles.tabButton, currentTab === tabId && styles.activeTab]}
      onPress={() => setCurrentTab(tabId)}
    >
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabText, currentTab === tabId && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderInput = (label, value, onChangeText, placeholder, error, keyboardType = 'default') => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT_SECONDARY}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'phone-pad' ? 'none' : 'words'}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const renderManualTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Validación Manual</Text>
      
      {renderInput(
        'Código Alfanumérico',
        manualCode,
        setManualCode,
        'Ingresa el código de 6 caracteres',
        null,
        'default'
      )}

      <TouchableOpacity
        style={[styles.button, styles.validateButton, (!manualCode.trim() || !isConnected || loading) && styles.buttonDisabled]}
        onPress={validateManualCode}
        disabled={!manualCode.trim() || !isConnected || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Validando...' : 'Validar Código'}
        </Text>
      </TouchableOpacity>

      {!isConnected && (
        <Text style={styles.offlineWarning}>
          ⚠️ Requiere conexión a internet
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, styles.clearButton]}
        onPress={clearManualValidation}
      >
        <Text style={[styles.buttonText, styles.clearButtonText]}>Limpiar</Text>
      </TouchableOpacity>

      {validationResult && (
        <View style={[
          styles.validationResult,
          validationResult.valid ? styles.validResult : styles.invalidResult
        ]}>
          {validationResult.valid ? (
            <View>
              <Text style={styles.resultTitle}>✅ Acceso Autorizado</Text>
              <Text style={styles.resultText}>Visitante: {validationResult.data.visitante}</Text>
              <Text style={styles.resultText}>Residente: {validationResult.data.residente}</Text>
              <Text style={styles.resultText}>Casa: {validationResult.data.casa}</Text>
              <Text style={styles.resultText}>Fecha: {validationResult.data.fecha}</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.resultTitle}>❌ Acceso Denegado</Text>
              <Text style={styles.resultText}>{validationResult.message}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderWorkerTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.tabTitle}>Registro de Trabajadores</Text>
      
      {renderInput(
        'Nombre del Trabajador *',
        workerData.nombre,
        (value) => handleWorkerInputChange('nombre', value),
        'Nombre completo',
        workerErrors.nombre
      )}

      {renderInput(
        'Número de Casa *',
        workerData.casa,
        (value) => handleWorkerInputChange('casa', value),
        'Casa a la que va',
        workerErrors.casa
      )}

      <View style={styles.photoSection}>
        <Text style={styles.photoLabel}>Foto del Documento *</Text>
        
        {workerPhoto ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: workerPhoto.uri }} style={styles.photoPreview} />
            <TouchableOpacity
              style={[styles.button, styles.changePhotoButton]}
              onPress={takeWorkerPhoto}
            >
              <Text style={[styles.buttonText, styles.changePhotoButtonText]}>Cambiar Foto</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderIcon}>📄</Text>
            <Text style={styles.photoPlaceholderText}>
              Toma una foto del documento de identidad
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.takePhotoButton]}
              onPress={takeWorkerPhoto}
            >
              <Text style={styles.buttonText}>Tomar Foto</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {workerErrors.photo && (
          <Text style={styles.errorText}>{workerErrors.photo}</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, styles.registerButton, loading && styles.buttonDisabled]}
        onPress={registerWorker}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Registrando...' : 'Registrar Trabajador'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.clearButton]}
        onPress={clearWorkerForm}
      >
        <Text style={[styles.buttonText, styles.clearButtonText]}>Limpiar Formulario</Text>
      </TouchableOpacity>

      {!isConnected && (
        <Text style={styles.offlineInfo}>
          📱 Sin conexión - Los datos se sincronizarán automáticamente
        </Text>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Control de Vigilancia</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.connectionStatus, isConnected ? styles.online : styles.offline]}>
            <Text style={styles.connectionText}>
              {isConnected ? '🟢 En línea' : '🔴 Sin conexión'}
            </Text>
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{dailyStats.visitantes}</Text>
            <Text style={styles.statLabel}>Visitantes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{dailyStats.trabajadores}</Text>
            <Text style={styles.statLabel}>Trabajadores</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {renderTabButton('manual', 'Manual', '⌨️')}
        {renderTabButton('worker', 'Trabajador', '👷')}
      </View>

      {/* Tab Content */}
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {currentTab === 'manual' && renderManualTab()}
        {currentTab === 'worker' && renderWorkerTab()}
      </KeyboardAvoidingView>
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
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  connectionStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.SURFACE,
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 20,
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
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: 12,
  },
  validateButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  registerButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  changePhotoButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    width: 150,
  },
  takePhotoButton: {
    backgroundColor: COLORS.PRIMARY,
    width: 150,
  },
  buttonDisabled: {
    backgroundColor: COLORS.BORDER,
  },
  buttonText: {
    color: COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '600',
  },
  clearButtonText: {
    color: COLORS.PRIMARY,
  },
  changePhotoButtonText: {
    color: COLORS.PRIMARY,
  },
  offlineWarning: {
    color: COLORS.WARNING,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  offlineInfo: {
    color: COLORS.INFO,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  validationResult: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  validResult: {
    backgroundColor: '#E8F5E8',
    borderColor: COLORS.SUCCESS,
  },
  invalidResult: {
    backgroundColor: '#FEE8E8',
    borderColor: COLORS.ERROR,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 4,
    color: COLORS.TEXT_PRIMARY,
  },
  photoSection: {
    marginBottom: 20,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoPreview: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  photoPlaceholder: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  photoPlaceholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default VigilanciaApp;