import { useNavigate } from "react-router";

// Quantas telas a cliente já visitou nesta sessão do app.
// Quem chega direto pelo link do Instagram não tem para onde "voltar" dentro da loja.
let visited = 0;

export function markVisit() {
  visited++;
}

export function useGoBack(fallback = "/") {
  const navigate = useNavigate();
  return () => {
    if (visited > 1) navigate(-1);
    else navigate(fallback);
  };
}
