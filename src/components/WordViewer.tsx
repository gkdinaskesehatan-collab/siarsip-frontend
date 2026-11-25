import { useEffect, useRef, useState } from 'react';
import { getToken } from '../api';
import PreviewZoomControls from './PreviewZoomControls';

interface WordViewerProps {
  src: string;
  className?: string;
}

export default function WordViewer({ src, className = 'h-[80vh]' }: WordViewerProps) {
  const stylesRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const styles = window.document.createElement('div');
    const content = window.document.createElement('div');

    setStatus('loading');
    if (stylesRef.current) stylesRef.current.replaceChildren();
    if (documentRef.current) documentRef.current.replaceChildren();

    (async () => {
      try {
        const token = getToken();
        const response = await fetch(src, {
          cache: 'no-store',
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error(`Server menjawab ${response.status}`);

        const { renderAsync } = await import('docx-preview');
        await renderAsync(await response.arrayBuffer(), content, styles, {
          className: 'docx-preview',
          renderAltChunks: false,
        });
        if (!active) return;

        stylesRef.current?.replaceChildren(...Array.from(styles.childNodes));
        documentRef.current?.replaceChildren(...Array.from(content.childNodes));
        setStatus('ready');
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === 'AbortError')) return;
        console.error('Gagal merender pratinjau DOCX:', error);
        setStatus('error');
      }
    })();

    return () => {
      active = false;
      controller.abort();
      stylesRef.current?.replaceChildren();
      documentRef.current?.replaceChildren();
    };
  }, [src]);

  return (
    <div className="flex flex-col bg-slate-100 rounded-b-2xl overflow-hidden">
      <div className="flex items-center justify-end border-b border-slate-200 bg-white px-4 py-2">
        <PreviewZoomControls zoom={zoom} onZoomChange={setZoom} />
      </div>
      <div className={`overflow-auto ${className}`}>
        <div ref={stylesRef} />
        {status === 'loading' && (
          <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-slate-500">
            Memuat pratinjau Word…
          </div>
        )}
        {status === 'error' && (
          <div role="alert" className="flex h-full min-h-[300px] items-center justify-center px-6 text-center text-sm text-red-700">
            Pratinjau DOCX gagal dimuat. Silakan unduh berkas untuk melihat isinya.
          </div>
        )}
        <div
          ref={documentRef}
          className={status === 'ready' ? 'min-h-full' : 'hidden'}
          style={{ zoom: zoom / 100 }}
        />
      </div>
    </div>
  );
}
