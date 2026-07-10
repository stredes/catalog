export interface PreferencesPort {
  getBoolean(key: string): Promise<boolean | null>;
  setBoolean(key: string, value: boolean): Promise<void>;
}
