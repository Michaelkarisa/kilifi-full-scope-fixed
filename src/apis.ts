
const BASE_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_API_BASE_URL) ||
  (typeof process !== "undefined" &&
    (process as any).env?.NEXT_PUBLIC_API_BASE_URL) ||
  "https://api.kilifi.go.ke/api/v1";

type Primitive = string | number | boolean | null | undefined;
type QueryParams = Record<string, Primitive>;

export interface ListQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  [key: string]: Primitive;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  path?: string;
}

/**
 * Every response from the backend is wrapped in this envelope.
 *
 * Success (single item):  { success: true,  message, data: T,    meta: null,            errors: null }
 * Success (paginated):    { success: true,  message, data: T[],  meta: PaginationMeta,  errors: null }
 * Error:                  { success: false, message, data: null, meta: null,            errors: {...} }
 */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown> | PaginationMeta | null;
  errors?: Record<string, unknown> | null;
}

export type Single<T> = ApiEnvelope<T>;
export type Paged<T> = ApiEnvelope<T[]>;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function buildUrl(path: string, params?: QueryParams): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${BASE_URL}${normalizedPath}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    }
  }

  return url.toString();
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

async function parseResponseBody(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type") || "";

  if (response.status === 204) return null;

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  // HTML, plain-text, PDF, or anything else — return raw text
  const text = await response.text().catch(() => "");
  return text || null;
}

/** Compact debug representation — avoids dumping full HTML blobs to console. */
function debugRepr(payload: unknown): unknown {
  if (typeof payload === "string") {
    const trimmed = payload.trimStart();
    if (trimmed.startsWith("<")) {
      return `[HTML ~${payload.length} chars]`;
    }
    return payload.length > 200 ? `${payload.slice(0, 200)}…` : payload;
  }
  return payload;
}

type RequestOptions = {
  body?: unknown;
  params?: QueryParams;
  token?: string;
  idempotencyKey?: string;
  headers?: Record<string, string>;
};

/* -------------------------------------------------------------------------- */
/* Debug logger                                                               */
/* -------------------------------------------------------------------------- */

