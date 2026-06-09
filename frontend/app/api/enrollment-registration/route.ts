import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { readDatabase, writeDatabase } from "@/lib/store";

export async function POST(request: Request) {
  const payload = await request.json();
  const database = await readDatabase();

  const studentData = {
    nome: String(payload.nome ?? ""),
    cpf: String(payload.cpf ?? ""),
    telefone: String(payload.telefone ?? ""),
    email: String(payload.email ?? ""),
    endereco: String(payload.endereco ?? ""),
    categoria: "B" as const,
    status: String(payload.enrollmentStatus ?? "ativo") as
      | "ativo"
      | "pendente"
      | "concluido"
      | "cancelado",
    aulasRealizadas: Number(payload.aulasRealizadas || 0),
  };

  if (!studentData.nome || !studentData.cpf || !studentData.email) {
    return NextResponse.json(
      { message: "Nome, CPF e e-mail do aluno sao obrigatorios." },
      { status: 400 },
    );
  }

  const enrollmentId = String(payload.id ?? "");
  const existingEnrollment = enrollmentId
    ? database.enrollments.find((enrollment) => enrollment.id === enrollmentId)
    : null;
  const student =
    database.students.find((item) => item.id === existingEnrollment?.alunoId) ??
    database.students.find(
      (item) =>
        item.cpf === studentData.cpf || item.email.toLowerCase() === studentData.email.toLowerCase(),
    );

  const studentId = student?.id ?? randomUUID();
  const nextStudent = {
    ...student,
    ...studentData,
    id: studentId,
  };

  if (student) {
    const studentIndex = database.students.findIndex((item) => item.id === student.id);
    database.students[studentIndex] = nextStudent;
  } else {
    database.students.unshift(nextStudent);
  }

  const nextEnrollment = {
    id: enrollmentId || randomUUID(),
    alunoId: studentId,
    curso: "Direcao para habilitados",
    inicio: String(payload.inicio ?? new Date().toISOString().slice(0, 10)),
    valor: Number(payload.valor || 0),
    cambioPreferido: String(payload.cambioPreferido ?? "manual") as "automatico" | "manual",
    aulasContratadas: Number(payload.aulasContratadas || 0),
    status: String(payload.enrollmentStatus ?? "ativo") as
      | "ativo"
      | "pendente"
      | "concluido"
      | "cancelado",
  };

  if (existingEnrollment) {
    const enrollmentIndex = database.enrollments.findIndex((item) => item.id === existingEnrollment.id);
    database.enrollments[enrollmentIndex] = nextEnrollment;
  } else {
    database.enrollments.unshift(nextEnrollment);
  }

  await writeDatabase(database);

  return NextResponse.json({ enrollment: nextEnrollment, student: nextStudent });
}
