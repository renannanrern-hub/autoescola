import { promises as fs } from "fs";
import path from "path";
import type { CollectionName, Database } from "./types";

const dataPath = path.join(process.cwd(), "data", "db.json");

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
      categoria: "AB",
      status: "pendente",
      aulasRealizadas: 3,
    },
    {
      id: "stu-bianca",
      nome: "Bianca Rocha",
      cpf: "456.781.239-10",
      telefone: "(21) 97744-2800",
      email: "bianca.rocha@email.com",
      categoria: "A",
      status: "ativo",
      aulasRealizadas: 11,
    },
  ],
  instructors: [
    {
      id: "ins-marcos",
      nome: "Marcos Pereira",
      telefone: "(21) 99240-1414",
      categorias: "A, B",
      status: "ativo",
    },
    {
      id: "ins-luciana",
      nome: "Luciana Alves",
      telefone: "(21) 98320-2200",
      categorias: "B, D",
      status: "ativo",
    },
  ],
  vehicles: [
    {
      id: "veh-onix",
      modelo: "Chevrolet Onix",
      placa: "RJA-4B28",
      categoria: "B",
      status: "disponivel",
    },
    {
      id: "veh-moto",
      modelo: "Honda CG 160",
      placa: "LPR-8A10",
      categoria: "A",
      status: "aula",
    },
    {
      id: "veh-argo",
      modelo: "Fiat Argo",
      placa: "KWD-3C92",
      categoria: "B",
      status: "manutencao",
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
      curso: "Primeira habilitacao AB",
      inicio: "2026-06-05",
      valor: 2100,
      status: "pendente",
    },
  ],
  lessons: [
    {
      id: "les-ana-hoje",
      alunoId: "stu-ana",
      instrutorId: "ins-marcos",
      veiculoId: "veh-onix",
      data: new Date().toISOString().slice(0, 10),
      hora: "09:00",
      tipo: "Pratica",
      status: "agendada",
    },
    {
      id: "les-bianca-hoje",
      alunoId: "stu-bianca",
      instrutorId: "ins-marcos",
      veiculoId: "veh-moto",
      data: new Date().toISOString().slice(0, 10),
      hora: "14:30",
      tipo: "Pratica",
      status: "agendada",
    },
  ],
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

export async function readDatabase(): Promise<Database> {
  await ensureDataFile();
  const file = await fs.readFile(dataPath, "utf8");
  return JSON.parse(file) as Database;
}

export async function writeDatabase(database: Database) {
  await ensureDataFile();
  await fs.writeFile(dataPath, JSON.stringify(database, null, 2), "utf8");
}

export function isCollectionName(value: string): value is CollectionName {
  return [
    "students",
    "instructors",
    "vehicles",
    "enrollments",
    "lessons",
    "payments",
  ].includes(value);
}
