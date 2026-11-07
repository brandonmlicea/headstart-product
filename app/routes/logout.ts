import type { Route } from "./+types/logout";
import { signOut } from "~/lib/env.server";

export const action = ({ request }: Route.ActionArgs) => signOut(request);
export const loader = ({ request }: Route.LoaderArgs) => signOut(request);
