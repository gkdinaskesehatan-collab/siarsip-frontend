import { useEffect, useMemo, useState } from "react"

import { fetchMyActivities, updatePassword, updateProfile } from "../api"

import type { ActivityEntry, UserAccount } from "../types"

type Section = "profile" | "security" | "activity"

const roleLabels = {
  super_admin: "Super Admin",

  admin_bidang: "Admin Bidang / Pengelola Arsip",

  viewer: "Staf / Viewer",
}

export default function AccountSettingsView({
  user,

  onUserUpdated,
}: {
  user: UserAccount

  onUserUpdated: (user: UserAccount) => void
}) {
  const [section, setSection] = useState<Section>("profile")

  const [name, setName] = useState(user.name)

  const [nip, setNip] = useState(user.nip ?? "")

  const [phone, setPhone] = useState(user.phone ?? "")

  const [avatar, setAvatar] = useState<File | null>(null)

  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)

  const [activities, setActivities] = useState<ActivityEntry[]>([])

  const [currentPassword, setCurrentPassword] = useState("")

  const [newPassword, setNewPassword] = useState("")

  const [passwordConfirmation, setPasswordConfirmation] = useState("")

  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({})

  const [busy, setBusy] = useState(false)

  const [message, setMessage] = useState("")

  const [error, setError] = useState("")

  const avatarPreview = useMemo(
    () =>
      avatar ? URL.createObjectURL(avatar) : (user.avatar_url ?? undefined),

    [avatar, user.avatar_url],
  )

  useEffect(() => {
    setAvatarLoadFailed(false)
  }, [avatarPreview])

  useEffect(() => {
    if (!avatar) return

    return () => URL.revokeObjectURL(avatarPreview ?? "")
  }, [avatar, avatarPreview])

  useEffect(() => {
    if (section !== "activity") return

    fetchMyActivities()

      .then(setActivities)

      .catch((e: Error) => setError(e.message))
  }, [section])

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault()

    setBusy(true)

    setMessage("")

    setError("")

    try {
      const updated = await updateProfile({ name, nip, phone, avatar })

      onUserUpdated(updated)

      setAvatar(null)

      setMessage("Profil berhasil diperbarui.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memperbarui profil.")
    } finally {
      setBusy(false)
    }
  }

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault()

    setBusy(true)

    setMessage("")

    setError("")

    try {
      await updatePassword({
        current_password: currentPassword,

        password: newPassword,

        password_confirmation: passwordConfirmation,
      })

      setCurrentPassword("")

      setNewPassword("")

      setPasswordConfirmation("")

      setMessage("Kata sandi berhasil diperbarui.")

      if (section === "activity") setActivities(await fetchMyActivities())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memperbarui kata sandi.")
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200 disabled:bg-slate-50"

  const labelClass =
    "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"

  return (
    <main className="min-h-screen bg-[#f5f9f7] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-700 text-[#0f2318]">
            Pengaturan Akun
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola profil dan keamanan akun Anda.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <nav className="flex gap-2 overflow-x-auto md:flex-col">
            {([
              ["profile", "Profil Pengguna"],

              ["security", "Keamanan Akun"],

              ["activity", "Riwayat Aktivitas"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSection(key)
                  setError("")
                  setMessage("")
                }}
                className={`whitespace-nowrap rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                  section === key
                    ? "bg-[#185e48] text-white"
                    : "bg-white text-slate-600 hover:bg-brand-50"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <section className="min-w-0 rounded-2xl border border-green-100 bg-white p-5 shadow-sm sm:p-7">
            {message && (
              <p
                role="status"
                className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800"
              >
                {message}
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {section === "profile" && (
              <form onSubmit={saveProfile} className="space-y-4">
                <h2 className="mb-4 text-lg font-semibold text-[#0f2318]">
                  Profil Pengguna
                </h2>
                <div className="flex items-center gap-4">
                  {avatarPreview && !avatarLoadFailed && (
                    <img
                      src={avatarPreview}
                      alt=""
                      className="h-16 w-16 rounded-full bg-slate-100 object-cover"
                      onError={() => setAvatarLoadFailed(true)}
                    />
                  )}
                  {(!avatarPreview || avatarLoadFailed) && (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
                      {user.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <label className="text-sm font-medium text-brand-700">
                    Pilih foto profil
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="mt-1 block max-w-full text-xs text-slate-500"
                      onChange={(event) =>
                        setAvatar(event.target.files?.[0] ?? null)
                      }
                      disabled={busy}
                    />
                    <span className="text-xs font-normal text-slate-400">
                      JPG, PNG, atau WebP · maks. 2 MB
                    </span>
                  </label>
                </div>
                <div>
                  <label className={labelClass}>Nama Lengkap</label>
                  <input
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
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
                    <label className={labelClass}>Nomor Telepon</label>
                    <input
                      className={inputClass}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={busy}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Unit Kerja / Bidang</label>
                    <input
                      className={inputClass}
                      value={user.organizational_unit ?? "Belum ditetapkan"}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Peran / Role</label>
                    <input
                      className={inputClass}
                      value={roleLabels[user.role]}
                      readOnly
                    />
                  </div>
                </div>
                <button
                  disabled={busy}
                  className="rounded-xl bg-[#185e48] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? "Menyimpan…" : "Simpan Profil"}
                </button>
              </form>
            )}

            {section === "security" && (
              <form onSubmit={savePassword} className="max-w-xl space-y-4">
                <h2 className="mb-4 text-lg font-semibold text-[#0f2318]">
                  Ubah Kata Sandi
                </h2>
                {([
                  [
                    "Kata Sandi Saat Ini",
                    currentPassword,
                    setCurrentPassword,
                    "current-password",
                  ],

                  [
                    "Kata Sandi Baru",
                    newPassword,
                    setNewPassword,
                    "new-password",
                  ],

                  [
                    "Konfirmasi Kata Sandi Baru",
                    passwordConfirmation,
                    setPasswordConfirmation,
                    "new-password",
                  ],
                ] as const).map(([label, value, setter, autocomplete]) => (
                  <div key={label}>
                    <label className={labelClass}>{label}</label>
                    <div className="relative">
                      <input
                        type={visiblePasswords[label] ? "text" : "password"}
                        autoComplete={autocomplete}
                        className={inputClass + " pr-24"}
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        required
                        minLength={8}
                        disabled={busy}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setVisiblePasswords((visible) => ({
                            ...visible,
                            [label]: !visible[label],
                          }))
                        }
                        aria-label={
                          visiblePasswords[label]
                            ? `Sembunyikan ${label.toLowerCase()}`
                            : `Tampilkan ${label.toLowerCase()}`
                        }
                        aria-pressed={Boolean(visiblePasswords[label])}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-700"
                      >
                        {visiblePasswords[label] ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-500">
                  Minimal 8 karakter, wajib mengandung huruf dan angka.
                </p>
                <button
                  disabled={busy}
                  className="rounded-xl bg-[#185e48] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? "Memverifikasi…" : "Ubah Kata Sandi"}
                </button>
              </form>
            )}

            {section === "activity" && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-[#0f2318]">
                  10 Aktivitas Terakhir
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
                      <tr>
                        <th className="px-3 py-3">Aktivitas</th>
                        <th className="px-3 py-3">Waktu</th>
                        <th className="px-3 py-3">Alamat IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activities.map((activity) => (
                        <tr key={activity.id}>
                          <td className="px-3 py-3 text-slate-700">
                            {activity.description}
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-500">
                            {new Date(activity.created_at).toLocaleString(
                              "id-ID",
                            )}
                          </td>
                          <td className="px-3 py-3 font-mono text-xs text-slate-500">
                            {activity.ip_address ?? "—"}
                          </td>
                        </tr>
                      ))}
                      {activities.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-3 py-8 text-center text-slate-400"
                          >
                            Belum ada aktivitas tercatat.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
