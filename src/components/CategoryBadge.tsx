import type { DocumentCategory } from '../types';

const CATEGORY_STYLES: Record<DocumentCategory, string> = {
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

interface CategoryBadgeProps {
  category: DocumentCategory;
  customCategory?: string;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, customCategory, size = 'sm' }: CategoryBadgeProps) {
  const label = category === 'Lainnya' && customCategory ? customCategory : category;
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES['Lainnya'];
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-block font-semibold rounded border uppercase tracking-wide ${style} ${sizeClass}`}>
      {label}
    </span>
  );
}
