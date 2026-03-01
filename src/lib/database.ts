import { supabase } from "./supabase";
import { Category, MenuItem, RestaurantInfo } from "./types";
import {
  getCategories as getLocalCategories,
  getMenuItems as getLocalItems,
  getRestaurant as getLocalRestaurant,
  saveCategories as saveLocalCategories,
  saveMenuItems as saveLocalItems,
  saveRestaurant as saveLocalRestaurant,
} from "./store";

// ---------- Fetch helpers (Supabase → localStorage fallback) ----------

export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from("categorie")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) return data as Category[];
  } catch {
    // Supabase unavailable – fall through
  }
  return getLocalCategories();
}

export async function fetchMenuItems(): Promise<MenuItem[]> {
  try {
    const { data, error } = await supabase.from("menu_items").select("*");

    if (error) throw error;
    if (data && data.length > 0) return data as MenuItem[];
  } catch {
    // Supabase unavailable – fall through
  }
  return getLocalItems();
}

export async function fetchRestaurant(): Promise<RestaurantInfo> {
  try {
    const { data, error } = await supabase
      .from("restaurant")
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (data) return data as RestaurantInfo;
  } catch {
    // Supabase unavailable – fall through
  }
  return getLocalRestaurant();
}

// ---------- Save helpers (Supabase + localStorage mirror) ----------

export async function saveCategories(cats: Category[]): Promise<void> {
  // Always persist locally as backup
  saveLocalCategories(cats);

  try {
    const { error } = await supabase.from("categories").upsert(cats, { onConflict: "id" });
    if (error) throw error;
  } catch {
    // Supabase unavailable – localStorage already saved
  }
}

export async function saveMenuItems(items: MenuItem[]): Promise<void> {
  saveLocalItems(items);

  try {
    const { error } = await supabase.from("menu_items").upsert(items, { onConflict: "id" });
    if (error) throw error;
  } catch {
    // Supabase unavailable – localStorage already saved
  }
}

export async function saveRestaurant(info: RestaurantInfo): Promise<void> {
  saveLocalRestaurant(info);

  try {
    const { error } = await supabase.from("restaurant").upsert(info);
    if (error) throw error;
  } catch {
    // Supabase unavailable – localStorage already saved
  }
}

// ---------- Delete helpers ----------

export async function deleteCategory(id: string): Promise<void> {
  try {
    await supabase.from("categories").delete().eq("id", id);
    await supabase.from("menu_items").delete().eq("category_id", id);
  } catch {
    // Supabase unavailable – handled locally
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  try {
    await supabase.from("menu_items").delete().eq("id", id);
  } catch {
    // Supabase unavailable – handled locally
  }
}

// ---------- Batch save (single API-ready call) ----------

export async function saveAllChanges(
  categories: Category[],
  items: MenuItem[],
  restaurant: RestaurantInfo
): Promise<boolean> {
  // Always save locally first
  saveLocalCategories(categories);
  saveLocalItems(items);
  saveLocalRestaurant(restaurant);

  try {
    const [catRes, itemRes, restRes] = await Promise.all([
      supabase.from("categories").upsert(categories, { onConflict: "id" }),
      supabase.from("menu_items").upsert(items, { onConflict: "id" }),
      supabase.from("restaurant").upsert(restaurant),
    ]);

    if (catRes.error || itemRes.error || restRes.error) throw new Error("Supabase save failed");
    return true;
  } catch {
    // Data saved locally – will sync when Supabase is available
    return false;
  }
}
