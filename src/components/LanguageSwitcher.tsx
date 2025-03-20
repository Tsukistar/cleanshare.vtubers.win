import { Select } from '@arco-design/web-react';

interface LanguageSwitcherProps {
  onChange: (locale: string) => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ onChange }) => {
  const options = [
    { label: '简体中文', value: 'zh-Hans' },
    { label: '繁體中文', value: 'zh-Hant' },
    { label: 'English', value: 'en-US' },
    { label: '日本語', value: 'ja-JP' },
  ];

  return (
    <Select
      defaultValue="zh-Hans"
      onChange={onChange}
      style={{ width: 120 }}
      options={options}
    />
  );
};

export default LanguageSwitcher;