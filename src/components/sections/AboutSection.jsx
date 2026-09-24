import { useState, useEffect } from 'react';
import { admin, content } from '../../api';

export default function AboutSection() {
  const [orgProfile, setOrgProfile] = useState(null);
  const [financeData, setFinanceData] = useState(null);
  const [blog, setBlog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [orgRes, finRes, blogRes] = await Promise.all([
          admin.organisation.profile().catch(() => null),
          admin.finance.overview().catch(() => null),
          content.blog.list({ page: 1, per_page: 6 }).catch(() => null),
        ]);

        if (orgRes?.data) setOrgProfile(orgRes.data);
        if (finRes?.data) setFinanceData(finRes.data);
        if (blogRes?.data) setBlog(blogRes.data || []);
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
        <h2 className="section-title">About Kilifi County</h2>

        {loading && <div className="loading"><div className="spinner-ring"></div><p className="loading-text">Loading information...</p></div>}
        {error && <div className="error-msg">{error}</div>}

        {!loading && orgProfile && (
          <div style={{ marginBottom: '48px' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: '20px', fontWeight: '600', color: 'var(--deep)', marginBottom: '16px' }}>
              Mission & Vision
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {orgProfile.mission && (
                <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--ocean)' }}>Our Mission</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text3)', lineHeight: '1.6' }}>{orgProfile.mission}</p>
                </div>
              )}
              {orgProfile.vision && (
                <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--ocean)' }}>Our Vision</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text3)', lineHeight: '1.6' }}>{orgProfile.vision}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && financeData && (
          <div style={{ marginBottom: '48px' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: '20px', fontWeight: '600', color: 'var(--deep)', marginBottom: '16px' }}>
              Finance Overview
            </h3>
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '24px' }}>
                {financeData.total_budget && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px', fontWeight: '500' }}>Total Budget</div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: '24px', fontWeight: '700', color: 'var(--ocean)' }}>
                      {financeData.total_budget}
                    </div>
                  </div>
                )}
                {financeData.allocated && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px', fontWeight: '500' }}>Allocated</div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: '24px', fontWeight: '700', color: 'var(--ocean)' }}>
                      {financeData.allocated}
                    </div>
                  </div>
                )}
                {financeData.spent && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px', fontWeight: '500' }}>Spent</div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: '24px', fontWeight: '700', color: 'var(--coral)' }}>
                      {financeData.spent}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && blog.length > 0 && (
          <div>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: '20px', fontWeight: '600', color: 'var(--deep)', marginBottom: '16px' }}>
              Latest Blog Posts
            </h3>
            <div className="grid grid-3">
              {blog.map((post) => (
                <div key={post.id} className="card">
                  <div className="card-img" style={{ background: 'linear-gradient(135deg, var(--deep), var(--ocean))' }}>
                    {post.image ? <img src={post.image} alt={post.title} /> : <span>📝</span>}
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">{post.title}</h3>
                    <p className="card-excerpt">{post.excerpt?.substring(0, 80) || 'No description'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
