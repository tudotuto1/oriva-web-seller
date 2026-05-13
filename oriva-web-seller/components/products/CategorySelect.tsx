"use client";

import type { Category } from "@/lib/categories";

interface CategorySelectProps {
  categories: Category[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

const NONE = "__none__";

export default function CategorySelect({
  categories,
  value,
  onChange,
  disabled,
}: CategorySelectProps) {
  return (
    <select
      value={value ?? NONE}
      onChange={(e) => onChange(e.target.value === NONE ? null : e.target.value)}
      disabled={disabled}
      className="oriva-input appearance-none cursor-pointer"
    >
      <option value={NONE}>— Aucune catégorie —</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name_fr}
        </option>
      ))}
    </select>
  );
}
