import { useState, useMemo } from 'react';
import type { Document } from '../types';
import CategoryBadge from './CategoryBadge';
import Combobox from './Combobox';

interface PublicViewProps {
  documents: Document[];
  categories: string[]; // semua kategori yang ada (otomatis bertambah)
  years: number[]; // tahun dari dokumen yang ada (otomatis bertambah)
  onSelectDocument: (doc: Document) => void;
}

function DocumentCard({ doc, onSelect }: { doc: Document; onSelect: () => void }) {
  const dateFormatted = new Date(doc.dateAdded).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="bg-white border border-green-100 rounded-xl p-5 flex flex-col gap-3 hover:border-brand-400 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-2">
        <CategoryBadge category={doc.category} customCategory={doc.customCategory} />
        <span className="text-xs font-mono text-slate-400 flex-shrink-0">{doc.year}</span>
      </div>
      <h3 className="font-display font-600 text-sm sm:text-[15px] text-[#0f2318] leading-snug group-hover:text-brand-700 transition-colors line-clamp-3">
        {doc.title}
      </h3>
      {doc.description && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{doc.description}</p>
      )}
      <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] text-slate-400 font-mono">{doc.documentNumber}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{dateFormatted}</div>
        </div>
        <button
          onClick={onSelect}
          className="flex items-center gap-1.5 text-xs font-semibold bg-brand-700 text-white px-3 py-1.5 rounded-lg hover:bg-brand-800 transition-colors flex-shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Detail
        </button>
      </div>
    </div>
  );
}

const FILTER_INPUT =
  'w-full px-3 py-2 pr-8 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-white text-slate-700';

export default function PublicView({ documents, categories, years, onSelectDocument }: PublicViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const yearOptions = useMemo(() => years.map(String), [years]);

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch =
        !search ||
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.documentNumber.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || doc.category === categoryFilter;
      const matchYear = !yearFilter || doc.year === Number(yearFilter);
      return matchSearch && matchCategory && matchYear;
    });
  }, [documents, search, categoryFilter, yearFilter]);

  const hasActiveFilter = search || categoryFilter || yearFilter;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-[#185e48] to-[#2b9272] text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-1 h-10 bg-white/40 rounded-full flex-shrink-0 mt-1"></div>
            <div>
              <h1 className="font-display font-700 text-2xl sm:text-3xl tracking-tight">
                Sistem Informasi Dokumen &amp; Arsip Kesehatan Internal
              </h1>
              <p className="text-green-100 text-sm sm:text-base mt-1 max-w-xl">
                Portal resmi dokumentasi dan arsip Dinas Kesehatan Kabupaten Gunungkidul.
                Temukan dan unduh dokumen publik sektor kesehatan dengan mudah.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-[64px] sm:top-[72px] z-30 bg-white border-b border-green-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari judul atau nomor dokumen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-200"
              />
            </div>
            {/* Category filter: bisa diketik atau dipilih dari daftar */}
            <Combobox
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categories}
              allLabel="Semua Kategori"
              className="sm:w-56"
              inputClassName={FILTER_INPUT}
            />
            {/* Year filter: bisa diketik atau dipilih dari daftar */}
            <Combobox
              value={yearFilter}
              onChange={setYearFilter}
              options={yearOptions}
              allLabel="Semua Tahun"
              className="sm:w-36"
              inputClassName={FILTER_INPUT}
            />
            {hasActiveFilter && (
              <button
                onClick={() => { setSearch(''); setCategoryFilter(''); setYearFilter(''); }}
                className="text-sm text-brand-700 hover:text-brand-900 font-medium px-3 py-2 rounded-lg hover:bg-brand-50 transition-colors flex-shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm text-slate-500">
            Menampilkan <strong className="text-slate-700">{filtered.length}</strong> dari {documents.length} dokumen
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-display font-600 text-slate-600 text-lg">Dokumen tidak ditemukan</p>
            <p className="text-sm text-slate-400 mt-1">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onSelect={() => onSelectDocument(doc)} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-green-100 bg-brand-950 text-green-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs">
          <p className="font-semibold text-green-100">SI-DHAKSI — Dinas Kesehatan Kabupaten Gunungkidul</p>
          <p className="mt-1 text-green-400">Sistem Informasi Dokumen &amp; Arsip Kesehatan Internal</p>
          <p className="mt-3 text-[11px] text-green-500">
            &copy; {new Date().getFullYear()} Dinas Kesehatan Kabupaten Gunungkidul
          </p>
        </div>
      </footer>
    </div>
  );
}