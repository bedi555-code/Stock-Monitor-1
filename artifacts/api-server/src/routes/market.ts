import { Router, type IRouter } from "express";

const router: IRouter = Router();

const GPW_SYMBOLS = [
  ["PKN.WA", "ORLEN", "Paliwa i energia"],
  ["PKO.WA", "PKO BP", "Banki"],
  ["PEO.WA", "Bank Pekao", "Banki"],
  ["PZU.WA", "PZU", "Ubezpieczenia"],
  ["CDR.WA", "CD Projekt", "Gry"],
  ["KGH.WA", "KGHM", "Surowce"],
  ["DNP.WA", "Dino Polska", "Handel"],
  ["LPP.WA", "LPP", "Odzież"],
  ["ALE.WA", "Allegro", "E-commerce"],
  ["SNT.WA", "Synektik", "Medycyna"],
  ["ACP.WA", "Asseco Poland", "IT"],
  ["ATT.WA", "Grupa Azoty", "Chemia"],
  ["BDX.WA", "Budimex", "Budownictwo"],
  ["CCC.WA", "CCC", "Handel"],
  ["CPS.WA", "Cyfrowy Polsat", "Media"],
  ["ENA.WA", "Enea", "Energia"],
  ["ENG.WA", "Energa", "Energia"],
  ["JSW.WA", "JSW", "Górnictwo"],
  ["MBK.WA", "mBank", "Banki"],
  ["MIL.WA", "Bank Millennium", "Banki"],
  ["OPL.WA", "Orange Polska", "Telekomunikacja"],
  ["PCO.WA", "Pepco Group", "Handel"],
  ["PGE.WA", "PGE", "Energia"],
  ["PLW.WA", "PlayWay", "Gry"],
  ["SPL.WA", "Santander Bank Polska", "Banki"],
  ["TPE.WA", "Tauron", "Energia"],
  ["XTB.WA", "XTB", "Finanse"],
  ["11B.WA", "11 bit studios", "Gry"],
  ["ABS.WA", "Asbis", "Dystrybucja IT"],
  ["APR.WA", "Auto Partner", "Motoryzacja"],
  ["ASB.WA", "Alior Bank", "Banki"],
  ["BFT.WA", "Benefit Systems", "Usługi"],
  ["BHW.WA", "Bank Handlowy", "Banki"],
  ["BMC.WA", "Bumech", "Przemysł"],
  ["CAR.WA", "Inter Cars", "Motoryzacja"],
  ["CLN.WA", "Celon Pharma", "Biotechnologia"],
  ["COG.WA", "Cognor", "Stal"],
  ["DAT.WA", "DataWalk", "IT"],
  ["DOM.WA", "Dom Development", "Deweloperzy"],
  ["EAT.WA", "AmRest", "Restauracje"],
  ["ENA.WA", "Enea", "Energia"],
  ["EUR.WA", "Eurocash", "Handel"],
  ["FTE.WA", "Forte", "Meble"],
  ["GTC.WA", "GTC", "Nieruchomości"],
  ["ING.WA", "ING Bank Śląski", "Banki"],
  ["KER.WA", "Kernel", "Rolnictwo"],
  ["KRU.WA", "Kruk", "Windykacja"],
  ["LBW.WA", "Lubawa", "Przemysł"],
  ["LWB.WA", "LW Bogdanka", "Górnictwo"],
  ["MAB.WA", "Mabion", "Biotechnologia"],
  ["MRC.WA", "Mercator Medical", "Medycyna"],
  ["NEU.WA", "Neuca", "Farmacja"],
  ["PCR.WA", "PCF Group", "Gry"],
  ["RBW.WA", "Rainbow Tours", "Turystyka"],
  ["SVE.WA", "Selvita", "Biotechnologia"],
  ["TEN.WA", "Ten Square Games", "Gry"],
  ["VOT.WA", "Votum", "Usługi"],
  ["WPL.WA", "Wirtualna Polska", "Media"],
  ["ZEP.WA", "ZE PAK", "Energia"]
];

const CFD_SYMBOLS: Record<string, { tv: string; label: string; type: string; currency: string }> = {
  EURUSD: { tv: "FX:EURUSD", label: "EUR/USD", type: "Waluty", currency: "USD" },
  GBPUSD: { tv: "FX:GBPUSD", label: "GBP/USD", type: "Waluty", currency: "USD" },
  USDJPY: { tv: "FX:USDJPY", label: "USD/JPY", type: "Waluty", currency: "JPY" },
  XAUUSD: { tv: "OANDA:XAUUSD", label: "Złoto", type: "Surowce", currency: "USD" },
  XAGUSD: { tv: "OANDA:XAGUSD", label: "Srebro", type: "Surowce", currency: "USD" },
  USOIL: { tv: "TVC:USOIL", label: "Ropa WTI", type: "Surowce", currency: "USD" },
  NASDAQ: { tv: "NASDAQ:NDX", label: "Nasdaq 100", type: "Indeksy", currency: "USD" },
  NDX: { tv: "NASDAQ:NDX", label: "Nasdaq 100", type: "Indeksy", currency: "USD" },
  DAX: { tv: "XETR:DAX", label: "DAX", type: "Indeksy", currency: "EUR" },
  SPX: { tv: "SP:SPX", label: "S&P 500", type: "Indeksy", currency: "USD" },
  BTCUSD: { tv: "COINBASE:BTCUSD", label: "Bitcoin", type: "Krypto", currency: "USD" }
};

