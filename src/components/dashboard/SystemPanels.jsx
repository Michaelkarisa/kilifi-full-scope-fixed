import React,{ useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { G, Spinner, Btn, Badge, Card, CardHeader, Empty, Err } from './shared';
import { admin, staff, getItems, adminCore, system, auth } from '../../api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const DEFAULT_TAGS = [
  'permissions',
  'staff',
  'cms',
  'jobs',
  'applications',
  'leave',
  'routes',
  'views',
  'config',
  'events',
  'auth',
  'tourism',
];

const DEFAULT_PERMISSIONS = [
  'cms.access',
  'cms.access.news',
  'cms.access.blogs',
  'cms.access.events',
  'cms.access.projects',
  'cms.access.departments',
  'cms.access.services',
  'cms.access.sectors',
  'cms.access.announcements',
  'cms.access.leadership',
  'cms.access.tenders',
  'cms.access.documents',
  'cms.access.faqs',
  'cms.access.settings',
  'cms.access.profile',
  'cms.access.finance_overview',
  'cms.access.partners',
  'cms.access.contacts',
  'cms.access.hero_slides',
  'cms.access.page_stats',
  'cms.access.tourism',
  'cms.access.chat',
  'cms.access.logs',
  'staff.access',
  'staff.view',
  'staff.create',
  'staff.update',
  'staff.delete',
  'staff.import',
  'staff.export',
  'staff.roles.manage',
  'staff.permissions.manage',
  'jobs.manage',
  'jobs.view',
  'jobs.create',
  'jobs.update',
  'jobs.delete',
  'jobs.publish',
  'applications.manage',
  'applications.review',
  'applications.view',
  'applications.shortlist',
  'applications.reject',
  'applications.export',
  'leave.apply',
  'leave.view.own',
  'leave.view.all',
  'leave.cancel.own',
  'leave.cancel.any',
  'leave.review',
  'leave.approve',
  'leave.reject',
  'leave.return',
  'leave.manage.types',
  'leave.manage.balances',
  'leave.manage.accruals',
  'leave.reports',
  'settings.manage',
  'logs.access',
  'reports.access',
  'roles.manage',
  'permissions.manage',
  'system.health',
  'audit.view',
];

const DEFAULT_ROLES = {
  global_super_admin: { perms: [...DEFAULT_PERMISSIONS] },
  cms_super_admin: {
    perms: DEFAULT_PERMISSIONS.filter(
      (p) => p.startsWith('cms') || p === 'system.health' || p === 'audit.view'
    ),
  },
  hr_super_admin: {
    perms: DEFAULT_PERMISSIONS.filter(
      (p) =>
        p.startsWith('staff') ||
        p.startsWith('leave') ||
        p === 'logs.access' ||
        p === 'reports.access' ||
        p === 'system.health' ||
        p === 'audit.view'
    ),
  },
  psb_super_admin: {
    perms: DEFAULT_PERMISSIONS.filter(
      (p) =>
        p.startsWith('jobs') ||
        p.startsWith('applications') ||
        p === 'reports.access' ||
        p === 'system.health'
    ),
  },
  county_admin: {
    perms: DEFAULT_PERMISSIONS.filter(
      (p) => p !== 'roles.manage' && p !== 'permissions.manage'
    ),
  },
  staff_user: { perms: ['leave.apply', 'leave.view.own', 'leave.cancel.own'] },
  candidate: { perms: [] },
};

