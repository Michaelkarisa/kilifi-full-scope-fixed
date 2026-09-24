import { useState, useEffect } from 'react';
import * as apis from '../../apis';
import CardGrid from '../CardGrid';

/**
 * Sectors Section - consumes content.sectors APIs
 */
export default function SectorsSection() {
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        setLoading(true);
        const response = await apis.publicCms.listSectors({
          page,
          per_page: 12,
        });
      //  console.log('Fetched sectors:', response);
        setSectors(response.data);
        console.log('Fetched sectors:', response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSectors();
  }, [page]);

  const handleSelectSector = async (id) => {
    try {
      const response = await apis.publicCms.getSector(id);
      setSelectedSector(response.data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (selectedSector) {
    return (
      <div className="section-container">
        <button onClick={() => setSelectedSector(null)} className="back-button">
          ← Back to Sectors
        </button>
        <h1>{selectedSector.title}</h1>
        {selectedSector.image && (
          <img src={selectedSector.image} alt={selectedSector.title} className="sector-image" />
        )}
        <p className="description">{selectedSector.description}</p>

        {selectedSector.opportunities && selectedSector.opportunities.length > 0 && (
          <div className="opportunities-container">
            <h2>Economic Opportunities</h2>
            <ul className="opportunities-list">
              {selectedSector.opportunities.map((opp, idx) => (
                <li key={idx}>{opp}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="section-container">
      <h1>Economic Sectors</h1>
      <p className="section-description">Key sectors driving economic development in Kilifi County</p>

      {loading && <div>Loading sectors...</div>}
      {error && <div className="error">Error: {error}</div>}

      {!loading && !error && sectors.length === 0 && <div>No sectors available</div>}

      {!loading && !error && sectors.length > 0 && (
        <>
          <CardGrid items={sectors} type="sectors" />

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
