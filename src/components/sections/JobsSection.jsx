import { useState, useEffect } from 'react';
import { content } from '../../api';

export default function JobsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await content.jobs.list({ page: 1, per_page: 20 });
        setItems(res.data?.data || res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const getBadgeClass = (type) => {
    const typeMap = { 'job': 'badge-open', 'attachment': 'badge-attachment', 'internship': 'badge-internship' };
    return typeMap[type] || 'badge-open';
  };

  return (
    <div className="page">
      <section className="section active">
        <h2 className="section-title">Job Opportunities</h2>
        {loading && <div className="loading"><div className="spinner-ring"></div><p className="loading-text">Loading jobs...</p></div>}
        {error && <div className="error-msg">{error}</div>}
        {!loading && items.length === 0 && <div className="empty"><div className="empty-icon">💼</div><div className="empty-text">No jobs available</div></div>}
        {!loading && items.length > 0 && (
          <div className="grid" style={{ gap: '20px' }}>
            {items.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-card-top">
                  <h3 className="job-title">{job.title}</h3>
                  <span className={`job-badge ${getBadgeClass(job.recruitment_type)}`}>
                    {job.recruitment_type?.toUpperCase() || 'JOB'}
                  </span>
                </div>
                {job.dept && <div className="job-dept">{job.dept}</div>}
                <div className="job-info">
                  {job.employment_type && <div className="job-chip">{job.employment_type}</div>}
                  {job.category && <div className="job-chip">{job.category}</div>}
                </div>
                <div className="job-footer">
                  <div className="job-deadline" style={{ color: job.closing_date && new Date(job.closing_date) < new Date() ? 'var(--coral)' : 'var(--text3)' }}>
                    Closes: {job.closing_date ? new Date(job.closing_date).toLocaleDateString() : 'N/A'}
                  </div>
                  <button className="btn-apply">Apply Now</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
