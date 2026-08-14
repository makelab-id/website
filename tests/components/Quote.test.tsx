import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Quote } from "../../src/routes/Quote";
import { installFetchMock, renderWithProviders } from "../testUtils";

// The 3D preview needs a real WebGL context, which jsdom doesn't provide —
// its actual rendering was verified manually in a real browser (see the run
// skill's screenshots). Stub it out so this test can focus on the
// reducer/calculator wiring.
vi.mock("../../src/components/PartStage", () => ({ PartStage: () => null }));

installFetchMock();

describe("Quote screen", () => {
  it("shows an estimate immediately and updates it when the sample file and material change", async () => {
    renderWithProviders(<Quote />, { route: "/quote" });

    await screen.findByText("Estimasi harga cetak");
    const estimasiHeading = screen.getByText("Estimasi");
    const priceEl = estimasiHeading.nextElementSibling as HTMLElement;
    const priceBefore = priceEl.textContent;
    expect(priceBefore).toMatch(/^Rp /);

    fireEvent.click(screen.getByText("Coba dengan file contoh"));
    await screen.findByText("bracket_tamiya_v3.stl");

    // Switching from the default (PLA) to a pricier material should raise the estimate.
    fireEvent.click(screen.getByText("Resin 8K"));

    await waitFor(() => {
      expect(priceEl.textContent).not.toBe(priceBefore);
    });
  });

  it("lets the user clear a picked file and return to the upload prompt", async () => {
    renderWithProviders(<Quote />, { route: "/quote" });

    fireEvent.click(await screen.findByText("Coba dengan file contoh"));
    await screen.findByText("bracket_tamiya_v3.stl");

    fireEvent.click(screen.getByText("Ganti file"));

    await screen.findByText("Tarik file ke sini, atau klik untuk pilih");
    expect(screen.queryByText("bracket_tamiya_v3.stl")).not.toBeInTheDocument();
  });
});
