import { useState, useEffect } from "react";
import { Trash2, Pencil } from "lucide-react";
import type { WardrobeItem } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { EditItemModal } from "./EditItemModal";

type Props = {
  item: WardrobeItem;
  onDelete: (id: string) => void;
  onUpdate: (item: WardrobeItem) => void;
};

export function ClothingCard({ item, onDelete, onUpdate }: Props) {
  const [confirming, setConfirming]   = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [showEdit, setShowEdit]       = useState(false);

  // Auto-reset confirming state after 3 seconds
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      const { error } = await supabase.from("wardrobe").delete().eq("id", item.id);
      if (error) throw new Error(error.message);
      onDelete(item.id);
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete item. Please try again.");
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <>
      <div className="clothing-card group relative">
        <div className="aspect-[3/4] overflow-hidden rounded-t bg-charcoal-700">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23222'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23555' font-size='14'%3ENo image%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>

        <div className="p-3">
          <h3 className="text-sm font-medium text-white truncate">{item.name}</h3>
          <p className="text-xs text-gold/70 capitalize mt-0.5">{item.category}</p>
          {item.color && (
            <div className="flex items-center gap-1.5 mt-1">
              {item.color_hex && (
                <div
                  className="w-3 h-3 rounded-full border border-white/20"
                  style={{ backgroundColor: item.color_hex }}
                />
              )}
              <span className="text-xs text-white/40">{item.color}</span>
            </div>
          )}
          {item.occasion_tags && item.occasion_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.occasion_tags.slice(0, 2).map((tag) => (
                <span key={tag} className="tag-pill">{tag}</span>
              ))}
              {item.occasion_tags.length > 2 && (
                <span className="tag-pill">+{item.occasion_tags.length - 2}</span>
              )}
            </div>
          )}
        </div>

        {/* Edit button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowEdit(true); }}
          aria-label="Edit item"
          className="absolute top-2 left-2 p-1.5 rounded-full bg-black/60 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
        >
          <Pencil size={13} />
        </button>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label={confirming ? "Click again to confirm deletion" : "Delete item"}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 ${
            confirming
              ? "bg-red-500 text-white opacity-100"
              : "bg-black/60 text-white/70 hover:bg-red-500 hover:text-white"
          }`}
        >
          {deleting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>

        {confirming && (
          <div
            className="absolute inset-0 bg-black/40 rounded flex items-end justify-center pb-3 pointer-events-none"
          >
            <span className="text-xs text-red-400">Click trash again to confirm</span>
          </div>
        )}
      </div>

      {showEdit && (
        <EditItemModal
          item={item}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => { onUpdate(updated); setShowEdit(false); }}
        />
      )}
    </>
  );
}
