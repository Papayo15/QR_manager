import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ApiService, { CountersResponse } from '../services/api';

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [qrCode, setQrCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [counters, setCounters] = useState<CountersResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    // Despertar el servidor de Render en segundo plano
    wakeUpServer();
    loadCounters();
  }, []);

  const wakeUpServer = async () => {
    try {
      await ApiService.healthCheck();
      setServerReady(true);
    } catch (error) {
      // Servidor tarda en despertar, pero no bloqueamos la UI
      setServerReady(true);
    }
  };

  const loadCounters = async () => {
    const response = await ApiService.getCounters();
    if (response.success && response.data) {
      setCounters(response.data);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCounters();
    setRefreshing(false);
  };

  const validateCode = async () => {
    if (!qrCode.trim()) {
      Alert.alert('Error', 'Por favor ingresa un código QR');
      return;
    }

    setValidating(true);
    const response = await ApiService.validateQR({ code: qrCode.trim() });
    setValidating(false);

    if (response.success && response.data) {
      if (response.data.valid) {
        Alert.alert(
          'Código Válido ✅',
          `Casa: ${response.data.houseNumber}\n${response.data.message}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setQrCode('');
                loadCounters();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Código Inválido ❌',
          response.data.message,
          [
            {
              text: 'OK',
              onPress: () => setQrCode('')
            }
          ]
        );
      }
    } else {
      Alert.alert('Error', response.error || 'No se pudo validar el código');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>VigilanciaApp</Text>
        <Text style={styles.headerSubtitle}>Panel de Control</Text>

        {!serverReady && (
          <View style={styles.serverStatus}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.serverStatusText}>Conectando...</Text>
          </View>
        )}
      </View>

      <View style={styles.countersSection}>
        <Text style={styles.sectionTitle}>Estadísticas del Día</Text>
        {counters ? (
          <View style={styles.countersGrid}>
            <View style={[styles.counterCard, styles.counterCardGenerated]}>
              <Text style={styles.counterNumber}>{counters.generated}</Text>
              <Text style={styles.counterLabel}>Generados</Text>
            </View>
            <View style={[styles.counterCard, styles.counterCardValidated]}>
              <Text style={styles.counterNumber}>{counters.validated}</Text>
              <Text style={styles.counterLabel}>Validados</Text>
            </View>
            <View style={[styles.counterCard, styles.counterCardDenied]}>
              <Text style={styles.counterNumber}>{counters.denied}</Text>
              <Text style={styles.counterLabel}>Negados</Text>
            </View>
          </View>
        ) : (
          <ActivityIndicator color="#e74c3c" style={styles.loader} />
        )}
        <Text style={styles.dateText}>
          {counters?.date ? new Date(counters.date).toLocaleDateString('es-MX') : ''}
        </Text>
      </View>

      <View style={styles.validateSection}>
        <Text style={styles.sectionTitle}>Validar Código QR</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresa el código de 6 dígitos"
          value={qrCode}
          onChangeText={setQrCode}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.validateButton, validating && styles.validateButtonDisabled]}
          onPress={validateCode}
          disabled={validating}
        >
          {validating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.validateButtonText}>Validar Código</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('RegisterWorker')}
        >
          <Text style={styles.actionButtonIcon}>📸</Text>
          <Text style={styles.actionButtonText}>Registrar INE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Desliza hacia abajo para actualizar
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef5e7'
  },
  header: {
    backgroundColor: '#e74c3c',
    padding: 20,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16
  },
  countersSection: {
    padding: 20
  },
  countersGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  counterCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  counterCardGenerated: {
    borderTopWidth: 4,
    borderTopColor: '#3498db'
  },
  counterCardValidated: {
    borderTopWidth: 4,
    borderTopColor: '#27ae60'
  },
  counterCardDenied: {
    borderTopWidth: 4,
    borderTopColor: '#e74c3c'
  },
  counterNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  counterLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4
  },
  dateText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center'
  },
  loader: {
    marginVertical: 20
  },
  validateSection: {
    padding: 20,
    paddingTop: 0
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: 'bold'
  },
  validateButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  validateButtonDisabled: {
    opacity: 0.6
  },
  validateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0
  },
  actionButton: {
    backgroundColor: '#e67e22',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  actionButtonIcon: {
    fontSize: 24,
    marginRight: 12
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  footer: {
    padding: 20,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic'
  },
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8
  },
  serverStatusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500'
  }
});

export default DashboardScreen;
