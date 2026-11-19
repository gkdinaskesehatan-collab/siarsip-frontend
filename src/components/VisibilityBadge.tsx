import type { DocumentVisibility } from "../types"

const VISIBILITY_STYLES: Record<
  DocumentVisibility,
  { label: string; className: string; description: string }
> = {
  public: {
    label: "Publik",
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-100",
    description: "Aman dan terbuka bagi masyarakat.",
  },
  internal: {
    label: "Internal",
    className: "border-blue-300 bg-blue-50 text-blue-800 shadow-sm shadow-blue-100",
    description: "Terbatas bagi pegawai yang masuk ke sistem.",
  },
  secret: {
    label: "Rahasia",
    className: "border-rose-300 bg-rose-50 text-rose-800 shadow-sm shadow-rose-100",
    description: "Khusus unit terkait dan administrator.",
  },
}

export default function VisibilityBadge({
  visibility,
}: {
  visibility: DocumentVisibility
}) {
  const style = VISIBILITY_STYLES[visibility]

  return (
    <span
      title={style.description}
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.className}`}
    >
      {style.label}
    </span>
  )
}
