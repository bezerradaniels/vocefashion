const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** R$ 1.234,56 */
export function brl(value: number) {
  return currency.format(value);
}

export function digits(s: string | undefined) {
  return (s ?? "").replace(/\D/g, "");
}

export const MASKS = {
  /** (77) 99999-9999 */
  cel(s: string) {
    const d = digits(s).slice(0, 11);
    if (!d) return "";
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  },
  /** 000.000.000-00 */
  cpf(s: string) {
    const d = digits(s).slice(0, 11);
    let o = d.slice(0, 3);
    if (d.length > 3) o += "." + d.slice(3, 6);
    if (d.length > 6) o += "." + d.slice(6, 9);
    if (d.length > 9) o += "-" + d.slice(9);
    return o;
  },
  /** 00000-000 */
  cep(s: string) {
    const d = digits(s).slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  },
  /** 0000 0000 0000 0000 */
  card(s: string) {
    return digits(s).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  },
  /** MM/AA */
  expiry(s: string) {
    const d = digits(s).slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  },
  cvv(s: string) {
    return digits(s).slice(0, 4);
  },
} satisfies Record<string, (s: string) => string>;

export type MaskName = keyof typeof MASKS;

/** Valida os dígitos verificadores do CPF. */
export function isValidCpf(value: string) {
  const d = digits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const check = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return check(9) === Number(d[9]) && check(10) === Number(d[10]);
}

/** (77) 99999-9999 a partir de dígitos salvos. */
export function formatPhone(value: string) {
  return MASKS.cel(value);
}

/** Link do WhatsApp (assume Brasil, +55). */
export function whatsappUrl(phone: string, text?: string) {
  const d = digits(phone);
  const full = d.startsWith("55") && d.length > 11 ? d : `55${d}`;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
