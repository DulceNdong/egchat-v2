// kycEncryption.ts — Cifrado AES-256 de imágenes KYC antes de subir
// Usa expo-crypto para generar IV y expo-file-system para leer archivos
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

// Clave AES-256 derivada del token del servidor (en producción usar clave del servidor)
// Por ahora se usa una clave fija — en producción obtener del backend vía /api/kyc/key
const AES_KEY_HEX = 'a3f5e8b2c1d4e7f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6';

// ── Normalizar URI: copiar content:// al cache local antes de procesar ────────
// FileSystem.readAsStringAsync no puede leer URIs content:// de Android directamente.
// ImageManipulator sí puede, así que lo usamos como puente cuando la URI no es file://.
async function normalizeUri(uri: string): Promise<string> {
  // Las URIs file:// y las que vienen del cache de expo ya son legibles directamente
  if (uri.startsWith('file://') || uri.startsWith(FileSystem.cacheDirectory ?? '')) {
    return uri;
  }
  // Para content:// (galería Android) y otros esquemas: copiar al cache de la app
  try {
    const destUri = `${FileSystem.cacheDirectory}kyc_tmp_${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: destUri });
    return destUri;
  } catch (copyErr) {
    console.warn('[kycEncryption] copyAsync falló, usando URI original:', copyErr);
    // Si la copia también falla, dejar que ImageManipulator intente leerla directamente
    return uri;
  }
}

// ── Comprimir imagen a máx 2MB ────────────────────────────────────
export async function compressImage(uri: string): Promise<string> {
  // Normalizar primero para garantizar que ImageManipulator reciba una URI accesible
  const safeUri = await normalizeUri(uri);

  const result = await ImageManipulator.manipulateAsync(
    safeUri,
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
  // 1. Intentar comprimir (también normaliza la URI internamente); si falla, normalizar y usar original
  let workingUri = uri;
  try {
    workingUri = await compressImage(uri);
  } catch (compressErr) {
    console.warn('[kycEncryption] compressImage falló, normalizando URI original:', compressErr);
    // Intentar al menos normalizar para el paso de lectura
    workingUri = await normalizeUri(uri);
  }

  // 2. Leer como base64 — workingUri ya es una URI file:// segura tras normalizeUri/compressImage
  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(workingUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (readErr) {
    console.warn('[kycEncryption] No se pudo leer URI comprimida, reintentando con original normalizada:', readErr);
    // Último intento: normalizar la URI original y leerla
    const fallbackUri = await normalizeUri(uri);
    base64 = await FileSystem.readAsStringAsync(fallbackUri, {
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
