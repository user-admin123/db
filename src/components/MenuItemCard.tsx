import { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import VegBadge from "@/components/VegBadge";

interface Props {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

const MenuItemCard = ({ item, onSelect }: Props) => {
  return (
    <motion.button
      onClick={() => onSelect(item)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
      className={cn(
        "glass-card rounded-2xl overflow-hidden text-left w-full transition-transform active:scale-[0.98]",
        !item.available && "opacity-50 grayscale"
      )}
    >
      <div className="flex gap-4 p-3">
        {/* Image */}
        <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <VegBadge type={item.item_type || "veg"} />
                <h3 className="font-semibold text-foreground text-base leading-tight truncate font-sans">
                  {item.name}
                </h3>
              </div>
              {!item.available && (
                <Badge variant="secondary" className="text-[10px] shrink-0 bg-destructive/20 text-destructive border-none">
                  Sold Out
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>
          <p className="text-primary font-bold text-lg font-sans mt-1">
            ${item.price.toFixed(2)}
          </p>
        </div>
      </div>
    </motion.button>
  );
};

export default MenuItemCard;
