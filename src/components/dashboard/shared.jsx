import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { KilifiMediaClient } from '../../client';

// ─── Design tokens ──────────────────────────────────────────────────────────
const G = {
  sidebarBg: '#0b1220',
  sidebarBorder: 'rgba(255,255,255,0.07)',
  accent: '#3b82f6',
  accentHover: '#2563eb',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  radius: '10px',
  radiusLg: '14px',
  shadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const css = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: 'Inter', system-ui, sans-serif; }
  input, select, textarea, button { font-family: inherit; }
  .klf-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
  .klf-scroll::-webkit-scrollbar-track { background: transparent; }
  .klf-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
  .klf-table { width: 100%; border-collapse: collapse; }
  .klf-table th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: ${G.textFaint}; background: ${G.surfaceAlt}; border-bottom: 1px solid ${G.border}; white-space: nowrap; }
  .klf-table td { padding: 13px 14px; font-size: 13px; color: ${G.text}; border-bottom: 1px solid ${G.border}; vertical-align: middle; }
  .klf-table tr:last-child td { border-bottom: none; }
  .klf-table tr:hover td { background: #f8fafc; }
  .klf-input { display: block; width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid ${G.border}; border-radius: ${G.radius}; background: #fff; outline: none; transition: border-color .15s; }
  .klf-input:focus { border-color: ${G.accent}; box-shadow: 0 0 0 3px rgba(59,130,246,.12); }
  .klf-label { display: block; margin-bottom: 5px; font-size: 12px; font-weight: 600; color: ${G.textMuted}; }
  @keyframes klf-spin { to { transform: rotate(360deg); } }
  @keyframes klf-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  .klf-fade { animation: klf-fade .2s ease; }
`;

// ─── Permission helpers ──────────────────────────────────────────────────────
function buildCan(abilities = []) {
  const set = new Set(abilities);
  return (...perms) => perms.every((p) => set.has(p));
}

const ADMIN_ROLES = new Set([
  'global_super_admin',
  'hr_super_admin',
  'cms_super_admin',
  'psb_super_admin',
  'county_admin',
]);

// ─── Primitive UI helpers ────────────────────────────────────────────────────

function Spinner({ size = 18 }) {
  return (
    <div style={{ width: size, height: size, border: `2px solid ${G.border}`, borderTopColor: G.accent, borderRadius: '50%', animation: 'klf-spin .6s linear infinite', flexShrink: 0 }} />
  );
}

function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3800);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg = type === 'success' ? G.success : type === 'error' ? G.danger : G.warning;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: bg, color: '#fff', padding: '12px 18px', borderRadius: G.radius, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 600, maxWidth: 380, animation: 'klf-fade .2s ease', display: 'flex', gap: 10, alignItems: 'center' }}>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'rgba(255,255,255,.25)', border: 'none', borderRadius: 6, padding: '2px 8px', color: '#fff', cursor: 'pointer', fontSize: 12 }}>✕</button>
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type = 'success') => setToast({ msg, type, id: Date.now() }), []);
  const node = toast ? <Toast key={toast.id} msg={toast.msg} type={toast.type} onClose={() => setToast(null)} /> : null;
  return [node, show];
}

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', style: s = {} }) {
  const base = { display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, borderRadius: G.radius, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1, border: 'none', transition: 'background .15s, box-shadow .15s', whiteSpace: 'nowrap', ...s };
  const sizes = { sm: { fontSize: 11, padding: '5px 10px' }, md: { fontSize: 13, padding: '8px 14px' }, lg: { fontSize: 14, padding: '10px 20px' } };
  const variants = {
    primary: { background: G.accent, color: '#fff' },
    success: { background: G.success, color: '#fff' },
    danger: { background: G.danger, color: '#fff' },
    ghost: { background: 'transparent', color: G.textMuted, border: `1px solid ${G.border}` },
    secondary: { background: G.surfaceAlt, color: G.text, border: `1px solid ${G.border}` },
  };
  return <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant] }}>{children}</button>;
}

function Badge({ children, color = G.accent }) {
  return <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: color + '18', color }}>{children}</span>;
}

function StatusBadge({ status }) {
  const map = {
    active: G.success, published: G.success, approved: G.success, hired: G.success, open: G.success,
    draft: G.textFaint, pending: G.warning, 'under review': G.warning, shortlisted: G.accent,
    closed: G.textFaint, inactive: G.textFaint, archived: G.textFaint,
    rejected: G.danger, suspended: G.danger,
  };
  const c = map[(status || '').toLowerCase()] || G.textMuted;
  return <Badge color={c}>{status || '—'}</Badge>;
}

function Card({ children, style: s = {} }) {
  return <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radiusLg, boxShadow: G.shadow, ...s }}>{children}</div>;
}

function CardHeader({ title, subtitle, actions }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${G.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: G.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: G.textMuted, marginTop: 3 }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

function Empty({ icon = '📭', message = 'No records found' }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: G.textMuted }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{message}</div>
    </div>
  );
}

function Err({ msg }) {
  if (!msg) return null;
  return <div style={{ background: '#fef2f2', color: G.danger, border: `1px solid #fecaca`, borderRadius: G.radius, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>{msg}</div>;
}

function StatTile({ label, value, icon, color = G.accent }) {
  return (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radiusLg, padding: '18px 20px', boxShadow: G.shadow }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: G.textFaint, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value ?? '—'}</div>
        </div>
        {icon && <div style={{ fontSize: 22, opacity: .7 }}>{icon}</div>}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children, width = 560 }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: width, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.25)', animation: 'klf-fade .18s ease' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${G.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: G.text }}>{title}</div>
          <button onClick={onClose} style={{ background: G.surfaceAlt, border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: G.textMuted, display: 'grid', placeItems: 'center' }}>✕</button>
        </div>
        <div className="klf-scroll" style={{ overflowY: 'auto', padding: '20px 22px', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="klf-label">{label}{required && <span style={{ color: G.danger }}> *</span>}</label>
      {children}
    </div>
  );
}

