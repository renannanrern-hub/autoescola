"use client";

import Link from "next/link";
import {
  CalendarCheck,
  CreditCard,
  GraduationCap,
  LogOut,
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

function getInstructorName(data: Database, id: string) {
  return data.instructors.find((instructor) => instructor.id === id)?.nome ?? "Instrutor";
}

function getVehicleName(data: Database, id: string) {
  return data.vehicles.find((vehicle) => vehicle.id === id)?.modelo ?? "Veiculo";
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
            cpf: String(form.get("cpf")),
            email: String(form.get("email")),
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
            Entre com CPF e e-mail cadastrados para acompanhar sua escala em tempo real.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={handleLogin}>
            <label className="grid gap-1.5 text-sm font-bold text-slate-700">
              CPF
              <input
                className="h-11 rounded-md border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#003B95] focus:ring-2 focus:ring-[#003B95]/15"
                name="cpf"
                placeholder="000.000.000-00"
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm font-bold text-slate-700">
              E-mail
              <input
                className="h-11 rounded-md border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#003B95] focus:ring-2 focus:ring-[#003B95]/15"
                name="email"
                placeholder="aluno@email.com"
                required
                type="email"
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
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md bg-white/10 px-3 text-sm font-bold hover:bg-white/15"
              href="/"
            >
              <UserRound size={17} />
              Administracao
            </Link>
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
                O aluno pode acompanhar a escala de aulas, seus dados cadastrais e os
                lancamentos financeiros.
              </p>
              <p>
                Marcacao, remarcacao e cancelamento ficam restritos ao administrador no
                modulo de aulas.
              </p>
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <Panel title="Minha escala de aulas">
            <LessonList data={data} lessons={studentLessons} />
          </Panel>

          <Panel title="Financeiro">
            <PaymentList payments={studentPayments} />
          </Panel>
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
}: {
  data: Database;
  lessons: Lesson[];
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
          </div>
        </article>
      ))}
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
