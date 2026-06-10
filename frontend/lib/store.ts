import { promises as fs } from "fs";
import path from "path";
import type { CollectionName, Database, Lesson } from "./types";

type StoredItem = { id: string };

const dataPath = path.join(process.cwd(), "data", "db.json");
const collections: CollectionName[] = [
  "students",
  "instructors",
  "vehicles",
  "enrollments",
  "lessons",
  "payments",
];

const scaleStart = new Date("2026-06-09T00:00:00");
const scaleEnd = new Date("2026-06-30T00:00:00");

const lessonScale = [
  {
    instructorId: "ins-renan",
    vehicleId: "veh-onix",
    weekdays: [1, 2, 3, 4, 5],
    hours: ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00"],
  },
  {
    instructorId: "ins-denner",
    vehicleId: "veh-argo-manual",
    weekdays: [1, 2, 3, 4, 5],
    hours: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
  },
  {
    instructorId: "ins-denner",
    vehicleId: "veh-argo-manual",
    weekdays: [6],
    hours: ["07:00", "08:00", "09:00", "10:00", "11:00"],
  },
  {
    instructorId: "ins-leo",
    vehicleId: "veh-argo-auto",
    weekdays: [6],
    hours: ["07:00", "08:00", "09:00", "10:00", "11:00"],
  },
];

const lessonOverrides = new Map<string, Pick<Lesson, "id" | "status"> & { alunoId?: string }>([
  [
    "2026-06-10|ins-renan|09:00",
    { id: "lesson-renan-2026-06-10-09-00", status: "solicitada", alunoId: "stu-ana" },
  ],
  [
    "2026-06-10|ins-denner|10:00",
    {
      id: "lesson-denner-2026-06-10-10-00",
      status: "cancelamento_solicitado",
      alunoId: "stu-ana",
    },
  ],
  [
    "2026-06-13|ins-leo|09:00",
    { id: "lesson-leo-2026-06-13-09-00", status: "agendada", alunoId: "stu-bianca" },
  ],
]);

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildSeedLessons(): Lesson[] {
  const lessons: Lesson[] = [];

  for (const date = new Date(scaleStart); date <= scaleEnd; date.setDate(date.getDate() + 1)) {
    const data = dateKey(date);

    for (const scale of lessonScale) {
      if (!scale.weekdays.includes(date.getDay())) {
        continue;
      }

      for (const hora of scale.hours) {
        const override = lessonOverrides.get(`${data}|${scale.instructorId}|${hora}`);
        lessons.push({
          id: override?.id ?? `lesson-${scale.instructorId.replace("ins-", "")}-${data}-${hora.replace(":", "-")}`,
          alunoId: override?.alunoId,
          instrutorId: scale.instructorId,
          veiculoId: scale.vehicleId,
          data,
          hora,
          tipo: "Pratica",
          status: override?.status ?? "disponivel",
        });
      }
    }
  }

  return lessons;
}

