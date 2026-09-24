import { useState, useEffect } from 'react';
import { content } from '../../api';

export default function TendersSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const res = await content.tenders.list({ page: 1, per_page: 20 });
        setItems(res.data?.data || res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load tenders');
      } finally {
        setLoading(false);
      }
    };

    fetchTenders();
  }, []);

  return (
    <div className="page">
      <section className="section active">
        <h2 className="section-title">Tenders</h2>

        {loading && (
          <div className="loading">
            <div className="spinner-ring"></div>
            <p className="loading-text">Loading tenders...</p>
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        {!loading && items.length === 0 && (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <div className="empty-text">No tenders available</div>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid" style={{ gap: '20px' }}>
            {items.map((tender) => (
              <div key={tender.id} className="tender-card">
                {tender.tender_code && (
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '10px',
                      color: 'var(--gold)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tender.tender_code}
                  </div>
                )}

                <h3 className="tender-title">{tender.title}</h3>

                {tender.department && (
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'var(--sky)',
                      marginBottom: '8px',
                      fontWeight: '500',
                    }}
                  >
                    {tender.department}
                  </div>
                )}

                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text3)',
                    marginBottom: '12px',
                  }}
                >
                  Category: {tender.category || 'General'}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text3)',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border)',
                    marginBottom: '12px',
                  }}
                >
                  Closes:{' '}
                  {tender.closing_date
                    ? new Date(tender.closing_date).toLocaleDateString()
                    : 'N/A'}
                </div>

                {tender.url_path||tender.url && (
                  <a
                    href={tender.url_path||tender.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    style={{
                      display: 'inline-block',
                      padding: '8px 12px',
                      fontSize: '12px',
                      background: 'var(--gold)',
                      color: '#000',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontWeight: '600',
                    }}
                  >
                    Download Tender
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