import type { Outfit } from "@/lib/openrouter";
import { OutfitCard } from "./OutfitCard";

type Props = {
  outfits: Outfit[];
};

export function OutfitGrid({ outfits }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {outfits.map((outfit, index) => (
        <OutfitCard key={outfit.label} outfit={outfit} index={index} />
      ))}
    </div>
  );
}
