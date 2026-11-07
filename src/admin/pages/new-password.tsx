import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { hasRecoverySession, setNewPassword } from "@/admin/auth";
import { Button, TextField } from "@/admin/ui";
import { useSettings } from "@/lib/db";
import { assetUrl } from "@/lib/asset";
import { useTitle } from "@/lib/title";

/**
 * Destino do link do e-mail "Reset your password" (Supabase Auth).
 * O cliente do Supabase lê o token do endereço e abre uma sessão; aqui a pessoa grava a nova senha.
 */
export function NewPasswordPage() {
  useTitle("Nova senha");
  const settings = useSettings();
  const navigate = useNavigate();
  // Link com erro (ex.: expirado) já vem no endereço; lido uma vez, antes de o Supabase limpar o hash.
  const [linkError] = useState(() => /error_code=/.test(window.location.hash));
  const [state, setState] = useState<"checking" | "ready" | "invalid">(linkError ? "invalid" : "checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (linkError) return;
    let alive = true;
    void hasRecoverySession().then((ok) => alive && setState(ok ? "ready" : "invalid"));
    return () => {
      alive = false;
    };
  }, [linkError]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) return setError("Use pelo menos 8 caracteres.");
    if (password !== confirm) return setError("As duas senhas não são iguais.");
    setBusy(true);
    const err = await setNewPassword(password);
    setBusy(false);
    if (err) setError(err);
    else navigate("/admin", { replace: true });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-alabaster px-4 py-10">
      <div className="flex w-full max-w-[400px] flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src={assetUrl(settings.logo)}
            alt=""
            className="size-16 rounded-full object-cover mix-blend-multiply brightness-[1.05] contrast-[1.15]"
          />
          <h1 className="font-display text-[24px] leading-[30px] font-bold tracking-[-.02em]">Criar nova senha</h1>
        </div>

        <div className="flex flex-col gap-4 rounded-card border border-line bg-white p-5 sm:p-6">
          {state === "checking" && <p className="text-center text-[14px] text-muted">Conferindo o link…</p>}
          {state === "invalid" && (
            <>
              <p className="text-[14px] leading-5 text-body-2">
                Este link expirou ou já foi usado. Peça um novo na tela de login, em “Esqueci minha senha”.
              </p>
              <Link
                to="/admin/login"
                className="inline-flex h-11 items-center justify-center rounded-full bg-charcoal text-[15px] font-semibold text-white"
              >
                Ir para o login
              </Link>
            </>
          )}
          {state === "ready" && (
            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
              <TextField
                label="Nova senha"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
              />
              <TextField
                label="Repita a nova senha"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError("");
                }}
              />
              {error && (
                <p role="alert" className="text-[13px] font-medium text-error">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Salvando…" : "Salvar e entrar"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
