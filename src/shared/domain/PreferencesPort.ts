export interface PreferencesPort {
  getBoolean(key: string): Promise<boolean | null>;
  setBoolean(key: string, value: boolean): Promise<void>;
  getString(key: string): Promise<string | null>;
  setString(key: string, value: string): Promise<void>;
}
