import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PageViewport, RenderTask } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface TextItemLite {
  str: string;
  transform: number[];
  width: number;
}

interface PageText {
  items: TextItemLite[];
  full: string; // seluruh teks halaman digabung
  offsets: number[]; // posisi awal tiap item di dalam `full`
}

interface Piece {
  itemIndex: number;
  start: number;
  length: number;
}

interface Match {
  key: string;
  page: number;
  pieces: Piece[];
}

interface PdfViewerProps {
  src: string; // alamat file PDF (endpoint backend)
  className?: string;
  searchOpen: boolean; // bar pencarian tampil atau tidak (dikontrol tombol "Cari")
  onSearchOpen: () => void;
  onSearchClose: () => void;
}

/* ------------------------------------------------------------------ */
/* Satu halaman PDF: digambar ke canvas hanya saat terlihat di layar    */
/* ------------------------------------------------------------------ */
function PageView({
  pdf,
  pageNumber,
  scale,
  placeholderW,
  placeholderH,
  pageText,
  matches,
  activeKey,
  onReveal,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  placeholderW: number;
  placeholderH: number;
  pageText?: PageText;
  matches: Match[];
  activeKey: string | null;
  onReveal: (key: string, pageEl: HTMLElement, top: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [viewport, setViewport] = useState<PageViewport | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: '800px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!visible) {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      setViewport(null);
      return;
    }

    let cancelled = false;
    let task: RenderTask | null = null;

    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled || !canvas) return;
      const vp = page.getViewport({ scale });
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(vp.width * dpr);
      canvas.height = Math.floor(vp.height * dpr);
      canvas.style.width = `${vp.width}px`;
      canvas.style.height = `${vp.height}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      task = page.render({
        canvasContext: ctx,
        viewport: vp,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
      });
      try {
        await task.promise;
        if (!cancelled) setViewport(vp);
      } catch {
        // render dibatalkan saat pengguna scroll cepat, abaikan
      }
    })();

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [visible, pdf, pageNumber, scale]);

  // Kotak sorotan untuk tiap potongan teks yang cocok
  const rects = useMemo(() => {
    if (!viewport || !pageText) return [];
    const out: { key: string; left: number; top: number; width: number; height: number }[] = [];
    for (const m of matches) {
      for (const p of m.pieces) {
        const item = pageText.items[p.itemIndex];
        if (!item) continue;
        const t = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const height = Math.hypot(t[2], t[3]);
        const width = item.width * viewport.scale;
        const len = Math.max(item.str.length, 1);
        out.push({
          key: m.key,
          left: t[4] + (p.start / len) * width,
          top: t[5] - height,
          width: Math.max((p.length / len) * width, 3),
          height,
        });
      }
    }
    return out;
  }, [viewport, pageText, matches]);

  const activeTop = rects.find((r) => r.key === activeKey)?.top;
  useEffect(() => {
    if (activeKey && activeTop !== undefined && wrapRef.current) {
      onReveal(activeKey, wrapRef.current, activeTop);
    }
  }, [activeKey, activeTop, onReveal]);

  return (
    <div
      ref={wrapRef}
      data-page={pageNumber}
      className="relative mx-auto mb-4 bg-white shadow-md"
      style={{ width: viewport?.width ?? placeholderW, height: viewport?.height ?? placeholderH }}
    >
      <canvas ref={canvasRef} className="block" />
      {rects.map((r, i) => (
        <div
          key={i}
          className={`absolute pointer-events-none rounded-sm ${
            r.key === activeKey ? 'bg-orange-400/60 ring-1 ring-orange-500' : 'bg-yellow-300/50'
          }`}
          style={{ left: r.left, top: r.top, width: r.width, height: r.height }}
        />
      ))}
      <span className="absolute bottom-1 right-2 text-[10px] text-slate-400 select-none">{pageNumber}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Penampil PDF lengkap dengan pencarian teks                           */
/* ------------------------------------------------------------------ */
export default function PdfViewer({
  src,
  className = 'h-[80vh]',
  searchOpen,
  onSearchOpen,
  onSearchClose,
}: PdfViewerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hovering = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textCache = useRef<Map<number, PageText>>(new Map());
  const revealedKey = useRef<string | null>(null);
  const searchId = useRef(0);

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [baseSize, setBaseSize] = useState({ w: 595, h: 842 });
  const [containerW, setContainerW] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Muat PDF dari backend
  useEffect(() => {
    let cancelled = false;
    let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | null = null;

    setStatus('loading');
    setPdf(null);
    setMatches([]);
    setSearched(false);
    textCache.current = new Map();

    (async () => {
      try {
        const res = await fetch(src, { cache: 'no-store' }); // jangan pakai cache browser
        if (!res.ok) throw new Error(`Server menjawab ${res.status}`);
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buf) });
        const doc = await loadingTask.promise;
        if (cancelled) return;
        const first = await doc.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        setBaseSize({ w: vp.width, h: vp.height });
        setNumPages(doc.numPages);
        setPdf(doc);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat berkas.');
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [src]);

  // Lebar area baca menentukan skala halaman
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [status]);

  const scale = containerW > 0 ? Math.max((containerW - 32) / baseSize.w, 0.3) : 1;
  const placeholderW = baseSize.w * scale;
  const placeholderH = baseSize.h * scale;

  const getPageText = useCallback(
    async (doc: PDFDocumentProxy, n: number): Promise<PageText> => {
      const cached = textCache.current.get(n);
      if (cached) return cached;
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      const items: TextItemLite[] = [];
      for (const it of content.items) {
        if ('str' in it) items.push({ str: it.str, transform: it.transform, width: it.width });
      }
      const offsets: number[] = [];
      let full = '';
      for (const it of items) {
        offsets.push(full.length);
        full += it.str;
      }
      const result = { items, full, offsets };
      textCache.current.set(n, result);
      return result;
    },
    []
  );

  const scrollToPage = (page: number) => {
    const container = containerRef.current;
    const el = container?.querySelector<HTMLElement>(`[data-page="${page}"]`);
    if (container && el) container.scrollTo({ top: el.offsetTop - 8, behavior: 'auto' });
  };

  const goTo = (list: Match[], index: number) => {
    if (list.length === 0) return;
    const i = ((index % list.length) + list.length) % list.length;
    revealedKey.current = null;
    setActiveIndex(i);
    scrollToPage(list[i].page);
  };

  const handleReveal = useCallback((key: string, pageEl: HTMLElement, top: number) => {
    if (revealedKey.current === key) return; // gulir ke sorotan hanya sekali per pencarian
    revealedKey.current = key;
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({
      top: Math.max(pageEl.offsetTop + top - container.clientHeight / 3, 0),
      behavior: 'smooth',
    });
  }, []);

  const runSearch = async () => {
    const q = query.trim().toLowerCase();
    if (!pdf || !q) return;
    const myId = ++searchId.current;
    setSearching(true);
    setSearched(true);
    setMatches([]);

    const found: Match[] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const pt = await getPageText(pdf, p);
      if (myId !== searchId.current) return; // ada pencarian baru, hentikan yang lama
      const hay = pt.full.toLowerCase();
      let idx = hay.indexOf(q);
      while (idx !== -1) {
        const end = idx + q.length;
        const pieces: Piece[] = [];
        pt.items.forEach((item, itemIndex) => {
          const s = pt.offsets[itemIndex];
          const e = s + item.str.length;
          const from = Math.max(idx, s);
          const to = Math.min(end, e);
          if (to > from) pieces.push({ itemIndex, start: from - s, length: to - from });
        });
        if (pieces.length) found.push({ key: `${p}-${idx}`, page: p, pieces });
        idx = hay.indexOf(q, end);
      }
    }

    setSearching(false);
    setMatches(found);
    setActiveIndex(0);
    if (found.length) {
      revealedKey.current = null;
      scrollToPage(found[0].page);
    }
  };

  const clearSearch = () => {
    searchId.current++;
    setQuery('');
    setMatches([]);
    setSearched(false);
    setSearching(false);
  };

  const closeSearch = () => {
    clearSearch();
    onSearchClose();
  };

  // Fokus & blok teks di kolom cari setiap kali bar dibuka
  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [searchOpen, status]);

  // Ctrl/Cmd + F saat kursor di area dokumen -> buka bar pencarian kita (bukan pencarian browser)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && hovering.current) {
        e.preventDefault();
        onSearchOpen();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSearchOpen]);

  const matchesByPage = useMemo(() => {
    const map = new Map<number, Match[]>();
    for (const m of matches) {
      const list = map.get(m.page) ?? [];
      list.push(m);
      map.set(m.page, list);
    }
    return map;
  }, [matches]);

  const activeKey = matches[activeIndex]?.key ?? null;

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => (hovering.current = false)}
      className="flex flex-col bg-slate-100 rounded-b-2xl overflow-hidden"
    >
      {/* Toolbar pencarian (muncul saat tombol "Cari" diklik) */}
      {searchOpen && (
        <div className="flex flex-wrap items-center gap-2 bg-white border-b border-slate-100 px-4 py-3">
          <div className="relative flex-1 min-w-[180px]">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (matches.length && !searching && searched) goTo(matches, activeIndex + (e.shiftKey ? -1 : 1));
                  else runSearch();
                } else if (e.key === 'Escape') {
                  closeSearch();
                }
              }}
              disabled={status !== 'ready'}
              placeholder="Cari kata di dalam dokumen…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-brand-400 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <button
            type="button"
            onClick={runSearch}
            disabled={status !== 'ready' || searching || !query.trim()}
            className="px-4 py-2 text-sm font-semibold bg-[#185e48] text-white rounded-lg hover:bg-[#154c3b] transition-colors disabled:opacity-50"
          >
            {searching ? 'Mencari…' : 'Temukan'}
          </button>
          {matches.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => goTo(matches, activeIndex - 1)}
                title="Hasil sebelumnya"
                className="p-2 text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => goTo(matches, activeIndex + 1)}
                title="Hasil berikutnya"
                className="p-2 text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </>
          )}
          <span className="text-xs text-slate-500 min-w-[90px]">
            {searching
              ? 'Memindai halaman…'
              : searched
              ? matches.length
                ? `${activeIndex + 1} dari ${matches.length} · hal. ${matches[activeIndex].page}`
                : 'Tidak ditemukan'
              : status === 'ready'
              ? `${numPages} halaman`
              : ''}
          </span>
          <button
            type="button"
            onClick={closeSearch}
            title="Tutup pencarian"
            className="ml-auto text-slate-400 hover:text-slate-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Area baca */}
      {status === 'loading' && (
        <div className={`flex items-center justify-center text-sm text-slate-500 ${className}`}>
          Memuat dokumen…
        </div>
      )}
      {status === 'error' && (
        <div className={`flex flex-col items-center justify-center gap-1 px-6 text-center ${className}`}>
          <p className="text-sm font-semibold text-red-600">Dokumen tidak dapat ditampilkan</p>
          <p className="text-xs text-slate-500">{errorMsg}</p>
        </div>
      )}
      {status === 'ready' && pdf && (
        <div ref={containerRef} className={`relative overflow-y-auto overflow-x-hidden py-4 ${className}`}>
          {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
            <PageView
              key={n}
              pdf={pdf}
              pageNumber={n}
              scale={scale}
              placeholderW={placeholderW}
              placeholderH={placeholderH}
              pageText={textCache.current.get(n)}
              matches={matchesByPage.get(n) ?? []}
              activeKey={activeKey}
              onReveal={handleReveal}
            />
          ))}
        </div>
      )}
    </div>
  );
}