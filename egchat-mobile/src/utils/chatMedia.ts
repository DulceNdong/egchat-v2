import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { chatAPI } from '../api';
import { toast } from '../components/Toast';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 64 * 1024 * 1024;
const MAX_FILE_BYTES = 32 * 1024 * 1024;
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

export async function pickImageFromLibrary(): Promise<PickedAsset | null> {
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
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    toast.error('Permiso requerido', 'Activa el acceso a archivos');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) return null;
  const a = result.assets[0];
  const isVideo = a.type === 'video';
  if (rejectLargeAsset(a.fileSize, isVideo ? MAX_VIDEO_BYTES : MAX_FILE_BYTES)) return null;
  const ext = (a.uri.split('.').pop() || (isVideo ? 'mp4' : 'jpg')).toLowerCase();
  return {
    uri: a.uri,
    fileName: a.fileName || (isVideo ? `video.${ext}` : `file.${ext}`),
    mimeType: a.mimeType || (isVideo ? 'video/mp4' : 'application/octet-stream'),
    size: a.fileSize,
  };
}

export async function getCurrentLocationLabel(): Promise<{ lat: string; lng: string; label: string }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return { lat: '3.7520', lng: '8.7735', label: 'Malabo, Guinea Ecuatorial' };
  }
  try {
    toast.info('GPS', 'Obteniendo ubicación...');
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const lat = pos.coords.latitude.toFixed(6);
    const lng = pos.coords.longitude.toFixed(6);
    return { lat, lng, label: 'Mi ubicación actual' };
  } catch {
    return { lat: '3.7520', lng: '8.7735', label: 'Malabo, Guinea Ecuatorial' };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
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
