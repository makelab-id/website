import { NavLink } from "react-router-dom";
import logoFull from "../assets/logo-full.svg";
import { useSettings } from "../lib/api";
import { buildGenericInquiryMessage, waLink } from "../lib/pricing";

const NAV_LINKS = [
  { to: "/", label: "Beranda", end: true },
  { to: "/quote", label: "Upload & Quote", end: false },
  { to: "/katalog", label: "Katalog", end: false },
  { to: "/harga", label: "Harga", end: false },
  { to: "/tentang", label: "Tentang", end: false },
];

export function Nav() {
  const { data: settings } = useSettings();
  const waHref = settings ? waLink(settings.whatsappNumber, buildGenericInquiryMessage()) : "#";

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "color-mix(in srgb, var(--color-bg) 92%, transparent)",
        backdropFilter: "blur(8px)",
      }}
    >
      <nav className="nav" style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 24px", gap: 28 }}>
        <div className="nav-brand" style={{ marginRight: "auto", display: "flex", alignItems: "center" }}>
          <NavLink to="/" style={{ display: "block" }}>
            <img src={logoFull} alt="Makelab" style={{ height: 38, width: "auto", display: "block" }} />
          </NavLink>
        </div>
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className="btn btn-ghost"
            style={{ padding: "6px 4px", position: "relative", background: "transparent", border: 0 }}
          >
            {({ isActive }) => (
              <>
                {link.label}
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      left: 4,
                      right: 4,
                      bottom: -2,
                      height: 3,
                      borderRadius: 999,
                      background: "var(--color-accent)",
                    }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
        <a className="btn btn-primary" href={waHref} target="_blank" rel="noopener noreferrer" style={{ padding: "9px 18px" }}>
          Chat WhatsApp
        </a>
      </nav>
    </div>
  );
}
