import { useState, useCallback, useEffect } from "react";
import { Category, MenuItem, RestaurantInfo } from "@/lib/types";
import {
  fetchCategories,
  fetchMenuItems,
  fetchRestaurant,
  saveAllChanges as dbSaveAll,
} from "@/lib/database";
import {
  getCategories,
  getMenuItems,
  getRestaurant,
  isAuthenticated,
  login as doLogin,
  logout as doLogout,
} from "@/lib/store";

export function useMenuData() {
  // Initialize with localStorage for instant render, then async-fetch
  const [categories, setCategories] = useState<Category[]>(getCategories);
  const [items, setItems] = useState<MenuItem[]>(getMenuItems);
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(getRestaurant);
  const [authed, setAuthed] = useState(isAuthenticated);
  const [loading, setLoading] = useState(true);

  // On mount, try fetching from Supabase (falls back to localStorage automatically)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [cats, menuItems, rest] = await Promise.all([
          fetchCategories(),
          fetchMenuItems(),
          fetchRestaurant(),
        ]);
        if (!cancelled) {
          setCategories(cats.sort((a, b) => a.order_index - b.order_index));
          setItems(menuItems);
          setRestaurant(rest);
        }
      } catch {
        // Already showing localStorage data
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const refresh = useCallback(async () => {
    const [cats, menuItems, rest] = await Promise.all([
      fetchCategories(),
      fetchMenuItems(),
      fetchRestaurant(),
    ]);
    setCategories(cats.sort((a, b) => a.order_index - b.order_index));
    setItems(menuItems);
    setRestaurant(rest);
  }, []);

  const updateCategories = useCallback((cats: Category[]) => {
    setCategories([...cats].sort((a, b) => a.order_index - b.order_index));
  }, []);

  const updateItems = useCallback((newItems: MenuItem[]) => {
    setItems(newItems);
  }, []);

  const updateRestaurant = useCallback((info: RestaurantInfo) => {
    setRestaurant(info);
  }, []);

  // Single batch save — saves to localStorage + attempts Supabase
  const saveAll = useCallback(async (cats: Category[], menuItems: MenuItem[], rest: RestaurantInfo) => {
    const success = await dbSaveAll(cats, menuItems, rest);
    setCategories([...cats].sort((a, b) => a.order_index - b.order_index));
    setItems(menuItems);
    setRestaurant(rest);
    return success;
  }, []);

  const login = useCallback((email: string, password: string) => {
    const ok = doLogin(email, password);
    if (ok) setAuthed(true);
    return ok;
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setAuthed(false);
  }, []);

  return {
    categories, items, restaurant, authed, loading,
    login, logout,
    updateCategories, updateItems, updateRestaurant,
    saveAll, refresh,
  };
}
