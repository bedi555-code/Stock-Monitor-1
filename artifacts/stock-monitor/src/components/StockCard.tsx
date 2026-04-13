import React, { useState } from "react";
import { Trash2, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { useStockData, StockData } from "@/hooks/useStockData";
import { clearCacheForTicker } from "@/lib/storage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface StockCardProps {
  ticker: string;
  keys: { finnhub: string; groq: string };
  onRemove: () => void;
}

function timeAgo(unixTimestamp: number) {
  if (!unixTimestamp) return '';
  const seconds = Math.floor(Date.now() / 1000) - unixTimestamp;
  if (seconds < 3600) return Math.floor(seconds / 60) + ' min temu';
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' godz temu';
  return Math.floor(seconds / 86400) + ' dni temu';
}

export function StockCard({ ticker, keys, onRemove }: StockCardProps) {
  const { data, loading, error, refresh } = useStockData(ticker, keys);
  
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

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between p-4 md:p-5 gap-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-muted border border-border/50 text-[15px] font-bold tracking-wide">
            {data.ticker}
          </span>
          <div className="flex flex-col">
            <span className="text-[13px] text-muted-foreground font-medium">{data.company_name}</span>
            {data.exchange && <span className="text-[10px] text-muted-foreground/70 uppercase tracking-widest">{data.exchange}</span>}
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

      {/* Metrics Strip */}
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

      {/* Tabs */}
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
        </TabsList>
        
        <div className="p-4 md:p-5">
          <TabsContent value="analysis" className="m-0 focus-visible:outline-none">
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
              {/* Score section */}
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

              {/* Analysts section */}
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
        </div>
      </Tabs>
    </div>
  );
}
