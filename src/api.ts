// Compatibility wrapper built on top of the generated apis.ts client.
// This version only exposes routes and helpers that exist in apis.ts.

import {
  getItems,
  getMeta,
  ApiError,
  publicAuth,
  publicCms,
  publicRecruitment,
  staffAuth,
  staffSelf,
  adminCore,
  adminCms,
  adminStaff,
  adminRecruitment,
  reportsApi,
  systemApi,
  type ListQueryParams,
} from "./apis";

/**
 * Wrapper functions accept params as `Record<string, unknown>` for caller
 * convenience, but the underlying API client expects `ListQueryParams`
 * (index signature `[key: string]: Primitive`). This cast is safe because
 * at runtime both are plain objects; the difference is only type-level.
 */
function asParams(p: Record<string, unknown> | undefined): ListQueryParams | undefined {
  return p as ListQueryParams | undefined;
}

const DEBUG = false;
const TOKEN_KEY = "auth_token";
const ROLE_KEY = "auth_role";

let _memToken: string | null = null;

async function traced<T>(
  namespace: string,
  method: string,
  args: Record<string, unknown>,
  fn: () => Promise<T>
): Promise<T> {
  if (!DEBUG) return fn();
  console.group(`[API] ${namespace}.${method}`);
  console.debug("→ args:", args);
  try {
    const result = await fn();
    console.debug("← response:", result);
    return result;
  } catch (err) {
    console.error("✗ error:", err);
    throw err;
  } finally {
    console.groupEnd();
  }
}

export function setAuthToken(token: string | null | undefined): void {
  const normalized = token && token.trim() ? token.trim() : null;
  _memToken = normalized;

  try {
    if (normalized) {
      localStorage.setItem(TOKEN_KEY, normalized);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage failures
  }
}

export function getAuthToken(): string | null {
  if (_memToken) return _memToken;

  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && stored.trim()) {
      _memToken = stored.trim();
      return _memToken;
    }
  } catch {
    // ignore storage failures
  }

  return null;
}

export function hydrateTokenFromStorage(): void {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && stored.trim()) {
      _memToken = stored.trim();
    }
  } catch {
    // ignore storage failures
  }
}

export function configure(options: { token?: string }): void {
  if (options.token !== undefined) {
    setAuthToken(options.token);
  }
}

export function setRole(role: unknown): void {
  try {
    if (typeof role === "string" && role.trim()) {
      localStorage.setItem(ROLE_KEY, role.trim());
    } else {
      localStorage.removeItem(ROLE_KEY);
    }
  } catch {
    // ignore storage failures
  }
}

function extractAndSaveToken(res: any): string | null {
  const token =
    res?.data?.access_token ??
    res?.data?.token ??
    res?.access_token ??
    res?.token ??
    null;

  const role = res?.data?.user?.role ?? res?.data?.user_type ?? null;
  setRole(role);

  if (token && typeof token === "string" && token.trim()) {
    setAuthToken(token.trim());
    return token.trim();
  }

  return null;
}

async function withTokenSave<T extends Record<string, any>>(
  fn: () => Promise<T>
): Promise<T & { data: { token: string | null } }> {
  const res = await fn();
  const token = extractAndSaveToken(res);
  return {
    ...res,
    data: {
      ...(res?.data ?? {}),
      token,
    },
  };
}

function currentToken(explicitToken?: string | null, required = false): string {
  const resolved =
    (explicitToken && explicitToken.trim() ? explicitToken.trim() : null) ??
    getAuthToken();

  if (!resolved) {
    if (required) {
      throw new Error("[API] No auth token available.");
    }
    return "";
  }

  return resolved;
}

export function createStaffLoginFlow() {
  return {
    checkIdentity: (payload: Record<string, unknown>) =>
      traced("staffAuth", "checkIdentity", { email: payload.email }, () =>
        withTokenSave(() => staffAuth.checkIdentity(payload))
      ),
    createPassword: (payload: Record<string, unknown>) =>
      traced("staffAuth", "createPassword", { email: payload.email }, () =>
        withTokenSave(() => staffAuth.createPassword(payload))
      ),
    login: (payload: Record<string, unknown>) =>
      traced("staffAuth", "login", { email: payload.email }, () =>
        withTokenSave(() => staffAuth.login(payload))
      ),
  };
}

export { getItems, getMeta, ApiError };

export {
  publicAuth,
  publicCms,
  publicRecruitment,
  staffAuth,
  staffSelf,
  adminCore,
  adminCms,
  adminStaff,
  adminRecruitment,
  reportsApi,
};

export const adminGlobal = adminCore;

