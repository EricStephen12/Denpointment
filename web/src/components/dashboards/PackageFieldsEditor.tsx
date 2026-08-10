"use client";

import { useState } from "react";

export type PackageDraft = {
  title: string;
  price: string;
  desc: string;
};

const MAX_PACKAGES = 12;

type Props = {
  initial: PackageDraft[];
};

export default function PackageFieldsEditor({ initial }: Props) {
  const [rows, setRows] = useState<PackageDraft[]>(() =>
    initial.length > 0
      ? initial
      : [
          { title: "", price: "", desc: "" },
          { title: "", price: "", desc: "" },
          { title: "", price: "", desc: "" },
        ],
  );

  function update(index: number, field: keyof PackageDraft, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    if (rows.length >= MAX_PACKAGES) return;
    setRows((prev) => [...prev, { title: "", price: "", desc: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => {
      if (prev.length <= 1) {
        return [{ title: "", price: "", desc: "" }];
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-sand-50/40">
        Prices are in Nigerian Naira (₦). Fill title, price, and description for each package.
        Empty rows are skipped. You can add up to {MAX_PACKAGES}.
      </p>

      <div className="space-y-6">
        {rows.map((pkg, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 border-t border-sand-50/10 pt-4">
            <div className="md:col-span-6 flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wider text-sand-50/40">Package {i + 1}</p>
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-xs text-sand-50/40 hover:text-red-300 transition-colors"
              >
                Remove
              </button>
            </div>
            <div className="md:col-span-2">
              <label htmlFor={`pkgTitle${i}`} className="block text-xs font-medium text-sand-50/50 mb-1">
                Title
              </label>
              <input
                id={`pkgTitle${i}`}
                name={`pkgTitle${i}`}
                value={pkg.title}
                onChange={(e) => update(i, "title", e.target.value)}
                maxLength={40}
                className="dash-input"
                placeholder="e.g. THE ESSENTIAL"
              />
            </div>
            <div className="md:col-span-1">
              <label htmlFor={`pkgPrice${i}`} className="block text-xs font-medium text-sand-50/50 mb-1">
                Price (₦)
              </label>
              <input
                id={`pkgPrice${i}`}
                name={`pkgPrice${i}`}
                type="number"
                min={0}
                value={pkg.price}
                onChange={(e) => update(i, "price", e.target.value)}
                className="dash-input"
              />
            </div>
            <div className="md:col-span-3">
              <label htmlFor={`pkgDesc${i}`} className="block text-xs font-medium text-sand-50/50 mb-1">
                Description
              </label>
              <input
                id={`pkgDesc${i}`}
                name={`pkgDesc${i}`}
                value={pkg.desc}
                onChange={(e) => update(i, "desc", e.target.value)}
                maxLength={200}
                className="dash-input"
                placeholder="What’s included"
              />
            </div>
          </div>
        ))}
      </div>

      {rows.length < MAX_PACKAGES && (
        <button
          type="button"
          onClick={addRow}
          className="border border-sand-50/20 text-sand-50/70 py-2 px-4 rounded-lg text-sm hover:bg-sand-50/8 transition-colors"
        >
          Add package
        </button>
      )}
    </div>
  );
}
