import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

export const MOCK_MATERIALS = [
  { id: 1, name: "PLA", ratePerGram: 1800, density: 1.24, comingSoon: false, sortOrder: 0 },
  { id: 2, name: "PETG", ratePerGram: 2400, density: 1.27, comingSoon: false, sortOrder: 1 },
  { id: 4, name: "Resin 8K", ratePerGram: 4500, density: 1.1, comingSoon: false, sortOrder: 3 },
];

export const MOCK_COLORS = [
  { id: 1, name: "Hitam", hex: "#3a3632", extraPrice: 0, sortOrder: 0 },
  { id: 2, name: "Putih", hex: "#e6ddcd", extraPrice: 0, sortOrder: 1 },
];

export const MOCK_QUALITY = [{ id: 2, label: "0,20 mm — standar", timeMultiplier: 1, isDefault: true, sortOrder: 1 }];

export const MOCK_INFILL = [{ id: 2, label: "25% — umum", percent: 25, fillFraction: 0.5, isDefault: true, sortOrder: 1 }];

export const MOCK_FINISH = [
  { id: 1, label: "Apa adanya", price: 0, sortOrder: 0 },
  { id: 2, label: "Amplas halus", price: 15000, sortOrder: 1 },
  { id: 3, label: "Amplas + cat", price: 55000, sortOrder: 2 },
];

export const MOCK_MODELS = [
  {
    id: 1,
    slot: "mk-m1",
    category: "Tamiya",
    name: "Mini 4WD roller mount",
    description: "Dudukan roller sisi.",
    sizeLabel: "48 × 22 × 14 mm",
    materialLabel: "PLA / PETG",
    basePrice: 38000,
    active: true,
    sortOrder: 0,
  },
  {
    id: 7,
    slot: "mk-m7",
    category: "Airsoft",
    name: "Picatinny rail cover",
    description: "Cover rail 4 slot.",
    sizeLabel: "85 × 22 × 12 mm",
    materialLabel: "PETG",
    basePrice: 58000,
    active: true,
    sortOrder: 6,
  },
];

export const MOCK_SETTINGS = {
  id: 1,
  whatsappNumber: "6281234567890",
  machineRatePerHour: 7000,
  setupFee: 10000,
  expressMarkupPct: 0.4,
  bulkQtyThreshold: 5,
  bulkDiscountPct: 0.1,
  shellThicknessMm: 1.2,
};

const ROUTES: Record<string, unknown> = {
  "/api/materials": MOCK_MATERIALS,
  "/api/colors": MOCK_COLORS,
  "/api/quality-options": MOCK_QUALITY,
  "/api/infill-options": MOCK_INFILL,
  "/api/finish-options": MOCK_FINISH,
  "/api/models": MOCK_MODELS,
  "/api/settings": MOCK_SETTINGS,
};

/** Stubs global fetch so components using lib/api.ts's react-query hooks
 *  get canned catalog data instead of hitting a real server. */
export function installFetchMock() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      const path = url.replace(/^https?:\/\/[^/]+/, "");
      if (path in ROUTES) {
        return new Response(JSON.stringify(ROUTES[path]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
    }),
  );
}

export function renderWithProviders(ui: ReactNode, { route = "/" }: { route?: string } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[route]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        {ui}
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
