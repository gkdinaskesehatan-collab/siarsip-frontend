import type {
  ActivityEntry,
  Document,
  OrganizationalUnit,
  UserAccount,
} from "./types"

const API_URL =
  import.meta.env.VITE_API_URL as string | undefined ??
  "http://127.0.0.1:8000/api"

const API_ORIGIN = new URL(API_URL).origin

const TOKEN_KEY = "siarsip_token"

export const AUTH_EXPIRED_EVENT = "siarsip-auth-expired"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

// Data dari form + file PDF yang dipilih (file boleh kosong saat edit)

export type DocumentFormData = Omit<Document, "id"> & {
  id?: string

  file?: File | null
}

interface ApiCategory {
  id: number

  name: string
}

interface ApiDocument {
  id: number

  title: string

  category_id: number

  custom_category: string | null

  year: number

  date_added: string

  document_number: string

  description: string | null

  file_url: string

  file_size: string

  category?: ApiCategory | null

  organizational_unit_id?: number | null

  created_by?: number | null

  organizational_unit?: OrganizationalUnit | null
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()

  const res = await fetch(`${API_URL}${path}`, {
    ...init,

    headers: {
      Accept: "application/json",

      ...(token ? { Authorization: `Bearer ${token}` } : {}),

      ...(init.headers ?? {}),
    },
  })

  // Token kedaluwarsa atau dicabut: keluarkan admin dari dashboard

  if (res.status === 401 && token) {
    localStorage.removeItem(TOKEN_KEY)

    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
  }

  if (!res.ok) {
    let message = `Permintaan gagal (${res.status})`

    try {
      const body = await res.json()

      if (body.errors) {
        message = Object.values(body.errors as Record<string, string[]>)
          .flat()
          .join(" ")
      } else if (body.message) {
        message = body.message
      }
    } catch {
      // respons bukan JSON, pakai pesan bawaan
    }

    throw new Error(message)
  }

  return res.json() as Promise<T>
}

function withAbsoluteAvatarUrl(user: UserAccount): UserAccount {
  const avatarUrl = user.avatar_url
    ? new URL(user.avatar_url, API_URL)
    : null
  const normalizedAvatarUrl =
    avatarUrl?.pathname.startsWith("/storage/")
      ? new URL(
          `${avatarUrl.pathname}${avatarUrl.search}${avatarUrl.hash}`,
          API_ORIGIN,
        )
      : avatarUrl

  return {
    ...user,

    avatar_url: normalizedAvatarUrl?.toString() ?? null,
  }
}

function uploadRequest<T>(
  path: string,

  body: FormData,

  onProgress?: (progress: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    const token = getToken()

    xhr.open("POST", `${API_URL}${path}`)

    xhr.setRequestHeader("Accept", "application/json")

    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100))
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status === 401 && token) {
        localStorage.removeItem(TOKEN_KEY)

        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
      }

      let response: T | { errors?: Record<string, string[]>; message?: string }

      try {
        response = (JSON.parse(xhr.responseText) as T | {
          errors?: Record<string, string[]>

          message?: string
        })
      } catch {
        reject(
          new Error(
            xhr.status >= 200 && xhr.status < 300
              ? "Respons server tidak valid."
              : `Permintaan gagal (${xhr.status})`,
          ),
        )

        return
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const errorResponse = response as {
          errors?: Record<string, string[]>
          message?: string
        }

        const message = errorResponse.errors
          ? Object.values(errorResponse.errors).flat().join(" ")
          : (errorResponse.message ?? `Permintaan gagal (${xhr.status})`)

        reject(new Error(message))

        return
      }

      resolve(response as T)
    })

    xhr.addEventListener("error", () =>
      reject(new Error("Gagal terhubung ke server saat mengunggah berkas.")),
    )

    xhr.addEventListener("abort", () =>
      reject(new Error("Unggahan berkas dibatalkan.")),
    )

    xhr.send(body)
  })
}

export async function login(
  username: string,
  password: string,
): Promise<UserAccount> {
  const res = await request<{ token: string; user: UserAccount }>("/login", {
    method: "POST",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify({ username, password }),
  })

  localStorage.setItem(TOKEN_KEY, res.token)

  return withAbsoluteAvatarUrl(res.user)
}

export async function fetchCurrentUser(): Promise<UserAccount> {
  return withAbsoluteAvatarUrl(await request<UserAccount>("/me"))
}

export async function updateProfile(data: {
  name: string

  nip: string

  phone: string

  avatar?: File | null
}): Promise<UserAccount> {
  const form = new FormData()

  form.append("_method", "PUT")

  form.append("name", data.name)

  form.append("nip", data.nip)

  form.append("phone", data.phone)

  if (data.avatar) form.append("avatar", data.avatar)

  return withAbsoluteAvatarUrl(
    await uploadRequest<UserAccount>("/me/profile", form),
  )
}

export async function updatePassword(data: {
  current_password: string

  password: string

  password_confirmation: string
}): Promise<void> {
  await request("/me/password", {
    method: "PUT",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify(data),
  })
}

export async function fetchMyActivities(): Promise<ActivityEntry[]> {
  return request<ActivityEntry[]>("/me/activities")
}

