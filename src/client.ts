export type FileCategory = 'image' | 'video' | 'pdf' | 'document' | 'other';
export type ProcessingStatus = 'queued' | 'ready' | 'failed';

export interface MediaFile {
  id:                number;
  uuid:              string;
  original_name:     string;
  stored_name:       string;
  extension:         string;
  mime_type:         string;
  category:          FileCategory;
  size:              number;
  relative_path:     string;
  public_url:        string;
  view_url:          string;
  download_url:      string;
  thumbnail_url:     string | null;
  thumbnail_path:    string | null;
  processing_status: ProcessingStatus;
  processing_error:  string | null;
  created_at:        string;
}

export interface UploadAccepted {
  uuid:             string;
  originalName:     string;
  storedName:       string;
  mimeType:         string;
  size:             number;
  category:         FileCategory;
  publicUrl:        string;
  viewUrl:          string;
  downloadUrl:      string;
  thumbnailUrl:     null;
  processingStatus: 'queued';
  awaitProcessing:  boolean;
}

export interface PaginatedFiles {
  data:       MediaFile[];
  pagination: {
    page:  number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HealthStatus {
  server:    string;
  database:  string;
  websocket: string;
  timestamp: string;
}

export interface WsSubscribedEvent {
  type:     'subscribed';
  uploadId: string;
  progress: number;
  status:   'waiting';
}

export interface WsProgressEvent {
  type:             'upload_progress';
  uploadId:         string;
  progress:         number;
  receivedBytes:    number;
  totalBytes:       number;
  status:           'starting' | 'uploading' | 'queued' | 'failed' | 'aborted';
  mediaUuid?:       string;
  file?:            UploadAccepted;
  awaitProcessing?: boolean;
  message?:         string;
}

export interface WsProcessingCompleteEvent {
  type:      'processing_complete';
  uploadId:  string;
  mediaUuid: string;
  file:      MediaFile;
}

export interface WsProcessingFailedEvent {
  type:         'processing_failed';
  uploadId:     string;
  mediaUuid:    string;
  error:        string;
  fallbackPoll: boolean;
}

export type WsEvent =
  | WsSubscribedEvent
  | WsProgressEvent
  | WsProcessingCompleteEvent
  | WsProcessingFailedEvent;

export interface UploadOptions {
  onProgress?:           (progress: number, event: WsProgressEvent) => void;
  onQueued?:             (data: UploadAccepted, event: WsProgressEvent) => void;
  onProcessingComplete?: (file: MediaFile, event: WsProcessingCompleteEvent) => void;
  onProcessingFailed?:   (error: string, event: WsProcessingFailedEvent) => void;
  signal?:               AbortSignal;
  wsTimeoutMs?:          number;
  useWebSocket?:         boolean;
}

export interface ListFilesOptions {
  page?:  number;
  limit?: number;
}

export interface KilifiClientOptions {
  apiKey:              string;
  baseUrl?:            string;
  tokenRefreshBuffer?: number;
}

export class KilifiMediaError extends Error {
  readonly status:   number;
  readonly response: unknown;

  constructor(message: string, status = 0, response: unknown = null) {
    super(message);
    this.name     = 'KilifiMediaError';
    this.status   = status;
    this.response = response;
  }
}

export class KilifiMediaClient {
  private readonly _apiKey:        string;
  private readonly _baseUrl:       string;
  private readonly _refreshBuffer: number;
  private readonly _storageKey:    string;

  private _token:          string | null       = null;
  private _tokenExpiresAt: number              = 0;
  private _tokenInflight:  Promise<string> | null = null;

  constructor({
    apiKey,
    baseUrl            = 'https://media.kilifi.go.ke',
    tokenRefreshBuffer = 60,
  }: KilifiClientOptions) {
    if (!apiKey) throw new Error('[KilifiMedia] apiKey is required.');
    this._apiKey        = apiKey;
    this._baseUrl       = baseUrl.replace(/\/$/, '');
    this._refreshBuffer = tokenRefreshBuffer * 1000;
    this._storageKey    = `kilifi_token_${btoa(apiKey).slice(0, 12)}`;
    this._rehydrateToken();
  }

  private _rehydrateToken(): void {
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (!raw) return;

      const { token, expiresAt } = JSON.parse(raw) as { token: string; expiresAt: number };

      if (token && expiresAt && Date.now() < expiresAt - this._refreshBuffer) {
        this._token          = token;
        this._tokenExpiresAt = expiresAt;
      } else {
        localStorage.removeItem(this._storageKey);
      }
    } catch {
      try { localStorage.removeItem(this._storageKey); } catch { /* ignore */ }
    }
  }

  private _persistToken(): void {
    try {
      localStorage.setItem(this._storageKey, JSON.stringify({
        token:     this._token,
        expiresAt: this._tokenExpiresAt,
      }));
    } catch { /* ignore */ }
  }

  private _clearPersistedToken(): void {
    try { localStorage.removeItem(this._storageKey); } catch { /* ignore */ }
  }

  private async _getToken(): Promise<string> {
    const needsRefresh =
      !this._token || Date.now() >= this._tokenExpiresAt - this._refreshBuffer;

    if (!needsRefresh) return this._token!;
    if (this._tokenInflight)  return this._tokenInflight;

    this._tokenInflight = this._fetchToken().finally(() => {
      this._tokenInflight = null;
    });

    return this._tokenInflight;
  }

  private async _fetchToken(): Promise<string> {
    const res = await fetch(`${this._baseUrl}/token`, {
      method:  'POST',
      headers: { 'x-api-key': this._apiKey },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      throw new KilifiMediaError(
        String(body?.message ?? `Token exchange failed (HTTP ${res.status})`),
        res.status,
        body,
      );
    }

    const { token, expiresIn } = await res.json() as { token: string; expiresIn: number };
    this._token          = token;
    this._tokenExpiresAt = Date.now() + expiresIn * 1000;
    this._persistToken();
    return token;
  }

  private async _fetch(
    path:    string,
    init:    RequestInit = {},
    _retry = false,
  ): Promise<Response> {
    const token = await this._getToken();

    const res = await fetch(`${this._baseUrl}${path}`, {
      ...init,
      headers: { ...init.headers, 'x-api-token': token },
    });

    if (res.status === 401 && !_retry) {
      this._token          = null;
      this._tokenExpiresAt = 0;
      this._clearPersistedToken();
      return this._fetch(path, init, true);
    }

    return res;
  }

  private _buildWsUrl(uploadId: string): string {
    const url    = new URL(this._baseUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws/uploads';
    url.search   = '';
    url.searchParams.set('uploadId', uploadId);
    return url.toString();
  }

  private _connectSocket(
    uploadId:  string,
    token:     string,
    timeoutMs: number,
  ): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this._buildWsUrl(uploadId));
      let settled  = false;

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          try { socket.close(); } catch { /* ignore */ }
          reject(new Error('WebSocket auth timed out'));
        }
      }, timeoutMs);

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'auth', token }));
      };

      socket.onmessage = (ev) => {
        let msg: WsEvent;
        try { msg = JSON.parse(ev.data as string) as WsEvent; } catch { return; }

        if (!settled && msg.type === 'subscribed') {
          settled = true;
          clearTimeout(timeout);
          resolve(socket);
          return;
        }

        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          try { socket.close(); } catch { /* ignore */ }
          reject(new KilifiMediaError('WebSocket auth rejected'));
        }
      };

      socket.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(new Error('WebSocket connection failed'));
        }
      };
    });
  }

  async health(): Promise<HealthStatus> {
    const res  = await fetch(`${this._baseUrl}/health`);
    const body = await res.json() as { success: boolean; data: HealthStatus; message?: string };
    if (!res.ok) throw new KilifiMediaError(body?.message ?? 'Health check failed', res.status);
    return body.data;
  }

  async upload(
    file:    File,
    options: UploadOptions = {},
  ): Promise<{ accepted: UploadAccepted; socket: WebSocket | null }> {
    if (!(file instanceof File)) {
      throw new TypeError('[KilifiMedia] upload() expects a File object.');
    }

    const {
      onProgress,
      onQueued,
      onProcessingComplete,
      onProcessingFailed,
      signal,
      wsTimeoutMs  = 8_000,
      useWebSocket = true,
    } = options;

    const token    = await this._getToken();
    const uploadId = _generateUploadId();

    let socket: WebSocket | null = null;

    if (useWebSocket) {
      try {
        socket = await this._connectSocket(uploadId, token, wsTimeoutMs);

        socket.onmessage = (ev) => {
          let msg: WsEvent;
          try { msg = JSON.parse(ev.data as string) as WsEvent; } catch { return; }

          if (msg.type === 'upload_progress') {
            const e = msg as WsProgressEvent;

            if (e.status === 'uploading' || e.status === 'starting') {
              onProgress?.(e.progress, e);
              return;
            }

            if (e.status === 'queued') {
              onProgress?.(1, e);
              if (e.file) onQueued?.(e.file, e);
              return;
            }

            if (e.status === 'failed' || e.status === 'aborted') {
              onProgress?.(e.progress, e);
              return;
            }
          }

          if (msg.type === 'processing_complete') {
            const e = msg as WsProcessingCompleteEvent;
            onProcessingComplete?.(e.file, e);
            return;
          }

          if (msg.type === 'processing_failed') {
            const e = msg as WsProcessingFailedEvent;
            onProcessingFailed?.(e.error, e);
          }
        };

        socket.onerror = () => {
          console.warn('[KilifiMedia] WebSocket error after subscribe.');
        };

      } catch (wsErr) {
        console.warn('[KilifiMedia] WebSocket unavailable, continuing without it.', wsErr);
        socket = null;
      }
    }

    const formData = new FormData();
    formData.append('file', file);

    const httpRes = await fetch(`${this._baseUrl}/upload`, {
      method:  'POST',
      headers: {
        'x-upload-id': uploadId,
        'x-api-token': token,
      },
      body:   formData,
      signal,
    });

    const body = await httpRes.json().catch(() => ({})) as {
      success:  boolean;
      message?: string;
      data?:    UploadAccepted;
    };

    if (!httpRes.ok) {
      socket?.close();
      throw new KilifiMediaError(
        body?.message ?? `Upload failed (HTTP ${httpRes.status})`,
        httpRes.status,
        body,
      );
    }

    const accepted = body.data!;

    if (!socket && !accepted.awaitProcessing) {
      try {
        const record = await this.pollUntilReady(accepted.uuid);
        if (record) {
          const syntheticEvent: WsProcessingCompleteEvent = {
            type:      'processing_complete',
            uploadId,
            mediaUuid: accepted.uuid,
            file:      record,
          };
          onProcessingComplete?.(record, syntheticEvent);
        }
      } catch { /* non-fatal */ }
    }

    return { accepted, socket };
  }

  async pollUntilReady(
    uuid:       string,
    intervalMs  = 2_000,
    maxWaitMs   = 60_000,
  ): Promise<MediaFile | null> {
    const deadline = Date.now() + maxWaitMs;

    while (Date.now() < deadline) {
      const res  = await this._fetch(`/files/uuid/${encodeURIComponent(uuid)}`);
      const body = await res.json() as {
        success:           boolean;
        processingStatus?: string;
        data?:             MediaFile | null;
      };

      if (res.status === 202) { await _sleep(intervalMs); continue; }
      if (!res.ok)             break;

      const record = body.data;
      if (!record) { await _sleep(intervalMs); continue; }

      if (record.processing_status === 'ready' || record.processing_status === 'failed') {
        return record;
      }

      await _sleep(intervalMs);
    }

    return null;
  }

  async listFiles({ page = 1, limit = 20 }: ListFilesOptions = {}): Promise<PaginatedFiles> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res    = await this._fetch(`/files?${params}`);
    const body   = await res.json() as PaginatedFiles & { message?: string };
    if (!res.ok) throw new KilifiMediaError(body?.message ?? 'Could not list files', res.status, body);
    return { data: body.data, pagination: body.pagination };
  }

  async getFile(id: number | string): Promise<MediaFile> {
    if (!id) throw new TypeError('[KilifiMedia] getFile() requires an id.');
    const res  = await this._fetch(`/files/${id}`);
    const body = await res.json() as { success: boolean; data: MediaFile; message?: string };
    if (!res.ok) throw new KilifiMediaError(body?.message ?? 'Could not fetch file', res.status, body);
    return body.data;
  }

  async deleteFile(id: number | string): Promise<void> {
    if (!id) throw new TypeError('[KilifiMedia] deleteFile() requires an id.');
    const res  = await this._fetch(`/files/${id}`, { method: 'DELETE' });
    const body = await res.json().catch(() => ({})) as { message?: string };
    if (!res.ok) throw new KilifiMediaError(body?.message ?? 'Delete failed', res.status, body);
  }
}

function _generateUploadId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function _sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}