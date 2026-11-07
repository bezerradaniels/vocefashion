import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { login, requestPasswordReset, useAdminSession } from "@/admin/auth";
import { DEMO_ADMIN } from "@/admin/demo-credentials";
import { DEMO_MODE } from "@/lib/db";
import { Button, TextField } from "@/admin/ui";
import { useSettings } from "@/lib/db";
import { useTitle } from "@/lib/title";
import { assetUrl } from "@/lib/asset";

export function LoginPage() {
  useTitle("Entrar no painel");
  const session = useAdminSession();
  const settings = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // "forgot": pede só o e-mail e envia o link para criar uma nova senha.
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [sent, setSent] = useState(false);

  if (session) return <Navigate to={from} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (mode === "forgot") {
      if (!/^\S+@\S+\.\S{2,}$/.test(email.trim())) {
        setError("Informe o e-mail de acesso ao painel.");
        return;
      }
      setBusy(true);
      const err = await requestPasswordReset(email);
      setBusy(false);
      if (err) setError(err);
      else setSent(true);
      return;
    }
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setBusy(true);
    const err = await login(email, password);
    setBusy(false);
    if (err) setError(err);
    else navigate(from, { replace: true });
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
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[24px] leading-[30px] font-bold tracking-[-.02em]">
              Painel da loja
            </h1>
            <p className="text-[14px] text-muted">{settings.name}</p>
          </div>
        </div>

        <form
          onSubmit={submit}
          noValidate
          className="flex flex-col gap-4 rounded-card border border-line bg-white p-5 sm:p-6"
        >
          <TextField
            label="E-mail"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />
          {mode === "login" && (
            <TextField
              label="Senha"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
            />
          )}
          {sent && (
            <p role="status" className="rounded-field bg-ok-tint px-3 py-2.5 text-[13px] text-ok">
              Se este e-mail tiver acesso ao painel, enviamos um link para criar uma nova senha. Confira também o
              spam.
            </p>
          )}
          {error && (
            <p role="alert" className="text-[13px] font-medium text-error">
              {error}
            </p>
          )}
          <Button type="submit" className="mt-1 w-full" disabled={busy}>
            {mode === "forgot" ? (busy ? "Enviando…" : "Enviar link") : busy ? "Entrando…" : "Entrar"}
          </Button>
          {!DEMO_MODE && (
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "forgot" : "login");
                setError("");
                setSent(false);
              }}
              className="self-center text-[14px] font-semibold text-charcoal underline underline-offset-[3px]"
            >
              {mode === "login" ? "Esqueci minha senha" : "Voltar para o login"}
            </button>
          )}
        </form>

        {DEMO_MODE && (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-[13px] text-muted">
              Modo demonstração: não há servidor ainda, então o acesso é de teste.
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail(DEMO_ADMIN.email);
                setPassword(DEMO_ADMIN.password);
                setError("");
              }}
              className="text-[14px] font-semibold text-charcoal underline underline-offset-[3px]"
            >
              Preencher acesso de demonstração
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
