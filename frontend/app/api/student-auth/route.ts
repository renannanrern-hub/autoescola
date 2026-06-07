import { NextResponse } from "next/server";
import { readDatabase } from "@/lib/store";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export async function POST(request: Request) {
  const body = (await request.json()) as { cpf?: string; email?: string };
  const cpf = onlyDigits(body.cpf ?? "");
  const email = (body.email ?? "").trim().toLowerCase();
  const database = await readDatabase();

  const student = database.students.find(
    (item) => onlyDigits(item.cpf) === cpf && item.email.toLowerCase() === email,
  );

  if (!student) {
    return NextResponse.json(
      { message: "CPF ou e-mail invalido." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    studentId: student.id,
    studentName: student.nome,
  });
}
