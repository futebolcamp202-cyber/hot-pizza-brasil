import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { CheckCircle2, ImagePlus, LogIn, LogOut, Pencil, Plus, Printer, Receipt, Save, Settings, ShoppingBag, Trash2, UserPlus, X, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS, FALLBACK_IMG, fetchProducts, fetchFlavors, fetchBorders, normName, type Flavor, type Border, fetchSettings, money, themeVars, uploadImage, type OrderRow, type Product, type SettingsData } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel do dono | Nostra Casa" },
      { name: "description", content: "Painel administrativo da Nostra Casa Pizzaria e Lanches." },
      { property: "og:title", content: "Painel do dono | Nostra Casa" },
      { property: "og:description", content: "Gerencie cardápio, pedidos e fotos da Nostra Casa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPanel,
});

const EMPTY_PRODUCT: Product = { id: "", name: "", description: "", price: 0, image_url: "", category: "Pizzas", is_combo: false, requires_border: false, allow_two_flavors: false, combo_flavors_step: false, ingredients: [], extras: [], available: true, sort_order: 0 };

function AdminPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [view, setView] = useState<"overview" | "orders" | "menu" | "options" | "settings">("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [notice, setNotice] = useState("");
  const [printing, setPrinting] = useState(false);
  const printingRef = useRef(false);

  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(""), 2200); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecked(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => {
        setIsAdmin(!!data);
        if (data) { void loadMenu(); void loadOrders(); }
      });
  }, [session?.user.id]);

  async function loadMenu() {
    const [p, s] = await Promise.all([fetchProducts(false), fetchSettings()]);
    setProducts(p); setSettings(s);
  }
  async function loadOrders() {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
    setOrders((data ?? []) as unknown as OrderRow[]);
  }

  const saveProduct = async (p: Product) => {
    if (!p.name.trim()) return flash("Informe o nome do produto");
    const payload = { name: p.name.trim(), description: p.description, price: Number(p.price) || 0, image_url: p.image_url || null, category: p.category || "Pizzas", is_combo: p.is_combo, requires_border: p.requires_border, allow_two_flavors: p.allow_two_flavors, combo_flavors_step: p.combo_flavors_step, ingredients: p.ingredients.filter(Boolean), extras: p.extras.filter(Boolean), available: p.available, sort_order: Number(p.sort_order) || 0 };
    const { error } = p.id ? await supabase.from("products").update(payload).eq("id", p.id) : await supabase.from("products").insert(payload);
    if (error) return flash("Erro ao salvar: " + error.message);
    setEditing(null); await loadMenu(); flash("Produto salvo");
  };
  const deleteProduct = async (p: Product) => {
    if (!confirm(`Remover "${p.name}" do cardápio?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return flash("Erro ao remover: " + error.message);
    await loadMenu(); flash("Produto removido");
  };
  const toggleAvailable = async (p: Product) => {
    await supabase.from("products").update({ available: !p.available }).eq("id", p.id);
    await loadMenu();
  };
  const saveSettings = async (patch: Partial<SettingsData>) => {
    const { id: _id, ...rest } = { ...settings, ...patch };
    const { error } = settings.id
      ? await supabase.from("store_settings").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", settings.id)
      : await supabase.from("store_settings").insert(rest);
    if (error) return flash("Erro ao salvar: " + error.message);
    await loadMenu(); flash("Configurações salvas");
  };
  const updateOrderStatus = async (id: string, status: string) => { await supabase.from("orders").update({ status }).eq("id", id); void loadOrders(); };
  const deleteOrder = async (id: string) => { if (!confirm("Excluir este pedido?")) return; await supabase.from("orders").delete().eq("id", id); void loadOrders(); };
  const printReceipt = (o: OrderRow) => {
    if (printingRef.current) return;
    printingRef.current = true;
    setPrinting(true);
    const release = () => { printingRef.current = false; setPrinting(false); };
    const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c] ?? c);
    const row = (l: string, r: string, cls = "") => `<div class="row ${cls}"><span>${esc(l)}</span><span>${esc(r)}</span></div>`;
    const items = o.items.map((i) => `<div class="item">
${row(`${i.quantity}x ${i.name}`, money(i.price * i.quantity), "bold")}
<div class="sm">Valor unitário: ${esc(money(i.price))}</div>
${i.details ? `<div class="sm"><span class="bold">Detalhes:</span> ${esc(i.details)}</div>` : ""}
</div>`).join("");
    const orderLabel = o.id.slice(0, 8).toUpperCase();
    const body = `<div class="center bold lg">${esc(settings.receipt_header)}</div>
<div class="center sm">Pedido #${esc(orderLabel)}</div>
<div class="center sm">${esc(new Date(o.created_at).toLocaleString("pt-BR"))}</div>
<div class="dashed"></div>
<div><span class="bold">Cliente:</span> ${esc(o.customer_name)}</div>
<div class="bold">${o.order_type === "pickup" ? "RETIRADA NO BALCÃO" : "ENTREGA"}</div>
${o.order_type === "pickup" ? "" : `<div>Endereço: ${esc(`${o.address}, ${o.house_number}`)}</div>
<div>Residência: ${esc(o.residence_type)}</div>
<div>Distância: ${esc(String(o.distance_km))} km</div>`}
<div class="dashed"></div>
${items}
<div class="dashed"></div>
${row("Subtotal", money(o.subtotal))}${row("Entrega", money(o.delivery_fee))}${row("TOTAL", money(o.total), "bold lg")}
<div class="dashed"></div>
<div><span class="bold">Pagamento:</span> ${esc(o.payment_method)}</div>${o.change_for ? row("Troco para", money(o.change_for)) : ""}
<div class="dashed"></div>
<div class="center bold">Obrigado!</div>`;
    const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Pedido ${esc(orderLabel)} - Nostra Casa</title>
<style>
  @page { size: 58mm auto; margin: 0; }
  *, *::before, *::after { box-sizing: border-box; }
  html, body { width: 58mm; max-width: 58mm; margin: 0; padding: 0; height: auto; min-height: 0; max-height: none; overflow: visible; background: #fff; color: #000; }
  .receipt { width: 56mm; max-width: 56mm; height: auto; min-height: 0; margin: 0; padding: 2mm; font-family: 'Courier New', 'Lucida Console', monospace; font-size: 9.5px; line-height: 1.4; overflow-wrap: anywhere; color: #000; }
  .center { text-align: center; } .bold { font-weight: 700; } .sm { font-size: .9em; } .lg { font-size: 1.2em; }
  .dashed { border-top: 1px solid #000; margin: 4px 0; }
  .row { display: flex; justify-content: space-between; gap: 4px; color: #000; } .row span:last-child { white-space: nowrap; }
  .item { margin-bottom: 2px; }
  @media print {
    html, body { width: 58mm !important; max-width: 58mm !important; margin: 0 !important; padding: 0 !important; height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; }
    /* Texto térmico forte: preto puro e bold em tudo */
    *, *::before, *::after {
      color: #000 !important;
      font-weight: 700 !important;
      opacity: 1 !important;
      filter: none !important;
      text-shadow: none !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .dashed { border-top: 2px solid #000 !important; }
  }
</style></head><body><div class="receipt">${body}</div></body></html>`;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    // Mantém o iframe fora da tela, mas renderizável. `visibility: hidden` também
    // ocultava o conteúdo na impressão, deixando aparecer apenas a data do Chrome.
    Object.assign(iframe.style, { position: "fixed", left: "0", top: "0", width: "58mm", height: "1px", border: "0" });
    let fired = false;
    const cleanup = () => { window.setTimeout(() => { iframe.remove(); release(); }, 1000); };
    iframe.onload = async () => {
      if (fired) return;
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      // Só imprime se o cupom real estiver no documento (nunca about:blank vazio)
      if (!doc || !win || !doc.querySelector(".receipt")?.textContent?.trim()) return;
      fired = true;
      try {
        if (doc.fonts?.ready) await doc.fonts.ready;
        await Promise.all(Array.from(doc.images).map((img) => img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; })));
        await new Promise((r) => win.requestAnimationFrame(() => win.requestAnimationFrame(() => window.setTimeout(r, 250))));
        // Mede a altura REAL do cupom já renderizado e fixa a página nesse tamanho exato
        // ("58mm auto" é inválido no Chrome e faz ele usar o papel do driver, ex.: 210 mm).
        const receiptEl = doc.querySelector(".receipt") as HTMLElement;
        const heightPx = Math.ceil(receiptEl.getBoundingClientRect().height);
        const printHeightMm = Math.ceil((heightPx * 25.4) / 96) + 3;
        iframe.style.height = `${printHeightMm}mm`;
        const pageStyle = doc.createElement("style");
        pageStyle.id = "dynamic-page-size";
        pageStyle.textContent = `@page { size: 58mm ${printHeightMm}mm; margin: 0; } html, body { height: ${printHeightMm}mm !important; max-height: ${printHeightMm}mm !important; overflow: hidden !important; }`;
        doc.head.appendChild(pageStyle);
        doc.body.setAttribute("data-print-height-mm", String(printHeightMm));
        await new Promise((r) => win.requestAnimationFrame(() => window.setTimeout(r, 50)));
        win.focus();
        win.print();
      } catch (e) {
        console.error("Erro ao imprimir cupom:", e);
        flash("Não foi possível imprimir o pedido");
      } finally {
        cleanup();
      }
    };
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
    window.setTimeout(() => { if (!fired) { iframe.remove(); release(); flash("Falha ao preparar a impressão"); } }, 10000);
  };

  if (!checked) return <div className="admin-login-page" style={themeVars(settings)}><p className="muted">Carregando...</p></div>;
  if (!session) return <AuthCard settings={settings} />;
  if (isAdmin === false) {
    return (
      <div className="admin-login-page" style={themeVars(settings)}><div className="admin-login-card">
        <h2>Sem acesso</h2>
        <p className="muted">Esta conta não é de administrador da loja.</p>
        <button className="primary-btn full" onClick={() => supabase.auth.signOut()}><LogOut size={17} /> Sair</button>
        <Link to="/" className="link-btn">Voltar para a loja</Link>
      </div></div>
    );
  }

  return (
    <div className="app admin-full" style={themeVars(settings)}>
      <header className="topbar admin-topbar">
        <div className="brand"><div className="brand-mark">NC</div><div><strong>NOSTRA CASA</strong><span>PAINEL DO DONO</span></div></div>
        <div className="header-actions">
          <Link to="/" className="ghost-btn"><ShoppingBag size={17} /> Ver loja</Link>
          <button className="ghost-btn" onClick={() => supabase.auth.signOut()}><LogOut size={17} /> Sair</button>
        </div>
      </header>
      <main className="admin-main">
        <div className="admin-tabs">
          {([["overview", "Visão geral"], ["orders", "Pedidos"], ["menu", "Cardápio"], ["options", "Sabores e bordas"], ["settings", "Fotos e configurações"]] as const).map(([k, l]) => (
            <button key={k} className={view === k ? "active" : ""} onClick={() => { setView(k); if (k === "orders") void loadOrders(); }}>{l}</button>
          ))}
        </div>

        {view === "overview" && (
          <div className="admin-overview"><div className="admin-cards">
            <div onClick={() => setView("orders")}><Receipt size={20} /><strong>Pedidos</strong><span>{orders.length} registrados</span></div>
            <div onClick={() => setView("menu")}><ShoppingBag size={20} /><strong>Cardápio</strong><span>{products.length} itens</span></div>
            <div onClick={() => setView("settings")}><Settings size={20} /><strong>Fotos e configurações</strong><span>Capa, logo, cores e recibo</span></div>
          </div></div>
        )}

        {view === "orders" && (
          <div className="admin-orders">
            <button className="secondary-btn" onClick={() => void loadOrders()}>Atualizar lista</button>
            {orders.length === 0 ? <p className="muted">Nenhum pedido registrado ainda.</p> : orders.map((o) => (
              <div className="order-card" key={o.id}>
                <div className="order-header">
                  <strong>{o.customer_name}</strong>
                  <span className={`order-status ${o.status}`}>{o.status === "approved" ? "Aprovado" : o.status === "rejected" ? "Recusado" : "Pendente"}</span>
                </div>
                <div className="order-items">{o.items.map((i, idx) => <span key={idx}>{i.quantity}x {i.name}{i.details ? ` (${i.details})` : ""}</span>)}</div>
                <div className="order-meta">
                  <span>{money(o.total)}</span><span>{o.payment_method}</span>
                  <span>{o.order_type === "pickup" ? "Retirada" : `Entrega: ${o.address}, ${o.house_number}`}</span>
                  <span>{new Date(o.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <div className="order-actions">
                  {o.status !== "approved" && <button className="small-btn approve" onClick={() => updateOrderStatus(o.id, "approved")}><CheckCircle2 size={15} /> Aprovar</button>}
                  {o.status !== "rejected" && <button className="small-btn reject" onClick={() => updateOrderStatus(o.id, "rejected")}><XCircle size={15} /> Recusar</button>}
                  <button className="small-btn" onClick={() => printReceipt(o)}><Printer size={15} /> Imprimir</button>
                  <button className="small-btn" onClick={() => deleteOrder(o.id)}><Trash2 size={15} /> Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "menu" && (
          <div className="admin-menu">
            <button className="primary-btn" onClick={() => setEditing({ ...EMPTY_PRODUCT, sort_order: products.length + 1 })}><Plus size={17} /> Novo produto</button>
            {editing && !editing.id && <ProductForm key="new" product={editing} onSave={saveProduct} onCancel={() => setEditing(null)} onError={flash} />}
            {products.map((p) => (
              <div key={p.id}>
                <div className="menu-item" style={{ opacity: p.available ? 1 : 0.5 }}>
                  <div className="menu-item-img"><img src={p.image_url || FALLBACK_IMG} alt={p.name} /></div>
                  <div className="menu-item-body">
                    <strong>{p.name}</strong>
                    <span>{money(p.price)} · {p.category}{p.available ? "" : " · Oculto"}</span>
                    {p.is_combo && <span className="combo-flag">Combo</span>}
                  </div>
                  <div className="menu-item-actions">
                    <button title={p.available ? "Ocultar da loja" : "Mostrar na loja"} onClick={() => toggleAvailable(p)}>{p.available ? <CheckCircle2 size={15} /> : <XCircle size={15} />}</button>
                    <button title="Editar" onClick={() => setEditing(p)}><Pencil size={15} /></button>
                    <button title="Remover" onClick={() => deleteProduct(p)}><Trash2 size={15} /></button>
                  </div>
                </div>
                {editing?.id === p.id && <ProductForm key={p.id} product={editing} onSave={saveProduct} onCancel={() => setEditing(null)} onError={flash} />}
              </div>
            ))}
          </div>
        )}

        {view === "options" && <OptionsManager onError={flash} onOk={flash} />}
        {view === "settings" && <SettingsForm key={settings.id} settings={settings} onSave={saveSettings} onError={flash} />}
      </main>
      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

function AuthCard({ settings }: { settings: SettingsData }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!email || password.length < 6) return setMsg("Preencha e-mail e senha (mínimo 6 caracteres)");
    setLoading(true); setMsg("");
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      if (error) setMsg(error.message);
      else if (!data.session) { setMsg("Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre."); setMode("login"); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message);
    }
    setLoading(false);
  };
  return (
    <div className="admin-login-page" style={themeVars(settings)}>
      <div className="admin-login-card">
        <div className="brand"><div className="brand-mark">NC</div><div><strong>NOSTRA CASA</strong><span>PIZZARIA & LANCHES</span></div></div>
        <div className="modal-kicker">Painel administrativo</div>
        <h2>{mode === "login" ? "Entrar na conta" : "Criar conta"}</h2>
        <p className="muted">{mode === "login" ? "Acesse o painel de gestão da pizzaria." : "A primeira conta criada vira a conta do dono."}</p>
        <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" /></label>
        <label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Mínimo 6 caracteres" /></label>
        {msg && <p className="auth-error">{msg}</p>}
        <button className="primary-btn full" onClick={submit} disabled={loading}>
          {loading ? "Aguarde..." : mode === "login" ? <><LogIn size={18} /> Entrar</> : <><UserPlus size={18} /> Criar conta</>}
        </button>
        <button className="link-btn" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(""); }}>
          {mode === "login" ? "Não tenho conta. Criar agora" : "Já tenho conta. Fazer login"}
        </button>
        <Link to="/" className="link-btn">Voltar para a loja</Link>
      </div>
    </div>
  );
}

function ImageField({ label, value, folder, onChange, onError }: { label: string; value: string | null; folder: string; onChange: (url: string) => void; onError: (m: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return onError("Escolha um arquivo de imagem");
    setBusy(true);
    try { onChange(await uploadImage(file, folder)); }
    catch (e: any) { onError("Erro ao enviar imagem: " + (e?.message ?? "")); }
    setBusy(false);
    if (ref.current) ref.current.value = "";
  };
  return (
    <div>
      <label>{label}</label>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
        <img src={value || FALLBACK_IMG} alt="" className="favicon-preview" style={{ width: 80, height: 80 }} />
        <button type="button" className="secondary-btn" disabled={busy} onClick={() => ref.current?.click()}><ImagePlus size={16} /> {busy ? "Enviando..." : "Enviar foto"}</button>
        <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      </div>
      <input style={{ marginTop: 8 }} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="ou cole o link de uma imagem" />
    </div>
  );
}

function ListEditor({ title, items, onChange, placeholder }: { title: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = () => { const v = draft.trim(); if (!v) return; onChange([...items, v]); setDraft(""); };
  return (
    <div className="form-section">
      <strong>{title}</strong>
      {items.length === 0 && <span className="muted" style={{ fontSize: 12 }}>Nenhum cadastrado.</span>}
      {items.map((it, i) => (
        <div className="add-tag" key={i}>
          <input value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" title="Remover" style={{ background: "var(--button)", color: "white" }} onClick={() => onChange(items.filter((_, j) => j !== i))}><X size={16} /></button>
        </div>
      ))}
      <div className="add-tag">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder={placeholder} />
        <button type="button" title="Adicionar" onClick={add}><Plus size={16} /></button>
      </div>
    </div>
  );
}

function ProductForm({ product, onSave, onCancel, onError }: { product: Product; onSave: (p: Product) => void; onCancel: () => void; onError: (m: string) => void }) {
  const [f, setF] = useState<Product>(product);
  const [saving, setSaving] = useState(false);
  return (
    <div className="product-form">
      <h3>{f.id ? "Editar produto" : "Novo produto"}</h3>
      <label>Nome<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label>Descrição<textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
      <label>Preço (R$)<input type="number" step="0.01" min="0" value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} /></label>
      <label>Categoria<input list="cats" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></label>
      <datalist id="cats"><option value="Combos" /><option value="Pizzas" /><option value="Lanches" /><option value="Bebidas" /></datalist>
      <label>Ordem no cardápio<input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) })} /></label>
      <ImageField label="Foto do produto" value={f.image_url} folder="products" onChange={(url) => setF({ ...f, image_url: url })} onError={onError} />
      <label className="check-label"><input type="checkbox" checked={f.is_combo} onChange={(e) => setF({ ...f, is_combo: e.target.checked })} /> É um combo (cliente escolhe sabores)</label>
      <label className="check-label"><input type="checkbox" checked={f.requires_border} onChange={(e) => setF({ ...f, requires_border: e.target.checked })} /> Exigir Etapa de Borda</label>
      <label className="check-label"><input type="checkbox" checked={f.allow_two_flavors} onChange={(e) => setF({ ...f, allow_two_flavors: e.target.checked })} /> Ativar etapa de escolha de até 2 sabores neste produto</label>
      <label className="check-label"><input type="checkbox" checked={f.combo_flavors_step} onChange={(e) => setF({ ...f, combo_flavors_step: e.target.checked })} /> Ativar Etapa - Sabores do Combo (Até 2 sabores)</label>
      <label className="check-label"><input type="checkbox" checked={f.available} onChange={(e) => setF({ ...f, available: e.target.checked })} /> Mostrar na loja</label>
      <ListEditor title="Ingredientes" items={f.ingredients} onChange={(v) => setF({ ...f, ingredients: v })} placeholder="Novo ingrediente" />
      <ListEditor title="Adicionais / Extras" items={f.extras} onChange={(v) => setF({ ...f, extras: v })} placeholder="Novo adicional" />
      <div className="form-actions">
        <button className="secondary-btn" onClick={onCancel}>Cancelar</button>
        <button className="primary-btn" disabled={saving} onClick={async () => { setSaving(true); await onSave(f); setSaving(false); }}><Save size={16} /> {saving ? "Salvando..." : "Salvar"}</button>
      </div>
    </div>
  );
}

