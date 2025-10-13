"use client";
export function ROISectionHeader() {
  const copy = async () => {
    const url = `${window.location.origin}${window.location.pathname}#roi-formula`;
    await navigator.clipboard.writeText(url);
  };
  return (
    <div className="flex items-center justify-between mt-4">
      <h2 id="roi-formula" className="text-lg font-semibold">Fórmula do ROI</h2>
      <button onClick={copy} className="text-xs underline hover:opacity-80">Copiar link direto</button>
    </div>
  );
}
