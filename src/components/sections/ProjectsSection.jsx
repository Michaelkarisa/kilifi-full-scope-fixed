import { useState, useEffect } from 'react';
import { content } from '../../api';

export default function ProjectsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await content.projects.list({ page: 1, per_page: 12 });
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
        <h2 className="section-title">Development Projects</h2>
        {loading && <div className="loading"><div className="spinner-ring"></div><p className="loading-text">Loading projects...</p></div>}
        {error && <div className="error-msg">{error}</div>}
        {!loading && items.length === 0 && <div className="empty"><div className="empty-icon">🏗️</div><div className="empty-text">No projects found</div></div>}
        {!loading && items.length > 0 && (
          <div className="grid grid-2">
            {items.map((project, idx) => (
              <div key={project.id} className="project-card">
                <div className="project-header">
                  <div className="project-num">{idx + 1}</div>
                </div>
                <div className="project-body">
                  <div style={{ fontSize: '11px', color: 'var(--sky)', fontWeight: '500', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.5px', fontFamily: 'var(--mono)' }}>
                    {project.category || project.location || 'Project'}
                  </div>
                  <h3 className="project-title">{project.title}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: '1.5', marginBottom: '12px' }}>
                    {project.desc?.substring(0, 100) || 'No description'}
                  </p>
                  {project.progress !== null && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>Progress: {project.progress}%</div>
                      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${project.progress}%`, background: 'var(--green)', transition: 'width 0.3s' }}></div>
                      </div>
                    </div>
                  )}
                  {project.status && <span style={{ fontSize: '10px', background: 'rgba(26, 122, 74, .1)', color: 'var(--green)', padding: '2px 8px', borderRadius: '4px' }}>{project.status}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
