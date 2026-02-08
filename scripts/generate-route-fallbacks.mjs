import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");

const fallbackRoutes = [
  "admin",
  "admin/login",
  "admin/setup",
  "admin/pin",
  "admin/staff",
  "admin/config",
  "pantalla",
];

async function main() {
  const indexHtml = await readFile(indexPath, "utf8");

  await Promise.all(
    fallbackRoutes.map(async (route) => {
      const routeDir = path.join(distDir, route);
      await mkdir(routeDir, { recursive: true });
      await writeFile(path.join(routeDir, "index.html"), indexHtml, "utf8");
    }),
  );

  console.log(`Generated SPA route fallbacks for ${fallbackRoutes.length} routes.`);
}

main().catch((error) => {
  console.error("Failed to generate route fallbacks:", error);
  process.exit(1);
});
