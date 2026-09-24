import { useState, useEffect } from 'react';
import * as apis from '../../apis';

/**
 * Documents Section - consumes content.documents APIs
 */
export default function DocumentsSection() {
  const [documents, setDocuments] = useState([]);
  const [filters, setFilters] = useState({ year: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await apis.publicCms.listDocuments({
          page,
          per_page: 20,
          ...filters,
        });
        setDocuments(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [page, filters]);

  return (
    <section className="section-container">
      <h1>Documents & Resources</h1>
      <p className="section-description">Access official documents, policies, and publications</p>

      <div className="filters-container">
        <input
          type="number"
          placeholder="Filter by year"
          value={filters.year}
          onChange={(e) => setFilters({ ...filters, year: e.target.value })}
        />
        <input
          type="text"
          placeholder="Filter by category"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        />
      </div>

      {loading && <div>Loading documents...</div>}
      {error && <div className="error">Error: {error}</div>}

      {!loading && !error && documents.length === 0 && <div>No documents found</div>}

      {!loading && !error && documents.length > 0 && (
        <>
          <div className="documents-list">
            {documents.map((doc) => (
              <div key={doc.id} className="document-item">
                <div className="document-header">
                  <h3>{doc.title}</h3>
                  <span className="doc-type">{doc.type}</span>
                </div>
                <p className="description">{doc.description}</p>
                <div className="doc-meta">
                  <span className="category">{doc.category}</span>
                  <span className="year">{doc.year}</span>
                  <span className="code">{doc.code}</span>
                </div>
                {doc.url_path && (
                  <a href={doc.url_path} target="_blank" rel="noopener noreferrer" className="download-button">
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="pagination">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </>
      )}
    </section>
  );
}
