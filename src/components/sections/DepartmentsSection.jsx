import { useState, useEffect } from 'react';
import { content } from '../../api';

export default function DepartmentsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await content.departments.list({ page: 1, per_page: 20 });
        setItems(res.data?.data || res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="page">
      <section className="section active">
        <h2 className="section-title">Departments</h2>
        {loading && <div className="loading"><div className="spinner-ring"></div><p className="loading-text">Loading departments...</p></div>}
        {error && <div className="error-msg">{error}</div>}
        {!loading && items.length === 0 && <div className="empty"><div className="empty-icon">🏛️</div><div className="empty-text">No departments found</div></div>}
        {!loading && items.length > 0 && (
          <div className="grid grid-2">
            {items.map((dept) => (
              <div key={dept.id} className="dept-card">
                <div className="dept-icon">{dept.icon || '🏢'}</div>
                <div>
                  <h3 className="dept-name">{dept.title}</h3>
                  <p className="dept-desc">{dept.desc || dept.focus || 'No description available'}</p>
                  {dept.governor && <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>Head: {dept.governor}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
