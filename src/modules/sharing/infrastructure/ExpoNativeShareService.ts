import * as Sharing from 'expo-sharing';
import { NativeShareService } from '../domain/NativeShareService';
import { shareUnavailableError } from '../../../shared/errors/AppError';

export class ExpoNativeShareService implements NativeShareService {
  async shareFile(uri: string, title: string, mimeType?: string) {
    const available = await Sharing.isAvailableAsync();

    if (!available) {
      throw shareUnavailableError();
    }

    await Sharing.shareAsync(uri, {
      dialogTitle: title,
      mimeType: mimeType ?? 'application/pdf',
      UTI: mimeType === 'application/json' ? 'public.json' : 'com.adobe.pdf',
    });
  }
}
