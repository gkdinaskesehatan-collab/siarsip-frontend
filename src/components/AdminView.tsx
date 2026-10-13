import { useState } from 'react';
import type { ComponentType } from 'react';
import type { Document } from '../types';
import { DOCUMENT_CATEGORIES } from '../types';
import CategoryBadge from './CategoryBadge';
import DocumentModal from './DocumentModal';
import DeleteModal from './DeleteModal';
import type { DocumentFormData } from '../api';

const DeleteModalView = DeleteModal as unknown as ComponentType<{
  document: Document;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}>;

interface AdminViewProps {
  documents: Document[];
  onAdd: (data: DocumentFormData) => Promise<void>;
  onUpdate: (data: DocumentFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewDocument: (doc: Document) => void;
}

type Modal = null | { type: 'add' } | { type: 'edit'; doc: Document } | { type: 'delete'; doc: Document };

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-green-100 p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <div className="font-display font-700 text-2xl text-[#0f2318]">{value}</div>
        <div className="text-xs text-slate-500 font-medium mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default function AdminView({ documents, onAdd, onUpdate, onDelete, onViewDocument }: AdminViewProps) {
  const [modal, setModal] = useState<Modal>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [toast, setToast] = useState('');
  const [toastError, setToastError] = useState(false);
  const showToast = (msg: string, isError = false) => {
    setToast(msg);
    setToastError(isError);
    setTimeout(() => setToast(''), isError ? 5000 : 3000);
  };

  const filtered = documents.filter((doc) => {
    const matchSearch =
      !search ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || doc.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleSave = async (data: DocumentFormData) => {
    // Kalau gagal, error dilempar ke DocumentModal: modal tetap terbuka dan pesan tampil di sana
    if (modal?.type === 'edit' && data.id) {
      await onUpdate(data);
      showToast('Dokumen berhasil diperbarui.');
    } else {
      await onAdd(data);
      showToast('Dokumen berhasil ditambahkan.');
    }
    setModal(null);
  };

  const handleDelete = async () => {
    if (modal?.type !== 'delete') return;
    try {
      await onDelete(modal.doc.id);
      showToast('Dokumen berhasil dihapus.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus dokumen.', true);
    }
    setModal(null);
  };

  // Stats
  const totalDocs = documents.length;
  const categoryCounts = DOCUMENT_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = documents.filter((d) => d.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryCounts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const dateFormatted = (str: string) =>
    new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#f5f9f7]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-24 right-4 z-50 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in ${toastError ? 'bg-red-600' : 'bg-[#185e48]'}`}>
          <svg className="w-4 h-4 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="font-display font-700 text-2xl text-[#0f2318]">Dashboard Admin</h1>
            <p className="text-sm text-slate-500 mt-0.5">Kelola dokumen arsip Dinas Kesehatan Gunungkidul</p>
          </div>
          <button
            onClick={() => setModal({ type: 'add' })}
            className="flex items-center gap-2 bg-[#185e48] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#154c3b] transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Dokumen
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Dokumen"
            value={totalDocs}
            color="bg-brand-100 text-brand-700"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          {topCategories.slice(0, 3).map(([cat, count]) => (
            <StatCard
              key={cat}
              label={cat}
              value={count}
              color="bg-teal-100 text-teal-700"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              }
            />
          ))}
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-2xl border border-green-100 p-5 mb-6">
          <h2 className="font-display font-600 text-[#0f2318] text-base mb-4">Distribusi Dokumen per Kategori</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {DOCUMENT_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const pct = totalDocs > 0 ? Math.round((count / totalDocs) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-600 truncate">{cat}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-brand-700 flex-shrink-0">{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Document table */}
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <h2 className="font-display font-600 text-[#0f2318] text-base">Daftar Dokumen</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari dokumen…"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-400"
                />
              </div>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:border-brand-400 bg-white text-slate-600 sm:w-36"
              >
                <option value="">Semua</option>
                {DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 w-8">No</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Judul</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Kategori</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Tahun</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Tgl Input</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-slate-400">
                      Tidak ada dokumen yang cocok.
                    </td>
                  </tr>
                ) : (
                  filtered.map((doc, idx) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => onViewDocument(doc)}
                          className="text-left font-medium text-[#0f2318] hover:text-brand-700 transition-colors line-clamp-2 text-sm leading-snug"
                        >
                          {doc.title}
                        </button>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.documentNumber}</div>
                        <div className="sm:hidden mt-1">
                          <CategoryBadge category={doc.category} customCategory={doc.customCategory} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <CategoryBadge category={doc.category} customCategory={doc.customCategory} />
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-sm text-slate-600 font-semibold">{doc.year}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-slate-500">{dateFormatted(doc.dateAdded)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewDocument(doc)}
                            title="Lihat"
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setModal({ type: 'edit', doc })}
                            title="Edit"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setModal({ type: 'delete', doc })}
                            title="Hapus"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex items-center justify-between">
            <span>Menampilkan {filtered.length} dari {documents.length} dokumen</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'add' && (
        <DocumentModal mode="add" onSave={handleSave} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'edit' && (
        <DocumentModal mode="edit" document={modal.doc} onSave={handleSave} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'delete' && (
        <DeleteModalView document={modal.doc} onConfirm={handleDelete} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
