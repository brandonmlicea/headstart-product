import { useEffect, useState } from "react";
import { Form, Link, NavLink, Outlet, useLocation } from "react-router";
import type { Route } from "./+types/shell";
import { requireIn } from "~/lib/env.server";
import { b } from "~/lib/blanks";
import { remove, useChats } from "~/lib/chats";
import { Icon } from "~/components/icon";

export async function loader({ request }: Route.LoaderArgs) {
  await requireIn(request);
  return null;
}

const THEMES = ["system", "light", "dark"] as const;

function ThemeButton() {
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("system");
  useEffect(() => { setTheme((localStorage.getItem("theme") as never) ?? "system"); }, []);
  const next = () => {
    const t = THEMES[(THEMES.indexOf(theme) + 1) % 3];
    setTheme(t);
    localStorage.setItem("theme", t);
    if (t === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  };
  return (
    <button id="rail-theme" onClick={next} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-ink/5">
      <Icon name="sun" /> Theme: {theme}
    </button>
  );
}

const row = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${isActive ? "bg-surface" : "hover:bg-ink/5"}`;

export default function Shell() {
  const chats = useChats();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="flex h-dvh">
      <aside id="rail" className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-canvas p-3 transition-transform md:static md:translate-x-0 ${open ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-3 py-2">
          <Link to="/" className="flex items-center gap-2 font-medium text-accent-ink"><Icon name="heart" />{b("brand.name")}</Link>
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><Icon name="x" /></button>
        </div>
        <Link id="rail-new-chat" to="/" className="mt-3 flex items-center gap-2 rounded-xl bg-accent-fill px-3 py-2.5 text-sm font-medium text-on-accent transition hover:brightness-110">
          <Icon name="plus" /> New chat
        </Link>
        <p className="mt-6 px-3 text-xs text-muted">Chats</p>
        <nav id="rail-chats" className="mt-1 flex-1 space-y-0.5 overflow-y-auto" aria-label="Chats">
          {chats.length === 0 && <p className="px-3 py-2 text-sm text-muted">Your chats stay on this device.</p>}
          {chats.map((c) => (
            <NavLink key={c.id} id={`chat-${c.id}`} to={`/c/${c.id}`} className={row}>
              {c.busy && <span className="size-2 shrink-0 animate-pulse rounded-full bg-accent-fill" />}
              <span className="flex-1 truncate">{c.title}</span>
              <button
                onClick={(e) => { e.preventDefault(); remove(c.id); }}
                className="opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                aria-label={`Delete ${c.title}`}
              >
                <Icon name="trash" className="size-4 text-muted" />
              </button>
            </NavLink>
          ))}
        </nav>
        <div className="space-y-0.5 border-t border-line pt-3">
          <NavLink id="rail-brand" to="/brand" className={row}><Icon name="palette" /> Brand and contrast</NavLink>
          <ThemeButton />
          <Form method="post" action="/logout">
            <button id="rail-sign-out" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-ink/5"><Icon name="out" /> Sign out</button>
          </Form>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-ink/30 md:hidden" onClick={() => setOpen(false)} />}
      <div id="page" className="flex min-w-0 flex-1 flex-col md:py-2 md:pr-2">
        <div className="flex items-center gap-3 px-4 py-3 md:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <span className="font-medium text-accent-ink">{b("brand.name")}</span>
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-line bg-raised md:rounded-2xl md:border">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
