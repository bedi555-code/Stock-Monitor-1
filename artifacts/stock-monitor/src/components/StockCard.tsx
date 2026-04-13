import React, { useEffect, useState } from "react";
import { Trash2, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight, Minus, Download, Calculator } from "lucide-react";
import { useStockData, StockData } from "@/hooks/useStockData";
import { clearCacheForTicker } from "@/lib/storage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StockCardProps {
  ticker: string;
  keys: { finnhub: string; groq: string };
  onRemove: () => void;
  onDataUpdate?: (data: StockData) => void;
}

function timeAgo(unixTimestamp: number) {
  if (!unixTimestamp) return '';
  const seconds = Math.floor(Date.now() / 1000) - unixTimestamp;
  if (seconds < 3600) return Math.floor(seconds / 60) + ' min temu';
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' godz temu';
  return Math.floor(seconds / 86400) + ' dni temu';
}

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const csv = rows.map(row => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatMoney(value: number, currency: string) {
  const symbol = currency === 'PLN' ? 'zł' : currency === 'USD' ? '$' : currency;
  return currency === 'USD' ? `$${value.toFixed(2)}` : `${value.toFixed(2)} ${symbol}`;
}

export function StockCard({ ticker, keys, onRemove, onDataUpdate }: StockCardProps) {
  const { data, loading, error, refresh } = useStockData(ticker, keys);
  const [quantity, setQuantity] = useState('1');
  const [priceInput, setPriceInput] = useState('');
  const [commission, setCommission] = useState('0');

  useEffect(() => {
    if (data) onDataUpdate?.(data);
  }, [data]);

  useEffect(() => {
    if (data?.price) setPriceInput(data.price.toFixed(2));
  }, [data?.price, ticker]);

  const handleRemove = () => {
    clearCacheForTicker(ticker);
    onRemove();
  };

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <div className="text-sm text-muted-foreground">
          Pobieranie danych dla <span className="font-semibold text-foreground">{ticker}</span>...
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between p-4 md:p-5">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-muted border border-border/50 text-sm font-bold tracking-wider">
              {ticker}
            </span>
            <div className="text-sm text-destructive font-medium">Błąd: {error}</div>
          </div>
          <button onClick={handleRemove} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const cur = data.currency === 'PLN' ? 'zł' : (data.currency || '$');
  const currencyCode = data.currency || 'USD';
  const chg = parseFloat((data.change_pct || 0).toString());
  const isPos = chg > 0;
  const isNeg = chg < 0;
  const cap = parseFloat((data.market_cap_b || 0).toString());
  const capStr = cap >= 1000 ? '$' + (cap/1000).toFixed(1) + 'T' : cap > 0 ? '$' + cap.toFixed(0) + 'B' : '—';
  const score = Math.min(100, Math.max(0, parseInt((data.invest_score || 50).toString())));
  const barColor = score >= 65 ? 'bg-emerald-500' : score >= 45 ? 'bg-amber-500' : 'bg-red-500';
  const ratingRaw = (data.rating || '').toLowerCase();
  const isStrongBuy = ratingRaw.includes('strong buy') || (ratingRaw.includes('kupuj') && ratingRaw.includes('silny'));
  const isBuy = ratingRaw.includes('kupuj') || ratingRaw.includes('buy');
  const isSell = ratingRaw.includes('sprzedaj') || ratingRaw.includes('redukuj') || ratingRaw.includes('sell');
  const ratingClass = isStrongBuy ? 'bg-emerald-500/15 text-emerald-500' : isBuy ? 'bg-primary/15 text-primary' : isSell ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500';
  const buyCount = parseInt((data.analysts_buy || 0).toString());
  const holdCount = parseInt((data.analysts_hold || 0).toString());
  const sellCount = parseInt((data.analysts_sell || 0).toString());
  const totalAnalysts = buyCount + holdCount + sellCount || 1;
  const upside = data.price_target && data.price ? ((data.price_target - data.price) / data.price * 100) : 0;
  const quantityNumber = Math.max(0, Number(quantity.replace(',', '.')) || 0);
  const priceNumber = Math.max(0, Number(priceInput.replace(',', '.')) || 0);
  const commissionNumber = Math.max(0, Number(commission.replace(',', '.')) || 0);
  const subtotal = quantityNumber * priceNumber;
  const total = subtotal + commissionNumber;
  const breakevenPrice = quantityNumber ? total / quantityNumber : 0;

  const exportAnalysisCsv = () => {
    downloadCsv(`${data.ticker}-analiza-ai.csv`, [
      ['Ticker', 'Spółka', 'Cena', 'Waluta', 'Zmiana %', 'Ocena', 'Score', 'Sytuacja', 'Wycena', 'Katalizatory', 'Ryzyka', 'Uzasadnienie'],
      [data.ticker, data.company_name, data.price, data.currency, data.change_pct, data.rating, data.invest_score, data.situation, data.valuation, data.catalysts, data.risks, data.invest_reason]
    ]);
  };

  const exportNewsCsv = () => {
    downloadCsv(`${data.ticker}-newsy.csv`, [
      ['Ticker', 'Źródło', 'Tytuł', 'URL', 'Czas', 'Podsumowanie'],
      ...(data.news || []).map(item => [data.ticker, item.source, item.title, item.url, item.time ? new Date(item.time * 1000).toISOString() : '', item.summary])
    ]);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-wrap items-start justify-between p-4 md:p-5 gap-4">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-lg border text-[15px] font-bold tracking-wide ${isPos ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : isNeg ? 'bg-red-500/10 border-red-500/30 text-red-200' : 'bg-muted border-border/50'}`}>
            {data.ticker}
          </span>
          <div className="flex flex-col">
            <span className="text-[13px] text-muted-foreground font-medium">{data.company_name}</span>
            <span className="text-[10px] text-muted-foreground/70 uppercase tracking-widest">
              {[data.exchange, data.data_source].filter(Boolean).join(' • ')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold tracking-tight">
              {data.price?.toFixed(2)} <span className="text-[14px] text-muted-foreground font-normal">{cur}</span>
            </div>
            <div className={`text-[13px] font-medium flex items-center justify-end gap-1 mt-0.5 ${isPos ? 'text-emerald-500' : isNeg ? 'text-red-500' : 'text-muted-foreground'}`}>
              {isPos ? <ArrowUpRight className="h-3 w-3" /> : isNeg ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {isPos ? '+' : ''}{chg.toFixed(2)}%
            </div>
          </div>
          <div className="flex flex-col gap-1.5 border-l border-border/50 pl-4 ml-1">
            <button onClick={() => refresh()} disabled={loading} className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleRemove} className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 border-y border-border/50 bg-muted/20">
        <div className="p-3 px-4 border-r border-border/50 border-b sm:border-b-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Mkt Cap</div>
          <div className="text-[13px] font-semibold">{capStr}</div>
        </div>
        <div className="p-3 px-4 border-r border-border/50 border-b sm:border-b-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">P/E Ratio</div>
          <div className="text-[13px] font-semibold">{data.pe_ratio ? data.pe_ratio.toFixed(1) : '—'}</div>
        </div>
        <div className="p-3 px-4 border-r sm:border-border/50 border-b lg:border-b-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Vol (M)</div>
          <div className="text-[13px] font-semibold">{data.volume_m ? data.volume_m.toFixed(1) : '—'}</div>
        </div>
        <div className="p-3 px-4 border-r border-border/50 border-b lg:border-b-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Beta</div>
          <div className="text-[13px] font-semibold">{data.beta ? data.beta.toFixed(2) : '—'}</div>
        </div>
        <div className="p-3 px-4 border-r border-border/50">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">52W High</div>
          <div className="text-[13px] font-semibold">{data.high_52w?.toFixed(2) || '—'}</div>
        </div>
        <div className="p-3 px-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">52W Low</div>
          <div className="text-[13px] font-semibold">{data.low_52w?.toFixed(2) || '—'}</div>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="w-full justify-start rounded-none h-12 p-0 bg-transparent border-b border-border/50 px-2 overflow-x-auto overflow-y-hidden no-scrollbar">
          <TabsTrigger value="analysis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-[13px] font-medium transition-none">
            Analiza AI
          </TabsTrigger>
          <TabsTrigger value="rating" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-[13px] font-medium transition-none">
            Ocena Inwestycyjna
          </TabsTrigger>
          <TabsTrigger value="news" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-[13px] font-medium transition-none">
            Newsy <Badge variant="secondary" className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-muted/50 font-normal">{data.news?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="calculator" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-[13px] font-medium transition-none">
            Kalkulator
          </TabsTrigger>
        </TabsList>

        <div className="p-4 md:p-5">
          <TabsContent value="analysis" className="m-0 focus-visible:outline-none">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Eksport analizy i danych AI</div>
              <Button onClick={exportAnalysisCsv} variant="outline" size="sm" className="h-8 border-border/50 text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Pobierz CSV
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-muted/30 p-4 rounded-lg border border-border/30">
                <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">Sytuacja</div>
                <div className="text-[13px] leading-relaxed text-muted-foreground">{data.situation || 'Brak danych'}</div>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg border border-border/30">
                <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">Wycena</div>
                <div className="text-[13px] leading-relaxed text-muted-foreground">{data.valuation || 'Brak danych'}</div>
              </div>
              <div className="bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/10">
                <div className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-2">Katalizatory</div>
                <div className="text-[13px] leading-relaxed text-muted-foreground">{data.catalysts || 'Brak danych'}</div>
              </div>
              <div className="bg-red-500/5 p-4 rounded-lg border border-red-500/10">
                <div className="text-[10px] uppercase tracking-widest text-red-500 font-bold mb-2">Ryzyka</div>
                <div className="text-[13px] leading-relaxed text-muted-foreground">{data.risks || 'Brak danych'}</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rating" className="m-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-[42px] font-extrabold tracking-tighter leading-none">{score}</span>
                    <span className={`inline-flex w-fit px-3 py-1 rounded-md text-[13px] font-bold mt-2 ${ratingClass}`}>
                      {data.rating || 'N/A'}
                    </span>
                  </div>
                  {data.price_target ? (
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Cena Docelowa</div>
                      <div className="text-lg font-bold">{data.price_target.toFixed(2)}</div>
                      <div className={`text-[12px] font-bold ${upside > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {upside > 0 ? '+' : ''}{upside.toFixed(1)}%
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${score}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  <span>0 - Ryzyko</span>
                  <span>100 - Szansa</span>
                </div>

                {data.invest_reason && (
                  <p className="text-[13px] leading-relaxed text-muted-foreground mt-4 border-t border-border/50 pt-4">
                    {data.invest_reason}
                  </p>
                )}
              </div>

              <div className="md:border-l md:border-border/50 md:pl-6 flex flex-col justify-center">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-4">Rekomendacje analityków</div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-[12px] text-muted-foreground w-14">Kupuj</div>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${(buyCount/totalAnalysts)*100}%` }}></div>
                    </div>
                    <div className="text-[12px] font-medium w-6 text-right">{buyCount}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-[12px] text-muted-foreground w-14">Trzymaj</div>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${(holdCount/totalAnalysts)*100}%` }}></div>
                    </div>
                    <div className="text-[12px] font-medium w-6 text-right">{holdCount}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-[12px] text-muted-foreground w-14">Sprzedaj</div>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full transition-all duration-700" style={{ width: `${(sellCount/totalAnalysts)*100}%` }}></div>
                    </div>
                    <div className="text-[12px] font-medium w-6 text-right">{sellCount}</div>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground mt-4 text-right">
                  W oparciu o {totalAnalysts} analityków
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="news" className="m-0 focus-visible:outline-none">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Eksport wiadomości</div>
              <Button onClick={exportNewsCsv} variant="outline" size="sm" className="h-8 border-border/50 text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Pobierz CSV
              </Button>
            </div>
            <div className="flex flex-col divide-y divide-border/40">
              {data.news && data.news.length > 0 ? (
                data.news.map((n, i) => (
                  <div key={i} className="py-3 flex gap-3 justify-between items-start group">
                    <div className="flex-1">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{n.source}</div>
                      <div className="text-[13px] leading-snug font-medium text-foreground group-hover:text-primary transition-colors">
                        {n.url ? <a href={n.url} target="_blank" rel="noreferrer" className="block">{n.title}</a> : n.title}
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground whitespace-nowrap pt-1">
                      {timeAgo(n.time)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-[13px] text-muted-foreground">
                  Brak najnowszych wiadomości z ostatnich 7 dni.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calculator" className="m-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-5">
              <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-sm font-semibold">Kalkulator zakupu</div>
                    <div className="text-[12px] text-muted-foreground">Oblicz koszt zakupu wybranej liczby akcji</div>
                  </div>
                </div>
                <div className="grid gap-3">
                  <label className="grid gap-1.5">
                    <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Liczba akcji</span>
                    <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="decimal" className="bg-background/70 border-border/50" />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Cena jednej akcji</span>
                    <Input value={priceInput} onChange={(e) => setPriceInput(e.target.value)} inputMode="decimal" className="bg-background/70 border-border/50" />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Prowizja / koszty transakcji</span>
                    <Input value={commission} onChange={(e) => setCommission(e.target.value)} inputMode="decimal" className="bg-background/70 border-border/50" />
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-background/50 border border-border/40 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Wartość akcji</div>
                    <div className="text-lg font-bold">{formatMoney(subtotal, currencyCode)}</div>
                  </div>
                  <div className="rounded-lg bg-background/50 border border-border/40 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Prowizja</div>
                    <div className="text-lg font-bold">{formatMoney(commissionNumber, currencyCode)}</div>
                  </div>
                  <div className="rounded-lg bg-background/50 border border-border/40 p-3 col-span-2">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Do zapłaty łącznie</div>
                    <div className="text-3xl font-extrabold tracking-tight text-primary">{formatMoney(total, currencyCode)}</div>
                  </div>
                  <div className="rounded-lg bg-background/50 border border-border/40 p-3 col-span-2">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Cena break-even z prowizją</div>
                    <div className="text-lg font-bold">{formatMoney(breakevenPrice, currencyCode)} / akcję</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
