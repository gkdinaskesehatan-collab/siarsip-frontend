import { useState } from "react"
import { verifyDocument } from "../api"

export default function VerifyDocumentView() {
  const documentId = new URLSearchParams(window.location.search).get("document_id")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<Awaited<ReturnType<typeof verifyDocument>> | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file || busy) return
    setBusy(true)
    setError("")
    setResult(null)
    try {
      setResult(await verifyDocument(file, documentId))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Verifikasi gagal.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-[70vh] bg-[#f7faf9] px-4 py-12">
      <section className="mx-auto max-w-xl rounded-2xl border border-green-100 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-[#0f2318]">Verifikasi Keaslian Dokumen</h1>
        <p className="mt-2 text-sm text-slate-600">
          Unggah PDF untuk mencocokkan checksum SHA-256 dengan dokumen publik yang tercatat di SI-DHAKSI.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Berkas PDF
            <input
              type="file"
              accept=".pdf,application/pdf"
              required
              disabled={busy}
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null)
                setResult(null)
              }}
              className="mt-2 block w-full rounded-lg border border-slate-200 p-3 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={!file || busy}
            className="w-full rounded-xl bg-[#185e48] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Memverifikasi…" : "Verifikasi PDF"}
          </button>
        </form>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {result && (
          <div className={`mt-4 rounded-lg p-4 text-sm ${result.verified ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-900"}`}>
            <p className="font-semibold">{result.message}</p>
            {result.document && (
              <p className="mt-1">{result.document.title} · {result.document.category} · {result.document.year}</p>
            )}
            <p className="mt-3 break-all font-mono text-xs">SHA-256: {result.sha256}</p>
          </div>
        )}
      </section>
    </main>
  )
}
