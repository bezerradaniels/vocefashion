import { Storefront } from "@/components/storefront";
import { useTitle } from "@/lib/title";

export function HomePage() {
  useTitle();
  return <Storefront />;
}
