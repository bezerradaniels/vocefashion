import { Link } from "react-router";
import { useTitle } from "@/lib/title";

export function NotFoundPage() {
  useTitle("Página não encontrada");
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-4 bg-alabaster px-7 text-center">
      <h1 className="font-display text-[24px] leading-[30px] font-bold tracking-[-.02em]">
        Página não encontrada
      </h1>
      <p className="text-[15px] leading-[22px] text-body-2">
        Esta peça pode ter saído da vitrine. Veja as novidades da loja.
      </p>
      <Link
        to="/"
        className="flex h-[52px] w-full items-center justify-center rounded-full bg-copper text-[16px] font-semibold text-white hover:bg-copper-hover active:bg-copper-active"
      >
        Ver a vitrine
      </Link>
    </div>
  );
}
