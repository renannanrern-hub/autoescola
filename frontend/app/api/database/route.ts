import { NextResponse } from "next/server";
import { readDatabase } from "@/lib/store";
import type { DashboardStats } from "@/lib/types";

export async function GET() {
  const database = await readDatabase();
  const today = new Date().toISOString().slice(0, 10);

  const stats: DashboardStats = {
    alunosAtivos: database.students.filter((student) => student.status === "ativo")
      .length,
    aulasHoje: database.lessons.filter((lesson) => lesson.data === today).length,
    veiculosDisponiveis: database.vehicles.filter(
      (vehicle) => vehicle.status === "disponivel",
    ).length,
    receitaRecebida: database.payments
      .filter((payment) => payment.status === "pago")
      .reduce((sum, payment) => sum + payment.valor, 0),
    pendenciasFinanceiras: database.payments.filter(
      (payment) => payment.status !== "pago",
    ).length,
  };

  return NextResponse.json({ ...database, stats });
}