export async function fetchAdminUsers(
  params: {
    search?: string

    role?: string

    organizational_unit_id?: number | ""
  } = {},
): Promise<UserAccount[]> {
  const query = new URLSearchParams()

  if (params.search) query.set("search", params.search)

  if (params.role) query.set("role", params.role)

  if (params.organizational_unit_id)
    query.set("organizational_unit_id", String(params.organizational_unit_id))

  return (
    await request<UserAccount[]>(`/admin/users${query.size ? `?${query}` : ""}`)
  ).map(withAbsoluteAvatarUrl)
}

export async function saveAdminUser(
  data: Partial<UserAccount> & { password?: string },

  id?: number,
): Promise<UserAccount> {
  const method = id ? "PUT" : "POST"

  return withAbsoluteAvatarUrl(
    await request<UserAccount>(id ? `/admin/users/${id}` : "/admin/users", {
      method,

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify(data),
    }),
  )
}

export async function setAdminUserStatus(
  id: number,
  is_active: boolean,
): Promise<UserAccount> {
  return withAbsoluteAvatarUrl(
    await request<UserAccount>(`/admin/users/${id}/status`, {
      method: "PATCH",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ is_active }),
    }),
  )
}

export async function resetAdminUserPassword(id: number): Promise<string> {
  const result = await request<{ temporary_password: string }>(
    `/admin/users/${id}/reset-password`,
    {
      method: "POST",
    },
  )

  return result.temporary_password
}

export async function fetchOrganizationalUnits(): Promise<OrganizationalUnit[]> {
  return request<OrganizationalUnit[]>("/admin/units")
}

export async function createOrganizationalUnit(
  name: string,
): Promise<OrganizationalUnit> {
  return request<OrganizationalUnit>("/admin/units", {
    method: "POST",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify({ name }),
  })
}

export async function deleteOrganizationalUnit(id: number): Promise<void> {
  await request(`/admin/units/${id}`, { method: "DELETE" })
}

export async function logout(): Promise<void> {
  try {
    await request("/logout", { method: "POST" })
  } catch {
    // tetap bersihkan token lokal walau server tidak terjangkau
  }

  localStorage.removeItem(TOKEN_KEY)
}

/** Daftar nama kategori dari database. */

export async function fetchCategories(): Promise<string[]> {
  const rows = await request<ApiCategory[]>("/categories")

  return rows.map((c) => c.name)
}

/** Gabungkan daftar kategori, tanpa duplikat (huruf besar/kecil dianggap sama). */

export function mergeCategories(list: string[], extra: string[]): string[] {
  const seen = new Set(list.map((c) => c.trim().toLowerCase()))

  const out = [...list]

  for (const c of extra) {
    const key = c.trim().toLowerCase()

    if (key && !seen.has(key)) {
      seen.add(key)

      out.push(c.trim())
    }
  }

  return out
}

function toDocument(d: ApiDocument): Document {
  return {
    id: String(d.id),

    title: d.title,

    category: d.category?.name ?? "Tanpa Kategori",

    year: Number(d.year),

    dateAdded: d.date_added.slice(0, 10),

    documentNumber: d.document_number,

    description: d.description ?? undefined,

    fileUrl: d.file_url,

    fileSize: `${d.file_size} MB`,

    createdBy: d.created_by ?? null,

    organizationalUnitId: d.organizational_unit_id ?? null,

    organizationalUnit: d.organizational_unit?.name ?? null,
  }
}

// Nama kategori dikirim apa adanya; backend membuat kategori baru bila belum ada.

function buildForm(data: DocumentFormData): FormData {
  const form = new FormData()

  form.append("title", data.title)

  form.append("category", data.category.trim())

  form.append("year", String(data.year))

  form.append("date_added", data.dateAdded)

  form.append("document_number", data.documentNumber || "-")

  form.append("description", data.description ?? "")

  if (data.file) form.append("file", data.file)

  if (data.organizationalUnitId) {
    form.append("organizational_unit_id", String(data.organizationalUnitId))
  }

  return form
}

export async function fetchDocuments(): Promise<Document[]> {
  const rows = await request<ApiDocument[]>("/documents", {
    signal: AbortSignal.timeout(20000),
  })

  return rows.map(toDocument)
}

export async function createDocument(
  data: DocumentFormData,

  onProgress?: (progress: number) => void,
): Promise<Document> {
  if (!data.file) throw new Error("Berkas PDF wajib dipilih.")

  const row = await uploadRequest<ApiDocument>(
    "/documents",
    buildForm(data),
    onProgress,
  )

  return toDocument(row)
}

export async function updateDocument(
  data: DocumentFormData,

  onProgress?: (progress: number) => void,
): Promise<Document> {
  if (!data.id) throw new Error("ID dokumen tidak ditemukan.")

  const form = buildForm(data)

  form.append("_method", "PUT") // PHP tidak membaca file di request PUT, jadi dikirim POST + _method

  const row = await uploadRequest<ApiDocument>(
    `/documents/${data.id}`,
    form,
    onProgress,
  )

  return toDocument(row)
}

export async function deleteDocument(id: string): Promise<void> {
  await request(`/documents/${id}`, { method: "DELETE" })
}

export function documentFileUrl(id: string): string {
  return `${API_URL}/documents/${id}/file`
}
