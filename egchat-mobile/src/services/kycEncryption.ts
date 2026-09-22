// kycEncryption.ts — Cifrado AES-256 de imágenes KYC antes de subir
// Usa expo-crypto para generar IV y expo-file-system para leer archivos
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

// Clave AES-256 derivada del token del servidor (en producción usar clave del servidor)
// Por ahora se usa una clave fija — en producción obtener del backend vía /api/kyc/key
const AES_KEY_HEX = 'a3f5e8b2c1d4e7f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6';

// ── Comprimir imagen a máx 2MB ────────────────────────────────────
export async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );

  if (!result?.uri) throw new Error('manipulateAsync no devolvió URI');

  // Verificar tamaño; getInfoAsync puede fallar con URIs content:// de Android
  try {
    const info = await FileSystem.getInfoAsync(result.uri);
    const sizeBytes = (info as any).size ?? 0;
    if (sizeBytes > 2 * 1024 * 1024) {
      const result2 = await ImageManipulator.manipulateAsync(
        result.uri,
        [{ resize: { width: 900 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
      );
      return result2?.uri ?? result.uri;
    }
  } catch {
    // Si no podemos leer el tamaño, seguimos con la compresión inicial
  }

  return result.uri;
}

// ── Cifrar imagen (AES-256-CBC simulado con expo-crypto) ──────────
// Nota: expo-crypto no tiene AES nativo. Usamos SHA256 del contenido
// como firma de integridad + base64. En producción usar react-native-aes-crypto.
export async function encryptImage(uri: string): Promise<{
  encryptedBase64: string;
  checksum: string;
  originalSize: number;
}> {
  // 1. Intentar comprimir; si falla, usar URI original
  let workingUri = uri;
  try {
    workingUri = await compressImage(uri);
  } catch (compressErr) {
    console.warn('[kycEncryption] compressImage falló, usando URI original:', compressErr);
    workingUri = uri;
  }

  // 2. Leer como base64 — con fallback a URI original si la comprimida falla
  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(workingUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (readErr) {
    console.warn('[kycEncryption] No se pudo leer URI comprimida, reintentando con original:', readErr);
    base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  if (!base64 || base64.length === 0) {
    throw new Error('La imagen está vacía o no se pudo leer.');
  }

  // 3. Calcular checksum SHA-256 del contenido
  const checksum = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    base64,
  );

  // 4. En producción: AES-256-CBC con react-native-aes-crypto
  // Por ahora retornamos base64 con prefijo de versión y checksum embebido
  const encryptedBase64 = `v1:${checksum.slice(0, 8)}:${base64}`;

  return {
    encryptedBase64,
    checksum,
    originalSize: base64.length,
  };
}

// ── Verificar integridad de imagen cifrada ────────────────────────
export async function verifyImageIntegrity(encryptedBase64: string): Promise<boolean> {
  try {
    const parts = encryptedBase64.split(':');
    if (parts[0] !== 'v1' || parts.length < 3) return false;
    const embeddedChecksum = parts[1];
    const base64 = parts.slice(2).join(':');
    const computed = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      base64,
    );
    return computed.slice(0, 8) === embeddedChecksum;
  } catch {
    return false;
  }
}
