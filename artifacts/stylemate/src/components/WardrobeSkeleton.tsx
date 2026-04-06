export function WardrobeSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.07]">
          <div className="aspect-[3/4] skeleton" />
          <div className="p-3 space-y-2">
            <div className="skeleton skeleton-text" style={{ width: "70%" }} />
            <div className="skeleton skeleton-text" style={{ width: "45%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
