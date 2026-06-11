/**
 * 📄 PaginationControls Component
 * Generic pagination UI for cursor-based pagination
 */

import React from 'react'

export function PaginationControls({
  currentPageIndex = 0,
  hasMore = false,
  isLoading = false,
  onNextPage = () => {},
  onPrevPage = () => {},
  totalItems = 0,
  pageSize = 10
}) {
  const itemStart = currentPageIndex * pageSize + 1;
  const itemEnd = Math.min((currentPageIndex + 1) * pageSize, totalItems || (currentPageIndex + 1) * pageSize);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderTop: '1px solid #e5e7eb',
      marginTop: '12px',
      gap: '8px',
      fontSize: '14px'
    }}>
      <div style={{ color: '#666' }}>
        {totalItems > 0 ? (
          <span>Gösterilen: <strong>{itemStart}-{itemEnd}</strong></span>
        ) : (
          <span>Veri yok</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onPrevPage}
          disabled={currentPageIndex === 0 || isLoading}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            background: currentPageIndex === 0 ? '#e5e7eb' : '#3b82f6',
            color: currentPageIndex === 0 ? '#9ca3af' : '#fff',
            border: 'none',
            cursor: currentPageIndex === 0 ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          ← Önceki
        </button>

        <button
          onClick={onNextPage}
          disabled={!hasMore || isLoading}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            background: !hasMore ? '#e5e7eb' : '#3b82f6',
            color: !hasMore ? '#9ca3af' : '#fff',
            border: 'none',
            cursor: !hasMore ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          {isLoading ? '⟳ Yükleniyor...' : 'Sonraki →'}
        </button>

        <span style={{
          padding: '6px 12px',
          background: '#f3f4f6',
          borderRadius: '4px',
          color: '#666',
          fontSize: '12px'
        }}>
          Sayfa {currentPageIndex + 1}
        </span>
      </div>
    </div>
  );
}

/**
 * 📄 LazyLoadList Component
 * Infinite scroll with lazy loading
 */
export function LazyLoadList({
  items = [],
  renderItem = (item) => <div>{JSON.stringify(item)}</div>,
  onLoadMore = () => {},
  isLoading = false,
  hasMore = false,
  containerStyle = {}
}) {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <div style={containerStyle}>
      <div>
        {items.map((item, idx) => (
          <div key={item.id || idx}>
            {renderItem(item)}
          </div>
        ))}
      </div>

      {isLoading && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#999'
        }}>
          <div style={{ marginBottom: '8px' }}>⟳ Yükleniyor...</div>
          <div style={{ fontSize: '12px' }}>Daha fazla veri alınıyor</div>
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div style={{
          padding: '12px',
          textAlign: 'center',
          background: '#f3f4f6',
          borderRadius: '4px',
          color: '#666',
          fontSize: '12px',
          marginTop: '12px'
        }}>
          Tüm veriler yüklendi
        </div>
      )}

      {items.length === 0 && !isLoading && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#999'
        }}>
          Veri yok
        </div>
      )}

      <div ref={containerRef} style={{ height: '20px' }} />
    </div>
  );
}

/**
 * 📊 Pagination Stats Component
 */
export function PaginationStats({ current, total, pageSize }) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  return (
    <div style={{
      fontSize: '12px',
      color: '#666',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <span>{current}/{total} öğe</span>
      <div style={{
        width: '60px',
        height: '4px',
        background: '#e5e7eb',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: '#3b82f6',
          transition: 'width 0.3s'
        }} />
      </div>
      <span>{percentage}%</span>
    </div>
  );
}
