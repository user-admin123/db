import { Category, MenuItem, RestaurantInfo } from "./types";

const CATEGORIES_KEY = "qrmenu_categories";
const ITEMS_KEY = "qrmenu_items";
const RESTAURANT_KEY = "qrmenu_restaurant";
const AUTH_KEY = "qrmenu_auth";

// Default owner credentials
const DEFAULT_OWNER = { email: "admin@restaurant.com", password: "admin123" };

const defaultRestaurant: RestaurantInfo = {
  name: "La Maison",
  tagline: "Fine dining, reimagined",
  logo_url: "",
};

const defaultCategories: Category[] = [
  { id: "cat-1", name: "Starters", order_index: 0, created_at: new Date().toISOString() },
  { id: "cat-2", name: "Main Course", order_index: 1, created_at: new Date().toISOString() },
  { id: "cat-3", name: "Desserts", order_index: 2, created_at: new Date().toISOString() },
  { id: "cat-4", name: "Drinks", order_index: 3, created_at: new Date().toISOString() },
];

const defaultItems: MenuItem[] = [
  { id: "item-1", name: "Bruschetta", description: "Toasted bread topped with fresh tomatoes, basil, and garlic drizzle.", price: 8.5, available: true, image_url: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=300&fit=crop", category_id: "cat-1", item_type: "veg", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "item-2", name: "Garlic Prawns", description: "Sautéed prawns in a rich garlic butter sauce with herbs.", price: 12.0, available: true, image_url: "https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=400&h=300&fit=crop", category_id: "cat-1", item_type: "nonveg", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "item-3", name: "Grilled Salmon", description: "Atlantic salmon fillet grilled to perfection with lemon herb butter.", price: 24.0, available: true, image_url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop", category_id: "cat-2", item_type: "nonveg", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "item-4", name: "Wagyu Steak", description: "Premium wagyu beef steak with truffle mashed potatoes and red wine jus.", price: 42.0, available: true, image_url: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop", category_id: "cat-2", item_type: "nonveg", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "item-5", name: "Mushroom Risotto", description: "Creamy arborio rice with wild mushrooms and parmesan.", price: 18.0, available: false, image_url: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop", category_id: "cat-2", item_type: "veg", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "item-6", name: "Tiramisu", description: "Classic Italian dessert with mascarpone, espresso, and cocoa.", price: 10.0, available: true, image_url: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop", category_id: "cat-3", item_type: "veg", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "item-7", name: "Crème Brûlée", description: "Vanilla custard with a caramelized sugar crust.", price: 9.0, available: true, image_url: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&h=300&fit=crop", category_id: "cat-3", item_type: "veg", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "item-8", name: "Espresso Martini", description: "Vodka, coffee liqueur, and fresh espresso shaken over ice.", price: 14.0, available: true, image_url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop", category_id: "cat-4", item_type: "veg", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "item-9", name: "Fresh Lemonade", description: "Hand-squeezed lemons with mint and a touch of honey.", price: 6.0, available: true, image_url: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop", category_id: "cat-4", item_type: "veg", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

function getOrInit<T>(key: string, defaults: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  localStorage.setItem(key, JSON.stringify(defaults));
  return defaults;
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Restaurant
export function getRestaurant(): RestaurantInfo {
  return getOrInit(RESTAURANT_KEY, defaultRestaurant);
}
export function saveRestaurant(info: RestaurantInfo) {
  save(RESTAURANT_KEY, info);
}

// Categories
export function getCategories(): Category[] {
  return getOrInit(CATEGORIES_KEY, defaultCategories).sort((a, b) => a.order_index - b.order_index);
}
export function saveCategories(cats: Category[]) {
  save(CATEGORIES_KEY, cats);
}

// Menu Items
export function getMenuItems(): MenuItem[] {
  return getOrInit(ITEMS_KEY, defaultItems);
}
export function saveMenuItems(items: MenuItem[]) {
  save(ITEMS_KEY, items);
}

// Auth
export function login(email: string, password: string): boolean {
  if (email === DEFAULT_OWNER.email && password === DEFAULT_OWNER.password) {
    localStorage.setItem(AUTH_KEY, "true");
    return true;
  }
  return false;
}
export function logout() {
  localStorage.removeItem(AUTH_KEY);
}
export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === "true";
}
