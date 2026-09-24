import { useState, useEffect } from 'react';
import { content } from '../../api';
import CardGrid from '../CardGrid';

export default function NewsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await content.news.list({ page: 1, per_page: 12 });
        const newsItems = response.data?.data || response.data || [];
        setItems(Array.isArray(newsItems) ? newsItems : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="page">
      <section className="section active">
        <h2 className="section-title">Latest News</h2>
        {loading && <div className="loading"><div className="spinner-ring"></div><p className="loading-text">Loading news...</p></div>}
        {error && <div className="error-msg">{error}</div>}
        {!loading && items.length === 0 && (
          <div className="empty">
            <div className="empty-icon">📰</div>
            <div className="empty-text">No news found</div>
          </div>
        )}
        {!loading && items.length > 0 && <CardGrid items={items} type="news" />}
      </section>
    </div>
  );
}
