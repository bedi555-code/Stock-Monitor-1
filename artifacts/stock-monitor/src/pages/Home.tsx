import React, { useMemo, useState } from "react";
import { Settings, Search, Plus, X, Edit3, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SetupModal } from "@/components/SetupModal";
import { StockCard } from "@/components/StockCard";
import { StockData } from "@/hooks/useStockData";
import { getKeys, saveKeys, getWatchlist, saveWatchlist, getFavorites, saveFavorites, getCache } from "@/lib/storage";

const normalizeTicker = (ticker: string) => ticker.trim().toUpperCase().replace(/\s+/g, '');

export default function Home() {
  const [keys, setKeysState] = useState(getKeys());
  const [watchlist, setWatchlistState] = useState<string[]>(getWatchlist());
  const [favorites, setFavoritesState] = useState<string[]>(getFavorites());
  const [stockSnapshots, setStockSnapshots] = useState<Record<string, StockData>>(() => getCache());
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isEditingFavorites, setIsEditingFavorites] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [favoriteInput, setFavoriteInput] = useState("");

  const hasMarketKey = !!keys.finnhub;
  const hasAiKey = !!keys.groq;

  const sortedFavorites = useMemo(() => favorites.filter(Boolean), [favorites]);

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
    const t = normalizeTicker(ticker);
    if (!t) return;
    setSearchInput("");
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
        <div className="flex h-14 items-center justify-between px-4 md:px-6 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2 font-bold text-[16px] tracking-tight">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </div>
            Monitor Giełdowy
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
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 pb-20 flex flex-col gap-6">
        {(!hasMarketKey || !hasAiKey) && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-500/90 shadow-sm">
            <div className="flex-1">
              <span className="mr-2">⚠️</span>
              {!hasMarketKey && !hasAiKey
                ? 'Brak kluczy Finnhub i Groq — polskie notowania .PL mogą działać przez Stooq, ale pełne dane i analiza AI wymagają kluczy.'
                : !hasMarketKey
                  ? 'Brak klucza Finnhub — spółki USA i część newsów nie będą pobierane. Polskie tickery .PL mogą działać przez Stooq.'
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
                placeholder="Wpisz ticker: SNT.PL, PKN.WA, AAPL, TSLA..."
                className="pl-9 h-11 bg-card border-border/50 focus-visible:ring-primary/50 text-[15px]"
              />
            </div>
            <Button
              onClick={() => handleAddTicker(searchInput)}
              disabled={!searchInput.trim()}
              className="h-11 px-4 md:px-6 font-medium whitespace-nowrap bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Dodaj spółkę</span>
              <span className="sm:hidden">Dodaj</span>
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
              <div className="text-4xl mb-4 opacity-50">📊</div>
              <p className="text-[15px] leading-relaxed">
                Dodaj spółkę, aby zobaczyć<br/>aktualne dane i analizę AI.
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
