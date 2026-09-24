import {  } from 'react';
import { G, ADMIN_ROLES, Card } from './shared';

function AccessGuard({
  children,
  can,
  requires = [],
  requireAdmin = false,
  role,
}) {
  const isAdmin = ADMIN_ROLES.has(role);

  const adminOk = !requireAdmin || isAdmin;

  // Admin bypass: admins automatically pass permission checks
  const permsOk =
    isAdmin || requires.every((p) => can(p));

  const allowed = adminOk && permsOk;

  if (!allowed) {
    const missing = requires.filter((p) => !can(p));

    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: G.text,
              marginBottom: 8,
            }}
          >
            Access denied
          </div>

          <div
            style={{
              fontSize: 14,
              color: G.textMuted,
              maxWidth: 360,
              margin: '0 auto',
            }}
          >
            You don’t have permission to view this section.
            {missing.length > 0 && (
              <span>
                {" "}
                Missing:{" "}
                <code
                  style={{
                    fontSize: 12,
                    background: G.surfaceAlt,
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {missing.join(", ")}
                </code>
              </span>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return children;
}

export default AccessGuard;
