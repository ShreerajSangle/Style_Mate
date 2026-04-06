import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { OccasionPicker } from "@/components/OccasionPicker";
import { OutfitCard } from "@/components/OutfitCard";
import { useWeather } from "@/lib/weatherContext";
import { useWardrobe } from "@/lib/wardrobeContext";
import { getOutfitSuggestions, type Outfit } from "@/lib/openrouter";

export function Home() {
  const { weather, loading: weatherLoading } = useWeather();
  const { items: wardrobe } = useWardrobe();
  const [occasion, setOccasion]   = useState<string | null>(null);
  const [outfits, setOutfits]     = useState<Outfit[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

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
      const result = await getOutfitSuggestions(occasion, weather, wardrobe);
      if (!result.outfits || result.outfits.length === 0) {
        setError("No outfits could be generated. Try adding more variety to your wardrobe.");
      } else {
        setOutfits(result.outfits);
      }
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
          <OccasionPicker selected={occasion} onSelect={(o) => { setOccasion(o); setOutfits([]); setError(null); }} />
        </section>

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

          {!occasion && !suggesting && (
            <p className="text-white/30 text-sm">Select an occasion above to continue</p>
          )}
          {wardrobe.length > 0 && wardrobe.length < 3 && (
            <p className="text-white/30 text-sm">You need at least 3 wardrobe items ({3 - wardrobe.length} more needed)</p>
          )}
        </div>

        {error && (
          <div className="mt-6 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Outfit Results */}
        {outfits.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gold/60">Your Outfits</h3>
              <button
                onClick={handleSuggest}
                disabled={suggesting}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                <RefreshCw size={13} />
                Regenerate
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {outfits.map((outfit, index) => (
                <OutfitCard key={outfit.label} outfit={outfit} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state after attempt with no results */}
        {!suggesting && outfits.length === 0 && occasion && !error && (
          <div className="mt-16 text-center text-white/30">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-sm">Hit the button above to get your outfit suggestions</p>
          </div>
        )}
      </div>
    </div>
  );
}
