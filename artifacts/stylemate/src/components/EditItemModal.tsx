import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase, type WardrobeItem } from "@/lib/supabase";

type Props = {
  item: WardrobeItem;
  onClose: () => void;
  onUpdated: (item: WardrobeItem) => void;
};

const CATEGORIES = [
  { value: "tshirt",   label: "T-Shirt" },
  { value: "shirt",    label: "Shirt" },
  { value: "pants",    label: "Pants / Chinos / Jeans" },
  { value: "trousers", label: "Trousers (formal)" },
  { value: "shorts",   label: "Shorts" },
  { value: "jacket",   label: "Jacket / Blazer / Coat" },
  { value: "shoes",    label: "Shoes / Trainers / Boots" },
];

const OCCASION_OPTIONS = ["Casual", "Work", "Formal", "Party", "Sport", "Beach", "Date"];
const WEATHER_OPTIONS   = ["Sunny", "Rainy", "Cold", "Warm", "Windy", "Snowy"];

export function EditItemModal({ item, onClose, onUpdated }: Props) {
  const [name, setName]         = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [color, setColor]       = useState(item.color ?? "");
  const [colorHex, setColorHex] = useState(item.color_hex ?? "#888888");
  const [occasionTags, setOccasionTags] = useState<string[]>(item.occasion_tags ?? []);
  const [weatherTags, setWeatherTags]   = useState<string[]>(item.weather_tags ?? []);
  const [notes, setNotes]       = useState(item.notes ?? "");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  function toggleTag<T extends string>(list: T[], val: T, setter: (v: T[]) => void) {
    setter(list.includes(val) ? list.filter((t) => t !== val) : [...list, val]);
  }

  async function handleSave() {
    if (!name.trim() || !category) {
      setError("Name and category are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updates = {
        name: name.trim(),
        category,
        color: color || null,
        color_hex: color ? colorHex : null,
        occasion_tags: occasionTags.length ? occasionTags : null,
        weather_tags: weatherTags.length ? weatherTags : null,
        notes: notes.trim() || null,
      };
      const { data, error: err } = await supabase
        .from("wardrobe")
        .update(updates)
        .eq("id", item.id)
        .select()
        .single();

      if (err) throw new Error(err.message);
      onUpdated(data as WardrobeItem);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="modal-panel w-full max-w-md my-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-serif text-white">Edit Item</h2>
          <button onClick={onClose} aria-label="Close" className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Preview */}
        <div className="mb-5 rounded-lg overflow-hidden bg-white/[0.04] flex items-center justify-center" style={{ height: 160 }}>
          <img src={item.image_url} alt={item.name} className="max-h-full object-contain" />
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="form-label">Name *</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="form-label">Category *</label>
          <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Color */}
        <div className="mb-4">
          <label className="form-label">Colour</label>
          <div className="flex gap-2">
            <input
              className="form-input flex-1"
              placeholder="e.g. Navy Blue"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-white/10 bg-transparent"
              title="Pick colour"
            />
          </div>
        </div>

        {/* Occasion Tags */}
        <div className="mb-4">
          <label className="form-label">Occasion Tags</label>
          <div className="flex flex-wrap gap-2">
            {OCCASION_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(occasionTags, tag, setOccasionTags)}
                className={`tag-toggle ${occasionTags.includes(tag) ? "selected" : ""}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Weather Tags */}
        <div className="mb-4">
          <label className="form-label">Weather Tags</label>
          <div className="flex flex-wrap gap-2">
            {WEATHER_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(weatherTags, tag, setWeatherTags)}
                className={`tag-toggle ${weatherTags.includes(tag) ? "selected" : ""}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="form-label">Notes</label>
          <textarea
            className="form-input resize-none"
            rows={2}
            placeholder="Optional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Saving...</span> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
