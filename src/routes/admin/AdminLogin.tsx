import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAdminLogin, useAdminSession } from "../../lib/adminApi";

export function AdminLogin() {
  const { data: session, isLoading: sessionLoading } = useAdminSession();
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const login = useAdminLogin();

  if (!sessionLoading && session?.loggedIn) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate(password, {
      onSuccess: () => navigate("/admin", { replace: true }),
      onError: () => setPassword(""),
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
        padding: 24,
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: "min(380px, 100%)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          background: "var(--color-surface)",
          padding: 40,
          borderRadius: "calc(var(--radius-lg) * 1.15)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
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
        <h1 style={{ fontSize: 26, margin: 0 }}>Masuk ke admin</h1>
        <p style={{ fontSize: 13, color: "var(--color-neutral-600)", margin: 0 }}>
          Khusus tim Makelab. Halaman ini terpisah dari website utama.
        </p>
        <div className="field">
          <label>Kata sandi</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kata sandi admin"
            autoFocus
          />
        </div>
        {login.isError && (
          <p style={{ fontSize: 13, color: "var(--color-accent)", margin: 0 }}>
            {login.error instanceof Error ? login.error.message : "Gagal masuk. Coba lagi."}
          </p>
        )}
        <button className="btn btn-primary" type="submit" style={{ padding: 13, marginTop: 4 }} disabled={login.isPending}>
          {login.isPending ? "Memeriksa…" : "Masuk"}
        </button>
        <Link to="/" style={{ fontSize: 13, textAlign: "center", color: "var(--color-neutral-600)" }}>
          ← Kembali ke website
        </Link>
      </form>
    </div>
  );
}
