import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase, type WardrobeItem } from "./supabase";

type WardrobeCtx = {
  items: WardrobeItem[];
  loading: boolean;
  needsSetup: boolean;
  reload: () => Promise<void>;
  addItem: (item: WardrobeItem) => void;
  removeItem: (id: string) => void;
  updateItem: (item: WardrobeItem) => void;
};

const WardrobeContext = createContext<WardrobeCtx>({
  items: [],
  loading: true,
  needsSetup: false,
  reload: async () => {},
  addItem: () => {},
  removeItem: () => {},
  updateItem: () => {},
});

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("wardrobe")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (
        error.message.includes("schema cache") ||
        error.message.includes("does not exist") ||
        error.code === "42P01"
      ) {
        setNeedsSetup(true);
      }
    } else {
      setItems((data as WardrobeItem[]) || []);
      setNeedsSetup(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const addItem = (item: WardrobeItem) => setItems((prev) => [item, ...prev]);
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const updateItem = (updated: WardrobeItem) =>
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));

  return (
    <WardrobeContext.Provider value={{ items, loading, needsSetup, reload, addItem, removeItem, updateItem }}>
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  return useContext(WardrobeContext);
}
