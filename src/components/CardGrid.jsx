import React from 'react';

export default function CardGrid({
  items = [],
  type = 'default',
  onItemClick,
  buttonText,
  getItemHref,
  renderBadge,
  renderMeta,
  renderFooter,
  emptyMessage = 'No items available',
  loading = false,
  columns = 3,
  className = '',
}) {
  const safeItems = Array.isArray(items) ? items : [];

  const formatDate = (date) => {
    if (!date) return '';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return String(date);

    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncate = (value, length = 100) => {
    if (value === null || value === undefined) return '';

    const text = Array.isArray(value)
      ? value.join(' ')
      : typeof value === 'string'
        ? value
        : String(value);

    return text.length > length ? `${text.substring(0, length)}...` : text;
  };

  const getDisplayTitle = (item) =>
    item?.title ||
    item?.name ||
    item?.headline ||
    item?.label ||
    'Untitled';

  const getDisplayImage = (item) => item?.image || item?.thumbnail || item?.cover_image || '';

  const getDisplayExcerpt = (item) =>
    truncate(
      item?.excerpt ||
        item?.summary ||
        item?.short_desc ||
        item?.description ||
        item?.desc ||
        item?.body,
      120
    );

  const getDisplayStatus = (item) =>
    item?.status || item?.category || item?.type || '';

  const getDisplayDate = (item) =>
    formatDate(
      item?.published_at ||
        item?.publish_date ||
        item?.event_date ||
        item?.date ||
        item?.created_at
    );

  const getDisplayAuthor = (item) =>
    item?.author ||
    item?.creator?.name ||
    item?.created_by_name ||
    '';

  const getDefaultIcon = () => {
    switch (type) {
      case 'blog':
      case 'news':
        return '📰';
      case 'event':
        return '📅';
      case 'project':
        return '🏗️';
      case 'service':
        return '🛠️';
      case 'document':
        return '📄';
      case 'tender':
        return '📌';
      case 'staff':
        return '👤';
      default:
        return '✨';
    }
  };

  const resolvedButtonText = () => {
    if (buttonText) return buttonText;

    switch (type) {
      case 'blog':
      case 'news':
        return 'Read More';
      case 'event':
        return 'View Event';
      case 'project':
        return 'View Project';
      case 'service':
        return 'View Service';
      case 'document':
        return 'Open Document';
      default:
        return 'View Details';
    }
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: '24px',
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!safeItems.length) {
    return <div>{emptyMessage}</div>;
  }

  return (
    <div style={gridStyle} className={className}>
      {safeItems.map((item) => {
        const title = getDisplayTitle(item);
        const image = getDisplayImage(item);
        const excerpt = getDisplayExcerpt(item);
        const status = getDisplayStatus(item);
        const date = getDisplayDate(item);
        const author = getDisplayAuthor(item);
        const href = getItemHref ? getItemHref(item) : null;

        const handleClick = () => {
          if (onItemClick) onItemClick(item);
        };

        return (
          <div
            key={item.id || item.slug || title}
            className="card"
            style={{
              border: '1px solid var(--border)',
              borderRadius: '18px',
              overflow: 'hidden',
              background: 'var(--surface, #fff)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100%',
            }}
          >
            <div
              className="card-img"
              style={{
                height: '220px',
                background: 'linear-gradient(135deg, var(--ocean), var(--sky))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {image ? (
                <img
                  src={image}
                  alt={title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '42px' }}>{getDefaultIcon()}</span>
              )}
            </div>

            <div
              className="card-body"
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
              }}
            >
              {renderBadge ? (
                renderBadge(item)
              ) : status ? (
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--sky)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '8px',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  {status}
                </div>
              ) : null}

              <h3
                className="card-title"
                style={{
                  margin: '0 0 10px',
                  fontSize: '18px',
                  lineHeight: 1.3,
                }}
              >
                {title}
              </h3>

              {excerpt && (
                <p
                  className="card-excerpt"
                  style={{
                    margin: 0,
                    color: 'var(--text2)',
                    lineHeight: 1.6,
                    flexGrow: 1,
                  }}
                >
                  {excerpt}
                </p>
              )}

              {renderMeta ? (
                <div style={{ marginTop: '12px' }}>{renderMeta(item)}</div>
              ) : (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text3)',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  {date && <span>{date}</span>}

                  {date && author && (
                    <div
                      style={{
                        width: '4px',
                        height: '4px',
                        background: 'var(--border)',
                        borderRadius: '50%',
                      }}
                    />
                  )}

                  {author && <span>{author}</span>}
                </div>
              )}

              {renderFooter ? (
                <div style={{ marginTop: '16px' }}>{renderFooter(item)}</div>
              ) : onItemClick || href ? (
                <div style={{ marginTop: '16px' }}>
                  {href ? (
                    <a
                      href={href}
                      className="read-button"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {resolvedButtonText()}
                    </a>
                  ) : (
                    <button
                      onClick={handleClick}
                      className="read-button"
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: 'transparent',
                      }}
                    >
                      {resolvedButtonText()}
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}