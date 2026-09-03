import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import * as DocumentPicker from 'expo-document-picker';
import * as Contacts from 'expo-contacts';
import { chatAPI } from '../api';
import { toast } from '../components/Toast';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 64 * 1024 * 1024;
const MAX_FILE_BYTES = 32 * 1024 * 1024;
const MAX_AUDIO_BYTES = 32 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1600;

export interface PickedAsset {
  uri: string;
  fileName: string;
  mimeType: string;
  size?: number;
}

function isTooLarge(size: number | undefined, maxBytes: number) {
  return typeof size === 'number' && size > maxBytes;
}

function rejectLargeAsset(size: number | undefined, maxBytes: number) {
  if (!isTooLarge(size, maxBytes)) return false;
  toast.error('Archivo muy grande', `Maximo permitido: ${formatFileSize(maxBytes)}`);
  return true;
}

function pickFromWebInput(accept: string, maxBytes: number, fallbackMime: string): Promise<PickedAsset | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      if (rejectLargeAsset(file.size, maxBytes)) { resolve(null); return; }
      const uri = URL.createObjectURL(file);
      resolve({ uri, fileName: file.name, mimeType: file.type || fallbackMime, size: file.size });
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

function documentAssetToPickedAsset(
  asset: DocumentPicker.DocumentPickerAsset,
  fallbackMime = 'application/octet-stream',
): PickedAsset {
  return {
    uri: asset.uri,
    fileName: asset.name || 'archivo',
    mimeType: asset.mimeType || fallbackMime,
    size: asset.size,
  };
}

