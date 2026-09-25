const COLUMNS = [
  {
    title: "Product",
    links: ["Modules", "Pricing", "Compliance", "Book a demo"],
  },
  {
    title: "Company",
    links: ["About Xtreme Cr8tivity", "Setup assistance", "Contact"],
  },
  {
    title: "Legal",
    links: ["Terms of Service", "Privacy Policy", "Refund Policy"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-white/70 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-display text-lg text-foreground">Xtreme Books</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Accounting, payroll, and e-invoicing for Nigerian businesses.
              By Xtreme Cr8tivity Xpressions Limited.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-foreground">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Xtreme Cr8tivity Xpressions Limited. All rights reserved.</p>
          <p>Built for Nigerian businesses · NRS REV 360 compliant</p>
        </div>
      </div>
    </footer>
  );
}