export const adminInvitations = {
  getAssignablePermissions: (token?: string | null) =>
    traced("adminInvitations", "getAssignablePermissions", {}, () =>
      adminCore.listAssignablePermissions(currentToken(token, true))
    ),
  create: (payload: Record<string, unknown>, token?: string | null) =>
    traced("adminInvitations", "create", { payload }, () =>
      adminCore.invite(currentToken(token, true), payload)
    ),
  get: (invitationToken: string, token?: string | null) =>
    traced("adminInvitations", "get", { invitationToken }, () =>
      staffSelf.getInvitationByToken(currentToken(token, true), invitationToken)
    ),
  resend: (invitationToken: string, token?: string | null) =>
    traced("adminInvitations", "resend", { invitationToken }, () =>
      adminCore.resendInvitation(currentToken(token, true), invitationToken)
    ),
  revoke: (invitationToken: string, token?: string | null) =>
    traced("adminInvitations", "revoke", { invitationToken }, () =>
      adminCore.revokeInvitation(currentToken(token, true), invitationToken)
    ),
  list: (params?: Record<string, unknown>, token?: string | null) =>
    traced("adminInvitations", "list", { params }, () =>
      adminCore.listInvitations(currentToken(token, true))
    ),
};

export const adminStaffImport = {
  import: (payload: Record<string, unknown> | FormData, token?: string | null) =>
    traced("adminStaffImport", "import", {}, () =>
      adminCore.importStaff(currentToken(token, true), payload)
    ),
};

export const adminReports = {
  getReport: (type: string, token?: string | null, params?: Record<string, unknown>) =>
    traced("adminReports", "getReport", { type, params }, () =>
      reportsApi.getReport(currentToken(token, true), type, asParams(params))
    ),
};

export const auth = {
  async login(payload: Record<string, unknown>) {
    const isStaff =
      payload?.user_type === "staff" || payload?.user_type === "admin";

    return traced(
      "auth",
      "login",
      { email: payload.email, user_type: payload.user_type },
      () =>
        isStaff
          ? withTokenSave(() =>
              staffAuth.login({
                email: payload.email,
                password: payload.password,
              })
            )
          : withTokenSave(() =>
              publicAuth.login({
                email: payload.email,
                password: payload.password,
              })
            )
    );
  },

  async register(payload: Record<string, unknown>) {
    return traced("auth", "register", { email: payload.email }, () =>
      withTokenSave(() =>
        publicAuth.register({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          password: payload.password,
        })
      )
    );
  },

  forgotPassword(payload: Record<string, unknown>) {
    const isStaff = payload?.user_type === "staff" || payload?.user_type === "admin";
    return traced("auth", "forgotPassword", { email: payload.email }, () =>
      isStaff
        ? staffAuth.forgotPassword({ email: payload.email })
        : publicAuth.forgotPassword({ email: payload.email })
    );
  },

  resetPassword(payload: Record<string, unknown>) {
    const isStaff = payload?.user_type === "staff" || payload?.user_type === "admin";
    return traced("auth", "resetPassword", { token: payload.token }, () =>
      isStaff ? staffAuth.resetPassword(payload) : publicAuth.resetPassword(payload)
    );
  },

  acceptInvitation(payload: Record<string, unknown>) {
    return traced("auth", "acceptInvitation", { token: payload.token }, () =>
      staffSelf.acceptInvitation(
        currentToken((payload.token as string | undefined) ?? undefined, true),
        String(payload.invitation_token ?? payload.token ?? "")
      )
    );
  },

  me(token?: string | null) {
    return traced("auth", "me", {}, () => staffAuth.me(currentToken(token, true)));
  },

  staffMe(token?: string | null) {
    return traced("auth", "staffMe", {}, () => staffAuth.me(currentToken(token, true)));
  },

  candidateMe(token?: string | null) {
    return traced("auth", "candidateMe", {}, () =>
      publicRecruitment.me(currentToken(token, true))
    );
  },

  changePassword(payload: Record<string, unknown>, token?: string | null) {
    const isStaff =
      payload?.user_type === "staff" || payload?.user_type === "admin";
    return traced("auth", "changePassword", { user_type: payload.user_type }, () =>
      isStaff
        ? staffAuth.changePassword(payload, currentToken(token, true))
        : publicAuth.changePassword(payload, currentToken(token) ?? undefined)
    );
  },

  async logout(token?: string | null) {
    return traced("auth", "logout", {}, async () => {
      const t = currentToken(token);
      try {
        const res = t
          ? await publicRecruitment.logout(t)
          : { success: true, message: "No token to revoke", data: null };
        setAuthToken(null);
        setRole(null);
        return res;
      } catch {
        try {
          const res = t
            ? await staffAuth.logout(t)
            : { success: true, message: "No token to revoke", data: null };
          setAuthToken(null);
          setRole(null);
          return res;
        } catch {
          setAuthToken(null);
          setRole(null);
          throw new Error("Logout failed on both public and staff endpoints.");
        }
      }
    });
  },
};

