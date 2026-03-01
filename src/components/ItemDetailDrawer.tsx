import { MenuItem } from "@/lib/types";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import VegBadge from "@/components/VegBadge";

interface Props {
  item: MenuItem | null;
  onClose: () => void;
}

const ItemDetailDrawer = ({ item, onClose }: Props) => {
  if (!item) return null;

  return (
    <Drawer open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="glass-card border-t border-border/30 max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-card/80 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {item.image_url && (
          <div className="w-full h-56 md:h-72 overflow-hidden">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <DrawerHeader className="px-6 pt-5 pb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <VegBadge type={item.item_type || "veg"} size="md" />
              <DrawerTitle className="text-2xl text-foreground">{item.name}</DrawerTitle>
            </div>
            {!item.available && (
              <Badge variant="secondary" className="bg-destructive/20 text-destructive border-none shrink-0">
                Sold Out
              </Badge>
            )}
          </div>
          <p className="text-primary font-bold text-2xl font-sans mt-1">
            ${item.price.toFixed(2)}
          </p>
          <DrawerDescription className="text-muted-foreground text-sm mt-3 leading-relaxed">
            {item.description}
          </DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
};

export default ItemDetailDrawer;
