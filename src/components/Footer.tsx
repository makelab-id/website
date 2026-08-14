import logoIcon from "../assets/logo-icon.svg";

export function Footer() {
  return (
    <footer
      style={{
        maxWidth: 1180,
        margin: "72px auto 0",
        padding: "32px 24px 0",
        borderTop: "1px solid var(--color-divider)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
        fontSize: 13,
        color: "var(--color-neutral-700)",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src={logoIcon} alt="" style={{ height: 26, width: "auto", display: "block" }} />
        Makelab · Design | Print | Create · Yogyakarta, Indonesia
      </span>
      <span>Estimasi harga bersifat perkiraan. Harga final dikonfirmasi lewat WhatsApp.</span>
    </footer>
  );
}
