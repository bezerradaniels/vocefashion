import { Checkout } from "@/components/checkout";
import { useTitle } from "@/lib/title";

export function CheckoutPage() {
  useTitle("Finalizar pedido");
  return <Checkout />;
}
