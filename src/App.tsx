import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./routes/Home";
import { Quote } from "./routes/Quote";
import { Katalog } from "./routes/Katalog";
import { Harga } from "./routes/Harga";
import { Tentang } from "./routes/Tentang";

// The admin panel is only ever used by the shop owner — code-split it out
// of the public bundle entirely.
const AdminLogin = lazy(() => import("./routes/admin/AdminLogin").then((m) => ({ default: m.AdminLogin })));
const AdminLayout = lazy(() => import("./routes/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })));
const AdminCalculator = lazy(() => import("./routes/admin/AdminCalculator").then((m) => ({ default: m.AdminCalculator })));
const AdminCatalog = lazy(() => import("./routes/admin/AdminCatalog").then((m) => ({ default: m.AdminCatalog })));

function AdminFallback() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-neutral-600)" }}>
      Memuat…
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="quote" element={<Quote />} />
        <Route path="katalog" element={<Katalog />} />
        <Route path="harga" element={<Harga />} />
        <Route path="tentang" element={<Tentang />} />
      </Route>

      <Route
        path="admin/login"
        element={
          <Suspense fallback={<AdminFallback />}>
            <AdminLogin />
          </Suspense>
        }
      />
      <Route
        path="admin"
        element={
          <Suspense fallback={<AdminFallback />}>
            <AdminLayout />
          </Suspense>
        }
      >
        <Route index element={<AdminCalculator />} />
        <Route path="katalog" element={<AdminCatalog />} />
      </Route>
    </Routes>
  );
}