const styles = `
* { box-sizing: border-box; }

.system-shell { 
  display: grid; 
  grid-template-columns: 180px 1fr; 
  min-height: 560px; 
  border: 0.5px solid #dcdcdc; 
  border-radius: 14px; 
  overflow: hidden; 
  background: #fff; 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.system-sidebar { 
  border-right: 0.5px solid #dcdcdc; 
  padding: 1rem 0; 
  background: #fafafa; 
}

.system-sidebar-header { 
  padding: 0 1rem 0.75rem; 
  font-size: 11px; 
  letter-spacing: 0.08em; 
  color: #777; 
  text-transform: uppercase; 
  border-bottom: 0.5px solid #dcdcdc; 
  margin-bottom: 0.5rem; 
}

.system-nav-item { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  padding: 7px 1rem; 
  font-size: 13px; 
  cursor: pointer; 
  color: #555; 
  border-left: 2px solid transparent; 
  transition: all 0.15s; 
}

.system-nav-item:hover { background: #fff; color: #111; }

.system-nav-item.active { 
  background: #fff; 
  color: #111; 
  border-left-color: #111; 
  font-weight: 500; 
}

.system-nav-icon { width: 14px; height: 14px; flex-shrink: 0; }

.system-content { padding: 1.25rem; overflow-y: auto; }

.system-section-title { font-size: 15px; font-weight: 600; margin-bottom: 4px; color: #111; }
.system-section-sub { font-size: 13px; color: #666; margin-bottom: 1.25rem; }

.system-card { 
  background: #fff; 
  border: 0.5px solid #dcdcdc; 
  border-radius: 10px; 
  padding: 1rem; 
  margin-bottom: 12px; 
}

.system-card-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #111; }

.system-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 1.25rem; }

.system-metric { background: #fafafa; border-radius: 10px; padding: 0.75rem 1rem; }
.system-metric-label { font-size: 11px; color: #777; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
.system-metric-value { font-size: 22px; font-weight: 600; color: #111; }

.system-cache-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1rem; }

.system-tag { 
  display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; 
  border-radius: 999px; font-size: 12px; border: 0.5px solid #cfcfcf; 
  cursor: pointer; color: #555; background: #fafafa; transition: all 0.15s; user-select: none; 
}
.system-tag:hover { border-color: #999; color: #111; }
.system-tag.selected { background: #111; color: #fff; border-color: #111; }
.system-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

.system-btn-row { display: flex; gap: 8px; flex-wrap: wrap; }

.system-btn { 
  padding: 7px 14px; border-radius: 10px; font-size: 13px; cursor: pointer; 
  border: 0.5px solid #cfcfcf; background: transparent; color: #111; transition: all 0.15s; 
}
.system-btn:hover { background: #fafafa; }
.system-btn.primary { background: #111; color: #fff; border-color: #111; }
.system-btn.primary:hover { opacity: 0.9; }
.system-btn.danger { border-color: #e39a9a; color: #b42318; }
.system-btn.danger:hover { background: #fff3f3; }
.system-btn.small { padding: 4px 10px; font-size: 12px; }
.system-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.system-input-row { display: flex; gap: 8px; margin-bottom: 10px; }

.system-input, .system-select { 
  flex: 1; padding: 7px 10px; border-radius: 10px; border: 0.5px solid #cfcfcf; 
  background: #fff; color: #111; font-size: 13px; outline: none; 
}
.system-input:focus, .system-select:focus { border-color: #999; box-shadow: 0 0 0 2px rgba(0,0,0,0.06); }

.system-perm-list { 
  display: flex; flex-direction: column; border: 0.5px solid #dcdcdc; 
  border-radius: 10px; overflow: hidden; max-height: 260px; overflow-y: auto; 
}

.system-perm-row { 
  display: flex; align-items: center; justify-content: space-between; 
  padding: 8px 12px; border-bottom: 0.5px solid #dcdcdc; font-size: 13px; 
}
.system-perm-row:last-child { border-bottom: none; }
.system-perm-row:hover { background: #fafafa; }

.system-perm-name { 
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; 
  font-size: 12px; color: #111; 
}

.system-perm-module { 
  font-size: 10px; color: #3b82f6; background: #eff6ff; padding: 2px 6px; 
  border-radius: 4px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; 
  border: 0.5px solid #bfdbfe; flex-shrink: 0;
}

.system-admin-list { display: flex; flex-direction: column; gap: 8px; }

.system-admin-row { 
  display: flex; justify-content: space-between; align-items: center; 
  padding: 12px 16px; border: 0.5px solid #dcdcdc; border-radius: 10px; 
  background: #fff; cursor: pointer; transition: all 0.15s ease; 
}
.system-admin-row:hover { border-color: #111; background: #fafafa; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.system-admin-row:focus { outline: 2px solid #111; outline-offset: 2px; }

.system-admin-name { font-weight: 600; color: #111; font-size: 14px; }
.system-admin-email { color: #666; font-size: 12px; margin-top: 2px; }

.system-admin-role { 
  font-size: 11px; color: #3b82f6; background: #eff6ff; padding: 2px 8px; 
  border-radius: 999px; display: inline-block; border: 0.5px solid #bfdbfe;
}
.system-admin-perm-count { font-size: 11px; color: #777; margin-top: 4px; }

.system-role-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 1rem; }

.system-role-card { padding: 10px 12px; border: 0.5px solid #dcdcdc; border-radius: 10px; cursor: pointer; transition: all 0.15s; }
.system-role-card:hover { border-color: #999; }
.system-role-card.selected { border-color: #111; border-width: 1.5px; }
.system-role-name { font-size: 13px; font-weight: 600; color: #111; margin-bottom: 2px; }
.system-role-count { font-size: 11px; color: #777; }

.system-checkbox-list {
  display: flex;
  flex-direction: column;
  border: 0.5px solid #dcdcdc;
  border-radius: 10px;
  overflow: hidden;
  max-height: 380px;
  overflow-y: auto;
}

.system-checkbox-group-header {
  padding: 6px 12px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #888;
  background: #f5f5f5;
  border-bottom: 0.5px solid #dcdcdc;
  position: sticky;
  top: 0;
  z-index: 1;
}

.system-checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 0.5px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.1s;
  user-select: none;
}
.system-checkbox-row:last-child { border-bottom: none; }
.system-checkbox-row:hover { background: #fafafa; }
.system-checkbox-row.checked { background: #f8fdf5; }
.system-checkbox-row.pending { opacity: 0.6; pointer-events: none; }

.system-checkbox {
  width: 15px;
  height: 15px;
  border: 1.5px solid #cfcfcf;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
  background: #fff;
}
.system-checkbox.checked {
  background: #111;
  border-color: #111;
}
.system-checkbox.checked::after {
  content: '';
  width: 8px;
  height: 5px;
  border-left: 1.5px solid #fff;
  border-bottom: 1.5px solid #fff;
  transform: rotate(-45deg) translateY(-1px);
  display: block;
}

.system-checkbox-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: #111;
  flex: 1;
}

.system-perm-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #555;
}
.system-perm-summary strong { color: #111; }

.system-status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 5px; background: #639922; }
.system-divider { border: none; border-top: 0.5px solid #dcdcdc; margin: 1rem 0; }

.system-empty { 
  text-align: center; padding: 2rem; color: #777; font-size: 13px; 
  background: #fafafa; border-radius: 10px; border: 0.5px dashed #dcdcdc;
}

.system-toast { 
  position: fixed; bottom: 1rem; right: 1rem; padding: 10px 16px; 
  background: #111; color: #fff; border-radius: 10px; font-size: 13px; 
  z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.system-user-badge { margin: 0 1rem 0.75rem; padding: 10px; border: 0.5px solid #dcdcdc; border-radius: 10px; background: #fff; }
.system-user-name { font-size: 13px; font-weight: 600; color: #111; }
.system-user-role { margin-top: 4px; font-size: 12px; color: #666; text-transform: capitalize; }

.system-content::-webkit-scrollbar,
.system-perm-list::-webkit-scrollbar,
.system-checkbox-list::-webkit-scrollbar { width: 6px; }
.system-content::-webkit-scrollbar-track,
.system-perm-list::-webkit-scrollbar-track,
.system-checkbox-list::-webkit-scrollbar-track { background: transparent; }
.system-content::-webkit-scrollbar-thumb,
.system-perm-list::-webkit-scrollbar-thumb,
.system-checkbox-list::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
.system-content::-webkit-scrollbar-thumb:hover,
.system-perm-list::-webkit-scrollbar-thumb:hover,
.system-checkbox-list::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

@media (max-width: 768px) {
  .system-shell { grid-template-columns: 1fr; }
  .system-sidebar { border-right: none; border-bottom: 0.5px solid #dcdcdc; display: flex; overflow-x: auto; padding: 0.5rem; }
  .system-sidebar-header { display: none; }
  .system-nav-item { padding: 8px 12px; white-space: nowrap; }
  .system-metrics { grid-template-columns: 1fr; }
  .system-role-grid { grid-template-columns: 1fr; }
}
`;

function getModule(name) {
  const first = String(name || '').split('.')[0];
  return first === 'cms' ? 'cms' : first;
}

function prettifyRole(role) {
  return String(role || '').replace(/_/g, ' ');
}

