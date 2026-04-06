import { useState } from "react";
import { Plus } from "lucide-react";
import { useWardrobe } from "@/lib/wardrobeContext";
import { ClothingCard } from "./ClothingCard";
import { AddItemModal } from "./AddItemModal";
import { DatabaseSetup } from "./DatabaseSetup";
import { WardrobeSkeleton } from "./WardrobeSkeleton";

const CATEGORIES = ["All", "shirt", "tshirt", "pants", "trousers", "jacket", "shoes", "shorts"];

export function WardrobeGrid() {
  const { items, loading, needsSetup, reload, addItem, removeItem, updateItem } = useWardrobe();
  const [filter, setFilter]       = useState("All");
  const [showModal, setShowModal] = useState(false);

  const filtered = filter === "All" ? items : items.filter((i) => i.category === filter);

  return (
    <div>
      {needsSetup && <DatabaseSetup onDone={reload} />}

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
        <WardrobeSkeleton />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <div className="text-5xl mb-4">👗</div>
          <p className="text-lg font-serif text-white/60">{filter === "All" ? "Your wardrobe is empty" : `No ${filter} items yet`}</p>
          <p className="text-sm mt-2">{filter === "All" ? "Add your first clothing item to get started" : "Try a different filter or add a new item"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <ClothingCard key={item.id} item={item} onDelete={removeItem} onUpdate={updateItem} />
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => setShowModal(true)}
        aria-label="Add clothing item"
        className="fixed bottom-6 right-6 btn-primary flex items-center gap-2 shadow-xl shadow-black/40"
      >
        <Plus size={18} />
        Add Item
      </button>

      {showModal && (
        <AddItemModal onClose={() => setShowModal(false)} onAdded={addItem} />
      )}
    </div>
  );
}
