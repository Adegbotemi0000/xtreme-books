import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

// Client-side paging for lists the backend still returns unbounded — slices
// an already-fetched array rather than adding LIMIT/OFFSET to every list
// endpoint in one pass. Fine at the row counts a single tenant accumulates
// early on; server-side paging is the real fix once that stops being true.
export { PAGE_SIZE };

export function Pagination({ page, totalItems, pageSize = PAGE_SIZE, onChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="pagination">
      <span className="pagination-summary">
        {from}–{to} of {totalItems}
      </span>
      <div className="pagination-controls">
        <button type="button" className="icon-btn" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft size={14} />
        </button>
        <span className="pagination-page">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="icon-btn"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
