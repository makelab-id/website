export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
      <button
        className="btn btn-secondary btn-icon"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Halaman sebelumnya"
      >
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className="btn btn-secondary"
          onClick={() => onChange(p)}
          aria-current={p === page ? "page" : undefined}
          style={{
            minWidth: 36,
            padding: "9px 12px",
            ...(p === page
              ? { background: "var(--color-accent)", color: "var(--color-bg)", borderColor: "var(--color-accent)" }
              : {}),
          }}
        >
          {p}
        </button>
      ))}
      <button
        className="btn btn-secondary btn-icon"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Halaman berikutnya"
      >
        ›
      </button>
    </div>
  );
}
