import { useParams } from "react-router";
import { ProductView } from "@/components/product-view";
import { useProducts } from "@/lib/db";
import { useTitle } from "@/lib/title";
import { NotFoundPage } from "@/routes/not-found";

export function ProductPage() {
  const { slug = "" } = useParams();
  const product = useProducts().find((p) => p.slug === slug && p.active);
  useTitle(product?.name ?? "Peça não encontrada");
  if (!product) return <NotFoundPage />;
  // key: trocar de produto zera tamanho, descrição e carrossel.
  return <ProductView key={product.id} product={product} />;
}
