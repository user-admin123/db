import { useState, useRef, useCallback, useEffect } from "react";
import { Category, MenuItem, ItemType, RestaurantInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, LogOut, Edit, X, GripVertical, Printer, Share2, Upload, Eye, QrCode, Save, Image as ImageIcon, Link } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import VegBadge from "@/components/VegBadge";

interface Props {
  categories: Category[];
  items: MenuItem[];
  restaurant: RestaurantInfo;
  onUpdateCategories: (cats: Category[]) => void;
  onUpdateItems: (items: MenuItem[]) => void;
  onUpdateRestaurant: (info: RestaurantInfo) => void;
  onSaveAll: (cats: Category[], items: MenuItem[], rest: RestaurantInfo) => Promise<boolean>;
  onLogout: () => void;
}

const AdminPanel = ({ categories, items, restaurant, onUpdateCategories, onUpdateItems, onUpdateRestaurant, onSaveAll, onLogout }: Props) => {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [qrFullscreen, setQrFullscreen] = useState(false);

  // Draft state for batch update
  const [draftCategories, setDraftCategories] = useState<Category[]>(categories);
  const [draftItems, setDraftItems] = useState<MenuItem[]>(items);
  const [draftRestaurant, setDraftRestaurant] = useState<RestaurantInfo>(restaurant);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync drafts when props change (e.g. after save)
  useEffect(() => {
    setDraftCategories(categories);
    setDraftItems(items);
    setDraftRestaurant(restaurant);
    setHasChanges(false);
  }, [categories, items, restaurant]);

  const markChanged = () => setHasChanges(true);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "category" | "item"; id: string; name: string } | null>(null);

  // Drag state for categories
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Item form state
  const [itemForm, setItemForm] = useState({ name: "", description: "", price: "", category_id: "", image_url: "", available: true, item_type: "veg" as ItemType });
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");
  const [imageUrlInput, setImageUrlInput] = useState("");

  const resetItemForm = () => {
    setItemForm({ name: "", description: "", price: "", category_id: draftCategories[0]?.id || "", image_url: "", available: true, item_type: "veg" });
    setImageInputMode("upload");
    setImageUrlInput("");
  };

  // Logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 2MB allowed.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setDraftRestaurant({ ...draftRestaurant, logo_url: reader.result as string });
      markChanged();
    };
    reader.readAsDataURL(file);
  };

  // Save all changes via single batch call
  const saveAllChanges = async () => {
    const success = await onSaveAll(draftCategories, draftItems, draftRestaurant);
    setHasChanges(false);
    toast({
      title: "All changes saved!",
      description: success ? "Synced to database." : "Saved locally (database unavailable).",
    });
  };

  // Category CRUD (on draft)
  const addCategory = () => {
    if (!catName.trim()) return;
    const newCat: Category = { id: `cat-${Date.now()}`, name: catName.trim(), order_index: draftCategories.length, created_at: new Date().toISOString() };
    setDraftCategories([...draftCategories, newCat]);
    setCatName("");
    markChanged();
  };

  const confirmDeleteCategory = (id: string) => {
    setDraftCategories(draftCategories.filter((c) => c.id !== id));
    setDraftItems(draftItems.filter((i) => i.category_id !== id));
    markChanged();
  };

  // Drag and drop
  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { dragOverItem.current = index; };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const updated = [...draftCategories];
    const dragged = updated[dragItem.current];
    updated.splice(dragItem.current, 1);
    updated.splice(dragOverItem.current, 0, dragged);
    updated.forEach((c, i) => (c.order_index = i));
    dragItem.current = null;
    dragOverItem.current = null;
    setDraftCategories(updated);
    markChanged();
  };

  const saveEditCat = () => {
    if (!editingCat) return;
    setDraftCategories(draftCategories.map((c) => (c.id === editingCat.id ? editingCat : c)));
    setEditingCat(null);
    markChanged();
  };

  // Item CRUD (on draft)
  const openNewItem = () => { resetItemForm(); setEditingItem(null); setItemFormOpen(true); };
  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({ name: item.name, description: item.description, price: String(item.price), category_id: item.category_id, image_url: item.image_url, available: item.available, item_type: item.item_type || "veg" });
    setImageInputMode(item.image_url && !item.image_url.startsWith("data:") ? "url" : "upload");
    setImageUrlInput(item.image_url && !item.image_url.startsWith("data:") ? item.image_url : "");
    setItemFormOpen(true);
  };

  const saveItem = () => {
    const price = parseFloat(itemForm.price);
    if (!itemForm.name.trim() || isNaN(price) || !itemForm.category_id) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (editingItem) {
      const updated: MenuItem = { ...editingItem, ...itemForm, price, updated_at: new Date().toISOString() };
      setDraftItems(draftItems.map((i) => (i.id === editingItem.id ? updated : i)));
    } else {
      const newItem: MenuItem = { id: `item-${Date.now()}`, ...itemForm, price, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      setDraftItems([...draftItems, newItem]);
    }
    setItemFormOpen(false);
    markChanged();
  };

  const confirmDeleteItem = (id: string) => {
    setDraftItems(draftItems.filter((i) => i.id !== id));
    markChanged();
  };

  const toggleAvailability = (id: string) => {
    setDraftItems(draftItems.map((i) => (i.id === id ? { ...i, available: !i.available, updated_at: new Date().toISOString() } : i)));
    markChanged();
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 2MB allowed.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setItemForm({ ...itemForm, image_url: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlApply = () => {
    if (imageUrlInput.trim()) {
      setItemForm({ ...itemForm, image_url: imageUrlInput.trim() });
    }
  };

  const menuUrl = window.location.origin;

  const qrRef = useRef<HTMLDivElement>(null);

  const handlePrintQR = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const r = draftRestaurant;
    printWindow.document.write(`
      <html><head><title>Menu QR - ${r.name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:'Inter',sans-serif;margin:0;
          background:linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%)}
        .card{background:white;border-radius:24px;padding:48px 40px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:400px;width:90%}
        .logo{width:64px;height:64px;border-radius:50%;object-fit:cover;margin:0 auto 12px;border:3px solid #764ba2}
        h2{font-family:'Playfair Display',serif;font-size:28px;color:#1a1a2e;margin-bottom:4px}
        .tagline{color:#888;font-size:14px;font-style:italic;margin-bottom:20px}
        .qr-wrap{display:inline-block;padding:16px;border-radius:16px;background:linear-gradient(135deg,#f5f7fa,#c3cfe2);margin:16px 0}
        .scan-text{margin-top:20px;font-size:16px;font-weight:600;color:#764ba2;display:flex;align-items:center;justify-content:center;gap:8px}
        .url{font-size:11px;color:#aaa;margin-top:8px}
        .footer{margin-top:16px;padding-top:12px;border-top:1px solid #eee;font-size:10px;color:#bbb}
      </style></head>
      <body>
        <div class="card">
          ${r.logo_url ? `<img src="${r.logo_url}" class="logo" alt="logo"/>` : ""}
          <h2>${r.name}</h2>
          ${r.tagline ? `<p class="tagline">${r.tagline}</p>` : ""}
          <div class="qr-wrap">${svgData}</div>
          <p class="scan-text">📱 Scan me to get the live menu!</p>
          <p class="url">${menuUrl}</p>
          <p class="footer">Powered by QR Menu</p>
        </div>
        <script>setTimeout(()=>{window.print();},500);</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const handleShareQR = async () => {
    const svgEl = qrRef.current?.querySelector("svg");
    if (svgEl && navigator.share) {
      try {
        const canvas = document.createElement("canvas");
        const scale = 2;
        canvas.width = 400 * scale;
        canvas.height = 560 * scale;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(scale, scale);
          // Gradient background
          const grad = ctx.createLinearGradient(0, 0, 400, 560);
          grad.addColorStop(0, "#667eea");
          grad.addColorStop(0.5, "#764ba2");
          grad.addColorStop(1, "#f093fb");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 400, 560);

          // White card
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.roundRect(30, 30, 340, 500, 20);
          ctx.fill();

          // Text
          ctx.fillStyle = "#1a1a2e";
          ctx.font = "bold 26px 'Playfair Display', serif";
          ctx.textAlign = "center";
          ctx.fillText(draftRestaurant.name, 200, 80);

          if (draftRestaurant.tagline) {
            ctx.font = "italic 13px 'Inter', sans-serif";
            ctx.fillStyle = "#888";
            ctx.fillText(draftRestaurant.tagline, 200, 100);
          }

          // QR code
          const svgData = new XMLSerializer().serializeToString(svgEl);
          const img = new window.Image();
          const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(svgBlob);

          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, 100, 120, 200, 200);
              URL.revokeObjectURL(url);
              resolve();
            };
            img.src = url;
          });

          ctx.fillStyle = "#764ba2";
          ctx.font = "600 15px 'Inter', sans-serif";
          ctx.fillText("📱 Scan me to get the live menu!", 200, 360);

          ctx.fillStyle = "#aaa";
          ctx.font = "11px 'Inter', sans-serif";
          ctx.fillText(menuUrl, 200, 385);

          ctx.fillStyle = "#ccc";
          ctx.font = "9px 'Inter', sans-serif";
          ctx.fillText("Powered by QR Menu", 200, 510);

          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
          if (blob) {
            const file = new File([blob], `${draftRestaurant.name}-QR.png`, { type: "image/png" });
            await navigator.share({
              title: `${draftRestaurant.name} Menu`,
              text: "Scan or click to view our menu",
              url: menuUrl,
              files: [file],
            });
            return;
          }
        }
      } catch {}
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: `${draftRestaurant.name} Menu`, text: "Scan or click to view our menu", url: menuUrl });
      } catch {}
    } else {
      navigator.clipboard.writeText(menuUrl);
      toast({ title: "Menu URL copied to clipboard!" });
    }
  };

  return (
    <>
      {/* Admin floating buttons */}
      <div className="fixed top-4 right-4 z-40 flex gap-2">
        {hasChanges && (
          <button
            onClick={saveAllChanges}
            className="h-10 px-4 rounded-full bg-green-600 text-white flex items-center gap-2 shadow-lg hover:bg-green-700 transition-colors text-sm font-medium animate-pulse"
          >
            <Save className="w-4 h-4" /> Update Changes
          </button>
        )}
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
          aria-label="Admin panel"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={onLogout}
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent className="glass-card border-border/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteConfirm?.type === "category" ? "Category" : "Item"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"?{deleteConfirm?.type === "category" && " All items in this category will also be deleted."} This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteConfirm) return;
                if (deleteConfirm.type === "category") confirmDeleteCategory(deleteConfirm.id);
                else confirmDeleteItem(deleteConfirm.id);
                setDeleteConfirm(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Fullscreen Display - Preview only */}
      <Dialog open={qrFullscreen} onOpenChange={setQrFullscreen}>
        <DialogContent className="max-w-full h-full sm:max-w-full sm:h-full sm:rounded-none border-none bg-background p-0 flex items-center justify-center [&>button]:hidden">
          <button
            onClick={() => { setQrFullscreen(false); setOpen(true); }}
            className="absolute top-4 right-4 z-50 rounded-full bg-card/80 p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center justify-center gap-6 p-8 text-center">
            {draftRestaurant.logo_url && (
              <img src={draftRestaurant.logo_url} alt={draftRestaurant.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary/30" />
            )}
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{draftRestaurant.name}</h2>
            {draftRestaurant.tagline && (
              <p className="text-muted-foreground text-base italic -mt-4">{draftRestaurant.tagline}</p>
            )}
            <div id="qr-fullscreen-svg" className="bg-white p-8 rounded-3xl shadow-2xl">
              <QRCodeSVG
                value={menuUrl}
                size={260}
                level="H"
                imageSettings={draftRestaurant.show_qr_logo !== false && draftRestaurant.logo_url ? {
                  src: draftRestaurant.logo_url,
                  height: 48,
                  width: 48,
                  excavate: true,
                } : undefined}
              />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-primary">📱 Scan me to get the live menu!</p>
              <p className="text-xs text-muted-foreground">{menuUrl}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Admin Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card border-border/30 sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Admin Panel</DialogTitle>
            <DialogDescription>Manage your restaurant menu. Click "Update Changes" to save.</DialogDescription>
          </DialogHeader>

          {hasChanges && (
            <Button onClick={saveAllChanges} className="w-full bg-green-600 hover:bg-green-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Update Changes
            </Button>
          )}

          <Tabs defaultValue="categories" className="mt-2">
            <TabsList className="w-full bg-muted/50">
              <TabsTrigger value="categories" className="flex-1">Categories</TabsTrigger>
              <TabsTrigger value="items" className="flex-1">Items</TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
              <TabsTrigger value="qr" className="flex-1">QR</TabsTrigger>
            </TabsList>

            {/* CATEGORIES TAB */}
            <TabsContent value="categories" className="space-y-3 mt-3">
              <div className="flex gap-2">
                <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="New category name" className="bg-muted/50" onKeyDown={(e) => e.key === "Enter" && addCategory()} />
                <Button onClick={addCategory} size="icon"><Plus className="w-4 h-4" /></Button>
              </div>
              {draftCategories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 glass-surface rounded-lg p-2 cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragEnter={() => handleDragEnter(idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  {editingCat?.id === cat.id ? (
                    <>
                      <Input value={editingCat.name} onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })} className="flex-1 bg-muted/50 h-8 text-sm" />
                      <Button size="sm" variant="ghost" onClick={saveEditCat}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCat(null)}><X className="w-3 h-3" /></Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-foreground font-sans">{cat.name}</span>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCat(cat)}><Edit className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "category", id: cat.id, name: cat.name })} className="text-destructive hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
                    </>
                  )}
                </div>
              ))}
            </TabsContent>

            {/* ITEMS TAB */}
            <TabsContent value="items" className="space-y-3 mt-3">
              <Button onClick={openNewItem} className="w-full"><Plus className="w-4 h-4 mr-2" />Add Item</Button>
              {draftCategories.map((cat) => {
                const catItems = draftItems.filter((i) => i.category_id === cat.id);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">{cat.name}</p>
                    {catItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 glass-surface rounded-lg p-2 mb-1">
                        <VegBadge type={item.item_type || "veg"} />
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                          {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate font-sans">{item.name}</p>
                          <p className="text-xs text-primary font-sans">${item.price.toFixed(2)}</p>
                        </div>
                        <Switch checked={item.available} onCheckedChange={() => toggleAvailability(item.id)} />
                        <Button size="sm" variant="ghost" onClick={() => openEditItem(item)}><Edit className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "item", id: item.id, name: item.name })} className="text-destructive hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="space-y-4 mt-3">
              <div className="space-y-2">
                <Label>Restaurant Name</Label>
                <Input value={draftRestaurant.name} onChange={(e) => { setDraftRestaurant({ ...draftRestaurant, name: e.target.value }); markChanged(); }} className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input value={draftRestaurant.tagline} onChange={(e) => { setDraftRestaurant({ ...draftRestaurant, tagline: e.target.value }); markChanged(); }} className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                {draftRestaurant.logo_url && (
                  <div className="flex items-center gap-3 mb-2">
                    <img src={draftRestaurant.logo_url} alt="Logo preview" className="w-16 h-16 rounded-full object-cover border-2 border-border/30" />
                    <Button size="sm" variant="ghost" onClick={() => { setDraftRestaurant({ ...draftRestaurant, logo_url: "" }); markChanged(); }}>
                      <X className="w-3 h-3 mr-1" /> Remove
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center gap-2 cursor-pointer bg-muted/50 border border-input rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Upload logo</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
                <Input
                  value={draftRestaurant.logo_url?.startsWith("data:") ? "" : (draftRestaurant.logo_url || "")}
                  onChange={(e) => { setDraftRestaurant({ ...draftRestaurant, logo_url: e.target.value }); markChanged(); }}
                  className="bg-muted/50"
                  placeholder="Or paste logo URL..."
                />
              </div>

              {/* Customer view settings */}
              <div className="border-t border-border/30 pt-4 mt-4">
                <p className="text-sm font-semibold text-foreground mb-3">Customer View Settings</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Show Veg/Non-Veg Filter</Label>
                      <p className="text-xs text-muted-foreground">Let customers filter by dietary type</p>
                    </div>
                    <Switch
                      checked={draftRestaurant.show_veg_filter ?? false}
                      onCheckedChange={(v) => { setDraftRestaurant({ ...draftRestaurant, show_veg_filter: v }); markChanged(); }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Show Sold Out Items</Label>
                      <p className="text-xs text-muted-foreground">Display unavailable items to customers</p>
                    </div>
                    <Switch
                      checked={draftRestaurant.show_sold_out ?? true}
                      onCheckedChange={(v) => { setDraftRestaurant({ ...draftRestaurant, show_sold_out: v }); markChanged(); }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Enable Menu Search</Label>
                      <p className="text-xs text-muted-foreground">Let customers search items by name</p>
                    </div>
                    <Switch
                      checked={draftRestaurant.show_search ?? false}
                      onCheckedChange={(v) => { setDraftRestaurant({ ...draftRestaurant, show_search: v }); markChanged(); }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Show Logo in QR Code</Label>
                      <p className="text-xs text-muted-foreground">Embed restaurant logo inside QR</p>
                    </div>
                    <Switch
                      checked={draftRestaurant.show_qr_logo ?? true}
                      onCheckedChange={(v) => { setDraftRestaurant({ ...draftRestaurant, show_qr_logo: v }); markChanged(); }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">Default login: admin@restaurant.com / admin123</p>
            </TabsContent>

            {/* QR TAB */}
            <TabsContent value="qr" className="mt-3 flex flex-col items-center gap-4">
              <div className="bg-white p-6 rounded-2xl" ref={qrRef}>
                <QRCodeSVG
                  value={menuUrl}
                  size={160}
                  level="H"
                  imageSettings={draftRestaurant.show_qr_logo !== false && draftRestaurant.logo_url ? {
                    src: draftRestaurant.logo_url,
                    height: 32,
                    width: 32,
                    excavate: true,
                  } : undefined}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Your menu QR code
                {draftRestaurant.show_qr_logo !== false && draftRestaurant.logo_url && <><br /><span className="text-xs text-primary">Logo embedded ✓</span></>}
              </p>
              <Button className="w-full" onClick={() => { setOpen(false); setQrFullscreen(true); }}>
                <Eye className="w-4 h-4 mr-2" />View QR Display
              </Button>
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1" onClick={handlePrintQR}>
                  <Printer className="w-4 h-4 mr-2" />Print
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleShareQR}>
                  <Share2 className="w-4 h-4 mr-2" />Share
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Item Form Dialog */}
      <Dialog open={itemFormOpen} onOpenChange={setItemFormOpen}>
        <DialogContent className="glass-card border-border/30 sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingItem ? "Edit Item" : "Add Item"}</DialogTitle>
            <DialogDescription>Fill in the item details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="bg-muted/50" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="bg-muted/50 resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Price *</Label>
                <Input type="number" step="0.01" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} className="bg-muted/50" />
              </div>
              <div className="space-y-1">
                <Label>Category *</Label>
                <Select value={itemForm.category_id} onValueChange={(v) => setItemForm({ ...itemForm, category_id: v })}>
                  <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {draftCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Type *</Label>
              <Select value={itemForm.item_type} onValueChange={(v) => setItemForm({ ...itemForm, item_type: v as ItemType })}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="veg"><span className="flex items-center gap-2"><VegBadge type="veg" /> Vegetarian</span></SelectItem>
                  <SelectItem value="nonveg"><span className="flex items-center gap-2"><VegBadge type="nonveg" /> Non-Vegetarian</span></SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image with preview */}
            <div className="space-y-2">
              <Label>Image</Label>
              {/* Preview */}
              {itemForm.image_url && (
                <div className="relative w-full h-40 rounded-xl overflow-hidden bg-muted border border-border/30">
                  <img src={itemForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setItemForm({ ...itemForm, image_url: "" }); setImageUrlInput(""); }}
                    className="absolute top-2 right-2 rounded-full bg-card/80 p-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {/* Toggle between upload and URL */}
              <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
                <button
                  onClick={() => setImageInputMode("upload")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${imageInputMode === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Upload className="w-3 h-3" /> Upload
                </button>
                <button
                  onClick={() => setImageInputMode("url")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${imageInputMode === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Link className="w-3 h-3" /> URL
                </button>
              </div>
              {imageInputMode === "upload" ? (
                <label className="flex items-center gap-2 cursor-pointer bg-muted/50 border border-input rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{itemForm.image_url ? "Change image" : "Choose image file"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="bg-muted/50 flex-1"
                    placeholder="https://..."
                  />
                  <Button size="sm" onClick={handleImageUrlApply} disabled={!imageUrlInput.trim()}>
                    Preview
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Upload max 2MB or paste an image URL</p>
            </div>

            <div className="flex items-center justify-between">
              <Label>Available</Label>
              <Switch checked={itemForm.available} onCheckedChange={(v) => setItemForm({ ...itemForm, available: v })} />
            </div>
            <Button onClick={saveItem} className="w-full">{editingItem ? "Update Item" : "Add Item"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminPanel;
