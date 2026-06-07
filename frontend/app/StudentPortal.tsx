"use client";

import Link from "next/link";
import {
  CalendarCheck,
  CreditCard,
  GraduationCap,
  LogOut,
  UserRound,
} from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
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

export default function StudentPortal({ initialData }: { initialData: StudentPortalData }) {
  const data = initialData;
  const [studentId, setStudentId] = useState(initialData.students[0]?.id ?? "");

  const student = data.students.find((item) => item.id === studentId) ?? data.students[0];

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

  if (!student) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-6 text-slate-900">
        <Panel title="Area do aluno">
          <p className="font-semibold text-slate-600">Nenhum aluno cadastrado.</p>
        </Panel>
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
            <label className="grid gap-1 text-xs font-bold text-white/75">
              Acessando como
              <select
                className="h-10 rounded-md border border-white/20 bg-white px-3 text-sm font-bold text-[#003B95] outline-none"
                onChange={(event) => {
                  setStudentId(event.target.value);
                }}
                value={student.id}
              >
                {data.students.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md bg-white/10 px-3 text-sm font-bold hover:bg-white/15"
              href="/"
            >
              <LogOut size={17} />
              Administracao
            </Link>
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
