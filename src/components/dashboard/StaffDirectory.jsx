import { useEffect, useMemo, useState } from 'react';
import { admin, staff } from '../../api';

export default function StaffDirectory({ user }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 50,
    total: 0,
    last_page: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getDepartment = (item) =>
    item?.dept ||
    item?.department ||
    item?.department_name ||
    item?.department_title ||
    item?.office ||
    '—';

  const getRole = (item) =>
    item?.role ||
    item?.designation ||
    item?.title ||
    item?.position ||
    item?.job_title ||
    '—';

  const getEmail = (item) =>
    item?.email ||
    item?.work_email ||
    item?.personal_email ||
    item?.user?.email ||
    '—';

  const getStatus = (item) => (item?.status || 'active').toLowerCase();

  const getImageUrl = (image) => {
    if (!image) return null;
    if (typeof image !== 'string') return null;
    if (image.startsWith('http://') || image.startsWith('https://')) return image;

    const baseMediaUrl =
      import.meta.env.VITE_MEDIA_URL ||
      import.meta.env.VITE_API_MEDIA_URL ||
      'https://api.klfcounty.org/storage';

    if (image.startsWith('/')) {
      return `${baseMediaUrl}${image}`;
    }

    return `${baseMediaUrl}/${image}`;
  };

 useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
  const token = user?.token || user?.access_token ||
    (typeof localStorage !== 'undefined' &&
      (localStorage.getItem('auth_token') || localStorage.getItem('admin_token') || localStorage.getItem('token'))) ||
    '';
        const res = await admin.staff.listStaff(token,{ page: 1, per_page: 50 });
        const rows = res?.data || [];
        const meta = res?.meta || {};

        setItems(rows);
        setPagination({
          current_page: Number(meta.current_page || 1),
          per_page:     Number(meta.per_page || 50),
          total:        Number(meta.total || rows.length),
          last_page:    Number(meta.last_page || 1),
        });
      } catch (err) {
        console.error('Failed to load staff:', err);
        setError(err?.message || 'Failed to load staff');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((item) => getStatus(item) === 'active').length;
    const inactive = total - active;

    const departments = new Set(
      items
        .map((item) => getDepartment(item))
        .filter((value) => value && value !== '—')
    ).size;

    return { total, active, inactive, departments };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      const department = getDepartment(item);
      const role = getRole(item);
      const email = getEmail(item);
      const status = getStatus(item);

      const matchesQuery =
        !q ||
        String(item?.name || '')
          .toLowerCase()
          .includes(q) ||
        String(item?.staff_code || '')
          .toLowerCase()
          .includes(q) ||
        String(item?.pr_number || '')
          .toLowerCase()
          .includes(q) ||
        String(department).toLowerCase().includes(q) ||
        String(role).toLowerCase().includes(q) ||
        String(email).toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [items, query, statusFilter]);

  const getInitials = (name) => {
    if (!name) return 'ST';

    return String(name)
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  };

  const getStatusStyle = (status) => {
    const normalized = (status || 'active').toLowerCase();
    const isActive = normalized === 'active';

    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontFamily: 'var(--mono)',
      fontSize: '11px',
      padding: '5px 10px',
      borderRadius: '999px',
      textTransform: 'capitalize',
      background: isActive ? 'rgba(26,122,74,.10)' : 'rgba(192,57,43,.10)',
      color: isActive ? 'var(--green)' : 'var(--coral)',
      border: isActive
        ? '1px solid rgba(26,122,74,.20)'
        : '1px solid rgba(192,57,43,.20)',
      whiteSpace: 'nowrap',
    };
  };

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.04), rgba(37,99,235,0.05))',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '22px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--display)',
                fontSize: '28px',
                fontWeight: '800',
                color: 'var(--deep)',
                margin: '0 0 8px',
                lineHeight: 1.1,
              }}
            >
              Staff Directory
            </h2>

            <p
              style={{
                fontSize: '14px',
                color: 'var(--text3)',
                margin: 0,
                maxWidth: '680px',
              }}
            >
              Browse staff records, departments, roles, and account status from one place.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '8px',
              justifyItems: 'end',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text3)',
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid var(--border)',
                borderRadius: '999px',
                padding: '8px 12px',
              }}
            >
              {filteredItems.length} visible
            </div>

            <div
              style={{
                fontSize: '12px',
                color: 'var(--text3)',
              }}
            >
              Page {pagination.current_page} of {pagination.last_page}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '14px',
            marginTop: '18px',
          }}
        >
          <StatCard label="Loaded Staff" value={stats.total} />
          <StatCard label="Active" value={stats.active} />
          <StatCard label="Inactive" value={stats.inactive} />
          <StatCard label="Departments" value={stats.departments} />
        </div>
      </div>

      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          boxShadow: 'var(--shadow)',
          padding: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: '1 1 280px', minWidth: '220px' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, code, PR number, department, role, or email"
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                padding: '0 14px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: '44px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--white)',
              padding: '0 14px',
              fontSize: '14px',
              minWidth: '160px',
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
      </div>

      {error && (
        <div
          className="error-msg"
          style={{
            background: 'rgba(192,57,43,.08)',
            color: 'var(--coral)',
            border: '1px solid rgba(192,57,43,.18)',
            borderRadius: '14px',
            padding: '14px 16px',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: '18px',
            boxShadow: 'var(--shadow)',
            padding: '42px 24px',
            textAlign: 'center',
          }}
        >
          <div className="loading">
            <div className="spinner-ring"></div>
            <p className="loading-text" style={{ marginTop: '12px' }}>
              Loading staff directory...
            </p>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: '18px',
            boxShadow: 'var(--shadow)',
            padding: '42px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>👥</div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: 'var(--deep)',
              marginBottom: '6px',
            }}
          >
            No staff found
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text3)' }}>
            Try adjusting your search or filter.
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--white)',
            borderRadius: '18px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              maxHeight: '68vh',
              overflowY: 'auto',
              overflowX: 'auto',
            }}
          >
            <table
              className="admin-table"
              style={{
                width: '100%',
                minWidth: '1080px',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'rgba(15,23,42,0.03)',
                  }}
                >
                  <th style={stickyThStyle}>Staff</th>
                  <th style={stickyThStyle}>Staff Code</th>
                  <th style={stickyThStyle}>PR Number</th>
                  <th style={stickyThStyle}>Department</th>
                  <th style={stickyThStyle}>Role</th>
                  <th style={stickyThStyle}>Email</th>
                  <th style={stickyThStyle}>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((s, index) => {
                  const department = getDepartment(s);
                  const role = getRole(s);
                  const email = getEmail(s);
                  const status = getStatus(s);
                  const imageUrl = getImageUrl(s?.image);

                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderTop: index === 0 ? 'none' : '1px solid var(--border)',
                      }}
                    >
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={s.name || 'Staff'}
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1px solid rgba(37,99,235,0.12)',
                                flexShrink: 0,
                                background: 'rgba(15,23,42,0.04)',
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                display: 'grid',
                                placeItems: 'center',
                                fontSize: '12px',
                                fontWeight: '800',
                                color: 'var(--deep)',
                                background:
                                  'linear-gradient(135deg, rgba(37,99,235,0.14), rgba(14,165,233,0.12))',
                                border: '1px solid rgba(37,99,235,0.12)',
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(s.name)}
                            </div>
                          )}

                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: '700',
                                color: 'var(--deep)',
                                fontSize: '14px',
                              }}
                            >
                              {s.name || '—'}
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                color: 'var(--text3)',
                                marginTop: '3px',
                              }}
                            >
                              ID: {s.id || '—'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <code
                          style={{
                            fontFamily: 'var(--mono)',
                            fontSize: '11px',
                            background: 'rgba(15,23,42,0.04)',
                            padding: '6px 8px',
                            borderRadius: '8px',
                          }}
                        >
                          {s.staff_code || '—'}
                        </code>
                      </td>

                      <td style={tdStyle}>{s.pr_number || '—'}</td>
                      <td style={tdStyle}>{department}</td>
                      <td style={tdStyle}>{role}</td>

                      <td style={{ ...tdStyle, fontSize: '13px', color: 'var(--text3)' }}>
                        {email}
                      </td>

                      <td style={tdStyle}>
                        <span style={getStatusStyle(status)}>
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background:
                                status === 'active' ? 'var(--green)' : 'var(--coral)',
                            }}
                          />
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.88)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '16px',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          color: 'var(--text3)',
          marginBottom: '8px',
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: '24px',
          fontWeight: '800',
          color: 'var(--deep)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

const stickyThStyle = {
  textAlign: 'left',
  padding: '16px 18px',
  fontSize: '12px',
  fontWeight: '800',
  color: 'var(--text3)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  zIndex: 5,
  background: 'rgba(248,250,252,0.98)',
  backdropFilter: 'blur(4px)',
  borderBottom: '1px solid var(--border)',
};

const tdStyle = {
  padding: '16px 18px',
  fontSize: '14px',
  color: 'var(--text2)',
  verticalAlign: 'middle',
};