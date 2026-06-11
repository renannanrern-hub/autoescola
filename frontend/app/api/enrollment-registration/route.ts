import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { readDatabase, upsertCollectionItem } from "@/lib/store";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "Acesso administrativo obrigatorio." }, { status: 401 });
  }

  const payload = await request.json();
  const database = await readDatabase();

  const studentData = {
    nome: String(payload.nome ?? ""),
    cpf: String(payload.cpf ?? ""),
    telefone: String(payload.telefone ?? ""),
    email: String(payload.email ?? ""),
    endereco: String(payload.endereco ?? ""),
    bairro: String(payload.bairro ?? ""),
    municipio: String(payload.municipio ?? ""),
    cep: String(payload.cep ?? ""),
    dataNascimento: String(payload.dataNascimento ?? ""),
    identidade: String(payload.identidade ?? ""),
    origem: String(payload.origem ?? ""),
    observacoes: String(payload.observacoesAluno ?? ""),
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

  const nextEnrollment = {
    id: enrollmentId || randomUUID(),
    alunoId: studentId,
    curso: "Direcao para habilitados",
    inicio: String(payload.inicio ?? new Date().toISOString().slice(0, 10)),
    valor: Number(payload.valor || 0),
    observacoes: String(payload.observacoesMatricula ?? ""),
    cambioPreferido: String(payload.cambioPreferido ?? "manual") as "automatico" | "manual",
    aulasContratadas: Number(payload.aulasContratadas || 0),
    status: String(payload.enrollmentStatus ?? "ativo") as
      | "ativo"
      | "pendente"
      | "concluido"
      | "cancelado",
  };

  await Promise.all([
    upsertCollectionItem("students", nextStudent),
    upsertCollectionItem("enrollments", nextEnrollment),
  ]);

  return NextResponse.json({ enrollment: nextEnrollment, student: nextStudent });
}
