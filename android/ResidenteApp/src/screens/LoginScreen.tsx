import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ApiService from '../services/api';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const CONDOMINIOS = [
  'Unica',
  'Bocamar',
  'Zebrina',
  'Nuva',
  'Aposento'
];

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [houseNumber, setHouseNumber] = useState('');
  const [selectedCondominio, setSelectedCondominio] = useState('');
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    // Despertar el servidor de Render en segundo plano
    wakeUpServer();
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

  const handleLogin = async () => {
    const house = parseInt(houseNumber, 10);

    if (!houseNumber || isNaN(house) || house < 1 || house > 100) {
      Alert.alert('Error', 'Por favor ingresa un número de casa válido (1-100)');
      return;
    }

    if (!selectedCondominio) {
      Alert.alert('Error', 'Por favor selecciona un condominio');
      return;
    }

    try {
      await AsyncStorage.setItem('houseNumber', houseNumber);
      await AsyncStorage.setItem('condominio', selectedCondominio);
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la información');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.icon}>✅</Text>
          <Text style={styles.title}>ResidenteApp</Text>
          <Text style={styles.subtitle}>Sistema de Códigos QR</Text>

          {!serverReady && (
            <View style={styles.serverStatus}>
              <ActivityIndicator size="small" color="#27ae60" />
              <Text style={styles.serverStatusText}>Conectando con servidor...</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Número de Casa</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu número de casa (1-100)"
              keyboardType="number-pad"
              value={houseNumber}
              onChangeText={setHouseNumber}
              maxLength={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Selecciona tu Condominio</Text>
            <View style={styles.condominiosContainer}>
              {CONDOMINIOS.map((condominio) => (
                <TouchableOpacity
                  key={condominio}
                  style={[
                    styles.condominioButton,
                    selectedCondominio === condominio && styles.condominioButtonSelected
                  ]}
                  onPress={() => setSelectedCondominio(condominio)}
                >
                  <Text
                    style={[
                      styles.condominioText,
                      selectedCondominio === condominio && styles.condominioTextSelected
                    ]}
                  >
                    {condominio}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>Ingresar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa'
  },
  scrollContent: {
    flexGrow: 1
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  icon: {
    fontSize: 80,
    marginBottom: 24
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 48
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dfe6e9'
  },
  condominiosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  condominioButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#dfe6e9'
  },
  condominioButtonSelected: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60'
  },
  condominioText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50'
  },
  condominioTextSelected: {
    color: '#fff'
  },
  loginButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e8f5e9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24
  },
  serverStatusText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '500'
  }
});

export default LoginScreen;
