import { useState, useEffect } from 'react';
import * as apis from '../../apis';
import CardGrid from '../CardGrid';

/**
 * Partnerships Section - consumes content.partnershipPrograms APIs
 */
export default function PartnershipsSection() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const response = await apis.api.publicCms.listPartners({
          page,
          per_page: 12,
        });
        setPrograms(response.data);
        console.log('Fetched partnership programs:', response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [page]);

  const handleSelectProgram = async (id) => {
    try {
      const response = await apis.api.publicCms.getPartnersPageData(id);
      setSelectedProgram(response.data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (selectedProgram) {
    return (
      <div className="section-container">
        <button onClick={() => setSelectedProgram(null)} className="back-button">
          ← Back to Partnerships
        </button>
        <h1>{selectedProgram.title}</h1>
        <p className="partner-info">{selectedProgram.partner}</p>
        <div className="program-overview">{selectedProgram.overview}</div>

        {selectedProgram.sections && selectedProgram.sections.length > 0 && (
          <div className="sections-container">
            <h2>Program Sections</h2>
            {selectedProgram.sections.map((section) => (
              <div key={section.id} className="program-section">
                <h3>{section.title}</h3>
                <p>{section.description}</p>
                {section.points && (
                  <ul>
                    {section.points.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedProgram.projects && selectedProgram.projects.length > 0 && (
          <div className="projects-container">
            <h2>Projects ({selectedProgram.projects.length})</h2>
            <div className="projects-grid">
              {selectedProgram.projects.map((project) => (
                <div key={project.id} className="project-card">
                  <h4>{project.title}</h4>
                  <p className="partner-name">{project.partner}</p>
                  <p className="description">{project.description}</p>
                  <div className="meta">
                    <span className="status">{project.status}</span>
                    <span className="budget">{project.budget}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedProgram.milestones && selectedProgram.milestones.length > 0 && (
          <div className="milestones-container">
            <h2>Timeline</h2>
            <div className="timeline">
              {selectedProgram.milestones.map((milestone) => (
                <div key={milestone.id} className="milestone">
                  <span className="year">{milestone.year}</span>
                  <span className="event">{milestone.event}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedProgram.documents && selectedProgram.documents.length > 0 && (
          <div className="documents-container">
            <h2>Documents</h2>
            <ul className="documents-list">
              {selectedProgram.documents.map((doc) => (
                <li key={doc.id}>
                  <a href={doc.url_path} target="_blank" rel="noopener noreferrer">
                    {doc.title}
                  </a>
                  <span className="doc-type">{doc.type}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedProgram.contacts && selectedProgram.contacts.length > 0 && (
          <div className="contacts-container">
            <h2>Contacts</h2>
            <div className="contacts-grid">
              {selectedProgram.contacts.map((contact) => (
                <div key={contact.id} className="contact-card">
                  <h4>{contact.name}</h4>
                  <p className="role">{contact.contact_type}</p>
                  {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
                  {contact.phone && <p className="phone">{contact.phone}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="section-container">
      <h1>Partnership Programs</h1>
      <p className="section-description">Strategic partnerships driving development in Kilifi County</p>

      {loading && <div>Loading partnerships...</div>}
      {error && <div className="error">Error: {error}</div>}

      {!loading && !error && programs.length === 0 && <div>No partnerships available</div>}

      {!loading && !error && programs.length > 0 && (
        <>
          <CardGrid
                 items={programs}
                 type="programs"
                 loading={loading}
                 emptyMessage="No programs available"
                 onItemClick={(program) => handleSelectProgram(program.id)}
                 buttonText="view Program"
               />

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
