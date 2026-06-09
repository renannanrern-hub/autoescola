import { NextResponse } from "next/server";
import { readDatabase } from "@/lib/store";
import { getStudentInitialPassword } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  const password = (body.password ?? "").trim().toLowerCase();
  const database = await readDatabase();

  const student = database.students.find((item) => item.email.toLowerCase() === email);

  if (!student || getStudentInitialPassword(student) !== password) {
    return NextResponse.json(
      { message: "E-mail ou senha invalido." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    studentId: student.id,
    studentName: student.nome,
  });
}
