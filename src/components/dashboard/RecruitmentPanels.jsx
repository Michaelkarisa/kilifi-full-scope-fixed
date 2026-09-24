import { useEffect, useMemo, useState } from 'react';
import { G, Spinner, useToast, Btn, Badge, StatusBadge, Card, CardHeader, Empty, StatTile, Modal, TF, TA, SF, JsonViewer, useForm, FileUploadField, CrudPanel } from './shared';
import { admin, publicRecruitment, getItems } from '../../api';

function RecruitmentAdminPanel({ token }) {
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, showToast] = useToast();
  const [form, onChange, setForm, reset] = useForm({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [j, a] = await Promise.all([
        admin.recruitment.listJobs(token, { per_page: 100 }),
        admin.recruitment.listApplications(token, { per_page: 100 }),
      ]);
      setJobs(getItems(j)); setApps(getItems(a));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const saveJob = async ({ mode, item, close }) => {
    setSaving(true);
    try {
      if (mode === 'add') await admin.recruitment.jobs.create(form, token);
      else await admin.recruitment.jobs.update(item.id, form, token);
      showToast('Job saved'); await load(); close();
    } catch (e) { showToast(e.message, 'error'); } finally { setSaving(false); }
  };

  const delJob = async (item) => {
    try { await admin.recruitment.jobs.remove(item.id, token); await load(); showToast('Job deleted'); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const saveApp = async ({ mode, item, close }) => {
    setSaving(true);
    try {
      if (mode === 'add') await admin.recruitment.applications.create(form, token);
      else await admin.recruitment.applications.update(item.id, form, token);
      showToast('Application updated'); await load(); close();
    } catch (e) { showToast(e.message, 'error'); } finally { setSaving(false); }
  };

  const delApp = async (item) => {
    try { await admin.recruitment.applications.remove(item.id, token); await load(); showToast('Application deleted'); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const renderJobForm = ({ mode, item, close }) => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <TF label="Job Code" name="job_code" value={form.job_code} onChange={onChange} required />
        <TF label="Title" name="title" value={form.title} onChange={onChange} required />
        <SF label="Type" name="recruitment_type" value={form.recruitment_type} onChange={onChange} required options={['job', 'internship', 'attachment']} />
        <SF label="Status" name="status" value={form.status} onChange={onChange} options={['Open', 'Closed', 'Draft']} />
        <TF label="Department" name="dept" value={form.dept} onChange={onChange} />
        <TF label="Salary" name="salary" value={form.salary} onChange={onChange} />
        <TF label="Deadline" name="deadline" value={form.deadline} onChange={onChange} type="date" />
      </div>
      <TA label="Description" name="description" value={form.description} onChange={onChange} rows={4} />
      <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
        <Btn variant="ghost" onClick={close}>Cancel</Btn>
        <Btn variant="primary" onClick={() => saveJob({ mode, item, close })} disabled={saving}>{saving ? 'Saving…' : 'Save Job'}</Btn>
      </div>
    </div>
  );

  const renderAppForm = ({ mode, item, close }) => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <TF label="Applicant Name" name="applicant_name" value={form.applicant_name} onChange={onChange} required />
        <TF label="Job Title" name="job_title" value={form.job_title} onChange={onChange} required />
        <SF label="Type" name="application_type" value={form.application_type} onChange={onChange} options={['job', 'internship', 'attachment']} />
        <TF label="Email" name="email" value={form.email} onChange={onChange} type="email" />
        <TF label="Phone" name="phone" value={form.phone} onChange={onChange} />
        <TF label="Date Applied" name="date_applied" value={form.date_applied} onChange={onChange} type="date" />
        <SF label="Status" name="status" value={form.status} onChange={onChange} options={['Under Review', 'Shortlisted', 'Rejected', 'Hired']} />
      </div>
      <TA label="Cover Letter" name="cover_letter" value={form.cover_letter} onChange={onChange} rows={4} />
      <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
        <Btn variant="ghost" onClick={close}>Cancel</Btn>
        <Btn variant="primary" onClick={() => saveApp({ mode, item, close })} disabled={saving}>{saving ? 'Saving…' : 'Save Application'}</Btn>
      </div>
    </div>
  );

  return (
    <>
      {toast}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['jobs', 'applications'].map((t) => (
          <Btn key={t} variant={tab === t ? 'primary' : 'ghost'} onClick={() => setTab(t)}>{t === 'jobs' ? '💼 Jobs' : '📝 Applications'}</Btn>
        ))}
      </div>
      {tab === 'jobs' ? (
        <CrudPanel
          title="Job Postings" subtitle="Manage recruitment job listings"
          items={jobs} loading={loading} error={error}
          onAdd={() => {}} onEdit={() => {}} onDelete={delJob}
          onOpenAdd={() => reset({})} onOpenEdit={(item) => reset({ ...item })}
          renderForm={renderJobForm} formTitle="Job" formWidth={640}
          searchKeys={['title', 'job_code', 'dept', 'status']}
          columns={[
            { key: 'title', label: 'Title', render: (r) => <div><div style={{ fontWeight: 600 }}>{r.title}</div><div style={{ fontSize: 11, color: G.textFaint }}>{r.job_code}</div></div> },
            { key: 'recruitment_type', label: 'Type', render: (r) => <Badge>{r.recruitment_type}</Badge> },
            { key: 'dept', label: 'Dept' },
            { key: 'deadline', label: 'Deadline' },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      ) : (
        <CrudPanel
          title="Job Applications" subtitle="All candidate applications"
          items={apps} loading={loading} error={error}
          onAdd={() => {}} onEdit={() => {}} onDelete={delApp}
          onOpenAdd={() => reset({})} onOpenEdit={(item) => reset({ ...item })}
          renderForm={renderAppForm} formTitle="Application" formWidth={640}
          searchKeys={['applicant_name', 'email', 'job_title', 'status']}
          columns={[
            { key: 'applicant_name', label: 'Applicant', render: (r) => <div><div style={{ fontWeight: 600 }}>{r.applicant_name}</div><div style={{ fontSize: 11, color: G.textFaint }}>{r.email}</div></div> },
            { key: 'job_title', label: 'Job' },
            { key: 'application_type', label: 'Type', render: (r) => <Badge>{r.application_type}</Badge> },
            { key: 'date_applied', label: 'Applied' },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      )}
    </>
  );
}

function CandidateProfilePanel({ token }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();
  const [form, onChange, setForm, reset] = useForm({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await publicRecruitment.getProfile(token);
      const next = res?.data || null;
      setProfile(next); reset(next || {});
    } catch (e) { showToast(e.message, 'error'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await publicRecruitment.upsertProfile(token, form);
      setProfile(res?.data || form); setEditing(false); showToast('Profile saved');
    } catch (e) { showToast(e.message, 'error'); } finally { setSaving(false); }
  };

  const updateAvailability = async (availability_status) => {
    try {
      const res = await publicRecruitment.updateAvailabilityStatus(token, availability_status);
      setProfile((prev) => ({ ...(prev || {}), ...(res?.data || {}), availability_status }));
      setForm((prev) => ({ ...(prev || {}), availability_status }));
      showToast('Availability updated');
    } catch (e) { showToast(e.message, 'error'); }
  };

  return (
    <>
      {toast}
      <Card>
        <CardHeader title="Candidate Profile" subtitle="Manage your recruitment profile after login"
          actions={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {profile?.availability_status && <Badge>{profile.availability_status}</Badge>}
              <Btn size="sm" variant="ghost" onClick={load}>Refresh</Btn>
              <Btn size="sm" variant="secondary" onClick={() => updateAvailability('available')}>Mark Available</Btn>
              <Btn size="sm" variant="secondary" onClick={() => updateAvailability('not_available')}>Mark Unavailable</Btn>
              <Btn size="sm" onClick={() => { setEditing((v) => !v); if (!editing) reset(profile || {}); }}>{editing ? 'Close' : 'Edit'}</Btn>
            </div>
          }
        />
        <div style={{ padding: 16 }}>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
            : editing ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <TF label="Headline" name="headline" value={form.headline} onChange={onChange} />
                  <TF label="Phone" name="phone" value={form.phone} onChange={onChange} />
                  <TF label="Location" name="location" value={form.location} onChange={onChange} />
                  <TF label="County" name="county" value={form.county} onChange={onChange} />
                  <TF label="Years of Experience" name="years_of_experience" value={form.years_of_experience} onChange={onChange} type="number" />
                  <TF label="Availability Status" name="availability_status" value={form.availability_status} onChange={onChange} />
                  <TF label="LinkedIn URL" name="linkedin_url" value={form.linkedin_url} onChange={onChange} />
                  <TF label="Portfolio URL" name="portfolio_url" value={form.portfolio_url} onChange={onChange} />
                  <FileUploadField label="Resume / CV" name="resume_url" value={form.resume_url} accept=".pdf,.doc,.docx" onUploaded={(name, value) => setForm((f) => ({ ...f, [name]: value }))} />
                </div>
                <TA label="Summary" name="summary" value={form.summary} onChange={onChange} rows={4} />
                <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
                  <Btn variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Profile'}</Btn>
                </div>
              </div>
            ) : profile ? (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{profile.headline || '—'}</div>
                <div style={{ fontSize: 13, color: G.textMuted, marginBottom: 12 }}>{[profile.location, profile.county].filter(Boolean).join(', ') || '—'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                  {[['Phone', profile.phone], ['Experience', profile.years_of_experience ? `${profile.years_of_experience} yrs` : null], ['Availability', profile.availability_status], ['LinkedIn', profile.linkedin_url], ['Portfolio', profile.portfolio_url]].map(([k, v]) => v ? (
                    <div key={k}><span style={{ color: G.textFaint, fontWeight: 600 }}>{k}: </span>{v}</div>
                  ) : null)}
                </div>
                {profile.summary && <div style={{ marginTop: 14, fontSize: 13, background: G.surfaceAlt, borderRadius: 8, padding: '12px 14px' }}>{profile.summary}</div>}
                <div style={{ marginTop: 16 }}><JsonViewer value={profile} /></div>
              </div>
            ) : <Empty icon="👤" message="No profile yet — click Edit to create one" />}
        </div>
      </Card>
    </>
  );
}

function CandidateJobsPanel({ token }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [form, onChange, setForm, reset] = useForm({});
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const res = await publicRecruitment.listJobs({ per_page: 100 });
        setJobs(getItems(res));
      } catch (e) { showToast(e.message, 'error'); } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => jobs.filter((j) => {
    const lq = q.toLowerCase();
    const matchQ = !lq || j.title?.toLowerCase().includes(lq) || j.description?.toLowerCase().includes(lq);
    const matchT = typeFilter === 'all' || j.recruitment_type === typeFilter;
    return matchQ && matchT;
  }), [jobs, q, typeFilter]);

  const apply = async () => {
    setSaving(true);
    try {
      await publicRecruitment.applyToJob(token, applying.id, form);
      showToast('Application submitted!'); setApplying(null); reset({});
    } catch (e) { showToast(e.message, 'error'); } finally { setSaving(false); }
  };

  return (
    <>
      {toast}
      {applying && (
        <Modal title={`Apply: ${applying.title}`} onClose={() => setApplying(null)} width={520}>
          <div style={{ marginBottom: 14, fontSize: 13, color: G.textMuted }}>{applying.recruitment_type} · Deadline: {applying.deadline || 'Open'}</div>
          <TF label="Phone" name="phone" value={form.phone} onChange={onChange} />
          <FileUploadField label="Profile Photo" name="image" value={form.image} accept="image/*" onUploaded={(name, value) => setForm((f) => ({ ...f, [name]: value }))} />
          <TA label="Cover Letter" name="cover_letter" value={form.cover_letter} onChange={onChange} rows={5} />
          <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setApplying(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={apply} disabled={saving}>{saving ? 'Submitting…' : 'Submit Application'}</Btn>
          </div>
        </Modal>
      )}
      <Card>
        <CardHeader title="Browse Jobs" subtitle={`${filtered.length} open positions`} />
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${G.border}`, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input className="klf-input" style={{ maxWidth: 280 }} placeholder="Search jobs…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="klf-input" style={{ maxWidth: 180 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="job">Job</option>
            <option value="internship">Internship</option>
            <option value="attachment">Attachment</option>
          </select>
        </div>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
          : filtered.length === 0 ? <Empty icon="💼" message="No jobs found" />
            : (
              <div style={{ padding: 16, display: 'grid', gap: 12 }}>
                {filtered.map((j) => (
                  <div key={j.id} style={{ border: `1px solid ${G.border}`, borderRadius: G.radius, padding: 14, background: G.surface }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{j.title}</div>
                        <div style={{ fontSize: 12, color: G.textMuted, marginTop: 3 }}>{j.recruitment_type || '—'} · Deadline: {j.deadline || 'Open'}</div>
                      </div>
                      <Btn size="sm" onClick={() => { setApplying(j); reset({}); }}>Apply</Btn>
                    </div>
                    {j.description && <div style={{ fontSize: 13, color: G.text, marginTop: 10 }}>{j.description}</div>}
                  </div>
                ))}
              </div>
            )}
      </Card>
    </>
  );
}

function CandidateApplicationsPanel({ token }) {
  const [apps, setApps] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, showToast] = useToast();

  useEffect(() => {
    (async () => {
      try {
        const [appsRes, dashRes] = await Promise.all([
          publicRecruitment.listMyApplications(token, { per_page: 100 }),
          publicRecruitment.getDashboard(token).catch(() => null),
        ]);
        setApps(getItems(appsRes));
        setDashboard(dashRes?.data || null);
      } catch (e) { showToast(e.message, 'error'); } finally { setLoading(false); }
    })();
  }, [token]);

  return (
    <>
      {toast}
      <div style={{ display: 'grid', gap: 20 }}>
        {dashboard && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {Object.entries(dashboard).slice(0, 4).map(([k, v]) => (
              <StatTile key={k} label={k.replace(/_/g, ' ')} value={typeof v === 'object' ? 'view' : String(v ?? '—')} icon="📈" />
            ))}
          </div>
        )}
        <Card>
          <CardHeader title="My Applications" subtitle="Track your job applications" />
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
            : apps.length === 0 ? <Empty icon="📝" message="No applications yet" />
              : (
                <div className="klf-scroll" style={{ overflowX: 'auto' }}>
                  <table className="klf-table">
                    <thead><tr><th>Job</th><th>Type</th><th>Applied</th><th>Status</th></tr></thead>
                    <tbody>
                      {apps.map((a) => (
                        <tr key={a.id}>
                          <td><div style={{ fontWeight: 600 }}>{a.job_title || a.job?.title}</div></td>
                          <td><Badge>{a.application_type || '—'}</Badge></td>
                          <td>{a.date_applied || '—'}</td>
                          <td><StatusBadge status={a.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
        </Card>
      </div>
    </>
  );
}

export { RecruitmentAdminPanel, CandidateProfilePanel, CandidateJobsPanel, CandidateApplicationsPanel };
