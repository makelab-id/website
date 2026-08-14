import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { AdminLogin } from "../../src/routes/admin/AdminLogin";
import { renderWithProviders } from "../testUtils";

const CORRECT_PASSWORD = "correct-password";

function AdminHomeStub() {
  return <div>Admin home stub</div>;
}

describe("AdminLogin", () => {
  beforeEach(() => {
    let loggedIn = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        const path = url.replace(/^https?:\/\/[^/]+/, "");

        if (path === "/api/admin/session" && (!init?.method || init.method === "GET")) {
          return new Response(JSON.stringify({ loggedIn }), { status: 200 });
        }
        if (path === "/api/admin/login" && init?.method === "POST") {
          const body = JSON.parse((init.body as string) ?? "{}");
          if (body.password === CORRECT_PASSWORD) {
            loggedIn = true;
            return new Response(JSON.stringify({ ok: true }), { status: 200 });
          }
          return new Response(JSON.stringify({ error: "Kata sandi salah. Coba lagi." }), { status: 401 });
        }
        return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
      }),
    );
  });

  it("shows the server's error message on a wrong password", async () => {
    renderWithProviders(<AdminLogin />, { route: "/admin/login" });
    await screen.findByText("Masuk ke admin");

    fireEvent.change(screen.getByPlaceholderText("Kata sandi admin"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

    await screen.findByText("Kata sandi salah. Coba lagi.");
  });

  it("navigates to /admin once the correct password is submitted", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminHomeStub />} />
      </Routes>,
      { route: "/admin/login" },
    );
    await screen.findByText("Masuk ke admin");

    fireEvent.change(screen.getByPlaceholderText("Kata sandi admin"), { target: { value: CORRECT_PASSWORD } });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

    await screen.findByText("Admin home stub");
  });
});
