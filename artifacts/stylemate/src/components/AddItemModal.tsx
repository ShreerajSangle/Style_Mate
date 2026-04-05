import { useState, useRef } from "react";
import { X, Upload, Loader2, Sparkles } from "lucide-react";
import { supabase, type WardrobeItem } from "@/lib/supabase";

type Props = {
  onClose: () => void;
  onAdded: (item: WardrobeItem) => void;
};

const CATEGORIES = ["shirt", "tshirt", "pants", "trousers", "jacket", "shoes", "shorts"];
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string;

async function identifyClothing(file: File): Promise<{ name: string; category: string }> {
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });

  const mimeType = file.type || "image/jpeg";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://stylemate.app",
    },
    body: JSON.stringify({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            {
              type: "text",
              text: `Look at this clothing item. Respond ONLY with a JSON object in this exact format, no extra text:
{"name": "descriptive name including colour e.g. Navy Blue Linen Shirt", "category": "one of: shirt|tshirt|pants|trousers|jacket|shoes|shorts"}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) throw new Error("AI identification failed");

  const data = await response.json();
  const raw = (data.choices[0].message.content as string).replace(/```json|```/g, "").trim();
  return JSON.parse(raw) as { name: string; category: string };
}

export function AddItemModal({ onClose, onAdded }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setIdentifying(true);
    setError(null);
    try {
      const result = await identifyClothing(f);
      setName(result.name);
      if (CATEGORIES.includes(result.category)) {
        setCategory(result.category);
      }
    } catch {
      // silent — user can fill in manually
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
    if (!name || !category || !file) {
      setError("Photo, name, and category are required.");
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

      const { data, error: insertError } = await supabase
        .from("wardrobe")
        .insert({
          name,
          category,
          image_url: urlData.publicUrl,
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
      <div className="modal-panel w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif text-white">Add to Wardrobe</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
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
        >
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="max-h-52 rounded object-contain mx-auto" />
              {identifying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded gap-2">
                  <Loader2 size={24} className="animate-spin text-gold" />
                  <span className="text-sm text-gold font-medium">Identifying clothing...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/40 py-4">
              <Upload size={32} />
              <div className="text-center">
                <p className="text-sm font-medium text-white/60">Drop a photo or click to browse</p>
                <p className="text-xs mt-1 flex items-center justify-center gap-1">
                  <Sparkles size={11} className="text-gold/60" />
                  <span className="text-gold/60">AI will identify the item automatically</span>
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
            {identifying && <span className="ml-2 text-gold/60 normal-case tracking-normal font-normal">detecting...</span>}
          </label>
          <input
            className="form-input"
            placeholder="e.g. Navy Linen Shirt"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={identifying}
          />
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="form-label">
            Category *
            {identifying && <span className="ml-2 text-gold/60 normal-case tracking-normal font-normal">detecting...</span>}
          </label>
          <select
            className="form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={identifying}
          >
            <option value="">Select category...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || identifying} className="btn-primary flex-1">
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
