import { useState } from 'react';
import type { Document } from '../types';

interface DeleteModalProps {
  document: Document;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function DeleteModal({ document: doc, onConfirm, onClose }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => {
    if (!deleting) onClose();
  };

  const handleConfirm = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await onConfirm(); // AdminView menampilkan notifikasi dan menutup modal
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <h2 className="font-display font-700 text-[#0f2318] text-lg">Hapus dokumen ini?</h2>
        <p className="text-sm text-slate-600 mt-2">
          <span className="font-semibold text-[#0f2318]">{doc.title}</span> akan dihapus permanen
          dari katalog dan dari Google Drive. Tindakan ini tidak bisa dibatalkan.
        </p>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={deleting}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deleting ? 'Menghapus…' : 'Ya, hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}