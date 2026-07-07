import * as Sharing from 'expo-sharing';

export class ShareService {
  async shareFile(fileUri: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Compartir no está disponible en este dispositivo.');
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir catálogo',
      });
    } catch (error) {
      throw new Error(`Error al compartir archivo: ${error}`);
    }
  }
}
