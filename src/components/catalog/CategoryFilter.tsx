import { useState } from "react";
import { Button } from "@/components/ui/button";

type Category = {
  id: number;
  name: string;
};

type Props = {
  categories: Category[];
  selected: number | null;
  onChange: (id: number | null) => void;
};

export default function CategoryFilter({ categories, selected, onChange }: Props) {
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? categories : categories.slice(0, 7);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button
          variant={!selected ? "default" : "outline"}
          onClick={() => onChange(null)}
          className="rounded-full"
        >
          Semua
        </Button>

        {visible.map((cat) => (
          <Button
            key={cat.id}
            variant={selected === cat.id ? "default" : "outline"}
            onClick={() => onChange(cat.id)}
            className="rounded-full"
          >
            {cat.name}
          </Button>
        ))}

        {categories.length > 7 && (
          <Button variant="secondary" className="rounded-full" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Tutup" : `+${categories.length - 7}`}
          </Button>
        )}
      </div>
    </div>
  );
}
