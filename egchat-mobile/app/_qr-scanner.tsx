import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';

interface QRScannerProps {
  onScanComplete: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScanComplete, onClose }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (type === 'org.iso.QRCode' && !scanned) {
      setScanned(true);
      
      // Vibrate para feedback
      if ('vibrate' in navigator) {
        (navigator as any).vibrate(200);
      }

      // Procesar el QR escaneado
      processQRData(data);
    }
  };

  const processQRData = async (data: string) => {
    console.log('QR escaneado:', data);

    // Verificar si es una URL de EGCHAT
    if (data.includes('egchat-gq.com') || data.includes('localhost:3001') || data.includes('egchat')) {
      // Es una URL de EGCHAT
      try {
        // Abrir la URL directamente
        const supported = await Linking.canOpenURL(data);
        if (supported) {
          await Linking.openURL(data);
          onScanComplete(data);
        } else {
          Alert.alert('Error', 'No se puede abrir esta URL en este dispositivo');
        }
      } catch (error) {
        console.error('Error abriendo URL:', error);
        Alert.alert('Error', 'No se pudo abrir la aplicación');
      }
    } else {
      // No es una URL de EGCHAT, mostrar opciones
      Alert.alert(
        'QR Escaneado',
        `Datos: ${data}`,
        [
          {
            text: 'Abrir en navegador',
            onPress: () => {
              Linking.openURL(data.startsWith('http') ? data : `https://${data}`);
            }
          },
          {
            text: 'Copiar enlace',
            onPress: () => {
              // Copiar al portapapeles (requiere @react-native-clipboard/clipboard)
              console.log('Copiado:', data);
            }
          },
          {
            text: 'Cancelar',
            style: 'cancel'
          }
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Verificando permisos de cámara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Se necesita permiso de la cámara</Text>
        <TouchableOpacity style={styles.button} onPress={checkCameraPermission}>
          <Text style={styles.buttonText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📱 Escanear QR EGCHAT</Text>
        <Text style={styles.subtitle}>Apunta la cámara al código QR</Text>
      </View>

      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      {scanned && (
        <View style={styles.scannedOverlay}>
          <Text style={styles.scannedText}>✅ QR Escaneado</Text>
          <TouchableOpacity 
            style={styles.scanAgainButton} 
            onPress={() => {
              setScanned(false);
            }}
          >
            <Text style={styles.scanAgainText}>Escanear otro</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#facc15',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00c8a0',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scannedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scannedText: {
    fontSize: 20,
    color: '#00c8a0',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scanAgainButton: {
    backgroundColor: '#facc15',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scanAgainText: {
    color: '#0d1117',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
