import { useEffect, useRef, useState } from 'react';
import type { Document, DocumentVersion } from '../types';
import CategoryBadge from './CategoryBadge';
import VisibilityBadge from './VisibilityBadge';
import PdfViewer from './PdfViewer';
import { downloadDocumentFile, documentFileUrl, fetchDocumentVersions, getToken } from '../api';

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']);

function DocumentImagePreview({ src, alt }: { src: string; alt: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const token = getToken();

    fetch(src, {
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Pratinjau gagal dimuat (${response.status}).`);
        return response.blob();
      })
      .then((blob) => {
        if (active) setImageUrl(URL.createObjectURL(blob));
      })
      .catch((reason: unknown) => {
        if (active && !(reason instanceof DOMException && reason.name === 'AbortError')) {
          setError(true);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [src]);

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  if (error) {
    return <p role="alert" className="text-sm text-red-700">Pratinjau gambar gagal dimuat.</p>;
  }
  if (!imageUrl) {
    return <p className="text-sm text-slate-500">Memuat pratinjau…</p>;
  }

  return <img src={imageUrl} alt={alt} className="max-h-[75vh] max-w-full object-contain" />;
}

interface DocumentDetailProps {
  document: Document;
  canUploadVersion: boolean;
  onUploadVersion: (
    id: string,
    file: File,
    onProgress?: (progress: number) => void,
  ) => Promise<void>;
  onBack: () => void;
}

export default function DocumentDetail({
  document: doc,
  canUploadVersion,
  onUploadVersion,
  onBack,
}: DocumentDetailProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [versionError, setVersionError] = useState('');
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const versionInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetchDocumentVersions(doc.id)
      .then((items) => {
        if (active) setVersions(items);
      })
      .catch((error: unknown) => {
        if (active) setVersionError(error instanceof Error ? error.message : 'Riwayat versi gagal dimuat.');
      });
    return () => {
      active = false;
    };
  }, [doc.id, doc.version]);

  // Versi berkas: berubah setiap data/berkas diperbarui, sehingga preview ikut dimuat ulang
  const fileVersion = doc.fileHash ?? doc.fileSize;
  const previewSrc = `${documentFileUrl(doc.id)}?v=${encodeURIComponent(fileVersion)}`;
  const fileSizeMb = Number.parseFloat(doc.fileSize);
  const totalBytes = Number.isFinite(fileSizeMb) ? fileSizeMb * 1024 * 1024 : undefined;
  const fileExtension = doc.originalFilename?.split('.').pop()?.toLowerCase() ?? 'pdf';
  const isPdf = fileExtension === 'pdf';
  const isImage = IMAGE_EXTENSIONS.has(fileExtension);

  const dateFormatted = new Date(doc.dateAdded).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const handleDownload = async () => {
    setDownloadError('');
    if (doc.visibility === 'public') {
      window.location.assign(documentFileUrl(doc.id, true));
      return;
    }

    try {
      const { blob, filename } = await downloadDocumentFile(doc.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = filename ?? `${doc.category}_${doc.title}_${doc.year}_v${doc.version ?? 1}.${fileExtension}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Unduhan gagal.');
    }
  };

  const handleUploadVersion = async () => {
    if (!versionFile || uploadingVersion) return;
    setVersionError('');
    setUploadingVersion(true);
    setUploadProgress(0);
    try {
      await onUploadVersion(doc.id, versionFile, setUploadProgress);
      setVersionFile(null);
      if (versionInput.current) versionInput.current.value = '';
      setVersions(await fetchDocumentVersions(doc.id));
    } catch (error) {
      setVersionError(error instanceof Error ? error.message : 'Unggah versi baru gagal.');
    } finally {
      setUploadingVersion(false);
    }
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
                <CategoryBadge category={doc.category} customCategory={doc.customCategory} fullName={doc.categoryFullName} size="md" />
              </div>

              <dl className="space-y-3 text-sm">
                {doc.categoryFullName && (
                  <div>
                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Lengkap Jenis Dokumen</dt>
                    <dd className="mt-0.5 text-slate-700">{doc.categoryFullName}</dd>
                  </div>
                )}
                {doc.categoryDescription && (
                  <div>
                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Keterangan Jenis Dokumen</dt>
                    <dd className="mt-0.5 text-slate-600 leading-relaxed text-xs">{doc.categoryDescription}</dd>
                  </div>
                )}
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
                <div>
                  <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Akses</dt>
                  <dd className="mt-1">
                    <VisibilityBadge visibility={doc.visibility} />
                  </dd>
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
              {downloadError && <p role="alert" className="mt-2 text-xs text-red-600">{downloadError}</p>}

              <div className="mt-5 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Versi dokumen · v{doc.version ?? 1}
                </h3>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                  <li>v{doc.version ?? 1} (aktif) · {doc.originalFilename ?? 'Berkas saat ini'}</li>
                  {versions.map((item) => (
                    <li key={item.version}>
                      v{item.version} · {item.original_filename ?? item.storage_filename ?? 'Berkas terdahulu'}
                    </li>
                  ))}
                </ul>
                {versionError && <p role="alert" className="mt-2 text-xs text-red-600">{versionError}</p>}
                {canUploadVersion && (
                  <div className="mt-3 space-y-2">
                    <input
                      ref={versionInput}
                      type="file"
                      disabled={uploadingVersion}
                      onChange={(event) => {
                        const selected = event.target.files?.[0] ?? null;
                        if (selected && selected.size > MAX_FILE_BYTES) {
                          setVersionError('Ukuran berkas melebihi batas maksimum 50 MB.');
                          setVersionFile(null);
                          event.target.value = '';
                          return;
                        }
                        setVersionError('');
                        setVersionFile(selected);
                      }}
                      className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-green-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-green-800"
                    />
                    <p className="text-xs text-slate-500">Semua format berkas · Maks. 50 MB</p>
                    <button
                      type="button"
                      onClick={() => void handleUploadVersion()}
                      disabled={!versionFile || uploadingVersion}
                      className="w-full rounded-xl border border-[#185e48] px-4 py-2.5 text-sm font-semibold text-[#185e48] transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadingVersion ? `Mengunggah versi baru… ${uploadProgress}%` : 'Unggah Versi Baru'}
                    </button>
                  </div>
                )}
              </div>
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
                      <p className="text-[10px] text-slate-400">{fileExtension.toUpperCase()} · {doc.fileSize}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isPdf && (
                      <button
                        type="button"
                        onClick={() => setSearchOpen((v) => !v)}
                        aria-pressed={searchOpen}
                        className={`text-xs font-semibold flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg ${
                          searchOpen
                            ? 'bg-brand-100 text-brand-800 shadow-sm ring-1 ring-brand-300'
                            : 'text-brand-700 hover:bg-brand-50 hover:text-brand-900'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                        </svg>
                        Cari
                      </button>
                    )}
                    <button
                      onClick={handleDownload}
                      className="text-xs font-semibold text-brand-700 hover:text-brand-900 hover:bg-brand-50 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Unduh
                    </button>
                  </div>
                </div>
              </div>

              {isPdf ? (
                <PdfViewer
                  key={`${doc.id}-${fileVersion}`}
                  src={previewSrc}
                  totalBytes={totalBytes}
                  className="h-[75vh] min-h-[500px]"
                  searchOpen={searchOpen}
                  onSearchOpen={() => setSearchOpen(true)}
                  onSearchClose={() => setSearchOpen(false)}
                />
              ) : isImage ? (
                <div className="flex min-h-[500px] items-center justify-center bg-slate-100 p-4">
                  <DocumentImagePreview
                    src={previewSrc}
                    alt={`Pratinjau ${doc.originalFilename ?? doc.title}`}
                  />
                </div>
              ) : (
                <div className="flex min-h-[500px] flex-col items-center justify-center gap-3 p-6 text-center">
                  <p className="text-sm text-slate-600">
                    Pratinjau tidak tersedia untuk format berkas ini
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleDownload()}
                    className="rounded-lg bg-[#185e48] px-4 py-2 text-sm font-semibold text-white hover:bg-[#154c3b]"
                  >
                    Unduh
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}