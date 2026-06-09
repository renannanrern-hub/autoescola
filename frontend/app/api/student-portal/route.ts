import { NextResponse } from "next/server";
import { readDatabase } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const database = await readDatabase();
  const student = database.students.find((item) => item.id === studentId);

  if (!student) {
    return NextResponse.json(
      { message: "Aluno nao encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    students: [student],
    instructors: database.instructors,
    vehicles: database.vehicles,
    enrollments: database.enrollments.filter((item) => item.alunoId === student.id),
    lessons: database.lessons,
    payments: database.payments.filter((item) => item.alunoId === student.id),
  });
}
