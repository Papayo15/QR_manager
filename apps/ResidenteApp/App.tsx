import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity
} from 'react-native';

const API_BASE_URL = 'https://qrvisitas.onrender.com';

// ⏱️ Timeouts optimizados para Render + UptimeRobot (siempre activo)
const TIMEOUTS = {
  FIRST_ATTEMPT: 15000,   // 15s - Servidor siempre despierto con UptimeRobot
  SECOND_ATTEMPT: 15000,  // 15s - Reintento rápido
  THIRD_ATTEMPT: 15000    // 15s - Última oportunidad
};

interface ApiResponse {
  message: string;
  timestamp: string;
}

const fetchWithTimeout = async (
  url: string,
  timeout: number,
  attemptNumber: number
): Promise<ApiResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`🔄 Intento ${attemptNumber} - Timeout: ${timeout / 1000}s`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Respuesta exitosa:', data);
    return data;

  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error(`Timeout después de ${timeout / 1000}s`);
    }
    throw error;
  }
};

const App = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setAttempt(0);
    setRetrying(false);

    // 🔄 Intento 1: 90 segundos (despertar Render)
    try {
      setAttempt(1);
      const result = await fetchWithTimeout(
        `${API_BASE_URL}/health`,
        TIMEOUTS.FIRST_ATTEMPT,
        1
      );
      setData(result);
      setLoading(false);
      return;
    } catch (err: any) {
      console.log('❌ Intento 1 falló:', err.message);
    }

    // 🔄 Intento 2: 45 segundos
    try {
      setAttempt(2);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const result = await fetchWithTimeout(
        `${API_BASE_URL}/health`,
        TIMEOUTS.SECOND_ATTEMPT,
        2
      );
      setData(result);
      setLoading(false);
      return;
    } catch (err: any) {
      console.log('❌ Intento 2 falló:', err.message);
    }

    // 🔄 Intento 3: 30 segundos
    try {
      setAttempt(3);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const result = await fetchWithTimeout(
        `${API_BASE_URL}/health`,
        TIMEOUTS.THIRD_ATTEMPT,
        3
      );
      setData(result);
      setLoading(false);
      return;
    } catch (err: any) {
      console.log('❌ Intento 3 falló:', err.message);
    }

    // ❌ Todos los intentos fallaron
    setLoading(false);
    setError(
      'No se pudo conectar con el servidor después de 3 intentos.\n\n' +
      '🔍 Posibles causas:\n' +
      '• El servidor está inactivo en Render\n' +
      '• Sin horas gratuitas disponibles\n' +
      '• Problemas de conexión\n\n' +
      '💡 Verifica el estado en:\nhttps://qrvisitas.onrender.com/health'
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.title}>
            {attempt === 0 && '🚀 Iniciando conexión...'}
            {attempt === 1 && '🔄 Conectando al servidor...'}
            {attempt === 2 && '🔄 Reintentando conexión...'}
            {attempt === 3 && '⏱️ Último intento...'}
          </Text>
          <Text style={styles.attemptText}>
            Intento {attempt} de 3
          </Text>
          <Text style={styles.timeoutText}>
            {attempt === 1 && 'Tiempo máximo: 15 segundos'}
            {attempt === 2 && 'Tiempo máximo: 15 segundos'}
            {attempt === 3 && 'Tiempo máximo: 15 segundos'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error de Conexión</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={testConnection}
            disabled={retrying}
          >
            <Text style={styles.retryButtonText}>
              🔄 Reintentar Conexión
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>ResidenteApp</Text>
        <Text style={styles.successSubtitle}>Conectado al Servidor</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Estado:</Text>
          <Text style={styles.infoValue}>{data?.message || 'Operativo'}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Servidor:</Text>
          <Text style={styles.infoValue}>Render Cloud</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Última actualización:</Text>
          <Text style={styles.infoValue}>
            {data?.timestamp
              ? new Date(data.timestamp).toLocaleString('es-MX')
              : 'N/A'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={testConnection}
        >
          <Text style={styles.refreshButtonText}>🔄 Verificar Conexión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  title: {
    fontSize: 18,
    marginTop: 20,
    color: '#2c3e50',
    fontWeight: '600',
    textAlign: 'center'
  },
  attemptText: {
    fontSize: 14,
    marginTop: 12,
    color: '#7f8c8d',
    fontWeight: '500'
  },
  timeoutText: {
    fontSize: 12,
    marginTop: 8,
    color: '#95a5a6',
    fontStyle: 'italic'
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 16
  },
  errorText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 8
  },
  successSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 32
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  infoLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 4,
    fontWeight: '600'
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500'
  },
  refreshButton: {
    marginTop: 24,
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  }
});

export default App;
