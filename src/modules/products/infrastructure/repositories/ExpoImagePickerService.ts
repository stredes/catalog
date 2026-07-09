import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { ImagePickerService, ImageSource } from '../../domain/repositories/ImagePickerService';

const MAX_IMAGE_DIMENSION = 1024;
const JPEG_QUALITY = 0.75;

function getExtension(uri: string) {
  const match = uri.match(/\.[a-zA-Z0-9]+(?:\?|$)/);
  return match ? match[0].replace('?', '') : '.jpg';
}

export class ExpoImagePickerService implements ImagePickerService {
  async pickImage(source: ImageSource) {
    if (source === 'camera') {
      return this.takePhoto();
    }
    return this.pickFromGallery();
  }

  private async takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      throw new Error('Permiso de cámara denegado');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) {
      return undefined;
    }

    const uri = result.assets[0]?.uri;
    if (!uri) return undefined;

    return this.copyToPersistentStorage(uri);
  }

  private async pickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      throw new Error('Permiso de galería denegado');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      mediaTypes: ['images'],
    });

    if (result.canceled) {
      return undefined;
    }

    const uri = result.assets[0]?.uri;
    if (!uri) return undefined;

    return this.copyToPersistentStorage(uri);
  }

  private async copyToPersistentStorage(uri: string) {
    const imagesDir = new Directory(Paths.document, 'product-images');
    imagesDir.create({ idempotent: true, intermediates: true });

    const dest = new File(imagesDir, `product_${Date.now()}${getExtension(uri)}`);

    const resized = await ImageManipulator.manipulate(uri)
      .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION })
      .renderAsync();

    const result = await resized.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });

    const source = new File(result.uri);
    source.copy(dest);

    return dest.uri;
  }
}
