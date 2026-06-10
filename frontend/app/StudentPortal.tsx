"use client";

import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  GraduationCap,
  LogOut,
  Printer,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import type { Database, Enrollment, Lesson, Payment, Student } from "@/lib/types";

type StudentPortalData = Database;

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function StatusPill({ children }: { children: string }) {
  const tone =
    children.includes("pago") ||
    children.includes("ativo") ||
    children.includes("realizada") ||
    children.includes("agendada")
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : children.includes("cancelada") || children.includes("atrasado")
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : "bg-amber-50 text-amber-700 ring-amber-200";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tone}`}>
      {children}
    </span>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    weekday: "long",
  });
}

const weekDays = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

function formatMonth(value: Date) {
  return value.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getMonthGrid(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstGridDay = new Date(firstDay);
  firstGridDay.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDay);
    date.setDate(firstGridDay.getDate() + index);
    return date;
  });
}

function getInstructorName(data: Database, id: string) {
  return data.instructors.find((instructor) => instructor.id === id)?.nome ?? "Instrutor";
}

function getVehicleName(data: Database, id: string) {
  const vehicle = data.vehicles.find((item) => item.id === id);
  return vehicle ? `${vehicle.modelo} ${vehicle.cambio}` : "Veiculo";
}

function getReceiptDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function getLessonCardTone(status: Lesson["status"]) {
  if (status === "disponivel") {
    return {
      accent: "bg-emerald-500",
      card: "border-emerald-200 bg-emerald-50",
      text: "text-emerald-800",
    };
  }

  if (status === "agendada") {
    return {
      accent: "bg-[#003B95]",
      card: "border-blue-200 bg-blue-50",
      text: "text-[#003B95]",
    };
  }

  if (status === "cancelamento_solicitado" || status === "cancelada") {
    return {
      accent: "bg-rose-500",
      card: "border-rose-200 bg-rose-50",
      text: "text-rose-800",
    };
  }

  return {
    accent: "bg-amber-500",
    card: "border-amber-200 bg-amber-50",
    text: "text-amber-800",
  };
}

function requestJson<T>(
  url: string,
  options: { body?: unknown; method: "GET" | "POST" },
) {
  return new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(options.method, url);
    request.setRequestHeader("Content-Type", "application/json");

    request.onload = () => {
      const response = request.responseText ? JSON.parse(request.responseText) : {};

      if (request.status >= 200 && request.status < 300) {
        resolve(response as T);
        return;
      }

      reject(new Error((response as { message?: string }).message ?? "Falha no acesso."));
    };

    request.onerror = () => reject(new Error("Falha de rede."));
    request.send(options.body ? JSON.stringify(options.body) : undefined);
  });
}

export default function StudentPortal({ initialData }: { initialData: StudentPortalData }) {
  const [data, setData] = useState<StudentPortalData>(initialData);
  const [studentId, setStudentId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.sessionStorage.getItem("studentId") ?? "";
  });
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const [lessonActionId, setLessonActionId] = useState("");
  const [lessonMessage, setLessonMessage] = useState("");
  const [accessEmail, setAccessEmail] = useState("");

  const student = studentId
    ? data.students.find((item) => item.id === studentId) ?? null
    : null;

  const loadStudentData = useCallback(async (nextStudentId: string) => {
    const nextData = await requestJson<StudentPortalData>(
      `/api/student-portal?studentId=${encodeURIComponent(nextStudentId)}`,
      { method: "GET" },
    );
    setData(nextData);
    setLastUpdate(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setLoginError("");

    try {
      const form = new FormData(event.currentTarget);
      const auth = await requestJson<{ studentId: string; studentName: string }>(
        "/api/student-auth",
        {
          method: "POST",
          body: {
            email: String(form.get("email")),
            password: String(form.get("password")),
          },
        },
      );

      window.sessionStorage.setItem("studentId", auth.studentId);
      setStudentId(auth.studentId);
      await loadStudentData(auth.studentId);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Falha no acesso.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    window.sessionStorage.removeItem("studentId");
    setStudentId("");
    setData(initialData);
    setLastUpdate("");
  }

  async function handleLessonAction(
    lessonId: string,
    action: "cancel-request" | "request" | "request-cancel",
  ) {
    if (!student) {
      return;
    }

    setLessonActionId(lessonId);
    setLessonMessage("");

    try {
      await requestJson<{ ok: true }>("/api/student-lessons", {
        method: "POST",
        body: {
          action,
          lessonId,
          studentId: student.id,
        },
      });
      await loadStudentData(student.id);
      setLessonMessage("Solicitacao enviada para a administracao.");
    } catch (error) {
      setLessonMessage(error instanceof Error ? error.message : "Falha ao solicitar aula.");
    } finally {
      setLessonActionId("");
    }
  }

  useEffect(() => {
    if (studentId) {
      const timeout = window.setTimeout(() => {
        loadStudentData(studentId).catch(() => {
          window.sessionStorage.removeItem("studentId");
          setStudentId("");
        });
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [loadStudentData, studentId]);

  useEffect(() => {
    if (!studentId) {
      return;
    }

    const interval = window.setInterval(() => {
      loadStudentData(studentId).catch(() => {
        window.sessionStorage.removeItem("studentId");
        setStudentId("");
      });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [loadStudentData, studentId]);

  const studentLessons = useMemo(
    () =>
      data.lessons
        .filter((lesson) => lesson.alunoId === student?.id)
        .sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`)),
    [data.lessons, student?.id],
    
  );
  const studentPayments = data.payments.filter((payment) => payment.alunoId === student?.id);
  const studentEnrollments = data.enrollments.filter(
    (enrollment) => enrollment.alunoId === student?.id,
  );
  const openBalance = studentPayments
    .filter((payment) => payment.status !== "pago")
    .reduce((sum, payment) => sum + payment.valor, 0);

  if (studentId && !student) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-4 text-slate-900">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <RefreshCw className="mx-auto mb-4 animate-spin text-[#003B95]" size={28} />
          <h1 className="text-2xl font-black text-[#003B95]">Carregando area do aluno</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Buscando sua escala atualizada.
          </p>
        </section>
      </main>
    );
  }

  if (!student) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-4 text-slate-900">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#003B95]/70">
            Dirija Melhor
          </p>
          <h1 className="mt-2 text-3xl font-black text-[#003B95]">Area do aluno</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Entre com e-mail e senha recebidos pela autoescola para acompanhar sua escala.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={handleLogin}>
            <label className="grid gap-1.5 text-sm font-bold text-slate-700">
              E-mail
              <input
                className="h-11 rounded-md border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#003B95] focus:ring-2 focus:ring-[#003B95]/15"
                name="email"
                onChange={(event) => setAccessEmail(event.target.value)}
                required
                type="email"
                value={accessEmail}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-bold text-slate-700">
              Senha
              <input
                className="h-11 rounded-md border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#003B95] focus:ring-2 focus:ring-[#003B95]/15"
                name="password"
                required
                type="password"
              />
            </label>

            {loginError ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
                {loginError}
              </p>
            ) : null}

            <button
              className="h-11 rounded-md bg-[#003B95] text-sm font-black text-white hover:bg-[#002f78]"
              disabled={loading}
              type="submit"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b-4 border-[#FFD000] bg-[#003B95] px-4 py-4 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">
              Dirija Melhor
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#FFD000]">Area do aluno</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-10 items-center gap-2 rounded-md bg-white/10 px-3 text-sm font-bold">
              <RefreshCw size={16} />
              {lastUpdate ? `Atualizado ${lastUpdate}` : "Atualizando escala"}
            </span>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-black text-[#003B95] hover:bg-white/90"
              onClick={handleLogout}
              type="button"
            >
              <LogOut size={17} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 p-4 sm:p-6 lg:p-8">
        <section className="grid gap-4 md:grid-cols-3">
          <Metric icon={UserRound} label="Aluno" value={student.nome} />
          <Metric icon={GraduationCap} label="Aulas realizadas" value={student.aulasRealizadas} />
          <Metric icon={CreditCard} label="Saldo em aberto" value={currency.format(openBalance)} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <Panel title="Dados do aluno">
            <StudentInfo student={student} enrollments={studentEnrollments} />
          </Panel>

          <Panel title="Acesso do aluno">
            <div className="grid gap-3 text-sm font-semibold text-slate-600">
              <p>
                O aluno acompanha a escala em tempo real, visualiza horarios ocupados por
                outros alunos e solicita marcacao nos horarios disponiveis.
              </p>
              <p>
                Desmarcacao de aula marcada tambem vira solicitacao. A aprovacao final fica
                restrita ao administrador.
              </p>
              <p>
                Cada aluno pode solicitar no maximo 2 aulas por dia. O pedido de desmarque deve
                ser feito com pelo menos 24h de antecedencia.
              </p>
              <p>
                Desmarques pelo aluno funcionam apenas em horario de expediente: segunda a
                sexta, 8h as 18h, e sabado, 7h as 12h.
              </p>
            </div>
          </Panel>
        </section>

        <section>
          <Panel title="Escala em tempo real">
            <ScheduleCalendar
              data={data}
              onAction={handleLessonAction}
              pendingLessonId={lessonActionId}
              studentId={student.id}
            />
            {lessonMessage ? (
              <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
                {lessonMessage}
              </p>
            ) : null}
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <Panel title="Minha escala de aulas">
            <LessonList
              data={data}
              lessons={studentLessons}
              onAction={handleLessonAction}
              pendingLessonId={lessonActionId}
            />
          </Panel>

          <Panel title="Financeiro">
            <PaymentList payments={studentPayments} />
          </Panel>

          <div className="xl:col-span-2">
            <Panel title="Comprovante para impressao">
              <LessonReceipt lessons={studentLessons} student={student} />
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <span className="mb-4 grid size-11 place-items-center rounded-md bg-[#FFD000] text-[#003B95]">
        <Icon size={22} />
      </span>
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 truncate text-2xl font-black text-[#003B95]">{value}</p>
    </article>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-5 text-xl font-black text-[#003B95]">{title}</h2>
      {children}
    </section>
  );
}

function ScheduleMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="text-xl font-black text-[#003B95]">{value}</p>
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600">
      <span className={`size-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function StudentInfo({
  enrollments,
  student,
}: {
  enrollments: Enrollment[];
  student: Student;
}) {
  return (
    <div className="grid gap-4 text-sm">
      <InfoRow label="CPF" value={student.cpf} />
      <InfoRow label="Telefone" value={student.telefone} />
      <InfoRow label="E-mail" value={student.email} />
      <InfoRow label="Categoria" value={student.categoria} />
      <InfoRow label="Status" value={<StatusPill>{student.status}</StatusPill>} />
      <div className="border-t border-slate-100 pt-4">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          Matriculas
        </p>
        <div className="grid gap-2">
          {enrollments.map((enrollment) => (
            <div
              className="rounded-md border border-slate-200 p-3 font-semibold text-slate-700"
              key={enrollment.id}
            >
              <p>{enrollment.curso}</p>
              <p className="mt-1 text-xs text-slate-500">
                Inicio {enrollment.inicio} - {currency.format(enrollment.valor)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="font-black text-slate-800">{value}</span>
    </div>
  );
}

function LessonList({
  data,
  lessons,
  onAction,
  pendingLessonId,
}: {
  data: Database;
  lessons: Lesson[];
  onAction: (lessonId: string, action: "request-cancel") => void;
  pendingLessonId: string;
}) {
  if (!lessons.length) {
    return <p className="font-semibold text-slate-500">Nenhuma aula marcada.</p>;
  }

  return (
    <div className="grid gap-3">
      {lessons.map((lesson) => (
        <article
          className="rounded-md border border-slate-200 p-4"
          key={lesson.id}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CalendarCheck className="text-[#003B95]" size={18} />
              <p className="font-black text-slate-900">
                {lesson.data} as {lesson.hora}
              </p>
              <StatusPill>{lesson.status}</StatusPill>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {lesson.tipo} com {getInstructorName(data, lesson.instrutorId)} -{" "}
              {getVehicleName(data, lesson.veiculoId)}
            </p>
            {lesson.status === "agendada" ? (
              <button
                className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm font-black text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
                disabled={pendingLessonId === lesson.id}
                onClick={() => onAction(lesson.id, "request-cancel")}
                type="button"
              >
                {pendingLessonId === lesson.id ? "Enviando..." : "Solicitar desmarque"}
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function ScheduleCalendar({
  data,
  onAction,
  pendingLessonId,
  studentId,
}: {
  data: Database;
  onAction: (lessonId: string, action: "cancel-request" | "request") => void;
  pendingLessonId: string;
  studentId: string;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const firstLesson = data.lessons
      .slice()
      .sort((a, b) => a.data.localeCompare(b.data))[0];

    return firstLesson ? new Date(`${firstLesson.data}T00:00:00`) : new Date();
  });
  const [selectedInstructorId, setSelectedInstructorId] = useState(
    () => data.instructors[0]?.id ?? "",
  );
  const [selectedDate, setSelectedDate] = useState(() => {
    const firstLesson = data.lessons
      .slice()
      .sort((a, b) => a.data.localeCompare(b.data))[0];

    return firstLesson?.data ?? toDateKey(new Date());
  });

  const calendarDays = getMonthGrid(visibleMonth);
  const activeInstructorId = selectedInstructorId || data.instructors[0]?.id || "";
  const filteredLessons = activeInstructorId
    ? data.lessons.filter((lesson) => lesson.instrutorId === activeInstructorId)
    : data.lessons;
  const lessonsByDay = filteredLessons.reduce(
    (acc, lesson) => {
      if (!acc[lesson.data]) {
        acc[lesson.data] = [];
      }

      acc[lesson.data].push(lesson);
      return acc;
    },
    {} as Record<string, Lesson[]>,
  );
  const sortedLessons = filteredLessons
    .slice()
    .sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`));
  const visibleMonthKey = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}`;
  const monthLessons = sortedLessons.filter((lesson) => lesson.data.startsWith(visibleMonthKey));
  const availableCount = monthLessons.filter(
    (lesson) => lesson.status === "disponivel" && !lesson.alunoId,
  ).length;
  const ownMonthLessons = monthLessons.filter((lesson) => lesson.alunoId === studentId);
  const selectedDayLessons = (lessonsByDay[selectedDate] ?? []).sort((a, b) =>
    a.hora.localeCompare(b.hora),
  );
  const instructorSummary = data.instructors.map((instructor) => ({
    id: instructor.id,
    name: instructor.nome,
    total: data.lessons.filter(
      (lesson) => lesson.instrutorId === instructor.id && lesson.data.startsWith(visibleMonthKey),
    ).length,
    available: data.lessons.filter(
      (lesson) =>
        lesson.instrutorId === instructor.id &&
        lesson.data.startsWith(visibleMonthKey) &&
        lesson.status === "disponivel",
    ).length,
  }));
  const selectedInstructorName =
    data.instructors.find((instructor) => instructor.id === activeInstructorId)?.nome ??
    "Instrutor";

  function changeMonth(step: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + step, 1));
  }

  if (!data.lessons.length) {
    return <p className="font-semibold text-slate-500">Nenhum horario cadastrado.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="border-b border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Agenda de aulas</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Solicite horarios disponiveis e acompanhe sua escala.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="h-9 rounded-md bg-slate-100 px-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              onClick={() => setVisibleMonth(new Date())}
              type="button"
            >
              Hoje
            </button>
            <button
              aria-label="Mes anterior"
              className="grid size-9 place-items-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
              onClick={() => changeMonth(-1)}
              type="button"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              aria-label="Proximo mes"
              className="grid size-9 place-items-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
              onClick={() => changeMonth(1)}
              type="button"
            >
              <ChevronRight size={17} />
            </button>
            <div className="ml-1 hidden overflow-hidden rounded-md border border-slate-200 sm:flex">
              {["Mes", "Semana", "Dia", "Lista"].map((view, index) => (
                <span
                  className={`px-3 py-2 text-xs font-black ${
                    index === 0 ? "bg-slate-200 text-slate-900" : "bg-white text-slate-500"
                  }`}
                  key={view}
                >
                  {view}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-3 sm:grid-cols-3">
            <ScheduleMetric label="Horarios no mes" value={monthLessons.length} />
            <ScheduleMetric label="Disponiveis" value={availableCount} />
            <ScheduleMetric label="Minha escala" value={ownMonthLessons.length} />
          </div>
          <p className="text-center text-base font-black lowercase text-slate-700 lg:text-right">
            {formatMonth(visibleMonth)}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {instructorSummary.map((item) => (
            <button
              className={`rounded-md border px-4 py-2 text-sm font-black ${
                activeInstructorId === item.id
                  ? "border-[#003B95] bg-[#003B95] text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
              key={item.id}
              onClick={() => setSelectedInstructorId(item.id)}
              type="button"
            >
              {item.name}: {item.available}/{item.total} livres
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
          <LegendItem className="bg-emerald-600" label="Livre" />
          <LegendItem className="bg-amber-500" label="Solicitado" />
          <LegendItem className="bg-[#003B95]" label="Agendado" />
          <LegendItem className="bg-rose-600" label="Desmarque/cancelado" />
        </div>
      </div>

      <div className="grid gap-4 bg-white p-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.9fr)]">
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-black text-slate-700">
            {weekDays.map((day) => (
              <div className="border-r border-slate-200 px-2 py-3 last:border-r-0" key={day}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-white">
            {calendarDays.map((day) => {
              const dayKey = toDateKey(day);
              const dayLessons = (lessonsByDay[dayKey] ?? []).sort((a, b) =>
                a.hora.localeCompare(b.hora),
              );
              const dayAvailableCount = dayLessons.filter(
                (lesson) => lesson.status === "disponivel" && !lesson.alunoId,
              ).length;
              const dayRequestCount = dayLessons.filter((lesson) =>
                ["cancelamento_solicitado", "solicitada"].includes(lesson.status),
              ).length;
              const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
              const isToday = dayKey === toDateKey(new Date());

              return (
                <div
                  className={`min-h-[120px] border-b border-r border-slate-200 p-2 last:border-r-0 ${
                    isCurrentMonth
                      ? dayRequestCount
                        ? "bg-amber-50"
                        : dayAvailableCount
                          ? "bg-emerald-50"
                          : "bg-white"
                      : "bg-slate-100 text-slate-400"
                  } ${isToday ? "ring-2 ring-inset ring-sky-300" : ""}`}
                  key={dayKey}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-slate-400">
                      {dayLessons.length ? `${dayLessons.length} horarios` : ""}
                    </span>
                    <span className="text-sm font-black">{day.getDate()}</span>
                  </div>
                  <button
                    className={`grid min-h-20 w-full gap-2 rounded-md border px-3 py-3 text-left transition ${
                      selectedDate === dayKey
                        ? "border-[#003B95] bg-[#003B95]/5 ring-2 ring-[#003B95]/20"
                        : dayRequestCount
                          ? "border-amber-200 bg-amber-50 hover:bg-amber-100"
                          : dayAvailableCount
                            ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedDate(dayKey)}
                    type="button"
                  >
                    <span className="text-sm font-black text-slate-800">
                      {dayLessons.length ? `${dayLessons.length} horarios` : "Sem horarios"}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {
                        dayAvailableCount
                      }{" "}
                      livres
                    </span>
                    {dayRequestCount ? (
                      <span className="text-xs font-bold text-amber-700">
                        {dayRequestCount} solicitacao
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Horarios de {selectedInstructorName} em {formatDate(selectedDate)}
            </h3>
            <p className="text-xs font-semibold text-slate-500">Escolha um dia no calendario</p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">
            {selectedDayLessons.length} horarios
          </span>
        </div>
        <div className="grid max-h-[520px] gap-2 overflow-y-auto pr-1">
          {selectedDayLessons.map((lesson) => {
              const isOwn = lesson.alunoId === studentId;
              const isAvailable = lesson.status === "disponivel" && !lesson.alunoId;
              const owner = isOwn ? "Voce" : lesson.alunoId ? "Outro aluno" : "Livre";
              const tone = getLessonCardTone(lesson.status);

              return (
                <article
                  className={`relative grid gap-3 overflow-hidden rounded-md border p-3 pl-5 sm:grid-cols-[120px_1fr_auto] sm:items-center ${tone.card}`}
                  key={lesson.id}
                >
                  <span className={`absolute inset-y-0 left-0 w-1.5 ${tone.accent}`} />
                  <div>
                    <strong className="block text-sm text-slate-900">{formatDate(lesson.data)}</strong>
                    <span className={`text-lg font-black ${tone.text}`}>{lesson.hora}</span>
                  </div>
                  <div>
                    <p className="font-black text-slate-800">{owner}</p>
                    <p className="text-sm font-semibold text-slate-500">
                      {lesson.tipo} com {getInstructorName(data, lesson.instrutorId)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill>{lesson.status}</StatusPill>
                    {isAvailable ? (
                      <button
                        className="rounded-md bg-[#003B95] px-3 py-2 text-sm font-black text-white hover:bg-[#002f78]"
                        disabled={pendingLessonId === lesson.id}
                        onClick={() => onAction(lesson.id, "request")}
                        type="button"
                      >
                        {pendingLessonId === lesson.id ? "Enviando..." : "Solicitar"}
                      </button>
                    ) : null}
                    {isOwn && lesson.status === "solicitada" ? (
                      <button
                        className="rounded-md bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-200"
                        disabled={pendingLessonId === lesson.id}
                        onClick={() => onAction(lesson.id, "cancel-request")}
                        type="button"
                      >
                        {pendingLessonId === lesson.id ? "Enviando..." : "Cancelar pedido"}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
        </div>
      </div>
      </div>
    </div>
  );
}

function LessonReceipt({ lessons, student }: { lessons: Lesson[]; student: Student }) {
  const approvedLessons = lessons
    .filter((lesson) => lesson.status === "agendada" || lesson.status === "realizada")
    .slice()
    .sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`));
  const receiptRows = Array.from({ length: Math.max(10, Math.ceil(approvedLessons.length / 2)) }, (_, index) => {
    const first = approvedLessons[index * 2];
    const second = approvedLessons[index * 2 + 1];

    return { first, second };
  });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm font-semibold text-slate-500">
          O comprovante fica disponivel somente depois que o administrador aceitar a solicitacao
          das aulas.
        </p>
        {approvedLessons.length ? (
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#003B95] px-4 text-sm font-black text-white hover:bg-[#002f78]"
            onClick={() => window.print()}
            type="button"
          >
            <Printer size={17} />
            Imprimir
          </button>
        ) : null}
      </div>

      {!approvedLessons.length ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
          Nenhuma aula aceita pelo administrador ainda.
        </p>
      ) : null}

      <div className="print-receipt max-w-md rounded-md border border-slate-900 bg-white p-4 text-slate-950 shadow-sm">
        <div className="border border-slate-900 p-3 text-center">
          <p className="text-3xl font-black text-slate-800">Dirija Melhor</p>
          <p className="mt-1 inline-block bg-slate-200 px-2 py-0.5 text-xs font-black">
            Treinamento para habilitados
          </p>
          <p className="mt-4 text-sm font-semibold">Rua Conde de Bonfim, 466 Loja A - Tijuca</p>
          <p className="text-sm font-semibold">Tel.: 4104-5480 ou 3547-0060</p>
        </div>

        <div className="mt-4 border border-slate-900 py-1 text-center text-sm font-semibold">
          Marcacao de aulas
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
          <p>Aluno: {student.nome}</p>
          <p>Aulas: {approvedLessons.length}</p>
        </div>

        <table className="mt-2 w-full border-collapse text-center text-sm">
          <thead>
            <tr>
              <th className="border border-slate-900 py-2 font-semibold">Data</th>
              <th className="border border-slate-900 py-2 font-semibold">Hora</th>
              <th className="border border-slate-900 py-2 font-semibold">Data</th>
              <th className="border border-slate-900 py-2 font-semibold">Hora</th>
            </tr>
          </thead>
          <tbody>
            {receiptRows.map(({ first, second }, index) => (
              <tr key={`${first?.id ?? "empty"}-${second?.id ?? "empty"}-${index}`}>
                <td className="h-8 border border-slate-900 px-2">{first ? getReceiptDate(first.data) : ""}</td>
                <td className="h-8 border border-slate-900 px-2">{first?.hora ?? ""}</td>
                <td className="h-8 border border-slate-900 px-2">{second ? getReceiptDate(second.data) : ""}</td>
                <td className="h-8 border border-slate-900 px-2">{second?.hora ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-4 text-sm font-black">
          Obs.: Desmarcar aulas com 24 hs de antecedencia.
        </p>
      </div>
    </div>
  );
}

function PaymentList({ payments }: { payments: Payment[] }) {
  if (!payments.length) {
    return <p className="font-semibold text-slate-500">Nenhum lancamento financeiro.</p>;
  }

  return (
    <div className="grid gap-3">
      {payments.map((payment) => (
        <article
          className="flex items-center justify-between gap-4 rounded-md border border-slate-200 p-4"
          key={payment.id}
        >
          <div>
            <p className="font-black text-[#003B95]">{currency.format(payment.valor)}</p>
            <p className="text-sm font-semibold text-slate-500">Vencimento {payment.vencimento}</p>
          </div>
          <StatusPill>{payment.status}</StatusPill>
        </article>
      ))}
    </div>
  );
}
