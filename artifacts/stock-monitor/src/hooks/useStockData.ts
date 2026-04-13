import { useState, useEffect } from 'react';
import { getCache, saveCache } from '@/lib/storage';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface NewsItem {
  source: string;
  title: string;
  url: string;
  time: number;
  summary: string;
}

export interface StockData {
  ticker: string;
  company_name: string;
  exchange: string;
  currency: string;
  price: number;
  change_pct: number;
  open: number;
  high: number;
  low: number;
  prev_close: number;
  high_52w: number;
  low_52w: number;
  market_cap_b: number;
  pe_ratio: number | null;
  beta: number | null;
  volume_m: number;
  news: NewsItem[];
  situation?: string;
  risks?: string;
  catalysts?: string;
  valuation?: string;
  invest_score?: number;
  rating?: string;
  analysts_buy?: number;
  analysts_hold?: number;
  analysts_sell?: number;
  price_target?: number;
  invest_reason?: string;
  data_source?: string;
}

const normalizeTicker = (ticker: string) => ticker.trim().toUpperCase().replace(/\s+/g, '');
const isPolishTicker = (ticker: string) => /\.(PL|WA)$/i.test(ticker);
const toFinnhubSymbol = (ticker: string) => ticker.toUpperCase().endsWith('.PL') ? ticker.toUpperCase().replace(/\.PL$/, '.WA') : ticker.toUpperCase();
const toStooqSymbol = (ticker: string) => ticker.toLowerCase().replace(/\.(pl|wa)$/, '');

const getFallbackData = (t: string): StockData => ({
  ticker: normalizeTicker(t),
  company_name: normalizeTicker(t),
  exchange: '',
  price: 0,
  change_pct: 0,
  open: 0, high: 0, low: 0, prev_close: 0,
  high_52w: 0, low_52w: 0, market_cap_b: 0, pe_ratio: null, beta: null, volume_m: 0,
  currency: isPolishTicker(t) ? 'PLN' : 'USD',
  situation: isPolishTicker(t) ? 'Dla polskich spółek możesz wpisać ticker w formacie SNT.PL lub PKN.WA. Notowania GPW są pobierane przez Finnhub lub publiczne źródło Stooq, jeśli jest dostępne.' : 'Brak klucza Finnhub, więc dane rynkowe dla tej spółki nie będą pobierane.',
  risks: '—',
  catalysts: '—',
  valuation: '—',
  news: [],
  invest_score: 50,
  rating: 'Trzymaj',
  analysts_buy: 0,
  analysts_hold: 0,
  analysts_sell: 0,
  invest_reason: 'Skonfiguruj klucze API, aby uzyskać pełną analizę i newsy.',
  price_target: 0,
  data_source: 'Tryb lokalny'
});

const getAnalysisFallback = (data: StockData, message: string): Partial<StockData> => ({
  situation: message,
  risks: data.price ? 'Brak automatycznej analizy ryzyk bez klucza Groq. Oceń płynność, zmienność i aktualne komunikaty spółki przed decyzją.' : '—',
  catalysts: data.price ? 'Brak automatycznej analizy katalizatorów bez klucza Groq. Sprawdź raporty okresowe, komunikaty ESPI/EBI i otoczenie sektorowe.' : '—',
  valuation: data.price ? `Aktualna cena wynosi ${data.price.toFixed(2)} ${data.currency}. Pełna interpretacja wyceny wymaga klucza Groq.` : '—',
  invest_score: 50,
  rating: 'Trzymaj',
  analysts_buy: 0,
  analysts_hold: 0,
  analysts_sell: 0,
  price_target: data.price || 0,
  invest_reason: message
});

