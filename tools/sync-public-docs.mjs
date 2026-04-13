import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");

const filesToCopy = [
  "PROJECT_MEMORY.md",
  "BACKEND_PLAN.md",
  "REACT_MIGRATION_PLAN.md",
];

async function main() {
  await mkdir(publicDir, { recursive: true });

  await Promise.all(
    filesToCopy.map(async (filename) => {
      const sourcePath = path.join(rootDir, filename);
      const targetPath = path.join(publicDir, filename);
      const content = await readFile(sourcePath, "utf8");
      await writeFile(targetPath, content);
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
