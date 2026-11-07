import { useEffect, useState } from "react";
import { Form, Link, NavLink, Outlet, useLocation } from "react-router";
import type { Route } from "./+types/shell";
import { requireProfile } from "~/lib/env.server";
import { b } from "~/lib/blanks";
import { remove, useChats } from "~/lib/chats";
import { Icon } from "~/components/icon";

export async function loader({ request }: Route.LoaderArgs) {
  return { profile: await requireProfile(request) };
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
    <button id="rail-theme" onClick={next} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-body transition hover:bg-ink/5">
      <Icon name="sun" className="size-4" /> Theme <span className="ml-auto font-mono text-[11px] text-muted">{theme}</span>
    </button>
  );
}

const row = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[13px] transition ${isActive ? "border-line bg-raised text-ink shadow-[0_1px_2px_oklch(0_0_0/0.05)]" : "border-transparent text-body hover:bg-ink/5"}`;

export default function Shell({ loaderData }: Route.ComponentProps) {
  const chats = useChats();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="flex h-dvh bg-canvas">
      <aside id="rail" className={`fixed inset-y-0 left-0 z-30 flex w-[17rem] flex-col bg-canvas p-3 transition-transform md:static md:translate-x-0 ${open ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-2 pb-3 pt-1.5">
          <Link to="/" className="font-serif text-[26px] leading-none text-ink">{b("brand.name")}</Link>
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><Icon name="x" /></button>
        </div>
        <Link id="rail-new-chat" to="/" className="btn btn-dark mt-2 h-10 justify-center text-[14px]">
          <Icon name="plus" className="size-4" /> New chat
        </Link>
        <p className="eyebrow mt-7 px-2.5">Chats</p>
        <nav id="rail-chats" className="mt-2 flex-1 space-y-1 overflow-y-auto" aria-label="Chats">
          {chats.length === 0 && <p className="px-2.5 py-2 text-[13px] text-muted">Your chats stay on this device.</p>}
          {chats.map((c) => (
            <NavLink key={c.id} id={`chat-${c.id}`} to={`/c/${c.id}`} className={row}>
              {c.busy ? <span className="size-3 shrink-0 animate-spin rounded-full border-[1.5px] border-tone-1-ink border-t-transparent" /> : <span className="font-mono text-[10px] text-muted">::</span>}
              <span className="flex-1 truncate">{c.title}</span>
              <button onClick={(e) => { e.preventDefault(); remove(c.id); }} className="opacity-0 transition group-hover:opacity-100 focus:opacity-100" aria-label={`Delete ${c.title}`}>
                <Icon name="trash" className="size-3.5 text-muted" />
              </button>
            </NavLink>
          ))}
        </nav>
        <div className="space-y-0.5 border-t border-line pt-2">
          {import.meta.env.DEV && <NavLink id="rail-brand" to="/brand" className={row}><Icon name="palette" className="size-4" /> Brand and contrast</NavLink>}
          <ThemeButton />
          <NavLink id="rail-answers" to="/welcome" className={row}><span className="grid size-4 place-items-center rounded-full bg-surface font-mono text-[9px] text-ink">{loaderData.profile.name.slice(0, 1).toUpperCase()}</span> {loaderData.profile.name}<span className="ml-auto font-mono text-[11px] text-muted">edit</span></NavLink>
          <Form method="post" action="/restart">
            <button id="rail-restart" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-body transition hover:bg-ink/5"><Icon name="out" className="size-4" /> Start over</button>
          </Form>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-ink/30 md:hidden" onClick={() => setOpen(false)} />}
      <div id="page" className="flex min-w-0 flex-1 flex-col md:py-2 md:pr-2">
        <div className="flex items-center gap-3 px-4 py-3 md:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <span className="font-serif text-[22px] leading-none text-ink">{b("brand.name")}</span>
        </div>
        <div className="frame relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-x-0 md:rounded-[16px] md:border-x">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
