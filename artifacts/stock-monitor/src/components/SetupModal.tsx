import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (finnhub: string, groq: string) => void;
  initialKeys: { finnhub: string; groq: string };
}

export function SetupModal({ isOpen, onClose, onSave, initialKeys }: SetupModalProps) {
  const [finnhub, setFinnhub] = useState(initialKeys.finnhub);
  const [groq, setGroq] = useState(initialKeys.groq);

  React.useEffect(() => {
    if (isOpen) {
      setFinnhub(initialKeys.finnhub);
      setGroq(initialKeys.groq);
    }
  }, [isOpen, initialKeys]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">Konfiguracja źródeł danych</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed mt-1">
            Klucze zapisywane są lokalnie w przeglądarce. Polskie tickery w formacie <strong className="text-foreground">SNT.PL</strong> lub <strong className="text-foreground">PKN.WA</strong> są obsługiwane automatycznie; dla danych GPW aplikacja próbuje użyć Finnhub, a następnie publicznego źródła Stooq bez klucza.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="finnhub" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Finnhub API Key
            </Label>
            <Input
              id="finnhub"
              value={finnhub}
              onChange={(e) => setFinnhub(e.target.value)}
              placeholder="d1a2b3c4d5e6f7..."
              className="font-mono text-sm bg-muted/50 border-border/50 focus-visible:ring-primary/50"
            />
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Dla spółek USA i części danych GPW: <a href="https://finnhub.io/register" target="_blank" rel="noreferrer" className="text-primary hover:underline">finnhub.io/register</a> → Dashboard → API Key
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="groq" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Groq API Key
            </Label>
            <Input
              id="groq"
              value={groq}
              onChange={(e) => setGroq(e.target.value)}
              placeholder="gsk_..."
              className="font-mono text-sm bg-muted/50 border-border/50 focus-visible:ring-primary/50"
              type="password"
            />
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Dla zakładki Analiza AI: <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">console.groq.com</a> → API Keys → Create
            </p>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] leading-relaxed text-emerald-300">
            Przykład polskiej spółki: wpisz SNT.PL. Jeśli Finnhub jej nie rozpozna, aplikacja spróbuje pobrać notowania przez Stooq.
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button variant="outline" onClick={onClose} className="border-border/50 hover:bg-muted">
            Anuluj
          </Button>
          <Button onClick={() => onSave(finnhub, groq)} className="bg-primary hover:bg-primary/90">
            Zapisz klucze
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
