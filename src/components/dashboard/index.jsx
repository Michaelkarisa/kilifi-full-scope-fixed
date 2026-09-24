import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { G, css, buildCan, Spinner, useToast, Btn, Badge, Card, CardHeader, Empty, Err, Modal, TF, TA } from './shared';
import { admin, staff, getItems, system, auth } from '../../api';
import StaffDirectory from './StaffDirectory.jsx';
import Sidebar from './Sidebar.jsx';
import AccessGuard from './AccessGuard.jsx';
import OverviewPanel from './OverviewPanel.jsx';
import { StaffAdminPanel, LeaveAdminPanel, MyLeavePanel, MyInvitationsPanel, InvitationsPanel, MyComplaintsPanel } from './StaffPanels.jsx';
import { RecruitmentAdminPanel, CandidateProfilePanel, CandidateJobsPanel, CandidateApplicationsPanel } from './RecruitmentPanels.jsx';
import { OrgFinancePanel, ReportsPanel, CmsNewsPanel, CmsEventsPanel, CmsServicesPanel, CmsDepartmentsPanel, CmsProjectsPanel, CmsSectorsPanel, CmsTendersPanel, CmsAnnouncementsPanel, CmsDocumentsPanel, CmsFaqsPanel, CmsBlogPanel, CmsLeadershipPanel, CmsPartnersPanel } from './CmsPanels.jsx';
import { SystemManagementPanel, LogsPanel, AnalyticsPanel } from './SystemPanels.jsx';
import ChangePasswordPanel from './ChangePasswordPanel.jsx';

const VIEW_CONFIG = {
  // ===========================
  // STAFF
  // ===========================
  'staff-admin': {
    component: StaffAdminPanel,
    requireAdmin: true,
    requiresAny: [
      'staff.staff.view',
      'staff.staff.create',
      'staff.staff.update',
      'staff.staff.delete',
    ],
  },

  'leave-admin': {
    component: LeaveAdminPanel,
    requireAdmin: true,
    requiresAny: [
      'staff.leave.view',
      'staff.leave.review',
      'staff.leave.approve',
      'staff.leave.reject',
    ],
  },

  'invitations': {
    component: InvitationsPanel,
    requireAdmin: true,
    requiresAny: [
      'staff.management.invitations',
      'recruitment.management.invitations',
      'system.management.super_admin_invitations',
    ],
  },

  // ===========================
  // RECRUITMENT
  // ===========================
  'recruitment-admin': {
    component: RecruitmentAdminPanel,
    requireAdmin: true,
    requiresAny: [
      'recruitment.jobs.view',
      'recruitment.jobs.create',
      'recruitment.jobs.update',
      'recruitment.jobs.delete',
      'recruitment.applications.view',
      'recruitment.candidates.view',
    ],
  },

  // ===========================
  // FINANCE
  // ===========================
  'org-finance': {
    component: OrgFinancePanel,
    requireAdmin: true,
    requiresAny: [
      'cms.finance_overview.view',
      'cms.finance_overview.create',
      'cms.finance_overview.update',
      'system.management.settings',
    ],
  },

  // ===========================
  // REPORTS
  // ===========================
  'reports': {
    component: ReportsPanel,
    requireAdmin: true,
    requiresAny: [
      'staff.management.audit',
      'recruitment.management.audit',
      'cms.management.audit',
      'system.management.audit',
    ],
  },

  // ===========================
  // CMS
  // ===========================
  'cms-news': {
    component: CmsNewsPanel,
    requireAdmin: true,
    requires: ['cms.news.view'],
  },

  'cms-blog': {
    component: CmsBlogPanel,
    requireAdmin: true,
    requires: ['cms.blogs.view'],
  },

  'cms-events': {
    component: CmsEventsPanel,
    requireAdmin: true,
    requires: ['cms.events.view'],
  },

  'cms-projects': {
    component: CmsProjectsPanel,
    requireAdmin: true,
    requires: ['cms.projects.view'],
  },

  'cms-departments': {
    component: CmsDepartmentsPanel,
    requireAdmin: true,
    requires: ['cms.departments.view'],
  },

  'cms-services': {
    component: CmsServicesPanel,
    requireAdmin: true,
    requires: ['cms.services.view'],
  },

  'cms-sectors': {
    component: CmsSectorsPanel,
    requireAdmin: true,
    requires: ['cms.sectors.view'],
  },

  'cms-announcements': {
    component: CmsAnnouncementsPanel,
    requireAdmin: true,
    requires: ['cms.announcements.view'],
  },

  'cms-leadership': {
    component: CmsLeadershipPanel,
    requireAdmin: true,
    requires: ['cms.leadership.view'],
  },

  'cms-tenders': {
    component: CmsTendersPanel,
    requireAdmin: true,
    requires: ['cms.tenders.view'],
  },

  'cms-documents': {
    component: CmsDocumentsPanel,
    requireAdmin: true,
    requires: ['cms.documents.view'],
  },

  'cms-faqs': {
    component: CmsFaqsPanel,
    requireAdmin: true,
    requires: ['cms.faqs.view'],
  },

  'cms-partnerships': {
    component: CmsPartnersPanel,
    requireAdmin: true,
    requires: ['cms.partners.view'],
  },
  // ===========================
  // SYSTEM
  // ===========================
  'system-management': {
    component: SystemManagementPanel,
    requireAdmin: true,
    requiresAny: [
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
    ],
  },

  'logs': {
    component: LogsPanel,
    requireAdmin: true,
    requiresAny: [
      'system.logs.view',
      'cms.logs.view',
      'staff.management.audit',
      'recruitment.management.audit',
      'cms.management.audit',
      'system.management.logs',
    ],
  },

  // ===========================
  // STAFF SELF SERVICE
  // ===========================
  'my-leave': {
    component: MyLeavePanel,
    requireAdmin: false,
    requires: ['staff.leave.apply'],
  },

  'my-invitations': {
    component: MyInvitationsPanel,
    requireAdmin: false,
    requires: [],
  },

  'staff-directory': {
    component: StaffDirectory,
    requireAdmin: false,
    requires: ['staff.directory.view'],
  },

  // ===========================
  // CANDIDATE
  // ===========================
  'candidate-profile': {
    component: CandidateProfilePanel,
    requireAdmin: false,
    requires: [],
  },

  'candidate-jobs': {
    component: CandidateJobsPanel,
    requireAdmin: false,
    requires: ['recruitment.jobs.view'],
  },

  'candidate-applications': {
    component: CandidateApplicationsPanel,
    requireAdmin: false,
    requires: ['recruitment.applications.view'],
  },

  // ===========================
  // USER
  // ===========================
  'change-password': {
    component: ChangePasswordPanel,
    requireAdmin: false,
    requires: [],
  },

  // ===========================
  // ANALYTICS
  // ===========================
  'analytics': {
    component: AnalyticsPanel,
    requireAdmin: true,
    requires: ['system.management.analytics'],
  },
};

