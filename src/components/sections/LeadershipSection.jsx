import { useState, useEffect } from 'react';
import { content } from '../../api';

export default function LeadershipSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await content.leadership.list({ page: 1, per_page: 20 });
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
        <h2 className="section-title">Leadership</h2>
        {loading && <div className="loading"><div className="spinner-ring"></div><p className="loading-text">Loading leadership...</p></div>}
        {error && <div className="error-msg">{error}</div>}
        {!loading && items.length === 0 && <div className="empty"><div className="empty-icon">👔</div><div className="empty-text">No leadership profiles found</div></div>}
        {!loading && items.length > 0 && (
          <div className="grid grid-3">
            {items.map((leader) => (
              <div key={leader.id} className="leader-card">
                <div className="leader-img" style={{ background: leader.image ? 'none' : 'linear-gradient(135deg, var(--deep), var(--ocean))' }}>
                  {leader.image ? (
                    <img src={leader.image} alt={leader.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '32px' }}>👤</span>
                  )}
                </div>
                <div className="leader-body">
                  <h3 className="leader-name">{leader.name}</h3>
                  {leader.role && <div className="leader-role">{leader.role}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
