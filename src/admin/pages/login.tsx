import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { login, useAdminSession } from "@/admin/auth";
import { DEMO_ADMIN } from "@/admin/demo-credentials";
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

  if (session) return <Navigate to={from} replace />;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    if (login(email, password)) navigate(from, { replace: true });
    else setError("E-mail ou senha incorretos.");
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
          {error && (
            <p role="alert" className="text-[13px] font-medium text-error">
              {error}
            </p>
          )}
          <Button type="submit" className="mt-1 w-full">
            Entrar
          </Button>
        </form>

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
      </div>
    </div>
  );
}
