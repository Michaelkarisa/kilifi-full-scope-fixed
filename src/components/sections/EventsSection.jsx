import { useState, useEffect } from 'react';
import { content } from '../../api';
import CardGrid from '../CardGrid';

export default function EventsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await content.events.list({ page: 1, per_page: 12 });
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
        <h2 className="section-title">Upcoming Events</h2>
        {loading && <div className="loading"><div className="spinner-ring"></div><p className="loading-text">Loading events...</p></div>}
        {error && <div className="error-msg">{error}</div>}
        {!loading && items.length === 0 && <div className="empty"><div className="empty-icon">🎉</div><div className="empty-text">No events found</div></div>}
        {!loading && items.length > 0 && <CardGrid items={items} type="events" />}
      </section>
    </div>
  );
}
