/** Tela enquanto a loja carrega do Supabase (ou se a primeira leitura falhar). */
export function LoadingScreen({ label = "Carregando a loja…", error }: { label?: string; error?: boolean }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-4 bg-alabaster px-7 text-center">
      {error ? (
        <>
          <p className="font-display text-[20px] leading-[26px] font-semibold">Não foi possível abrir a loja</p>
          <p className="text-[14px] leading-5 text-muted">Confira a sua conexão e tente de novo.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-12 rounded-full bg-copper px-6 text-[15px] font-semibold text-white hover:bg-copper-hover"
          >
            Tentar de novo
          </button>
        </>
      ) : (
        <>
          <span
            aria-hidden="true"
            className="size-8 animate-spin rounded-full border-2 border-line border-t-copper motion-reduce:animate-none"
          />
          <p role="status" className="text-[14px] text-muted">
            {label}
          </p>
        </>
      )}
    </div>
  );
}
