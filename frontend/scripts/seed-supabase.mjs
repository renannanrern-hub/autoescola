import { readFile } from "fs/promises";
import path from "path";
import process from "process";

const collections = [
  "students",
  "instructors",
  "vehicles",
  "enrollments",
  "lessons",
  "payments",
];

async function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");

  try {
    const file = await readFile(envPath, "utf8");

    for (const line of file.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const index = trimmed.indexOf("=");

      if (index < 0) {
        continue;
      }

      const key = trimmed.slice(0, index);
      const value = trimmed.slice(index + 1);

      process.env[key] = process.env[key] ?? value;
    }
  } catch {
    // Vercel and CI usually provide env vars directly.
  }
}

async function supabaseRequest(table, options) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("Configure SUPABASE_URL e SUPABASE_SECRET_KEY antes de importar.");
  }

  const response = await fetch(`${url}/rest/v1/${table}${options.query ?? ""}`, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    method: options.method,
  });

  if (!response.ok) {
    throw new Error(`Erro ao importar ${table}: ${response.status} ${await response.text()}`);
  }
}

async function main() {
  await loadEnv();

  const databasePath = path.join(process.cwd(), "data", "db.json");
  const database = JSON.parse(await readFile(databasePath, "utf8"));

  for (const collection of collections) {
    const items = database[collection] ?? [];
    await supabaseRequest(collection, {
      method: "DELETE",
      query: "?id=not.is.null",
    });

    if (items.length) {
      await supabaseRequest(collection, {
        body: items.map((item) => ({
          id: item.id,
          data: item,
        })),
        method: "POST",
        query: "?on_conflict=id",
      });
    }

    console.log(`${collection}: ${items.length} registros importados`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
