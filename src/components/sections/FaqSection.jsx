import { useState, useEffect } from 'react';
import * as apis from '../../apis';

/**
 * FAQ Section - consumes content.faqs APIs
 */
export default function FaqSection() {
  const [faqs, setFaqs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        const response = await apis.publicCms.listFaqs({
          per_page: 100,
          search: filter,
        });
        setFaqs(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, [filter]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="section-container">
      <h1>Frequently Asked Questions</h1>
      <p className="section-description">Find answers to common questions about Kilifi County services</p>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search FAQs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="search-input"
        />
      </div>

      {loading && <div>Loading FAQs...</div>}
      {error && <div className="error">Error: {error}</div>}

      {!loading && !error && faqs.length === 0 && <div>No FAQs found</div>}

      {!loading && !error && faqs.length > 0 && (
        <div className="faq-list">
          {faqs.map((faq) => (
            <div key={faq.id} className={`faq-item ${expandedId === faq.id ? 'expanded' : ''}`}>
              <button
                className="faq-question"
                onClick={() => toggleExpand(faq.id)}
              >
                <span>{faq.question}</span>
                <span className="toggle-icon">{expandedId === faq.id ? '−' : '+'}</span>
              </button>
              {expandedId === faq.id && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                  {faq.category && <span className="category-badge">{faq.category}</span>}
                  {faq.department && faq.department.name && (
                    <span className="department-badge">{faq.department.name}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
