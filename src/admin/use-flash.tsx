import { useState } from "react";

/** Mensagem curta de confirmação ("Salvo"). */
export function useFlash(ms = 2500) {
  const [msg, setMsg] = useState("");
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout>>();
  function flash(text: string) {
    clearTimeout(timer);
    setMsg(text);
    setTimer(setTimeout(() => setMsg(""), ms));
  }
  const node = msg ? (
    <div
      role="status"
      className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-card bg-charcoal px-4 py-3 text-[14px] font-medium text-white"
    >
      {msg}
    </div>
  ) : null;
  return { flash, node };
}
