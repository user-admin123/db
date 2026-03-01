import { useState, useEffect, useRef, useCallback } from "react";
import { useMenuData } from "@/hooks/useMenuData";
import RestaurantHeader from "@/components/RestaurantHeader";
import CategoryTabs from "@/components/CategoryTabs";
import MenuItemCard from "@/components/MenuItemCard";
import ItemDetailDrawer from "@/components/ItemDetailDrawer";
import LoginModal from "@/components/LoginModal";
import AdminPanel from "@/components/AdminPanel";
import SearchBar from "@/components/SearchBar";
import { MenuItem, ItemType } from "@/lib/types";
import VegBadge from "@/components/VegBadge";
import { cn } from "@/lib/utils";

const Index = () => {
  const { categories, items, restaurant, authed, login, logout, updateCategories, updateItems, updateRestaurant, saveAll } = useMenuData();
  const [activeCat, setActiveCat] = useState(categories[0]?.id || "");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [vegFilter, setVegFilter] = useState<ItemType | "all">("all");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isManualScroll = useRef(false);

  // Filtered items helper
  const getItemsForCategory = useCallback((catId: string) =>
    items
      .filter((i) => i.category_id === catId)
      .filter((i) => vegFilter === "all" || i.item_type === vegFilter)
      .filter((i) => restaurant.show_sold_out !== false || i.available)
      .sort((a, b) => (a.available === b.available ? 0 : a.available ? -1 : 1)),
    [items, vegFilter, restaurant.show_sold_out]
  );

  // Categories that have visible items
  const visibleCategories = categories.filter((cat) => getItemsForCategory(cat.id).length > 0);

  // Set initial active category
  useEffect(() => {
    if (visibleCategories.length > 0 && !visibleCategories.find(c => c.id === activeCat)) {
      setActiveCat(visibleCategories[0].id);
    }
  }, [visibleCategories, activeCat]);

  // Intersection observer for scroll-based highlighting
  useEffect(() => {
    if (isManualScroll.current) return;
    const observers: IntersectionObserver[] = [];
    
    const visibleIds = visibleCategories.map(c => c.id);
    
    visibleCategories.forEach((cat) => {
      const el = sectionRefs.current[cat.id];
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isManualScroll.current) {
            setActiveCat(cat.id);
          }
        },
        { rootMargin: "-10% 0px -80% 0px", threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [visibleCategories]);

  const scrollToCategory = useCallback((id: string) => {
    isManualScroll.current = true;
    setActiveCat(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => { isManualScroll.current = false; }, 1000);
  }, []);

  // All visible items for search
  const allVisibleItems = items.filter((i) => restaurant.show_sold_out !== false || i.available);

  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto pb-12">
        {/* Auth */}
        {authed ? (
          <AdminPanel
            categories={categories}
            items={items}
            restaurant={restaurant}
            onUpdateCategories={updateCategories}
            onUpdateItems={updateItems}
            onUpdateRestaurant={updateRestaurant}
            onSaveAll={saveAll}
            onLogout={logout}
          />
        ) : (
          <LoginModal onLogin={login} />
        )}

        {/* Restaurant Header */}
        <RestaurantHeader restaurant={restaurant} />

        {/* Search Bar */}
        {restaurant.show_search && (
          <SearchBar items={allVisibleItems} onSelect={setSelectedItem} />
        )}

        {/* Veg/Non-Veg Filter */}
        {restaurant.show_veg_filter && (
          <div className="flex gap-2 px-4 py-2 justify-center">
            {(["all", "veg", "nonveg"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setVegFilter(type)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all border",
                  vegFilter === type
                    ? "bg-primary text-primary-foreground border-primary"
                    : "glass-surface text-muted-foreground border-border/30 hover:text-foreground"
                )}
              >
                {type === "all" ? "All" : <><VegBadge type={type} size="sm" /> {type === "veg" ? "Veg" : "Non-Veg"}</>}
              </button>
            ))}
          </div>
        )}

        {/* Category Tabs */}
        {visibleCategories.length > 0 && (
          <CategoryTabs categories={visibleCategories} activeId={activeCat} onSelect={scrollToCategory} />
        )}

        {/* Menu Sections */}
        <main className="px-4 mt-4 space-y-8">
          {visibleCategories.map((cat) => {
            const catItems = getItemsForCategory(cat.id);
            return (
              <section
                key={cat.id}
                ref={(el: HTMLDivElement | null) => { sectionRefs.current[cat.id] = el; }}
                className="scroll-mt-20"
              >
                <h2 className="text-xl font-bold text-foreground mb-3 tracking-tight">{cat.name}</h2>
                <div className="space-y-3">
                  {catItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} onSelect={setSelectedItem} />
                  ))}
                </div>
              </section>
            );
          })}

          {visibleCategories.length === 0 && items.length > 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">No items available</p>
              <p className="text-sm mt-1">
                {vegFilter !== "all" ? `No ${vegFilter === "veg" ? "vegetarian" : "non-vegetarian"} items found. Try changing the filter.` : "Currently no items are available."}
              </p>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">No menu items yet.</p>
              <p className="text-sm mt-1">Login as owner to add categories and items.</p>
            </div>
          )}
        </main>

        {/* Item Detail Drawer */}
        <ItemDetailDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
      </div>
    </div>
  );
};

export default Index;
