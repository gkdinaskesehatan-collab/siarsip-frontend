import { useCallback, useEffect, useRef, useState } from "react"

import {
  createOrganizationalUnit,
  deleteOrganizationalUnit,
  fetchAdminUsers,
  fetchOrganizationalUnits,
  resetAdminUserPassword,
  saveAdminUser,
  setAdminUserStatus,
} from "../api"

import type { OrganizationalUnit, UserAccount, UserRole } from "../types"

const roles: { value: UserRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },

  { value: "admin_bidang", label: "Admin Bidang / Pengelola Arsip" },

  { value: "viewer", label: "Staf / Viewer" },
]

function UserForm({
  user,

  units,

  onClose,

  onSaved,
}: {
  user: UserAccount | null

  units: OrganizationalUnit[]

  onClose: () => void

  onSaved: () => Promise<void>
}) {
  const [name, setName] = useState(user?.name ?? "")

  const [nip, setNip] = useState(user?.nip ?? "")

  const [email, setEmail] = useState(user?.email ?? "")

  const [unitId, setUnitId] = useState<number | "">(
    user?.organizational_unit_id ?? "",
  )

  const [role, setRole] = useState<UserRole>(user?.role ?? "viewer")

  const [password, setPassword] = useState("")

  const [passwordVisible, setPasswordVisible] = useState(false)

  const [busy, setBusy] = useState(false)

  const [error, setError] = useState("")

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    setBusy(true)

    setError("")

    try {
      await saveAdminUser(
        {
          name,

          nip: nip || null,

          email,

          organizational_unit_id: unitId === "" ? null : unitId,

          role,

          ...(user ? {} : { password }),
        },
        user?.id,
      )

      await onSaved()

      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan akun.")
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200 disabled:bg-slate-50"

  const labelClass =
    "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <form
        onSubmit={submit}
        className="relative max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-[#0f2318]">
          {user ? "Edit Pengguna" : "Tambah Pengguna"}
        </h2>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <div>
          <label className={labelClass}>Nama Lengkap</label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={255}
            disabled={busy}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>NIP</label>
            <input
              className={inputClass}
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              disabled={busy}
            />
          </div>
          <div>
            <label className={labelClass}>Email Instansi</label>
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Unit Kerja / Bidang</label>
          <select
            className={inputClass + " bg-white"}
            value={unitId}
            onChange={(e) =>
              setUnitId(e.target.value ? Number(e.target.value) : "")
            }
            required
            disabled={busy}
          >
            <option value="">Pilih unit kerja</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
          {units.length === 0 && (
            <p className="mt-1 text-xs text-amber-700">
              Tambahkan unit kerja sebelum membuat akun.
            </p>
          )}
        </div>
        <div>
          <label className={labelClass}>Peran</label>
          <select
            className={inputClass + " bg-white"}
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={busy}
          >
            {roles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        {!user && (
          <div>
            <label className={labelClass}>Kata Sandi Default</label>
            <div className="relative">
              <input
                className={inputClass + " pr-24"}
                type={passwordVisible ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                disabled={busy}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-label={
                  passwordVisible
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
                aria-pressed={passwordVisible}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-700"
              >
                {passwordVisible ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Minimal 8 karakter, mengandung huruf dan angka.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Batal
          </button>
          <button
            disabled={busy || units.length === 0}
            className="rounded-lg bg-[#185e48] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function UserManagementView({
  currentUser,

  units,

  onUnitsChanged,
}: {
  currentUser: UserAccount

  units: OrganizationalUnit[]

  onUnitsChanged: (units: OrganizationalUnit[]) => void
}) {
  const [users, setUsers] = useState<UserAccount[]>([])

  const [search, setSearch] = useState("")

  const [roleFilter, setRoleFilter] = useState("")

  const [unitFilter, setUnitFilter] = useState<number | "">("")

  const [editingUser, setEditingUser] =
    useState<UserAccount | null | undefined>(undefined)

  const [newUnit, setNewUnit] = useState("")

  const [temporaryPassword, setTemporaryPassword] = useState<{
    name: string
    password: string
  } | null>(null)

  const [error, setError] = useState("")

  const [notice, setNotice] = useState("")

  const [loading, setLoading] = useState(true)

  const requestSequence = useRef(0)

  const reloadUsers = useCallback(async () => {
    const sequence = ++requestSequence.current

    setLoading(true)

    try {
      const list = await fetchAdminUsers({
        search,

        role: roleFilter,

        organizational_unit_id: unitFilter,
      })

      if (sequence !== requestSequence.current) return

      setUsers(list)

      setError("")
    } catch (e) {
      if (sequence !== requestSequence.current) return

      setError(e instanceof Error ? e.message : "Gagal memuat pengguna.")
    } finally {
      if (sequence === requestSequence.current) setLoading(false)
    }
  }, [search, roleFilter, unitFilter])

  useEffect(() => {
    void reloadUsers()
  }, [reloadUsers])

  const reloadUnits = async () => {
    const rows = await fetchOrganizationalUnits()

    onUnitsChanged(rows)
  }

  const addUnit = async (event: React.FormEvent) => {
    event.preventDefault()

    setError("")

    try {
      await createOrganizationalUnit(newUnit.trim())

      setNewUnit("")

      await reloadUnits()

      setNotice("Unit kerja berhasil ditambahkan.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menambahkan unit kerja.")
    }
  }

  const removeUnit = async (unit: OrganizationalUnit) => {
    if (!window.confirm(`Hapus unit kerja "${unit.name}"?`)) return

    setError("")

    try {
      await deleteOrganizationalUnit(unit.id)

      await reloadUnits()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus unit kerja.")
    }
  }

  const changeStatus = async (user: UserAccount) => {
    const nextStatus = !user.is_active

    if (
      !window.confirm(
        `${nextStatus ? "Aktifkan" : "Nonaktifkan"} akun ${user.name}?`,
      )
    )
      return

    setError("")

    try {
      await setAdminUserStatus(user.id, nextStatus)

      await reloadUsers()
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Gagal memperbarui status akun.",
      )
    }
  }

  const resetPassword = async (user: UserAccount) => {
    if (!window.confirm(`Buat kata sandi sementara baru untuk ${user.name}?`))
      return

    setError("")

    setTemporaryPassword(null)

    try {
      const password = await resetAdminUserPassword(user.id)

      setTemporaryPassword({ name: user.name, password })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mereset kata sandi.")
    }
  }

  const copyTemporaryPassword = async () => {
    if (!temporaryPassword) return

    try {
      await navigator.clipboard.writeText(temporaryPassword.password)

      setNotice("Kata sandi sementara berhasil disalin.")
    } catch {
      setError("Tidak dapat menyalin kata sandi. Silakan salin secara manual.")
    }
  }

  const roleName = (role: UserRole) =>
    roles.find((item) => item.value === role)?.label ?? role

  const inputClass =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"

  return (
    <main className="min-h-screen bg-[#f5f9f7] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-700 text-[#0f2318]">
              Manajemen Pengguna & Hak Akses
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Pendaftaran publik tidak tersedia. Buat akun pegawai melalui
              halaman ini.
            </p>
          </div>
          <button
            onClick={() => setEditingUser(null)}
            className="rounded-xl bg-[#185e48] px-4 py-2.5 text-sm font-semibold text-white"
          >
            + Tambah Pengguna
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800"
          >
            {notice}
          </p>
        )}
        {temporaryPassword && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Kata sandi sementara untuk {temporaryPassword.name}
              </p>
              <p className="mt-1 select-all font-mono text-lg text-amber-950">
                {temporaryPassword.password}
              </p>
              <p className="mt-1 text-xs text-amber-800">
                Simpan sekarang. Kata sandi hanya ditampilkan pada kesempatan
                ini.
              </p>
            </div>
            <button
              onClick={() => void copyTemporaryPassword()}
              className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900"
            >
              Salin
            </button>
          </div>
        )}

        <section className="mb-6 rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-[#0f2318]">
            Daftar Unit Kerja / Bidang
          </h2>
          <form onSubmit={addUnit} className="mb-4 flex flex-wrap gap-2">
            <input
              className={inputClass + " min-w-[220px] flex-1"}
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder="Nama unit kerja baru"
              required
              maxLength={255}
            />
            <button className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-800">
              Tambah Unit
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            {units.map((unit) => (
              <span
                key={unit.id}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                {unit.name}
                <button
                  aria-label={`Hapus ${unit.name}`}
                  onClick={() => void removeUnit(unit)}
                  className="text-slate-400 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
            {units.length === 0 && (
              <p className="text-sm text-amber-700">
                Belum ada unit kerja. Tambahkan unit sebelum membuat pengguna.
              </p>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
            <input
              className={inputClass + " min-w-[220px] flex-1"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NIP, atau email"
            />
            <select
              className={inputClass}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Semua role</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              value={unitFilter}
              onChange={(e) =>
                setUnitFilter(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">Semua bidang</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Foto</th>
                  <th className="px-4 py-3">Nama Lengkap</th>
                  <th className="px-4 py-3">NIP</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Unit Kerja / Bidang</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                          {user.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.nip || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.organizational_unit || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {roleName(user.role)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {user.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => void changeStatus(user)}
                          disabled={user.id === currentUser.id}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-40"
                        >
                          {user.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button
                          onClick={() => void resetPassword(user)}
                          disabled={user.id === currentUser.id}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                        >
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && users.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      Tidak ada pengguna yang cocok.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      Memuat data pengguna…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-400">
            Menampilkan {users.length} akun
          </div>
        </section>
      </div>

      {editingUser !== undefined && (
        <UserForm
          user={editingUser}
          units={units}
          onClose={() => setEditingUser(undefined)}
          onSaved={reloadUsers}
        />
      )}
    </main>
  )
}
