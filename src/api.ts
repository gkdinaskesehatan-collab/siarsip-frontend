import type { Document } from './types';

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8000/api';

// Data dari form + file PDF yang dipilih (file boleh kosong saat edit)
export type DocumentFormData = Omit<Document, 'id'> & {
  id?: string;
  file?: File | null;
};

interface ApiCategory {
  id: number;
  name: string;
}

interface ApiDocument {
  id: number;
  title: string;
  category_id: number;
  custom_category: string | null;
  year: number;
  date_added: string;
  document_number: string;
  description: string | null;
  file_url: string;
  file_size: string;
  updated_at?: string | null;
  category?: ApiCategory | null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...(init.headers ?? {}) },
  });

  if (!res.ok) {
    let message = `Permintaan gagal (${res.status})`;
    try {
      const body = await res.json();
      if (body.errors) {
        message = Object.values(body.errors as Record<string, string[]>).flat().join(' ');
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      // respons bukan JSON, pakai pesan bawaan
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

let categoryCache: ApiCategory[] | null = null;

async function getCategories(): Promise<ApiCategory[]> {
  if (!categoryCache) categoryCache = await request<ApiCategory[]>('/categories');
  return categoryCache;
}

function toDocument(d: ApiDocument): Document {
  return {
    id: String(d.id),
    title: d.title,
    category: (d.category?.name ?? 'Lainnya') as Document['category'],
    customCategory: d.custom_category ?? undefined,
    year: Number(d.year),
    dateAdded: d.date_added.slice(0, 10),
    documentNumber: d.document_number,
    description: d.description ?? undefined,
    fileUrl: d.file_url,
    fileSize: `${d.file_size} MB`,
    updatedAt: d.updated_at ?? undefined,
  };
}

async function buildForm(data: DocumentFormData): Promise<FormData> {
  const categories = await getCategories();
  const cat = categories.find((c) => c.name === data.category);
  if (!cat) throw new Error(`Kategori "${data.category}" tidak ada di database.`);

  const form = new FormData();
  form.append('title', data.title);
  form.append('category_id', String(cat.id));
  form.append('custom_category', data.customCategory ?? '');
  form.append('year', String(data.year));
  form.append('date_added', data.dateAdded);
  form.append('document_number', data.documentNumber || '-');
  form.append('description', data.description ?? '');
  if (data.file) form.append('file', data.file);
  return form;
}

export async function fetchDocuments(): Promise<Document[]> {
  const rows = await request<ApiDocument[]>('/documents');
  return rows.map(toDocument);
}

export async function createDocument(data: DocumentFormData): Promise<Document> {
  if (!data.file) throw new Error('Berkas PDF wajib dipilih.');
  const row = await request<ApiDocument>('/documents', {
    method: 'POST',
    body: await buildForm(data),
  });
  return toDocument(row);
}

export async function updateDocument(data: DocumentFormData): Promise<Document> {
  if (!data.id) throw new Error('ID dokumen tidak ditemukan.');
  const form = await buildForm(data);
  form.append('_method', 'PUT'); // PHP tidak membaca file di request PUT, jadi dikirim POST + _method
  const row = await request<ApiDocument>(`/documents/${data.id}`, {
    method: 'POST',
    body: form,
  });
  return toDocument(row);
}

export async function deleteDocument(id: string): Promise<void> {
  await request(`/documents/${id}`, { method: 'DELETE' });
}

export function documentFileUrl(id: string): string {
  return `${API_URL}/documents/${id}/file`;
}