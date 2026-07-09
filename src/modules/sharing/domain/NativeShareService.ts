export interface NativeShareService {
  shareFile(uri: string, title: string): Promise<void>;
}
