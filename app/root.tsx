import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import { b } from "./lib/blanks";
import "./app.css";

export const meta: Route.MetaFunction = () => [{ title: b("brand.name") }, { name: "description", content: b("brand.tagline") }];

export const links: Route.LinksFunction = () => [{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }];

const THEME = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const title = isRouteErrorResponse(error) ? (error.status === 404 ? "Page not found" : `Error ${error.status}`) : "Something went wrong";
  const detail = isRouteErrorResponse(error) ? String(error.data ?? error.statusText) : error instanceof Error ? error.message : "";
  return (
    <main id="page-error" className="mx-auto max-w-xl p-10">
      <h1 className="text-h2">{title}</h1>
      <pre className="mt-6 whitespace-pre-wrap text-sm text-muted">{detail}</pre>
      <a href="/" className="mt-8 inline-block text-accent-ink underline">Back home</a>
    </main>
  );
}
