import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, Download, LocateFixed, MapPin, Minus, Plus, ShoppingBag, Sparkles, X, Search, Home, Store, Pizza, CupSoda, UtensilsCrossed, Phone, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { COMBO_FLAVORS, TWO_FLAVORS_LIST, DEFAULT_SETTINGS, dedupeFlavors, fetchBorders, fetchFlavors, type Border, type Flavor, FALLBACK_IMG, deliveryFee, fetchProducts, fetchSettings, money, themeVars, type CartItem, type Product, type SettingsData } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nostra Casa Pizzaria e Lanches | Delivery em Londrina/PR" },
      { name: "description", content: "Pizzas artesanais, combos e entrega rápida em Londrina/PR. Peça pelo site ou WhatsApp (43) 99630-9759." },
      { property: "og:title", content: "Nostra Casa Pizzaria e Lanches" },
      { property: "og:description", content: "Pizzas artesanais, combos e entrega rápida em Londrina/PR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Storefront,
});

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const categoryIcons: Record<string, typeof Truck> = { Todos: UtensilsCrossed, Combos: Sparkles, Pizzas: Pizza, Bebidas: CupSoda };

function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"none" | "combo" | "checkout" | "success">("none");
  const [selected, setSelected] = useState<Product | null>(null);
  const [comboStep, setComboStep] = useState(1);
  const [border, setBorder] = useState("");
  const [flavorList, setFlavorList] = useState<Flavor[]>([]);
  const [borders, setBorders] = useState<Border[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [upsell, setUpsell] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [installOs, setInstallOs] = useState<"android" | "ios">("android");
  useEffect(() => { if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setInstallOs("ios"); }, []);
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [customer, setCustomer] = useState({ name: "", address: "", number: "", type: "Casa", payment: "Dinheiro", change: "", distance: "4" });
  const [notice, setNotice] = useState("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    Promise.all([fetchProducts(true), fetchSettings()])
      .then(([p, s]) => { setProducts(p); setSettings(s); })
      .catch(() => flash("Não foi possível carregar o cardápio"))
      .finally(() => setLoading(false));
    const loadOpts = () => { fetchFlavors().then(setFlavorList).catch(() => {}); fetchBorders().then(setBorders).catch(() => {}); };
    const loadMenu = () => { fetchProducts(true).then(setProducts).catch(() => {}); };
    const loadSettings = () => { fetchSettings().then(setSettings).catch(() => {}); };
    const loadAll = () => { loadOpts(); loadMenu(); loadSettings(); };
    loadOpts();
    const ch = supabase.channel("menu-options")
      .on("postgres_changes", { event: "*", schema: "public", table: "pizza_flavors" }, loadOpts)
      .on("postgres_changes", { event: "*", schema: "public", table: "borders" }, loadOpts)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, loadMenu)
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, loadSettings)
      .subscribe();
    const onVisible = () => { if (document.visibilityState === "visible") loadAll(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", loadAll);
    const poll = window.setInterval(loadAll, 30000);
    const handler = (e: Event) => { e.preventDefault(); setInstallEvent(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", loadAll);
      window.clearInterval(poll);
      void supabase.removeChannel(ch);
    };
  }, []);

  useEffect(() => {
    if (!settings.favicon_url) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = settings.favicon_url;
  }, [settings.favicon_url]);

  function flash(msg: string) { setNotice(msg); setTimeout(() => setNotice(""), 2200); }

  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category)))];
  const activeFlavorList = selected?.combo_flavors_step ? COMBO_FLAVORS : selected?.allow_two_flavors && !selected?.is_combo ? TWO_FLAVORS_LIST : flavorList;
  const flavors = useMemo(() => dedupeFlavors(activeFlavorList).map((f) => f.name), [activeFlavorList]);
  const flavorDesc = useMemo(() => Object.fromEntries(activeFlavorList.map((f) => [f.name, f.description ?? ""])), [activeFlavorList]);
  const comboSteps = useMemo(() => {
    if (!selected) return [] as ("border" | "flavors" | "confirm")[];
    const st: ("border" | "flavors" | "confirm")[] = [];
    if (selected.requires_border && borders.length) st.push("border");
    if (selected.is_combo) st.push("flavors", "confirm");
    else if (selected.allow_two_flavors) st.push("flavors", "confirm");
    else if (selected.combo_flavors_step) st.push("flavors");
    return st;
  }, [selected, borders.length]);
  const curStep = comboSteps[comboStep - 1];
  const borderObj = borders.find((b) => b.name === border);
  const visibleProducts = products.filter((p) =>
    (category === "Todos" || p.category === category) &&
    (!search || `${p.name} ${p.description} ${p.ingredients.join(" ")}`.toLowerCase().includes(search.toLowerCase())));
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const fee = orderType === "pickup" ? 0 : deliveryFee(Number(customer.distance) || 0);
  const total = subtotal + fee;

  const addToCart = (product: Product, details = "") => {
    setCart((items) => {
      const found = items.find((i) => i.id === product.id && i.details === details);
      return found ? items.map((i) => (i === found ? { ...i, quantity: i.quantity + 1 } : i)) : [...items, { ...product, quantity: 1, details }];
    });
    flash("Adicionado ao carrinho");
  };
  const openProduct = (p: Product) => {
    if (p.is_combo || p.allow_two_flavors || p.combo_flavors_step || (p.requires_border && borders.length)) { setSelected(p); setComboStep(1); setSelectedFlavors([]); setBorder(borders[0]?.name ?? ""); setStep("combo"); }
    else addToCart(p);
  };
  const finishCombo = (withDessert: boolean) => {
    if (!selected) return;
    const hasBorder = comboSteps.includes("border");
    const borderPrice = hasBorder ? borderObj?.price ?? 0 : 0;
    const parts = [hasBorder ? border : "", comboSteps.includes("flavors") ? selectedFlavors.join(" + ") : "", selected.is_combo ? "Guaraná 2L" : "", withDessert ? "Broto de Chocolate" : ""].filter(Boolean);
    const details = parts.join(" · ");
    addToCart({ ...selected, price: selected.price + borderPrice + (withDessert ? 10 : 0) }, details);
    setStep("none"); setUpsell(false);
  };
  const locate = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const storeLat = -23.3107, storeLng = -51.1628;
      const dLat = (pos.coords.latitude - storeLat) * 111;
      const dLng = (pos.coords.longitude - storeLng) * 111 * Math.cos((storeLat * Math.PI) / 180);
      const rounded = Math.min(15, Math.max(1, Math.ceil(Math.sqrt(dLat * dLat + dLng * dLng))));
      setCustomer((c) => ({ ...c, distance: String(rounded) }));
      flash(`Distância calculada: ${rounded} km`);
    }, () => flash("Não foi possível obter sua localização. Digite a distância."));
  };
  const sendWhatsApp = () => {
    const lines = cart.map((i) => `• ${i.quantity}x ${i.name}${i.details ? `\n   Detalhes: ${i.details}` : ""}\n   Valor unitário: ${money(i.price)}\n   Valor do item: ${money(i.price * i.quantity)}`).join("\n\n");
    const paymentLabel = customer.payment === "Pix" ? "Pix (maquininha)" : customer.payment === "Dinheiro" ? `Dinheiro${customer.change ? ` (Troco para ${money(Number(customer.change))})` : ""}` : "Cartão (maquininha)";
    const info = orderType === "pickup"
      ? "*Retirada no Balcão*\nAv. Inglaterra, 210 - Londrina/PR"
      : `*Entrega (Delivery)*\nEndereço: ${customer.address}, ${customer.number} - ${customer.type}\nDistância: ${customer.distance} km\nTaxa: ${fee ? money(fee) : "A consultar"}`;
    const msg = `*Novo Pedido - Nostra Casa*\n\n${lines}\n\nSubtotal: ${money(subtotal)}\nEntrega: ${orderType === "pickup" ? "Grátis (retirada)" : fee ? money(fee) : "A consultar"}\n*Total: ${money(total)}*\n\n${info}\n\nPagamento: ${paymentLabel}\n\nCliente: ${customer.name}`;
    window.open(`https://wa.me/5543996309759?text=${encodeURIComponent(msg)}`, "_blank");
  };
  const placeOrder = async () => {
    if (!customer.name) return flash("Preencha seu nome");
    if (orderType === "delivery" && (!customer.address || !customer.number)) return flash("Preencha endereço e número");
    setPlacing(true);
    const { error } = await supabase.from("orders").insert({
      customer_name: customer.name,
      address: orderType === "pickup" ? "Retirada no balcão" : customer.address,
      house_number: orderType === "pickup" ? "-" : customer.number,
      residence_type: orderType === "pickup" ? "Retirada" : customer.type,
      distance_km: orderType === "pickup" ? 0 : Number(customer.distance) || 0,
      delivery_fee: fee, subtotal, total,
      items: cart as any,
      payment_method: customer.payment,
      change_for: customer.payment === "Dinheiro" && customer.change ? Number(customer.change.replace(/[^\d.,]/g, "").replace(",", ".")) || null : null,
      order_type: orderType,
      status: "pending",
    });
    setPlacing(false);
    if (error) return flash("Erro ao registrar pedido. Tente novamente.");
    setStep("success");
  };

  return (
    <div className="app" style={themeVars(settings)}>
      <header className="store-header">
        <div className="cover-banner">
          <img src={settings.cover_image_url || FALLBACK_IMG} alt="Nostra Casa" />
          <div className="cover-overlay" />
        </div>
        <div className="store-header-info">
          <div className="profile-circle"><img src={settings.profile_image_url || FALLBACK_IMG} alt="Logo Nostra Casa" /></div>
          <h1 className="store-name">NOSTRA CASA</h1>
          <p className="store-subtitle">Pizzaria &amp; Lanches</p>
          <div className="store-contact-row">
            <a href="https://wa.me/5543996309759" target="_blank" rel="noreferrer" className="store-whatsapp"><Phone size={14} /> (43) 99630-9759</a>
            <span className="store-hours"><Clock3 size={14} /> Aberto até 03h</span>
          </div>
          <div className="store-header-actions">
            <button className="install-btn install-btn-yellow" onClick={async () => { if (installEvent) { await installEvent.prompt(); setInstallEvent(null); } else { setShowInstall(true); } }}><Download size={16} /> Instalar App</button>
            <a href="https://wa.me/5544997298450" target="_blank" rel="noreferrer" className="creator-link">Falar com criador do site</a>
          </div>
        </div>
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar no cardápio..." />
        </div>
        <div className="category-bar">
          {categories.map((c) => { const Icon = categoryIcons[c] || UtensilsCrossed; return (
            <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}><Icon size={16} /><span>{c}</span></button>
          ); })}
        </div>
      </header>

      <main>
        <section id="menu" className="menu-section">
          <div className="section-heading">
            <div><p className="eyebrow">Escolha o seu momento</p><h2>Cardápio da casa</h2></div>
            <p className="address"><MapPin size={15} /> Avenida Inglaterra, 210<br />Londrina / PR</p>
          </div>
          <div className="product-list">
            {loading && <p className="muted" style={{ textAlign: "center", padding: "40px 0" }}>Carregando cardápio...</p>}
            {!loading && visibleProducts.length === 0 && <p className="muted" style={{ textAlign: "center", padding: "40px 0" }}>Nenhum produto encontrado.</p>}
            {visibleProducts.map((p) => (
              <article className="product-card-h" key={p.id}>
                <div className="product-card-h-img">
                  <img src={p.image_url || FALLBACK_IMG} alt={p.name} />
                  {p.is_combo && <span className="tag">MAIS PEDIDO</span>}
                </div>
                <div className="product-card-h-body">
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  {p.ingredients.length > 0 && <div className="ingredient-tags">{p.ingredients.map((ing, i) => <span key={i}>{ing}</span>)}</div>}
                  <strong className="price">{money(p.price)}</strong>
                </div>
                <button className="add-btn-h" onClick={() => openProduct(p)} aria-label={`Adicionar ${p.name}`}><Plus size={18} /></button>
              </article>
            ))}
          </div>
        </section>
        <section className="whatsapp-banner">
          <div><p className="eyebrow">Sem tempo para escolher?</p><h2>Peça pelo WhatsApp</h2><p>Fale direto com a nossa equipe e receba novidades e promoções.</p></div>
          <a href="https://wa.me/5543996309759" target="_blank" rel="noreferrer" className="whatsapp-btn">Abrir WhatsApp <ArrowRight size={18} /></a>
        </section>
      </main>
      <footer>
        <div className="brand"><div className="brand-mark">NC</div><div><strong>NOSTRA CASA</strong><span>PIZZARIA & LANCHES</span></div></div>
        <p>Feito com carinho em Londrina · (43) 99630-9759 · <Link to="/admin" style={{ color: "inherit" }}>Área do dono</Link></p>
      </footer>
      <button className="cart-fab" onClick={() => setStep("checkout")}><ShoppingBag size={22} /><span>{cart.reduce((s, i) => s + i.quantity, 0)}</span></button>
      {notice && <div className="toast">{notice}</div>}

      {showInstall && (
        <div className="modal-backdrop" onClick={() => setShowInstall(false)}><div className="modal install-modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setShowInstall(false)}><X size={20} /></button>
          <div className="modal-kicker">Instalar App</div>
          <h2>Tenha a Nostra Casa na sua tela inicial</h2>
          {installOs === "ios" ? (
            <ol className="install-steps">
              <li><span className="install-num">1</span><div><strong>Abra no Safari</strong><p>Toque no botão <b>Compartilhar</b> (quadrado com seta ↑) na barra inferior.</p></div></li>
              <li><span className="install-num">2</span><div><strong>Adicionar à Tela de Início</strong><p>Role a lista e toque em <b>"Adicionar à Tela de Início"</b>.</p></div></li>
              <li><span className="install-num">3</span><div><strong>Confirme</strong><p>Toque em <b>"Adicionar"</b> no canto superior direito.</p></div></li>
            </ol>
          ) : (
            <ol className="install-steps">
              <li><span className="install-num">1</span><div><strong>Abra o menu do Chrome</strong><p>Toque nos <b>três pontinhos ⋮</b> no canto superior direito.</p></div></li>
              <li><span className="install-num">2</span><div><strong>Instalar aplicativo</strong><p>Toque em <b>"Instalar aplicativo"</b> ou <b>"Adicionar à tela inicial"</b>.</p></div></li>
              <li><span className="install-num">3</span><div><strong>Confirme</strong><p>Toque em <b>"Instalar"</b>. O ícone da Nostra Casa aparecerá na sua tela.</p></div></li>
            </ol>
          )}
          <button className="secondary-btn full" onClick={() => setShowInstall(false)}>Entendi</button>
        </div></div>
      )}

      {step === "combo" && selected && (
        <div className="modal-backdrop"><div className="modal combo-modal">
          <button className="close-btn" onClick={() => setStep("none")}><X size={20} /></button>
          <div className="modal-kicker">{selected.is_combo ? "Monte seu combo" : "Monte sua pizza"} · Etapa {comboStep} de {comboSteps.length}</div>
          <h2>{curStep === "border" ? "Escolha a sua borda" : curStep === "flavors" ? "Escolha os sabores" : "Tudo certo por aqui?"}</h2>
          {curStep === "border" && <div className="choice-list">{borders.map((b) => <button className={border === b.name ? "choice selected" : "choice"} key={b.id} onClick={() => setBorder(b.name)}>{b.name}<span>{b.price ? `+ ${money(b.price)}` : "Grátis"}</span></button>)}</div>}
          {curStep === "flavors" && <><p className="muted">Selecione até 2 sabores para a sua pizza.</p><div className="flavor-grid">{flavors.map((f) => <button key={f} className={selectedFlavors.includes(f) ? "flavor selected" : "flavor"} onClick={() => setSelectedFlavors((c) => { if (c.includes(f)) return c.filter((x) => x !== f); if (c.length >= 2) { flash("Máximo de 2 sabores. Desmarque um antes."); return c; } return [...c, f]; })}>{f}{flavorDesc[f] && <small style={{ display: "block", opacity: 0.7, fontWeight: 400, fontSize: 11, marginTop: 2 }}>{flavorDesc[f]}</small>}</button>)}</div></>}
          {curStep === "confirm" && <div className="confirmation"><div className="confirm-icon">✓</div><p>{selected.is_combo && <><strong>Guaraná 2L confirmado.</strong><br /></>}Sua {selected.is_combo ? "combinação" : "pizza"} será preparada{comboSteps.includes("border") ? ` com ${border.toLowerCase()}` : ""} com {selectedFlavors.join(" + ")}.</p></div>}
          <button className="primary-btn full" disabled={(curStep === "flavors" && selectedFlavors.length === 0) || (curStep === "border" && !border)} onClick={() => (comboStep < comboSteps.length ? setComboStep(comboStep + 1) : selected?.is_combo || selected?.allow_two_flavors ? setUpsell(true) : finishCombo(false))}>{comboStep < comboSteps.length || curStep === "flavors" ? "Continuar" : "Adicionar ao carrinho"} <ArrowRight size={18} /></button>
        </div></div>
      )}
      {upsell && (
        <div className="modal-backdrop"><div className="modal upsell">
          <div className="dessert-art">●</div>
          <div className="modal-kicker">Um toque doce?</div>
          <h2>Gostaria de adicionar um Broto de Chocolate por R$ 10,00?</h2>
          <div className="upsell-actions">
            <button className="secondary-btn" onClick={() => finishCombo(false)}>Não, obrigado</button>
            <button className="primary-btn" onClick={() => finishCombo(true)}>Sim, adicionar</button>
          </div>
        </div></div>
      )}

      {step === "checkout" && (
        <div className="modal-backdrop"><div className="modal checkout">
          <button className="close-btn" onClick={() => setStep("none")}><X size={20} /></button>
          <div className="modal-kicker">Seu pedido</div>
          <h2>{orderType === "pickup" ? "Retirada no balcão" : "Quase na sua casa."}</h2>
          {cart.length === 0 ? <div className="empty"><ShoppingBag size={34} /><p>Seu carrinho ainda está vazio.</p><button className="primary-btn" onClick={() => setStep("none")}>Ver cardápio</button></div> : (
            <>
              <div className="cart-lines">
                {cart.map((item) => <div className="cart-line" key={`${item.id}-${item.details}`}>
                  <div><strong>{item.quantity}x {item.name}</strong><small>{item.details}</small></div>
                  <div className="line-actions">
                    <button onClick={() => setCart((c) => c.map((e) => (e === item ? { ...e, quantity: e.quantity - 1 } : e)).filter((e) => e.quantity > 0))}><Minus size={14} /></button>
                    <span>{money(item.price * item.quantity)}</span>
                    <button onClick={() => addToCart(item, item.details)}><Plus size={14} /></button>
                  </div>
                </div>)}
              </div>
              <div className="order-type-toggle">
                <button className={orderType === "delivery" ? "active" : ""} onClick={() => setOrderType("delivery")}><Home size={18} /> Receber em Casa</button>
                <button className={orderType === "pickup" ? "active" : ""} onClick={() => setOrderType("pickup")}><Store size={18} /> Retirar no Balcão</button>
              </div>
              <div className="form-grid">
                <label>Nome completo<input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Como podemos te chamar?" /></label>
                {orderType === "delivery" && <>
                  <label>Endereço<input value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder="Rua, avenida..." /></label>
                  <label>Número<input value={customer.number} onChange={(e) => setCustomer({ ...customer, number: e.target.value })} placeholder="210" /></label>
                  <label>Tipo<select value={customer.type} onChange={(e) => setCustomer({ ...customer, type: e.target.value })}><option>Casa</option><option>Apartamento</option></select></label>
                  <label className="distance-field">Distância estimada (km)<div className="input-action"><input value={customer.distance} onChange={(e) => setCustomer({ ...customer, distance: e.target.value })} /><button onClick={locate}><LocateFixed size={17} /></button></div></label>
                </>}
                {orderType === "pickup" && <p className="payment-info">Retirada na loja: Avenida Inglaterra, 210 - Londrina/PR. Sem taxa de entrega.</p>}
                <label>Pagamento<select value={customer.payment} onChange={(e) => setCustomer({ ...customer, payment: e.target.value, change: "" })}><option>Dinheiro</option><option>Cartão</option><option>Pix</option></select></label>
                {customer.payment === "Dinheiro" && <label>Troco para<input value={customer.change} onChange={(e) => setCustomer({ ...customer, change: e.target.value })} placeholder="100" /></label>}
                {customer.payment === "Cartão" && <p className="payment-info">Pagamento na maquininha {orderType === "pickup" ? "no caixa da loja" : "na entrega"}.</p>}
                {customer.payment === "Pix" && <p className="payment-info">Pix feito na hora {orderType === "pickup" ? "no caixa da loja" : "na maquininha do entregador"}.</p>}
              </div>
              <div className="total-box">
                <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                <div><span>{orderType === "pickup" ? "Entrega" : `Entrega · ${customer.distance || 0} km`}</span><strong>{orderType === "pickup" ? "Grátis" : fee ? money(fee) : "A consultar"}</strong></div>
                <div className="total"><span>Total</span><strong>{money(total)}</strong></div>
              </div>
              <button className="primary-btn full" disabled={placing} onClick={placeOrder}>{placing ? "Enviando..." : "Finalizar pedido"} <ArrowRight size={18} /></button>
            </>
          )}
        </div></div>
      )}

      {step === "success" && (
        <div className="modal-backdrop"><div className="modal success">
          <div className="success-icon">✓</div>
          <div className="modal-kicker">Pedido recebido</div>
          <h2>{orderType === "pickup" ? "Pronto para retirada." : "Agora é só aguardar."}</h2>
          <p>Seu pedido foi registrado. Envie os detalhes pelo WhatsApp para confirmar com a nossa equipe.</p>
          <button className="primary-btn full" onClick={() => { sendWhatsApp(); setCart([]); setStep("none"); }}>Enviar no WhatsApp <ArrowRight size={18} /></button>
        </div></div>
      )}
    </div>
  );
}
