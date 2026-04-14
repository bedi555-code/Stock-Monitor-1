import React from "react";

function stockTvSymbol(ticker: string) {
  const normalized = ticker.trim().toUpperCase().replace(/\s+/g, "");
  if (normalized.includes(":")) return normalized;
  if (/\.(WA|PL)$/i.test(normalized)) return `GPW:${normalized.replace(/\.(WA|PL)$/i, "")}`;
  const nasdaq = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "GOOG", "NFLX", "AMD", "INTC"];
  if (nasdaq.includes(normalized)) return `NASDAQ:${normalized}`;
  return normalized;
}

interface TradingViewMiniChartProps {
  symbol: string;
  height?: number;
  interval?: string;
  range?: string;
  title?: string;
}

export function TradingViewMiniChart({ symbol, height = 320, interval = "D", range = "5D", title }: TradingViewMiniChartProps) {
  const tvSymbol = stockTvSymbol(symbol);
  const params = new URLSearchParams({
    symbol: tvSymbol,
    interval,
    range,
    theme: "dark",
    style: "1",
    timezone: "Europe/Warsaw",
    withdateranges: "1",
    hide_side_toolbar: "1",
    allow_symbol_change: "0",
    save_image: "0",
    studies: "[]",
    locale: "pl"
  });

  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-widest">{tvSymbol} • {range}</div>
        </div>
      )}
      <iframe
        title={`TradingView ${tvSymbol}`}
        src={`https://s.tradingview.com/widgetembed/?${params.toString()}`}
        className="w-full border-0"
        style={{ height }}
        loading="lazy"
      />
    </div>
  );
}
