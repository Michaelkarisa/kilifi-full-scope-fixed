import {  } from 'react';
import { G, ADMIN_ROLES, Badge } from './shared';

function Sidebar({ user, view, setView, onLogout, role, can }) {
  const isAdmin = ADMIN_ROLES.has(role);
  const isStaff = role === 'staff_user' || role === 'staff' || isAdmin;
  const isCandidate = role === 'candidate';

  const canAny = (permissions = []) => permissions.some((p) => can(p));

  const canCms = canAny([
    'cms.news.view',
    'cms.blogs.view',
    'cms.events.view',
    'cms.projects.view',
    'cms.departments.view',
    'cms.services.view',
    'cms.sectors.view',
    'cms.announcements.view',
    'cms.leadership.view',
    'cms.tenders.view',
    'cms.documents.view',
    'cms.faqs.view',
    'cms.partners.view',
    'cms.finance_overview.view',
    'cms.hero_slides.view',
    'cms.page_stats.view',
    'cms.tourism.view',
    'cms.settings.view',
    'cms.contacts.view',
    'cms.chat.view',
  ]);

  const canSystem = canAny([
    'system.management.users',
    'system.management.roles',
    'system.management.permissions',
    'system.management.settings',
    'system.management.audit',
    'system.management.logs',
    'system.management.backups',
    'system.management.module_super_admins',
    'system.management.super_admin_invitations',
    'system.management.role_assignment',
    'system.management.admin_permissions',
    'system.logs.view',
  ]);

  const groups = [
    {
      label: 'Overview',
      items: [{ id: 'overview', icon: '◈', label: 'Dashboard' }],
    },

    ...(isAdmin ? [{
      label: 'Administration',
      items: [
        { id: 'staff-admin', icon: '👥', label: 'Staff Management', hidden: !canAny(['staff.staff.view', 'staff.staff.create', 'staff.staff.update', 'staff.staff.delete']) },
        { id: 'leave-admin', icon: '📋', label: 'Leave Admin', hidden: !canAny(['staff.leave.view', 'staff.leave.review', 'staff.leave.approve', 'staff.leave.reject']) },
        { id: 'invitations', icon: '✉️', label: 'Invitations', hidden: !canAny(['staff.management.invitations', 'recruitment.management.invitations', 'system.management.super_admin_invitations']) },
        { id: 'recruitment-admin', icon: '💼', label: 'Recruitment Admin', hidden: !canAny(['recruitment.jobs.view', 'recruitment.applications.view', 'recruitment.candidates.view']) },
        { id: 'org-finance', icon: '🏛️', label: 'Org & Finance', hidden: !canAny(['cms.finance_overview.view', 'system.management.settings']) },
        { id: 'reports', icon: '📊', label: 'Reports', hidden: !canAny(['staff.management.audit', 'recruitment.management.audit', 'cms.management.audit', 'system.management.audit']) },
        { id: 'logs', icon: '🧾', label: 'Logs', hidden: !canAny(['system.management.logs', 'system.logs.view', 'cms.logs.view', 'staff.management.audit', 'recruitment.management.audit', 'cms.management.audit']) },
        { id: 'analytics', icon: '📊', label: 'Analytics', hidden: !can('system.management.analytics') },
        { id: 'system-management', icon: '🛠️', label: 'System', hidden: !canSystem },
      ].filter((item) => !item.hidden),
    }] : []),

    ...(isAdmin && canCms ? [{
      label: 'CMS',
      items: [
        { id: 'cms-news', icon: '📰', label: 'News', hidden: !can('cms.news.view') },
        { id: 'cms-events', icon: '📅', label: 'Events', hidden: !can('cms.events.view') },
        { id: 'cms-services', icon: '⚙️', label: 'Services', hidden: !can('cms.services.view') },
        { id: 'cms-departments', icon: '🏛️', label: 'Departments', hidden: !can('cms.departments.view') },
        { id: 'cms-projects', icon: '🏗️', label: 'Projects', hidden: !can('cms.projects.view') },
        { id: 'cms-sectors', icon: '🔷', label: 'Sectors', hidden: !can('cms.sectors.view') },
        { id: 'cms-tenders', icon: '📄', label: 'Tenders', hidden: !can('cms.tenders.view') },
        { id: 'cms-announcements', icon: '📣', label: 'Announcements', hidden: !can('cms.announcements.view') },
        { id: 'cms-documents', icon: '🗂️', label: 'Documents', hidden: !can('cms.documents.view') },
        { id: 'cms-faqs', icon: '❓', label: 'FAQs', hidden: !can('cms.faqs.view') },
        { id: 'cms-blog', icon: '✍️', label: 'Blog Posts', hidden: !can('cms.blogs.view') },
        { id: 'cms-leadership', icon: '🎖️', label: 'Leadership', hidden: !can('cms.leadership.view') },
        { id: 'cms-partnerships', icon: '🤝', label: 'Partnerships', hidden: !can('cms.partners.view') },
      ].filter((item) => !item.hidden),
    }] : []),

    ...(isStaff ? [{
      label: 'My Portal',
      items: [
        { id: 'my-leave', icon: '📋', label: 'My Leave', hidden: !can('staff.leave.apply') },
        { id: 'my-invitations', icon: '✉️', label: 'My Invitations' },
        { id: 'staff-directory', icon: '👥', label: 'Staff Directory', hidden: !can('staff.directory.view') },
        { id: 'my-complaints', icon: '📣', label: 'My Complaints', hidden: !can('staff.complaints.create') },
        { id: 'change-password', icon: '🔑', label: 'Change Password' },
      ].filter((item) => !item.hidden),
    }] : []),

    ...(isCandidate ? [{
      label: 'Candidate',
      items: [
        { id: 'candidate-profile', icon: '👤', label: 'My Profile', hidden: !can('candidate.profile.view') },
        { id: 'candidate-jobs', icon: '🔍', label: 'Browse Jobs', hidden: !can('candidate.jobs.view') },
        { id: 'candidate-applications', icon: '📝', label: 'My Applications', hidden: !can('candidate.applications.view') },
        { id: 'change-password', icon: '🔑', label: 'Change Password' },
      ].filter((item) => !item.hidden),
    }] : []),
  ].filter((group) => group.items.length > 0);

  return (
    <aside
      style={{
        background: G.sidebarBg,
        color: '#fff',
        width: 240,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
      }}
      className="klf-scroll"
    >
      <div style={{ padding: '20px 16px 12px', borderBottom: `1px solid ${G.sidebarBorder}` }}>
        <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 4 }}>
          KLF County
        </div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Admin Portal</div>
      </div>

      <nav style={{ flex: 1, padding: '10px 10px' }}>
        {groups.map((g) => (
          <div key={g.label} style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.3)',
                padding: '4px 8px',
                marginBottom: 4,
              }}
            >
              {g.label}
            </div>

            {g.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '8px 10px',
                  fontSize: 12.5,
                  fontWeight: view === item.id ? 600 : 400,
                  color: view === item.id ? '#fff' : 'rgba(255,255,255,.58)',
                  background: view === item.id ? 'rgba(59,130,246,.28)' : 'transparent',
                  border: view === item.id ? `1px solid rgba(59,130,246,.4)` : '1px solid transparent',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all .12s',
                }}
              >
                <span style={{ width: 16, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ padding: 12, borderTop: `1px solid ${G.sidebarBorder}` }}>
        <div
          style={{
            background: 'rgba(255,255,255,.06)',
            border: `1px solid ${G.sidebarBorder}`,
            borderRadius: 10,
            padding: '10px 12px',
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
            {user?.name || 'User'}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>
            {user?.email}
          </div>
          <Badge color={G.accent}>{role?.replace(/_/g, ' ') || 'user'}</Badge>
        </div>

        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: 12,
            fontWeight: 600,
            background: 'rgba(255,255,255,.07)',
            color: 'rgba(255,255,255,.7)',
            border: `1px solid rgba(255,255,255,.12)`,
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;