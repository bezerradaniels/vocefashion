import { useState } from "react";
import { cx } from "@/lib/cx";
import { errorMessage } from "@/lib/db";

/** Mensagem curta de confirmação ("Salvo") ou de erro. */
export function useFlash(ms = 2500) {
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout>>();
  function show(text: string, error: boolean) {
    clearTimeout(timer);
    setMsg({ text, error });
    setTimer(setTimeout(() => setMsg(null), error ? ms * 2 : ms));
  }
  const flash = (text: string) => show(text, false);
  /** Espera a gravação: mostra `okText` se deu certo ou o erro. Devolve se deu certo. */
  async function run(action: Promise<unknown>, okText: string): Promise<boolean> {
    try {
      await action;
      if (okText) show(okText, false);
      return true;
    } catch (err) {
      show(errorMessage(err), true);
      return false;
    }
  }
  const node = msg ? (
    <div
      role={msg.error ? "alert" : "status"}
      className={cx(
        "fixed bottom-5 left-1/2 z-50 max-w-[calc(100%-32px)] -translate-x-1/2 rounded-card px-4 py-3 text-[14px] font-medium text-white",
        msg.error ? "bg-error" : "bg-charcoal",
      )}
    >
      {msg.text}
    </div>
  ) : null;
  return { flash, run, node };
}
