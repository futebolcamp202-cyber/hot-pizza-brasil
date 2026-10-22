/** Etapas de escolha dos produtos (bordas, sabores, pastéis) — lógica pura, sem acesso ao banco. */

export type OptionItem = { name: string; description?: string; price: number };
export type StepKey = "border" | "trad_border" | "combo_flavors" | "two_flavors" | "pizza_flavors" | "savory_flavors" | "pastel_flavors";
export type StepDef = { key: StepKey; title: string; subtitle: string; label: string; max: number; options: OptionItem[] };
export type HiddenOptions = Partial<Record<StepKey, string[]>>;

export type StepFlags = {
  is_combo: boolean;
  requires_border: boolean;
  trad_borders_step: boolean;
  allow_two_flavors: boolean;
  combo_flavors_step: boolean;
  savory_flavors_step: boolean;
  pastel_flavors_step: boolean;
  hidden_options?: HiddenOptions;
};

const flavors = (list: [string, string?][]): OptionItem[] => list.map(([name, description]) => ({ name, description: description ?? "", price: 0 }));

/** Etapa "Sabores do Combo (Até 2 sabores)". */
export const COMBO_FLAVOR_OPTIONS = flavors([
  ["2 Queijos", "Molho de tomate, mussarela, provolone e orégano"],
  ["Bacon", "Molho de tomate, mussarela, bacon e orégano"],
  ["Alho Crocante", "Molho de tomate, mussarela, alho frito e orégano"],
  ["Calabresa Acebolada", "Molho de tomate, mussarela, calabresa, cebola e orégano"],
  ["Calabresa sem Cebola", "Molho de tomate, mussarela, calabresa e orégano"],
  ["Lombo Catupiry", "Molho de tomate, mussarela, lombo fatiado, catupiry e orégano"],
  ["Lombo com Cheddar", "Molho de tomate, mussarela, lombo fatiado, cheddar e orégano"],
  ["Milho com Bacon", "Molho de tomate, mussarela, milho, bacon e orégano"],
  ["Marguerita", "Molho de tomate, mussarela, rodelas de tomate e orégano"],
  ["Mussarela", "Molho de tomate, mussarela e orégano"],
  ["Napolitana", "Molho de tomate, presunto, tomate, mussarela e orégano"],
  ["Palmito", "Molho de tomate, mussarela, palmito, catupiry e orégano"],
  ["Frango com Cheddar", "Molho de tomate, frango, cheddar, mussarela e orégano"],
  ["Frango com Catupiry", "Molho de tomate, frango, requeijão tipo catupiry, mussarela e orégano"],
]);

/** Etapa "Ativar etapa de escolha de até 2 sabores neste produto". */
export const TWO_FLAVOR_OPTIONS = flavors(
  ["2 Queijos","Alho Crocante","Bacon","Calabresa Sem Cebola","Calabresa Acebolada","Lombo com Catupiry","Lombo com Cheddar","Milho com Bacon","Marguerita","Mussarela","Napolitana","Palmito","Frango Catupiry","Frango com Cheddar","Atum","Atum Acebolado","Carbonara","Gaúcha","Lombo e Bacon","Mexicana","Paulista","Portuguesa","Calabresa Especial","Lombo Especial","4 Queijos","Calabresa Deliciosa","Vegetariana","5 Queijos"].map((n) => [n] as [string]),
);

