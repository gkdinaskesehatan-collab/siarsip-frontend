// Daftar kategori awal (dipakai sebagai cadangan sebelum data dari server dimuat).
// Kategori baru yang ditambahkan admin tersimpan di database, bukan di sini.
export const DOCUMENT_CATEGORIES = [
  "Renja",
  "Renstra",
  "KLHS RPJPD/RPJMD",
  "Profil Kesehatan",
  "POK",
  "LKJIP",
  "LPPD",
  "ROPK",
  "SIPD",
  "P3DN",
  "Perbup",
  "SE",
  "SOP",
] as const

// Kategori sekarang bebas (bisa bertambah), jadi tipenya string.
export type DocumentCategory = string

export interface Document {
  id: string
  title: string
  category: DocumentCategory
  categoryFullName?: string
  categoryDescription?: string
  customCategory?: string // tidak dipakai lagi, dibiarkan agar komponen lama tidak error
  year: number
  dateAdded: string
  documentNumber: string
  description?: string
  fileUrl: string
  fileSize: string
  version?: number
  originalFilename?: string | null
  createdBy?: number | null
  organizationalUnitId?: number | null
  organizationalUnit?: string | null
  visibility: DocumentVisibility
  fileHash?: string | null
  publicAnonymizationConfirmed?: boolean
}

export type UserRole =
  | "administrator"
  | "pengelola_arsip"
  | "pegawai_unit"
  | "super_admin"
  | "admin_bidang"
  | "viewer"

export type DocumentVisibility = "public" | "internal" | "secret"

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

export interface DocumentVersion {
  version: number
  original_filename: string | null
  storage_filename: string | null
  file_hash: string | null
  file_size: string
  created_at: string
}

export type View =
  | "public"
  | "internal"
  | "detail"
  | "login"
  | "admin"
  | "account"
  | "users"
  | "verify"
