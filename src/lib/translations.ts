export interface Translation {
  title: string;
  placeholder: string;
  platform: string;
  params: Record<string, string>;
  supported: string;
  supportedPlatforms: Record<string, { name: string; description: string }>;
  paste: string;
  loading: string;
  noMatch: string;
  copy: string;
  copySuccess: string;
  copyFailure: string;
}

const translations: { [key: string]: Translation } = {};

export async function loadTranslation(locale: string): Promise<Translation> {
  if (translations[locale]) return translations[locale];

  try {
    const response = await fetch(`/data/translations/${locale}.json`);
    const data = await response.json();
    translations[locale] = data;
    return data;
  } catch (error) {
    console.error(`加载 ${locale} 翻译失败:`, error);
    return translations['zh-Hans'] || {};
  }
}
