import { useCallback, useMemo, useRef, useState } from 'react';
import { getAuthToken } from '../api';

const RAW_API_BASE =
  (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : undefined) ??
  (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_API_BASE_URL : undefined) ??
  '';

const DEFAULT_API_BASE = typeof RAW_API_BASE === 'string'
  ? RAW_API_BASE
  : String(RAW_API_BASE || '');

const RAW_UPLOAD_BASE =
  (typeof import.meta !== 'undefined'
    ? (import.meta.env?.VITE_UPLOAD_SERVER_URL || import.meta.env?.VITE_MEDIA_SERVER_URL)
    : undefined) ??
  (typeof process !== 'undefined'
    ? (process.env?.NEXT_PUBLIC_UPLOAD_SERVER_URL || process.env?.NEXT_PUBLIC_MEDIA_SERVER_URL)
    : undefined) ??
  '';

const DEFAULT_UPLOAD_BASE = String(
  RAW_UPLOAD_BASE || (DEFAULT_API_BASE ? DEFAULT_API_BASE.replace(/\/api\/v\d+\/?$/i, '') : '')
).replace(/\/$/, '');

function createUploadId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function resolveUploadBase(customBase) {
  return String(customBase || DEFAULT_UPLOAD_BASE || '').replace(/\/$/, '');
}

function buildWsUrl(baseUrl, uploadId, token, apiKey) {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws/uploads';
  url.search = '';
  url.searchParams.set('uploadId', uploadId);
  if (apiKey) url.searchParams.set('apiKey', apiKey);
  if (token) url.searchParams.set('token', token);
  return url.toString();
}

function extractFilePayload(payload) {
  return payload?.data?.file || payload?.file || payload?.data || payload || null;
}

function resolveUploadedValue(payload) {
  const file = extractFilePayload(payload);
  if (!file) return '';
  if (typeof file === 'string') return file;

  const candidates = [
    file.url_path,
    file.path,
    file.image,
    file.url,
    file.publicUrl,
    file.viewUrl,
    file.downloadUrl,
    file.logo_url,
    file.resume_url,
    file.attachment_url,
  ];

  const direct = candidates.find((v) => typeof v === 'string' && v.trim());
  if (direct) return direct;

  const nested = [
    payload?.data?.url_path,
    payload?.data?.path,
    payload?.data?.url,
    payload?.data?.image,
    payload?.url_path,
    payload?.path,
    payload?.url,
    payload?.image,
  ].find((v) => typeof v === 'string' && v.trim());

  return nested || '';
}

export function useFileUpload(options = {}) {
  const socketRef = useRef(null);
  const xhrRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setStatus('');
    setError('');
    setResult(null);
  }, []);

  const closeSocket = useCallback(() => {
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }
  }, []);

  const abort = useCallback(() => {
    closeSocket();

    if (xhrRef.current) {
      try {
        xhrRef.current.abort();
      } catch {}
      xhrRef.current = null;
    }

    setUploading(false);
    setStatus('Upload cancelled');
  }, [closeSocket]);

  const uploadFile = useCallback(
    async (file, overrides = {}) => {
      if (!file) throw new Error('No file selected');

      const uploadBase = resolveUploadBase(overrides.serverUrl || options.serverUrl);
      if (!uploadBase) {
        throw new Error('Upload server URL is missing');
      }

      const uploadPath = overrides.uploadPath || options.uploadPath || '/upload';
      const apiKey = overrides.apiKey || options.apiKey || '';

      const token = apiKey
        ? ''
        : (overrides.token || options.token || getAuthToken() || '');

      const fieldName = overrides.fieldName || options.fieldName || 'file';
      const extraFields = {
        ...(options.extraFields || {}),
        ...(overrides.extraFields || {}),
      };

      const uploadId = createUploadId();

      const formData = new FormData();
      formData.append(fieldName, file);

      Object.entries(extraFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      reset();
      setUploading(true);
      setStatus('Preparing upload...');
      setError('');
      setResult(null);

      let wsConnected = false;

      const maybeConnectSocket = () =>
        new Promise((resolve) => {
          try {
            const socket = new WebSocket(buildWsUrl(uploadBase, uploadId, token, apiKey));
            let settled = false;

            const timer = setTimeout(() => {
              if (settled) return;
              settled = true;
              try {
                socket.close();
              } catch {}
              resolve(false);
            }, 4000);

            socketRef.current = socket;

            socket.onopen = () => {
              if (settled) return;
              settled = true;
              clearTimeout(timer);
              wsConnected = true;
              setStatus('Connected to upload progress channel');
              resolve(true);
            };

            socket.onerror = () => {
              if (settled) return;
              settled = true;
              clearTimeout(timer);
              try {
                socket.close();
              } catch {}
              resolve(false);
            };

            socket.onmessage = (event) => {
              try {
                const payload = JSON.parse(event.data);

                if (payload?.type === 'subscribed') return;

                if (payload?.type === 'upload_progress') {
                  const next = Number(payload.progress ?? 0);

                  if (Number.isFinite(next)) {
                    setProgress(Math.max(0, Math.min(100, Math.round(next * 100))));
                  }

                  if (payload.status === 'completed') {
                    setStatus('Upload completed');
                  } else if (payload.status === 'failed') {
                    setError(payload.message || 'Upload failed');
                  } else if (payload.status === 'aborted') {
                    setError(payload.message || 'Upload aborted');
                  } else {
                    setStatus(payload.message || 'Uploading...');
                  }
                }
              } catch {}
            };

            socket.onclose = () => {
              if (socketRef.current === socket) {
                socketRef.current = null;
              }
            };
          } catch {
            resolve(false);
          }
        });

      await maybeConnectSocket();

      try {
        const responsePayload = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          xhr.open('POST', `${uploadBase}${uploadPath}`, true);
          xhr.setRequestHeader('x-upload-id', uploadId);

          if (apiKey) {
            xhr.setRequestHeader('x-api-key', apiKey);
          }

          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }

          xhr.responseType = 'text';

          xhr.upload.onprogress = (event) => {
            if (!wsConnected && event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setProgress(percent);
              setStatus(percent >= 100 ? 'Processing upload...' : `Uploading... ${percent}%`);
            }
          };

          xhr.onload = () => {
            let parsed = null;

            try {
              parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            } catch {
              parsed = xhr.responseText;
            }

            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(parsed);
            } else {
              reject(new Error(parsed?.message || `Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Upload request failed'));
          xhr.onabort = () => reject(new Error('Upload cancelled'));
          xhr.send(formData);
        });

        const uploadedValue = resolveUploadedValue(responsePayload);

        setResult(responsePayload);
        setProgress(100);
        setStatus('Upload completed');
        setUploading(false);
        closeSocket();

        return {
          payload: responsePayload,
          value: uploadedValue,
          file: extractFilePayload(responsePayload),
        };
      } catch (err) {
        closeSocket();
        setUploading(false);
        setError(err?.message || 'Upload failed');
        throw err;
      } finally {
        xhrRef.current = null;
      }
    },
    [
      closeSocket,
      options.apiKey,
      options.extraFields,
      options.fieldName,
      options.serverUrl,
      options.token,
      options.uploadPath,
      reset,
    ]
  );

  return useMemo(
    () => ({
      uploadFile,
      uploading,
      progress,
      status,
      error,
      result,
      reset,
      abort,
    }),
    [abort, error, progress, reset, result, status, uploadFile, uploading]
  );
}

export default useFileUpload;