import React, { useState, useEffect } from "react";
import { LayoutDashboard, Settings, TrendingUp, Search, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SetupModal } from "@/components/SetupModal";
import { StockCard } from "@/components/StockCard";
import { useStockData } from "@/hooks/useStockData";
import { getKeys, saveKeys, getWatchlist, saveWatchlist } from "@/lib/storage";

const QUICK_CHIPS = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "PKN.WA", "CDR.WA"];

export default function Home() {
  const [keys, setKeysState] = useState(getKeys());
  const [watchlist, setWatchlistState] = useState<string[]>(getWatchlist());
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const handleSaveKeys = (finnhub: string, groq: string) => {
    saveKeys(finnhub, groq);
    setKeysState({ finnhub, groq });
    setIsSetupOpen(false);
  };

  const handleAddTicker = (ticker: string) => {
    const t = ticker.trim().toUpperCase().replace(/\s+/g, '');
    if (!t) return;
    setSearchInput("");
    if (watchlist.includes(t)) {
      // Re-order to top if already exists
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

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      {/* Topbar */}
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
            Klucze API
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 pb-20 flex flex-col gap-6">
        {/* API Key Alert */}
        {(!keys.finnhub || !keys.groq) && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-500/90 shadow-sm">
            <span className="text-amber-500">⚠️</span>
            <div className="flex-1">
              Brak kluczy API — dane nie będą pobierane.
            </div>
            <button 
              onClick={() => setIsSetupOpen(true)}
              className="text-amber-500 font-medium hover:underline underline-offset-4"
            >
              Skonfiguruj klucze →
            </button>
          </div>
        )}

        {/* Search */}
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
                placeholder="Wpisz ticker: AAPL, TSLA, NVDA, PKN.WA..." 
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

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">Szybki dostęp:</span>
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => handleAddTicker(chip)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-full border border-border/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors bg-transparent"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Watchlist */}
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