function SettingsForm({ settings, onSave, onError }: { settings: SettingsData; onSave: (p: Partial<SettingsData>) => Promise<void>; onError: (m: string) => void }) {
  const [f, setF] = useState(settings);
  const [saving, setSaving] = useState(false);
  return (
    <div className="settings-form">
      <div className="settings-group">
        <div className="modal-kicker">Fotos do site</div>
        <ImageField label="Foto de capa (banner do topo)" value={f.cover_image_url} folder="site" onChange={(u) => setF({ ...f, cover_image_url: u })} onError={onError} />
        <ImageField label="Foto de perfil / logo (círculo)" value={f.profile_image_url} folder="site" onChange={(u) => setF({ ...f, profile_image_url: u })} onError={onError} />
        <ImageField label="Ícone da aba do navegador" value={f.favicon_url} folder="site" onChange={(u) => setF({ ...f, favicon_url: u })} onError={onError} />
      </div>
      <div className="settings-group">
        <div className="modal-kicker">Cores do site</div>
        <label>Cor principal (destaques)<input type="color" value={f.primary_color} onChange={(e) => setF({ ...f, primary_color: e.target.value })} /></label>
        <label>Cor de fundo<input type="color" value={f.background_color} onChange={(e) => setF({ ...f, background_color: e.target.value })} /></label>
        <label>Cor dos botões<input type="color" value={f.button_color} onChange={(e) => setF({ ...f, button_color: e.target.value })} /></label>
      </div>
      <div className="settings-group">
        <div className="modal-kicker">Cabeçalho do recibo (impressora térmica)</div>
        <textarea value={f.receipt_header} onChange={(e) => setF({ ...f, receipt_header: e.target.value })} rows={5} />
      </div>
      <button className="primary-btn full" disabled={saving} onClick={async () => { setSaving(true); await onSave(f); setSaving(false); }}><Save size={16} /> {saving ? "Salvando..." : "Salvar alterações"}</button>
    </div>
  );
}

