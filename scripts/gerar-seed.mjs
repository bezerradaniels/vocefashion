// Gera supabase/seed.sql a partir de src/data/catalog.ts: `npm run db:seed-sql`.
import { writeFileSync } from "node:fs";
import { runnerImport } from "vite";
const root = process.cwd();
const { module: c } = await runnerImport("/src/data/catalog.ts", {
  root, configFile: false, logLevel: "error",
  resolve: { alias: { "@": root + "/src" } },
});
const q = (v) => v === null || v === undefined ? "null" : typeof v === "number" ? String(v) : typeof v === "boolean" ? String(v) : `'${String(v).replace(/'/g, "''")}'`;
const arr = (a) => `array[${a.map(q).join(", ")}]::text[]`;
const out = [];
out.push(`-- Dados iniciais da loja (gerados a partir de src/data/catalog.ts).
-- Nomes, preços, estoque e textos dos produtos são ilustrativos: conferir com a loja.
-- Rodar uma vez, depois de todas as migrações (SQL Editor ou \`supabase db reset\` no ambiente local).
`);
out.push("insert into public.categories (id, name, active, position) values");
out.push(c.SEED_CATEGORIES.map((x, i) => `  (${q(x.id)}, ${q(x.name)}, ${x.active}, ${i})`).join(",\n") + ";\n");
out.push("insert into public.products (id, slug, category_id, name, price, old_price, description, description_more, photo_label, images, active, created_at) overriding system value values");
out.push(c.SEED_PRODUCTS.map((p) => `  (${p.id}, ${q(p.slug)}, ${q(p.categoryId)}, ${q(p.name)}, ${p.price}, ${q(p.oldPrice)}, ${q(p.description)}, ${q(p.descriptionMore)}, ${q(p.photoLabel)}, ${arr(p.images)}, ${p.active}, now() - interval '${Math.round((Date.now() - Date.parse(p.createdAt)) / 86400000)} days')`).join(",\n") + ";\n");
out.push("select setval(pg_get_serial_sequence('public.products', 'id'), (select max(id) from public.products));\n");
out.push("-- O gatilho criou o estoque zerado; aqui entram as quantidades.");
out.push("update public.product_stock s set qty = v.qty from (values");
out.push(c.SEED_PRODUCTS.flatMap((p) => Object.entries(p.stock).map(([s, n]) => `  (${p.id}, '${s}'::public.product_size, ${n})`)).join(",\n"));
out.push(") as v (product_id, size, qty) where s.product_id = v.product_id and s.size = v.size;\n");
const st = c.SEED_SETTINGS;
out.push(`insert into public.store_settings (name, logo, description, phone, instagram, address, pix_enabled, pix_discount_percent, pix_expiry_minutes, card_enabled, card_installments, local_cep_prefix, local_city_label) values
  (${[st.name, st.logo, st.description, st.phone, st.instagram, st.address].map(q).join(", ")}, ${st.payments.pix.enabled}, ${st.payments.pix.discountPercent}, ${st.payments.pix.expiryMinutes}, ${st.payments.card.enabled}, ${st.payments.card.installments}, ${q(st.shipping.localCepPrefix)}, ${q(st.shipping.localCityLabel)});\n`);
out.push("insert into public.shipping_methods (id, name, sub, price, enabled, scope, pickup, free_above, position) values");
out.push(st.shipping.methods.map((m, i) => `  (${[m.id, m.name, m.sub].map(q).join(", ")}, ${m.price}, ${m.enabled}, ${q(m.scope)}, ${m.pickup}, ${q(m.freeAbove)}, ${i})`).join(",\n") + ";\n");
const h = c.SEED_HERO;
out.push(`insert into public.hero (enabled, tag, title, cta, target, image, image_alt) values
  (${h.enabled}, ${[h.tag, h.title, h.cta, h.target, h.image, h.imageAlt].map(q).join(", ")});\n`);
out.push("-- Cupons de exemplo (o uso começa do zero).");
out.push("insert into public.coupons (code, type, value, min_subtotal, active, expires_at, usage_limit) values");
out.push(c.SEED_COUPONS.map((x) => `  (${q(x.code)}, ${q(x.type)}, ${x.value}, ${x.minSubtotal}, ${x.active}, ${q(x.expiresAt)}, ${q(x.usageLimit)})`).join(",\n") + ";");
writeFileSync(new URL("../supabase/seed.sql", import.meta.url), out.join("\n") + "\n");
console.log("supabase/seed.sql atualizado");
