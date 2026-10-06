import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/browserClient';
import { api } from '../lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ClientFile {
  id: string;
  client_id: string;
  file_name: string;
  storage_path: string;
  content_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
  signed_url: string | null;
}

// ── Client-side validation (mirrors backend + bucket limits) ────────────────────

const BUCKET = 'client-files';
export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
export const ACCEPTED_EXTENSIONS = '.pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx';

const ALLOWED_MIME = new Set<string>([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return 'File must be under 15 MB';
  if (file.size === 0) return 'File is empty';
  // Some browsers leave file.type blank — fall back to allowing if extension matches.
  if (file.type && !ALLOWED_MIME.has(file.type)) return `Unsupported file type: ${file.type || 'unknown'}`;
  return null;
}

// Sanitize a filename for use inside a storage object key.
function safeName(name: string): string {
  return name.replace(/[^\w.-]+/g, '_').slice(0, 120);
}

// ── Hook ────────────────────────────────────────────────────────────────────────

export function useClientFiles(clientId: string | null) {
  const [files, setFiles]     = useState<ClientFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      const { files } = await api.get<{ files: ClientFile[] }>(`/api/crm/clients/${clientId}/files`);
      setFiles(files ?? []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    setFiles([]);
    if (clientId) fetchFiles().catch(() => {});
  }, [clientId, fetchFiles]);

  // Upload bytes to private storage (RLS-guarded), then register metadata server-side.
  const uploadFile = useCallback(async (file: File): Promise<void> => {
    if (!clientId) throw new Error('No client selected');
    const validationError = validateFile(file);
    if (validationError) throw new Error(validationError);

    const path = `${clientId}/${Date.now()}_${safeName(file.name)}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

    try {
      await api.post(`/api/crm/clients/${clientId}/files`, {
        file_name: file.name,
        storage_path: path,
        content_type: file.type || null,
        size_bytes: file.size,
      });
    } catch (err) {
      // Roll back the orphaned object if metadata registration fails.
      await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
      throw err;
    }

    await fetchFiles();
  }, [clientId, fetchFiles]);

  const deleteFile = useCallback(async (fileId: string): Promise<void> => {
    if (!clientId) return;
    await api.delete(`/api/crm/clients/${clientId}/files?fileId=${fileId}`);
    await fetchFiles();
  }, [clientId, fetchFiles]);

  return { files, loading, error, refetch: fetchFiles, uploadFile, deleteFile };
}