function OptionsManager({ onError, onOk }: { onError: (m: string) => void; onOk: (m: string) => void }) {
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [borders, setBorders] = useState<Border[]>([]);
  const [newFlavor, setNewFlavor] = useState("");
  const [nb, setNb] = useState({ name: "", price: "8" });
  const load = async () => { try { const [f, b] = await Promise.all([fetchFlavors(), fetchBorders()]); setFlavors(f); setBorders(b); } catch (e: any) { onError(e.message); } };
  useEffect(() => { void load(); }, []);
  const addFlavor = async () => {
    const name = newFlavor.trim().replace(/\s+/g, " ");
    if (!name) return;
    if (flavors.some((f) => normName(f.name) === normName(name))) return onError("Esse sabor já existe");
    const { error } = await supabase.from("pizza_flavors").insert({ name });
    if (error) return onError("Erro: " + error.message);
    setNewFlavor(""); await load(); onOk("Sabor adicionado");
  };
  const delFlavor = async (f: Flavor) => {
    if (!confirm(`Remover o sabor "${f.name}"?`)) return;
    const { error } = await supabase.from("pizza_flavors").delete().eq("id", f.id);
    if (error) return onError("Erro: " + error.message);
    await load(); onOk("Sabor removido");
  };
  const addBorder = async () => {
    if (!nb.name.trim()) return onError("Informe o nome da borda");
    const { error } = await supabase.from("borders").insert({ name: nb.name.trim(), price: Number(nb.price.replace(",", ".")) || 0, sort_order: borders.length + 1 });
    if (error) return onError("Erro: " + error.message);
    setNb({ name: "", price: "8" }); await load(); onOk("Borda adicionada");
  };
  const saveBorder = async (b: Border) => {
    const { error } = await supabase.from("borders").update({ name: b.name.trim(), price: Number(b.price) || 0 }).eq("id", b.id);
    if (error) return onError("Erro: " + error.message);
    await load(); onOk("Borda salva");
  };
  const delBorder = async (b: Border) => {
    if (!confirm(`Remover "${b.name}"?`)) return;
    const { error } = await supabase.from("borders").delete().eq("id", b.id);
    if (error) return onError("Erro: " + error.message);
    await load(); onOk("Borda removida");
  };
  return (
    <div className="admin-menu">
      <div className="product-form">
        <h3>Sabores de Pizza ({flavors.length})</h3>
        <div className="form-actions">
          <input value={newFlavor} placeholder="Novo sabor" onChange={(e) => setNewFlavor(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFlavor()} />
          <button className="primary-btn" onClick={addFlavor}><Plus size={16} /> Adicionar</button>
        </div>
        {flavors.map((f) => (
          <div className="menu-item" key={f.id}>
            <div className="menu-item-body"><strong>{f.name}</strong></div>
            <div className="menu-item-actions"><button title="Remover" onClick={() => delFlavor(f)}><Trash2 size={15} /></button></div>
          </div>
        ))}
      </div>
      <div className="product-form">
        <h3>Bordas</h3>
        {borders.map((b, i) => (
          <div className="form-actions" key={b.id}>
            <input value={b.name} onChange={(e) => setBorders(borders.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
            <input type="number" step="0.01" min="0" style={{ maxWidth: 110 }} value={b.price} onChange={(e) => setBorders(borders.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))} />
            <button className="secondary-btn" title="Salvar" onClick={() => saveBorder(b)}><Save size={15} /></button>
            <button className="secondary-btn" title="Remover" onClick={() => delBorder(b)}><Trash2 size={15} /></button>
          </div>
        ))}
        <div className="form-actions">
          <input value={nb.name} placeholder="Nova borda (ex: Borda Chocolate)" onChange={(e) => setNb({ ...nb, name: e.target.value })} />
          <input type="number" step="0.01" min="0" style={{ maxWidth: 110 }} value={nb.price} placeholder="Valor" onChange={(e) => setNb({ ...nb, price: e.target.value })} />
          <button className="primary-btn" onClick={addBorder}><Plus size={16} /> Adicionar</button>
        </div>
      </div>
    </div>
  );
}