// REMOVED 'export' HERE
function SystemManagementPanel({ user }) {
  const role = user?.role || user?.roles?.[0]?.name || '';
  const isGlobalSuperAdmin = role === 'global_super_admin';

  const [activeTab, setActiveTab] = useState('cache');

  const [permissions, setPermissions] = useState([...DEFAULT_PERMISSIONS]);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [selectedRole, setSelectedRole] = useState(null);
  const [cacheCount, setCacheCount] = useState(247);
  const [bulkTagsInput, setBulkTagsInput] = useState('');
  const [permSearch, setPermSearch] = useState('');
  const [permModuleFilter, setPermModuleFilter] = useState('');
  const [newPermName, setNewPermName] = useState('');
  const [bulkPermInput, setBulkPermInput] = useState('');
  const [grantPermInput, setGrantPermInput] = useState('');
  const [toast, setToast] = useState(null);

  const [adminUsers, setAdminUsers] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminPermSearch, setAdminPermSearch] = useState('');
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingAdminDetail, setLoadingAdminDetail] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  const [assignablePermissions, setAssignablePermissions] = useState([]);
  const [loadingAssignablePerms, setLoadingAssignablePerms] = useState(false);

  const [pendingPerms, setPendingPerms] = useState(new Set());

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(window.__systemAdminToastTimeout);
    window.__systemAdminToastTimeout = window.setTimeout(() => setToast(null), 2200);
  };

  const filteredPermissions = useMemo(() => {
    return permissions.filter(
      (p) =>
        p.toLowerCase().includes(permSearch.toLowerCase()) &&
        (!permModuleFilter || getModule(p) === permModuleFilter)
    );
  }, [permissions, permSearch, permModuleFilter]);

  const rolePerms = selectedRole ? DEFAULT_ROLES[selectedRole]?.perms || [] : [];

  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  };

  const selectAllTags = () => setSelectedTags(new Set(DEFAULT_TAGS));
  const clearTagSel = () => setSelectedTags(new Set());

  const clearSelectedTags = () => {
    if (!selectedTags.size) { showToast('No tags selected'); return; }
    const list = [...selectedTags].join(', ');
    setCacheCount((prev) => Math.max(0, prev - selectedTags.size * 12));
    setSelectedTags(new Set());
    showToast(`Cleared: ${list}`);
  };

  const clearMany = () => {
    const tags = bulkTagsInput.split(',').map((s) => s.trim()).filter(Boolean);
    if (!tags.length) { showToast('Enter tag names'); return; }
    setBulkTagsInput('');
    showToast(`Cleared ${tags.length} tag(s)`);
  };

  const flushAll = () => { setCacheCount(0); showToast('Cache flushed'); };

  const deletePermission = (name) => {
    setPermissions((prev) => prev.filter((p) => p !== name));
    showToast(`Removed: ${name}`);
  };

  const addPermission = () => {
    const name = newPermName.trim();
    if (!name) { showToast('Enter a permission name'); return; }
    if (permissions.includes(name)) { showToast('Already exists'); return; }
    setPermissions((prev) => [...prev, name]);
    setNewPermName('');
    showToast(`Added: ${name}`);
  };

  const bulkAddPerms = () => {
    const names = bulkPermInput.split(',').map((s) => s.trim()).filter(Boolean);
    if (!names.length) { showToast('Enter permission names'); return; }
    let added = 0;
    setPermissions((prev) => {
      const next = [...prev];
      names.forEach((name) => {
        if (!next.includes(name)) { next.push(name); added += 1; }
      });
      return next;
    });
    setBulkPermInput('');
    showToast(`Added ${added} permission(s)`);
  };

  const openRole = (name) => setSelectedRole(name);
  const closeRoleDetail = () => { setSelectedRole(null); setGrantPermInput(''); };

  const grantPerm = () => {
    const name = grantPermInput.trim();
    if (!name) return;
    if (!permissions.includes(name)) { showToast('Permission does not exist'); return; }
    if (DEFAULT_ROLES[selectedRole]?.perms.includes(name)) { showToast('Already granted'); return; }
    showToast(`Granted: ${name}`);
  };

  const revokePerm = (name) => {
    showToast(`Revoked: ${name}`);
  };

  const loadAssignablePermissions = async () => {
    setLoadingAssignablePerms(true);
    try {
      const res = await adminCore.listAssignablePermissions(
        user?.token || localStorage.getItem("auth_token") || ""
      );
      if (!res.success) throw new Error(res.message || "Failed to load assignable permissions");
      const names = (res.data || []).map(p => p.name || p);
      setAssignablePermissions(names);
    } catch (err) {
      console.error('Failed to load assignable permissions:', err);
      setAssignablePermissions(DEFAULT_PERMISSIONS);
    } finally {
      setLoadingAssignablePerms(false);
    }
  };

  const loadAdminUsers = async () => {
    setLoadingAdmins(true);
    try {
      const res = await system.adminPermissions.list(
        user?.token || localStorage.getItem("auth_token") || "",
        { per_page: 100, ...(adminSearchQuery && { search: adminSearchQuery }) }
      );
      if (!res.success) throw new Error(res.message || "Failed to load admins");
      setAdminUsers(res.data || []);
    } catch (err) {
      showToast(err.message || "Error loading admins");
    } finally {
      setLoadingAdmins(false);
    }
  };

  const loadAdminDirectPermissions = async (adminId) => {
    setLoadingAdminDetail(true);
    try {
      const res = await system.adminPermissions.getDirect(
        adminId,
        user?.token || localStorage.getItem("auth_token") || ""
      );
      if (!res.success) throw new Error(res.message || "Failed to load permissions");
      setSelectedAdmin(prev => prev ? { ...prev, directPermissions: res.data || [] } : null);
    } catch (err) {
      showToast(err.message || "Error loading permissions");
    } finally {
      setLoadingAdminDetail(false);
    }
  };

  const adminGrantedPerms = useMemo(() => {
    if (!selectedAdmin?.directPermissions) return new Set();
    return new Set(selectedAdmin.directPermissions.map(p => p.name || p));
  }, [selectedAdmin]);

  const togglePermissionForAdmin = async (permName) => {
    if (!selectedAdmin || pendingPerms.has(permName)) return;

    const isGranted = adminGrantedPerms.has(permName);
    setPendingPerms(prev => new Set(prev).add(permName));

    try {
      const token = user?.token || localStorage.getItem("auth_token") || "";

      if (isGranted) {
        const res = await system.adminPermissions.revoke(selectedAdmin.id, [permName], token);
        if (!res.success) throw new Error(res.message || "Failed to revoke");
        showToast(`Revoked: ${permName}`);
      } else {
        const res = await system.adminPermissions.grant(selectedAdmin.id, [permName], token);
        if (!res.success) throw new Error(res.message || "Failed to grant");
        showToast(`Granted: ${permName}`);
      }

      await loadAdminDirectPermissions(selectedAdmin.id);
    } catch (err) {
      showToast(err.message || "Error updating permission");
    } finally {
      setPendingPerms(prev => {
        const next = new Set(prev);
        next.delete(permName);
        return next;
      });
    }
  };

  const removeAllPermissionsFromAdmin = async () => {
    if (!selectedAdmin) return;
    if (!window.confirm(`Remove ALL direct permissions from ${selectedAdmin.name}?`)) return;

    try {
      const res = await system.adminPermissions.removeAll(
        selectedAdmin.id,
        user?.token || localStorage.getItem("auth_token") || ""
      );
      if (!res.success) throw new Error(res.message || "Failed to remove permissions");
      showToast("All direct permissions removed");
      await loadAdminDirectPermissions(selectedAdmin.id);
    } catch (err) {
      showToast(err.message || "Error removing permissions");
    }
  };

  const groupedAssignablePerms = useMemo(() => {
    const filtered = assignablePermissions.filter(p =>
      !adminPermSearch || p.toLowerCase().includes(adminPermSearch.toLowerCase())
    );
    const groups = {};
    filtered.forEach(p => {
      const mod = getModule(p);
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [assignablePermissions, adminPermSearch]);

  const filteredAdminUsers = useMemo(() => {
    if (!adminSearchQuery.trim()) return adminUsers;
    const q = adminSearchQuery.toLowerCase();
    return adminUsers.filter(u =>
      (u.name?.toLowerCase().includes(q)) ||
      (u.email?.toLowerCase().includes(q)) ||
      (u.role?.toLowerCase().includes(q))
    );
  }, [adminUsers, adminSearchQuery]);

  const tabs = [
    { key: 'cache', label: 'Cache', icon: 'cache' },
    { key: 'permissions', label: 'Permissions', icon: 'lock' },
    ...(isGlobalSuperAdmin ? [{ key: 'roles', label: 'Roles', icon: 'users' }] : []),
  ];

  useEffect(() => {
    if (activeTab === 'permissions') {
      loadAdminUsers();
      loadAssignablePermissions();
    }
  }, [activeTab, adminSearchQuery]);

  return (
    <>
      <style>{styles}</style>

      <div className="system-shell">
        <nav className="system-sidebar">
          <div className="system-sidebar-header">System</div>

          {user && (
            <div className="system-user-badge">
              <div className="system-user-name">{user.name || 'User'}</div>
              {isGlobalSuperAdmin && (
                <div className="system-user-role">{prettifyRole(role)}</div>
              )}
            </div>
          )}

          {tabs.map((tab) => (
            <div
              key={tab.key}
              className={`system-nav-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveTab(tab.key)}
            >
              <span className="system-nav-icon">
                {tab.icon === 'cache' && '◫'}
                {tab.icon === 'lock' && '◌'}
                {tab.icon === 'users' && '◉'}
              </span>
              {tab.label}
            </div>
          ))}
        </nav>

        <div className="system-content">

          {activeTab === 'cache' && (
            <div>
              <div className="system-section-title">Cache</div>
              <div className="system-section-sub">
                Clear application cache by tag or flush everything at once.
              </div>

              <div className="system-metrics">
                <div className="system-metric">
                  <div className="system-metric-label">Status</div>
                  <div className="system-metric-value" style={{ fontSize: 14, paddingTop: 4 }}>
                    <span className="system-status-dot" />Healthy
                  </div>
                </div>
                <div className="system-metric">
                  <div className="system-metric-label">Driver</div>
                  <div className="system-metric-value" style={{ fontSize: 14, paddingTop: 4 }}>Redis</div>
                </div>
                <div className="system-metric">
                  <div className="system-metric-label">Entries</div>
                  <div className="system-metric-value">{cacheCount}</div>
                </div>
              </div>

              <div className="system-card">
                <div className="system-card-title">Clear by tag</div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                  Select one or more tags then clear.
                </div>
                <div className="system-cache-tags">
                  {DEFAULT_TAGS.map((tag) => (
                    <div
                      key={tag}
                      className={`system-tag ${selectedTags.has(tag) ? 'selected' : ''}`}
                      onClick={() => toggleTag(tag)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && toggleTag(tag)}
                    >
                      <span className="system-tag-dot" />{tag}
                    </div>
                  ))}
                </div>
                <div className="system-btn-row">
                  <button className="system-btn danger" onClick={clearSelectedTags}>Clear selected</button>
                  <button className="system-btn" onClick={selectAllTags}>Select all</button>
                  <button className="system-btn" onClick={clearTagSel}>Deselect</button>
                </div>
              </div>

              <div className="system-card">
                <div className="system-card-title">Clear many (bulk)</div>
                <div className="system-input-row">
                  <input
                    className="system-input"
                    value={bulkTagsInput}
                    onChange={(e) => setBulkTagsInput(e.target.value)}
                    placeholder="permissions, staff, cms (comma-separated)"
                  />
                  <button className="system-btn primary" onClick={clearMany}>Clear</button>
                </div>
              </div>

              <div className="system-card" style={{ borderColor: '#e39a9a' }}>
                <div className="system-card-title" style={{ color: '#b42318' }}>Flush all</div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                  Removes every cached entry. Use with caution in production.
                </div>
                <button className="system-btn danger" onClick={flushAll}>Flush entire cache</button>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div>
              <div className="system-section-title">Admin Permissions</div>
              <div className="system-section-sub">
                Manage direct permissions for admins. Check or uncheck to grant or revoke.
              </div>

              {!selectedAdmin ? (
                <div>
                  <div className="system-card">
                    <div className="system-card-title">Admins</div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                      Select an admin to manage their direct permissions.
                    </div>

                    <div className="system-input-row" style={{ marginBottom: 12 }}>
                      <input
                        className="system-input"
                        value={adminSearchQuery}
                        onChange={(e) => setAdminSearchQuery(e.target.value)}
                        placeholder="Search by name, email, or role..."
                      />
                      <button
                        className="system-btn small"
                        onClick={() => { setAdminSearchQuery(''); loadAdminUsers(); }}
                        style={{ minWidth: 'auto', padding: '6px 12px' }}
                      >
                        ✕
                      </button>
                    </div>

                    {loadingAdmins ? (
                      <div className="system-empty">Loading admins...</div>
                    ) : filteredAdminUsers.length === 0 ? (
                      <div className="system-empty">
                        {adminSearchQuery ? 'No admins match your search' : 'No admins found'}
                      </div>
                    ) : (
                      <div className="system-admin-list">
                        {filteredAdminUsers.map((admin) => (
                          <div
                            key={admin.id}
                            className="system-admin-row"
                            onClick={() => {
                              setSelectedAdmin(admin);
                              loadAdminDirectPermissions(admin.id);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setSelectedAdmin(admin);
                                loadAdminDirectPermissions(admin.id);
                              }
                            }}
                          >
                            <div>
                              <div className="system-admin-name">{admin.name || 'Unnamed'}</div>
                              <div className="system-admin-email">{admin.email}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div className="system-admin-role">{prettifyRole(admin.role)}</div>
                              <div className="system-admin-perm-count">
                                {(admin.directPermissions || []).length} direct perm
                                {(admin.directPermissions || []).length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div className="system-card-title" style={{ marginBottom: 2 }}>{selectedAdmin.name}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {selectedAdmin.email} • <span style={{ textTransform: 'capitalize' }}>{prettifyRole(selectedAdmin.role)}</span>
                      </div>
                    </div>
                    <button className="system-btn small" onClick={() => { setSelectedAdmin(null); setAdminPermSearch(''); }}>
                      ← Back
                    </button>
                  </div>

                  <div className="system-perm-summary">
                    <strong>{adminGrantedPerms.size}</strong>
                    <span>of {assignablePermissions.length} permissions granted</span>
                    {loadingAdminDetail && (
                      <span style={{ marginLeft: 'auto', color: '#aaa', fontSize: 11 }}>Updating...</span>
                    )}
                  </div>

                  <div className="system-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div className="system-card-title" style={{ marginBottom: 0 }}>
                        Permissions
                      </div>
                      <input
                        className="system-input"
                        style={{ width: 200, padding: '4px 8px', fontSize: 12 }}
                        value={adminPermSearch}
                        onChange={(e) => setAdminPermSearch(e.target.value)}
                        placeholder="Filter permissions..."
                      />
                    </div>

                    {loadingAssignablePerms ? (
                      <div className="system-empty">Loading permissions...</div>
                    ) : groupedAssignablePerms.length === 0 ? (
                      <div className="system-empty">No permissions match</div>
                    ) : (
                      <div className="system-checkbox-list">
                        {groupedAssignablePerms.map(([module, perms]) => (
                          <div key={module}>
                            <div className="system-checkbox-group-header">{module}</div>
                            {perms.map((perm) => {
                              const isChecked = adminGrantedPerms.has(perm);
                              const isPending = pendingPerms.has(perm);
                              return (
                                <div
                                  key={perm}
                                  className={`system-checkbox-row${isChecked ? ' checked' : ''}${isPending ? ' pending' : ''}`}
                                  onClick={() => togglePermissionForAdmin(perm)}
                                  role="checkbox"
                                  aria-checked={isChecked}
                                  tabIndex={0}
                                  onKeyDown={(e) => e.key === ' ' && togglePermissionForAdmin(perm)}
                                >
                                  <div className={`system-checkbox${isChecked ? ' checked' : ''}`} />
                                  <span className="system-checkbox-label">{perm}</span>
                                  {isPending && (
                                    <span style={{ fontSize: 10, color: '#aaa' }}>saving…</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="system-card" style={{ borderColor: '#e39a9a' }}>
                    <div className="system-card-title" style={{ color: '#b42318' }}>Danger zone</div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                      Remove all direct permissions from this admin. Role-inherited permissions remain.
                    </div>
                    <button
                      className="system-btn danger"
                      onClick={removeAllPermissionsFromAdmin}
                      disabled={loadingAdminDetail || adminGrantedPerms.size === 0}
                    >
                      {loadingAdminDetail ? 'Processing...' : 'Remove all direct permissions'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'roles' && isGlobalSuperAdmin && (
            <div>
              <div className="system-section-title">Role permissions</div>
              <div className="system-section-sub">Grant or revoke permissions per role.</div>

              {!selectedRole ? (
                <div className="system-role-grid">
                  {Object.entries(DEFAULT_ROLES).map(([name, data]) => (
                    <div
                      key={name}
                      className={`system-role-card ${selectedRole === name ? 'selected' : ''}`}
                      onClick={() => openRole(name)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && openRole(name)}
                    >
                      <div className="system-role-name">{prettifyRole(name)}</div>
                      <div className="system-role-count">
                        {data.perms.length} permission{data.perms.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div className="system-card-title">{prettifyRole(selectedRole)}</div>
                    <button className="system-btn small" onClick={closeRoleDetail}>Back</button>
                  </div>

                  <div className="system-input-row">
                    <input
                      className="system-input"
                      value={grantPermInput}
                      onChange={(e) => setGrantPermInput(e.target.value)}
                      placeholder="Permission name to grant"
                    />
                    <button className="system-btn primary small" onClick={grantPerm}>Grant</button>
                  </div>

                  <div className="system-perm-list">
                    {!rolePerms.length ? (
                      <div className="system-empty">No permissions assigned</div>
                    ) : (
                      rolePerms.map((permission) => (
                        <div className="system-perm-row" key={permission}>
                          <span className="system-perm-name">{permission}</span>
                          <button className="system-btn small danger" onClick={() => revokePerm(permission)}>
                            Revoke
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && <div className="system-toast">{toast}</div>}
    </>
  );
}

function BadgeM({ value }) {
  const style = (typeof MODULE_COLORS !== 'undefined' ? MODULE_COLORS[value] : null) || { bg: "#F1EFE8", color: "#444441" };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      background: style.bg,
      color: style.color,
      letterSpacing: "0.02em",
    }}>
      {value}
    </span>
  );
}



function MetaBlock({ data }) {
  if (!data || typeof data !== "object") return <span style={{ color: "#94a3b8" }}>—</span>;
  return (
    <pre style={{
      margin: 0,
      fontFamily: "monospace",
      fontSize: 12,
      background: "#f8fafc",
      border: "0.5px solid #e2e8f0",
      borderRadius: 8,
      padding: "10px 12px",
      whiteSpace: "pre-wrap",
      wordBreak: "break-all",
      color: "#334155",
      lineHeight: 1.6,
    }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function DetailRow({ label, value, mono = false, children }) {
  return (
    <div style={{ padding: "10px 0", borderBottom: "0.5px solid #f1f5f9" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </div>
      {children || (
        <div style={{
          fontSize: 13,
          color: value ? "#0f172a" : "#94a3b8",
          fontFamily: mono ? "monospace" : "inherit",
          wordBreak: "break-all",
          lineHeight: 1.5,
        }}>
          {value || "—"}
        </div>
      )}
    </div>
  );
}

function DetailPanel({ log, onClose }) {
  if (!log) return null;
  return (
    <div style={{
      border: "0.5px solid #e2e8f0",
      borderRadius: 12,
      background: "#ffffff",
      overflow: "hidden",
      marginTop: 12,
    }}>
      <div style={{
        padding: "10px 16px",
        background: "#f8fafc",
        borderBottom: "0.5px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155", fontFamily: "monospace" }}>
          #{log.id}
        </span>
        <button
          onClick={onClose}
          style={{
            border: "0.5px solid #cbd5e1",
            background: "transparent",
            borderRadius: 6,
            padding: "3px 10px",
            fontSize: 12,
            cursor: "pointer",
            color: "#64748b",
          }}
        >
          Close
        </button>
      </div>

      <div style={{ padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <DetailRow label="Action" value={log.action} mono />
        <DetailRow label="Module">
          <Badge value={log.module} />
        </DetailRow>
        <DetailRow label="User ID" value={log.user_id} mono />
        <DetailRow label="Reference ID" value={log.reference_id} mono />
        <DetailRow label="IP address" value={log.ip_address} mono />
        <DetailRow label="Timestamp" value={log.created_at ? new Date(log.created_at).toLocaleString() : "—"} />
        <div style={{ gridColumn: "1 / -1" }}>
          <DetailRow label="Description" value={log.description} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <DetailRow label="User agent" value={log.user_agent} mono />
        </div>
        <div style={{ gridColumn: "1 / -1", paddingBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Metadata
          </div>
          <MetaBlock data={log.metadata} />
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// REUSABLE LOG CELL COMPONENT
// =========================================================================
function LogCell({ children, mono = false }) {
  return (
    <td
      style={{
        padding: "10px 12px",
        borderBottom: "0.5px solid #e2e8f0",
        fontSize: 13,
        color: "#0f172a",
        verticalAlign: "middle",
        fontFamily: mono
          ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
          : "inherit",
      }}
    >
      {children}
    </td>
  );
}

// REMOVED 'export' HERE
function LogsPanel({ user }) {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at_desc");

  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const cacheRef = useRef(new Map());

  useEffect(() => {
    cacheRef.current.clear();
    setPage(1);
  }, [search, moduleFilter, sortBy]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const cacheKey = `${page}|${search}|${moduleFilter}|${sortBy}`;
      const cached = cacheRef.current.get(cacheKey);

      if (cached) {
        if (mounted) {
          setLogs(cached.logs);
          setMeta(cached.meta);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const res = await system.logs.list(user.token, {
          page,
          per_page: 15,
          search,
          module: moduleFilter,
          sort: sortBy,
        });

        if (!mounted) return;

        const newLogs = getItems(res) || [];
        const newMeta = res.meta || null;
        console.log("Fetched logs:", newLogs.length, "meta:", newMeta);
        setLogs(newLogs);
        setMeta(newMeta);

        if (cacheRef.current.size >= 5) {
          const oldestKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(oldestKey);
        }
        
        cacheRef.current.set(cacheKey, { logs: newLogs, meta: newMeta });
      } catch (e) {
        if (mounted) {
          console.error(e.message || "Failed to fetch logs");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user.token, page, search, moduleFilter, sortBy]);

  const selectedLog = logs.find((l) => l.id === selectedId) ?? null;

  function handleSearch(val) { setSearch(val); }
  function handleModule(val) { setModuleFilter(val); }
  function handleRow(id) { setSelectedId((prev) => (prev === id ? null : id)); }

  function getPaginationRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const range = [];
    range.push(1);
    let left = Math.max(2, current - 2);
    let right = Math.min(total - 1, current + 2);
    if (current <= 3) right = 5;
    else if (current >= total - 2) left = total - 4;
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < total - 1) range.push("...");
    if (total > 1) range.push(total);
    return range;
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) +
      " " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    );
  }

  const thStyle = {
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
    textAlign: "left",
    borderBottom: "0.5px solid #e2e8f0",
    whiteSpace: "nowrap",
    background: "#f8fafc",
  };

  const inputStyle = {
    height: 34,
    borderRadius: 8,
    border: "0.5px solid #cbd5e1",
    background: "#fff",
    padding: "0 10px",
    fontSize: 13,
    color: "#0f172a",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: 14, color: "#0f172a" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 180, cursor: "text" }}
          placeholder="Search action, module, description…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />

        <select
          style={{ ...inputStyle, paddingRight: 24 }}
          value={moduleFilter}
          onChange={(e) => handleModule(e.target.value)}
        >
          <option value="">All modules</option>
          {(typeof MODULES !== 'undefined' ? MODULES : []).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          style={{ ...inputStyle, paddingRight: 24 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="created_at_desc">Newest first</option>
          <option value="created_at_asc">Oldest first</option>
          <option value="action_asc">Action A–Z</option>
          <option value="module_asc">Module A–Z</option>
        </select>
      </div>

      <div style={{ border: "0.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden", minHeight: 200, position: "relative" }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, fontSize: 13, color: "#64748b" }}>
            Loading logs...
          </div>
        )}
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "14%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "26%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "9%" }} />
            </colgroup>

            <thead>
              <tr>
                {["Timestamp", "Action", "Module", "User ID", "Description", "IP address", "Reference"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {logs.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => handleRow(log.id)}
                    style={{ cursor: "pointer", background: log.id === selectedId ? "#eff6ff" : "transparent", transition: "background 0.15s ease" }}
                  >
                    <LogCell>{fmtDate(log.created_at)}</LogCell>
                    <LogCell mono>{log.action}</LogCell>
                    
                    {/* Replaced inline <td> with <LogCell> for consistency */}
                    <LogCell>
                      <Badge value={log.module} />
                    </LogCell>
                    
                    <LogCell mono>
                      {log.user_id ? log.user_id.slice(0, 12) + (log.user_id.length > 12 ? "…" : "") : "—"}
                    </LogCell>
                    <LogCell>{log.description}</LogCell>
                    <LogCell mono>{log.ip_address || "—"}</LogCell>
                    <LogCell mono>{log.reference_id ? log.reference_id.slice(0, 8) + "…" : "—"}</LogCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {meta && meta.last_page > 1 && (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: "#64748b", fontSize: 13, marginRight: 8 }}>
            {meta.from}–{meta.to} of {meta.total}
          </span>

          <button
            style={{ ...inputStyle, opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? "not-allowed" : "pointer" }}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>

          {getPaginationRange(page, meta.last_page).map((p, idx) => {
            if (p === "...") return <span key={`ellipsis-${idx}`} style={{ padding: "0 4px", color: "#64748b", fontSize: 13 }}>...</span>;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  ...inputStyle,
                  minWidth: 36,
                  background: page === p ? "#2563eb" : "#fff",
                  color: page === p ? "#fff" : "#0f172a",
                  borderColor: page === p ? "#2563eb" : "#cbd5e1",
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            );
          })}

          <button
            style={{ ...inputStyle, opacity: page >= meta.last_page ? 0.5 : 1, cursor: page >= meta.last_page ? "not-allowed" : "pointer" }}
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      <DetailPanel log={selectedLog} onClose={() => setSelectedId(null)} />
    </div>
  );
}

// Helper to convert hex color to RGB for rgba() opacity support in Heatmap
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246';
};

function AnalyticsPanel({ token }) {
  const [tab, setTab] = useState('overview');
  const [period, setPeriod] = useState('30d');
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const TABS = [
    { id: 'overview', label: 'Overview', icon: '\u25c8' },
    { id: 'modules',  label: 'Modules',  icon: '\ud83d\udce6' },
    { id: 'actions',  label: 'Actions',  icon: '\u26a1' },
    { id: 'timeline', label: 'Timeline', icon: '\ud83d\udcc8' },
    { id: 'users',    label: 'Top Users', icon: '\ud83d\udc65' },
    { id: 'errors',   label: 'Errors',   icon: '\ud83d\udd34' },
    { id: 'heatmap',  label: 'Heatmap',  icon: '\ud83d\udd25' },
  ];

  const PERIODS = ['today', 'yesterday', '7d', '30d', '90d'];

  const fetchTab = useCallback(async (t, p) => {
    const key = t + '_' + p;
    if (cache[key]) return;
    setLoading(true); setError(null);
    try {
      const params = { period: p };
      const fns = {
        overview: () => system.analytics.overview(params, token),
        modules:  () => system.analytics.modules(params, token),
        actions:  () => system.analytics.actions(params, token),
        timeline: () => system.analytics.timeline(params, token),
        users:    () => system.analytics.users(params, token),
        errors:   () => system.analytics.errors(params, token),
        heatmap:  () => system.analytics.heatmap(params, token),
      };
      const res = await fns[t]();
      setCache(c => ({ ...c, [key]: res?.data ?? res }));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token, cache]);

  useEffect(() => { fetchTab(tab, period); }, [tab, period]);

  const current = cache[tab + '_' + period];

  // =========================================================================
  // 1. PREMIUM OVERVIEW RENDERER
  // =========================================================================
  const renderOverview = (data) => {
    if (!data || !data.current) return <Empty message="No overview data" />;

    const { current, deltas, period } = data;

    // Smart Trend Badge (Green for good, Red for bad)
    const DeltaBadge = ({ value, invertColor = false }) => {
      if (value === null || value === undefined) return null;
      const isPositive = value > 0;
      const isNegative = value < 0;
      const isNeutral = value === 0;
      
      let color = G.textMuted;
      let bg = 'transparent';
      if (!isNeutral) {
        // If invertColor is true (like Error Rate), a negative change is GOOD (green)
        const isGood = invertColor ? isNegative : isPositive;
        color = isGood ? '#10b981' : '#ef4444';
        bg = isGood ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      }

      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
          color, background: bg
        }}>
          {!isNeutral && (isPositive ? '↑' : '↓')} {Math.abs(value).toFixed(1)}%
        </span>
      );
    };

    // Primary KPI Card
    const KpiCard = ({ title, value, delta, invertDelta = false, suffix = '' }) => (
      <div style={{
        background: G.surfaceAlt, borderRadius: 12, padding: 24,
        border: `1px solid ${G.border}`, display: 'flex', flexDirection: 'column', gap: 12
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: G.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: G.text, lineHeight: 1 }}>
            {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
            {suffix && <span style={{ fontSize: 16, color: G.textMuted, marginLeft: 4 }}>{suffix}</span>}
          </div>
          <DeltaBadge value={delta} invertColor={invertDelta} />
        </div>
      </div>
    );

    // Secondary Stat Row
    const StatItem = ({ label, value }) => (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${G.border}` }}>
        <span style={{ fontSize: 13, color: G.textMuted }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: G.text }}>{value ?? '—'}</span>
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Period Header */}
        <div style={{ padding: '0 4px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: G.text }}>
            {period?.from} to {period?.to}
          </div>
          <div style={{ fontSize: 12, color: G.textMuted }}>
            Showing data for the last {period?.days} day{period?.days !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Primary KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <KpiCard title="Total Events" value={current.total_events} delta={deltas?.total_events_pct} />
          <KpiCard title="Unique Users" value={current.unique_users} delta={deltas?.unique_users_pct} />
          <KpiCard title="Visits (IPs)" value={current.visits} delta={deltas?.visits_pct} />
          <KpiCard 
            title="Error Rate" 
            value={current.error_rate_pct} 
            suffix="%"
            delta={deltas?.error_rate_diff} 
            invertDelta={true} 
          />
        </div>

        {/* Secondary Stats & Context */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div style={{ background: G.surfaceAlt, borderRadius: 12, padding: 24, border: `1px solid ${G.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: G.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Activity Breakdown
            </div>
            <StatItem label="Busiest Module" value={current.busiest_module ?? 'None'} />
            <StatItem label="Busiest Hour" value={current.busiest_hour !== null && current.busiest_hour !== undefined ? `${current.busiest_hour}:00` : 'None'} />
            <StatItem label="Avg Events / Day" value={current.avg_events_per_day?.toFixed(1)} />
            
            {/* <--- NEW STAT ITEM ADDED HERE */}
            <StatItem label="Avg Visits / Day" value={current.avg_visits_per_day?.toFixed(1)} />
            
            <StatItem label="Unique Modules" value={current.unique_modules} />
          </div>

          {/* Contextual System Health Card */}
          <div style={{ background: G.surfaceAlt, borderRadius: 12, padding: 24, border: `1px solid ${G.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
             <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.9 }}>
               {current.error_rate_pct < 1 ? '🟢' : current.error_rate_pct < 5 ? '🟡' : '🔴'}
             </div>
             <div style={{ fontSize: 15, fontWeight: 600, color: G.text, marginBottom: 6 }}>System Health</div>
             <div style={{ fontSize: 13, color: G.textMuted, maxWidth: 240, lineHeight: 1.5 }}>
               {current.error_rate_pct < 1 
                  ? "System is running smoothly with minimal errors." 
                  : current.error_rate_pct < 5 
                  ? "System is stable, but keep an eye on the error rate."
                  : "High error rate detected. Check the Errors tab for details."}
             </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // 2. CHART RENDERERS (Timeline, Modules, Actions, Users, Errors, Heatmap)
  // =========================================================================

  const renderTimeline = (data) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={G.accent} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={G.accent} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={G.border} />
          <XAxis dataKey="period" stroke={G.textMuted} tick={{ fontSize: 12 }} />
          <YAxis stroke={G.textMuted} tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="total_events" stroke={G.accent} fillOpacity={1} fill="url(#colorTotal)" name="Total Events" />
          <Area type="monotone" dataKey="visits" stroke="#10b981" fillOpacity={1} fill="url(#colorVisits)" name="Unique Visits" />
          <Area type="monotone" dataKey="error_events" stroke="#ef4444" fillOpacity={1} fill="url(#colorError)" name="Errors" />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 12, color: G.textMuted, marginTop: -12 }}>Detailed Data:</div>
      {renderData(data)}
    </div>
  );

  const renderModules = (data) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={G.border} />
          <XAxis type="number" stroke={G.textMuted} tick={{ fontSize: 12 }} />
          <YAxis dataKey="module" type="category" stroke={G.textMuted} tick={{ fontSize: 12 }} width={90} />
          <Tooltip contentStyle={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="read_events" fill={G.accent} name="Reads" stackId="a" />
          <Bar dataKey="write_events" fill="#10b981" name="Writes" stackId="a" />
          <Bar dataKey="error_events" fill="#ef4444" name="Errors" stackId="a" />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 12, color: G.textMuted, marginTop: -12 }}>Detailed Data:</div>
      {renderData(data)}
    </div>
  );

  const renderActions = (data) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data.slice(0, 15)} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={G.border} />
          <XAxis dataKey="action" stroke={G.textMuted} tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} interval={0} />
          <YAxis stroke={G.textMuted} tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="total_events" fill={G.accent} name="Total Events" />
          <Bar dataKey="failures" fill="#ef4444" name="Failures" />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 12, color: G.textMuted, marginTop: -12 }}>Detailed Data:</div>
      {renderData(data)}
    </div>
  );

  const renderUsers = (data) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={G.border} />
          <XAxis type="number" stroke={G.textMuted} tick={{ fontSize: 12 }} />
          <YAxis dataKey="user_id" type="category" stroke={G.textMuted} tick={{ fontSize: 10 }} width={110} tickFormatter={(val) => `${val.substring(0, 8)}...`} />
          <Tooltip contentStyle={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="total_events" fill={G.accent} name="Total Events" />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 12, color: G.textMuted, marginTop: -12 }}>Detailed Data:</div>
      {renderData(data)}
    </div>
  );

  const renderErrors = (data) => {
    const COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#ec4899', '#06b6d4'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Summary KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
           {Object.entries(data.summary || {}).map(([k, v]) => (
             <div key={k} style={{ background: G.surfaceAlt, borderRadius: 8, padding: '14px 16px', border: `1px solid ${G.border}` }}>
               <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: G.textFaint, marginBottom: 8 }}>
                 {k.replace(/_/g, ' ')}
               </div>
               <div style={{ fontSize: 26, fontWeight: 700, color: G.text }}>{String(v ?? '—')}</div>
             </div>
           ))}
        </div>

        {/* Pie & Bar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          <div style={{ background: G.surfaceAlt, padding: 16, borderRadius: 8, border: `1px solid ${G.border}` }}>
             <h3 style={{ fontSize: 14, marginBottom: 16, color: G.text, margin: '0 0 16px 0' }}>Errors by Status Code</h3>
             {data.by_status_code && data.by_status_code.length > 0 ? (
               <ResponsiveContainer width="100%" height={250}>
                 <PieChart>
                   <Pie data={data.by_status_code} dataKey="count" nameKey="status_code" cx="50%" cy="50%" outerRadius={80} label>
                     {data.by_status_code.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip contentStyle={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 8, fontSize: 12 }} />
                   <Legend wrapperStyle={{ fontSize: 12 }} />
                 </PieChart>
               </ResponsiveContainer>
             ) : <Empty message="No status code errors" />}
          </div>

          <div style={{ background: G.surfaceAlt, padding: 16, borderRadius: 8, border: `1px solid ${G.border}` }}>
             <h3 style={{ fontSize: 14, marginBottom: 16, color: G.text, margin: '0 0 16px 0' }}>Errors by Module</h3>
             {data.by_module && data.by_module.length > 0 ? (
               <ResponsiveContainer width="100%" height={250}>
                 <BarChart data={data.by_module}>
                   <CartesianGrid strokeDasharray="3 3" stroke={G.border} />
                   <XAxis dataKey="module" stroke={G.textMuted} tick={{ fontSize: 11 }} />
                   <YAxis stroke={G.textMuted} tick={{ fontSize: 12 }} />
                   <Tooltip contentStyle={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 8, fontSize: 12 }} />
                   <Bar dataKey="error_count" fill="#ef4444" name="Errors" />
                 </BarChart>
               </ResponsiveContainer>
             ) : <Empty message="No module errors" />}
          </div>
        </div>

        {/* Error Timeline */}
        <div style={{ background: G.surfaceAlt, padding: 16, borderRadius: 8, border: `1px solid ${G.border}` }}>
           <h3 style={{ fontSize: 14, marginBottom: 16, color: G.text, margin: '0 0 16px 0' }}>Error Timeline</h3>
           {data.timeline && data.timeline.length > 0 ? (
             <ResponsiveContainer width="100%" height={250}>
               <AreaChart data={data.timeline}>
                 <CartesianGrid strokeDasharray="3 3" stroke={G.border} />
                 <XAxis dataKey="date" stroke={G.textMuted} tick={{ fontSize: 12 }} />
                 <YAxis stroke={G.textMuted} tick={{ fontSize: 12 }} />
                 <Tooltip contentStyle={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 8, fontSize: 12 }} />
                 <Area type="monotone" dataKey="error_count" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Errors" />
               </AreaChart>
             </ResponsiveContainer>
           ) : <Empty message="No timeline data" />}
        </div>
      </div>
    );
  };

  const renderHeatmap = (data) => {
    if (!data.cells || data.cells.length === 0) return <Empty message="No heatmap data" />;
    const maxCount = Math.max(...data.cells.map(c => c.event_count), 1);
    
    return (
      <div style={{ overflowX: 'auto', padding: '10px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(24, 1fr)', gap: 4, minWidth: 800 }}>
          <div></div>
          {data.hour_labels.map(h => (
            <div key={h} style={{ fontSize: 10, color: G.textMuted, textAlign: 'center' }}>{h}</div>
          ))}
          
          {data.day_labels.map((day, i) => {
            const dow = i + 1; // 1=Mon ... 7=Sun
            return (
              <React.Fragment key={day}>
                <div style={{ fontSize: 11, color: G.textMuted, display: 'flex', alignItems: 'center' }}>{day.substring(0, 3)}</div>
                {data.hour_labels.map(h => {
                  const cell = data.cells.find(c => c.day_of_week === dow && c.hour === h);
                  const count = cell ? cell.event_count : 0;
                  const visits = cell ? cell.visits : 0;
                  const intensity = count / maxCount;
                  const bg = count === 0 ? G.surfaceAlt : `rgba(${hexToRgb(G.accent)}, ${0.2 + intensity * 0.8})`;
                  return (
                    <div 
                      key={`${dow}-${h}`} 
                      title={`${day} ${h}:00\n${count} events\n${visits} visits`}
                      style={{ 
                        aspectRatio: '1', 
                        backgroundColor: bg, 
                        borderRadius: 4, 
                        border: `1px solid ${G.border}`,
                        cursor: 'pointer',
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // =========================================================================
  // 3. GENERIC DATA RENDERER (Fallback & Detail Tables)
  // =========================================================================

  const renderData = (obj) => {
    if (!obj || typeof obj !== 'object') {
      return <span style={{ color: G.accent, fontSize: 14 }}>{String(obj)}</span>;
    }
    if (Array.isArray(obj)) {
      if (obj.length === 0) return <Empty message="No data for this period" />;
      const keys = typeof obj[0] === 'object' ? Object.keys(obj[0]) : ['value'];
      return (
        <div style={{ overflowX: 'auto' }}>
          <table className="klf-table">
            <thead>
              <tr>{keys.map(k => <th key={k}>{k.replace(/_/g, ' ')}</th>)}</tr>
            </thead>
            <tbody>
              {obj.slice(0, 200).map((row, i) => (
                <tr key={i}>
                  {typeof row === 'object'
                    ? keys.map(k => <td key={k}>{typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k] ?? '—')}</td>)
                    : <td>{String(row)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {Object.entries(obj).map(([k, v]) => (
          <div key={k} style={{ background: G.surfaceAlt, borderRadius: 8, padding: '14px 16px', border: `1px solid ${G.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: G.textFaint, marginBottom: 8 }}>
              {k.replace(/_/g, ' ')}
            </div>
            {typeof v === 'object' && v !== null
              ? <div style={{ fontSize: 12, color: G.textMuted, wordBreak: 'break-all' }}>{JSON.stringify(v, null, 1)}</div>
              : <div style={{ fontSize: 26, fontWeight: 700, color: G.text }}>{String(v ?? '—')}</div>}
          </div>
        ))}
      </div>
    );
  };

  // =========================================================================
  // 4. MAIN RENDER LOGIC
  // =========================================================================

  const renderContent = () => {
    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: G.textMuted, paddingTop: 60 }}><Spinner /> Loading analytics...</div>;
    if (error) return <Err msg={error} />;
    if (!current) return <Empty message="No data for this period" />;

    switch (tab) {
      case 'overview': return renderOverview(current); 
      case 'timeline': return renderTimeline(current);
      case 'modules':  return renderModules(current);
      case 'actions':  return renderActions(current);
      case 'users':    return renderUsers(current);
      case 'errors':   return renderErrors(current);
      case 'heatmap':  return renderHeatmap(current);
      default:         return renderData(current); 
    }
  };

  return (
    <div className="klf-fade">
      <Card>
        <CardHeader
          title="Analytics"
          subtitle="System usage, activity, and performance insights"
          actions={
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PERIODS.map(p => (
                <Btn key={p} size="sm" variant={period === p ? 'primary' : 'ghost'} onClick={() => { setPeriod(p); setCache({}); }}>{p}</Btn>
              ))}
            </div>
          }
        />
        <div style={{ display: 'flex', gap: 2, padding: '8px 16px', borderBottom: `1px solid ${G.border}`, overflowX: 'auto', background: G.surfaceAlt }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '7px 14px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12.5,
              fontWeight: tab === t.id ? 700 : 400,
              background: tab === t.id ? G.accent : 'transparent',
              color: tab === t.id ? '#fff' : G.textMuted,
              whiteSpace: 'nowrap', transition: 'all .12s',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div style={{ padding: 20, minHeight: 320 }}>
          {renderContent()}
        </div>
      </Card>
    </div>
  );
}

export { SystemManagementPanel, LogsPanel, AnalyticsPanel };