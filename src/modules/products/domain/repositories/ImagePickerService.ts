export type ImageSource = 'camera' | 'gallery';

export interface ImagePickerService {
  pickImage(source: ImageSource): Promise<string | undefined>;
}
