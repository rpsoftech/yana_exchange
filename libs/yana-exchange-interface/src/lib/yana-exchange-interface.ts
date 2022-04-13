export interface YanaSdkInitOptions {
  name?: string;
  language?: SupportedLanguage;
}

export type SupportedLanguage = 'EN' | 'DE' | 'AR' | 'ES' | 'IT';