export const content = {
  news: {
    list: (params?: Record<string, unknown>) => publicCms.listNews(params),
    get: (id: string) => publicCms.getNews(id),
  },
  events: {
    list: (params?: Record<string, unknown>) => publicCms.listEvents(params),
    get: (id: string) => publicCms.getEvent(id),
  },
  jobs: {
    list: (params?: Record<string, unknown>) => publicRecruitment.listJobs(params),
    get: (id: string) => publicRecruitment.getJob(id),
    apply: (
      id: string,
      payload: Record<string, unknown> | FormData,
      token?: string | null
    ) => publicRecruitment.applyToJob(currentToken(token, true), id, payload),
  },
  tenders: {
    list: (params?: Record<string, unknown>) => publicCms.listTenders(params),
    get: (id: string) => publicCms.getTender(id),
  },
  departments: {
    list: (params?: Record<string, unknown>) => publicCms.listDepartments(params),
    get: (id: string) => publicCms.getDepartment(id),
    services: (departmentId: string) => publicCms.getDepartmentServices(departmentId),
    projects: (departmentId: string) => publicCms.getDepartmentProjects(departmentId),
    tenders: (departmentId: string) => publicCms.getDepartmentTenders(departmentId),
    staffByRole: (departmentId: string, role: string) =>
      publicCms.getDepartmentStaffByRole(departmentId, role),
  },
  services: {
    list: (params?: Record<string, unknown>) => publicCms.listServices(params),
    get: (id: string) => publicCms.getService(id),
  },
  projects: {
    list: (params?: Record<string, unknown>) => publicCms.listProjects(params),
    get: (id: string) => publicCms.getProject(id),
  },
  leadership: {
    list: (params?: Record<string, unknown>) => publicCms.listLeadership(params),
    get: (id: string) => publicCms.getLeadership(id),
  },
  announcements: {
    list: (params?: Record<string, unknown>) => publicCms.listAnnouncements(params),
    get: (id: string) => publicCms.getAnnouncement(id),
  },
  blog: {
    list: (params?: Record<string, unknown>) => publicCms.listBlogPosts(params),
    get: (slug: string) => publicCms.getBlogPost(slug),
  },
  documents: {
    list: (params?: Record<string, unknown>) => publicCms.listDocuments(params),
    get: (slug: string) => publicCms.getDocument(slug),
  },
  faqs: {
    list: (params?: Record<string, unknown>) => publicCms.listFaqs(params),
    get: (id: string) => publicCms.getFaq(id),
  },
  partnershipPrograms: {
    list: (params?: Record<string, unknown>) => publicCms.listPartners(params),
    get: (slug: string) => publicCms.getPartner(slug),
  },
  profile: {
    get: () => publicCms.getProfile(),
  },
  finance: {
    overview: () => publicCms.getFinanceOverview(),
  },
  candidate: {
    dashboard: (token?: string | null) =>
      publicRecruitment.getDashboard(currentToken(token, true)),
    profile: {
      get: (token?: string | null) =>
        publicRecruitment.getProfile(currentToken(token, true)),
      save: (payload: Record<string, unknown> | FormData, token?: string | null) =>
        publicRecruitment.upsertProfile(currentToken(token, true), payload),
      setAvailabilityStatus: (availabilityStatus: string, token?: string | null) =>
        publicRecruitment.updateAvailabilityStatus(
          currentToken(token, true),
          availabilityStatus
        ),
    },
    applications: {
      list: (params?: Record<string, unknown>, token?: string | null) =>
        publicRecruitment.listMyApplications(currentToken(token, true), asParams(params)),
    },
  },
};

