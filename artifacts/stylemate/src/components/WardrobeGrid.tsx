import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase, type WardrobeItem } from "@/lib/supabase";
import { ClothingCard } from "./ClothingCard";
import { AddItemModal } from "./AddItemModal";
import { DatabaseSetup } from "./DatabaseSetup";

const CATEGORIES = ["All", "shirt", "tshirt", "pants", "trousers", "jacket", "shoes", "shorts"];

export function WardrobeGrid() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    loadWardrobe();
  }, []);

  async function loadWardrobe() {
    setLoading(true);
    const { data, error } = await supabase
      .from("wardrobe")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      // Table doesn't exist yet
      if (error.message.includes("schema cache") || error.message.includes("does not exist") || error.code === "42P01") {
        setNeedsSetup(true);
      }
    } else {
      setItems((data as WardrobeItem[]) || []);
    }
    setLoading(false);
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleAdded(item: WardrobeItem) {
    setItems((prev) => [item, ...prev]);
  }

  function handleSetupDone() {
    setNeedsSetup(false);
    loadWardrobe();
  }

  const filtered = filter === "All" ? items : items.filter((i) => i.category === filter);

  return (
    <div>
      {needsSetup && <DatabaseSetup onDone={handleSetupDone} />}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`filter-tab ${filter === cat ? "active" : ""}`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <p className="text-lg">No items yet</p>
          <p className="text-sm mt-1">Add your first clothing item to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <ClothingCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 btn-primary flex items-center gap-2 shadow-xl shadow-black/40"
      >
        <Plus size={18} />
        Add Item
      </button>

      {showModal && (
        <AddItemModal onClose={() => setShowModal(false)} onAdded={handleAdded} />
      )}
    </div>
  );
}
