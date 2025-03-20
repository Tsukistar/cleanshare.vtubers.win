import { useState, useEffect, useCallback, useRef } from 'react';
import { Input, Checkbox, Spin } from '@arco-design/web-react';
import { detectPlatform, loadRules } from './lib/urlRules';
import { loadTranslation } from './lib/translations';
import type { Translation } from './lib/translations';
import LanguageSwitcher from './components/LanguageSwitcher';
import GitHubButton from 'react-github-btn';
import './App.css';

const getBrowserLanguage = (): string => {
  const browserLang = navigator.language || navigator.languages?.[0] || 'zh-Hans';
  const langMap: Record<string, string> = {
    'zh-CN': 'zh-Hans',
    'zh-TW': 'zh-Hant',
    'zh-HK': 'zh-Hant',
    'zh': 'zh-Hans',
    'en-US': 'en-US',
    'en-GB': 'en-US',
    'en': 'en-US',
    'ja-JP': 'ja-JP',
    'ja': 'ja-JP',
  };
  return langMap[browserLang] || langMap[browserLang.split('-')[0]] || 'zh-Hans';
};

const App: React.FC = () => {
  const [locale, setLocale] = useState(getBrowserLanguage());
  const [inputText, setInputText] = useState('');
  const [extractedUrl, setExtractedUrl] = useState('');
  const [platform, setPlatform] = useState<{
    name: string;
    params: string[];
    paramsDescription: string[];
  } | null>(null);
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
  const [paramsMap, setParamsMap] = useState<Record<string, string>>({});
  const [processedUrl, setProcessedUrl] = useState('');
  const [t, setT] = useState<Translation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    const loadInitialTranslation = async () => {
      try {
        const translation = await loadTranslation('zh-Hans');
        setT(translation);
      } catch (error) {
        console.error('Failed to load initial translation:', error);
      }
    };
    loadRules();
    loadInitialTranslation();
  }, []);

  useEffect(() => {
      loadTranslation(locale).then(setT);
  }, [locale]);

  useEffect(() => {
    if (t) {
      document.title = t.title;
    }
  }, [t]);

  const extractUrl = useCallback((text: string): string => {
    const match = text.match(/https:\/\/[^\s]+/);
    return match ? match[0] : '';
  }, []);

  const parseUrlParams = useCallback((url: string): Record<string, string> => {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      const result: Record<string, string> = {};
      params.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    } catch {
      return {};
    }
  }, []);

  const debounce = (fn: (value: string) => void, delay: number) => {
    let timer: number | NodeJS.Timeout | undefined;
    return (value: string) => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        fn(value);
      }, delay);
    };
  };

  const generateProcessedUrl = useCallback(
    (baseUrl: string, params: Record<string, string>, selected: string[]) => {
      const urlObj = new URL(baseUrl);
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (selected.includes(key)) {
          searchParams.set(key, value);
        }
      }
      urlObj.search = searchParams.toString();
      return urlObj.toString();
    },
    [],
  );

  const detect = useCallback(
    (value: string) => {
      const url = extractUrl(value);
      setExtractedUrl(url);
      if (url) {
        const detected = detectPlatform(url);
        setPlatform(detected);
        const params = parseUrlParams(url);
        setParamsMap(params);
        setSelectedParams(detected?.params || []);
        setProcessedUrl(
          detected
            ? generateProcessedUrl(url, params, detected?.params || [])
            : url.split('?')[0],
        );
      } else {
        setPlatform(null);
        setParamsMap({});
        setProcessedUrl('');
      }
      setIsLoading(false);
    },
    [extractUrl, parseUrlParams, generateProcessedUrl],
  );

  const debouncedDetectRef = useRef(debounce(detect, 2000));

  useEffect(() => {
    if (inputText) {
      setIsLoading(true);
      debouncedDetectRef.current(inputText);
    }
  }, [inputText]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (isMounted.current) {
        setInputText(text);
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(processedUrl);
    alert(t ? t.copySuccess : 'Copied!');
  };

  if (!t) {
    return null; // 翻译未加载时留空
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="header-title">{t.title}</h1>
        <LanguageSwitcher onChange={setLocale} />
      </header>

      <main className="main-content">
        <div className="input-container">
          <Input
            value={inputText}
            onChange={setInputText}
            placeholder={t.placeholder}
            className="input-field"
          />
          <button
            type="button"
            onClick={handlePaste}
            className="paste-button"
            aria-label={t.paste}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <title>{t.paste}</title>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <section className="platform-section">
            <Spin tip={t.loading} />
          </section>
        ) : (
          extractedUrl && (
            <section className="platform-section">
              {platform ? (
                <>
                  <div className="platform-title">
                    <strong>
                      {t.platform}: {platform.name}
                    </strong>
                  </div>
                  <Checkbox.Group
                    value={selectedParams}
                    onChange={(values) => {
                      setSelectedParams(values);
                      setProcessedUrl(
                        generateProcessedUrl(extractedUrl, paramsMap, values),
                      );
                    }}
                    className="checkbox-group"
                    options={platform.params.map((param, index) => ({
                      label: `${t.params[platform.paramsDescription[index]]}`,
                      value: param,
                    }))}
                  />
                </>
              ) : (
                <p>{t.noMatch}</p>
              )}
              <div className="result-container">
                <Input value={processedUrl} readOnly className="result-input" />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="copy-button"
                  aria-label={t.copy}
                >
                  {t.copy}
                </button>
              </div>
            </section>
          )
        )}

        <div className="button-group">
          <GitHubButton
            href="https://github.com/Tsukistar/cleanshare.vtubers.win"
            data-color-scheme="no-preference: light; light: light; dark: dark;"
            data-size="large"
            aria-label="GitHub"
          >
            Github
          </GitHubButton>
          <a
            href="https://ko-fi.com/tsukistarglobal"
            target="_blank"
            rel="noreferrer"
          >
            <img
              height="26"
              src="https://storage.ko-fi.com/cdn/kofi5.png?v=6"
              alt="Buy Me a Coffee"
            />
          </a>
        </div>

        <section className="supported-section">
          <div className="supported-title">
            <strong>{t.supported}</strong>
          </div>
          <ul className="supported-list">
            {Object.entries(t.supportedPlatforms).map(([key, platform]) => (
              <li key={key}>
                {platform.name}{platform.description ? ` - ${platform.description}` : ''}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="footer" />
    </div>
  );
};

export default App;