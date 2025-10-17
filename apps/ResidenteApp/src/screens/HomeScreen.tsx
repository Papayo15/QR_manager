import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Share from 'react-native-share';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ApiService, { QRCode as QRCodeType } from '../services/api';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [houseNumber, setHouseNumber] = useState<number | null>(null);
  const [condominio, setCondominio] = useState<string>('');
  const [currentCode, setCurrentCode] = useState<QRCodeType | null>(null);
  const [history, setHistory] = useState<QRCodeType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    wakeUpServer();
    loadUserData();
  }, []);

  const wakeUpServer = async () => {
    try {
      await ApiService.healthCheck();
      console.log('✅ Servidor despierto');
    } catch (error) {
      console.log('⚠️ Servidor tardando en despertar');
    }
  };

  const loadUserData = async () => {
    try {
      const house = await AsyncStorage.getItem('houseNumber');
      const condo = await AsyncStorage.getItem('condominio');

      if (house && condo) {
        setHouseNumber(parseInt(house, 10));
        setCondominio(condo);
        loadHistory(parseInt(house, 10), condo);
      } else {
        navigation.navigate('Login');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la información del usuario');
    }
  };

  const loadHistory = async (house: number, condo: string) => {
    setLoadingHistory(true);
    const response = await ApiService.getHistory(house, condo);
    setLoadingHistory(false);

    if (response.success && response.data) {
      setHistory(response.data.codes || []);
    }
  };

  const generateQRCode = async () => {
    if (!houseNumber || !condominio) return;

    setLoading(true);
    const response = await ApiService.registerCode({
      houseNumber,
      condominio
    });
    setLoading(false);

    if (response.success && response.data) {
      setCurrentCode(response.data);
      loadHistory(houseNumber, condominio);
      Alert.alert('Éxito', 'Código QR generado correctamente');
    } else {
      Alert.alert('Error', response.error || 'No se pudo generar el código');
    }
  };

  const shareCode = async () => {
    if (!currentCode) return;

    try {
      await Share.open({
        message: `Código QR para visita:\n${currentCode.code}\nCasa: ${houseNumber}\nVigencia: 24 horas\n\nGenerado por ResidenteApp`,
      });
    } catch (error) {
      // Usuario canceló compartir
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          onPress: async () => {
            await AsyncStorage.removeItem('houseNumber');
            await AsyncStorage.removeItem('condominio');
            navigation.navigate('Login');
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Casa {houseNumber}</Text>
          <Text style={styles.headerSubtitle}>{condominio}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.qrSection}>
        {currentCode && !isExpired(currentCode.expiresAt) ? (
          <View style={styles.qrContainer}>
            <QRCode
              value={currentCode.code}
              size={200}
              backgroundColor="white"
            />
            <Text style={styles.qrCodeText}>{currentCode.code}</Text>
            <Text style={styles.expiryText}>
              Expira: {formatDate(currentCode.expiresAt)}
            </Text>
            <TouchableOpacity style={styles.shareButton} onPress={shareCode}>
              <Text style={styles.shareButtonText}>Compartir por WhatsApp</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noCodeContainer}>
            <Text style={styles.noCodeIcon}>🔒</Text>
            <Text style={styles.noCodeText}>
              {currentCode ? 'Tu código ha expirado' : 'No tienes códigos activos'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={generateQRCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generar Nuevo Código</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Últimos 5 Códigos</Text>
        {loadingHistory ? (
          <ActivityIndicator color="#27ae60" style={styles.loader} />
        ) : history.length > 0 ? (
          history.slice(0, 5).map((code, index) => (
            <View
              key={index}
              style={[
                styles.historyItem,
                isExpired(code.expiresAt) && styles.historyItemExpired
              ]}
            >
              <Text style={styles.historyCode}>{code.code}</Text>
              <Text style={styles.historyDate}>
                {formatDate(code.createdAt)}
              </Text>
              <Text style={[
                styles.historyStatus,
                code.isUsed && styles.historyStatusUsed,
                isExpired(code.expiresAt) && styles.historyStatusExpired
              ]}>
                {code.isUsed ? 'Usado' : isExpired(code.expiresAt) ? 'Expirado' : 'Activo'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noHistoryText}>No hay historial de códigos</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa'
  },
  header: {
    backgroundColor: '#27ae60',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  qrSection: {
    padding: 20,
    alignItems: 'center'
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20
  },
  qrCodeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    letterSpacing: 2
  },
  expiryText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 8
  },
  noCodeContainer: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20
  },
  noCodeIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  noCodeText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center'
  },
  shareButton: {
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  generateButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  generateButtonDisabled: {
    opacity: 0.6
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  historySection: {
    padding: 20
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16
  },
  loader: {
    marginTop: 20
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  historyItemExpired: {
    opacity: 0.6
  },
  historyCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1
  },
  historyDate: {
    fontSize: 12,
    color: '#7f8c8d',
    flex: 1,
    textAlign: 'center'
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27ae60',
    flex: 1,
    textAlign: 'right'
  },
  historyStatusUsed: {
    color: '#3498db'
  },
  historyStatusExpired: {
    color: '#95a5a6'
  },
  noHistoryText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 20
  }
});

export default HomeScreen;
