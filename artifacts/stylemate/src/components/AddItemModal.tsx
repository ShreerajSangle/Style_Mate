import { useState, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { supabase, type WardrobeItem } from "@/lib/supabase";

type Props = {
  onClose: () => void;
  onAdded: (item: WardrobeItem) => void;
};

const CATEGORIES = ["shirt", "tshirt", "pants", "trousers", "jacket", "shoes", "shorts"];
const OCCASIONS = ["Casual", "Date", "Gym", "Beach", "Work", "Party"];
const WEATHER_TAGS = ["Sunny", "Cloudy", "Cold", "Rainy"];

export function AddItemModal({ onClose, onAdded }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [colorHex, setColorHex] = useState("#888888");
  const [occasions, setOccasions] = useState<string[]>([]);
  const [weatherTags, setWeatherTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleTag(arr: string[], setArr: (v: string[]) => void, tag: string) {
    setArr(arr.includes(tag) ? arr.filter((t) => t !== tag) : [...arr, tag]);
  }

  function handleFile(f: File) {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  }

  async function handleSave() {
    if (!name || !category || !file) {
      setError("Name, category, and photo are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("wardrobe-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("wardrobe-images")
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      const { data, error: insertError } = await supabase
        .from("wardrobe")
        .insert({
          name,
          category,
          color: color || null,
          color_hex: colorHex || null,
          occasion_tags: occasions.length ? occasions.map((o) => o.toLowerCase()) : null,
          weather_tags: weatherTags.length ? weatherTags.map((w) => w.toLowerCase()) : null,
          image_url: imageUrl,
          notes: notes || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onAdded(data as WardrobeItem);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="modal-panel w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif text-white">Add Clothing Item</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Photo Upload */}
        <div
          className={`upload-zone mb-5 ${dragging ? "border-gold bg-gold/5" : ""}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-48 rounded object-contain mx-auto" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/40">
              <Upload size={28} />
              <span className="text-sm">Drop a photo here or click to browse</span>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="form-label">Name *</label>
          <input
            className="form-input"
            placeholder="e.g. Navy Linen Shirt"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="form-label">Category *</label>
          <select
            className="form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select category...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div className="mb-4">
          <label className="form-label">Color</label>
          <div className="flex gap-3">
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
              className="w-12 h-10 rounded border border-white/10 bg-transparent cursor-pointer"
            />
          </div>
        </div>

        {/* Occasion Tags */}
        <div className="mb-4">
          <label className="form-label">Occasion Tags</label>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((occ) => (
              <button
                key={occ}
                type="button"
                onClick={() => toggleTag(occasions, setOccasions, occ)}
                className={`tag-toggle ${occasions.includes(occ) ? "selected" : ""}`}
              >
                {occ}
              </button>
            ))}
          </div>
        </div>

        {/* Weather Tags */}
        <div className="mb-4">
          <label className="form-label">Weather Tags</label>
          <div className="flex flex-wrap gap-2">
            {WEATHER_TAGS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => toggleTag(weatherTags, setWeatherTags, w)}
                className={`tag-toggle ${weatherTags.includes(w) ? "selected" : ""}`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="form-label">Notes</label>
          <textarea
            className="form-input resize-none"
            rows={2}
            placeholder="Any notes about this item..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Saving...
              </span>
            ) : (
              "Save Item"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
