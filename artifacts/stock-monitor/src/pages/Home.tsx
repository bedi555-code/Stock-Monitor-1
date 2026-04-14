import React, { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Check, Edit3, Plus, Search, Settings, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SetupModal } from "@/components/SetupModal";
import { StockCard } from "@/components/StockCard";
import { CfdAnalyzer } from "@/components/CfdAnalyzer";
import { StockData } from "@/hooks/useStockData";
import { getKeys, saveKeys, getWatchlist, saveWatchlist, getFavorites, saveFavorites, getCache } from "@/lib/storage";

const normalizeTicker = (ticker: string) => ticker.trim().toUpperCase().replace(/\s+/g, '');

type GpwSuggestion = {
  symbol: string;
  altSymbol: string;
  name: string;
  sector: string;
  source: string;
};

export default function Home() {
  const [keys, setKeysState] = useState(getKeys());
  const [watchlist, setWatchlistState] = useState<string[]>(getWatchlist());
  const [favorites, setFavoritesState] = useState<string[]>(getFavorites());
  const [stockSnapshots, setStockSnapshots] = useState<Record<string, StockData>>(() => getCache());
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isEditingFavorites, setIsEditingFavorites] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [favoriteInput, setFavoriteInput] = useState("");
  const [mode, setMode] = useState<"stocks" | "cfd">("stocks");
  const [suggestions, setSuggestions] = useState<GpwSuggestion[]>([]);

  const hasMarketKey = !!keys.finnhub;
  const hasAiKey = !!keys.groq;

  const sortedFavorites = useMemo(() => favorites.filter(Boolean), [favorites]);

  useEffect(() => {
    let active = true;
    const query = searchInput.trim();
    if (query.length < 1 || mode !== "stocks") {
      setSuggestions([]);
      return;
    }
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/gpw-search?q=${encodeURIComponent(query)}`);
        if (!response.ok) return;
        const json = await response.json();
        if (active) setSuggestions(json.results || []);
      } catch (e) {
        if (active) setSuggestions([]);
      }
    }, 150);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [searchInput, mode]);

  const persistFavorites = (nextFavorites: string[]) => {
    setFavoritesState(nextFavorites);
    saveFavorites(nextFavorites);
  };

  const handleSaveKeys = (finnhub: string, groq: string) => {
    saveKeys(finnhub, groq);
    setKeysState({ finnhub, groq });
    setIsSetupOpen(false);
  };

  const handleAddTicker = (ticker: string) => {
    const raw = normalizeTicker(ticker);
    const matchedGpw = !raw.includes('.')
      ? suggestions.find((item) => item.symbol.replace(/\.WA$/, '') === raw || item.altSymbol.replace(/\.PL$/, '') === raw || item.name.toUpperCase() === raw)
      : undefined;
    const t = matchedGpw ? matchedGpw.symbol : raw;
    if (!t) return;
    setSearchInput("");
    setSuggestions([]);
    if (watchlist.includes(t)) {
      const newWatchlist = [t, ...watchlist.filter(item => item !== t)];
      setWatchlistState(newWatchlist);
      saveWatchlist(newWatchlist);
      return;
    }
    const newWatchlist = [t, ...watchlist];
    setWatchlistState(newWatchlist);
    saveWatchlist(newWatchlist);
  };

  const handleRemoveTicker = (ticker: string) => {
    const newWatchlist = watchlist.filter(t => t !== ticker);
    setWatchlistState(newWatchlist);
    saveWatchlist(newWatchlist);
  };

  const handleAddFavorite = () => {
    const t = normalizeTicker(favoriteInput);
    if (!t || favorites.includes(t)) return;
    persistFavorites([...favorites, t]);
    setFavoriteInput("");
  };

  const handleRemoveFavorite = (ticker: string) => {
    persistFavorites(favorites.filter(item => item !== ticker));
  };

  const getFavoriteClass = (ticker: string) => {
    const snapshot = stockSnapshots[ticker];
    const change = Number(snapshot?.change_pct || 0);
    if (change > 0) return 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.08)]';
    if (change < 0) return 'border-red-500/50 text-red-300 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.08)]';
    return 'border-border/40 text-muted-foreground hover:border-primary hover:text-primary bg-transparent';
  };

  const getFavoriteChange = (ticker: string) => {
    const snapshot = stockSnapshots[ticker];
    const change = Number(snapshot?.change_pct || 0);
    if (!snapshot || change === 0) return null;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4 md:px-6 max-w-6xl mx-auto w-full gap-3">
          <div className="flex items-center gap-2 font-bold text-[16px] tracking-tight">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </div>
            Monitor Giełdowy
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex rounded-lg border border-border/50 overflow-hidden bg-background/40">
              <button
                onClick={() => setMode("stocks")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${mode === "stocks" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Analiza spółek
              </button>
              <button
                onClick={() => setMode("cfd")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${mode === "cfd" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
              >
                <Activity className="h-3.5 w-3.5" /> Analizy CFD
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-border/50 hover:bg-muted/50 font-medium text-xs rounded-md"
              onClick={() => setIsSetupOpen(true)}
            >
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              Źródła API
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-6 pb-20 flex flex-col gap-6">
        <div className="sm:hidden grid grid-cols-2 rounded-lg border border-border/50 overflow-hidden bg-card/60">
          <button onClick={() => setMode("stocks")} className={`px-3 py-2 text-xs font-medium ${mode === "stocks" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Analiza spółek</button>
          <button onClick={() => setMode("cfd")} className={`px-3 py-2 text-xs font-medium ${mode === "cfd" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Analizy CFD</button>
        </div>

        {mode === "stocks" ? (
          <>
            {(!hasMarketKey || !hasAiKey) && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-500/90 shadow-sm">
                <div className="flex-1">
                  {!hasMarketKey && !hasAiKey
                    ? 'Brak kluczy Finnhub i Groq — polskie notowania GPW działają przez Stooq/TradingView, ale pełne dane i analiza AI wymagają kluczy.'
                    : !hasMarketKey
                      ? 'Brak klucza Finnhub — spółki USA i część newsów nie będą pobierane. GPW może działać przez Stooq/TradingView.'
                      : 'Brak klucza Groq — dane rynkowe będą pobierane, ale analiza AI będzie uproszczona.'}
                </div>
                <button
                  onClick={() => setIsSetupOpen(true)}
                  className="text-amber-500 font-medium hover:underline underline-offset-4 text-left sm:text-right"
                >
                  Skonfiguruj źródła →
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTicker(searchInput);
                    }}
                    placeholder="Wpisz ticker lub nazwę: Synektik, KGHM, SNT.PL, PKN.WA, AAPL..."
                    className="pl-9 h-11 bg-card border-border/50 focus-visible:ring-primary/50 text-[15px]"
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 rounded-xl border border-border/60 bg-card shadow-xl overflow-hidden">
                      <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border/40">Podpowiedzi GPW z dodatkowego źródła</div>
                      {suggestions.map((item) => (
                        <button
                          key={item.symbol}
                          onClick={() => handleAddTicker(item.symbol)}
                          className="w-full px-3 py-2.5 text-left hover:bg-muted/60 flex items-center justify-between gap-3 border-b border-border/30 last:border-0"
                        >
                          <span className="flex flex-col">
                            <span className="text-sm font-semibold">{item.name}</span>
                            <span className="text-[11px] text-muted-foreground">{item.sector} • {item.source}</span>
                          </span>
                          <span className="text-[12px] font-bold text-primary whitespace-nowrap">{item.symbol}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => handleAddTicker(searchInput)}
                  disabled={!searchInput.trim()}
                  className="h-11 px-4 md:px-6 font-medium whitespace-nowrap bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Analizuj spółkę</span>
                  <span className="sm:hidden">Analizuj</span>
                </Button>
              </div>

              <div className="rounded-xl border border-border/40 bg-card/40 p-3 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    Ulubione
                  </div>
                  {sortedFavorites.map(chip => (
                    <div key={chip} className="group relative inline-flex items-center">
                      <button
                        onClick={() => handleAddTicker(chip)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors ${getFavoriteClass(chip)}`}
                      >
                        {chip}
                        {getFavoriteChange(chip) && <span className="ml-1 opacity-80">{getFavoriteChange(chip)}</span>}
                      </button>
                      {isEditingFavorites && (
                        <button
                          onClick={() => handleRemoveFavorite(chip)}
                          className="ml-1 rounded-full border border-border/50 bg-background/80 p-0.5 text-muted-foreground hover:text-red-400 hover:border-red-500/50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setIsEditingFavorites(!isEditingFavorites)}
                    className="ml-auto inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  >
                    {isEditingFavorites ? <Check className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                    {isEditingFavorites ? 'Gotowe' : 'Edytuj'}
                  </button>
                </div>

                {isEditingFavorites && (
                  <div className="flex flex-col sm:flex-row gap-2 border-t border-border/40 pt-3">
                    <Input
                      value={favoriteInput}
                      onChange={(e) => setFavoriteInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddFavorite();
                      }}
                      placeholder="Dodaj ulubioną spółkę, np. SNT.PL"
                      className="h-9 bg-background/60 border-border/50 text-sm"
                    />
                    <Button onClick={handleAddFavorite} disabled={!favoriteInput.trim()} size="sm" className="h-9">
                      Dodaj do ulubionych
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {watchlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground bg-card/30 border border-border/30 rounded-xl border-dashed">
                  <BarChart3 className="h-10 w-10 mb-4 opacity-50" />
                  <p className="text-[15px] leading-relaxed">
                    Wpisz ticker lub wybierz spółkę z podpowiedzi,<br/>aby zobaczyć aktualne dane i analizę.
                  </p>
                </div>
              ) : (
                watchlist.map(ticker => (
                  <StockCard
                    key={ticker}
                    ticker={ticker}
                    keys={keys}
                    onRemove={() => handleRemoveTicker(ticker)}
                    onDataUpdate={(data) => setStockSnapshots(prev => ({ ...prev, [ticker]: data }))}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <CfdAnalyzer />
        )}
      </main>

      <SetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onSave={handleSaveKeys}
        initialKeys={keys}
      />
    </div>
  );
}
