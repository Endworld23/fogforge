/* global console, process */
import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const nextPath = path.resolve(".next");

async function main() {
  if (!existsSync(nextPath)) {
    return;
  }

  try {
    await rm(nextPath, { recursive: true, force: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to remove .next.");
    console.error(message);
    console.error("One-time fix:");
    console.error("  sudo chown -R \"$(whoami)\":\"$(id -gn)\" .next");
    console.error("  chmod -R u+rwX .next");
    console.error("  rm -rf .next");
    process.exit(1);
  }
}

main();
