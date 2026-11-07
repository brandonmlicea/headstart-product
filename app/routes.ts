import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("welcome", "routes/welcome.tsx"),
  route("restart", "routes/restart.ts"),
  route("api/chat", "routes/api.chat.ts"),
  route("api/transcribe", "routes/api.transcribe.ts"),
  layout("routes/shell.tsx", [
    index("routes/home.tsx", { id: "new-chat" }),
    route("c/:id", "routes/home.tsx", { id: "chat" }),
    route("brand", "routes/brand.tsx"),
  ]),
] satisfies RouteConfig;