export const staff = {
  me: (token?: string | null) => staffAuth.me(currentToken(token, true)),
  dashboard: (token?: string | null) =>
    staffSelf.getDashboard(currentToken(token, true)),
  invitations: {
    list: (params?: Record<string, unknown>, token?: string | null) =>
      staffSelf.listInvitations(currentToken(token, true), asParams(params)),
    getByToken: (invitationToken: string, token?: string | null) =>
      staffSelf.getInvitationByToken(currentToken(token, true), invitationToken),
    invitations: {
  list: (params?: Record<string, unknown>, token?: string | null) =>
    staffSelf.listInvitations(currentToken(token, true), asParams(params)),

  getByToken: (invitationToken: string, token?: string | null) =>
    staffSelf.getInvitationByToken(currentToken(token, true), invitationToken),

  accept: (params?: Record<string, unknown>, token?: string | null) =>
    staffSelf.acceptInvitation(
      currentToken(token, true),
      String(params?.token ?? "")
    ),
},
  },
  leave: {
    types: (token?: string | null, params?: Record<string, unknown>) =>
      staffSelf.listLeaveTypes(currentToken(token, true), asParams(params)),
    balances: (token?: string | null, params?: Record<string, unknown>) =>
      staffSelf.listMyLeaveBalances(currentToken(token, true), asParams(params)),
    applications: (params?: Record<string, unknown>, token?: string | null) =>
      staffSelf.listMyLeaveApplications(currentToken(token, true), asParams(params)),
    get: (id: string, token?: string | null) =>
      staffSelf.getLeaveApplication(currentToken(token, true), id),
    apply: (payload: Record<string, unknown> | FormData, token?: string | null) =>
      staffSelf.createLeaveApplication(currentToken(token, true), payload),
    cancel: (id: string, token?: string | null) =>
      staffSelf.cancelLeaveApplication(currentToken(token, true), id),
    preview: (id: string, token?: string | null) =>
      staffSelf.previewLeaveDocument(currentToken(token, true), id),
    download: (id: string, token?: string | null) =>
      staffSelf.downloadLeaveDocument(currentToken(token, true), id),
  },

  complaints: {
    list: (params?: Record<string, unknown>, token?: string | null) =>
      traced("staff.complaints", "list", { params }, () =>
        staffSelf.listComplaints(currentToken(token, true), asParams(params))
      ),
    get: (id: string, token?: string | null) =>
      traced("staff.complaints", "get", { id }, () =>
        staffSelf.getComplaint(currentToken(token, true), id)
      ),
    create: (payload: Record<string, unknown>, token?: string | null) =>
      traced("staff.complaints", "create", { payload }, () =>
        staffSelf.createComplaint(currentToken(token, true), payload)
      ),
  },
};

