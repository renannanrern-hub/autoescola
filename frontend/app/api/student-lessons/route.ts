import { NextResponse } from "next/server";
import { readDatabase, writeDatabase } from "@/lib/store";

type LessonAction = "cancel-request" | "request" | "request-cancel";

const dailyStudentLessonStatuses = [
  "solicitada",
  "agendada",
  "cancelamento_solicitado",
  "realizada",
];

function getLessonDateTime(data: string, hora: string) {
  return new Date(`${data}T${hora}:00`);
}

function isBusinessHours(date: Date) {
  const day = date.getDay();
  const minutes = date.getHours() * 60 + date.getMinutes();

  if (day >= 1 && day <= 5) {
    return minutes >= 8 * 60 && minutes <= 18 * 60;
  }

  if (day === 6) {
    return minutes >= 7 * 60 && minutes <= 12 * 60;
  }

  return false;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: LessonAction;
    lessonId?: string;
    studentId?: string;
  };

  if (!body.action || !body.lessonId || !body.studentId) {
    return NextResponse.json({ message: "Dados obrigatorios ausentes." }, { status: 400 });
  }

  const database = await readDatabase();
  const student = database.students.find((item) => item.id === body.studentId);
  const lesson = database.lessons.find((item) => item.id === body.lessonId);

  if (!student || !lesson) {
    return NextResponse.json({ message: "Aluno ou aula nao encontrado." }, { status: 404 });
  }

  if (body.action === "request") {
    if (lesson.status !== "disponivel" || lesson.alunoId) {
      return NextResponse.json({ message: "Horario indisponivel." }, { status: 409 });
    }

    const lessonsOnSameDay = database.lessons.filter(
      (item) =>
        item.alunoId === student.id &&
        item.data === lesson.data &&
        dailyStudentLessonStatuses.includes(item.status),
    );

    if (lessonsOnSameDay.length >= 2) {
      return NextResponse.json(
        { message: "O aluno pode solicitar no maximo 2 aulas por dia." },
        { status: 409 },
      );
    }

    lesson.alunoId = student.id;
    lesson.status = "solicitada";
  }

  if (body.action === "cancel-request") {
    if (lesson.status !== "solicitada" || lesson.alunoId !== student.id) {
      return NextResponse.json({ message: "Solicitacao nao encontrada." }, { status: 409 });
    }

    delete lesson.alunoId;
    lesson.status = "disponivel";
  }

  if (body.action === "request-cancel") {
    if (lesson.status !== "agendada" || lesson.alunoId !== student.id) {
      return NextResponse.json({ message: "Aula marcada nao encontrada." }, { status: 409 });
    }

    const now = new Date();
    const lessonDateTime = getLessonDateTime(lesson.data, lesson.hora);
    const hoursUntilLesson = lessonDateTime.getTime() - now.getTime();

    if (hoursUntilLesson < 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { message: "O desmarque precisa ser solicitado com pelo menos 24h de antecedencia." },
        { status: 409 },
      );
    }

    if (!isBusinessHours(now)) {
      return NextResponse.json(
        {
          message:
            "Desmarques pelo aluno so podem ser solicitados em horario de expediente: seg a sex, 8h as 18h, e sabado, 7h as 12h.",
        },
        { status: 409 },
      );
    }

    lesson.status = "cancelamento_solicitado";
  }

  await writeDatabase(database);

  return NextResponse.json({ ok: true });
}
