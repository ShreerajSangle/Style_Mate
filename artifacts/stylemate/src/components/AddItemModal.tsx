import { useState, useRef } from "react";
import { X, Upload, Loader2, Sparkles } from "lucide-react";
import { supabase, type WardrobeItem } from "@/lib/supabase";

type Props = {
  onClose: () => void;
  onAdded: (item: WardrobeItem) => void;
};

const CATEGORIES = [
  { value: "tshirt",   label: "T-Shirt  (crew-neck, polo, sweatshirt, pullover)" },
  { value: "shirt",    label: "Shirt  (button-up, collared, formal / casual)" },
  { value: "pants",    label: "Pants / Chinos / Jeans" },
  { value: "trousers", label: "Trousers  (formal, tailored)" },
  { value: "shorts",   label: "Shorts" },
  { value: "jacket",   label: "Jacket / Blazer / Coat / Hoodie (outerwear)" },
  { value: "shoes",    label: "Shoes / Trainers / Boots / Sandals" },
];

const OCCASION_OPTIONS = ["Casual", "Work", "Formal", "Party", "Sport", "Beach", "Date"];
const WEATHER_OPTIONS   = ["Sunny", "Rainy", "Cold", "Warm", "Windy", "Snowy"];

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string;

/** Resize + compress an image file to a JPEG data-URL (≤ 900px, quality 0.75) */
function compressImage(file: File, maxPx = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function identifyClothing(dataUrl: string): Promise<{ name: string; category: string; color: string; color_hex: string; occasion_tags: string[]; weather_tags: string[] }> {
  const base64 = dataUrl.split(",")[1];
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://stylemate.app",
      "X-Title": "StyleMate",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
          {
            type: "text",
            text: `You are a professional fashion AI. Identify this clothing item precisely.

CATEGORY RULES:
• "tshirt" → pull-over top: t-shirt, polo, sweatshirt, hoodie body, tank top, crew-neck, v-neck
• "shirt" → full-length button placket + collar: Oxford, dress shirt, flannel, linen shirt
• "pants" → casual bottoms: jeans, chinos, cargo pants
• "trousers" → formal bottoms: suit trousers, dress trousers
• "shorts" → any short-leg bottom
• "jacket" → outerwear: bomber, blazer, windbreaker, overcoat, denim jacket
• "shoes" → any footwear: trainers, sneakers, dress shoes, boots, loafers

Return ONLY raw JSON — no markdown:
{
  "name": "[Colour] [Descriptive Name]",
  "category": "shirt|tshirt|pants|trousers|shorts|jacket|shoes",
  "color": "human-readable colour name e.g. Navy Blue",
  "color_hex": "#hex code e.g. #1a2e5a",
  "occasion_tags": ["Casual"|"Work"|"Formal"|"Party"|"Sport"|"Beach"|"Date" — pick relevant ones],
  "weather_tags": ["Sunny"|"Rainy"|"Cold"|"Warm"|"Windy"|"Snowy" — pick relevant ones]
}`,
          },
        ],
      }],
    }),
  });
  if (!response.ok) throw new Error("AI identification failed");
  const data = await response.json();
  const raw = (data.choices[0].message.content as string).replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

