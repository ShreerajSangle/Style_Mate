import { motion } from "framer-motion";
import type { Outfit } from "@/lib/openrouter";

type Props = {
  outfit: Outfit;
  index: number;
};

const LABEL_COLORS = ["text-gold", "text-amber-300", "text-yellow-200"];

export function OutfitCard({ outfit, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" }}
      className="outfit-card"
    >
      <div className="mb-4">
        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${LABEL_COLORS[index]}`}>
          {outfit.label}
        </p>
        <h3 className="text-lg font-serif text-white leading-tight">{outfit.vibe}</h3>
      </div>

      {/* Items in a responsive row grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {outfit.items.map((item) => (
          <div key={item.id} className="polaroid-card">
            <div className="aspect-square overflow-hidden rounded bg-charcoal-700">
              <img
                src={item.image_url}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23222'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23555' font-size='14'%3ENo image%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            <p className="text-xs text-center text-white/60 mt-1 truncate">{item.name}</p>
            <p className="text-xs text-center text-gold/50 capitalize">{item.category}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-white/60 leading-relaxed italic">"{outfit.description}"</p>
    </motion.div>
  );
}