function TF({ label, name, value, onChange, type = 'text', required, placeholder }) {
  return (
    <Field label={label} required={required}>
      <input className="klf-input" type={type} name={name} value={value || ''} onChange={onChange} required={required} placeholder={placeholder} />
    </Field>
  );
}

function TA({ label, name, value, onChange, rows = 3, placeholder }) {
  return (
    <Field label={label}>
      <textarea className="klf-input" name={name} value={value || ''} onChange={onChange} rows={rows} placeholder={placeholder} style={{ resize: 'vertical' }} />
    </Field>
  );
}

function SF({ label, name, value, onChange, options, required }) {
  return (
    <Field label={label} required={required}>
      <select className="klf-input" name={name} value={value || ''} onChange={onChange} required={required}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </Field>
  );
}

function JsonViewer({ value }) {
  return (
    <pre style={{ margin: 0, padding: 14, background: '#0f172a', color: '#e2e8f0', borderRadius: 12, overflowX: 'auto', fontSize: 12, lineHeight: 1.45 }}>
      {JSON.stringify(value ?? null, null, 2)}
    </pre>
  );
}

function useForm(initial) {
  const [form, setForm] = useState(initial || {});
  const onChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }, []);
  const reset = useCallback((v) => setForm(v || initial || {}), [initial]);
  return [form, onChange, setForm, reset];
}
function FileUploadField({ label, name, value, onUploaded, accept, required, placeholder, helper }) {
  const fileRef = useRef(null);
  const clientRef = useRef(null);
  const socketRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [status, setStatus]       = useState('');
  const [error, setError]         = useState('');

  // Lazily instantiate the KilifiMediaClient once
  if (!clientRef.current) {
    clientRef.current = new KilifiMediaClient({
      apiKey:  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MEDIA_SERVER_API_KEY) || '',
      baseUrl: (typeof import.meta !== 'undefined' &&
                  (import.meta.env?.VITE_UPLOAD_SERVER_URL || import.meta.env?.VITE_MEDIA_SERVER_URL)) ||
               'https://media.kilifi.go.ke',
    });
  }

  const abort = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    setUploading(false);
    setStatus('Upload cancelled');
  }, []);

