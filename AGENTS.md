<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Store data (products, settings, orders) lives in Lovable Cloud; admin writes gated by user_roles admin role (first signup becomes admin) — keeps owner-only edits server-enforced.
- Images go to private "images" bucket; stored as 20-year signed URLs — workspace blocks public buckets.
- Thermal receipts render as complete standalone 58 mm documents and print only after loading — prevents blank jobs and excess paper feed.
- Product option steps (borders, flavors, pastéis) are defined in src/lib/steps.ts; each product stores removed options per step in products.hidden_options (exclusion list) — new options appear by default and storefront/admin share one step builder.
- Item price = product price + chosen option prices + optional broto (store_settings.broto_price); covered by src/lib/steps.test.ts (vitest).
