import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { G, Spinner, useToast, Btn, Badge, StatusBadge, Card, CardHeader, Empty, Err, Modal, Field, TF, TA, SF, JsonViewer, useForm, FileUploadField, CrudPanel } from './shared';
import { admin, staff, getItems, adminCore, system } from '../../api';

function StaffAdminPanel({ token }) {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, showToast] = useToast();
  const [form, onChange, setForm, reset] = useForm({});
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await admin.staff.listStaff(token, { page: 1, per_page: 100 });
      setItems(getItems(res));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await admin.staff.listLogs(token, { page: 1, per_page: 20 });
      setLogs(getItems(res));
    } catch (e) { showToast(e.message, 'error'); } finally { setLogsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async ({ mode, item, close }) => {
    setSaving(true);
    try {
      if (mode === 'add') await admin.staff.create(form, token);
      else await admin.staff.updateStaff(item.id, form, token);
      await load();
      showToast(mode === 'add' ? 'Staff created' : 'Staff updated');
      close();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const del = async (item) => {
    try {
      await admin.staff.deleteStaff(item.id, token);
      await load();
      showToast('Staff deleted');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const openImportPicker = () => {
    fileInputRef.current?.click();
  };

  const importCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('csv', file);

      // expects an endpoint like admin.staff.importCsv(formData, token)
      await adminCore.importStaff(token, fd);

      await load();
      showToast('Staff CSV imported successfully');
    } catch (e2) {
      showToast(e2.message || 'CSV import failed', 'error');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderForm = ({ mode, item, close }) => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <TF label="Staff Code" name="staff_code" value={form.staff_code} onChange={onChange} required />
        <TF label="Full Name" name="name" value={form.name} onChange={onChange} required />
        <TF label="Email" name="email" value={form.email} onChange={onChange} type="email" />
        <TF label="Phone" name="phone" value={form.phone} onChange={onChange} />
        <FileUploadField label="Profile Photo" name="image" value={form.image} accept="image/*" onUploaded={(name, value) => setForm((f) => ({ ...f, [name]: value }))} />
        <TF label="Department" name="dept" value={form.dept} onChange={onChange} />
        <TF label="Role" name="role" value={form.role} onChange={onChange} />
        <TF label="Job Group" name="job_group" value={form.job_group} onChange={onChange} />
        <TF label="Duty Station" name="duty_station" value={form.duty_station} onChange={onChange} />
        <TF label="Terms of Service" name="terms_of_service" value={form.terms_of_service} onChange={onChange} />
        <TF label="Date of Birth" name="date_of_birth" value={form.date_of_birth} onChange={onChange} type="date" />
        <TF label="Date Engaged" name="date_engaged" value={form.date_engaged} onChange={onChange} type="date" />
        <TF label="National ID" name="national_id" value={form.national_id} onChange={onChange} />
        <TF label="PR Number" name="pr_number" value={form.pr_number} onChange={onChange} />
        <SF label="Gender" name="gender" value={form.gender} onChange={onChange} options={['Male', 'Female', 'Other']} />
        <SF label="Status" name="status" value={form.status} onChange={onChange} options={['Active', 'Inactive', 'Suspended']} />
        <SF label="Salutation" name="salutation" value={form.salutation} onChange={onChange} options={['Mr', 'Mrs', 'Ms', 'Dr', 'Prof']} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
        <Btn variant="ghost" onClick={close}>Cancel</Btn>
        <Btn variant="primary" onClick={() => save({ mode, item, close })} disabled={saving}>
          {saving ? 'Saving…' : 'Save Staff'}
        </Btn>
      </div>
    </div>
  );

  return (
    <>
      {toast}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={importCsv}
      />

      <div style={{ display: 'grid', gap: 20 }}>
        <CrudPanel
          title="Staff Management"
          subtitle="Create, update and remove county staff records"
          items={items}
          loading={loading}
          error={error}
          onAdd={() => {}}
          onEdit={() => {}}
          onDelete={del}
          onOpenAdd={() => reset({})}
          onOpenEdit={(item) => reset({ ...item })}
          renderForm={renderForm}
          formTitle="Staff"
          formWidth={760}
          searchKeys={['name', 'email', 'staff_code', 'dept', 'role']}
          extraActions={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Btn size="sm" variant="secondary" onClick={openImportPicker} disabled={importing}>
                {importing ? 'Importing CSV…' : 'Import Staff CSV'}
              </Btn>
              <Btn size="sm" variant="secondary" onClick={loadLogs} disabled={logsLoading}>
                {logsLoading ? 'Loading logs…' : 'Load Logs'}
              </Btn>
            </div>
          }
          columns={[
            { key: 'name', label: 'Name', render: (r) => <div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: G.textFaint }}>{r.staff_code}</div></div> },
            { key: 'dept', label: 'Department' },
            { key: 'role', label: 'Role' },
            { key: 'email', label: 'Email' },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
        <Card>
          <CardHeader title="Staff Logs" subtitle="Exercises admin staff logs endpoint" />
          <div style={{ padding: 16 }}>
            {logs.length === 0 ? <Empty icon="🧾" message="No logs loaded yet" /> : <JsonViewer value={logs} />}
          </div>
        </Card>
      </div>
    </>
  );
}

function LeaveAdminPanel({ token }) {
  const [tab, setTab] = useState('applications');
  const [items, setItems] = useState([]);
  const [balances, setBalances] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [actioning, setActioning] = useState(false);
  const [toast, showToast] = useToast();
  const [typeForm, onTypeChange, , resetTypeForm] = useForm({ name: '', code: '', default_days: '', requires_attachment: false, is_active: true });

  const load = async () => {
    setLoading(true);
    try {
      const [appRes, balanceRes] = await Promise.all([
        admin.staff.listLeaveApplications(token, { page: 1, per_page: 100 }),
        admin.staff.listLeaveBalances(token, { page: 1, per_page: 100 }),
      ]);
      setItems(getItems(appRes));
      setBalances(getItems(balanceRes));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const loadTypes = async () => {
    try {
      const typesRes = await staff.leave.types(token, { per_page: 100 });
      setTypes(getItems(typesRes));
    } catch { /* optional */ }
  };

  useEffect(() => { load(); loadTypes(); }, []);

  const action = async (type) => {
    if (!selected) return;
    setActioning(true);
    try {
      if (type === 'approve') await admin.staff.approveLeaveApplication(token,selected.id, { comment });
      else if (type === 'reject') await admin.staff.rejectLeaveApplication(token, selected.id, { comment });
      else await admin.staff.returnLeaveApplication(token, selected.id, { comment });
      showToast(`Leave ${type}d`); setSelected(null); setComment(''); await load();
    } catch (e) { showToast(e.message, 'error'); } finally { setActioning(false); }
  };

  const createType = async () => {
    try {
      await admin.staff.createLeaveType(token,typeForm);
      showToast('Leave type created'); resetTypeForm({}); await loadTypes();
    } catch (e) { showToast(e.message, 'error'); }
  };

  return (
    <>
      {toast}
      {selected && (
        <Modal title="Review Leave Application" onClose={() => setSelected(null)} width={520}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{selected.staff?.name || selected.staff_name || '—'}</div>
            <div style={{ fontSize: 13, color: G.textMuted, marginBottom: 2 }}>{selected.leave_type?.name || 'Leave'} · {selected.days_requested || '?'} days</div>
            <div style={{ fontSize: 13, color: G.textMuted }}>{selected.start_date} → {selected.end_date}</div>
            {selected.reason && <div style={{ marginTop: 10, fontSize: 13, background: G.surfaceAlt, borderRadius: 8, padding: '10px 12px' }}>{selected.reason}</div>}
          </div>
          <TA label="Comment (optional)" name="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a review comment…" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <Btn variant="success" onClick={() => action('approve')} disabled={actioning}>✓ Approve</Btn>
            <Btn variant="danger" onClick={() => action('reject')} disabled={actioning}>✕ Reject</Btn>
            <Btn variant="ghost" onClick={() => action('return')} disabled={actioning}>↩ Return</Btn>
          </div>
        </Modal>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['applications', 'balances', 'types'].map((t) => (
          <Btn key={t} variant={tab === t ? 'primary' : 'ghost'} onClick={() => setTab(t)}>{t}</Btn>
        ))}
      </div>
      {tab === 'applications' && (
        <CrudPanel
          title="Leave Administration" subtitle="Review and action staff leave applications"
          items={items} loading={loading} error={error}
          searchKeys={['status', 'start_date', 'end_date']}
          columns={[
            { key: 'staff', label: 'Staff', render: (r) => r.staff?.name || r.staff_name || '—' },
            { key: 'type', label: 'Leave Type', render: (r) => r.leave_type?.name || '—' },
            { key: 'start_date', label: 'Start' },
            { key: 'end_date', label: 'End' },
            { key: 'days_requested', label: 'Days' },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: '_action', label: 'Review', render: (r) => <Btn size="sm" onClick={() => setSelected(r)}>Review</Btn> },
          ]}
        />
      )}
      {tab === 'balances' && (
        <Card>
          <CardHeader title="Leave Balances" subtitle="Exercises admin leave balances endpoint" />
          <div style={{ padding: 16 }}>
            {balances.length === 0 ? <Empty icon="📊" message="No balances found" /> : <JsonViewer value={balances} />}
          </div>
        </Card>
      )}
      {tab === 'types' && (
        <Card>
          <CardHeader title="Leave Types" subtitle="Create leave types and inspect available list" />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TF label="Name" name="name" value={typeForm.name} onChange={onTypeChange} />
              <TF label="Code" name="code" value={typeForm.code} onChange={onTypeChange} />
              <TF label="Default Days" name="default_days" value={typeForm.default_days} onChange={onTypeChange} type="number" />
            </div>
            <div style={{ marginTop: 12 }}><Btn onClick={createType}>Create Type</Btn></div>
            <div style={{ marginTop: 16 }}>
              {types.length === 0 ? <Empty icon="🏷️" message="No leave types loaded" /> : <JsonViewer value={types} />}
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

function MyLeavePanel({ token }) {
  const [balances, setBalances] = useState([]);
  const [applications, setApplications] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, onChange, setForm] = useForm({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, showToast] = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [b, a, t] = await Promise.all([
        staff.leave.balances(token,{}).catch(() => ({ data: [] })),
        staff.leave.applications({}, token).catch(() => ({ data: [] })),
        staff.leave.types(token,{}).catch(() => ({ data: [] })),
      ]);
      setBalances(Array.isArray(b?.data) ? b.data : getItems(b));
      setApplications(getItems(a));
      setTypes(getItems(t));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    setSaving(true);
    try {
      await staff.leave.apply(form, token);
      showToast('Leave application submitted'); setShowForm(false); setForm({}); await load();
    } catch (e) { showToast(e.message, 'error'); } finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>;

  return (
    <>
      {toast}
      <div style={{ display: 'grid', gap: 20 }}>
        <Card>
          <CardHeader title="Leave Balances" subtitle="Your current entitlements" />
          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {balances.length === 0 ? <Empty message="No balances" /> : balances.map((b) => (
              <div key={b.id} style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: G.radius, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: G.accent }}>{b.remaining_days ?? '—'}</div>
                <div style={{ fontSize: 12, color: G.textMuted, marginTop: 4 }}>{b.leave_type?.name || b.type}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="My Applications" actions={<Btn size="sm" onClick={() => setShowForm((v) => !v)}>{showForm ? '✕ Cancel' : '＋ Apply'}</Btn>} />
          {showForm && (
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${G.border}` }}>
              <Err msg={error} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <SF label="Leave Type" name="leave_type_id" value={form.leave_type_id} onChange={onChange} required options={types.map((t) => ({ value: t.id, label: t.name }))} />
                <TF label="Start Date" name="start_date" value={form.start_date} onChange={onChange} type="date" required />
                <TF label="End Date" name="end_date" value={form.end_date} onChange={onChange} type="date" required />
              </div>
              <TA label="Reason" name="reason" value={form.reason} onChange={onChange} />
              <FileUploadField label="Supporting Document" name="attachment_url" value={form.attachment_url} accept="image/*,.pdf,.doc,.docx" onUploaded={(name, value) => setForm((f) => ({ ...f, [name]: value }))} />
              <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
                <Btn variant="primary" onClick={submit} disabled={saving}>{saving ? 'Submitting…' : 'Submit Application'}</Btn>
              </div>
            </div>
          )}
          <div style={{ padding: '8px 16px 16px' }}>
            {applications.length === 0 ? <Empty icon="📋" message="No applications yet" /> : applications.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', border: `1px solid ${G.border}`, borderRadius: G.radius, marginBottom: 8, background: G.surface }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.leave_type?.name || a.type}</div>
                  <div style={{ fontSize: 12, color: G.textMuted }}>{a.start_date} → {a.end_date} · {a.days_requested || '?'} days</div>
                </div>
                <StatusBadge status={a.status} />
                {a.status?.toLowerCase() === 'pending' && <Btn size="sm" variant="ghost" onClick={async () => { await staff.leave.cancel(a.id, token); load(); }}>Cancel</Btn>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function MyInvitationsPanel({ token }) {
  const [items, setItems] = useState([]);
  const [lookupToken, setLookupToken] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lookingUp, setLookingUp] = useState(false);
  const [actingId, setActingId] = useState('');
  const [error, setError] = useState('');
  const [toast, showToast] = useToast();

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await staff.invitations.list({ page: 1, per_page: 50 }, token);
      setItems(getItems(res));
    } catch (e) { setError(e.message || 'Failed to load invitations'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const openInvitation = async () => {
    if (!lookupToken.trim()) return;
    setLookingUp(true);
    try {
      const res = await staff.invitations.getByToken(lookupToken.trim(), token);
      setLookupResult(res?.data || res); showToast('Invitation loaded');
    } catch (e) { showToast(e.message, 'error'); setLookupResult(null); } finally { setLookingUp(false); }
  };

  const acceptInvitation = async (tokenValue, rowId = '') => {
    const nextToken = (tokenValue || lookupToken || '').trim();
    if (!nextToken) return;
    setActingId(rowId || nextToken);
    try {
      await staff.invitations.invitations.accept({ token: nextToken }, token);
      showToast('Invitation accepted'); await load();
      if (lookupResult) {
        const fresh = await staff.invitations.getByToken(nextToken, token).catch(() => null);
        setLookupResult(fresh?.data || null);
      }
    } catch (e) { showToast(e.message, 'error'); } finally { setActingId(''); }
  };

  const canAccept = (row) => ['pending', 'sent'].includes(String(row?.status || '').toLowerCase());

  return (
    <>
      {toast}
      <div style={{ display: 'grid', gap: 20 }}>
        <Card>
          <CardHeader title="My Invitations" subtitle="View invitations associated with your staff account" />
          <div style={{ padding: 16 }}>
            <Err msg={error} />
            {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
              : items.length === 0 ? <Empty icon="✉️" message="No invitations found" />
                : (
                  <div className="klf-scroll" style={{ overflowX: 'auto' }}>
                    <table className="klf-table">
                      <thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Status</th><th>Sent</th><th style={{ width: 180 }}>Actions</th></tr></thead>
                      <tbody>
                        {items.map((r) => {
                          const rowKey = r.id || r.token || r.email;
                          const busy = actingId === rowKey;
                          return (
                            <tr key={rowKey}>
                              <td>{r.email || '—'}</td>
                              <td>{r.name || '—'}</td>
                              <td>{r.role ? <Badge>{String(r.role).replace(/_/g, ' ')}</Badge> : '—'}</td>
                              <td><StatusBadge status={r.status} /></td>
                              <td>{r.created_at?.split('T')[0] || '—'}</td>
                              <td>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  <Btn size="sm" variant="ghost" onClick={() => { setLookupToken(r.token || ''); setLookupResult(r); }}>View</Btn>
                                  {canAccept(r) && <Btn size="sm" variant="success" disabled={busy} onClick={() => acceptInvitation(r.token, rowKey)}>{busy ? 'Accepting…' : 'Accept'}</Btn>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Open Invitation" subtitle="Load or accept a specific invitation token" />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'end' }}>
              <TF label="Invitation Token" name="lookupToken" value={lookupToken} onChange={(e) => setLookupToken(e.target.value)} placeholder="Paste invitation token" />
              <Btn onClick={openInvitation} disabled={lookingUp || !lookupToken.trim()}>{lookingUp ? 'Loading…' : 'Open'}</Btn>
              <Btn variant="success" onClick={() => acceptInvitation()} disabled={!lookupToken.trim()}>Accept</Btn>
            </div>
            {lookupResult && (
              <div style={{ marginTop: 16, border: `1px solid ${G.border}`, borderRadius: G.radiusLg, padding: 16, background: G.surfaceAlt }}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>Email:</strong> {lookupResult.email || '—'}</div>
                  <div><strong>Name:</strong> {lookupResult.name || '—'}</div>
                  <div><strong>Role:</strong> {lookupResult.role ? String(lookupResult.role).replace(/_/g, ' ') : '—'}</div>
                  <div><strong>Status:</strong> <StatusBadge status={lookupResult.status} /></div>
                  <div><strong>Expires:</strong> {lookupResult.expires_at || '—'}</div>
                </div>
                {canAccept(lookupResult) && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <Btn variant="success" onClick={() => acceptInvitation(lookupToken || lookupResult.token)}>Accept Invitation</Btn>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function InvitationsPanel({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, showToast] = useToast();
  const [form, onChange, setForm, reset] = useForm({ permissions: [] });
  const [roles, setRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [assignablePermissions, setAssignablePermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [staffItems, setStaffItems] = useState([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [tokenLookup, setTokenLookup] = useState(null);
  const [actingId, setActingId] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await admin.invitations.list({ per_page: 100, show_all: true }, token);
      const rolesRes = await system.roles.list(token);
      const croles = getItems(rolesRes);
      setRoles(croles);
      console.log('roles:', croles);
      setItems(getItems(res));
    } catch (e) { setError(e.message || 'Failed to load invitations'); } finally { setLoading(false); }
  };

  const loadAssignablePermissions = async () => {
    setPermissionsLoading(true);
    try {
      const res = await admin.invitations.getAssignablePermissions(token);
      const raw = Array.isArray(res?.data) ? res.data : getItems(res);
      setAssignablePermissions(
        raw
          .map((p) =>
            typeof p === 'string'
              ? { value: p, label: p }
              : { value: p.name || p.value || p.permission || '', label: p.label || p.name || p.value || p.permission || '' }
          )
          .filter((v) => v.value)
      );
    } catch (e) { showToast(e.message, 'error'); } finally { setPermissionsLoading(false); }
  };

  const loadStaff = async () => {
    try {
      const res = await admin.staff.listStaff(token, { page: 1, per_page: 200 });
      setStaffItems(getItems(res));
    } catch (e) { showToast(e.message, 'error'); }
  };

  useEffect(() => { load(); loadAssignablePermissions(); loadStaff(); }, []);

  // -------------------------------------------------------------------------
  // Group permissions by their prefix (before first '.' or '_')
  // -------------------------------------------------------------------------
  const groupedPermissions = useMemo(() => {
    const groups = {};
    assignablePermissions.forEach((perm) => {
      const prefix = perm.value.includes('.')
        ? perm.value.split('.')[0]
        : perm.value.split('_')[0];
      const key = prefix.toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(perm);
    });
    return groups;
  }, [assignablePermissions]);

  const toggleGroup = (groupKey) => {
    const groupPerms = groupedPermissions[groupKey].map((p) => p.value);
    setForm((prev) => {
      const list = Array.isArray(prev.permissions) ? prev.permissions : [];
      const allSelected = groupPerms.every((p) => list.includes(p));
      return {
        ...prev,
        permissions: allSelected
          ? list.filter((p) => !groupPerms.includes(p))
          : [...new Set([...list, ...groupPerms])],
      };
    });
  };

  const togglePermission = (perm) => {
    setForm((prev) => {
      const list = Array.isArray(prev.permissions) ? prev.permissions : [];
      return list.includes(perm)
        ? { ...prev, permissions: list.filter((p) => p !== perm) }
        : { ...prev, permissions: [...list, perm] };
    });
  };

  // -------------------------------------------------------------------------
  // CRUD
  // -------------------------------------------------------------------------
  const save = async ({ mode, item, close }) => {
    setSaving(true);
    try {
      const payload = { ...form, permissions: Array.isArray(form.permissions) ? form.permissions : [] };
      if (mode === 'add') await admin.invitations.create(payload, token);
      else await admin.invitations.resend(item.id || item.token || payload.token, token);
      showToast(mode === 'add' ? 'Invitation sent' : 'Invitation resent');
      await load();
      close();
    } catch (e) { showToast(e.message, 'error'); } finally { setSaving(false); }
  };

  const revokeInvitation = async (item) => {
    const key = item.id || item.token || item.email;
    setActingId(key);
    try { await admin.invitations.revoke(item.token, token); await load(); showToast('Invitation revoked'); }
    catch (e) { showToast(e.message, 'error'); } finally { setActingId(''); }
  };

  const resendInvitation = async (item) => {
    const key = item.id || item.token || item.email;
    setActingId(key);
    try { await admin.invitations.resend(item.token, token); await load(); showToast('Invitation resent'); }
    catch (e) { showToast(e.message, 'error'); } finally { setActingId(''); }
  };

  const openInvitation = async (item) => {
    const invitationToken = item?.token || item?.id || '';
    if (!invitationToken) { showToast('Invitation token not available', 'error'); return; }
    setActingId(item.id || item.token || item.email);
    try {
      const res = await admin.invitations.get(invitationToken, token);
      setInviteToken(invitationToken);
      setTokenLookup(res?.data || res);
      showToast('Invitation loaded');
    } catch (e) { showToast(e.message, 'error'); setTokenLookup(null); } finally { setActingId(''); }
  };

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------
  const filteredStaff = !staffSearch.trim()
    ? staffItems.slice(0, 8)
    : staffItems
        .filter((s) => [s.name, s.email, s.staff_code].some((v) => String(v || '').toLowerCase().includes(staffSearch.toLowerCase())))
        .slice(0, 8);

  const canResend = (item) => ['pending', 'sent'].includes(String(item?.status || '').toLowerCase());
  const canRevoke = (item) => ['pending', 'sent'].includes(String(item?.status || '').toLowerCase());

  // -------------------------------------------------------------------------
  // Form renderer
  // -------------------------------------------------------------------------
  const renderForm = ({ mode, item, close }) => {
    const selectedPermissions = Array.isArray(form.permissions) ? form.permissions : [];

    return (
      <div>
        {/* Staff directory search */}
        <Field label="Search staff directory">
          <input
            className="klf-input"
            value={staffSearch}
            onChange={(e) => setStaffSearch(e.target.value)}
            placeholder="Search by name, email, or staff code"
          />
          {staffSearch && filteredStaff.length > 0 && (
            <div style={{ marginTop: 8, border: `1px solid ${G.border}`, borderRadius: G.radius, overflow: 'hidden', background: '#fff' }}>
              {filteredStaff.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, name: member?.name || '', email: member?.email || '' }));
                    setStaffSearch(member?.name || member?.email || '');
                  }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', borderBottom: `1px solid ${G.border}`, background: '#fff', cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{member.name || '—'}</div>
                  <div style={{ fontSize: 11, color: G.textFaint }}>
                    {member.email || '—'}{member.staff_code ? ` · ${member.staff_code}` : ''}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Field>

        <TF label="Email" name="email" value={form.email} onChange={onChange} type="email" required />
        <TF label="Name (optional)" name="name" value={form.name} onChange={onChange} />
        <SF label="Role" name="role" value={form.role} onChange={onChange} required options={roles.map((r) => r || 'select')} />

        {/* Grouped assignable permissions */}
        <Field label="Assignable permissions">
          {permissionsLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: G.textMuted, fontSize: 12 }}>
              <Spinner size={14} /> Loading permissions…
            </div>
          ) : assignablePermissions.length === 0 ? (
            <div style={{ fontSize: 12, color: G.textMuted }}>No assignable permissions found.</div>
          ) : (
            <div
              className="klf-scroll"
              style={{ maxHeight: 280, overflowY: 'auto', border: `1px solid ${G.border}`, borderRadius: G.radius, padding: 10 }}
            >
              {Object.entries(groupedPermissions).map(([groupKey, perms]) => {
                const groupPerms = perms.map((p) => p.value);
                const allSelected = groupPerms.every((p) => selectedPermissions.includes(p));
                const someSelected = !allSelected && groupPerms.some((p) => selectedPermissions.includes(p));

                return (
                  <div key={groupKey} style={{ marginBottom: 12 }}>
                    {/* Group header — select-all checkbox */}
                    <label
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        fontSize: 12, fontWeight: 700, color: G.text,
                        textTransform: 'capitalize', cursor: 'pointer', marginBottom: 4,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                        onChange={() => toggleGroup(groupKey)}
                      />
                      {groupKey}{' '}
                      <span style={{ fontWeight: 400, color: G.textMuted }}>({perms.length})</span>
                    </label>

                    {/* Individual permissions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, paddingLeft: 22 }}>
                      {perms.map((perm) => (
                        <label
                          key={perm.value}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: G.text }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.value)}
                            onChange={() => togglePermission(perm.value)}
                          />
                          <span>{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={close}>Cancel</Btn>
          <Btn variant="primary" onClick={() => save({ mode, item, close })} disabled={saving}>
            {saving ? 'Saving…' : mode === 'add' ? 'Send Invitation' : 'Resend Invitation'}
          </Btn>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      {toast}
      <div style={{ display: 'grid', gap: 20 }}>

        {/* Invitations table */}
        <Card>
          <CardHeader
            title="Invitations"
            subtitle="Invite administrators, resend, revoke, and inspect assignable permissions"
          />
          <div style={{ padding: 16 }}>
            <Err msg={error} />
            <div className="klf-scroll" style={{ overflowX: 'auto' }}>
              <table className="klf-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Sent</th>
                    <th style={{ width: 260 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6}>
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
                          <Spinner size={24} />
                        </div>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6}><Empty icon="✉️" message="No invitations found" /></td>
                    </tr>
                  ) : items.map((r) => {
                    const rowKey = r.id || r.token || r.email;
                    const busy = actingId === rowKey;
                    return (
                      <tr key={rowKey}>
                        <td>{r.email || '—'}</td>
                        <td>{r.name || '—'}</td>
                        <td>{r.role ? <Badge>{String(r.role).replace(/_/g, ' ')}</Badge> : '—'}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>{r.created_at?.split('T')[0] || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Btn size="sm" variant="ghost" onClick={() => openInvitation(r)} disabled={busy}>View</Btn>
                            {canResend(r) && (
                              <Btn size="sm" variant="primary" onClick={() => resendInvitation(r)} disabled={busy}>
                                {busy ? 'Working…' : 'Resend'}
                              </Btn>
                            )}
                            {canRevoke(r) && (
                              <Btn size="sm" variant="danger" onClick={() => revokeInvitation(r)} disabled={busy}>
                                {busy ? 'Working…' : 'Revoke'}
                              </Btn>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Btn variant="primary" onClick={() => { reset({ permissions: [] }); setStaffSearch(''); }}>
                New Invitation
              </Btn>
            </div>
          </div>
        </Card>

        {/* Invitation form via CrudPanel */}
        <CrudPanel
          title="Invitation Form"
          subtitle="Create a new invitation or prepare one for resend"
          items={[]} loading={false} error=""
          onAdd={() => {}} onEdit={() => {}} onDelete={() => {}}
          onOpenAdd={() => { reset({ permissions: [] }); setStaffSearch(''); }}
          onOpenEdit={(item) => {
            reset({ ...item, permissions: Array.isArray(item?.permissions) ? item.permissions : [] });
            setStaffSearch(item?.name || item?.email || '');
          }}
          renderForm={renderForm}
          formTitle="Invitation"
          formWidth={700}
          searchKeys={[]}
          columns={[]}
        />

        {/* Token lookup */}
        <Card>
          <CardHeader title="Invitation Token Lookup" subtitle="Exercises invitation get-by-token surface" />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <TF
                  label="Invitation token / id"
                  name="inviteToken"
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                />
              </div>
              <Btn
                onClick={async () => {
                  try {
                    const res = await admin.invitations.get(inviteToken, token);
                    setTokenLookup(res?.data || res);
                    showToast('Lookup complete');
                  } catch (e) {
                    showToast(e.message, 'error');
                    setTokenLookup({ error: e.message });
                  }
                }}
                disabled={!inviteToken}
              >
                Lookup
              </Btn>
            </div>
            <div style={{ marginTop: 16 }}><JsonViewer value={tokenLookup} /></div>
          </div>
        </Card>

      </div>
    </>
  );
}

function MyComplaintsPanel({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [toastNode, showToast] = useToast();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await staff.complaints.list({}, token);
      setItems(getItems(res));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      showToast('Subject and description are required.', 'error'); return;
    }
    setSaving(true);
    try {
      await staff.complaints.create(form, token);
      showToast('Complaint submitted successfully.');
      setShowForm(false);
      setForm({ subject: '', description: '' });
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const statusColor = (s) => ({ open: G.warning, resolved: G.success, closed: G.textFaint })[(s || '').toLowerCase()] || G.textMuted;

  return (
    <div className="klf-fade">
      {toastNode}
      <Card>
        <CardHeader
          title="My Complaints"
          subtitle="Submit and track your complaints"
          actions={<Btn size="sm" onClick={() => setShowForm(true)}>+ New Complaint</Btn>}
        />
        {showForm && (
          <div style={{ padding: 20, borderBottom: `1px solid ${G.border}`, background: G.surfaceAlt }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Submit a Complaint</div>
            <TF label="Subject" name="subject" value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              required placeholder="Brief subject" />
            <TA label="Description" name="description" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4} placeholder="Describe your complaint in detail..." />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Btn onClick={handleSubmit} disabled={saving}>{saving ? 'Submitting...' : 'Submit'}</Btn>
              <Btn variant="ghost" onClick={() => { setShowForm(false); setForm({ subject: '', description: '' }); }}>Cancel</Btn>
            </div>
          </div>
        )}
        <div style={{ padding: 20 }}>
          {loading ? <Spinner /> : error ? <Err msg={error} /> : items.length === 0 ? (
            <Empty icon="📭" message="No complaints filed yet" />
          ) : (
            <table className="klf-table">
              <thead>
                <tr><th>Subject</th><th>Status</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {items.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.subject || '—'}</td>
                    <td><Badge color={statusColor(c.status)}>{c.status || 'open'}</Badge></td>
                    <td style={{ color: G.textMuted }}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                    <td><Btn size="sm" variant="ghost" onClick={() => setSelected(c)}>View</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {selected && (
        <Modal title="Complaint Details" onClose={() => setSelected(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: G.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>Subject</div>
              <div style={{ fontWeight: 600 }}>{selected.subject}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: G.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
              <Badge color={statusColor(selected.status)}>{selected.status || 'open'}</Badge>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: G.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>Description</div>
              <div style={{ lineHeight: 1.7, color: G.text }}>{selected.description}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: G.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>Filed On</div>
              <div style={{ color: G.textMuted }}>{selected.created_at ? new Date(selected.created_at).toLocaleString() : '—'}</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export { StaffAdminPanel, LeaveAdminPanel, MyLeavePanel, MyInvitationsPanel, InvitationsPanel, MyComplaintsPanel };