const handlePick = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  console.log('[FileUpload] File selected:', { name: file.name, size: file.size, type: file.type });

  setUploading(true);
  setProgress(0);
  setStatus('Preparing upload…');
  setError('');

  try {
    console.log('[FileUpload] Starting upload via KilifiMediaClient…');

    const { accepted, socket } = await clientRef.current.upload(file, {
      onProgress: (p) => {
        console.log('[FileUpload] onProgress:', `${Math.round(p * 100)}%`);
        setProgress(Math.round(p * 100));
        setStatus(p >= 1 ? 'Processing…' : `Uploading… ${Math.round(p * 100)}%`);
      },
      onQueued: (mediaFile) => {
        console.log('[FileUpload] onQueued:', mediaFile);
        setStatus('File received — processing…');
        setProgress(100);
        setStatus('Upload complete');
        setUploading(false);
        const resolvedValue = name=="url_path"?mediaFile.downloadUrl:mediaFile.publicUrl;
        console.log(`${name} Resolved value:`, resolvedValue);
        onUploaded(name, resolvedValue, mediaFile);
      },
      onProcessingComplete: (mediaFile) => {
        console.log('[FileUpload] onProcessingComplete:', mediaFile);
        socketRef.current = null;
        setProgress(100);
        setStatus('Upload complete');
        setUploading(false);
        const resolvedValue = name==="url_path"?mediaFile.downloadUrl:mediaFile.publicUrl;
        console.log(`${name} Resolved value:`, resolvedValue);
        onUploaded(name, resolvedValue, mediaFile);
      },
      onProcessingFailed: (errMsg) => {
        console.error('[FileUpload] onProcessingFailed:', errMsg);
        socketRef.current = null;
        setUploading(false);
        setError(errMsg || 'Processing failed');
      },
    });

    console.log('[FileUpload] upload() resolved — accepted:', accepted, '| socket:', socket ? 'open' : 'null');
    socketRef.current = socket;

    if (!accepted.awaitProcessing && !socket) {
      console.log('[FileUpload] No processing needed and no socket — onProcessingComplete already fired.');
      return;
    }

    if (accepted.awaitProcessing && !socket) {
      console.log('[FileUpload] No WS — falling back to polling for uuid:', accepted.uuid);
      setStatus('Polling for result…');
      const record = await clientRef.current.pollUntilReady(accepted.uuid);
      console.log('[FileUpload] pollUntilReady result:', record);
      setUploading(false);
      if (record && record.processing_status === 'ready') {
        setProgress(100);
        setStatus('Upload complete');
        onUploaded(name, record.public_url || record.view_url || '', record);
      } else {
        console.warn('[FileUpload] Polling timed out or record not ready:', record);
        setError('Processing timed out — try again.');
      }
    }
  } catch (err) {
    console.error('[FileUpload] Caught error:', err);
    setUploading(false);
    setError(err?.message || 'Upload failed');
  } finally {
    console.log('[FileUpload] handlePick finally — clearing file input.');
    if (fileRef.current) fileRef.current.value = '';
  }
};

  return (
    <Field label={label} required={required}>
      <div style={{ border: `1px dashed ${G.border}`, borderRadius: G.radius, padding: 12, background: G.surfaceAlt }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input ref={fileRef} type="file" accept={accept} onChange={handlePick} style={{ display: 'none' }} />
          <Btn size="sm" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Choose file'}
          </Btn>
          {uploading && <Btn size="sm" variant="ghost" onClick={abort}>Cancel</Btn>}
          <div style={{ fontSize: 12, color: G.textMuted, minWidth: 120 }}>
            {uploading ? `${progress}%` : (value ? 'Uploaded' : (placeholder || 'No file selected'))}
          </div>
        </div>
        {(uploading || status) && (
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: error ? G.danger : G.accent,
                borderRadius: 99, transition: 'width .2s ease',
              }} />
            </div>
            <div style={{ fontSize: 11, color: error ? G.danger : G.textMuted, marginTop: 6 }}>
              {error || status}
            </div>
          </div>
        )}
        {value && (
          <div style={{ marginTop: 10, fontSize: 12, wordBreak: 'break-all' }}>
            <div style={{ color: G.textFaint, marginBottom: 4 }}>Saved value</div>
            <div style={{ color: G.text }}>{value}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Btn size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(value).catch(() => {})}>Copy path</Btn>
              <Btn size="sm" variant="ghost" onClick={() => onUploaded(name, '', null)}>Clear</Btn>
            </div>
          </div>
        )}
        {helper && <div style={{ marginTop: 8, fontSize: 11, color: G.textFaint }}>{helper}</div>}
      </div>
    </Field>
  );
}

