import { useState, useEffect } from 'react';
import type { Document, View } from './types';
import {
  fetchDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  type DocumentFormData,
} from './api';
import Header from './components/Header';
import PublicView from './components/PublicView';
import DocumentDetail from './components/DocumentDetail';
import LoginView from './components/LoginView';
import AdminView from './components/AdminView';

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [view, setView] = useState<View>('public');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchDocuments()
      .then(setDocuments)
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleNavigate = (target: View) => {
    setView(target);
    if (target !== 'detail') setSelectedDoc(null);
  };

  const handleSelectDocument = (doc: Document) => {
    setSelectedDoc(doc);
    setView('detail');
  };

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAdmin(true);
      setView('admin');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setView('public');
    setSelectedDoc(null);
  };

  const handleAddDocument = async (data: DocumentFormData) => {
    const created = await createDocument(data);
    setDocuments((prev) => [created, ...prev]);
  };

  const handleUpdateDocument = async (data: DocumentFormData) => {
    const updated = await updateDocument(data);
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleDeleteDocument = async (id: string) => {
    await deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Memuat dokumen…
      </div>
    );
  }

  // Login and detail views don't show the header
  if (view === 'login') {
    return (
      <LoginView
        onLogin={handleLogin}
        onCancel={() => setView('public')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header
        isAdmin={isAdmin}
        currentView={view}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      {loadError && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-2 text-center">
          Gagal memuat dokumen: {loadError}
        </div>
      )}

      {view === 'public' && (
        <PublicView
          documents={documents}
          onSelectDocument={handleSelectDocument}
        />
      )}

      {view === 'detail' && selectedDoc && (
        <DocumentDetail
          document={selectedDoc}
          onBack={() => setView('public')}
        />
      )}

      {view === 'admin' && isAdmin && (
        <AdminView
          documents={documents}
          onAdd={handleAddDocument}
          onUpdate={handleUpdateDocument}
          onDelete={handleDeleteDocument}
          onViewDocument={(doc) => {
            setSelectedDoc(doc);
            setView('detail');
          }}
        />
      )}
    </div>
  );
}
