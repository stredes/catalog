export interface NativeShareService {
  shareFile(uri: string, title: string, mimeType?: string): Promise<void>;
}
