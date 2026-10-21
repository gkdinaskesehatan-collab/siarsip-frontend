import { useState, useRef, useCallback } from "react"
import type { Document } from "../types"
import type { OrganizationalUnit, UserAccount } from "../types"
import type { DocumentFormData } from "../api"
import Combobox from "./Combobox"

const MAX_FILE_MB = 100
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

interface DocumentModalProps {
  mode: "add" | "edit"
  document?: Document
  categories: string[] // daftar kategori yang sudah ada (dari database)
  user: UserAccount | null
  units: OrganizationalUnit[]
  onSave: (
    data: DocumentFormData,
    onProgress?: (progress: number) => void,
  ) => void | Promise<void>
  onClose: () => void
}

function FileDropZone({
  onChange,
  existingFile,
  disabled,
}: {
  onChange: (file: File | null) => void
  existingFile?: string
  disabled?: boolean
}) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const accept = (selected: File) => {
    if (selected.type !== "application/pdf") {
      alert("Berkas harus berformat PDF.")
      return
    }
    if (selected.size > MAX_FILE_BYTES) {
      alert(`Ukuran berkas melebihi batas maksimum ${MAX_FILE_MB} MB.`)
      return
    }
    setFile(selected)
    onChange(selected)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return
      const dropped = e.dataTransfer.files[0]
      if (dropped) accept(dropped)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, onChange],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) accept(selected)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => {
        if (!disabled) inputRef.current?.click()
      }}
      className={`rounded-xl border-2 border-dashed transition-all p-5 text-center ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${
        dragging
          ? "border-brand-500 bg-brand-50"
          : file
            ? "border-brand-400 bg-brand-50"
            : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleChange}
      />
      {file ? (
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-700 truncate max-w-[220px]">
              {file.name}
            </p>
            <p className="text-xs text-slate-400">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation()
              setFile(null)
              onChange(null)
              if (inputRef.current) inputRef.current.value = ""
            }}
            className="ml-auto text-slate-400 hover:text-red-500 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        <div>
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600">
            {existingFile
              ? "Ganti PDF (opsional)"
              : "Seret & lepas PDF di sini"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            atau klik untuk memilih berkas · Maks. {MAX_FILE_MB} MB
          </p>
          <p className="text-[10px] text-brand-600 font-medium mt-2 flex items-center justify-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Berkas otomatis terunggah ke Google Drive
          </p>
        </div>
      )}
    </div>
  )
}

export default function DocumentModal({
  mode,
  document: existingDoc,
  categories,
  user,
  units,
  onSave,
  onClose,
}: DocumentModalProps) {
  const isEdit = mode === "edit"
  const currentYear = new Date().getFullYear()
  // Tahun berjalan selalu tersedia, mundur sampai 2000
  const yearOptions = Array.from(
    { length: currentYear - 1999 },
    (_, i) => currentYear - i,
  )

  const [title, setTitle] = useState(existingDoc?.title || "")
  const [category, setCategory] = useState(existingDoc?.category || "")
  const [year, setYear] = useState(existingDoc?.year || currentYear)
  const [dateAdded, setDateAdded] = useState(
    existingDoc?.dateAdded || new Date().toISOString().split("T")[0],
  )
  const [documentNumber, setDocumentNumber] = useState(
    existingDoc?.documentNumber || "",
  )
  const [description, setDescription] = useState(existingDoc?.description || "")
  const [file, setFile] = useState<File | null>(null)
  const [organizationalUnitId, setOrganizationalUnitId] = useState<number | "">(
    existingDoc?.organizationalUnitId ?? user?.organizational_unit_id ?? "",
  )
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")

  const handleClose = () => {
    if (!saving) onClose() // jangan tutup modal saat upload masih berjalan
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return

    if (!category.trim()) {
      setError("Kategori wajib diisi. Ketik atau pilih dari daftar.")
      return
    }
    if (!isEdit && !file) {
      setError("Berkas PDF wajib dipilih.")
      return
    }
    if (file && file.size > MAX_FILE_BYTES) {
      setError(`Ukuran berkas melebihi batas ${MAX_FILE_MB} MB.`)
      return
    }
    if (user?.role === "super_admin" && !organizationalUnitId) {
      setError("Unit kerja dokumen wajib dipilih.")
      return
    }

    setSaving(true)
    setUploadProgress(0)
    setError("")
    try {
      await onSave(
        {
          id: existingDoc?.id,
          title: title.trim(),
          category: category.trim(),
          year,
          dateAdded,
          documentNumber: documentNumber.trim(),
          description: description.trim() || undefined,
          fileUrl: existingDoc?.fileUrl ?? "",
          fileSize: existingDoc?.fileSize ?? "",
          organizationalUnitId:
            user?.role === "admin_bidang"
              ? user.organizational_unit_id
              : organizationalUnitId === ""
                ? null
                : organizationalUnitId,
          file,
        },
        setUploadProgress,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan dokumen.")
    } finally {
      setSaving(false)
    }
  }

  const labelClass =
    "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider"
  const inputClass =
    "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-200 transition"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-display font-700 text-[#0f2318] text-lg">
            {isEdit ? "Edit Dokumen" : "Tambah Dokumen Baru"}
          </h2>
          <button
            onClick={handleClose}
            disabled={saving}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className={labelClass}>
              Judul Dokumen <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={saving}
              placeholder="Masukkan judul lengkap dokumen"
              className={inputClass}
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>
              Kategori Katalog <span className="text-red-400">*</span>
            </label>
            <Combobox
              value={category}
              onChange={setCategory}
              options={categories}
              allowCreate
              required
              disabled={saving}
              placeholder="Ketik atau pilih kategori"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Kategori belum ada? Ketik namanya lalu pilih &ldquo;Tambah
              baru&rdquo;. Kategori baru otomatis masuk ke daftar.
            </p>
          </div>

          {/* Year + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                Tahun Terbit <span className="text-red-400">*</span>
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                required
                disabled={saving}
                className={inputClass + " bg-white"}
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Tanggal Input <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={dateAdded}
                onChange={(e) => setDateAdded(e.target.value)}
                required
                disabled={saving}
                className={inputClass}
              />
            </div>
          </div>

          {/* Document number */}
          <div>
            <label className={labelClass}>Nomor Dokumen / SK</label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              disabled={saving}
              placeholder="Contoh: DK/RENJA/2024/001"
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>
              Deskripsi / Ringkasan{" "}
              <span className="text-slate-400 font-normal normal-case">
                (opsional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={saving}
              placeholder="Tuliskan ringkasan singkat isi dokumen…"
              className={inputClass + " resize-none"}
            />
          </div>

          {/* File uploader */}
          {(user?.role === "super_admin" || user?.role === "admin_bidang") && (
            <div>
              <label className={labelClass}>Unit Kerja / Bidang</label>
              {user.role === "super_admin" ? (
                <select
                  value={organizationalUnitId}
                  onChange={(e) =>
                    setOrganizationalUnitId(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  required
                  disabled={saving}
                  className={inputClass + " bg-white"}
                >
                  <option value="">Pilih unit kerja</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={user.organizational_unit ?? "Unit kerja belum diatur"}
                  readOnly
                  className={inputClass + " bg-slate-50 text-slate-500"}
                />
              )}
            </div>
          )}

          {/* File uploader */}
          <div>
            <label className={labelClass}>
              Berkas PDF{" "}
              {isEdit && (
                <span className="text-slate-400 font-normal normal-case">
                  (opsional – kosongkan jika tidak ingin mengganti)
                </span>
              )}
              {!isEdit && <span className="text-red-400"> *</span>}
            </label>
            <FileDropZone
              onChange={setFile}
              existingFile={existingDoc?.fileUrl}
              disabled={saving}
            />
          </div>

          {/* Pesan error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Info saat upload berjalan */}
          {saving && file && (
            <div className="space-y-2" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {uploadProgress < 100
                    ? "Mengirim berkas…"
                    : "Berkas terkirim, menyimpan ke Google Drive…"}
                </span>
                <span className="font-semibold text-brand-700">
                  {uploadProgress}%
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label="Progres unggah berkas"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={uploadProgress}
              >
                <div
                  className="h-full rounded-full bg-brand-500 transition-[width] duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-center text-xs text-slate-500">
                Mohon tunggu dan jangan tutup halaman ini…
              </p>
            </div>
          )}
          {saving && !file && (
            <p
              className="text-xs text-slate-500 text-center"
              aria-live="polite"
            >
              Menyimpan perubahan…
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2 pb-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold bg-[#185e48] text-white rounded-xl hover:bg-[#154c3b] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-4 h-4 ${saving ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {saving ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                ) : isEdit ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-5l-4 4m0 0l-4-4m4 4V4"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                )}
              </svg>
              {saving
                ? file
                  ? "Mengunggah…"
                  : "Menyimpan…"
                : isEdit
                  ? "Perbarui Data"
                  : "Simpan & Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