export const admin = {
  dashboard: {
    overview: (token?: string | null) =>
      adminCore.getDashboard(currentToken(token, true)),
    staff: (token?: string | null) =>
      adminStaff.getDashboard(currentToken(token, true)),
  },

  invitations: adminInvitations,

  finance: {
    overview: () => publicCms.getFinanceOverview(),
    save: (payload: Record<string, unknown>, token?: string | null) =>
      adminCms.upsertFinanceOverview(currentToken(token, true), payload),
  },

  organisation: {
    profile: (token?: string | null) =>
      adminCms.upsertProfile(currentToken(token, true), {}),
  },

  cms: adminCms,
  staff: adminStaff,
  recruitment: adminRecruitment,
  reports: adminReports,
};
export const system = {
  permissions: {
    list: (token?: string | null, params?: Record<string, unknown>) =>
      systemApi.getPermissions(currentToken(token, true), asParams(params)),

    create: (data: Record<string, unknown>, token?: string | null) =>
      systemApi.createPermission(currentToken(token, true), data),

    update: (permission: string, data: Record<string, unknown>, token?: string | null) =>
      systemApi.updatePermission(currentToken(token, true), permission, data),

    delete: (permission: string, token?: string | null) =>
      systemApi.deletePermission(currentToken(token, true), permission),

    deleteByPrefix: (prefix: string, token?: string | null) =>
      systemApi.deletePermissionsByPrefix(currentToken(token, true), prefix),
  },

  rolePermissions: {
    list: (role: string, token?: string | null) =>
      systemApi.getRolePermissions(currentToken(token, true), role),

    grant: (role: string, permissions: string[], token?: string | null) =>
      systemApi.grantRolePermissions(currentToken(token, true), role, permissions),

    sync: (role: string, permissions: string[], token?: string | null) =>
      systemApi.syncRolePermissions(currentToken(token, true), role, permissions),

    revoke: (role: string, permission: string, token?: string | null) =>
      systemApi.revokeRolePermission(currentToken(token, true), role, permission),
  },

  roles: {
    list: (token: string) =>
      systemApi.listRoles(currentToken(token, true)),
  },

  // =====================================================
  // ADMIN PERMISSIONS (Direct user-level permissions)
  // =====================================================
  adminPermissions: {
    /**
     * List admin users eligible for permission management.
     * Returns users with roles: hr_super_admin, psb_super_admin, cms_super_admin, county_admin
     */
    list: (token?: string | null, params?: Record<string, unknown>) =>
      systemApi.listAdminUsers(currentToken(token, true), asParams(params)),

    /**
     * Get direct (explicitly assigned) permissions for a specific admin user.
     * Does NOT include role-inherited permissions.
     */
    getDirect: (userId: string, token?: string | null) =>
      systemApi.getAdminDirectPermissions(currentToken(token, true), userId),

    /**
     * Get effective permissions for a target admin (role-inherited + direct).
     * Useful for auditing full access before delegation.
     */
    getEffective: (userId: string, token?: string | null) =>
      systemApi.getAdminEffectivePermissions(currentToken(token, true), userId),

    /**
     * Grant one or more direct permissions to an admin user.
     * Already-assigned permissions are silently skipped.
     * @param userId - The admin user ID
     * @param permissions - Array of permission names (e.g. ["cms.access.gallery", "staff.manage"])
     */
    grant: (userId: string, permissions: string[], token?: string | null) =>
      systemApi.grantAdminPermissions(currentToken(token, true), userId, permissions),

    /**
     * Revoke one or more direct permissions from an admin user.
     * @param userId - The admin user ID
     * @param permissions - Array of permission names to remove
     */
    revoke: (userId: string, permissions: string[], token?: string | null) =>
      systemApi.revokeAdminPermissions(currentToken(token, true), userId, permissions),

    /**
     * Remove ALL direct permissions from an admin user.
     * Role-inherited permissions remain untouched.
     */
    removeAll: (userId: string, token?: string | null) =>
      systemApi.removeAllAdminPermissions(currentToken(token, true), userId),
  },

  cache: {
    get: (token?: string | null) =>
      systemApi.getCache(currentToken(token, true)),

    clear: (token?: string | null) =>
      systemApi.clearCache(currentToken(token, true)),

    clearMany: (keys: string[], token?: string | null) =>
      systemApi.clearManyCache(currentToken(token, true), keys),

    clearTag: (tag: string, token?: string | null) =>
      systemApi.clearCacheTag(currentToken(token, true), tag),
  },

  logs: {
    list: (token?: string | null, params?: Record<string, unknown>) =>
      systemApi.getLogs(currentToken(token, true), asParams(params)),
  },

  analytics: {
    overview: (params?: Record<string, unknown>, token?: string | null) =>
      traced("system.analytics", "overview", { params }, () =>
        systemApi.getAnalyticsOverview(currentToken(token, true), asParams(params))
      ),
    modules: (params?: Record<string, unknown>, token?: string | null) =>
      traced("system.analytics", "modules", { params }, () =>
        systemApi.getAnalyticsModules(currentToken(token, true), asParams(params))
      ),
    actions: (params?: Record<string, unknown>, token?: string | null) =>
      traced("system.analytics", "actions", { params }, () =>
        systemApi.getAnalyticsActions(currentToken(token, true), asParams(params))
      ),
    timeline: (params?: Record<string, unknown>, token?: string | null) =>
      traced("system.analytics", "timeline", { params }, () =>
        systemApi.getAnalyticsTimeline(currentToken(token, true), asParams(params))
      ),
    users: (params?: Record<string, unknown>, token?: string | null) =>
      traced("system.analytics", "users", { params }, () =>
        systemApi.getAnalyticsUsers(currentToken(token, true), asParams(params))
      ),
    userDetail: (userId: string, params?: Record<string, unknown>, token?: string | null) =>
      traced("system.analytics", "userDetail", { userId }, () =>
        systemApi.getAnalyticsUserDetail(currentToken(token, true), userId, asParams(params))
      ),
    errors: (params?: Record<string, unknown>, token?: string | null) =>
      traced("system.analytics", "errors", { params }, () =>
        systemApi.getAnalyticsErrors(currentToken(token, true), asParams(params))
      ),
    heatmap: (params?: Record<string, unknown>, token?: string | null) =>
      traced("system.analytics", "heatmap", { params }, () =>
        systemApi.getAnalyticsHeatmap(currentToken(token, true), asParams(params))
      ),
  },
};

export const api = {
  auth,
  content,
  staff,
  admin,
  publicAuth,
  publicCms,
  publicRecruitment,
  staffAuth,
  staffSelf,
  adminCore,
  adminCms,
  adminStaff,
  adminRecruitment,
  reportsApi,
  systemApi,
  adminInvitations,
  adminStaffImport,
  adminReports,
  getItems,
  getMeta,
  ApiError,
  setAuthToken,
  getAuthToken,
  setRole,
  hydrateTokenFromStorage,
  configure,
  createStaffLoginFlow,
  system,
};

export default api;