const seed: Database = {
  students: [
    {
      id: "stu-ana",
      nome: "Ana Martins",
      cpf: "123.456.789-00",
      telefone: "(21) 99912-3400",
      email: "ana.martins@email.com",
      categoria: "B",
      status: "ativo",
      aulasRealizadas: 8,
    },
    {
      id: "stu-carlos",
      nome: "Carlos Lima",
      cpf: "987.654.321-00",
      telefone: "(21) 98877-6611",
      email: "carlos.lima@email.com",
      categoria: "B",
      status: "pendente",
      aulasRealizadas: 3,
    },
    {
      id: "stu-bianca",
      nome: "Bianca Rocha",
      cpf: "456.781.239-10",
      telefone: "(21) 97744-2800",
      email: "bianca.rocha@email.com",
      categoria: "B",
      status: "ativo",
      aulasRealizadas: 11,
    },
  ],
  instructors: [
    {
      id: "ins-renan",
      nome: "Renan",
      telefone: "(21) 99240-1414",
      categorias: "B",
      status: "ativo",
    },
    {
      id: "ins-denner",
      nome: "Denner",
      telefone: "(21) 98320-2200",
      categorias: "B",
      status: "ativo",
    },
    {
      id: "ins-leo",
      nome: "Leo",
      telefone: "(21) 97777-3300",
      categorias: "B",
      status: "ativo",
    },
  ],
  vehicles: [
    {
      id: "veh-onix",
      modelo: "Chevrolet Onix",
      placa: "RJA-4B28",
      categoria: "B",
      cambio: "manual",
      status: "disponivel",
    },
    {
      id: "veh-argo-manual",
      modelo: "Fiat Argo",
      placa: "KWD-3C92",
      categoria: "B",
      cambio: "manual",
      status: "disponivel",
    },
    {
      id: "veh-argo-auto",
      modelo: "Fiat Argo",
      placa: "LRT-6A41",
      categoria: "B",
      cambio: "automatico",
      status: "disponivel",
    },
  ],
  enrollments: [
    {
      id: "enr-ana",
      alunoId: "stu-ana",
      curso: "Direcao para habilitados",
      inicio: "2026-06-02",
      valor: 1200,
      status: "ativo",
    },
    {
      id: "enr-carlos",
      alunoId: "stu-carlos",
      curso: "Direcao para habilitados",
      inicio: "2026-06-05",
      valor: 2100,
      status: "pendente",
    },
  ],
  lessons: buildSeedLessons(),
  payments: [
    {
      id: "pay-ana-1",
      alunoId: "stu-ana",
      vencimento: "2026-06-10",
      valor: 600,
      status: "pago",
    },
    {
      id: "pay-carlos-1",
      alunoId: "stu-carlos",
      vencimento: "2026-06-12",
      valor: 700,
      status: "aberto",
    },
    {
      id: "pay-bianca-1",
      alunoId: "stu-bianca",
      vencimento: "2026-06-01",
      valor: 450,
      status: "atrasado",
    },
  ],
};

async function ensureDataFile() {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });

  try {
    await fs.access(dataPath);
  } catch {
    await fs.writeFile(dataPath, JSON.stringify(seed, null, 2), "utf8");
  }
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    return null;
  }

  return {
    key,
    url: url.replace(/\/$/, ""),
  };
}

async function supabaseRequest<T>(
  table: CollectionName,
  options: {
    body?: unknown;
    method: "DELETE" | "GET" | "POST";
    query?: string;
  },
) {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase nao configurado.");
  }

  const response = await fetch(`${config.url}/rest/v1/${table}${options.query ?? ""}`, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    method: options.method,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro Supabase ${response.status} em ${table}: ${text}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

async function readSupabaseCollection<T>(collection: CollectionName) {
  const rows = await supabaseRequest<Array<{ data: T }>>(collection, {
    method: "GET",
    query: "?select=data&order=created_at.asc",
  });

  return rows.map((row) => row.data);
}

async function writeSupabaseCollection(collection: CollectionName, items: StoredItem[]) {
  await supabaseRequest(collection, {
    method: "DELETE",
    query: "?id=not.is.null",
  });

  if (!items.length) {
    return;
  }

  await supabaseRequest(collection, {
    body: items.map((item) => ({
      id: item.id,
      data: item,
    })),
    method: "POST",
    query: "?on_conflict=id",
  });
}

export async function readDatabase(): Promise<Database> {
  if (getSupabaseConfig()) {
    return {
      students: await readSupabaseCollection("students"),
      instructors: await readSupabaseCollection("instructors"),
      vehicles: await readSupabaseCollection("vehicles"),
      enrollments: await readSupabaseCollection("enrollments"),
      lessons: await readSupabaseCollection("lessons"),
      payments: await readSupabaseCollection("payments"),
    };
  }

  await ensureDataFile();
  const file = await fs.readFile(dataPath, "utf8");
  return JSON.parse(file) as Database;
}

export async function writeDatabase(database: Database) {
  if (getSupabaseConfig()) {
    await Promise.all(
      collections.map((collection) =>
        writeSupabaseCollection(collection, database[collection] as StoredItem[]),
      ),
    );
    return;
  }

  await ensureDataFile();
  await fs.writeFile(dataPath, JSON.stringify(database, null, 2), "utf8");
}

export function isCollectionName(value: string): value is CollectionName {
  return collections.includes(value as CollectionName);
}