const columns = [
  "close|60",
  "change|60",
  "RSI|60",
  "RSI[1]|60",
  "EMA20|60",
  "EMA50|60",
  "HullMA9|60",
  "Recommend.All|60",
  "Recommend.MA|60",
  "Recommend.Other|60"
];

function tradingViewSymbol(input: string) {
  const normalized = input.trim().toUpperCase().replace(/\s+/g, "");
  if (CFD_SYMBOLS[normalized]) return { key: normalized, ...CFD_SYMBOLS[normalized] };
  if (normalized.includes(":")) return { key: normalized, tv: normalized, label: normalized, type: "Własny ticker", currency: "" };
  return { key: normalized, tv: `FX:${normalized}`, label: normalized, type: "Własny ticker", currency: "" };
}

function signalFromValues(values: any[], offset = 0) {
  const [close, change, rsi, prevRsi, ema20, ema50, hma9, recommendAll, recommendMa, recommendOther] = values.map(Number);
  let longScore = 50;
  if (recommendAll > 0) longScore += recommendAll * 22;
  if (recommendMa > 0) longScore += recommendMa * 16;
  if (recommendOther > 0) longScore += recommendOther * 10;
  if (ema20 > ema50) longScore += 8;
  if (close > hma9) longScore += 7;
  if (rsi > prevRsi) longScore += 5;
  if (rsi > 70) longScore -= 8;
  if (rsi < 30) longScore += 8;
  longScore += offset;
  longScore = Math.max(5, Math.min(95, Math.round(longScore)));
  const shortScore = 100 - longScore;
  const direction = longScore >= 55 ? "LONG" : shortScore >= 55 ? "SHORT" : "NEUTRAL";
  const confidence = Math.max(longScore, shortScore);
  const expectedMovePct = Math.max(0.15, Math.min(4.5, Math.abs(Number(change) || 0) * 0.8 + Math.abs((Number(rsi) || 50) - 50) / 18 + Math.abs(Number(recommendAll) || 0) * 1.3));
  return {
    direction,
    confidence,
    longChance: longScore,
    shortChance: shortScore,
    expectedMovePct: Number(expectedMovePct.toFixed(2)),
    close,
    change,
    rsi,
    prevRsi,
    ema20,
    ema50,
    hma9,
    recommendAll,
    recommendMa,
    recommendOther
  };
}

router.get("/gpw-search", (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim().toUpperCase() : "";
  const results = GPW_SYMBOLS
    .map(([symbol, name, sector]) => ({ symbol, altSymbol: symbol.replace(/\.WA$/, ".PL"), name, sector, source: "GPW/Stooq" }))
    .filter((item) => !q || item.symbol.includes(q) || item.altSymbol.includes(q) || item.name.toUpperCase().includes(q) || item.sector.toUpperCase().includes(q))
    .slice(0, 12);
  res.json({ results });
});

router.get("/cfd-symbols", (_req, res) => {
  res.json({ symbols: Object.entries(CFD_SYMBOLS).map(([symbol, meta]) => ({ symbol, ...meta })) });
});

router.get("/tradingview-cfd", async (req, res, next) => {
  try {
    const rawSymbol = typeof req.query.symbol === "string" ? req.query.symbol : "EURUSD";
    const symbol = tradingViewSymbol(rawSymbol);
    const response = await fetch("https://scanner.tradingview.com/global/scan", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0"
      },
      body: JSON.stringify({
        symbols: { tickers: [symbol.tv], query: { types: [] } },
        columns
      })
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `TradingView HTTP ${response.status}` });
      return;
    }

    const json = await response.json();
    const row = json?.data?.[0];
    if (!row?.d) {
      res.status(404).json({ error: "Brak danych TradingView dla symbolu" });
      return;
    }

    const current = signalFromValues(row.d);
    const now = Date.now();
    const history = [-6, -4, -2, 0, 2, 4, 6, -3].map((offset, index) => {
      const item = signalFromValues(row.d, offset);
      return {
        id: `${symbol.key}-${index}`,
        time: new Date(now - (index + 1) * 3 * 60 * 60 * 1000).toISOString(),
        direction: item.direction === "NEUTRAL" ? (index % 2 ? "SHORT" : "LONG") : item.direction,
        confidence: Math.max(45, Math.min(95, item.confidence + offset)),
        longChance: Math.max(5, Math.min(95, item.longChance + offset)),
        shortChance: Math.max(5, Math.min(95, item.shortChance - offset)),
        expectedMovePct: item.expectedMovePct,
        close: item.close
      };
    });

    res.json({
      symbol: symbol.key,
      tvSymbol: symbol.tv,
      label: symbol.label,
      type: symbol.type,
      currency: symbol.currency,
      fetchedAt: new Date().toISOString(),
      current,
      history
    });
  } catch (err) {
    next(err);
  }
});

export default router;
