import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { OccasionPicker } from "@/components/OccasionPicker";
import { OutfitGrid } from "@/components/OutfitGrid";
import { useWeather } from "@/components/WeatherWidget";
import { getOutfitSuggestions, type Outfit } from "@/lib/openrouter";
import { supabase, type WardrobeItem } from "@/lib/supabase";

export function Home() {
  const { weather, loading: weatherLoading } = useWeather();
  const [occasion, setOccasion] = useState<string | null>(null);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("wardrobe").select("*").then(({ data }) => {
      setWardrobe((data as WardrobeItem[]) || []);
    });
  }, []);

  async function handleSuggest() {
    if (!occasion || !weather) return;

    if (wardrobe.length < 3) {
      setError("Add at least 3 clothing items to your wardrobe first.");
      return;
    }

    setSuggesting(true);
    setError(null);
    setOutfits([]);

    try {
      const result = await getOutfitSuggestions(
        occasion,
        weather,
        wardrobe,
        "Medium Warm"
      );
      setOutfits(result.outfits);
    } catch (e) {
      setError("Failed to get outfit suggestions. Please try again.");
      console.error(e);
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div className="min-h-screen px-4 pb-16">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Occasion Picker */}
        <section className="text-center mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gold/60 mb-4">
            What's the occasion?
          </h2>
          <OccasionPicker selected={occasion} onSelect={setOccasion} />
        </section>

        {/* Divider */}
        <div className="border-t border-white/10 mb-8" />

        {/* Suggest Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleSuggest}
            disabled={!occasion || !weather || suggesting || weatherLoading}
            className="suggest-btn"
          >
            {suggesting ? (
              <span className="flex items-center gap-3">
                <Loader2 size={20} className="animate-spin" />
                Crafting your outfits...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <Sparkles size={20} />
                Suggest My Outfit
              </span>
            )}
          </button>

          {!occasion && (
            <p className="text-white/30 text-sm">Select an occasion above to continue</p>
          )}
        </div>

        {error && (
          <div className="mt-6 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {outfits.length > 0 && <OutfitGrid outfits={outfits} />}
      </div>
    </div>
  );
}
