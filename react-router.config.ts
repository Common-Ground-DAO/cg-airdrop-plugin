import type { Config } from "@react-router/dev/config";
import env from "./app/lib/.server/env";

export default {
  ssr: true,
  basename: env.VITE_URL_PREFIX || "/",
  // Behind a TLS-terminating proxy the server sees http:// while the browser
  // sends an https:// Origin, which fails React Router's CSRF check for actions.
  // Comma-separated hosts, e.g. "cg-airdrop.dodev.de"
  allowedActionOrigins: env.ALLOWED_ACTION_ORIGINS
    ? env.ALLOWED_ACTION_ORIGINS.split(",").map((s: string) => s.trim()).filter(Boolean)
    : undefined,
} satisfies Config;
