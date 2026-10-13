export const DOCUMENT_CATEGORIES = [
  'Renja Dinas Kesehatan',
  'Renstra',
  'KLHS RPJPD - RPJMD',
  'Profil Kesehatan',
  'Laporan Pengendalian',
  'LKJIP',
  'LPPD',
  'ROPK',
  'SIPD',
  'P3DN',
  'Kumpulan Perbub',
  'Surat Edaran',
  'Lainnya',
] as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];

export interface Document {
  id: string;
  title: string;
  category: DocumentCategory;
  customCategory?: string;
  year: number;
  dateAdded: string;
  documentNumber: string;
  description?: string;
  fileUrl: string;
  fileSize: string;
  updatedAt?: string; // penanda versi berkas, dari kolom updated_at
}

export type View = 'public' | 'detail' | 'login' | 'admin';