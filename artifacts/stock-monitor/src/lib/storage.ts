export const getKeys = () => {
  return {
    finnhub: localStorage.getItem('key_finnhub') || '',
    groq: localStorage.getItem('key_groq') || ''
  };
};

export const saveKeys = (finnhub: string, groq: string) => {
  localStorage.setItem('key_finnhub', finnhub.trim());
  localStorage.setItem('key_groq', groq.trim());
};

export const getWatchlist = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('wl') || '[]');
  } catch (e) {
    return [];
  }
};

export const saveWatchlist = (watchlist: string[]) => {
  localStorage.setItem('wl', JSON.stringify(watchlist));
};

export const getCache = (): Record<string, any> => {
  try {
    return JSON.parse(localStorage.getItem('cache') || '{}');
  } catch (e) {
    return {};
  }
};

export const saveCache = (cache: Record<string, any>) => {
  localStorage.setItem('cache', JSON.stringify(cache));
};

export const clearCacheForTicker = (ticker: string) => {
  const cache = getCache();
  delete cache[ticker];
  saveCache(cache);
};
