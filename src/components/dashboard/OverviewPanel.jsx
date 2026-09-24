import { useEffect, useState } from 'react';
import { G, ADMIN_ROLES, Badge, Card, CardHeader, StatTile } from './shared';
import { admin, staff } from '../../api';

function OverviewPanel({ user, token, role, can, abilities }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let res = null;
        if (ADMIN_ROLES.has(role)) {
          res = await admin.dashboard.overview(token)
            .catch(() => admin.dashboard.staff(token).catch(() => null));
        } else if (role === 'staff') {
          res = await staff.dashboard(token).catch(() => null);
        }
        setData(res?.data || null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, role]);

  const widgets   = data?.widgets || [];
  const ctx       = data?.context || {};
  const staffDb   = data?.staff_dashboard || null;

  const getWidget = (key) => widgets.find((w) => w.key === key);

  const orgWidget        = getWidget('organization_overview');
  const cmsWidget        = getWidget('cms_operations');
  const recruitWidget    = getWidget('recruitment_pipeline');
  const staffMgmtWidget  = getWidget('staff_management_overview');
  const announcWidget    = getWidget('staff_announcements');

  const org  = orgWidget?.data       || {};
  const cms  = cmsWidget?.data       || {};
  const rec  = recruitWidget?.data   || {};
  const smgr = staffMgmtWidget?.data || {};

  return (
    <div style={{ display: 'grid', gap: 20 }}>

      {/* ── Welcome banner ── */}
      <div style={{
        background: `linear-gradient(135deg, ${G.sidebarBg} 0%, #1e3a5f 100%)`,
        borderRadius: G.radiusLg, padding: '28px 32px', color: '#fff',
      }}>
        <div style={{ fontSize: 12, opacity: .6, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.08em' }}>
          Welcome back
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          {user?.name || 'Portal User'}
        </div>
        <div style={{ fontSize: 13, opacity: .65 }}>
          {user?.email} · <Badge color="#fff">{(role || 'user').replace(/_/g, ' ')}</Badge>
        </div>
      </div>

      {/* ── Session tiles ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatTile label="Abilities"    value={abilities.length}                              icon="🔑" color={G.accent} />
        <StatTile label="Permissions"  value={user?.permissions?.length ?? '—'}              icon="🛡️" color={G.warning} />
        <StatTile label="Roles"        value={user?.roles?.length ?? 1}                      icon="👤" color={G.success} />
      </div>

      {/* ── Organisation overview ── */}
      {(loading || orgWidget) && (
        <Section title="County overview">
          {loading
            ? <SkeletonGrid count={5} />
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                <StatTile label="Staff"         value={org.staff_count}         icon="👥" color={G.accent} />
                <StatTile label="Open jobs"     value={org.job_count}           icon="💼" color={G.info} />
                <StatTile label="Applications"  value={org.application_count}   icon="📋" color={G.warning} />
                <StatTile label="Leave requests"value={org.leave_request_count} icon="🏖️" color={G.success} />
                <StatTile label="News articles" value={org.news_count}          icon="📰" color={G.muted} />
              </div>
            )
          }
        </Section>
      )}

      {/* ── CMS operations ── */}
      {(loading || cmsWidget) && (
        <Section title="CMS operations">
          {loading
            ? <SkeletonGrid count={6} />
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <CMSStatCard label="News"          data={cms.news}          cols={['published','draft']}          colors={[G.success, G.warning]} />
                <CMSStatCard label="Blog posts"    data={cms.blog_posts}    cols={['published','draft','featured']} colors={[G.success, G.warning, G.accent]} />
                <CMSStatCard label="Events"        data={cms.events}        cols={['upcoming','past']}             colors={[G.info, G.muted]} />
                <CMSStatCard label="Tenders"       data={cms.tenders}       cols={['open','closed']}               colors={[G.success, G.danger]} />
                <CMSStatCard label="Projects"      data={cms.projects}      cols={['ongoing','completed']}         colors={[G.accent, G.success]} />
                <CMSStatCard label="Services"      data={cms.services}      cols={['active','inactive']}           colors={[G.success, G.muted]} />
                <CMSStatCard label="Partners"      data={cms.partners}      cols={['active','featured']}           colors={[G.success, G.accent]} />
                <CMSStatCard label="Departments"   data={cms.departments}   cols={['active']}                      colors={[G.success]} />
                <CMSStatCard label="Announcements" data={cms.announcements} cols={['published','draft']}           colors={[G.success, G.warning]} />
                <CMSStatCard label="Contacts"      data={cms.contacts}      cols={['new','resolved']}              colors={[G.warning, G.success]} />
                <CMSStatCard label="Page stats"    data={cms.page_stats}    cols={['active']}                      colors={[G.success]} />
              </div>
            )
          }
        </Section>
      )}

      {/* ── Recruitment pipeline ── */}
      {(loading || recruitWidget) && (
        <Section title="Recruitment pipeline">
          {loading
            ? <SkeletonGrid count={2} />
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                <StatTile label="Open jobs"    value={rec.job_count}         icon="💼" color={G.info} />
                <StatTile label="Applications" value={rec.application_count} icon="📋" color={G.warning} />
              </div>
            )
          }
        </Section>
      )}

      {/* ── Staff management overview ── */}
      {(loading || staffMgmtWidget) && (
        <Section title="Staff management">
          {loading
            ? <SkeletonGrid count={2} />
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                <StatTile label="Total staff"    value={smgr.staff_count}         icon="👥" color={G.accent} />
                <StatTile label="Leave requests" value={smgr.leave_request_count} icon="🏖️" color={G.warning} />
              </div>
            )
          }
        </Section>
      )}

      {/* ── Staff announcements ── */}
      {(loading || announcWidget) && (
        <Section title="Staff announcements">
          {loading
            ? <SkeletonGrid count={3} />
            : announcWidget?.data?.items?.length
              ? announcWidget.data.items.map((item, i) => (
                  <AnnouncementRow key={i} item={item} />
                ))
              : (
                <div style={{ padding: '16px 0', color: G.muted, fontSize: 13 }}>
                  No staff announcements at this time.
                </div>
              )
          }
        </Section>
      )}

      {/* ── Personal staff dashboard ── */}
      {staffDb && (
        <Section title="My staff dashboard">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 16 }}>
            <StatTile label="Staff code"  value={staffDb.personal?.staff_code} icon="🪪" color={G.info} />
            <StatTile label="Department"  value={staffDb.personal?.department}  icon="🏢" color={G.accent} />
            <StatTile label="Role"        value={staffDb.personal?.role}        icon="👤" color={G.success} />
          </div>

          {staffDb.leave?.balances?.items?.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 500, color: G.textMuted, marginBottom: 8 }}>Leave balances</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
                {staffDb.leave.balances.items.map((b, i) => (
                  <StatTile key={i} label={b.leaveType?.name || 'Leave'} value={b.balance ?? '—'} color={G.info} />
                ))}
              </div>
            </>
          )}

          {staffDb.leave?.recent_applications?.items?.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 500, color: G.textMuted, marginBottom: 8 }}>Recent leave applications</div>
              {staffDb.leave.recent_applications.items.map((app, i) => (
                <LeaveRow key={i} app={app} />
              ))}
            </>
          )}
        </Section>
      )}

      {/* ── Active abilities ── */}
      <Card>
        <CardHeader title="Active abilities" subtitle="Permissions derived from your role and assignments" />
        <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {abilities.map((a) => (
            <span key={a} style={{
              fontSize: 12, padding: '4px 10px', borderRadius: 6,
              background: G.surfaceAlt, border: `1px solid ${G.border}`,
              color: G.text, fontFamily: 'monospace',
            }}>{a}</span>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── CMSStatCard ──────────────────────────────────────────────────────────────
function CMSStatCard({ label, data, cols, colors }) {
  if (!data) return null;
  return (
    <div style={{
      background: G.surface, border: `0.5px solid ${G.border}`,
      borderRadius: G.radiusMd, padding: '12px 14px',
    }}>
      <div style={{ fontSize: 12, color: G.textMuted, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: G.text, marginBottom: 6 }}>{data.total ?? 0}</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {cols.map((col, i) => (
          <span key={col} style={{ fontSize: 11, color: colors[i] || G.textMuted }}>
            {col} {data[col] ?? 0}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── AnnouncementRow ──────────────────────────────────────────────────────────
function AnnouncementRow({ item }) {
  return (
    <div style={{
      padding: '10px 0', borderBottom: `0.5px solid ${G.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: G.text }}>{item.title}</div>
        <div style={{ fontSize: 12, color: G.textMuted, marginTop: 2 }}>{item.body?.slice(0, 80) || ''}</div>
      </div>
      <div style={{ fontSize: 11, color: G.textMuted, whiteSpace: 'nowrap', marginLeft: 12 }}>
        {item.announcement_date}
      </div>
    </div>
  );
}

// ─── LeaveRow ─────────────────────────────────────────────────────────────────
function LeaveRow({ app }) {
  const statusColor = {
    approved: G.success, pending: G.warning, rejected: G.danger,
    submitted: G.info, under_review: G.accent,
  }[app.status] || G.muted;

  return (
    <div style={{
      padding: '10px 0', borderBottom: `0.5px solid ${G.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: G.text }}>
          {app.leaveType?.name || 'Leave'}
        </div>
        <div style={{ fontSize: 12, color: G.textMuted, marginTop: 2 }}>
          {app.start_date} — {app.end_date}
        </div>
      </div>
      <Badge color={statusColor}>{app.status}</Badge>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div style={{ padding: '0 20px 16px' }}>{children}</div>
    </Card>
  );
}

// ─── SkeletonGrid ─────────────────────────────────────────────────────────────
function SkeletonGrid({ count }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, padding: '4px 0' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ height: 80, background: G.border, borderRadius: G.radiusMd }} />
      ))}
    </div>
  );
}

export default OverviewPanel;
