// LivenessCapture — selfie con prueba de vida
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { encryptImage } from '../../services/kycEncryption';

const INSTRUCTIONS = [
  { key: 'turn',   label: '↩ Gira la cabeza a la derecha', duration: 3000 },
  { key: 'smile',  label: '😊 Sonríe',                     duration: 2500 },
  { key: 'blink',  label: '👁 Parpadea dos veces',          duration: 2000 },
];

interface Props {
  attempts: number;
  maxAttempts?: number;
  onSuccess: (encryptedBase64: string, uri: string) => void;
  onFailed: () => void;
}

export function LivenessCapture({ attempts, maxAttempts = 3, onSuccess, onFailed }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef   = useRef<CameraView>(null);
  const [step, setStep]         = useState(0);       // 0,1,2 = instrucciones; 3 = captura
  const [processing, setProc]   = useState(false);
  const [done, setDone]         = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Avanzar instrucciones automáticamente
  useEffect(() => {
    if (step >= INSTRUCTIONS.length || done) return;
    const t = setTimeout(() => {
      // Fade out → cambiar → fade in
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setStep(s => s + 1);
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    }, INSTRUCTIONS[step].duration);
    return () => clearTimeout(t);
  }, [step, done, fadeAnim]);

  const captureAndVerify = useCallback(async () => {
    if (!cameraRef.current || processing) return;
    setProc(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
      if (!photo?.uri) throw new Error('Sin foto');
      const { encryptedBase64 } = await encryptImage(photo.uri);
      setDone(true);
      onSuccess(encryptedBase64, photo.uri);
    } catch {
      onFailed();
    } finally {
      setProc(false);
    }
  }, [processing, onSuccess, onFailed]);

  // Cuando terminan las instrucciones, capturar automáticamente
  useEffect(() => {
    if (step >= INSTRUCTIONS.length && !done && !processing) {
      captureAndVerify();
    }
  }, [step, done, processing, captureAndVerify]);

  if (!permission) return <ActivityIndicator color="#00C8A0" style={{ marginTop: 20 }} />;
  if (!permission.granted) {
    return (
      <View style={st.permWrap}>
        <Text style={st.permText}>Necesitamos la cámara frontal para la verificación biométrica.</Text>
        <TouchableOpacity style={st.permBtn} onPress={requestPermission}>
          <Text style={st.permBtnText}>Permitir cámara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (done) {
    return (
      <View style={st.doneWrap}>
        <Text style={st.doneIcon}>✅</Text>
        <Text style={st.doneText}>Selfie capturada correctamente</Text>
      </View>
    );
  }

  const currentInstruction = INSTRUCTIONS[Math.min(step, INSTRUCTIONS.length - 1)];

  return (
    <View style={st.wrap}>
      <Text style={st.attemptsText}>Intento {attempts + 1} de {maxAttempts}</Text>

      <View style={st.cameraWrap}>
        <CameraView ref={cameraRef} style={st.camera} facing="front">
          {/* Óvalo guía */}
          <View style={st.oval} />
        </CameraView>

        {/* Instrucción animada */}
        <Animated.View style={[st.instructionBanner, { opacity: fadeAnim }]}>
          <Text style={st.instructionText}>
            {step < INSTRUCTIONS.length ? currentInstruction.label : '📸 Capturando...'}
          </Text>
        </Animated.View>
      </View>

      {/* Progreso de instrucciones */}
      <View style={st.stepsRow}>
        {INSTRUCTIONS.map((ins, i) => (
          <View key={ins.key} style={st.stepItem}>
            <Text style={[st.stepIcon, i < step && st.stepDone, i === step && st.stepActive]}>
              {i < step ? '✅' : i === step ? '🔄' : '⏳'}
            </Text>
            <Text style={[st.stepLabel, i <= step && st.stepLabelActive]}>
              {ins.label.split(' ').slice(1).join(' ')}
            </Text>
          </View>
        ))}
      </View>

      {processing && (
        <View style={st.processingWrap}>
          <ActivityIndicator color="#00C8A0" />
          <Text style={st.processingText}>Procesando...</Text>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap:             { marginTop: 8 },
  attemptsText:     { fontSize: 12, color: '#6b7280', textAlign: 'center', marginBottom: 10 },
  cameraWrap:       { borderRadius: 16, overflow: 'hidden', height: 280, backgroundColor: '#000', position: 'relative' },
  camera:           { flex: 1 },
  oval:             { position: 'absolute', top: '10%', left: '20%', width: '60%', height: '75%', borderRadius: 999, borderWidth: 3, borderColor: '#00C8A0', backgroundColor: 'transparent' },
  instructionBanner:{ position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  instructionText:  { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  stepsRow:         { marginTop: 14, gap: 8 },
  stepItem:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepIcon:         { fontSize: 16, width: 22, textAlign: 'center' },
  stepDone:         {},
  stepActive:       {},
  stepLabel:        { fontSize: 13, color: '#9ca3af' },
  stepLabelActive:  { color: '#374151', fontWeight: '600' },
  processingWrap:   { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12 },
  processingText:   { fontSize: 13, color: '#6b7280' },
  doneWrap:         { alignItems: 'center', paddingVertical: 30, gap: 10 },
  doneIcon:         { fontSize: 48 },
  doneText:         { fontSize: 15, fontWeight: '700', color: '#065f46' },
  permWrap:         { padding: 20, alignItems: 'center', gap: 12 },
  permText:         { fontSize: 14, color: '#374151', textAlign: 'center' },
  permBtn:          { backgroundColor: '#00C8A0', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  permBtnText:      { color: '#fff', fontWeight: '700' },
});
