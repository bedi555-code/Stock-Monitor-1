import React, { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Calculator, Filter, Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TradingViewMiniChart } from "@/components/TradingViewMiniChart";

interface CfdSignal {
  id: string;
  time: string;
  direction: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number;
  longChance: number;
  shortChance: number;
  expectedMovePct: number;
  close: number;
}

interface CfdData {
  symbol: string;
  tvSymbol: string;
  label: string;
  type: string;
  currency: string;
  fetchedAt: string;
  current: CfdSignal & {
    rsi: number;
    prevRsi: number;
    ema20: number;
    ema50: number;
    hma9: number;
    recommendAll: number;
  };
  history: CfdSignal[];
}

const presets = ["EURUSD", "XAUUSD", "USOIL", "NASDAQ", "DAX", "SPX", "BTCUSD"];

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function directionClass(direction: string) {
  if (direction === "LONG") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (direction === "SHORT") return "bg-red-500/15 text-red-300 border-red-500/30";
  return "bg-amber-500/15 text-amber-300 border-amber-500/30";
}

export function CfdAnalyzer() {
  const [symbolInput, setSymbolInput] = useState("EURUSD");
  const [symbol, setSymbol] = useState("EURUSD");
  const [data, setData] = useState<CfdData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "LONG" | "SHORT">("ALL");
  const [amount, setAmount] = useState("1000");
  const [leverage, setLeverage] = useState("1");
  const [side, setSide] = useState<"LONG" | "SHORT">("LONG");

  const load = async (nextSymbol = symbol) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tradingview-cfd?symbol=${encodeURIComponent(nextSymbol)}`);
      if (!response.ok) throw new Error(`Nie udało się pobrać danych TradingView (${response.status})`);
      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Błąd pobierania danych");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(symbol);
  }, [symbol]);

  const filteredHistory = useMemo(() => {
    if (!data) return [];
    return data.history.filter((item) => filter === "ALL" || item.direction === filter);
  }, [data, filter]);

  const amountNumber = Math.max(0, Number(amount.replace(",", ".")) || 0);
  const leverageNumber = Math.max(1, Number(leverage.replace(",", ".")) || 1);
  const expectedMove = data?.current?.expectedMovePct || 0;
  const grossProfit = amountNumber * leverageNumber * (expectedMove / 100) * (side === data?.current?.direction ? 1 : side === "LONG" ? (data?.current?.longChance || 50) / 100 : (data?.current?.shortChance || 50) / 100);
  const riskMove = amountNumber * leverageNumber * Math.max(0.2, expectedMove * 0.65) / 100;

  return (
    <section className="flex flex-col gap-5">
      <div className="rounded-xl border border-border/40 bg-card p-4 md:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <Activity className="h-5 w-5 text-primary" />
              Analizy CFD
            </div>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
              Moduł dla walut, surowców i indeksów oparty o wykres 1h z zakresem 5 dni oraz wskaźniki TradingView: HMA, RSI i EMA.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <Input
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter" && symbolInput.trim()) setSymbol(symbolInput.trim().toUpperCase());
              }}
              className="h-10 bg-background/70 border-border/50 sm:w-48"
              placeholder="EURUSD, XAUUSD, DAX..."
            />
            <Button onClick={() => symbolInput.trim() && setSymbol(symbolInput.trim().toUpperCase())} className="h-10">
              Analizuj CFD
            </Button>
            <Button onClick={() => load()} variant="outline" className="h-10 border-border/50" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {presets.map((item) => (
            <button
              key={item}
              onClick={() => {
                setSymbolInput(item);
                setSymbol(item);
              }}
              className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${symbol === item ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.9fr] gap-5">
            <TradingViewMiniChart symbol={data.tvSymbol} interval="60" range="5D" height={420} title={`${data.label} — wykres 1h / 5 dni`} />

            <div className="rounded-xl border border-border/40 bg-card p-4 md:p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Sygnał techniczny</div>
                  <div className="text-2xl font-extrabold mt-1">{data.label}</div>
                  <div className="text-[12px] text-muted-foreground">{data.type} • pobrano {formatDate(data.fetchedAt)}</div>
                </div>
                <Badge className={`border ${directionClass(data.current.direction)}`}>{data.current.direction}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Szansa LONG</div>
                  <div className="text-2xl font-bold text-emerald-300">{data.current.longChance}%</div>
                </div>
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Szansa SHORT</div>
                  <div className="text-2xl font-bold text-red-300">{data.current.shortChance}%</div>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">RSI 1h</div>
                  <div className="text-lg font-bold">{Number(data.current.rsi || 0).toFixed(1)}</div>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Ruch oczekiwany</div>
                  <div className="text-lg font-bold">±{data.current.expectedMovePct}%</div>
                </div>
              </div>

              <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-[12px] text-muted-foreground leading-relaxed">
                HMA9: <span className="text-foreground font-medium">{Number(data.current.hma9 || 0).toFixed(4)}</span> • EMA20: <span className="text-foreground font-medium">{Number(data.current.ema20 || 0).toFixed(4)}</span> • EMA50: <span className="text-foreground font-medium">{Number(data.current.ema50 || 0).toFixed(4)}</span>. Rekomendacja techniczna TradingView: <span className="text-foreground font-medium">{Number(data.current.recommendAll || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.85fr] gap-5">
            <div className="rounded-xl border border-border/40 bg-card p-4 md:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 font-semibold"><Filter className="h-4 w-4 text-primary" /> Historyczne sygnały z ostatnich 24h</div>
                  <div className="text-[12px] text-muted-foreground mt-1">Filtruj potencjalne wejścia short i long.</div>
                </div>
                <div className="flex rounded-lg border border-border/50 overflow-hidden w-fit">
                  {["ALL", "LONG", "SHORT"].map((item) => (
                    <button key={item} onClick={() => setFilter(item as any)} className={`px-3 py-1.5 text-[12px] ${filter === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60"}`}>
                      {item === "ALL" ? "Wszystkie" : item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                {filteredHistory.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border/40 bg-muted/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${item.direction === "LONG" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                        {item.direction === "LONG" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{item.direction} • pewność {Math.round(item.confidence)}%</div>
                        <div className="text-[12px] text-muted-foreground">{formatDate(item.time)} • cena odniesienia {Number(item.close || 0).toFixed(4)}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 text-[12px]">
                      <span className="text-emerald-300">L {Math.round(item.longChance)}%</span>
                      <span className="text-red-300">S {Math.round(item.shortChance)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-semibold">Kalkulator zysku CFD</div>
                  <div className="text-[12px] text-muted-foreground">Szacunek dla wejścia za daną kwotę i oczekiwanego ruchu.</div>
                </div>
              </div>
              <div className="grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Kwota wejścia</span>
                  <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="bg-background/70 border-border/50" />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Dźwignia</span>
                  <Input value={leverage} onChange={(e) => setLeverage(e.target.value)} inputMode="decimal" className="bg-background/70 border-border/50" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => setSide("LONG")} variant={side === "LONG" ? "default" : "outline"} className="border-border/50">LONG</Button>
                  <Button onClick={() => setSide("SHORT")} variant={side === "SHORT" ? "default" : "outline"} className="border-border/50">SHORT</Button>
                </div>
                <div className="rounded-lg border border-border/40 bg-background/50 p-3 mt-1">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Potencjalny zysk brutto</div>
                  <div className="text-3xl font-extrabold text-primary mt-1">{grossProfit.toFixed(2)} {data.currency || ""}</div>
                </div>
                <div className="rounded-lg border border-border/40 bg-background/50 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Szacowane ryzyko przeciwnego ruchu</div>
                  <div className="text-lg font-bold text-red-300">-{riskMove.toFixed(2)} {data.currency || ""}</div>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                To narzędzie ma charakter analityczny. Wynik zależy od zmienności, spreadu, prowizji i realnego wykonania zlecenia.
              </div>
            </div>
          </div>
        </>
      )}

      {loading && !data && (
        <div className="rounded-xl border border-border bg-card p-8 flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" /> Pobieranie analizy technicznej...
        </div>
      )}
    </section>
  );
}
