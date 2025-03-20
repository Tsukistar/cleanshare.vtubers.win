interface PlatformRule {
  domain: string;
  name: string;
  params: string[];
  paramsDescription: string[];
}

let rules: PlatformRule[] = [];

export async function loadRules(): Promise<void> {
  try {
    const response = await fetch('/data/rules.json');
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    rules = await response.json();
  } catch (error) {
    console.error('加载规则失败:', error);
    rules = [];
  }
}

export function detectPlatform(url: string): PlatformRule | null {
  try {
    const urlObj = new URL(url);
    return rules.find((rule) => urlObj.hostname.includes(rule.domain)) || null;
  } catch {
    return null;
  }
}
