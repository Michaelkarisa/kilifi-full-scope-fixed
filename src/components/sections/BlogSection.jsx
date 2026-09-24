import { useState, useEffect } from 'react';
import * as apis from '../../apis';
import CardGrid from '../CardGrid';

export default function BlogSection() {
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apis.publicCms.listBlogPosts({
          page,
          per_page: 12,
        });

        const fetchedBlogs = response.data?.data || response.data || [];
        console.log('Fetched blogs:', fetchedBlogs);
        setBlogs(Array.isArray(fetchedBlogs) ? fetchedBlogs : []);
      } catch (err) {
        setError(err.message || 'Failed to fetch blogs');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [page]);

  const handleViewBlog = async (blog) => {
    try {
      setError(null);
      console.log('Fetching blog post:', blog);
      const slugOrId = blog?.slug || blog?.id;
      if (!slugOrId) {
        throw new Error('Blog slug or id is missing');
      }

      const response = await apis.publicCms.getBlogPost(slugOrId);
      setSelectedBlog(response.data?.data || response.data || null);
    } catch (err) {
      setError(err.message || 'Failed to fetch blog post');
    }
  };

  if (selectedBlog) {
    return (
      <div className="section-container">
        <button onClick={() => setSelectedBlog(null)} className="back-button">
          ← Back to Blogs
        </button>

        <h1>{selectedBlog.title}</h1>

        <div className="meta">
          <span>{selectedBlog.author}</span>
          <span>{selectedBlog.publish_date}</span>
          <span className="read-time">{selectedBlog.read_time}</span>
        </div>

        {selectedBlog.image && (
          <img src={selectedBlog.image} alt={selectedBlog.title} />
        )}

        <div className="content">
          {Array.isArray(selectedBlog.body)
            ? selectedBlog.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))
            : selectedBlog.body || selectedBlog.excerpt}
        </div>

        <div className="tags">
          {selectedBlog.tags?.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="section-container">
      <h1>Blog</h1>
      <p className="section-description">
        Latest articles and insights from Kilifi County
      </p>

      {error && <div className="error">Error: {error}</div>}

      <CardGrid
        items={blogs}
        type="blog"
        loading={loading}
        emptyMessage="No blogs available"
        onItemClick={handleViewBlog}
        buttonText="Read Article"
      />

      {!loading && !error && blogs.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Previous
          </button>

          <span>Page {page}</span>

          <button onClick={() => setPage((prev) => prev + 1)}>
            Next
          </button>
        </div>
      )}
    </section>
  );
}