export function AddItemModal({ onClose, onAdded }: Props) {
  const [name, setName]           = useState("");
  const [category, setCategory]   = useState("");
  const [color, setColor]         = useState("");
  const [colorHex, setColorHex]   = useState("#888888");
  const [occasionTags, setOccasionTags] = useState<string[]>([]);
  const [weatherTags, setWeatherTags]   = useState<string[]>([]);
  const [compressedDataUrl, setCompressedDataUrl] = useState<string | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [dragging, setDragging]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleTag<T extends string>(list: T[], val: T, setter: (v: T[]) => void) {
    setter(list.includes(val) ? list.filter((t) => t !== val) : [...list, val]);
  }

  async function handleFile(f: File) {
    setError(null);
    setPreview(URL.createObjectURL(f));
    setIdentifying(true);
    try {
      const dataUrl = await compressImage(f);
      setCompressedDataUrl(dataUrl);
      const result = await identifyClothing(dataUrl);
      setName(result.name);
      const validCats = CATEGORIES.map((c) => c.value);
      if (validCats.includes(result.category)) setCategory(result.category);
      if (result.color)     setColor(result.color);
      if (result.color_hex) setColorHex(result.color_hex);
      if (result.occasion_tags?.length) setOccasionTags(result.occasion_tags);
      if (result.weather_tags?.length)  setWeatherTags(result.weather_tags);
    } catch {
      // Allow user to fill in manually
    } finally {
      setIdentifying(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) void handleFile(f);
  }

  async function handleSave() {
    if (!name.trim() || !category || !compressedDataUrl) {
      setError("Photo, name, and category are all required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from("wardrobe")
        .insert({
          name: name.trim(),
          category,
          image_url: compressedDataUrl,
          color: color || null,
          color_hex: color ? colorHex : null,
          occasion_tags: occasionTags.length ? occasionTags : null,
          weather_tags: weatherTags.length ? weatherTags : null,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.message.includes("schema cache") || insertError.message.includes("does not exist") || insertError.code === "42P01") {
          throw new Error("The wardrobe table hasn't been created yet.");
        }
        throw new Error(`Database error: ${insertError.message}`);
      }
      onAdded(data as WardrobeItem);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="modal-panel w-full max-w-md my-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif text-white">Add to Wardrobe</h2>
          <button onClick={onClose} aria-label="Close" className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Photo Upload */}
        <div
          className={`upload-zone mb-5 ${dragging ? "dragging" : ""}`}
          onClick={() => !identifying && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{ cursor: identifying ? "default" : "pointer" }}
          role="button"
          aria-label="Upload clothing photo"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
        >
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="max-h-52 rounded object-contain mx-auto" />
              {identifying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 rounded gap-2">
                  <Loader2 size={26} className="animate-spin text-gold" />
                  <span className="text-sm text-gold font-medium">AI identifying your item...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/40 py-4">
              <Upload size={32} />
              <div className="text-center">
                <p className="text-sm font-medium text-white/60">Drop a photo or click to browse</p>
                <p className="text-xs mt-1 flex items-center justify-center gap-1">
                  <Sparkles size={11} className="text-gold/70" />
                  <span className="text-gold/70">AI auto-detects name, colour &amp; tags</span>
                </p>
              </div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
          />
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="form-label">
            Name *
            {identifying && <span className="ml-2 text-gold/60 normal-case tracking-normal font-normal text-xs">detecting...</span>}
          </label>
          <input className="form-input" placeholder="e.g. Navy Linen Shirt" value={name} onChange={(e) => setName(e.target.value)} disabled={identifying} />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="form-label">
            Category *
            {identifying && <span className="ml-2 text-gold/60 normal-case tracking-normal font-normal text-xs">detecting...</span>}
          </label>
          <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} disabled={identifying}>
            <option value="">Select category...</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Colour */}
        <div className="mb-4">
          <label className="form-label">Colour {identifying && <span className="ml-2 text-gold/60 normal-case tracking-normal font-normal text-xs">detecting...</span>}</label>
          <div className="flex gap-2">
            <input className="form-input flex-1" placeholder="e.g. Navy Blue" value={color} onChange={(e) => setColor(e.target.value)} disabled={identifying} />
            <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-white/10 bg-transparent" title="Pick colour" />
          </div>
        </div>

        {/* Occasion Tags */}
        <div className="mb-4">
          <label className="form-label">Occasion Tags {identifying && <span className="ml-2 text-gold/60 normal-case tracking-normal font-normal text-xs">detecting...</span>}</label>
          <div className="flex flex-wrap gap-2">
            {OCCASION_OPTIONS.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleTag(occasionTags, tag, setOccasionTags)} disabled={identifying}
                className={`tag-toggle ${occasionTags.includes(tag) ? "selected" : ""}`}>{tag}</button>
            ))}
          </div>
        </div>

        {/* Weather Tags */}
        <div className="mb-5">
          <label className="form-label">Weather Tags {identifying && <span className="ml-2 text-gold/60 normal-case tracking-normal font-normal text-xs">detecting...</span>}</label>
          <div className="flex flex-wrap gap-2">
            {WEATHER_OPTIONS.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleTag(weatherTags, tag, setWeatherTags)} disabled={identifying}
                className={`tag-toggle ${weatherTags.includes(tag) ? "selected" : ""}`}>{tag}</button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving || identifying} className="btn-primary flex-1">
            {saving ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Saving...</span> : "Save Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
