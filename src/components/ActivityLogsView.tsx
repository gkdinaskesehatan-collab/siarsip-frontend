import { useEffect, useState } from "react"
import { exportActivityLogs, fetchActivityLogs } from "../api"
import type { ActivityLogRecord } from "../api"
import type { OrganizationalUnit } from "../types"

export default function ActivityLogsView({ units }: { units: OrganizationalUnit[] }) {
  const [rows, setRows] = useState<ActivityLogRecord[]>([])
  const [unitId, setUnitId] = useState<number | "">("")
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError("")
    fetchActivityLogs({ page, organizational_unit_id: unitId })
      .then((result) => {
        if (!active) return
        setRows(result.data)
        setLastPage(result.last_page)
        setTotal(result.total)
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [page, unitId])

  const handleExport = async () => {
    setError("")
    try {
      const blob = await exportActivityLogs(unitId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "rekap-aktivitas-30-hari.csv"
      link.click()
      URL.revokeObjectURL(url)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ekspor gagal.")
    }
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-green-100 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-[#0f2318]">Audit Trail · 30 Hari Terakhir</h2>
          <p className="mt-1 text-xs text-slate-500">{total} aktivitas, halaman berisi hingga 50 baris</p>
        </div>
        <div className="flex gap-2">
          <select
            value={unitId}
            onChange={(event) => {
              setUnitId(event.target.value ? Number(event.target.value) : "")
              setPage(1)
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
            aria-label="Filter unit kerja"
          >
            <option value="">Semua unit</option>
            {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
          </select>
          <button onClick={() => void handleExport()} className="rounded-lg bg-[#185e48] px-3 py-2 text-xs font-semibold text-white">
            Ekspor CSV
          </button>
        </div>
      </div>
      {error && <p role="alert" className="px-5 py-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Pengguna</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Dokumen</th>
              <th className="px-4 py-3">Aksi</th>
              <th className="px-4 py-3">Alamat IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="whitespace-nowrap px-4 py-3">{new Date(row.created_at).toLocaleString("id-ID")}</td>
                <td className="px-4 py-3">{row.user?.name ?? "Pengunjung publik"}</td>
                <td className="px-4 py-3">{row.organizational_unit?.name ?? "—"}</td>
                <td className="max-w-56 truncate px-4 py-3" title={row.document?.title ?? row.description}>{row.document?.title ?? row.description}</td>
                <td className="px-4 py-3">{row.action}</td>
                <td className="px-4 py-3 font-mono">{row.ip_address ?? "—"}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Belum ada aktivitas pada rentang ini.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
        <span className="text-xs text-slate-500">{loading ? "Memuat…" : `Halaman ${page} dari ${lastPage}`}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded border px-3 py-1 text-xs disabled:opacity-40">Sebelumnya</button>
          <button disabled={page >= lastPage || loading} onClick={() => setPage((value) => value + 1)} className="rounded border px-3 py-1 text-xs disabled:opacity-40">Berikutnya</button>
        </div>
      </div>
    </section>
  )
}
