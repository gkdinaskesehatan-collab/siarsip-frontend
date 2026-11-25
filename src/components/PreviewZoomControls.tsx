interface PreviewZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export default function PreviewZoomControls({ zoom, onZoomChange }: PreviewZoomControlsProps) {
  return (
    <div className="flex items-center gap-1" aria-label="Kontrol zoom pratinjau">
      <button
        type="button"
        onClick={() => onZoomChange(Math.max(50, zoom - 10))}
        disabled={zoom <= 50}
        aria-label="Perkecil pratinjau"
        title="Perkecil"
        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => onZoomChange(100)}
        aria-label="Kembalikan zoom ke 100 persen"
        title="Reset zoom"
        className="min-w-[58px] rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
      >
        {zoom}%
      </button>
      <button
        type="button"
        onClick={() => onZoomChange(Math.min(300, zoom + 10))}
        disabled={zoom >= 300}
        aria-label="Perbesar pratinjau"
        title="Perbesar"
        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
