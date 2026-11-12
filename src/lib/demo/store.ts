import { promises as fs } from "node:fs";
import path from "node:path";
import { createSeed, type DemoDb } from "./seed";

/**
 * Demo mode storage: a single JSON file on disk, used only when the Supabase
 * env vars are absent. It lets the dashboard run and every control work
 * locally; it is not a substitute for Postgres and is not used in production.
 */
const filePath =
  process.env.MARGINALIA_DEMO_FILE ??
  path.join(process.cwd(), ".data", "demo.json");

const readOptions = { encoding: "utf8" } as const;

/** Uploaded covers live next to the demo JSON so the file stays portable. */
export const coversDir = path.join(path.dirname(filePath), "covers");

let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<DemoDb> {
  try {
    const raw = await fs.readFile(/*turbopackIgnore: true*/ filePath, readOptions);
    return JSON.parse(raw) as DemoDb;
  } catch {
    const seed = createSeed();
    await save(seed);
    return seed;
  }
}

async function save(db: DemoDb): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    /*turbopackIgnore: true*/ filePath,
    JSON.stringify(db, null, 2),
    "utf8",
  );
}

export async function readDb(): Promise<DemoDb> {
  return load();
}

/** Serialises read-modify-write cycles so two quick submissions cannot clobber. */
export async function mutate<T>(fn: (db: DemoDb) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const result = fn(db);
    await save(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}
