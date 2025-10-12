"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type Props = {
  targetAttr: string; // ex.: 'rebanho:cards.contadores'
  headline: string;
  body: string;
  onPrev?: () => void;
  onNext?: () => void;
  onDone?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  doneLabel?: string;
  visible: boolean;
};

export default function TourSpotlight(p: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const el = useMemo(
    () =>
      (p.visible
        ? (document.querySelector(`[data-tour="${p.targetAttr}"]`) as HTMLElement | null)
        : null),
    [p.targetAttr, p.visible]
  );

  useEffect(() => {
    if (!p.visible || !el) {
      setRect(null);
      return;
    }
    const update = () => setRect(el.getBoundingClientRect());
    update();

    const obs = new ResizeObserver(update);
    obs.observe(document.body);

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [el, p.visible]);

  if (!p.visible || !rect) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={p.onNext} />

      {/* Spotlight */}
      <div
        className="absolute ring-4 ring-white rounded-2xl pointer-events-none shadow-2xl"
        style={{
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        }}
      />

      {/* Tooltip card */}
      <div
        className="absolute max-w-md bg-white rounded-2xl shadow-xl p-4 border left-1/2 -translate-x-1/2"
        style={{ top: Math.max(rect.bottom + 12, 16) }}
      >
        <h3 className="text-lg font-semibold mb-1">{p.headline}</h3>
        <p className="text-sm text-muted-foreground mb-3">{p.body}</p>
        <div className="flex gap-2 justify-end">
          {p.onPrev && (
            <Button variant="outline" onClick={p.onPrev}>
              {p.prevLabel ?? "Voltar"}
            </Button>
          )}
          {p.onNext && (
            <Button onClick={p.onNext}>
              {p.nextLabel ?? "Próximo"}
            </Button>
          )}
          {p.onDone && (
            <Button onClick={p.onDone}>
              {p.doneLabel ?? "Concluir"}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