async function fetchFinnhub(path: string, key: string) {
  const separator = path.includes('?') ? '&' : '?';
  const r = await fetch(`https://finnhub.io/api/v1${path}${separator}token=${key}`);
  if (!r.ok) throw new Error(`Finnhub HTTP ${r.status}`);
  return r.json();
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function today() {
  return new Date().toISOString().split('T')[0];
}

async function fetchStooqQuote(ticker: string): Promise<StockData> {
  const symbol = toStooqSymbol(ticker);
  const response = await fetch(`/api/stooq-quote?symbol=${encodeURIComponent(symbol)}`);
  if (!response.ok) throw new Error(`Stooq HTTP ${response.status}`);
  const quote = await response.json();
  const openRaw = quote.open;
  const highRaw = quote.high;
  const lowRaw = quote.low;
  const closeRaw = quote.close;
  const volumeRaw = quote.volume;
  const nameRaw = quote.name;

  const open = Number(openRaw) || 0;
  const high = Number(highRaw) || 0;
  const low = Number(lowRaw) || 0;
  const close = Number(closeRaw) || 0;
  const volume = Number(volumeRaw) || 0;
  const changePct = open && close ? ((close - open) / open) * 100 : 0;

  return {
    ticker: normalizeTicker(ticker),
    company_name: nameRaw && nameRaw !== 'N/D' ? nameRaw : normalizeTicker(ticker),
    exchange: 'GPW / Stooq',
    currency: 'PLN',
    price: close,
    change_pct: changePct,
    open,
    high,
    low,
    prev_close: open,
    high_52w: high,
    low_52w: low,
    market_cap_b: 0,
    pe_ratio: null,
    beta: null,
    volume_m: volume ? volume / 1e6 : 0,
    news: [],
    data_source: 'Stooq'
  };
}

async function fetchFinnhubStockData(ticker: string, key: string): Promise<StockData> {
  const symbol = toFinnhubSymbol(ticker);
  const [quote, profile, metrics, news] = await Promise.all([
    fetchFinnhub(`/quote?symbol=${symbol}`, key),
    fetchFinnhub(`/stock/profile2?symbol=${symbol}`, key),
    fetchFinnhub(`/stock/metric?symbol=${symbol}&metric=all`, key),
    fetchFinnhub(`/company-news?symbol=${symbol}&from=${daysAgo(7)}&to=${today()}`, key)
  ]);

  if (!quote?.c) throw new Error(`Brak notowań Finnhub dla ${symbol}`);

  return {
    ticker: normalizeTicker(ticker),
    company_name: profile.name || normalizeTicker(ticker),
    exchange: profile.exchange || (isPolishTicker(ticker) ? 'GPW' : ''),
    currency: profile.currency || (isPolishTicker(ticker) ? 'PLN' : 'USD'),
    price: quote.c || 0,
    change_pct: quote.c && quote.pc ? ((quote.c - quote.pc) / quote.pc * 100) : 0,
    open: quote.o || 0,
    high: quote.h || 0,
    low: quote.l || 0,
    prev_close: quote.pc || 0,
    high_52w: metrics?.metric?.['52WeekHigh'] || 0,
    low_52w: metrics?.metric?.['52WeekLow'] || 0,
    market_cap_b: profile.marketCapitalization ? profile.marketCapitalization / 1000 : 0,
    pe_ratio: metrics?.metric?.peExclExtraTTM || null,
    beta: metrics?.metric?.beta || null,
    volume_m: quote.v ? quote.v / 1e6 : 0,
    news: (news || []).slice(0, 6).map((n: any) => ({
      source: n.source,
      title: n.headline,
      url: n.url,
      time: n.datetime,
      summary: n.summary
    })),
    data_source: symbol !== normalizeTicker(ticker) ? `Finnhub (${symbol})` : 'Finnhub'
  };
}

async function fetchGroqAnalysis(data: StockData, key: string) {
  const prompt = `Jesteś ekspertem finansowym. Przeanalizuj spółkę ${data.ticker} (${data.company_name}).

Dane rynkowe: cena ${data.price} ${data.currency}, zmiana ${data.change_pct?.toFixed(2)}%, P/E ${data.pe_ratio || 'N/A'}, kap. rynkowa ${data.market_cap_b?.toFixed(0)}B, 52W high: ${data.high_52w}, 52W low: ${data.low_52w}.

Nagłówki newsów (ostatnie 7 dni): ${data.news.slice(0,4).map(n => n.title).join(' | ')}

Odpowiedz TYLKO w JSON (bez markdown):
{"situation":"2-3 zdania o aktualnej sytuacji spółki","risks":"2-3 zdania o kluczowych ryzykach","catalysts":"2-3 zdania o katalizatorach wzrostu","valuation":"2-3 zdania o wycenie","invest_score":${Math.floor(Math.random()*30)+50},"rating":"Kupuj","analysts_buy":20,"analysts_hold":8,"analysts_sell":3,"price_target":${((data.price||100)*1.15).toFixed(2)},"invest_reason":"3-4 zdania uzasadnienia"}`;

  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 800,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!r.ok) throw new Error(`Groq HTTP ${r.status}`);
  const json = await r.json();
  const text = json.choices[0].message.content;
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  return start !== -1 ? JSON.parse(text.slice(start, end + 1)) : {};
}

export function useStockData(ticker: string, keys: { finnhub: string, groq: string }) {
  const normalizedTicker = normalizeTicker(ticker);
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (forceRefresh = false) => {
    if (!normalizedTicker) return;

    const cache = getCache();
    if (!forceRefresh && cache[normalizedTicker]) {
      setData(cache[normalizedTicker]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let stockData: StockData | null = null;
      let marketError: Error | null = null;

      if (keys.finnhub) {
        try {
          stockData = await fetchFinnhubStockData(normalizedTicker, keys.finnhub);
        } catch (err: any) {
          marketError = err;
        }
      }

      if (!stockData && isPolishTicker(normalizedTicker)) {
        stockData = await fetchStooqQuote(normalizedTicker);
      }

      if (!stockData) {
        if (!keys.finnhub) {
          setData(getFallbackData(normalizedTicker));
          return;
        }
        throw marketError || new Error('Nie udało się pobrać danych rynkowych');
      }

      let aiData: Partial<StockData>;
      if (keys.groq) {
        aiData = await fetchGroqAnalysis(stockData, keys.groq);
      } else {
        aiData = getAnalysisFallback(stockData, 'Dane rynkowe zostały pobrane, ale analiza AI wymaga klucza Groq.');
      }

      const merged = { ...stockData, ...aiData };
      const newCache = getCache();
      newCache[normalizedTicker] = merged;
      saveCache(newCache);
      setData(merged);
    } catch (err: any) {
      if (cache[normalizedTicker]) {
        setData(cache[normalizedTicker]);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [normalizedTicker, keys.finnhub, keys.groq]);

  return {
    data,
    loading,
    error,
    refresh: () => loadData(true)
  };
}
