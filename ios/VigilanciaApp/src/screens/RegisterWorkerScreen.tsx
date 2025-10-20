import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import ApiService from '../services/api';

type RegisterWorkerScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const WORKER_TYPES = [
  'Sirvienta',
  'Jardinero',
  'Repartidor',
  'Técnico',
  'Visitante',
  'Otro'
];

const CONDOMINIOS = [
  'Unica',
  'Bocamar',
  'Zebrina',
  'Nuva',
  'Aposento'
];

const RegisterWorkerScreen: React.FC<RegisterWorkerScreenProps> = ({ navigation }) => {
  const [houseNumber, setHouseNumber] = useState('');
  const [workerType, setWorkerType] = useState('');
  const [condominio, setCondominio] = useState('');
  const [photoUri, setPhotoUri] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const takePhoto = () => {
    Alert.alert(
      'Capturar Foto',
      'Selecciona una opción',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cámara',
          onPress: () => {
            launchCamera(
              {
                mediaType: 'photo',
                quality: 0.8,
                includeBase64: true,
                maxWidth: 1024,
                maxHeight: 1024
              },
              handleImageResponse
            );
          }
        },
        {
          text: 'Galería',
          onPress: () => {
            launchImageLibrary(
              {
                mediaType: 'photo',
                quality: 0.8,
                includeBase64: true,
                maxWidth: 1024,
                maxHeight: 1024
              },
              handleImageResponse
            );
          }
        }
      ]
    );
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      Alert.alert('Error', response.errorMessage || 'No se pudo capturar la foto');
      return;
    }

    if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      setPhotoUri(asset.uri || '');
      setPhotoBase64(asset.base64 || '');
    }
  };

  const handleSubmit = async () => {
    const house = parseInt(houseNumber, 10);

    if (!houseNumber || isNaN(house) || house < 1 || house > 100) {
      Alert.alert('Error', 'Por favor ingresa un número de casa válido (1-100)');
      return;
    }

    if (!workerType) {
      Alert.alert('Error', 'Por favor selecciona el tipo de trabajador');
      return;
    }

    if (!condominio) {
      Alert.alert('Error', 'Por favor selecciona un condominio');
      return;
    }

    if (!photoBase64) {
      Alert.alert('Error', 'Por favor captura una foto de la identificación');
      return;
    }

    setLoading(true);
    const response = await ApiService.registerWorker({
      houseNumber: house,
      workerType,
      photoBase64,
      condominio
    });
    setLoading(false);

    if (response.success) {
      Alert.alert(
        'Éxito',
        'Trabajador registrado correctamente',
        [
          {
            text: 'OK',
            onPress: () => {
              setHouseNumber('');
              setWorkerType('');
              setCondominio('');
              setPhotoUri('');
              setPhotoBase64('');
              navigation.goBack();
            }
          }
        ]
      );
    } else {
      Alert.alert('Error', response.error || 'No se pudo registrar al trabajador');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar INE</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Número de Casa</Text>
          <TextInput
            style={styles.input}
            placeholder="1-100"
            keyboardType="number-pad"
            value={houseNumber}
            onChangeText={setHouseNumber}
            maxLength={3}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Selecciona Condominio</Text>
          <View style={styles.optionsContainer}>
            {CONDOMINIOS.map((condo) => (
              <TouchableOpacity
                key={condo}
                style={[
                  styles.optionButton,
                  condominio === condo && styles.optionButtonSelected
                ]}
                onPress={() => setCondominio(condo)}
              >
                <Text
                  style={[
                    styles.optionText,
                    condominio === condo && styles.optionTextSelected
                  ]}
                >
                  {condo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tipo de Trabajador</Text>
          <View style={styles.optionsContainer}>
            {WORKER_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  workerType === type && styles.optionButtonSelected
                ]}
                onPress={() => setWorkerType(type)}
              >
                <Text
                  style={[
                    styles.optionText,
                    workerType === type && styles.optionTextSelected
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Foto de Identificación</Text>
          {photoUri ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photoUri }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={takePhoto}
              >
                <Text style={styles.retakeButtonText}>Tomar Otra Foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Text style={styles.photoButtonIcon}>📸</Text>
              <Text style={styles.photoButtonText}>Capturar Foto</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Registrar</Text>
          )}
        </TouchableOpacity>
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
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  form: {
    padding: 20
  },
  inputContainer: {
    marginBottom: 24
  },
  label: {
    fontSize: 16,
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#dfe6e9'
  },
  optionButtonSelected: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c'
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50'
  },
  optionTextSelected: {
    color: '#fff'
  },
  photoButton: {
    backgroundColor: '#e67e22',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d35400',
    borderStyle: 'dashed'
  },
  photoButtonIcon: {
    fontSize: 48,
    marginBottom: 8
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },
  photoPreview: {
    alignItems: 'center'
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 12
  },
  retakeButton: {
    backgroundColor: '#e67e22',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  submitButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginTop: 24
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});

export default RegisterWorkerScreen;
