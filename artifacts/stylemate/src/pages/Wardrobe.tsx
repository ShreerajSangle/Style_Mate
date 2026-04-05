import { WardrobeGrid } from "@/components/WardrobeGrid";

export function WardrobePage() {
  return (
    <div className="min-h-screen px-4 pb-16">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-serif text-white">My Wardrobe</h2>
          <p className="text-white/40 text-sm mt-1">Manage your clothing collection</p>
        </div>
        <WardrobeGrid />
      </div>
    </div>
  );
}
