import dotenv from "dotenv";
import fs from "fs";

const env: any = {};
dotenv.config({ path: ".env", processEnv: env });

if (fs.existsSync(".env.local")) {
  // Load .env.local file to second env object, as
  // calling dotenv.config() will not override the first env object
  const env2: any = {};
  dotenv.config({ path: ".env.local", processEnv: env2 });
  Object.assign(env, env2);
}

// Variables from the process environment (e.g. set in Coolify)
// take precedence over the .env files
Object.assign(env, process.env);

// PEM keys are often stored on a single line with literal "\n"
for (const key of ["PLUGIN_PRIVATE_KEY", "VITE_PLUGIN_PUBLIC_KEY"]) {
  if (typeof env[key] === "string") {
    env[key] = env[key].replace(/\\n/g, "\n");
  }
}

export default env;
