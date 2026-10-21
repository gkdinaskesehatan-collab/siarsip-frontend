import { useState, useEffect } from "react"
import type { Document, OrganizationalUnit, UserAccount, View } from "./types"
import { DOCUMENT_CATEGORIES } from "./types"
import {
  fetchDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getToken,
  fetchCurrentUser,
  fetchOrganizationalUnits,
  logout as apiLogout,
  AUTH_EXPIRED_EVENT,
  mergeCategories,
  type DocumentFormData,
} from "./api"
import Header from "./components/Header"
import PublicView from "./components/PublicView"
import DocumentDetail from "./components/DocumentDetail"
import LoginView from "./components/LoginView"
import AdminView from "./components/AdminView"
import AccountSettingsView from "./components/AccountSettingsView"
import UserManagementView from "./components/UserManagementView"

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [view, setView] = useState<View>("public")
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [isAdmin, setIsAdmin] = useState(() => getToken() !== null)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [units, setUnits] = useState<OrganizationalUnit[]>([])

  useEffect(() => {
    fetchDocuments()
      .then(setDocuments)
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoading(false))
    if (getToken()) {
      fetchCurrentUser()
        .then((user) => {
          setCurrentUser(user)
          if (user.role === "super_admin") {
            fetchOrganizationalUnits()
              .then(setUnits)
              .catch((e: Error) => setLoadError(e.message))
          }
        })
        .catch(() => setCurrentUser(null))
    }
  }, [])

  useEffect(() => {
    const onExpired = () => {
      setIsAdmin(false)
      setCurrentUser(null)
      setView("public")
      setSelectedDoc(null)
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  const handleNavigate = (target: View) => {
    setView(target)
    if (target !== "detail") setSelectedDoc(null)
  }

  const handleSelectDocument = (doc: Document) => {
    setSelectedDoc(doc)
    setView("detail")
  }

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user)
    setIsAdmin(true)
    setView("admin")
    fetchDocuments()
      .then(setDocuments)
      .catch((e: Error) => setLoadError(e.message))
    if (user.role === "super_admin") {
      fetchOrganizationalUnits()
        .then(setUnits)
        .catch((e: Error) => setLoadError(e.message))
    }
  }

  const handleLogout = () => {
    void apiLogout()
    setIsAdmin(false)
    setCurrentUser(null)
    setView("public")
    setSelectedDoc(null)
  }

  const handleAddDocument = async (
    data: DocumentFormData,
    onProgress?: (progress: number) => void,
  ) => {
    const created = await createDocument(data, onProgress)
    setDocuments((prev) => [created, ...prev])
  }

  const handleUpdateDocument = async (
    data: DocumentFormData,
    onProgress?: (progress: number) => void,
  ) => {
    const updated = await updateDocument(data, onProgress)
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
  }

  const handleDeleteDocument = async (id: string) => {
    await deleteDocument(id)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  const categories = mergeCategories(
    [...DOCUMENT_CATEGORIES],
    documents.flatMap((doc) => {
      const legacyDoc = doc as Document & {
        kategori?: string
        type?: string
        jenis?: string
      }
      const category =
        legacyDoc.category ??
        legacyDoc.kategori ??
        legacyDoc.type ??
        legacyDoc.jenis
      return category ? [String(category)] : []
    }),
  )

  const years = Array.from(
    new Set(
      documents.flatMap((doc) => {
        const legacyDoc = doc as Document & {
          tahun?: number | string
          createdAt?: string
          created_at?: string
          date?: string
        }
        const rawYear =
          legacyDoc.year ??
          legacyDoc.tahun ??
          legacyDoc.createdAt ??
          legacyDoc.created_at ??
          legacyDoc.date
        if (rawYear == null) return []
        if (
          typeof rawYear === "number" &&
          Number.isInteger(rawYear) &&
          rawYear >= 1000 &&
          rawYear <= 9999
        ) {
          return [rawYear]
        }
        const yearText = String(rawYear)
        const yearPrefix = yearText.match(/^(\d{4})(?:-|$)/)
        if (yearPrefix) return [Number(yearPrefix[1])]
        const year = new Date(rawYear).getFullYear()
        return Number.isNaN(year) ? [] : [year]
      }),
    ),
  ).sort((a, b) => b - a)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Memuat dokumen…
      </div>
    )
  }

  // Login and detail views don't show the header
  if (view === "login") {
    return (
      <LoginView onLogin={handleLogin} onCancel={() => setView("public")} />
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header
        isAdmin={isAdmin}
        user={currentUser}
        currentView={view}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      {loadError && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-2 text-center">
          Gagal memuat dokumen: {loadError}
        </div>
      )}

      {view === "public" && (
        <PublicView
          documents={documents}
          categories={categories}
          years={years}
          onSelectDocument={handleSelectDocument}
        />
      )}

      {view === "detail" && selectedDoc && (
        <DocumentDetail
          document={selectedDoc}
          onBack={() => setView("public")}
        />
      )}

      {view === "admin" && isAdmin && (
        <AdminView
          documents={documents}
          categories={categories}
          user={currentUser}
          units={units}
          onAdd={handleAddDocument}
          onUpdate={handleUpdateDocument}
          onDelete={handleDeleteDocument}
          onViewDocument={(doc) => {
            setSelectedDoc(doc)
            setView("detail")
          }}
        />
      )}
      {view === "account" && isAdmin && currentUser && (
        <AccountSettingsView
          user={currentUser}
          onUserUpdated={setCurrentUser}
        />
      )}
      {view === "users" && isAdmin && currentUser?.role === "super_admin" && (
        <UserManagementView
          currentUser={currentUser}
          units={units}
          onUnitsChanged={setUnits}
        />
      )}
    </div>
  )
}