/** Etapa "Sabores Salgadas". */
export const SAVORY_FLAVOR_OPTIONS = flavors([
  ["3 Queijos", "Muçarela, Catupiry e provolone"],
  ["4 Carnes", "Muçarela, lombo, presunto, bacon e calabresa"],
  ["5 Queijos", "Muçarela, cheddar, Catupiry, gorgonzola e provolone"],
  ["A Moda Pizzaiolo", "Muçarela, carne moída à bolonhesa, milho, parmesão, catupiry e batata palha"],
  ["Abobrinha", "Muçarela, cream cheese, abobrinha, alho frito, parmesão e tomate cereja"],
  ["Alho", "Muçarela, alho frito, parmesão e tomate"],
  ["Alho Poró", "Muçarela, alho poró, cream cheese e tomate seco"],
  ["Aliche", "Muçarela, aliche, cebola, tomate e parmesão"],
  ["Bacon", "Muçarela, bacon, tomate e ovos"],
  ["Baiana", "Muçarela, calabresa moída, pimenta, ovos e cebola"],
  ["Dogão", "Muçarela, salsicha, purê de batata, milho e batata palha"],
  ["Escarola", "Muçarela, escarola, bacon, cebola e parmesão"],
  ["Lisboaeta", "Muçarela, tomate seco, rúcula, alho frito e muçarela de búfala"],
  ["Milho", "Muçarela, Catupiry, milho e tomates"],
  ["Banana", "Banana, açúcar e canela"],
  ["Banana Caramelizada", "Bananas com chocolate branco"],
  ["Brigadeiro", "Brigadeiro e granulado"],
  ["Churros", "Doce de leite, açúcar e canela"],
  ["Confeti", "Chocolate ao leite e confetes"],
  ["Paçoquita", "Brigadeiro de paçoca coberto com paçoca"],
]);

/** Etapa "Sabor Pastéis". */
export const PASTEL_FLAVOR_OPTIONS = flavors([
  ["Brócolis", "Brócolis, muçarela, bacon, orégano e alho frito"],
  ["Carne"], ["Carne Seca"], ["Carne, Presunto e Queijo"], ["Frango Catupiry"],
  ["Milho", "Milho, muçarela, Catupiry, orégano e tomate"],
  ["Pizza"], ["Queijo"], ["Brigadeiro"], ["Brigadeiro Branco"], ["Nutella"], ["Romeu e Julieta"],
]);

/** Etapa "Bordas Massas Tradicionais" (valor soma no preço do produto). */
export const TRAD_BORDER_OPTIONS: OptionItem[] = ([
  ["Massa Tradicional + Borda Catupiry", 15],
  ["Massa Tradicional + Borda calabresa", 15],
  ["Massa Tradicional + Borda cheddar", 15],
  ["Massa Tradicional + Borda muçarela", 15],
  ["Massa Tradicional + Borda sem recheios", 0],
  ["Massa Tradicional + Borda vulcão Catupiry", 15],
  ["Massa Tradicional + Borda vulcão cheddar", 15],
  ["Massa Tradicional + Borda vulcão muçarela", 15],
  ["Massa Tradicional + Borda Catupiry scala", 15],
  ["Massa Tradicional + Borda Cheddar scala", 15],
  ["Massa Tradicional + Borda de calabresa", 15],
  ["Massa Tradicional + Borda de muçarela", 15],
  ["Massa Tradicional + Borda Tradicional sem borda", 0],
] as [string, number][]).map(([name, price]) => ({ name, price }));

/** Lista completa de opções de cada etapa (antes de remover as escondidas no produto). */
export function allStepOptions(key: StepKey, db: { borders: OptionItem[]; pizzaFlavors: OptionItem[] }): OptionItem[] {
  switch (key) {
    case "border": return db.borders;
    case "trad_border": return TRAD_BORDER_OPTIONS;
    case "combo_flavors": return COMBO_FLAVOR_OPTIONS;
    case "two_flavors": return TWO_FLAVOR_OPTIONS;
    case "pizza_flavors": return db.pizzaFlavors;
    case "savory_flavors": return SAVORY_FLAVOR_OPTIONS;
    case "pastel_flavors": return PASTEL_FLAVOR_OPTIONS;
  }
}

