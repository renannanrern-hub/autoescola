import AutoescolaApp from "./AutoescolaApp";
import type { ModuleId } from "./AutoescolaApp";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidAdminSession } from "@/lib/admin-auth";
import { readDatabase } from "@/lib/store";
import type { DashboardStats } from "@/lib/types";

function isModuleId(value: string | undefined): value is ModuleId {
  return [
    "dashboard",
    "students",
    "lessons",
    "enrollments",
    "instructors",
    "vehicles",
    "payments",
  ].includes(value ?? "");
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ mod?: string }>;
}) {
  const cookieStore = await cookies();

  if (!isValidAdminSession(cookieStore.get("adminSession")?.value)) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const initialModule = isModuleId(params.mod) ? params.mod : "dashboard";
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

  return <AutoescolaApp initialData={{ ...database, stats }} initialModule={initialModule} />;
}
