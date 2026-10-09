"use client";

/** Prints the current page with the print stylesheet (diploma / MOU). */
export function PrintButton({ label = "Print diploma" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="label no-print bg-gold px-6 py-4 text-night hover:bg-bone">
      {label}
    </button>
  );
}
