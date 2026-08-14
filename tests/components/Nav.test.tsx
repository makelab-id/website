import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "../../src/components/Layout";
import { installFetchMock, renderWithProviders } from "../testUtils";

installFetchMock();

function Stub({ label }: { label: string }) {
  return <div>{label}</div>;
}

describe("Nav", () => {
  it("marks only the current route's link as active", async () => {
    renderWithProviders(
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Stub label="home" />} />
          <Route path="katalog" element={<Stub label="katalog" />} />
        </Route>
      </Routes>,
      { route: "/katalog" },
    );

    const katalogLink = await screen.findByRole("link", { name: "Katalog" });
    expect(katalogLink).toHaveAttribute("aria-current", "page");

    const berandaLink = screen.getByRole("link", { name: "Beranda" });
    expect(berandaLink).not.toHaveAttribute("aria-current");
  });
});
