/**
 * Lê uma imagem escolhida pelo usuário, reduz e devolve como data URL (JPEG).
 * Mantém o localStorage leve no modo demonstração; no Supabase, vira upload no Storage.
 */
export async function fileToResizedDataUrl(
  file: File,
  { maxW = 1080, maxH = 1350, quality = 0.8, type = "image/jpeg" } = {},
): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem (JPG, PNG ou WebP).");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Não foi possível ler esta imagem."));
      el.src = url;
    });
    const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Seu navegador não conseguiu processar a imagem.");
    if (type === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL(type, quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** "189,90" | "1.234,5" | "189.90" → número (NaN se inválido). */
export function parseMoney(s: string) {
  const t = s.trim().replace(/\s|R\$/g, "");
  if (!t) return NaN;
  const normalized = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  return Number(normalized);
}

/** 189.9 → "189,90" para campos de formulário. */
export function moneyInput(n: number | null | undefined) {
  return n === null || n === undefined || Number.isNaN(n) ? "" : n.toFixed(2).replace(".", ",");
}
