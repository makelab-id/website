import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./routes/Home";
import { Quote } from "./routes/Quote";
import { Katalog } from "./routes/Katalog";
import { Harga } from "./routes/Harga";
import { Tentang } from "./routes/Tentang";

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
    </Routes>
  );
}
