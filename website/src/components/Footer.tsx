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
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-5">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-display text-lg text-foreground">Kora</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Accounting, payroll, and e-invoicing for Nigerian businesses.
              Kora by Xtreme Cr8tivity Xpressions Limited.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Support</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>Mon–Fri, 9am–5pm WAT</li>
              <li>Replies within 1 business day</li>
              <li>
                <a href="mailto:xc@cr8.com.ng" className="hover:text-foreground">
                  xc@cr8.com.ng
                </a>
              </li>
              <li>
                <a href="tel:+2347046367754" className="hover:text-foreground">
                  +234 704 636 7754
                </a>
              </li>
            </ul>
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