const MODULES = [
  'auth',
  'staff',
  'cms',
  'recruitment',
  'finance',
  'system',
];

const MODULE_COLORS = {
  auth:        { bg: "#E6F1FB", color: "#0C447C" },
  staff:       { bg: "#E1F5EE", color: "#085041" },
  cms:         { bg: "#EEEDFE", color: "#3C3489" },
  admin:       { bg: "#FAECE7", color: "#712B13" },
  recruitment: { bg: "#FAEEDA", color: "#633806" },
  finance:     { bg: "#EAF3DE", color: "#27500A" },
  system:      { bg: "#F1EFE8", color: "#444441" },
};

const PAGE_SIZE = 10;

export default function Dashboard({ user, onLogout, token: propToken, abilities: propAbilities }) {
  const { panel = 'overview' } = useParams();
  const navigate = useNavigate();

  const view = panel;
  const setView = (id) => navigate(`/dashboard/${id}`, { replace: false });

  const token =
    propToken ||
    user?.token || user?.access_token ||
    (typeof localStorage !== 'undefined' &&
      (localStorage.getItem('auth_token') || localStorage.getItem('admin_token') || localStorage.getItem('token'))) ||
    '';

  const role =
    user?.role || user?.user_type ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('auth_role')) ||
    'staff';

  const abilities = useMemo(
    () => propAbilities || user?.permissions || [],
    [propAbilities, user?.permissions]
  );

  const can = useMemo(() => buildCan(abilities), [abilities]);

  const config = VIEW_CONFIG[view];

  return (
    <>
      <style>{css}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: G.surfaceAlt }}>
        <Sidebar
          user={user}
          view={view}
          setView={setView}
          onLogout={onLogout}
          role={role}
          can={can}
        />
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flexShrink: 0, padding: '12px 24px', background: G.surface, borderBottom: `1px solid ${G.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: G.textFaint, marginBottom: 2 }}>Active view</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: G.text }}>{view.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</div>
            </div>
            {view !== 'overview' && (
              <Btn variant="ghost" size="sm" onClick={() => setView('overview')}>← Overview</Btn>
            )}
          </div>

          <div className="klf-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 24 }}>
            {view === 'overview' ? (
              <OverviewPanel
                user={user}
                token={token}
                role={role}
                can={can}
                abilities={abilities}
              />
            ) : config ? (
              <AccessGuard
                can={can}
                requires={config.requires}
                requireAdmin={config.requireAdmin}
                role={role}
              >
                <config.component token={token} user={user} />
              </AccessGuard>
            ) : (
              <Empty message={`No panel for view "${view}"`} />
            )}
          </div>
        </main>
      </div>
    </>
  );
}