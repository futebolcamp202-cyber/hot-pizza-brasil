import { describe, expect, test } from "vitest";
import { TRAD_BORDER_OPTIONS, buildSteps, itemPrice, toggleChoice, whatsappLink, type StepFlags } from "./steps";

const base: StepFlags = { is_combo: false, requires_border: false, trad_borders_step: false, allow_two_flavors: false, combo_flavors_step: false, savory_flavors_step: false, pastel_flavors_step: false };
const db = { borders: [{ name: "Borda Cheddar", price: 8 }], pizzaFlavors: [] };

describe("preço com borda e broto", () => {
  test("borda Catupiry da massa tradicional soma R$ 15 ao preço", () => {
    const catupiry = TRAD_BORDER_OPTIONS.find((o) => o.name === "Massa Tradicional + Borda Catupiry")!;
    expect(itemPrice(25, [catupiry], false, 10)).toBe(40);
  });
  test("borda sem recheio não soma nada", () => {
    const sem = TRAD_BORDER_OPTIONS.find((o) => o.name === "Massa Tradicional + Borda sem recheios")!;
    expect(itemPrice(25, [sem], false, 10)).toBe(25);
  });
  test("broto usa o valor configurado no painel", () => {
    expect(itemPrice(25, [], true, 12.5)).toBe(37.5);
  });
});

describe("opções removidas no painel", () => {
  test("sabor removido do produto não aparece para o cliente", () => {
    const steps = buildSteps({ ...base, pastel_flavors_step: true, hidden_options: { pastel_flavors: ["Nutella"] } }, db);
    const names = steps[0].options.map((o) => o.name);
    expect(names).not.toContain("Nutella");
    expect(names).toContain("Carne");
  });
  test("etapa com todas as opções removidas é pulada", () => {
    const steps = buildSteps({ ...base, requires_border: true, hidden_options: { border: ["Borda Cheddar"] } }, db);
    expect(steps).toHaveLength(0);
  });
});

describe("limites de escolha", () => {
  test("sabores: no máximo 2", () => {
    expect(toggleChoice(["A", "B"], "C", 2).blocked).toBe(true);
  });
  test("pastel: só 1 sabor, trocar substitui", () => {
    expect(toggleChoice(["Carne"], "Queijo", 1).next).toEqual(["Queijo"]);
  });
});

test("link do WhatsApp adiciona o 55 do Brasil", () => {
  expect(whatsappLink("(43) 99630-9759")).toBe("https://wa.me/5543996309759");
});
