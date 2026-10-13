import { useState } from 'react';
import type { Document } from '../types';
import CategoryBadge from './CategoryBadge';
import PdfViewer from './PdfViewer';
import { documentFileUrl } from '../api';

interface DocumentDetailProps {
  document: Document;
  onBack: () => void;
}

export default function DocumentDetail({ document: doc, onBack }: DocumentDetailProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  // Versi berkas: berubah setiap data/berkas diperbarui, sehingga preview ikut dimuat ulang
  const fileVersion = doc.updatedAt ?? doc.fileSize;
  const previewSrc = `${documentFileUrl(doc.id)}?v=${encodeURIComponent(fileVersion)}`;

  const dateFormatted = new Date(doc.dateAdded).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const handleDownload = () => {
    window.open(doc.fileUrl.replace('/preview', '/view'), '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f7faf9]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm">
          <button onClick={onBack} className="text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Katalog
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 truncate max-w-xs">{doc.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Metadata */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-2xl border border-green-100 p-6 shadow-sm sticky top-[84px]">
              <h2 className="font-display font-700 text-[#0f2318] text-lg leading-snug mb-4">
                {doc.title}
              </h2>

              <div className="mb-4">
                <CategoryBadge category={doc.category} customCategory={doc.customCategory} size="md" />
              </div>

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nomor Dokumen</dt>
                  <dd className="mt-0.5 font-mono text-slate-700 text-xs">{doc.documentNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tahun Terbit</dt>
                  <dd className="mt-0.5 font-semibold text-slate-700">{doc.year}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal Input</dt>
                  <dd className="mt-0.5 text-slate-700">{dateFormatted}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ukuran Berkas</dt>
                  <dd className="mt-0.5 text-slate-700">{doc.fileSize}</dd>
                </div>
                {doc.description && (
                  <div className="pt-2 border-t border-slate-100">
                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Deskripsi</dt>
                    <dd className="text-slate-600 leading-relaxed text-xs">{doc.description}</dd>
                  </div>
                )}
              </dl>

              <button
                onClick={handleDownload}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-[#185e48] text-white text-sm font-semibold py-3 px-4 rounded-xl hover:bg-[#154c3b] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Unduh Berkas ({doc.fileSize})
              </button>
            </div>
          </div>

          {/* Right: PDF viewer */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="border-b border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate max-w-[200px] sm:max-w-sm">{doc.title}</p>
                      <p className="text-[10px] text-slate-400">PDF · {doc.fileSize}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setSearchOpen((v) => !v)}
                      aria-pressed={searchOpen}
                      className={`text-xs font-semibold flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg ${
                        searchOpen
                          ? 'bg-brand-100 text-brand-800'
                          : 'text-brand-700 hover:bg-brand-50 hover:text-brand-900'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                      </svg>
                      Cari
                    </button>
                    <button
                      onClick={handleDownload}
                      className="text-xs font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1 transition-colors px-2 py-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Unduh
                    </button>
                  </div>
                </div>
              </div>

              {/* PDF preview */}
              <PdfViewer
                key={`${doc.id}-${fileVersion}`}
                src={previewSrc}
                className="h-[75vh] min-h-[500px]"
                searchOpen={searchOpen}
                onSearchOpen={() => setSearchOpen(true)}
                onSearchClose={() => setSearchOpen(false)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}