import { Router, type IRouter } from "express";

const router: IRouter = Router();

function parseCsvLine(line: string) {
  const result: string[] = [];
  let value = "";
  let quoted = false;
  for (const char of line) {
    if (char === "\"") quoted = !quoted;
    else if (char === "," && !quoted) {
      result.push(value);
      value = "";
    } else value += char;
  }
  result.push(value);
  return result.map((item) => item.replace(/^"|"$/g, "").trim());
}

function toStooqSymbol(symbol: string) {
  return symbol.trim().toLowerCase().replace(/\s+/g, "").replace(/\.(pl|wa)$/, "");
}

router.get("/stooq-quote", async (req, res, next) => {
  try {
    const rawSymbol = typeof req.query.symbol === "string" ? req.query.symbol : "";
    const symbol = toStooqSymbol(rawSymbol);

    if (!/^[a-z0-9._-]+$/.test(symbol)) {
      res.status(400).json({ error: "Invalid symbol" });
      return;
    }

    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcvn&h&e=csv`;
    const response = await fetch(url);

    if (!response.ok) {
      res.status(response.status).json({ error: `Stooq HTTP ${response.status}` });
      return;
    }

    const text = await response.text();
    const lines = text.trim().split(/\r?\n/);

    if (lines.length < 2) {
      res.status(404).json({ error: "No Stooq data" });
      return;
    }

    const values = parseCsvLine(lines[1]);
    const [symbolValue, date, time, open, high, low, close, volume, name] = values;

    if (!symbolValue || close === "N/D" || close === "N/A") {
      res.status(404).json({ error: "No quote for symbol" });
      return;
    }

    res.json({ symbol: symbolValue, date, time, open, high, low, close, volume, name });
  } catch (err) {
    next(err);
  }
});

export default router;
