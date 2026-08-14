import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAdminLogout, useAdminSession } from "../../lib/adminApi";

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  justifyContent: "flex-start" as const,
  padding: "11px 14px",
  background: isActive ? "var(--color-accent-100)" : "transparent",
  color: isActive ? "var(--color-accent-800)" : undefined,
});

export function AdminLayout() {
  const { data: session, isLoading } = useAdminSession();
  const navigate = useNavigate();
  const logout = useAdminLogout();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-neutral-600)" }}>
        Memuat…
      </div>
    );
  }
  if (!session?.loggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}>
      <aside
        style={{
          width: 250,
          flex: "none",
          background: "var(--color-surface)",
          padding: "26px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          borderRight: "1px solid var(--color-divider)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "0 6px" }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: "var(--radius-sm)",
              background: "var(--color-accent)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-bg)",
              fontSize: 15,
            }}
          >
            M
          </span>
          <span style={{ fontFamily: "var(--font-heading)" }}>
            Makelab<span style={{ color: "var(--color-accent)" }}>.</span> Admin
          </span>
        </div>
        <NavLink to="/admin" end className="btn btn-ghost" style={navLinkStyle}>
          Opsi Kalkulator
        </NavLink>
        <NavLink to="/admin/katalog" className="btn btn-ghost" style={navLinkStyle}>
          Katalog Model
        </NavLink>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            paddingTop: 20,
            borderTop: "1px solid var(--color-divider)",
          }}
        >
          <Link to="/" className="btn btn-secondary" style={{ textAlign: "center", padding: 10 }}>
            Lihat website
          </Link>
          <button
            className="btn btn-ghost"
            style={{ padding: 10 }}
            onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/admin/login", { replace: true }) })}
          >
            Keluar
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "44px 48px", maxWidth: 1080 }}>
        <Outlet />
      </main>
    </div>
  );
}