async function prepareImageAsset(asset: ImagePicker.ImagePickerAsset): Promise<PickedAsset | null> {
  if (rejectLargeAsset(asset.fileSize, MAX_IMAGE_BYTES)) return null;

  const shouldResize = typeof asset.width === 'number' && asset.width > MAX_IMAGE_WIDTH;
  const actions: ImageManipulator.Action[] = shouldResize
    ? [{ resize: { width: MAX_IMAGE_WIDTH } }]
    : [];

  try {
    const manipulated = await ImageManipulator.manipulateAsync(asset.uri, actions, {
      compress: 0.82,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return {
      uri: manipulated.uri,
      fileName: (asset.fileName || 'photo.jpg').replace(/\.[^.]+$/, '.jpg'),
      mimeType: 'image/jpeg',
      size: asset.fileSize,
    };
  } catch {
    const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
    return {
      uri: asset.uri,
      fileName: asset.fileName || `photo.${ext}`,
      mimeType: asset.mimeType || `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      size: asset.fileSize,
    };
  }
}

/** Seleccionar múltiples imágenes de la galería (álbum) — máx 10 */
export async function pickMultipleImages(): Promise<PickedAsset[]> {
  if (typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = async () => {
        const files = Array.from(input.files || []).slice(0, 10);
        const assets = files.map(f => ({
          uri: URL.createObjectURL(f),
          fileName: f.name,
          mimeType: f.type,
          size: f.size,
        }));
        resolve(assets);
      };
      input.oncancel = () => resolve([]);
      input.click();
    });
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    toast.error('Permiso requerido', 'Activa el acceso a la galería');
    return [];
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: 10,
    quality: 0.85,
  });
  if (result.canceled || !result.assets?.length) return [];
  return (await Promise.all(result.assets.map(a => prepareImageAsset(a)))).filter(Boolean) as PickedAsset[];
}

export async function pickImageFromLibrary(): Promise<PickedAsset | null> {
  // En web usar input HTML directamente
  if (typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        const uri = URL.createObjectURL(file);
        resolve({ uri, fileName: file.name, mimeType: file.type, size: file.size });
      };
      input.oncancel = () => resolve(null);
      input.click();
    });
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    toast.error('Permiso requerido', 'Activa el acceso a la galería');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
  });
  if (result.canceled || !result.assets[0]) return null;
  return prepareImageAsset(result.assets[0]);
}

export async function pickImageFromCamera(): Promise<PickedAsset | null> {
  // En web usar input con capture
  if (typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      (input as any).capture = 'environment';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        const uri = URL.createObjectURL(file);
        resolve({ uri, fileName: file.name, mimeType: file.type, size: file.size });
      };
      input.oncancel = () => resolve(null);
      input.click();
    });
  }
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    toast.error('Permiso requerido', 'Activa el acceso a la cámara');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
  if (result.canceled || !result.assets[0]) return null;
  return prepareImageAsset(result.assets[0]);
}

export async function pickVideo(): Promise<PickedAsset | null> {
  if (typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        if (rejectLargeAsset(file.size, MAX_VIDEO_BYTES)) { resolve(null); return; }
        const uri = URL.createObjectURL(file);
        resolve({ uri, fileName: file.name, mimeType: file.type, size: file.size });
      };
      input.oncancel = () => resolve(null);
      input.click();
    });
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    toast.error('Permiso requerido', 'Activa el acceso a la galería');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) return null;
  const a = result.assets[0];
  if (rejectLargeAsset(a.fileSize, MAX_VIDEO_BYTES)) return null;
  return {
    uri: a.uri,
    fileName: a.fileName || 'video.mp4',
    mimeType: a.mimeType || 'video/mp4',
    size: a.fileSize,
  };
}

export async function pickFile(): Promise<PickedAsset | null> {
  return pickDocument();
}

export async function getCurrentLocationLabel(): Promise<{ lat: string; lng: string; label: string } | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    toast.error('Permiso requerido', 'Activa la ubicación para compartirla');
    return null;
  }
  try {
    // GPS: obteniendo ubicación silenciosamente
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const lat = pos.coords.latitude.toFixed(6);
    const lng = pos.coords.longitude.toFixed(6);
    return { lat, lng, label: 'Mi ubicación actual' };
  } catch {
    toast.error('GPS', 'No se pudo obtener tu ubicación');
    return null;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export async function pickVideoFromCamera(): Promise<PickedAsset | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    toast.error('Permiso requerido', 'Activa el acceso a la cámara');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    videoMaxDuration: 60,
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) return null;
  const a = result.assets[0];
  if (rejectLargeAsset(a.fileSize, MAX_VIDEO_BYTES)) return null;
  return {
    uri: a.uri,
    fileName: a.fileName || 'video.mp4',
    mimeType: a.mimeType || 'video/mp4',
    size: a.fileSize,
  };
}

export async function pickDocument(): Promise<PickedAsset | null> {
  // En web usar input HTML con accept */*
  if (typeof document !== 'undefined') {
    return pickFromWebInput('*/*', MAX_FILE_BYTES, 'application/octet-stream');
  }
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = documentAssetToPickedAsset(result.assets[0]);
  if (rejectLargeAsset(asset.size, MAX_FILE_BYTES)) return null;
  return asset;
}

export async function pickAudio(): Promise<PickedAsset | null> {
  if (typeof document !== 'undefined') {
    return pickFromWebInput('audio/*', MAX_AUDIO_BYTES, 'audio/mpeg');
  }
  const result = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = documentAssetToPickedAsset(result.assets[0], 'audio/mpeg');
  if (rejectLargeAsset(asset.size, MAX_AUDIO_BYTES)) return null;
  return asset;
}

export async function pickContact(): Promise<{ name: string; phone: string } | null> {
  // expo-contacts solo funciona en nativo; en web delegamos al modal de EGCHAT
  if (typeof document !== 'undefined') {
    // Redirigir a contactos EGCHAT silenciosamente
    return null;
  }

  try {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      toast.error('Permiso requerido', 'Activa el acceso a contactos');
      return null;
    }

    const contact = await Contacts.presentContactPickerAsync();
    if (!contact) return null;

    const phone = contact.phoneNumbers?.find(item => item.number)?.number || '';
    if (!phone) {
      toast.error('Contacto sin teléfono', 'Elige un contacto con número');
      return null;
    }

    return {
      name: contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Contacto',
      phone,
    };
  } catch {
    toast.error('Contactos', 'No se pudo abrir la agenda del dispositivo');
    return null;
  }
}

export async function uploadAndSend(
  chatId: string,
  asset: PickedAsset,
  message: { text: string; type: string },
): Promise<any> {
  const uploaded = await chatAPI.uploadFile(chatId, asset.uri, asset.fileName, asset.mimeType);
  return chatAPI.sendMessage(chatId, {
    text: message.text,
    type: message.type,
    file_url: uploaded.file_url,
  });
}
