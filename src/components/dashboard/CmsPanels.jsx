import { useEffect, useRef, useState } from 'react';
import { G, Spinner, useToast, Btn, Badge, StatusBadge, Card, CardHeader, Err, TF, TA, SF, JsonViewer, useForm, FileUploadField, CrudPanel } from './shared';
import { admin, staff, adminCms, adminReports, getItems, system } from '../../api';

function OrgFinancePanel({ token }) {
  const [toast, showToast] = useToast();
  const [profileRes, setProfileRes] = useState(null);
  const [financeRes, setFinanceRes] = useState(null);
  const [profileForm, onProfileChange] = useForm({});
  const [financeForm, onFinanceChange] = useForm({});
  const [loading, setLoading] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try { const res = await admin.organisation.profile(token); setProfileRes(res); }
    catch (e) { showToast(e.message, 'error'); } finally { setLoading(false); }
  };

  const loadFinance = async () => {
    setLoading(true);
    try { const res = await admin.finance.overview(token); setFinanceRes(res); }
    catch (e) { showToast(e.message, 'error'); } finally { setLoading(false); }
  };

  const saveProfile = async () => {
    try { const res = await admin.cms.upsertProfile(profileForm, token); setProfileRes(res); showToast('Organisation profile saved'); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const saveFinance = async () => {
    try { const res = await admin.finance.save(financeForm, token); setFinanceRes(res); showToast('Finance overview saved'); }
    catch (e) { showToast(e.message, 'error'); }
  };

  return (
    <>
      {toast}
      <div style={{ display: 'grid', gap: 20 }}>
        <Card>
          <CardHeader title="Organisation Profile" subtitle="Post-login admin organisation profile routes"
            actions={<><Btn size="sm" variant="secondary" onClick={loadProfile} disabled={loading}>Load</Btn><Btn size="sm" onClick={saveProfile}>Save</Btn></>} />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TF label="Title" name="title" value={profileForm.title} onChange={onProfileChange} />
              <TF label="Subtitle" name="subtitle" value={profileForm.subtitle} onChange={onProfileChange} />
            </div>
            <TA label="Description" name="description" value={profileForm.description} onChange={onProfileChange} rows={4} />
            <div style={{ marginTop: 16 }}><JsonViewer value={profileRes} /></div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Finance Overview" subtitle="Post-login admin finance routes"
            actions={<><Btn size="sm" variant="secondary" onClick={loadFinance} disabled={loading}>Load</Btn><Btn size="sm" onClick={saveFinance}>Save</Btn></>} />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TF label="Budget" name="budget" value={financeForm.budget} onChange={onFinanceChange} />
              <TF label="Spent" name="spent" value={financeForm.spent} onChange={onFinanceChange} />
            </div>
            <TA label="Notes" name="notes" value={financeForm.notes} onChange={onFinanceChange} rows={4} />
            <div style={{ marginTop: 16 }}><JsonViewer value={financeRes} /></div>
          </div>
        </Card>
      </div>
    </>
  );
}

function ReportsPanel({ token }) {
  const [type, setType] = useState('staff-list');
  const [result, setResult] = useState(null);
  const [html, setHtml] = useState('');
  const [title, setTitle] = useState('Reports');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, showToast] = useToast();
  const iframeRef = useRef(null);
  const printFrameRef = useRef(null);

  const REPORTS = [
    { type: 'admin-list', label: 'Admin List' },
    { type: 'staff-list', label: 'Staff List' },
    { type: 'system-logs', label: 'Logs' },
    { type: 'cms-services', label: 'Services' },
    { type: 'cms-sectors', label: 'Sectors' },
    { type: 'cms-departments', label: 'Departments' },
    { type: 'analytics', label: 'Analytics' },
  ];

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    setHtml('');

    const selected = REPORTS.find((r) => r.type === type);
    setTitle(selected?.label || type);

    try {
      const res = await adminReports.getReport(type, token);
      setResult(res);

      const raw =
        typeof res === 'string'
          ? res
          : res?.data?.html ||
            res?.html ||
            (typeof res?.data === 'string'
              ? res.data
              : `<pre style="white-space:pre-wrap;font-family:monospace;padding:16px;">${escapeHtml(
                  JSON.stringify(res, null, 2)
                )}</pre>`);

      setHtml(raw);
      showToast('Report fetched');
    } catch (e) {
      const message = e?.message || 'Failed to fetch report';
      setError(message);
      setResult({ error: message, data: e?.data || null });
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Injects the HTML into a hidden iframe styled for print, then triggers
  // the browser's native print dialog. The user can select "Save as PDF"
  // from there — no external libraries required.
  const downloadPdf = () => {
    if (!html) return;

    const filename = `${title.replace(/\s+/g, '-').toLowerCase()}.pdf`;

    // Build a self-contained print document that sets the suggested filename
    // via <title> (browsers use this as the default save name in print-to-PDF).
    const printDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      color: #111;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 0.5px solid #dcdcdc; padding: 6px 10px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
    img { max-width: 100%; }
    a { color: inherit; text-decoration: none; }
    pre { white-space: pre-wrap; word-break: break-all; }
  </style>
</head>
<body>
${html}
</body>
</html>`;

    // Re-use a persistent hidden iframe so we don't pile up DOM nodes
    let frame = printFrameRef.current;
    if (!frame) {
      frame = document.createElement('iframe');
      frame.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
      document.body.appendChild(frame);
      printFrameRef.current = frame;
    }

    frame.onload = () => {
      try {
        // Give the browser a tick to finish layout before printing
        setTimeout(() => {
          frame.contentWindow.focus();
          frame.contentWindow.print();
        }, 150);
      } catch {
        // Cross-origin fallback — open in a new tab instead
        const blob = new Blob([printDoc], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    };

    frame.srcdoc = printDoc;
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return (
    <>
      {toast}

      <div style={{ display: 'grid', gap: 16 }}>
        <Card>
          <CardHeader
            title="Reports"
            subtitle="Exercises admin report endpoint from the post-login dashboard"
          />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 220 }}>
                <SF
                  label="Report Type"
                  name="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  options={REPORTS.map((r) => r.type)}
                />
              </div>
              <Btn onClick={fetchReport} disabled={loading}>
                {loading ? <Spinner size={12} /> : null}
                Fetch Report
              </Btn>
            </div>
          </div>
        </Card>

        {error ? <Err msg={error} /> : null}

        {(loading || html || result) && (
          <Card>
            <CardHeader
              title={title || 'Report'}
              actions={
                <>
                  <Btn
                    size="sm"
                    variant="ghost"
                    onClick={() => iframeRef.current?.contentWindow?.print()}
                    disabled={!html || loading}
                  >
                    Print
                  </Btn>
                  <Btn
                    size="sm"
                    variant="primary"
                    onClick={downloadPdf}
                    disabled={!html || loading}
                  >
                    ↓ Save as PDF
                  </Btn>
                </>
              }
            />
            <div style={{ padding: 16 }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <Spinner size={32} />
                </div>
              ) : html ? (
                <iframe
                  ref={iframeRef}
                  title="report"
                  srcDoc={html}
                  style={{
                    width: '100%',
                    minHeight: 560,
                    border: 'none',
                    borderRadius: G.radius,
                    background: '#fff',
                  }}
                  sandbox="allow-same-origin allow-scripts"
                />
              ) : (
                <JsonViewer value={result} />
              )}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

const STATUS_OPTS = ['draft', 'published', 'archived'];

/**
 * Generic CMS CRUD factory (mirrors App 1's buildCmsCrud).
 * config shape: { label, title, subtitle, list, create, update, delete,
 *                 fields, columns, searchKeys, formWidth }
 */
function buildCmsCrud(config) {
  return function CmsCrudPanel({ token }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, showToast] = useToast();
    const [form, onChange, setForm, reset] = useForm({});
    const [saving, setSaving] = useState(false);

    const load = async () => {
      setLoading(true);
      try {
        const res = await config.list(token, { per_page: 100 });
        setItems(getItems(res));
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const save = async ({ mode, item, close }) => {
      setSaving(true);
      try {
        if (mode === 'add') await config.create(token, form);
        else await config.update(token, item.id, form);
        showToast(mode === 'add' ? `${config.label} created` : `${config.label} updated`);
        await load(); close();
      } catch (e) { showToast(e.message, 'error'); } finally { setSaving(false); }
    };

    const del = async (item) => {
      try { await config.delete(token, item.id); await load(); showToast(`${config.label} deleted`); }
      catch (e) { showToast(e.message, 'error'); }
    };

    const renderForm = ({ mode, item, close }) => {
      const setFieldValue = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
      return (
        <div>
          {config.fields.map((f) => {
            if (f.type === 'select') return <SF key={f.name} label={f.label} name={f.name} value={form[f.name]} onChange={onChange} options={f.options} required={f.required} />;
            if (f.type === 'textarea') return <TA key={f.name} label={f.label} name={f.name} value={form[f.name]} onChange={onChange} rows={f.rows} />;
            if (f.type === 'file-upload') return <FileUploadField key={f.name} label={f.label} name={f.name} value={form[f.name]} required={f.required} accept={f.accept} placeholder={f.placeholder} helper={f.helper} onUploaded={setFieldValue} />;
            return <TF key={f.name} label={f.label} name={f.name} value={form[f.name]} onChange={onChange} type={f.type || 'text'} required={f.required} />;
          })}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={close}>Cancel</Btn>
            <Btn variant="primary" onClick={() => save({ mode, item, close })} disabled={saving}>{saving ? 'Saving…' : `Save ${config.label}`}</Btn>
          </div>
        </div>
      );
    };

    return (
      <>
        {toast}
        <CrudPanel
          title={config.title} subtitle={config.subtitle}
          items={items} loading={loading} error={error}
          onAdd={() => {}} onEdit={() => {}} onDelete={del}
          onOpenAdd={() => reset({})}
          onOpenEdit={(item) => reset({ ...item })}
          renderForm={renderForm} formTitle={config.label} formWidth={config.formWidth || 560}
          searchKeys={config.searchKeys || ['title', 'name']}
          columns={config.columns}
        />
      </>
    );
  };
}

const CmsNewsPanel = buildCmsCrud({
  label: 'Article', title: 'News', subtitle: 'Manage news articles',
  list: (t, p) => adminCms.listNews(t, p),
  create: (t, d) => adminCms.createNews(t, d),
  update: (t, id, d) => adminCms.updateNews(t, id, d),
  delete: (t, id) => adminCms.deleteNews(t, id),
  fields: [
    { name: 'title', label: 'Title', required: true },
    { name: 'publish_date', label: 'Publish Date', type: 'date' },
    { name: 'excerpt', label: 'Excerpt', type: 'textarea', rows: 2 },
    { name: 'body', label: 'Body', type: 'textarea', rows: 5 },
    { name: 'image', label: 'Cover Image', type: 'file-upload', accept: 'image/*' },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
  ],
  columns: [
    { key: 'title', label: 'Title', render: (r) => <div style={{ fontWeight: 600 }}>{r.title}</div> },
    { key: 'publish_date', label: 'Date' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ],
  searchKeys: ['title', 'status'],
});

const CmsEventsPanel = buildCmsCrud({
  label: 'Event', title: 'Events', subtitle: 'Manage public events',
  list: (t, p) => adminCms.listEvents(t, p),
  create: (t, d) => adminCms.createEvent(t, d),
  update: (t, id, d) => adminCms.updateEvent(t, id, d),
  delete: (t, id) => adminCms.deleteEvent(t, id),
  fields: [
    { name: 'title', label: 'Title', required: true },
    { name: 'date_text', label: 'Date Text' },
    { name: 'time_text', label: 'Time' },
    { name: 'location', label: 'Location' },
    { name: 'price', label: 'Price' },
    { name: 'start_date', label: 'Start Date', type: 'date' },
    { name: 'end_date', label: 'End Date', type: 'date' },
    { name: 'desc', label: 'Description', type: 'textarea', rows: 3 },
    { name: 'image', label: 'Cover Image', type: 'file-upload', accept: 'image/*' },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
  ],
  columns: [
    { key: 'title', label: 'Title', render: (r) => <div style={{ fontWeight: 600 }}>{r.title}</div> },
    { key: 'date_text', label: 'Date' },
    { key: 'location', label: 'Location' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ],
  searchKeys: ['title', 'location'],
});

const CmsServicesPanel = buildCmsCrud({
  label: 'Service', title: 'Services', subtitle: 'Manage county services',
  list: (t, p) => adminCms.listServices(t, p),
  create: (t, d) => adminCms.createService(t, d),
  update: (t, id, d) => adminCms.updateService(t, id, d),
  delete: (t, id) => adminCms.deleteService(t, id),
  fields: [
    { name: 'title', label: 'Title', required: true },
    { name: 'short_desc', label: 'Short Description' },
    { name: 'desc', label: 'Full Description', type: 'textarea', rows: 4 },
    { name: 'icon', label: 'Icon' },
    { name: 'image', label: 'Image', type: 'file-upload', accept: 'image/*' },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
  ],
  columns: [
    { key: 'title', label: 'Title', render: (r) => <div style={{ fontWeight: 600 }}>{r.title}</div> },
    { key: 'short_desc', label: 'Summary', render: (r) => <span style={{ fontSize: 12, color: G.textMuted }}>{(r.short_desc || '').slice(0, 60)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ],
  searchKeys: ['title'],
});

const CmsDepartmentsPanel = buildCmsCrud({
  label: 'Department', title: 'Departments', subtitle: 'Manage county departments',
  list: (t, p) => adminCms.listDepartments(t, p),
  create: (t, d) => adminCms.createDepartment(t, d),
  update: (t, id, d) => adminCms.updateDepartment(t, id, d),
  delete: (t, id) => adminCms.deleteDepartment(t, id),
  fields: [
    { name: 'title', label: 'Title', required: true },
    { name: 'icon', label: 'Icon' },
    { name: 'governor', label: 'Governor/Head' },
    { name: 'image', label: 'Department Image', type: 'file-upload', accept: 'image/*' },
    { name: 'governor_image', label: 'Governor Image', type: 'file-upload', accept: 'image/*' },
    { name: 'desc', label: 'Description', type: 'textarea', rows: 3 },
    { name: 'focus', label: 'Focus Area', type: 'textarea', rows: 2 },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
  ],
  columns: [
    { key: 'title', label: 'Title', render: (r) => <div style={{ fontWeight: 600 }}>{r.title}</div> },
    { key: 'governor', label: 'Head' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ],
  searchKeys: ['title', 'governor'],
});

const CmsProjectsPanel = buildCmsCrud({
  label: 'Project', title: 'Projects', subtitle: 'Manage county development projects',
  list: (t, p) => adminCms.listProjects(t, p),
  create: (t, d) => adminCms.createProject(t, d),
  update: (t, id, d) => adminCms.updateProject(t, id, d),
  delete: (t, id) => adminCms.deleteProject(t, id),
  fields: [
    { name: 'title', label: 'Title', required: true },
    { name: 'category', label: 'Category' },
    { name: 'location', label: 'Location' },
    { name: 'progress', label: 'Progress (%)', type: 'number' },
    { name: 'image', label: 'Cover Image', type: 'file-upload', accept: 'image/*' },
    { name: 'desc', label: 'Description', type: 'textarea', rows: 3 },
    { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'archived', 'ongoing', 'completed'] },
  ],
  columns: [
    { key: 'title', label: 'Title', render: (r) => <div style={{ fontWeight: 600 }}>{r.title}</div> },
    { key: 'location', label: 'Location' },
    { key: 'progress', label: 'Progress', render: (r) => <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ flex: 1, height: 6, background: G.border, borderRadius: 99, overflow: 'hidden' }}><div style={{ height: '100%', width: `${r.progress || 0}%`, background: G.accent, borderRadius: 99 }} /></div><span style={{ fontSize: 12 }}>{r.progress || 0}%</span></div> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ],
  searchKeys: ['title', 'location', 'status'],
});

const CmsSectorsPanel = buildCmsCrud({
  label: 'Sector', title: 'Sectors', subtitle: 'Manage investment & service sectors',
  list: (t, p) => adminCms.listSectors(t, p),
  create: (t, d) => adminCms.createSector(t, d),
  update: (t, id, d) => adminCms.updateSector(t, id, d),
  delete: (t, id) => adminCms.deleteSector(t, id),
  fields: [
    { name: 'title', label: 'Title', required: true },
    { name: 'icon', label: 'Icon' },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
    { name: 'image', label: 'Cover Image', type: 'file-upload', accept: 'image/*' },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
  ],
  columns: [
    { key: 'title', label: 'Title', render: (r) => <div style={{ fontWeight: 600 }}>{r.title}</div> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ],
  searchKeys: ['title'],
});

const CmsTendersPanel = buildCmsCrud({
  label: 'Tender', title: 'Tenders', subtitle: 'Manage public procurement tenders',
  list: (t, p) => adminCms.listTenders(t, p),
  create: (t, d) => adminCms.createTender(t, d),
  update: (t, id, d) => adminCms.updateTender(t, id, d),
  delete: (t, id) => adminCms.deleteTender(t, id),
  fields: [
    { name: 'tender_code', label: 'Tender Code', required: true },
    { name: 'title', label: 'Title', required: true },
    { name: 'category', label: 'Category' },
    { name: 'closing_date', label: 'Closing Date', type: 'date' },
    { name: 'url_path', label: 'Tender Document', type: 'file-upload', accept: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx' },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
    { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed', 'Awarded'] },
  ],
  columns: [
    { key: 'title', label: 'Title', render: (r) => <div><div style={{ fontWeight: 600 }}>{r.title}</div><div style={{ fontSize: 11, color: G.textFaint }}>{r.tender_code}</div></div> },
    { key: 'category', label: 'Category' },
    { key: 'closing_date', label: 'Closes' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ],
  searchKeys: ['title', 'tender_code', 'category'],
});

const CmsAnnouncementsPanel = buildCmsCrud({
  label: 'Announcement', title: 'Announcements', subtitle: 'Public & staff announcements',
  list: (t, p) => adminCms.listAnnouncements(t, p),
  create: (t, d) => adminCms.createAnnouncement(t, d),
  update: (t, id, d) => adminCms.updateAnnouncement(t, id, d),
  delete: (t, id) => adminCms.deleteAnnouncement(t, id),
  fields: [
    { name: 'title', label: 'Title', required: true },
    { name: 'user_type', label: 'Audience', type: 'select', options: ['staff', 'public'], required: true },
    { name: 'type', label: 'Type' },
    { name: 'announcement_date', label: 'Date', type: 'date' },
    { name: 'body', label: 'Body', type: 'textarea', rows: 4 },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
  ],
  columns: [
    { key: 'title', label: 'Title', render: (r) => <div style={{ fontWeight: 600 }}>{r.title}</div> },
    { key: 'user_type', label: 'Audience', render: (r) => <Badge>{r.user_type}</Badge> },
    { key: 'announcement_date', label: 'Date' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ],
  searchKeys: ['title', 'type'],
});

const CmsDocumentsPanel = buildCmsCrud({
  label: 'Document', title: 'Documents', subtitle: 'Official county documents library',
  list: (t, p) => adminCms.listDocuments(t, p),
  create: (t, d) => adminCms.createDocument(t, d),
  update: (t, id, d) => adminCms.updateDocument(t, id, d),
  delete: (t, id) => adminCms.deleteDocument(t, id),
  fields: [
    { name: 'title', label: 'Title', required: true },
    { name: 'category', label: 'Category', type: 'select', required: true, options: ['audit_and_finance', 'budgeting', 'legal', 'planning','jobs','shortlisted'] },
    { name: 'url_path', label: 'Document File', type: 'file-upload', required: true, accept: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx' },
    { name: 'type', label: 'Type' },
    { name: 'code', label: 'Code' },
    { name: 'year', label: 'Year', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: ['published', 'official', 'active'] },
  ],
  columns: [
    { key: 'title', label: 'Title', render: (r) => <div style={{ fontWeight: 600 }}>{r.title}</div> },
    { key: 'category', label: 'Category', render: (r) => <Badge>{r.category?.replace(/_/g, ' ')}</Badge> },
    { key: 'year', label: 'Year' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ],
  searchKeys: ['title', 'category', 'code'],
});

const CmsFaqsPanel = buildCmsCrud({
  label: 'FAQ', title: 'FAQs', subtitle: 'Frequently asked questions',
  list: (t, p) => adminCms.listFaqs(t, p),
  create: (t, d) => adminCms.createFaq(t, d),
  update: (t, id, d) => adminCms.updateFaq(t, id, d),
  delete: (t, id) => adminCms.deleteFaq(t, id),
  fields: [
    { name: 'question', label: 'Question', required: true },
    { name: 'answer', label: 'Answer', type: 'textarea', rows: 4, required: true },
    { name: 'category', label: 'Category' },
    { name: 'sort_order', label: 'Sort Order', type: 'number' },
  ],
  columns: [
    { key: 'question', label: 'Question', render: (r) => <div style={{ fontWeight: 500 }}>{(r.question || '').slice(0, 80)}</div> },
    { key: 'category', label: 'Category' },
    { key: 'is_published', label: 'Published', render: (r) => <StatusBadge status={r.is_published ? 'published' : 'draft'} /> },
  ],
  searchKeys: ['question', 'category'],
});

const CmsBlogPanel = buildCmsCrud({
  label: 'Post', title: 'Blog Posts', subtitle: 'Manage blog & editorial content',
  list: (t, p) => adminCms.listBlogPosts(t, p),
  create: (t, d) => adminCms.createBlogPost(t, d),
  update: (t, id, d) => adminCms.updateBlogPost(t, id, d),
  delete: (t, id) => adminCms.deleteBlogPost(t, id),
  fields: [
    { name: 'title', label: 'Title', required: true },
    { name: 'author', label: 'Author' },
    { name: 'category', label: 'Category' },
    { name: 'publish_date', label: 'Publish Date', type: 'date' },
    { name: 'read_time', label: 'Read Time (e.g. 5 min)' },
    { name: 'excerpt', label: 'Excerpt', type: 'textarea', rows: 2 },
    { name: 'image', label: 'Cover Image', type: 'file-upload', accept: 'image/*' },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
  ],
  columns: [
    { key: 'title', label: 'Title', render: (r) => <div style={{ fontWeight: 600 }}>{r.title}</div> },
    { key: 'author', label: 'Author' },
    { key: 'category', label: 'Category' },
    { key: 'publish_date', label: 'Date' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ],
  searchKeys: ['title', 'author', 'category'],
});

const CmsLeadershipPanel = buildCmsCrud({
  label: 'Leader', title: 'Leadership', subtitle: 'Manage leadership profiles',
  list: (t, p) => adminCms.listLeadershipProfiles(t, p),
  create: (t, d) => adminCms.createLeadershipProfile(t, d),
  update: (t, id, d) => adminCms.updateLeadershipProfile(t, id, d),
  delete: (t, id) => adminCms.deleteLeadershipProfile(t, id),
  fields: [
    { name: 'name', label: 'Full Name', required: true },
    { name: 'role', label: 'Role / Title', required: true },
    { name: 'display_order', label: 'Display Order', type: 'number' },
    { name: 'image', label: 'Photo', type: 'file-upload', accept: 'image/*' },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTS },
  ],
  columns: [
    { key: 'name', label: 'Name', render: (r) => <div style={{ fontWeight: 600 }}>{r.name}</div> },
    { key: 'role', label: 'Role' },
    { key: 'display_order', label: 'Order' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ],
  searchKeys: ['name', 'role'],
});

const CmsPartnersPanel = buildCmsCrud({
  label: 'Partner',
  title: 'Partners',
  subtitle: 'Manage county partners, projects, milestones, documents, and contacts',

  list: (t, p) => adminCms.listPartners(t, p),
  create: (t, d) => adminCms.createPartner(t, d),
  update: (t, id, d) => adminCms.updatePartner(t, id, d),
  delete: (t, id) => adminCms.deletePartner(t, id),

  fields: [
    { name: 'name', label: 'Partner Name', required: true },
    { name: 'slug', label: 'Slug' },

    { name: 'category', label: 'Category' },
    { name: 'sector', label: 'Sector' },
    { name: 'partnership_type', label: 'Partnership Type' },

    { name: 'logo', label: 'Logo URL' },

    { name: 'website_url', label: 'Website URL' },

    { name: 'contact_email', label: 'Contact Email' },
    { name: 'contact_phone', label: 'Contact Phone' },

    { name: 'start_year', label: 'Start Year', type: 'number' },
    { name: 'end_year', label: 'End Year', type: 'number' },

    { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
    { name: 'overview', label: 'Overview', type: 'textarea', rows: 4 },

    {
      name: 'partnership_status',
      label: 'Partnership Status',
      type: 'select',
      options: ['pending', 'active', 'inactive', 'suspended']
    },

    {
      name: 'status',
      label: 'Publish Status',
      type: 'select',
      options: ['draft', 'published', 'archived']
    },

    { name: 'is_featured', label: 'Featured', type: 'checkbox' },
    { name: 'is_published', label: 'Published', type: 'checkbox' },

    { name: 'sort_order', label: 'Sort Order', type: 'number' },
  ],

  columns: [
    {
      key: 'name',
      label: 'Partner',
      render: (r) => <div style={{ fontWeight: 600 }}>{r.name}</div>
    },

    { key: 'category', label: 'Category' },
    { key: 'sector', label: 'Sector' },
    { key: 'partnership_type', label: 'Type' },

    {
      key: 'partnership_status',
      label: 'Partnership',
      render: (r) => <StatusBadge status={r.partnership_status} />
    },

    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />
    },

    { key: 'start_year', label: 'Start' },
    { key: 'end_year', label: 'End' },
  ],

  searchKeys: [
    'name',
    'slug',
    'category',
    'sector',
    'partnership_type',
    'contact_email',
    'contact_phone',
    'description',
    'overview',
  ],
});

export { OrgFinancePanel, ReportsPanel, CmsNewsPanel, CmsEventsPanel, CmsServicesPanel, CmsDepartmentsPanel, CmsProjectsPanel, CmsSectorsPanel, CmsTendersPanel, CmsAnnouncementsPanel, CmsDocumentsPanel, CmsFaqsPanel, CmsBlogPanel, CmsLeadershipPanel, CmsPartnersPanel };
