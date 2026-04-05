const OCCASIONS = [
  "Date Night",
  "Casual Hangout",
  "Gym",
  "Beach Day",
  "Just a Stroll",
  "Work",
  "Party",
  "Other",
];

type Props = {
  selected: string | null;
  onSelect: (occasion: string) => void;
};

export function OccasionPicker({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {OCCASIONS.map((occasion) => (
        <button
          key={occasion}
          onClick={() => onSelect(occasion)}
          className={`occasion-chip ${selected === occasion ? "selected" : ""}`}
        >
          {occasion}
        </button>
      ))}
    </div>
  );
}