const META: Record<StepKey, Omit<StepDef, "key" | "options">> = {
  border: { title: "Escolha a sua borda", subtitle: "Selecione uma opção.", label: "", max: 1 },
  trad_border: { title: "Bordas Massas Tradicionais", subtitle: "Selecione uma opção.", label: "", max: 1 },
  combo_flavors: { title: "Escolha os sabores", subtitle: "Selecione até 2 sabores para a sua pizza.", label: "Sabores", max: 2 },
  two_flavors: { title: "Escolha os sabores", subtitle: "Selecione até 2 sabores para a sua pizza.", label: "Sabores", max: 2 },
  pizza_flavors: { title: "Escolha os sabores", subtitle: "Selecione até 2 sabores para a sua pizza.", label: "Sabores", max: 2 },
  savory_flavors: { title: "Sabores Salgadas", subtitle: "Selecione até 2 sabores para a sua pizza.", label: "Sabores", max: 2 },
  pastel_flavors: { title: "Sabor do Pastel", subtitle: "Selecione o sabor do seu pastel.", label: "Sabor", max: 1 },
};

/** Quais etapas um produto tem, na ordem em que o cliente passa por elas. */
export function stepKeysFor(p: StepFlags): StepKey[] {
  const keys: StepKey[] = [];
  if (p.requires_border) keys.push("border");
  if (p.trad_borders_step) keys.push("trad_border");
  if (p.combo_flavors_step) keys.push("combo_flavors");
  if (p.allow_two_flavors) keys.push("two_flavors");
  if (p.is_combo && !p.combo_flavors_step && !p.allow_two_flavors) keys.push("pizza_flavors");
  if (p.savory_flavors_step) keys.push("savory_flavors");
  if (p.pastel_flavors_step) keys.push("pastel_flavors");
  return keys;
}

/** Opções que o cliente vê numa etapa: todas menos as removidas no painel para este produto. */
export function visibleOptions(p: StepFlags, key: StepKey, all: OptionItem[]): OptionItem[] {
  const hidden = new Set(p.hidden_options?.[key] ?? []);
  return all.filter((o) => !hidden.has(o.name));
}

/** Etapas do produto já com as opções filtradas; etapas que ficaram sem opções são puladas. */
export function buildSteps(p: StepFlags, db: { borders: OptionItem[]; pizzaFlavors: OptionItem[] }): StepDef[] {
  return stepKeysFor(p)
    .map((key) => ({ key, ...META[key], options: visibleOptions(p, key, allStepOptions(key, db)) }))
    .filter((s) => s.options.length > 0);
}

/** Preço final do item: preço do produto + valores das opções escolhidas + broto (se aceito). */
export function itemPrice(basePrice: number, chosen: OptionItem[], withDessert: boolean, brotoPrice: number) {
  const extras = chosen.reduce((s, o) => s + (Number(o.price) || 0), 0);
  return Math.round((Number(basePrice) + extras + (withDessert ? Number(brotoPrice) || 0 : 0)) * 100) / 100;
}

/** Alterna uma escolha respeitando o máximo da etapa (1 = troca a escolha). */
export function toggleChoice(current: string[], name: string, max: number): { next: string[]; blocked: boolean } {
  if (current.includes(name)) return { next: current.filter((x) => x !== name), blocked: false };
  if (max === 1) return { next: [name], blocked: false };
  if (current.length >= max) return { next: current, blocked: true };
  return { next: [...current, name], blocked: false };
}

/** Categorias do cardápio, na ordem em que aparecem na loja. */
export const MENU_CATEGORIES = [
  "COMBO LANCHE", "Pizzas salgadas", "Pizzas doce", "Pastéis doces e salgados", "Salgados de festa", "Delicioso churros",
  "Lanches linha Smash", "Lanches linha Premium", "Lanches econômica", "Hot dog e misto", "Porções", "Bebidas", "Sucos naturais", "Bebidas alcoólica",
];

/** Link do WhatsApp a partir do número digitado no painel, ex.: "(43) 99630-9759". */
export function whatsappLink(number: string, text?: string) {
  let digits = (number || "").replace(/\D/g, "");
  if (digits.length <= 11) digits = `55${digits}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
