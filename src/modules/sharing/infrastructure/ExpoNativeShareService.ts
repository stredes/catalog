import * as Sharing from 'expo-sharing';
import { NativeShareService } from '../domain/NativeShareService';

export class ExpoNativeShareService implements NativeShareService {
  async shareFile(uri: string, title: string) {
    const available = await Sharing.isAvailableAsync();

    if (!available) {
      throw new Error('Compartir no esta disponible en este dispositivo');
    }

    await Sharing.shareAsync(uri, {
      dialogTitle: title,
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
    });
  }
}
