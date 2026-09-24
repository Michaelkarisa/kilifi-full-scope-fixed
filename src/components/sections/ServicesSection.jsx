import { useState, useEffect } from 'react';
import { content } from '../../api';

export default function ServicesSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await content.services.list({ page: 1, per_page: 12 });
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
        <h2 className="section-title">Services</h2>
        {loading && <div className="loading"><div className="spinner-ring"></div><p className="loading-text">Loading services...</p></div>}
        {error && <div className="error-msg">{error}</div>}
        {!loading && items.length === 0 && <div className="empty"><div className="empty-icon">🔧</div><div className="empty-text">No services available</div></div>}
        {!loading && items.length > 0 && (
          <div className="grid grid-3">
            {items.map((service) => (
              <div key={service.id} className="service-card">
                <div className="service-icon">{service.icon || '⚙️'}</div>
                <h3 className="service-name">{service.title}</h3>
                <p className="service-desc">{service.short_desc || service.desc || 'No description'}</p>
                {service.apply_link && (
                  <a href={service.apply_link} target="_blank" rel="noopener noreferrer" style={{ marginTop: '12px', display: 'inline-block', fontSize: '12px', color: 'var(--sky)', fontWeight: '500', textDecoration: 'none' }}>
                    Apply Now →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