function CrudPanel({ title, subtitle, columns, items = [], loading, error, onAdd, onEdit, onDelete, renderForm, formTitle, formWidth, searchKeys = [], extraActions, renderFilters, onOpenAdd, onOpenEdit }) {
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const lq = q.toLowerCase();
    return items.filter((item) => searchKeys.some((k) => String(item?.[k] || '').toLowerCase().includes(lq)));
  }, [items, q, searchKeys]);

  const handleDelete = (item) => {
    setConfirm({ msg: `Delete "${item.title || item.name || item.email || 'this record'}"? This cannot be undone.`, item });
  };

  return (
    <>
      {confirm && (
        <Modal title="Confirm action" onClose={() => setConfirm(null)} width={380}>
          <p style={{ fontSize: 14, color: G.text, marginBottom: 24 }}>{confirm.msg}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setConfirm(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={async () => { await onDelete(confirm.item); setConfirm(null); }}>Confirm</Btn>
          </div>
        </Modal>
      )}
      {modal && renderForm && (
        <Modal title={`${modal.mode === 'edit' ? 'Edit' : 'Add'} ${formTitle || title}`} onClose={() => setModal(null)} width={formWidth}>
          {renderForm({ mode: modal.mode, item: modal.item, close: () => setModal(null) })}
        </Modal>
      )}
      <Card>
        <CardHeader
          title={title}
          subtitle={subtitle}
          actions={<>
            {onAdd && <Btn size="sm" onClick={() => { onOpenAdd?.(); setModal({ mode: 'add' }); }}>＋ Add</Btn>}
            {extraActions}
          </>}
        />
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${G.border}`, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {searchKeys.length > 0 && (
            <input className="klf-input" style={{ maxWidth: 280 }} placeholder={`Search ${title.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} />
          )}
          {renderFilters?.()}
        </div>
        <div style={{ padding: '16px' }}>
          <Err msg={error} />
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <Empty />
        ) : (
          <div className="klf-scroll" style={{ overflowX: 'auto' }}>
            <table className="klf-table">
              <thead>
                <tr>
                  {columns.map((c) => <th key={c.key}>{c.label}</th>)}
                  {(onEdit || onDelete) && <th style={{ width: 110 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="klf-fade">
                    {columns.map((c) => <td key={c.key}>{c.render ? c.render(item) : (item[c.key] ?? '—')}</td>)}
                    {(onEdit || onDelete) && (
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {onEdit && <Btn size="sm" variant="ghost" onClick={() => { onOpenEdit?.(item); setModal({ mode: 'edit', item }); }}>Edit</Btn>}
                          {onDelete && <Btn size="sm" variant="danger" onClick={() => handleDelete(item)}>Del</Btn>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${G.border}`, fontSize: 12, color: G.textFaint }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</div>
      </Card>
    </>
  );
}

export {
  G, css, buildCan, ADMIN_ROLES,
  Spinner, Toast, useToast,
  Btn, Badge, StatusBadge,
  Card, CardHeader, Empty, Err, StatTile,
  Modal, Field, TF, TA, SF,
  JsonViewer, useForm, FileUploadField,
  CrudPanel,
};