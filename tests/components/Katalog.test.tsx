import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Katalog } from "../../src/routes/Katalog";
import { installFetchMock, renderWithProviders } from "../testUtils";

installFetchMock();

describe("Katalog screen", () => {
  it("filters the grid to one category when its chip is clicked", async () => {
    renderWithProviders(<Katalog />, { route: "/katalog" });

    await screen.findByText("Mini 4WD roller mount");
    expect(screen.getByText("Picatinny rail cover")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Airsoft" }));

    await waitFor(() => {
      expect(screen.queryByText("Mini 4WD roller mount")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Picatinny rail cover")).toBeInTheDocument();
  });
});
