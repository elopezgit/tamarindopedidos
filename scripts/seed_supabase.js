/* Genera el SQL de carga del catálogo de Tamarindo.
 * Uso: node scripts/seed_supabase.js > seed.sql
 * Todas las sentencias llevan empresa_id = EMPRESA_ID y usan WHERE NOT EXISTS,
 * por lo que no alteran los datos de otras empresas del proyecto.
 */
const fs = require('node:fs');
const vm = require('node:vm');

const codigo = fs.readFileSync(`${__dirname}/../data.js`, 'utf8')
  + '\n;globalThis.__DATA = { EMPRESA_ID, DEFAULT_CATEGORIES, DEFAULT_MENU, DEFAULT_BANNERS };';

const contexto = { console };
vm.createContext(contexto);
vm.runInContext(codigo, contexto);

const { EMPRESA_ID, DEFAULT_CATEGORIES, DEFAULT_MENU, DEFAULT_BANNERS } = contexto.__DATA;
const E = `'${EMPRESA_ID}'`;
const esc = (valor) => String(valor ?? '').replace(/'/g, "''");

const categorias = DEFAULT_CATEGORIES.map((cat) => `  ('${esc(cat.name)}', '${esc(cat.slug)}', '${esc(cat.icon)}', ${cat.order})`).join(',\n');

const productos = DEFAULT_MENU.map((p) => {
  const tags = (p.tags || []).map((t) => `'${esc(t)}'`).join(', ');
  return [
    '  (',
    `'${esc(p.code)}', '${esc(p.cat)}', '${esc(p.name)}', '${esc(p.desc)}', ${Number(p.price)},`,
    `'${esc(p.image)}', ${Number(p.sort)}, '${esc(p.emoji)}', '${esc(p.unit || 'unidad')}',`,
    `'${esc(p.ingredients)}', '${esc(p.prepDesc)}', '${esc(p.prepTime)}', ARRAY[${tags}]::text[],`,
    `${p.hot ? 'true' : 'false'}, ${Number(p.rating)}`,
    ')'
  ].join('\n   ');
}).join(',\n');

const banners = DEFAULT_BANNERS.map((b, idx) => `  ('${esc(b.title)}', '${esc(b.subtitle)}', '${esc(b.image)}', '${esc(b.link)}', ${idx + 1})`).join(',\n');

console.log(`-- Catálogo inicial de Tamarindo. Empresa: ${EMPRESA_ID}`);
console.log(`insert into public.categories (empresa_id, name, slug, icon, sort_order, is_active)
select ${E}, v.name, v.slug, v.icon, v.sort_order, true
from (values
${categorias}
) as v(name, slug, icon, sort_order)
where not exists (
  select 1 from public.categories c
  where c.empresa_id = ${E} and c.slug = v.slug
);`);
console.log(`insert into public.products (
  empresa_id, category_id, code, name, description, price, image_url, sort_order,
  emoji, unit_type, ingredients, prep_descripcion, prep_tiempo, tags, hot, rating, is_active
)
select ${E}, c.id, v.code, v.name, v.description, v.price, v.image_url, v.sort_order,
       v.emoji, v.unit_type, v.ingredients, v.prep_descripcion, v.prep_tiempo, v.tags, v.hot, v.rating, true
from (values
${productos}
) as v(code, cat_slug, name, description, price, image_url, sort_order, emoji, unit_type,
       ingredients, prep_descripcion, prep_tiempo, tags, hot, rating)
join public.categories c on c.empresa_id = ${E} and c.slug = v.cat_slug
where not exists (
  select 1 from public.products p
  where p.empresa_id = ${E} and p.code = v.code
);`);
console.log(`insert into public.banners (empresa_id, title, subtitle, image_url, link, sort_order, is_active)
select ${E}, v.title, v.subtitle, v.image_url, v.link, v.sort_order, true
from (values
${banners}
) as v(title, subtitle, image_url, link, sort_order)
where not exists (
  select 1 from public.banners b
  where b.empresa_id = ${E} and b.title = v.title
);`);
