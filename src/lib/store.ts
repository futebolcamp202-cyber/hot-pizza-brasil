import { supabase } from "@/integrations/supabase/client";
import type { HiddenOptions } from "@/lib/steps";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string;
  is_combo: boolean;
  ingredients: string[];
  extras: string[];
  available: boolean;
  sort_order: number;
  requires_border: boolean;
  allow_two_flavors: boolean;
  combo_flavors_step: boolean;
  savory_flavors_step: boolean;
  trad_borders_step: boolean;
  pastel_flavors_step: boolean;
  price_label: string;
  hidden_options: HiddenOptions;
};
export type Flavor = { id: string; name: string; description?: string };
export type Border = { id: string; name: string; price: number; sort_order: number };
export type CartItem = Product & { quantity: number; details?: string };
export type SettingsData = {
  id: string;
  store_name: string;
  whatsapp_number: string;
  opening_hours: string;
  broto_price: number;
  primary_color: string;
  background_color: string;
  button_color: string;
  receipt_header: string;
  favicon_url: string | null;
  cover_image_url: string | null;
  profile_image_url: string | null;
};
export type OrderRow = {
  id: string; customer_name: string; address: string; house_number: string; residence_type: string;
  distance_km: number; delivery_fee: number; subtotal: number; total: number; items: CartItem[];
  payment_method: string; change_for: number | null; status: string; created_at: string; order_type: string;
};

export const DEFAULT_SETTINGS: SettingsData = {
  id: "",
  store_name: "PIZZA HOT",
  whatsapp_number: "(43) 99630-9759",
  opening_hours: "Aberto até 03h",
  broto_price: 10,
  primary_color: "#f3b91b",
  background_color: "#090909",
  button_color: "#d71920",
  receipt_header: "PIZZA HOT\nAvenida Inglaterra, 210 - Londrina/PR\nWhatsApp: (43) 99630-9759",
  favicon_url: null,
  cover_image_url: null,
  profile_image_url: null,
};
export const FALLBACK_IMG =
  "https://images.pexels.com/photos/28945103/pexels-photo-28945103.jpeg?auto=compress&cs=tinysrgb&h=650&w=940";

export function money(value: number) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
export function deliveryFee(distance: number) {
  const km = Math.ceil(distance);
  if (km <= 0) return 0;
  if (km <= 4) return 5;
  if (km <= 15) return km + 1;
  return 0;
}
export function normalizeProduct(p: any): Product {
  return { ...p, requires_border: !!p.requires_border, allow_two_flavors: !!p.allow_two_flavors, combo_flavors_step: !!p.combo_flavors_step, savory_flavors_step: !!p.savory_flavors_step, trad_borders_step: !!p.trad_borders_step, pastel_flavors_step: !!p.pastel_flavors_step, price_label: p.price_label ?? "", hidden_options: (p.hidden_options && typeof p.hidden_options === "object" ? p.hidden_options : {}) as HiddenOptions, price: Number(p.price), ingredients: p.ingredients ?? [], extras: p.extras ?? [] };
}

export async function fetchProducts(onlyAvailable: boolean) {
  let q = supabase.from("products").select("*").order("sort_order").order("created_at");
  if (onlyAvailable) q = q.eq("available", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(normalizeProduct);
}
export async function fetchSettings(): Promise<SettingsData> {
  const { data } = await supabase.from("store_settings").select("*").limit(1).maybeSingle();
  return data ? ({ ...DEFAULT_SETTINGS, ...data, broto_price: Number(data.broto_price ?? 10) } as SettingsData) : DEFAULT_SETTINGS;
}

/** Uploads an image file and returns a long-lived URL for it. */
export async function uploadImage(file: File, folder: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage.from("images").createSignedUrl(path, 60 * 60 * 24 * 365 * 20);
  if (signErr || !data) throw signErr ?? new Error("Falha ao gerar link da imagem");
  return data.signedUrl;
}

export function themeVars(s: SettingsData) {
  return { "--primary": s.primary_color, "--button": s.button_color, "--page": s.background_color } as React.CSSProperties;
}

export const normName = (n: string) => n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
export function dedupeFlavors<T extends { name: string }>(list: T[]) {
  const seen = new Set<string>();
  return list.filter((f) => { const k = normName(f.name); if (!k || seen.has(k)) return false; seen.add(k); return true; });
}
export async function fetchFlavors(): Promise<Flavor[]> {
  const { data, error } = await supabase.from("pizza_flavors").select("id,name,description").order("name");
  if (error) throw error;
  return dedupeFlavors(data ?? []);
}
export async function fetchBorders(): Promise<Border[]> {
  const { data, error } = await supabase.from("borders").select("*").order("sort_order").order("created_at");
  if (error) throw error;
  return (data ?? []).map((b: any) => ({ id: b.id, name: b.name, price: Number(b.price), sort_order: b.sort_order }));
}
