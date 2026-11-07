import type { Route } from "./+types/restart";
import { clearProfile } from "~/lib/env.server";

export const action = ({ request }: Route.ActionArgs) => clearProfile(request);