const DEBUG = true;

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const upperMethod = method.toUpperCase();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  const hasBody = options.body !== undefined && options.body !== null;
  const bodyIsFormData = isFormData(options.body);

  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  if (hasBody && !bodyIsFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (["POST", "PUT", "PATCH"].includes(upperMethod)) {
    headers["Idempotency-Key"] =
      options.idempotencyKey || createIdempotencyKey();
  }

  const url = buildUrl(path, options.params);

  if (DEBUG) {
    console.log(`[API REQUEST] ${upperMethod} ${path}`);
    console.log("URL:", url);
    if (options.params) console.log("Params:", options.params);
    if (hasBody) {
      console.log("Body:", bodyIsFormData ? "[FormData]" : options.body);
    }
  }

  try {
    const response = await fetch(url, {
      method: upperMethod,
      headers,
      body: hasBody
        ? bodyIsFormData
          ? (options.body as FormData)
          : JSON.stringify(options.body)
        : undefined,
    });

    const payload = await parseResponseBody(response);

    if (DEBUG) {
      console.log(`[API RESPONSE] ${upperMethod} ${path}`);
      console.log("Status:", response.status, response.statusText);
      console.log("Response:", debugRepr(payload));
    }

    if (!response.ok) {
      const message =
        (typeof payload === "object" && payload !== null
          ? payload?.message || payload?.error
          : null) ||
        response.statusText ||
        "Request failed";

      if (DEBUG) {
        console.error(`[API ERROR] ${upperMethod} ${path}`);
        console.error("Status:", response.status, response.statusText);
        console.error("Error Response:", debugRepr(payload));
      }

      throw new ApiError(response.status, message, payload);
    }

    return payload as T;
  } catch (error) {
    if (DEBUG) {
      console.error(`[API FETCH ERROR] ${upperMethod} ${path}`, error);
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Pagination helpers                                                         */
/* -------------------------------------------------------------------------- */

export function getItems<T>(res: Paged<T>): T[] {
  return Array.isArray(res.data) ? res.data : [];
}

export function getMeta<T>(res: Paged<T>): PaginationMeta {
  const meta = (res.meta || {}) as Partial<PaginationMeta>;
  return {
    current_page: meta.current_page ?? 1,
    last_page: meta.last_page ?? 1,
    per_page: meta.per_page ?? getItems(res).length,
    total: meta.total ?? getItems(res).length,
    from: meta.from ?? (getItems(res).length ? 1 : null),
    to: meta.to ?? (getItems(res).length || null),
    path: meta.path,
  };
}

/* -------------------------------------------------------------------------- */
/* Entity types                                                               */
/* -------------------------------------------------------------------------- */

export interface StaffProfile {
  id: string;
  name: string;
  email: string;
  staff_code: string;
  pr_number?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  user_type: string;
  staff_id?: string | null;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string | null;
  role?: string | null;
  roles?: string[];
  permissions?: string[];
  staff?: StaffProfile | null;
}

export interface AuthPayload {
  access_token: string;
  token_type: string;
  abilities?: string[];
  user: User;
}

export interface News {
  id: string;
  title: string;
  slug?: string | null;
  publish_date?: string | null;
  image?: string | null;
  excerpt?: string | null;
  body?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id: string;
  title: string;
  slug?: string | null;
  date_text?: string | null;
  time_text?: string | null;
  location?: string | null;
  price?: string | null;
  desc?: string | null;
  image?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  title: string;
  slug?: string | null;
  category?: string | null;
  location?: string | null;
  status?: string | null;
  progress?: number | null;
  image?: string | null;
  desc?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: string;
  icon?: string | null;
  title?: string;
  name?: string;
  slug?: string | null;
  desc?: string | null;
  governor?: string | null;
  image?: string | null;
  governor_image?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  title: string;
  slug?: string | null;
  short_desc?: string | null;
  desc?: string | null;
  icon?: string | null;
  image?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Full staff record (admin / self-service). */
export interface Staff {
  id: string;
  staff_code?: string | null;
  pr_number?: string | null;
  name: string;
  email: string;
  dept?: string | null;
  role?: string | null;
  status?: string;
  salutation?: string | null;
  duty_station?: string | null;
  terms_of_service?: string | null;
  date_of_birth?: string | null;
  date_engaged?: string | null;
  job_group?: string | null;
  gender?: string | null;
  phone?: string | null;
  national_id?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveType {
  id: string;
  name: string;
  code?: string | null;
  default_days?: number | null;
  requires_attachment?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveBalance {
  id: string;
  staff_id: string;
  leave_type_id: string;
  year: number;
  allocated_days: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
  leave_type?: LeaveType;
  staff?: Staff;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveApplication {
  id: string;
  staff_id: string;
  leave_type_id: string;
  application_code?: string | null;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason?: string | null;
  attachment_url?: string | null;
  status?: string | null;
  relief_staff_id?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_comments?: string | null;
  leave_type?: LeaveType;
  staff?: Staff;
  reviewer?: Staff;
  relief_staff?: Staff;
  created_at?: string;
  updated_at?: string;
}

export interface Job {
  id: string;
  job_code?: string;
  title: string;
  recruitment_type?: string;
  status?: string;
  deadline?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  job_title?: string | null;
  applicant_name?: string | null;
  date_applied?: string | null;
  status?: string | null;
  email?: string | null;
  phone?: string | null;
  cover_letter?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Announcement {
  id: string;
  type?: string | null;
  title: string;
  announcement_date?: string | null;
  body?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  slug?: string | null;
  url_path?: string | null;
  type?: string | null;
  code?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HeroSlide {
  id: string;
  page_key: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  image?: string | null;
  cta_primary_label?: string | null;
  cta_primary_link?: string | null;
  cta_secondary_label?: string | null;
  cta_secondary_link?: string | null;
  sort_order?: number;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PageStat {
  id: string;
  page_key: string;
  group_key?: string | null;
  label: string;
  value: string;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Contact {
  id: string;
  full_name: string;
  email: string;
  inquiry_type: string;
  message: string;
  status?: string;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Setting {
  id: string;
  group?: string | null;
  key: string;
  value?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Permission {
  id: string;
  name: string;
  guard_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Complaint {
  id: string;
  staff_id?: string | null;
  subject?: string | null;
  description?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
  staff?: Staff | null;
}

export interface AnalyticsPeriodParams {
  period?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';
  from?: string;
  to?: string;
}
/* -------------------------------------------------------------------------- */
/* Public auth                                                                */
/* -------------------------------------------------------------------------- */

export const publicAuth = {
  register: (payload: Record<string, unknown>) =>
    request<Single<AuthPayload>>("POST", "/public/auth/register", {
      body: payload,
    }),

  login: (payload: Record<string, unknown>) =>
    request<Single<AuthPayload>>("POST", "/public/auth/login", {
      body: payload,
    }),

  forgotPassword: (payload: Record<string, unknown>) =>
    request<Single<any>>("POST", "/public/auth/forgot-password", {
      body: payload,
    }),

  resetPassword: (payload: Record<string, unknown>) =>
    request<Single<any>>("POST", "/public/auth/reset-password", {
      body: payload,
    }),

  changePassword: (payload: Record<string, unknown>, token?: string) =>
    request<Single<any>>("POST", "/public/auth/change-password", {
      body: payload,
      token,
    }),
};

/* -------------------------------------------------------------------------- */
/* Public CMS                                                                 */
/* -------------------------------------------------------------------------- */

export const publicCms = {
  // Contact
  submitContact: (payload: Record<string, unknown>) =>
    request<Single<Contact>>("POST", "/public/contact", { body: payload }),

  // News
  listNews: (params?: ListQueryParams) =>
    request<Paged<News>>("GET", "/public/cms/news", { params }),

  getNews: (idOrSlug: string) =>
    request<Single<News>>("GET", `/public/cms/news/${idOrSlug}`),

  // Events
  listEvents: (params?: ListQueryParams) =>
    request<Paged<Event>>("GET", "/public/cms/events", { params }),

  getEvent: (idOrSlug: string) =>
    request<Single<Event>>("GET", `/public/cms/events/${idOrSlug}`),

  // Projects
  listProjects: (params?: ListQueryParams) =>
    request<Paged<Project>>("GET", "/public/cms/projects", { params }),

  getProject: (idOrSlug: string) =>
    request<Single<Project>>("GET", `/public/cms/projects/${idOrSlug}`),

  // Departments
  listDepartments: (params?: ListQueryParams) =>
    request<Paged<Department>>("GET", "/public/cms/departments", { params }),

  getDepartment: (idOrSlug: string) =>
    request<Single<Department>>(
      "GET",
      `/public/cms/departments/${idOrSlug}`
    ),

  getDepartmentStaffByRole: (departmentId: string, role: string) =>
    request<Single<any>>(
      "GET",
      `/public/cms/departments/${departmentId}/staff-by-role/${encodeURIComponent(role)}`
    ),

  getDepartmentServices: (departmentId: string) =>
    request<Single<any>>(
      "GET",
      `/public/cms/departments/${departmentId}/services`
    ),

  getDepartmentProjects: (departmentId: string) =>
    request<Single<any>>(
      "GET",
      `/public/cms/departments/${departmentId}/projects`
    ),

  getDepartmentTenders: (departmentId: string) =>
    request<Single<any>>(
      "GET",
      `/public/cms/departments/${departmentId}/tenders`
    ),

  // Services
  listServices: (params?: ListQueryParams) =>
    request<Paged<Service>>("GET", "/public/cms/services", { params }),

  getService: (idOrSlug: string) =>
    request<Single<Service>>("GET", `/public/cms/services/${idOrSlug}`),

  // Sectors
  listSectors: (params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/public/cms/sectors", { params }),

  getSector: (idOrSlug: string) =>
    request<Single<any>>("GET", `/public/cms/sectors/${idOrSlug}`),

  // Announcements
  listAnnouncements: (params?: ListQueryParams) =>
    request<Paged<Announcement>>("GET", "/public/cms/announcements", {
      params,
    }),

  getAnnouncement: (idOrSlug: string) =>
    request<Single<Announcement>>(
      "GET",
      `/public/cms/announcements/${idOrSlug}`
    ),

  // Tenders
  listTenders: (params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/public/cms/tenders", { params }),

  getTender: (idOrSlug: string) =>
    request<Single<any>>("GET", `/public/cms/tenders/${idOrSlug}`),

  // FAQs
  listFaqs: (params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/public/cms/faqs", { params }),

  getFaq: (idOrSlug: string) =>
    request<Single<any>>("GET", `/public/cms/faqs/${idOrSlug}`),

  // Leadership
  listLeadership: (params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/public/cms/leadership", { params }),

  getLeadership: (slug: string) =>
    request<Single<any>>("GET", `/public/cms/leadership/${slug}`),

  // Home
  getHome: () => request<Single<any>>("GET", "/public/cms/home"),

  getHomePageData: () =>
    request<Single<any>>("GET", "/public/cms/home/page-data"),

  // Tourism
  getTourism: () => request<Single<any>>("GET", "/public/cms/tourism"),

  getTourismPageData: () =>
    request<Single<any>>("GET", "/public/cms/tourism/page-data"),

  listTourismDestinations: (params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/public/cms/tourism/destinations", { params }),

  getTourismDestination: (slug: string) =>
    request<Single<any>>(
      "GET",
      `/public/cms/tourism/destinations/${slug}`
    ),

  // Partners
listPartners: (params?: ListQueryParams) =>
  request<Paged<any>>("GET", "/public/cms/partners", { params }),

getPartner: (idOrSlug: string) =>
  request<Single<any>>("GET", `/public/cms/partners/${idOrSlug}`),

getPartnersPageData: () =>
  request<Single<any>>("GET", "/public/cms/partners/page-data"),

getPartnerProjects: (partnerIdOrSlug: string, params?: ListQueryParams) =>
  request<Paged<any>>(
    "GET",
    `/public/cms/partners/${partnerIdOrSlug}/projects`,
    { params }
  ),

getPartnerMilestones: (partnerIdOrSlug: string, params?: ListQueryParams) =>
  request<Paged<any>>(
    "GET",
    `/public/cms/partners/${partnerIdOrSlug}/milestones`,
    { params }
  ),

getPartnerDocuments: (partnerIdOrSlug: string, params?: ListQueryParams) =>
  request<Paged<any>>(
    "GET",
    `/public/cms/partners/${partnerIdOrSlug}/documents`,
    { params }
  ),

getPartnerContacts: (partnerIdOrSlug: string, params?: ListQueryParams) =>
  request<Paged<any>>(
    "GET",
    `/public/cms/partners/${partnerIdOrSlug}/contacts`,
    { params }
  ),

  // Documents
  listDocuments: (params?: ListQueryParams) =>
    request<Paged<DocumentItem>>("GET", "/public/cms/documents", { params }),

  getDocument: (slug: string) =>
    request<Single<DocumentItem>>("GET", `/public/cms/documents/${slug}`),

  // Organisation profile
  getProfile: () => request<Single<any>>("GET", "/public/cms/profile"),

  // Finance overview
  getFinanceOverview: () =>
    request<Single<any>>("GET", "/public/cms/finance-overview"),

  // Blog posts
  listBlogPosts: (params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/public/cms/blog-posts", { params }),

  getBlogPost: (slug: string) =>
    request<Single<any>>("GET", `/public/cms/blog-posts/${slug}`),
};

/* -------------------------------------------------------------------------- */
/* Legacy content aliases                                                     */
/* -------------------------------------------------------------------------- */

export const contentApi = {
  getHome: () => request<Single<any>>("GET", "/content/home"),
  getTourism: () => request<Single<any>>("GET", "/content/tourism"),
  getCurrentGovernor: () =>
    request<Single<any>>("GET", "/content/leadership/current-governor"),
  getLeadership: (slug: string) =>
    request<Single<any>>("GET", `/content/leadership/${slug}`),
  listPartners: (params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/content/partners", { params }),
  submitPartnershipRequest: (payload: Record<string, unknown>) =>
    request<Single<any>>("POST", "/content/partnership-requests", {
      body: payload,
    }),
};

/* -------------------------------------------------------------------------- */
/* Public recruitment                                                         */
/* -------------------------------------------------------------------------- */

export const publicRecruitment = {
  // Job board (unauthenticated)
  listJobs: (params?: ListQueryParams) =>
    request<Paged<Job>>("GET", "/public/recruitment/jobs", { params }),

  getJob: (id: string) =>
    request<Single<Job>>("GET", `/public/recruitment/jobs/${id}`),

  // Authenticated candidate routes
  getDashboard: (token: string) =>
    request<Single<any>>("GET", "/public/recruitment/dashboard", { token }),

  getProfile: (token: string) =>
    request<Single<any>>("GET", "/public/recruitment/profile", { token }),

  upsertProfile: (
    token: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<any>>("POST", "/public/recruitment/profile", {
      token,
      body: payload,
    }),

  /** PATCH /public/recruitment/profile/availability-status */
  updateAvailabilityStatus: (token: string, availabilityStatus: string) =>
    request<Single<any>>(
      "PATCH",
      "/public/recruitment/profile/availability-status",
      { token, body: { availability_status: availabilityStatus } }
    ),

  listMyApplications: (token: string, params?: ListQueryParams) =>
    request<Paged<JobApplication>>(
      "GET",
      "/public/recruitment/applications",
      { token, params }
    ),

  applyToJob: (
    token: string,
    jobId: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<JobApplication>>(
      "POST",
      `/public/recruitment/jobs/${jobId}/apply`,
      { token, body: payload }
    ),

  me: (token: string) =>
    request<Single<AuthPayload>>("GET", "/public/recruitment/auth/me", {
      token,
    }),

  logout: (token: string) =>
    request<Single<any>>("POST", "/public/recruitment/auth/logout", { token }),
};

/* -------------------------------------------------------------------------- */
/* Staff auth + self-service                                                  */
/* -------------------------------------------------------------------------- */

export const staffAuth = {
  checkIdentity: (payload: Record<string, unknown>) =>
    request<Single<any>>("POST", "/staff/auth/check", { body: payload }),

  createPassword: (payload: Record<string, unknown>) =>
    request<Single<any>>("POST", "/staff/auth/create-password", {
      body: payload,
    }),

  login: (payload: Record<string, unknown>) =>
    request<Single<AuthPayload>>("POST", "/staff/auth/login", {
      body: payload,
    }),

  forgotPassword: (payload: Record<string, unknown>) =>
    request<Single<any>>("POST", "/staff/auth/forgot-password", {
      body: payload,
    }),

  resetPassword: (payload: Record<string, unknown>) =>
    request<Single<any>>("POST", "/staff/auth/reset-password", {
      body: payload,
    }),

  me: (token: string) =>
    request<Single<AuthPayload>>("GET", "/staff/auth/me", { token }),

  logout: (token: string) =>
    request<Single<any>>("POST", "/staff/auth/logout", { token }),

  changePassword: (payload: Record<string, unknown>, token: string) =>
    request<Single<any>>("POST", "/staff/auth/change-password", {
      body: payload,
      token,
    }),
};

export const staffSelf = {
  getDashboard: (token: string) =>
    request<Single<any>>("GET", "/staff/dashboard", { token }),

  // Invitations
  listInvitations: (token: string, params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/staff/invitations", { token, params }),

  /** GET /staff/invitations/{token} — look up an invitation by its token string */
  getInvitationByToken: (token: string, invitationToken: string) =>
    request<Single<any>>("GET", `/staff/invitations/${invitationToken}`, {
      token,
    }),

  /** POST /staff/invitations/accept */
  acceptInvitation: (token: string, invitationToken: string) =>
    request<Single<any>>("POST", "/staff/invitations/accept", {
      token,
      body: { token: invitationToken },
    }),

  // Leave types
  listLeaveTypes: (token: string, params?: ListQueryParams) =>
    request<Paged<LeaveType>>("GET", "/staff/leave/types", { token, params }),

  // Leave balances
  listMyLeaveBalances: (token: string, params?: ListQueryParams) =>
    request<Single<LeaveBalance[]>>("GET", "/staff/leave/balances", {
      token,
      params,
    }),

  // Leave applications
  listMyLeaveApplications: (token: string, params?: ListQueryParams) =>
    request<Paged<LeaveApplication>>("GET", "/staff/leave/applications", {
      token,
      params,
    }),

  getLeaveApplication: (token: string, applicationId: string) =>
    request<Single<LeaveApplication>>(
      "GET",
      `/staff/leave/applications/${applicationId}`,
      { token }
    ),

  createLeaveApplication: (
    token: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<LeaveApplication>>("POST", "/staff/leave/applications", {
      token,
      body: payload,
    }),

  cancelLeaveApplication: (token: string, applicationId: string) =>
    request<Single<LeaveApplication>>(
      "POST",
      `/staff/leave/applications/${applicationId}/cancel`,
      { token }
    ),

  previewLeaveDocument: (token: string, applicationId: string) =>
    request<any>(
      "GET",
      `/staff/leave/applications/${applicationId}/document/preview`,
      { token, headers: { Accept: "*/*" } }
    ),

  downloadLeaveDocument: (token: string, applicationId: string) =>
    request<any>(
      "GET",
      `/staff/leave/applications/${applicationId}/document/download`,
      { token, headers: { Accept: "*/*" } }
    ),

  // ── Complaints ──────────────────────────────────────────────────────────
  listComplaints: (token: string, params?: ListQueryParams) =>
    request<Paged<Complaint>>("GET", "/staff/complaints", { token, params }),

  getComplaint: (token: string, id: string) =>
    request<Single<Complaint>>("GET", `/staff/complaints/${id}`, { token }),

  createComplaint: (token: string, payload: Record<string, unknown>) =>
    request<Single<Complaint>>("POST", "/staff/complaints", {
      token,
      body: payload,
    }),
};

/* -------------------------------------------------------------------------- */
/* Admin core (dashboard, invitations, staff import)                         */
/* -------------------------------------------------------------------------- */

export const adminCore = {
  getDashboard: (token: string) =>
    request<Single<any>>("GET", "/admin/dashboard", { token }),

  listAssignablePermissions: (token: string) =>
    request<Single<any>>("GET", "/admin/permissions/assignable", { token }),

  /** POST /admin/invitations — send a new invitation */
  invite: (token: string, payload: Record<string, unknown>) =>
    request<Single<any>>("POST", "/admin/invitations", {
      token,
      body: payload,
    }),

  /** POST /admin/invitation/revoke — revoke by token string */
  revokeInvitation: (token: string, invitationToken: string) =>
    request<Single<any>>("POST", "/admin/invitation/revoke", {
      token,
      body: { token: invitationToken },
    }),

  /** POST /admin/invitation/resend — resend by token string */
  resendInvitation: (token: string, invitationToken: string) =>
    request<Single<any>>("POST", "/admin/invitation/resend", {
      token,
      body: { token: invitationToken },
    }),
  listInvitations: (token: string) =>
    request<Single<any>>("GET", "/admin/invitations", {token}),

  importStaff: (token: string, payload: Record<string, unknown> | FormData) =>
    request<Single<any>>("POST", "/admin/staff/import", {
      token,
      body: payload,
    }),
};

/* -------------------------------------------------------------------------- */
/* Admin CMS                                                                  */
/* -------------------------------------------------------------------------- */

export const adminCms = {
  // ── Hero Slides ──────────────────────────────────────────────────────────
  listHeroSlides: (token: string, params?: ListQueryParams) =>
    request<Paged<HeroSlide>>("GET", "/admin/cms/hero-slides", {
      token,
      params,
    }),
  createHeroSlide: (
    token: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<HeroSlide>>("POST", "/admin/cms/hero-slides", {
      token,
      body: payload,
    }),
  getHeroSlide: (token: string, id: string) =>
    request<Single<HeroSlide>>("GET", `/admin/cms/hero-slides/${id}`, {
      token,
    }),
  updateHeroSlide: (
    token: string,
    id: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<HeroSlide>>("PUT", `/admin/cms/hero-slides/${id}`, {
      token,
      body: payload,
    }),
  deleteHeroSlide: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/hero-slides/${id}`, { token }),

  // ── Page Stats ───────────────────────────────────────────────────────────
  listPageStats: (token: string, params?: ListQueryParams) =>
    request<Paged<PageStat>>("GET", "/admin/cms/page-stats", { token, params }),
  createPageStat: (token: string, payload: Record<string, unknown>) =>
    request<Single<PageStat>>("POST", "/admin/cms/page-stats", {
      token,
      body: payload,
    }),
  getPageStat: (token: string, id: string) =>
    request<Single<PageStat>>("GET", `/admin/cms/page-stats/${id}`, { token }),
  updatePageStat: (
    token: string,
    id: string,
    payload: Record<string, unknown>
  ) =>
    request<Single<PageStat>>("PUT", `/admin/cms/page-stats/${id}`, {
      token,
      body: payload,
    }),
  deletePageStat: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/page-stats/${id}`, { token }),

  // ── Contact submissions ──────────────────────────────────────────────────
  listContacts: (token: string, params?: ListQueryParams) =>
    request<Paged<Contact>>("GET", "/admin/cms/contact", { token, params }),
  getContact: (token: string, id: string) =>
    request<Single<Contact>>("GET", `/admin/cms/contact/${id}`, { token }),
  updateContact: (
    token: string,
    id: string,
    payload: Record<string, unknown>
  ) =>
    request<Single<Contact>>("PUT", `/admin/cms/contact/${id}`, {
      token,
      body: payload,
    }),
  updateContactStatus: (token: string, id: string, status: string) =>
    request<Single<Contact>>("PATCH", `/admin/cms/contact/${id}/status`, {
      token,
      body: { status },
    }),
  deleteContact: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/contact/${id}`, { token }),

  // ── News ─────────────────────────────────────────────────────────────────
  listNews: (token: string, params?: ListQueryParams) =>
    request<Paged<News>>("GET", "/admin/cms/news", { token, params }),
  createNews: (token: string, payload: Record<string, unknown> | FormData) =>
    request<Single<News>>("POST", "/admin/cms/news", { token, body: payload }),
  getNews: (token: string, id: string) =>
    request<Single<News>>("GET", `/admin/cms/news/${id}`, { token }),
  updateNews: (
    token: string,
    id: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<News>>("PUT", `/admin/cms/news/${id}`, {
      token,
      body: payload,
    }),
  updateNewsStatus: (token: string, id: string, status: string) =>
    request<Single<News>>("PATCH", `/admin/cms/news/${id}/status`, {
      token,
      body: { status },
    }),
  deleteNews: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/news/${id}`, { token }),

  // ── Events ───────────────────────────────────────────────────────────────
  listEvents: (token: string, params?: ListQueryParams) =>
    request<Paged<Event>>("GET", "/admin/cms/events", { token, params }),
  createEvent: (token: string, payload: Record<string, unknown> | FormData) =>
    request<Single<Event>>("POST", "/admin/cms/events", {
      token,
      body: payload,
    }),
  getEvent: (token: string, id: string) =>
    request<Single<Event>>("GET", `/admin/cms/events/${id}`, { token }),
  updateEvent: (
    token: string,
    id: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<Event>>("PUT", `/admin/cms/events/${id}`, {
      token,
      body: payload,
    }),
  updateEventStatus: (token: string, id: string, status: string) =>
    request<Single<Event>>("PATCH", `/admin/cms/events/${id}/status`, {
      token,
      body: { status },
    }),
  deleteEvent: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/events/${id}`, { token }),

  // ── Projects ─────────────────────────────────────────────────────────────
  listProjects: (token: string, params?: ListQueryParams) =>
    request<Paged<Project>>("GET", "/admin/cms/projects", { token, params }),
  createProject: (
    token: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<Project>>("POST", "/admin/cms/projects", {
      token,
      body: payload,
    }),
  getProject: (token: string, id: string) =>
    request<Single<Project>>("GET", `/admin/cms/projects/${id}`, { token }),
  updateProject: (
    token: string,
    id: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<Project>>("PUT", `/admin/cms/projects/${id}`, {
      token,
      body: payload,
    }),
  updateProjectStatus: (token: string, id: string, status: string) =>
    request<Single<Project>>("PATCH", `/admin/cms/projects/${id}/status`, {
      token,
      body: { status },
    }),
  deleteProject: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/projects/${id}`, { token }),

  // ── Departments ──────────────────────────────────────────────────────────
  listDepartments: (token: string, params?: ListQueryParams) =>
    request<Paged<Department>>("GET", "/admin/cms/departments", {
      token,
      params,
    }),
  createDepartment: (
    token: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<Department>>("POST", "/admin/cms/departments", {
      token,
      body: payload,
    }),
  getDepartment: (token: string, id: string) =>
    request<Single<Department>>("GET", `/admin/cms/departments/${id}`, {
      token,
    }),
  updateDepartment: (
    token: string,
    id: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<Department>>("PUT", `/admin/cms/departments/${id}`, {
      token,
      body: payload,
    }),
  updateDepartmentStatus: (token: string, id: string, status: string) =>
    request<Single<Department>>(
      "PATCH",
      `/admin/cms/departments/${id}/status`,
      { token, body: { status } }
    ),
  deleteDepartment: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/departments/${id}`, { token }),
  getDepartmentStaffByRole: (token: string, departmentId: string, role: string) =>
    request<Single<any>>(
      "GET",
      `/admin/cms/departments/${departmentId}/staff-by-role/${encodeURIComponent(role)}`,
      { token }
    ),
  getDepartmentServices: (token: string, departmentId: string) =>
    request<Single<any>>(
      "GET",
      `/admin/cms/departments/${departmentId}/services`,
      { token }
    ),
  getDepartmentProjects: (token: string, departmentId: string) =>
    request<Single<any>>(
      "GET",
      `/admin/cms/departments/${departmentId}/projects`,
      { token }
    ),
  getDepartmentTenders: (token: string, departmentId: string) =>
    request<Single<any>>(
      "GET",
      `/admin/cms/departments/${departmentId}/tenders`,
      { token }
    ),

  // ── Services ─────────────────────────────────────────────────────────────
  listServices: (token: string, params?: ListQueryParams) =>
    request<Paged<Service>>("GET", "/admin/cms/services", { token, params }),
  createService: (
    token: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<Service>>("POST", "/admin/cms/services", {
      token,
      body: payload,
    }),
  getService: (token: string, id: string) =>
    request<Single<Service>>("GET", `/admin/cms/services/${id}`, { token }),
  updateService: (
    token: string,
    id: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<Service>>("PUT", `/admin/cms/services/${id}`, {
      token,
      body: payload,
    }),
  updateServiceStatus: (token: string, id: string, status: string) =>
    request<Single<Service>>("PATCH", `/admin/cms/services/${id}/status`, {
      token,
      body: { status },
    }),
  deleteService: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/services/${id}`, { token }),

  // ── Sectors ──────────────────────────────────────────────────────────────
  listSectors: (token: string, params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/admin/cms/sectors", { token, params }),
  createSector: (
    token: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<any>>("POST", "/admin/cms/sectors", {
      token,
      body: payload,
    }),
  getSector: (token: string, id: string) =>
    request<Single<any>>("GET", `/admin/cms/sectors/${id}`, { token }),
  updateSector: (
    token: string,
    id: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<any>>("PUT", `/admin/cms/sectors/${id}`, {
      token,
      body: payload,
    }),
  updateSectorStatus: (token: string, id: string, status: string) =>
    request<Single<any>>("PATCH", `/admin/cms/sectors/${id}/status`, {
      token,
      body: { status },
    }),
  deleteSector: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/sectors/${id}`, { token }),

  // ── Announcements ────────────────────────────────────────────────────────
  listAnnouncements: (token: string, params?: ListQueryParams) =>
    request<Paged<Announcement>>("GET", "/admin/cms/announcements", {
      token,
      params,
    }),
  createAnnouncement: (token: string, payload: Record<string, unknown>) =>
    request<Single<Announcement>>("POST", "/admin/cms/announcements", {
      token,
      body: payload,
    }),
  getAnnouncement: (token: string, id: string) =>
    request<Single<Announcement>>("GET", `/admin/cms/announcements/${id}`, {
      token,
    }),
  updateAnnouncement: (
    token: string,
    id: string,
    payload: Record<string, unknown>
  ) =>
    request<Single<Announcement>>("PUT", `/admin/cms/announcements/${id}`, {
      token,
      body: payload,
    }),
  updateAnnouncementStatus: (token: string, id: string, status: string) =>
    request<Single<Announcement>>(
      "PATCH",
      `/admin/cms/announcements/${id}/status`,
      { token, body: { status } }
    ),
  deleteAnnouncement: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/announcements/${id}`, {
      token,
    }),

  // ── Tenders ──────────────────────────────────────────────────────────────
  listTenders: (token: string, params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/admin/cms/tenders", { token, params }),
  createTender: (
    token: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<any>>("POST", "/admin/cms/tenders", {
      token,
      body: payload,
    }),
  getTender: (token: string, id: string) =>
    request<Single<any>>("GET", `/admin/cms/tenders/${id}`, { token }),
  updateTender: (
    token: string,
    id: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<any>>("PUT", `/admin/cms/tenders/${id}`, {
      token,
      body: payload,
    }),
  updateTenderStatus: (token: string, id: string, status: string) =>
    request<Single<any>>("PATCH", `/admin/cms/tenders/${id}/status`, {
      token,
      body: { status },
    }),
  deleteTender: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/tenders/${id}`, { token }),

  // ── Settings ─────────────────────────────────────────────────────────────
  listSettings: (token: string, params?: ListQueryParams) =>
    request<Paged<Setting>>("GET", "/admin/cms/settings", { token, params }),
  createSetting: (token: string, payload: Record<string, unknown>) =>
    request<Single<Setting>>("POST", "/admin/cms/settings", {
      token,
      body: payload,
    }),
  getSetting: (token: string, id: string) =>
    request<Single<Setting>>("GET", `/admin/cms/settings/${id}`, { token }),
  updateSetting: (
    token: string,
    id: string,
    payload: Record<string, unknown>
  ) =>
    request<Single<Setting>>("PUT", `/admin/cms/settings/${id}`, {
      token,
      body: payload,
    }),
  deleteSetting: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/settings/${id}`, { token }),

  // ── Leadership profiles ──────────────────────────────────────────────────
  listLeadershipProfiles: (token: string, params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/admin/cms/leadership", { token, params }),
  createLeadershipProfile: (
    token: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<any>>("POST", "/admin/cms/leadership", {
      token,
      body: payload,
    }),
  getLeadershipProfile: (token: string, id: string) =>
    request<Single<any>>("GET", `/admin/cms/leadership/${id}`, { token }),
  updateLeadershipProfile: (
    token: string,
    id: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<any>>("PUT", `/admin/cms/leadership/${id}`, {
      token,
      body: payload,
    }),
  updateLeadershipProfileStatus: (token: string, id: string, status: string) =>
    request<Single<any>>("PATCH", `/admin/cms/leadership/${id}/status`, {
      token,
      body: { status },
    }),
  deleteLeadershipProfile: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/leadership/${id}`, { token }),

  // ── Tourism destinations ─────────────────────────────────────────────────
  listTourismDestinations: (token: string, params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/admin/cms/tourism-destinations", {
      token,
      params,
    }),
  createTourismDestination: (
    token: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<any>>("POST", "/admin/cms/tourism-destinations", {
      token,
      body: payload,
    }),
  getTourismDestination: (token: string, id: string) =>
    request<Single<any>>("GET", `/admin/cms/tourism-destinations/${id}`, {
      token,
    }),
  updateTourismDestination: (
    token: string,
    id: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<any>>("PUT", `/admin/cms/tourism-destinations/${id}`, {
      token,
      body: payload,
    }),
  deleteTourismDestination: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/tourism-destinations/${id}`, {
      token,
    }),

// ── Partners ─────────────────────────────────────────────────────────────

listPartners: (token: string, params?: ListQueryParams) =>
  request<Paged<any>>("GET", "/admin/cms/partners", { token, params }),

createPartner: (
  token: string,
  payload: Record<string, unknown> | FormData
) =>
  request<Single<any>>("POST", "/admin/cms/partners", {
    token,
    body: payload,
  }),

getPartner: (token: string, id: string) =>
  request<Single<any>>("GET", `/admin/cms/partners/${id}`, { token }),

updatePartner: (
  token: string,
  id: string,
  payload: Record<string, unknown> | FormData
) =>
  request<Single<any>>("PUT", `/admin/cms/partners/${id}`, {
    token,
    body: payload,
  }),

updatePartnerStatus: (
  token: string,
  id: string,
  status: string
) =>
  request<Single<any>>(
    "PATCH",
    `/admin/cms/partners/${id}/status`,
    {
      token,
      body: { status },
    }
  ),

deletePartner: (token: string, id: string) =>
  request<Single<any>>(
    "DELETE",
    `/admin/cms/partners/${id}`,
    { token }
  ),

// ── Partner Projects ─────────────────────────────────────────────────────

listPartnerProjects: (
  token: string,
  partnerId: string,
  params?: ListQueryParams
) =>
  request<Paged<any>>(
    "GET",
    `/admin/cms/partners/${partnerId}/projects`,
    { token, params }
  ),

createPartnerProject: (
  token: string,
  partnerId: string,
  payload: Record<string, unknown> | FormData
) =>
  request<Single<any>>(
    "POST",
    `/admin/cms/partners/${partnerId}/projects`,
    {
      token,
      body: payload,
    }
  ),

getPartnerProject: (
  token: string,
  partnerId: string,
  projectId: string
) =>
  request<Single<any>>(
    "GET",
    `/admin/cms/partners/${partnerId}/projects/${projectId}`,
    { token }
  ),

updatePartnerProject: (
  token: string,
  partnerId: string,
  projectId: string,
  payload: Record<string, unknown> | FormData
) =>
  request<Single<any>>(
    "PUT",
    `/admin/cms/partners/${partnerId}/projects/${projectId}`,
    {
      token,
      body: payload,
    }
  ),

deletePartnerProject: (
  token: string,
  partnerId: string,
  projectId: string
) =>
  request<Single<any>>(
    "DELETE",
    `/admin/cms/partners/${partnerId}/projects/${projectId}`,
    { token }
  ),

// ── Partner Milestones ──────────────────────────────────────────────────

listPartnerMilestones: (
  token: string,
  partnerId: string,
  params?: ListQueryParams
) =>
  request<Paged<any>>(
    "GET",
    `/admin/cms/partners/${partnerId}/milestones`,
    { token, params }
  ),

createPartnerMilestone: (
  token: string,
  partnerId: string,
  payload: Record<string, unknown> | FormData
) =>
  request<Single<any>>(
    "POST",
    `/admin/cms/partners/${partnerId}/milestones`,
    {
      token,
      body: payload,
    }
  ),

getPartnerMilestone: (
  token: string,
  partnerId: string,
  milestoneId: string
) =>
  request<Single<any>>(
    "GET",
    `/admin/cms/partners/${partnerId}/milestones/${milestoneId}`,
    { token }
  ),

updatePartnerMilestone: (
  token: string,
  partnerId: string,
  milestoneId: string,
  payload: Record<string, unknown> | FormData
) =>
  request<Single<any>>(
    "PUT",
    `/admin/cms/partners/${partnerId}/milestones/${milestoneId}`,
    {
      token,
      body: payload,
    }
  ),

deletePartnerMilestone: (
  token: string,
  partnerId: string,
  milestoneId: string
) =>
  request<Single<any>>(
    "DELETE",
    `/admin/cms/partners/${partnerId}/milestones/${milestoneId}`,
    { token }
  ),

// ── Partner Documents ───────────────────────────────────────────────────

listPartnerDocuments: (
  token: string,
  partnerId: string,
  params?: ListQueryParams
) =>
  request<Paged<any>>(
    "GET",
    `/admin/cms/partners/${partnerId}/documents`,
    { token, params }
  ),

createPartnerDocuments: (
  token: string,
  partnerId: string,
  payload: Record<string, unknown> | FormData
) =>
  request<Single<any>>(
    "POST",
    `/admin/cms/partners/${partnerId}/documents`,
    {
      token,
      body: payload,
    }
  ),

deletePartnerDocuments: (
  token: string,
  partnerId: string,
  payload: Record<string, unknown>
) =>
  request<Single<any>>(
    "DELETE",
    `/admin/cms/partners/${partnerId}/documents`,
    {
      token,
      body: payload,
    }
  ),

// ── Partner Contacts ────────────────────────────────────────────────────

listPartnerContacts: (
  token: string,
  partnerId: string,
  params?: ListQueryParams
) =>
  request<Paged<any>>(
    "GET",
    `/admin/cms/partners/${partnerId}/contacts`,
    { token, params }
  ),

createPartnerContact: (
  token: string,
  partnerId: string,
  payload: Record<string, unknown>
) =>
  request<Single<any>>(
    "POST",
    `/admin/cms/partners/${partnerId}/contacts`,
    {
      token,
      body: payload,
    }
  ),

deletePartnerContact: (
  token: string,
  partnerId: string,
  contactId: string
) =>
  request<Single<any>>(
    "DELETE",
    `/admin/cms/partners/${partnerId}/contacts/${contactId}`,
    { token }
  ),

  // ── Blog Posts ───────────────────────────────────────────────────────────
  listBlogPosts: (token: string, params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/admin/cms/blog-posts", { token, params }),
  createBlogPost: (
    token: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<any>>("POST", "/admin/cms/blog-posts", {
      token,
      body: payload,
    }),
  getBlogPost: (token: string, id: string) =>
    request<Single<any>>("GET", `/admin/cms/blog-posts/${id}`, { token }),
  updateBlogPost: (
    token: string,
    id: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<any>>("PUT", `/admin/cms/blog-posts/${id}`, {
      token,
      body: payload,
    }),
  updateBlogPostStatus: (token: string, id: string, status: string) =>
    request<Single<any>>("PATCH", `/admin/cms/blog-posts/${id}/status`, {
      token,
      body: { status },
    }),
  deleteBlogPost: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/blog-posts/${id}`, { token }),

  // ── FAQs ─────────────────────────────────────────────────────────────────
  listFaqs: (token: string, params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/admin/cms/faqs", { token, params }),
  createFaq: (token: string, payload: Record<string, unknown>) =>
    request<Single<any>>("POST", "/admin/cms/faqs", { token, body: payload }),
  getFaq: (token: string, id: string) =>
    request<Single<any>>("GET", `/admin/cms/faqs/${id}`, { token }),
  updateFaq: (token: string, id: string, payload: Record<string, unknown>) =>
    request<Single<any>>("PUT", `/admin/cms/faqs/${id}`, {
      token,
      body: payload,
    }),
  deleteFaq: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/faqs/${id}`, { token }),

  // ── Documents ────────────────────────────────────────────────────────────
  listDocuments: (token: string, params?: ListQueryParams) =>
    request<Paged<DocumentItem>>("GET", "/admin/cms/documents", {
      token,
      params,
    }),
  createDocument: (
    token: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<DocumentItem>>("POST", "/admin/cms/documents", {
      token,
      body: payload,
    }),
  getDocument: (token: string, id: string) =>
    request<Single<DocumentItem>>("GET", `/admin/cms/documents/${id}`, {
      token,
    }),
  updateDocument: (
    token: string,
    id: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<DocumentItem>>("PUT", `/admin/cms/documents/${id}`, {
      token,
      body: payload,
    }),
  updateDocumentStatus: (token: string, id: string, status: string) =>
    request<Single<DocumentItem>>(
      "PATCH",
      `/admin/cms/documents/${id}/status`,
      { token, body: { status } }
    ),
  deleteDocument: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/cms/documents/${id}`, { token }),

  // ── Organisation profile ─────────────────────────────────────────────────
  upsertProfile: (
    token: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<any>>("POST", "/admin/cms/profile", {
      token,
      body: payload,
    }),

  // ── Finance overview ─────────────────────────────────────────────────────
  getFinanceOverview: (token: string) =>
    request<Single<any>>("GET", "/admin/cms/finance-overview", { token }),

  upsertFinanceOverview: (token: string, payload: Record<string, unknown>) =>
    request<Single<any>>("POST", "/admin/cms/finance-overview", {
      token,
      body: payload,
    }),

  // ── Logs ─────────────────────────────────────────────────────────────────
  listLogs: (token: string, params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/system/logs", { token, params }),

  // ── Chat threads ─────────────────────────────────────────────────────────
  listChatThreads: (token: string, params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/admin/cms/chat/threads", { token, params }),
  createChatThread: (token: string, payload: Record<string, unknown>) =>
    request<Single<any>>("POST", "/admin/cms/chat/threads", {
      token,
      body: payload,
    }),
  getChatThread: (token: string, threadId: string) =>
    request<Single<any>>("GET", `/admin/cms/chat/threads/${threadId}`, {
      token,
    }),
  listChatMessages: (
    token: string,
    threadId: string,
    params?: ListQueryParams
  ) =>
    request<Paged<any>>(
      "GET",
      `/admin/cms/chat/threads/${threadId}/messages`,
      { token, params }
    ),
  sendChatMessage: (
    token: string,
    threadId: string,
    payload: Record<string, unknown>
  ) =>
    request<Single<any>>(
      "POST",
      `/admin/cms/chat/threads/${threadId}/messages`,
      { token, body: payload }
    ),
  markChatRead: (token: string, threadId: string) =>
    request<Single<any>>(
      "POST",
      `/admin/cms/chat/threads/${threadId}/read`,
      { token }
    ),
};

/* -------------------------------------------------------------------------- */
/* Admin staff                                                                */
/* -------------------------------------------------------------------------- */

export const adminStaff = {
  getDashboard: (token: string) =>
    request<Single<any>>("GET", "/admin/staff/dashboard", { token }),

  listStaff: (token: string, params?: ListQueryParams) =>
    request<Paged<Staff>>("GET", "/admin/staff/staff", { token, params }),

  createStaff: (token: string, payload: Record<string, unknown> | FormData) =>
    request<Single<Staff>>("POST", "/admin/staff/staff", {
      token,
      body: payload,
    }),

  getStaff: (token: string, id: string) =>
    request<Single<Staff>>("GET", `/admin/staff/staff/${id}`, { token }),

  updateStaff: (
    token: string,
    id: string,
    payload: Record<string, unknown> | FormData
  ) =>
    request<Single<Staff>>("PUT", `/admin/staff/staff/${id}`, {
      token,
      body: payload,
    }),

  updateStaffStatus: (token: string, id: string, status: string) =>
    request<Single<Staff>>("PATCH", `/admin/staff/staff/${id}/status`, {
      token,
      body: { status },
    }),

  deleteStaff: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/staff/staff/${id}`, { token }),

  listLogs: (token: string, params?: ListQueryParams) =>
    request<Paged<any>>("GET", "/admin/staff/logs", { token, params }),

  // ── Leave admin ──────────────────────────────────────────────────────────
  listLeaveApplications: (token: string, params?: ListQueryParams) =>
    request<Paged<LeaveApplication>>(
      "GET",
      "/admin/staff/leave-admin/applications",
      { token, params }
    ),

  getLeaveApplication: (token: string, applicationId: string) =>
    request<Single<LeaveApplication>>(
      "GET",
      `/admin/staff/leave-admin/applications/${applicationId}`,
      { token }
    ),

  approveLeaveApplication: (
    token: string,
    applicationId: string,
    payload: Record<string, unknown> = {}
  ) =>
    request<Single<LeaveApplication>>(
      "POST",
      `/admin/staff/leave-admin/applications/${applicationId}/approve`,
      { token, body: payload }
    ),

  rejectLeaveApplication: (
    token: string,
    applicationId: string,
    payload: Record<string, unknown> = {}
  ) =>
    request<Single<LeaveApplication>>(
      "POST",
      `/admin/staff/leave-admin/applications/${applicationId}/reject`,
      { token, body: payload }
    ),

  returnLeaveApplication: (
    token: string,
    applicationId: string,
    payload: Record<string, unknown> = {}
  ) =>
    request<Single<LeaveApplication>>(
      "POST",
      `/admin/staff/leave-admin/applications/${applicationId}/return`,
      { token, body: payload }
    ),

  previewLeaveDocument: (token: string, applicationId: string) =>
    request<any>(
      "GET",
      `/admin/staff/leave-admin/applications/${applicationId}/document/preview`,
      { token, headers: { Accept: "*/*" } }
    ),

  downloadLeaveDocument: (token: string, applicationId: string) =>
    request<any>(
      "GET",
      `/admin/staff/leave-admin/applications/${applicationId}/document/download`,
      { token, headers: { Accept: "*/*" } }
    ),

  listLeaveBalances: (token: string, params?: ListQueryParams) =>
    request<Paged<LeaveBalance>>(
      "GET",
      "/admin/staff/leave-admin/balances",
      { token, params }
    ),

  createLeaveType: (token: string, payload: Record<string, unknown>) =>
    request<Single<LeaveType>>("POST", "/admin/staff/leave-admin/types", {
      token,
      body: payload,
    }),

  updateLeaveType: (
    token: string,
    typeId: string,
    payload: Record<string, unknown>
  ) =>
    request<Single<LeaveType>>(
      "PUT",
      `/admin/staff/leave-admin/types/${typeId}`,
      { token, body: payload }
    ),

  deleteLeaveType: (token: string, typeId: string) =>
    request<Single<any>>(
      "DELETE",
      `/admin/staff/leave-admin/types/${typeId}`,
      { token }
    ),
};

/* -------------------------------------------------------------------------- */
/* Admin recruitment                                                          */
/* -------------------------------------------------------------------------- */

export const adminRecruitment = {
  listJobs: (token: string, params?: ListQueryParams) =>
    request<Paged<Job>>("GET", "/admin/recruitment/jobs", { token, params }),

  createJob: (token: string, payload: Record<string, unknown>) =>
    request<Single<Job>>("POST", "/admin/recruitment/jobs", {
      token,
      body: payload,
    }),

  getJob: (token: string, id: string) =>
    request<Single<Job>>("GET", `/admin/recruitment/jobs/${id}`, { token }),

  updateJob: (token: string, id: string, payload: Record<string, unknown>) =>
    request<Single<Job>>("PUT", `/admin/recruitment/jobs/${id}`, {
      token,
      body: payload,
    }),

  updateJobStatus: (token: string, id: string, status: string) =>
    request<Single<Job>>("PATCH", `/admin/recruitment/jobs/${id}/status`, {
      token,
      body: { status },
    }),

  deleteJob: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/recruitment/jobs/${id}`, { token }),

  listApplications: (token: string, params?: ListQueryParams) =>
    request<Paged<JobApplication>>(
      "GET",
      "/admin/recruitment/applications",
      { token, params }
    ),

  createApplication: (token: string, payload: Record<string, unknown>) =>
    request<Single<JobApplication>>(
      "POST",
      "/admin/recruitment/applications",
      { token, body: payload }
    ),

  getApplication: (token: string, id: string) =>
    request<Single<JobApplication>>(
      "GET",
      `/admin/recruitment/applications/${id}`,
      { token }
    ),

  updateApplication: (
    token: string,
    id: string,
    payload: Record<string, unknown>
  ) =>
    request<Single<JobApplication>>(
      "PUT",
      `/admin/recruitment/applications/${id}`,
      { token, body: payload }
    ),

  updateApplicationStatus: (token: string, id: string, status: string) =>
    request<Single<JobApplication>>(
      "PATCH",
      `/admin/recruitment/applications/${id}/status`,
      { token, body: { status } }
    ),

  deleteApplication: (token: string, id: string) =>
    request<Single<any>>("DELETE", `/admin/recruitment/applications/${id}`, {
      token,
    }),
};

/* -------------------------------------------------------------------------- */
/* Reports                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The reports endpoint returns a raw HTML string (text/html), NOT a JSON
 * envelope. The return type is therefore `string` rather than Single<any>.
 * parseResponseBody already returns it as a raw string when the Content-Type
 * is not application/json, so callers receive the HTML directly.
 */
export const reportsApi = {
  /**
   * Fetch an HTML report by type slug.
   * Returns the raw HTML string — pass it directly to an iframe's srcDoc.
   */
  getReport: (token: string, type: string, params?: ListQueryParams) =>
    request<string>("GET", `/admin/reports/${type}`, {
      token,
      params,
      headers: { Accept: "text/html, application/json" },
    }),
};

export const systemApi = {
  // --------------------------------------------------
  // CACHE
  // --------------------------------------------------

  getCache: (token: string) =>
    request("GET", "/system/cache", { token }),

  clearCache: (token: string) =>
    request("POST", "/system/cache/clear", { token }),

  clearManyCache: (
    token: string,
    keys: string[]
  ) =>
    request("POST", "/system/cache/clear-many", {
      token,
      body: { keys },
    }),

  clearCacheTag: (
    token: string,
    tag: string
  ) =>
    request("POST", `/system/cache/clear/${tag}`, {
      token,
    }),

  // --------------------------------------------------
  // LOGS
  // --------------------------------------------------

  getLogs: (
    token: string,
    params?: ListQueryParams
  ) =>
    request("GET", "/system/logs", {
      token,
      params,
    }),

  // --------------------------------------------------
  // PERMISSIONS
  // --------------------------------------------------

  getPermissions: (
    token: string,
    params?: ListQueryParams
  ) =>
    request("GET", "/system/permissions", {
      token,
      params,
    }),

  createPermission: (
    token: string,
    data: any
  ) =>
    request("POST", "/system/permissions", {
      token,
      body: data,
    }),

  updatePermission: (
    token: string,
    permission: string,
    data: any
  ) =>
    request(
      "PATCH",
      `/system/permissions/${permission}`,
      {
        token,
        body: data
      }
    ),

  deletePermission: (
    token: string,
    permission: string
  ) =>
    request(
      "DELETE",
      `/system/permissions/${permission}`,
      { token }
    ),

  deletePermissionsByPrefix: (
    token: string,
    prefix: string
  ) =>
    request(
      "DELETE",
      "/system/permissions/by-prefix",
      {
        token,
        body: { prefix },
      }
    ),

  // --------------------------------------------------
  // ROLE PERMISSIONS
  // --------------------------------------------------

  getRolePermissions: (
    token: string,
    role: string
  ) =>
    request(
      "GET",
      `/system/roles/${role}/permissions`,
      { token }
    ),

  grantRolePermissions: (
    token: string,
    role: string,
    permissions: string[]
  ) =>
    request(
      "POST",
      `/system/roles/${role}/permissions`,
      {
        token,
        body: { permissions },
      }
    ),

  syncRolePermissions: (
    token: string,
    role: string,
    permissions: string[]
  ) =>
    request(
      "PUT",
      `/system/roles/${role}/permissions`,
      {
        token,
        body: { permissions },
      }
    ),

  revokeRolePermission: (
    token: string,
    role: string,
    permission: string
  ) =>
    request(
      "DELETE",
      `/system/roles/${role}/permissions/${permission}`,
      { token }
    ),

   listRoles: (
    token: string,
  ) =>
    request(
      "GET",
      `/admin/roles`,
      { token }
    ),

      // --------------------------------------------------
  // ADMIN PERMISSIONS (Direct user-level permissions)
  // --------------------------------------------------

  /**
   * List admin users eligible for permission management.
   * Returns users with roles: hr_super_admin, psb_super_admin, cms_super_admin, county_admin
   */
  listAdminUsers: (
    token: string,
    params?: ListQueryParams
  ) =>
    request<Paged<User>>("GET", "/system/admins", {
      token,
      params,
    }),

  /**
   * Get direct (explicitly assigned) permissions for a specific admin user.
   * Does NOT include role-inherited permissions.
   */
  getAdminDirectPermissions: (
    token: string,
    userId: string
  ) =>
    request<Single<Permission[]>>("GET", `/system/admins/${userId}/permissions`, {
      token,
    }),

  /**
   * Get effective permissions for a target admin (role-inherited + direct).
   * Useful for auditing full access before delegation.
   */
  getAdminEffectivePermissions: (
    token: string,
    userId: string
  ) =>
    request<Single<Permission[]>>("GET", `/system/admins/${userId}/permissions/effective`, {
      token,
    }),

  /**
   * Grant one or more direct permissions to an admin user.
   * Already-assigned permissions are silently skipped.
   * @param permissions - Array of permission names (e.g. ["cms.access.gallery", "staff.manage"])
   */
  grantAdminPermissions: (
    token: string,
    userId: string,
    permissions: string[]
  ) =>
    request<Single<User>>("POST", `/system/admins/${userId}/permissions`, {
      token,
      body: { permissions },
    }),

  /**
   * Revoke one or more direct permissions from an admin user.
   * @param permissions - Array of permission names to remove
   */
  revokeAdminPermissions: (
    token: string,
    userId: string,
    permissions: string[]
  ) =>
    request<Single<User>>("DELETE", `/system/admins/${userId}/permissions`, {
      token,
      body: { permissions },
    }),

  /**
   * Remove ALL direct permissions from an admin user.
   * Role-inherited permissions remain untouched.
   */
  removeAllAdminPermissions: (
    token: string,
    userId: string
  ) =>
    request<Single<User>>("DELETE", `/system/admins/${userId}/permissions/all`, {
      token,
    }),

  // --------------------------------------------------
  // ANALYTICS
  // All analytics routes require system.management.analytics permission.
  // Results are cached server-side for 5 minutes.
  // --------------------------------------------------

  /** High-level KPI summary with period-over-period deltas. */
  getAnalyticsOverview: (token: string, params?: AnalyticsPeriodParams & ListQueryParams) =>
    request<Single<any>>("GET", "/system/analytics/overview", { token, params }),

  /** Module access rankings — which modules users visit most. */
  getAnalyticsModules: (token: string, params?: AnalyticsPeriodParams & ListQueryParams) =>
    request<Single<any>>("GET", "/system/analytics/modules", { token, params }),

  /** Action frequency breakdown — what operations are performed most. */
  getAnalyticsActions: (token: string, params?: AnalyticsPeriodParams & ListQueryParams) =>
    request<Single<any>>("GET", "/system/analytics/actions", { token, params }),

  /** Event volume timeline (auto-granularity: hourly/daily/weekly). */
  getAnalyticsTimeline: (token: string, params?: AnalyticsPeriodParams & ListQueryParams) =>
    request<Single<any>>("GET", "/system/analytics/timeline", { token, params }),

  /** Most active users list. */
  getAnalyticsUsers: (token: string, params?: AnalyticsPeriodParams & ListQueryParams) =>
    request<Single<any>>("GET", "/system/analytics/users", { token, params }),

  /** Single user drill-down (not cached server-side). */
  getAnalyticsUserDetail: (token: string, userId: string, params?: AnalyticsPeriodParams) =>
    request<Single<any>>("GET", `/system/analytics/users/${userId}`, { token, params }),

  /** Error/failure analysis. */
  getAnalyticsErrors: (token: string, params?: AnalyticsPeriodParams & ListQueryParams) =>
    request<Single<any>>("GET", "/system/analytics/errors", { token, params }),

  /** 7×24 activity heatmap. */
  getAnalyticsHeatmap: (token: string, params?: AnalyticsPeriodParams & ListQueryParams) =>
    request<Single<any>>("GET", "/system/analytics/heatmap", { token, params }),
};
/* -------------------------------------------------------------------------- */
/* Barrel export                                                              */
/* -------------------------------------------------------------------------- */

export const api = {
  publicAuth,
  publicCms,
  contentApi,
  publicRecruitment,
  staffAuth,
  staffSelf,
  adminCore,
  adminCms,
  adminStaff,
  adminRecruitment,
  reportsApi,
  systemApi,
};