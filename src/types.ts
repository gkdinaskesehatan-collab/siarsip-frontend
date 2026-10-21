// Daftar kategori awal (dipakai sebagai cadangan sebelum data dari server dimuat).
// Kategori baru yang ditambahkan admin tersimpan di database, bukan di sini.
export const DOCUMENT_CATEGORIES = [
  "Renja Dinas Kesehatan",
  "Renstra",
  "KLHS RPJPD - RPJMD",
  "Profil Kesehatan",
  "Laporan Pengendalian",
  "LKJIP",
  "LPPD",
  "ROPK",
  "SIPD",
  "P3DN",
  "Kumpulan Perbub",
  "Surat Edaran",
] as const

// Kategori sekarang bebas (bisa bertambah), jadi tipenya string.
export type DocumentCategory = string

export interface Document {
  id: string
  title: string
  category: DocumentCategory
  customCategory?: string // tidak dipakai lagi, dibiarkan agar komponen lama tidak error
  year: number
  dateAdded: string
  documentNumber: string
  description?: string
  fileUrl: string
  fileSize: string
  createdBy?: number | null
  organizationalUnitId?: number | null
  organizationalUnit?: string | null
}

export type UserRole = "super_admin" | "admin_bidang" | "viewer"

export interface UserAccount {
  id: number
  name: string
  username?: string
  email: string
  nip: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  organizational_unit_id: number | null
  organizational_unit: string | null
}

export interface OrganizationalUnit {
  id: number
  name: string
}

export interface ActivityEntry {
  id: number
  description: string
  ip_address: string | null
  created_at: string
}

export type View = "public" | "detail" | "login" | "admin" | "account" | "users"
