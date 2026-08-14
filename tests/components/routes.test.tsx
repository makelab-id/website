import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { App } from "../../src/App";
import { installFetchMock, renderWithProviders } from "../testUtils";

installFetchMock();

describe.each([
  ["/", "Kirim file, dapat harga, kami cetak."],
  ["/quote", "Estimasi harga cetak"],
  ["/katalog", "Katalog siap cetak"],
  ["/harga", "Cara kami menghitung harga"],
  ["/tentang", "Makelab — Design | Print | Create"],
])("route %s", (route, heading) => {
  it(`renders without throwing and shows "${heading}"`, async () => {
    renderWithProviders(<App />, { route });
    expect(await screen.findByText(heading)).toBeInTheDocument();
  });
});
