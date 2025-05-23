import { CgPluginLibHost } from "@common-ground-dao/cg-plugin-lib-host";

// API-only route - handles POST requests to create airdrops
export async function action({ request }: { request: Request }) {
  const body = await request.json();
  const pluginLib = await CgPluginLibHost.initialize(process.env.PLUGIN_PRIVATE_KEY!, import.meta.env.VITE_PLUGIN_PUBLIC_KEY);
  const signedRequest = await pluginLib.signRequest(body);
  return signedRequest; 
} 