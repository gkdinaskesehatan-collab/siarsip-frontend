import type { DocumentCategory } from '../types';

// Warna tetap untuk kategori bawaan
const CATEGORY_STYLES: Record<string, string> = {
  'Renja Dinas Kesehatan': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Renstra': 'bg-teal-100 text-teal-800 border-teal-200',
  'KLHS RPJPD - RPJMD': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Profil Kesehatan': 'bg-green-100 text-green-800 border-green-200',
  'Laporan Pengendalian': 'bg-lime-100 text-lime-800 border-lime-200',
  'LKJIP': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'LPPD': 'bg-teal-100 text-teal-700 border-teal-200',
  'ROPK': 'bg-green-100 text-green-700 border-green-200',
  'SIPD': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'P3DN': 'bg-lime-100 text-lime-700 border-lime-200',
  'Kumpulan Perbub': 'bg-teal-100 text-teal-800 border-teal-200',
  'Surat Edaran': 'bg-sky-100 text-sky-800 border-sky-200',
  'Lainnya': 'bg-slate-100 text-slate-700 border-slate-200',
};

// Kategori baru (misal SOP) mendapat warna dari daftar ini, tetap sama untuk nama yang sama
const EXTRA_PALETTE = [
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-stone-100 text-stone-700 border-stone-200',
];

function styleFor(category: string): string {
  const fixed = CATEGORY_STYLES[category];
  if (fixed) return fixed;
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return EXTRA_PALETTE[hash % EXTRA_PALETTE.length];
}

interface CategoryBadgeProps {
  category: DocumentCategory;
  customCategory?: string;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, customCategory, size = 'sm' }: CategoryBadgeProps) {
  const label = category === 'Lainnya' && customCategory ? customCategory : category;
  const style = styleFor(category);
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-block font-semibold rounded border uppercase tracking-wide ${style} ${sizeClass}`}>
      {label}
    </span>
  );
}