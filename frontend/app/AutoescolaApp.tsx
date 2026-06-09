"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import type {
  CollectionName,
  DashboardStats,
  Database,
  Enrollment,
  Instructor,
  Lesson,
  Payment,
  Student,
  Vehicle,
} from "@/lib/types";
import { getStudentInitialPassword } from "@/lib/types";

type DatabaseResponse = Database & {
  stats: DashboardStats;
};

export type ModuleId =
  | "dashboard"
  | "students"
  | "lessons"
  | "enrollments"
  | "instructors"
  | "vehicles"
  | "payments";

type EditableItem = Student | Instructor | Vehicle | Enrollment | Lesson | Payment;

const navItems = [
  { id: "dashboard", label: "Administracao", icon: LayoutDashboard },
  { id: "students", label: "Alunos", icon: GraduationCap },
  { id: "lessons", label: "Aulas", icon: CalendarCheck },
  { id: "enrollments", label: "Matriculas", icon: ClipboardList },
  { id: "instructors", label: "Instrutores", icon: Users },
  { id: "vehicles", label: "Veiculos", icon: Car },
  { id: "payments", label: "Financeiro", icon: CreditCard },
] satisfies Array<{ id: ModuleId; label: string; icon: typeof LayoutDashboard }>;

const moduleTitles: Record<ModuleId, string> = {
  dashboard: "Painel da autoescola",
  students: "Consulta de alunos",
  lessons: "Agenda de aulas",
  enrollments: "Matriculas",
  instructors: "Instrutores",
  vehicles: "Frota",
  payments: "Financeiro",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

async function fetchDatabase() {
  return requestJson<DatabaseResponse>("/api/database", { method: "GET" });
}

function requestJson<T>(
  url: string,
  options: { body?: unknown; method: "DELETE" | "GET" | "POST" | "PUT" },
) {
  return new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(options.method, url);
    request.setRequestHeader("Content-Type", "application/json");

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.responseText ? (JSON.parse(request.responseText) as T) : ({} as T));
        return;
      }

      reject(new Error(`Erro ${request.status}`));
    };

    request.onerror = () => reject(new Error("Falha de rede."));
    request.send(options.body ? JSON.stringify(options.body) : undefined);
  });
}

function getStudentName(students: Student[], id: string) {
  return students.find((student) => student.id === id)?.nome ?? "Aluno removido";
}

function getInstructorName(instructors: Instructor[], id: string) {
  return instructors.find((instructor) => instructor.id === id)?.nome ?? "Instrutor";
}

function getVehicleName(vehicles: Vehicle[], id: string) {
  const vehicle = vehicles.find((item) => item.id === id);
  return vehicle ? `${vehicle.modelo} ${vehicle.cambio}` : "Veiculo";
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

function getLessonStudentName(students: Student[], lesson: Lesson) {
  return lesson.alunoId ? getStudentName(students, lesson.alunoId) : "Horario disponivel";
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    weekday: "long",
    year: "numeric",
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

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function StatusPill({ children }: { children: string }) {
  const tone =
    children.includes("pago") ||
    children.includes("ativo") ||
    children.includes("disponivel") ||
    children.includes("agendada") ||
    children.includes("realizada")
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : children.includes("atrasado") ||
          children.includes("cancelada") ||
          children.includes("manutencao") ||
          children.includes("inativo")
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : "bg-amber-50 text-amber-700 ring-amber-200";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tone}`}>
      {children}
    </span>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      <input
        className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal outline-none transition focus:border-[#003B95] focus:ring-2 focus:ring-[#003B95]/15"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      <select
        className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal outline-none transition focus:border-[#003B95] focus:ring-2 focus:ring-[#003B95]/15"
        defaultValue={defaultValue}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActionButton({
  children,
  icon: Icon,
  tone = "primary",
  type = "button",
  onClick,
}: {
  children: ReactNode;
  icon: typeof Plus;
  tone?: "primary" | "muted" | "danger";
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  const className =
    tone === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : tone === "muted"
        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
        : "bg-[#003B95] text-white hover:bg-[#002f78]";

  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition ${className}`}
      onClick={onClick}
      type={type}
    >
      <Icon size={17} />
      {children}
    </button>
  );
}

export default function AutoescolaApp({
  initialData,
  initialModule,
}: {
  initialData: DatabaseResponse;
  initialModule: ModuleId;
}) {
  const [data, setData] = useState<DatabaseResponse>(initialData);
  const [activeModule, setActiveModule] = useState<ModuleId>(initialModule);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<EditableItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    const nextData = await fetchDatabase();
    setData(nextData);
    setLoading(false);
  }

  async function save(collection: CollectionName, payload: Record<string, string | number>) {
    setSaving(true);
    const method = payload.id ? "PUT" : "POST";
    await requestJson(`/api/collections/${collection}`, {
      method,
      body: payload,
    });
    await loadData();
    setEditing(null);
    setSaving(false);
  }

  async function remove(collection: CollectionName, id: string) {
    setSaving(true);
    await requestJson(`/api/collections/${collection}?id=${id}`, { method: "DELETE" });
    await loadData();
    setSaving(false);
  }

  function approveLessonRequest(lesson: Lesson) {
    save("lessons", {
      id: lesson.id,
      status: "agendada",
    });
  }

  function releaseLesson(lesson: Lesson) {
    save("lessons", {
      id: lesson.id,
      alunoId: "",
      status: "disponivel",
    });
  }

  function handleInstructorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = editing as Instructor | null;

    save("instructors", {
      id: current?.id ?? "",
      nome: String(form.get("nome")),
      telefone: String(form.get("telefone")),
      categorias: String(form.get("categorias")),
      status: String(form.get("status")),
    });
    event.currentTarget.reset();
  }

  function handleVehicleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = editing as Vehicle | null;

    save("vehicles", {
      id: current?.id ?? "",
      modelo: String(form.get("modelo")),
      placa: String(form.get("placa")),
      categoria: String(form.get("categoria")),
      cambio: String(form.get("cambio")),
      status: String(form.get("status")),
    });
    event.currentTarget.reset();
  }

  async function handleEnrollmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = editing as Enrollment | null;

    setSaving(true);
    await requestJson("/api/enrollment-registration", {
      method: "POST",
      body: {
        id: current?.id ?? "",
        nome: String(form.get("nome")),
        cpf: String(form.get("cpf")),
        email: String(form.get("email")),
        endereco: String(form.get("endereco")),
        cambioPreferido: String(form.get("cambioPreferido")),
        aulasContratadas: Number(form.get("aulasContratadas") || 0),
        enrollmentStatus: String(form.get("enrollmentStatus")),
      },
    });
    await loadData();
    setEditing(null);
    setSaving(false);
    event.currentTarget.reset();
  }

  function handleLessonSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = editing as Lesson | null;

    save("lessons", {
      id: current?.id ?? "",
      alunoId: String(form.get("alunoId") ?? ""),
      instrutorId: String(form.get("instrutorId")),
      veiculoId: String(form.get("veiculoId")),
      data: String(form.get("data")),
      hora: String(form.get("hora")),
      tipo: String(form.get("tipo")),
      status: String(form.get("status")),
    });
    event.currentTarget.reset();
  }

  function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = editing as Payment | null;

    save("payments", {
      id: current?.id ?? "",
      alunoId: String(form.get("alunoId")),
      vencimento: String(form.get("vencimento")),
      valor: Number(form.get("valor") || 0),
      status: String(form.get("status")),
    });
    event.currentTarget.reset();
  }

  const filteredStudents = useMemo(() => {
    const term = normalize(query);
    return data.students.filter((student) =>
      normalize(`${student.nome} ${student.cpf} ${student.email} ${student.endereco ?? ""}`).includes(
        term,
      ),
    );
  }, [data.students, query]);

  const todayLessons = data.lessons.filter(
    (lesson) => lesson.data === new Date().toISOString().slice(0, 10),
  );

  const pendingPayments = data.payments.filter((payment) => payment.status !== "pago");

  const aulasAgrupadas = data.lessons
    .slice()
    .sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`))
    .reduce(
      (acc, lesson) => {
        if (!acc[lesson.data]) {
          acc[lesson.data] = [];
        }

        acc[lesson.data].push(lesson);

        return acc;
      },
      {} as Record<string, Lesson[]>,
    );
  return (
    <main className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="hidden w-72 shrink-0 bg-[#003B95] p-5 text-white lg:flex lg:flex-col">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/65">
            Dirija Melhor
          </p>
          <h1 className="mt-2 text-4xl font-black leading-none text-[#FFD000]">
            Autoescola
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/75">
            Gestao de alunos, aulas, frota e financeiro.
          </p>
        </div>

        <nav className="grid gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.id;

            return (
              <Link
                className={`flex h-12 items-center gap-3 rounded-md px-3 text-left text-sm font-bold transition ${
                  active
                    ? "bg-[#FFD000] text-[#003B95]"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
                href={item.id === "dashboard" ? "/" : `/?mod=${item.id}`}
                key={item.id}
                onClick={() => {
                  setActiveModule(item.id);
                  setEditing(null);
                  setQuery("");
                }}
              >
                <Icon size={19} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          className="mt-4 flex h-12 items-center gap-3 rounded-md border border-white/15 px-3 text-sm font-bold text-white/85 hover:bg-white/10 hover:text-white"
          href="/alunos"
        >
          <User size={19} />
          Area do aluno
        </Link>

        <button
          className="mt-auto flex h-12 items-center gap-3 rounded-md px-3 text-sm font-bold text-white/80 hover:bg-white/10"
          type="button"
        >
          <LogOut size={19} />
          Sair
        </button>
      </aside>

      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between border-b-4 border-[#003B95] bg-[#FFD000] px-4 shadow-sm sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="grid size-11 place-items-center rounded-md bg-white text-[#003B95] shadow-sm lg:hidden"
              type="button"
            >
              <Menu size={21} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs font-black uppercase tracking-[0.18em] text-[#003B95]/70">
                Sistema Dirija Melhor
              </p>
              <h2 className="truncate text-xl font-black text-[#003B95]">
                {moduleTitles[activeModule]}
              </h2>
            </div>
          </div>

          <div className="hidden items-center gap-5 text-sm font-bold text-[#003B95] md:flex">
            <span>{data.stats.aulasHoje} aulas hoje</span>
            <span>{data.stats.veiculosDisponiveis} veiculos livres</span>
            <button className="flex items-center gap-2" type="button">
              <span className="grid size-10 place-items-center rounded-full bg-[#003B95] text-white">
                <User size={19} />
              </span>
              Administrador
            </button>
          </div>
        </header>

        <div className="grid gap-6 p-4 sm:p-6 lg:p-8">
          <section className="relative min-h-[260px] overflow-hidden rounded-lg bg-[#003B95] text-white shadow-sm">
            <Image
              alt="Carro de treinamento da Dirija Melhor"
              className="object-cover opacity-35"
              fill
              priority
              src="/FOTO CARRO.png"
            />
            <div className="absolute inset-0 bg-[#003B95]/35" />
            <div className="relative z-10 flex min-h-[260px] flex-col justify-end p-6 sm:p-8">
              <div className="max-w-3xl">
                <p className="mb-3 inline-flex rounded-md bg-[#FFD000] px-3 py-1 text-sm font-black text-[#003B95]">
                  Operacao em tempo real
                </p>
                <h2 className="text-3xl font-black leading-tight sm:text-5xl">
                  Controle completo da autoescola
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">
                  Organize cadastros, aulas, veiculos, matriculas e recebimentos em
                  um unico painel.
                </p>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="rounded-lg bg-white p-8 text-center font-bold text-slate-600 shadow-sm">
              Carregando sistema...
            </div>
          ) : null}

          {activeModule === "dashboard" ? (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <Metric icon={GraduationCap} label="Alunos ativos" value={data.stats.alunosAtivos} />
                <Metric icon={CalendarDays} label="Aulas hoje" value={data.stats.aulasHoje} />
                <Metric
                  icon={Car}
                  label="Veiculos livres"
                  value={data.stats.veiculosDisponiveis}
                />
                <Metric
                  icon={CreditCard}
                  label="Receita paga"
                  value={currency.format(data.stats.receitaRecebida)}
                />
                <Metric
                  icon={BadgeCheck}
                  label="Pendencias"
                  value={data.stats.pendenciasFinanceiras}
                />
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <Panel title="Agenda de hoje">
                  <div className="grid gap-3">
                    {todayLessons.map((lesson) => (
                      <div
                        className="grid gap-3 rounded-md border border-slate-200 p-4 sm:grid-cols-[90px_1fr_auto] sm:items-center"
                        key={lesson.id}
                      >
                        <strong className="text-lg text-[#003B95]">{lesson.hora}</strong>
                        <div>
                          <p className="font-bold">
                            {getLessonStudentName(data.students, lesson)}
                          </p>
                          <p className="text-sm text-slate-500">
                            {getInstructorName(data.instructors, lesson.instrutorId)} com{" "}
                            {getVehicleName(data.vehicles, lesson.veiculoId)}
                          </p>
                        </div>
                        <StatusPill>{lesson.status}</StatusPill>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel title="Financeiro em aberto">
                  <div className="grid gap-3">
                    {pendingPayments.map((payment) => (
                      <div
                        className="flex items-center justify-between gap-4 rounded-md border border-slate-200 p-4"
                        key={payment.id}
                      >
                        <div>
                          <p className="font-bold">
                            {getStudentName(data.students, payment.alunoId)}
                          </p>
                          <p className="text-sm text-slate-500">
                            Vence em {payment.vencimento}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-[#003B95]">
                            {currency.format(payment.valor)}
                          </p>
                          <StatusPill>{payment.status}</StatusPill>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </section>
            </>
          ) : null}

          {activeModule === "students" ? (
            <Panel
              action={
                <SearchBox
                  onChange={setQuery}
                  placeholder="Pesquisar por nome, CPF, e-mail ou endereco"
                  value={query}
                />
              }
              title="Alunos cadastrados"
            >
              <Table
                headers={[
                  "Nome",
                  "CPF",
                  "E-mail",
                  "Endereco",
                  "Carro",
                  "Aulas",
                  "Acesso",
                  "Status",
                ]}
                rows={filteredStudents.map((student) => {
                  const enrollment = data.enrollments.find(
                    (item) => item.alunoId === student.id,
                  );

                  return [
                    student.nome,
                    student.cpf,
                    student.email,
                    student.endereco ?? "-",
                    enrollment?.cambioPreferido ?? "-",
                    enrollment?.aulasContratadas ?? "-",
                    <StudentAccessCell key="access" student={student} />,
                    <StatusPill key="status">{student.status}</StatusPill>,
                  ];
                })}
              />
            </Panel>
          ) : null}

          {activeModule === "lessons" ? (
            <Panel title="Agenda e aulas">
              <LessonForm
                data={data}
                editing={editing as Lesson | null}
                onCancel={() => setEditing(null)}
                onSubmit={handleLessonSubmit}
                saving={saving}
              />
              <AdminScheduleCalendar
                data={data}
                lessons={data.lessons}
                onApprove={approveLessonRequest}
                onEdit={setEditing}
                onKeep={approveLessonRequest}
                onRelease={releaseLesson}
              />
              <div className="hidden">
                {Object.entries(aulasAgrupadas).map(([dataAula, aulas]) => (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={dataAula}>
                    <h3 className="mb-4 text-lg font-black text-[#003B95]">
                      {formatDate(dataAula)}
                    </h3>

                    <div className="grid gap-3">
                      {aulas.map((lesson) => (
                        <div
                          className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-[90px_1fr_auto] lg:items-center"
                          key={lesson.id}
                        >
                          <strong className="text-lg text-[#003B95]">{lesson.hora}</strong>
                          <div>
                            <p className="font-black text-slate-800">
                              {getLessonStudentName(data.students, lesson)}
                            </p>
                            <p className="text-sm font-semibold text-slate-500">
                              {getInstructorName(data.instructors, lesson.instrutorId)} -{" "}
                              {getVehicleName(data.vehicles, lesson.veiculoId)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill>{lesson.status}</StatusPill>
                            <AdminLessonActions
                              lesson={lesson}
                              onApprove={() => approveLessonRequest(lesson)}
                              onEdit={() => setEditing(lesson)}
                              onKeep={() => approveLessonRequest(lesson)}
                              onRelease={() => releaseLesson(lesson)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/*
<div className="mb-8 space-y-6">

  {Object.entries(aulasAgrupadas).map(([dataAula, aulas]) => (

    <div
      key={dataAula}
      className="rounded-xl border border-slate-200 bg-slate-50 p-5"
    >
      <h3 className="mb-4 text-xl font-bold text-[#003B95]">
        📅 {new Date(dataAula).toLocaleDateString("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})}
      </h3>

      <div className="grid gap-3">

        {aulas.map((lesson) => (

          <div
            key={lesson.id}
            className="flex items-center justify-between rounded-lg border bg-white p-4"
          >
            <div>

              <p className="text-lg font-bold">
                {lesson.hora}
              </p>

              <p className="text-slate-600">
                {lesson.alunoId
                  ? getStudentName(data.students, lesson.alunoId)
                  : "Horário disponível"}
              </p>

            </div>

            <div className="flex items-center gap-3">

  <StatusPill>
    {lesson.status}
  </StatusPill>


</div>

          </div>

        ))}

      </div>

    </div>

  ))}

</div>
              */}
              <Table
                headers={["Data", "Hora", "Aluno", "Instrutor", "Veiculo", "Status", "Acoes"]}
                rows={data.lessons.map((lesson) => [
                  lesson.data,
                  lesson.hora,
                  getLessonStudentName(data.students, lesson),
                  getInstructorName(data.instructors, lesson.instrutorId),
                  getVehicleName(data.vehicles, lesson.veiculoId),
                  <StatusPill key="status">{lesson.status}</StatusPill>,
                  <div className="flex items-center gap-2" key="actions">
                    <AdminLessonActions
                      lesson={lesson}
                      onApprove={() => approveLessonRequest(lesson)}
                      onEdit={() => setEditing(lesson)}
                      onKeep={() => approveLessonRequest(lesson)}
                      onRelease={() => releaseLesson(lesson)}
                    />
                    <button
                      aria-label="Excluir"
                      className="grid size-9 place-items-center rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200"
                      onClick={() => remove("lessons", lesson.id)}
                      title="Excluir"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>,
                ])}
              />
            </Panel>
          ) : null}

          {activeModule === "enrollments" ? (
            <Panel title="Matriculas">
              <EnrollmentForm
                data={data}
                editing={editing as Enrollment | null}
                onCancel={() => setEditing(null)}
                onSubmit={handleEnrollmentSubmit}
                saving={saving}
              />
              <Table
                headers={["Aluno", "E-mail", "CPF", "Carro", "Aulas", "Status", "Acoes"]}
                rows={data.enrollments.map((enrollment) => {
                  const student = data.students.find((item) => item.id === enrollment.alunoId);

                  return [
                    student?.nome ?? "Aluno removido",
                    student?.email ?? "-",
                    student?.cpf ?? "-",
                    enrollment.cambioPreferido ?? "-",
                    enrollment.aulasContratadas ?? "-",
                    <StatusPill key="status">{enrollment.status}</StatusPill>,
                    <RowActions
                      key="actions"
                      onDelete={() => remove("enrollments", enrollment.id)}
                      onEdit={() => setEditing(enrollment)}
                    />,
                  ];
                })}
              />
            </Panel>
          ) : null}

          {activeModule === "instructors" ? (
            <Panel title="Instrutores">
              <InstructorForm
                editing={editing as Instructor | null}
                onCancel={() => setEditing(null)}
                onSubmit={handleInstructorSubmit}
                saving={saving}
              />
              <Table
                headers={["Nome", "Telefone", "Categorias", "Status", "Acoes"]}
                rows={data.instructors.map((instructor) => [
                  instructor.nome,
                  instructor.telefone,
                  instructor.categorias,
                  <StatusPill key="status">{instructor.status}</StatusPill>,
                  <RowActions
                    key="actions"
                    onDelete={() => remove("instructors", instructor.id)}
                    onEdit={() => setEditing(instructor)}
                  />,
                ])}
              />
            </Panel>
          ) : null}

          {activeModule === "vehicles" ? (
            <Panel title="Veiculos">
              <VehicleForm
                editing={editing as Vehicle | null}
                onCancel={() => setEditing(null)}
                onSubmit={handleVehicleSubmit}
                saving={saving}
              />
              <Table
                headers={["Modelo", "Placa", "Categoria", "Cambio", "Status", "Acoes"]}
                rows={data.vehicles.map((vehicle) => [
                  vehicle.modelo,
                  vehicle.placa,
                  vehicle.categoria,
                  vehicle.cambio,
                  <StatusPill key="status">{vehicle.status}</StatusPill>,
                  <RowActions
                    key="actions"
                    onDelete={() => remove("vehicles", vehicle.id)}
                    onEdit={() => setEditing(vehicle)}
                  />,
                ])}
              />
            </Panel>
          ) : null}

          {activeModule === "payments" ? (
            <Panel title="Financeiro">
              <PaymentForm
                data={data}
                editing={editing as Payment | null}
                onCancel={() => setEditing(null)}
                onSubmit={handlePaymentSubmit}
                saving={saving}
              />
              <Table
                headers={["Aluno", "Vencimento", "Valor", "Status", "Acoes"]}
                rows={data.payments.map((payment) => [
                  getStudentName(data.students, payment.alunoId),
                  payment.vencimento,
                  currency.format(payment.valor),
                  <StatusPill key="status">{payment.status}</StatusPill>,
                  <RowActions
                    key="actions"
                    onDelete={() => remove("payments", payment.id)}
                    onEdit={() => setEditing(payment)}
                  />,
                ])}
              />
            </Panel>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <span className="grid size-11 place-items-center rounded-md bg-[#003B95]/10 text-[#003B95]">
          <Icon size={22} />
        </span>
        <CheckCircle2 className="text-emerald-500" size={20} />
      </div>
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-[#003B95]">{value}</p>
    </article>
  );
}

function Panel({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-black text-[#003B95]">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function SearchBox({
  onChange,
  placeholder,
  value,
}: {
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="relative block w-full sm:w-80">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input
        className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-[#003B95] focus:ring-2 focus:ring-[#003B95]/15"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<ReactNode>>;
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full min-w-[760px] border-collapse bg-white text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
          <tr>
            {headers.map((header) => (
              <th className="border-b border-slate-200 px-4 py-3 font-black" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, rowIndex) => (
              <tr className="border-b border-slate-100 last:border-0" key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td className="px-4 py-3 align-middle font-medium text-slate-700" key={cellIndex}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-8 text-center font-bold text-slate-500" colSpan={headers.length}>
                Nenhum registro encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StudentAccessCell({ student }: { student: Student }) {
  const accessPath = `/alunos?email=${encodeURIComponent(student.email)}`;
  const initialPassword = getStudentInitialPassword(student);

  function copyAccess() {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const text = `Link de acesso: ${origin}${accessPath}\nSenha inicial: ${initialPassword}`;
    navigator.clipboard?.writeText(text);
  }

  return (
    <div className="grid gap-2 text-xs font-bold text-slate-600">
      <a className="font-black text-[#003B95] hover:underline" href={accessPath}>
        Link do aluno
      </a>
      <span>
        Senha: <strong className="text-slate-900">{initialPassword}</strong>
      </span>
      <button
        className="w-fit rounded-md bg-slate-100 px-2 py-1 font-black text-slate-700 hover:bg-slate-200"
        onClick={copyAccess}
        type="button"
      >
        Copiar acesso
      </button>
    </div>
  );
}

function RowActions({
  onCancel,
  onDelete,
  onEdit,
}: {
  onCancel?: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="Editar"
        className="grid size-9 place-items-center rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200"
        onClick={onEdit}
        title="Editar"
        type="button"
      >
        <Pencil size={16} />
      </button>
      {onCancel ? (
        <button
          aria-label="Desmarcar"
          className="grid size-9 place-items-center rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200"
          onClick={onCancel}
          title="Desmarcar"
          type="button"
        >
          <XCircle size={16} />
        </button>
      ) : null}
      <button
        aria-label="Excluir"
        className="grid size-9 place-items-center rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200"
        onClick={onDelete}
        title="Excluir"
        type="button"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function AdminScheduleCalendar({
  data,
  lessons,
  onApprove,
  onEdit,
  onKeep,
  onRelease,
}: {
  data: Database;
  lessons: Lesson[];
  onApprove: (lesson: Lesson) => void;
  onEdit: (lesson: Lesson) => void;
  onKeep: (lesson: Lesson) => void;
  onRelease: (lesson: Lesson) => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const firstLesson = lessons.slice().sort((a, b) => a.data.localeCompare(b.data))[0];
    return firstLesson ? new Date(`${firstLesson.data}T00:00:00`) : new Date();
  });
  const [selectedInstructorId, setSelectedInstructorId] = useState(
    () => data.instructors[0]?.id ?? "",
  );
  const [selectedDate, setSelectedDate] = useState(() => {
    const firstLesson = lessons.slice().sort((a, b) => a.data.localeCompare(b.data))[0];
    return firstLesson?.data ?? toDateKey(new Date());
  });
  const calendarDays = getMonthGrid(visibleMonth);
  const filteredLessons = selectedInstructorId
    ? lessons.filter((lesson) => lesson.instrutorId === selectedInstructorId)
    : lessons;
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
  const visibleMonthKey = `${visibleMonth.getFullYear()}-${String(
    visibleMonth.getMonth() + 1,
  ).padStart(2, "0")}`;
  const monthLessons = sortedLessons.filter((lesson) => lesson.data.startsWith(visibleMonthKey));
  const availableCount = monthLessons.filter((lesson) => lesson.status === "disponivel").length;
  const requestedCount = monthLessons.filter((lesson) =>
    ["cancelamento_solicitado", "solicitada"].includes(lesson.status),
  ).length;
  const selectedDayLessons = (lessonsByDay[selectedDate] ?? []).sort((a, b) =>
    a.hora.localeCompare(b.hora),
  );
  const instructorSummary = data.instructors.map((instructor) => ({
    id: instructor.id,
    name: instructor.nome,
    total: lessons.filter(
      (lesson) => lesson.instrutorId === instructor.id && lesson.data.startsWith(visibleMonthKey),
    ).length,
    available: lessons.filter(
      (lesson) =>
        lesson.instrutorId === instructor.id &&
        lesson.data.startsWith(visibleMonthKey) &&
        lesson.status === "disponivel",
    ).length,
  }));
  const selectedInstructorName =
    data.instructors.find((instructor) => instructor.id === selectedInstructorId)?.nome ??
    "Instrutor";

  function changeMonth(step: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + step, 1));
  }

  return (
    <div className="mb-8 overflow-hidden rounded-lg border border-slate-200">
      <div className="border-b border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Agenda de aulas</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Gerencie horarios, solicitacoes e desmarcacoes.
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
            <AdminScheduleMetric label="Horarios no mes" value={monthLessons.length} />
            <AdminScheduleMetric label="Disponiveis" value={availableCount} />
            <AdminScheduleMetric label="Solicitacoes" value={requestedCount} />
          </div>
          <p className="text-center text-base font-black lowercase text-slate-700 lg:text-right">
            {formatMonth(visibleMonth)}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {instructorSummary.map((item) => (
            <button
              className={`rounded-md border px-4 py-2 text-sm font-black ${
                selectedInstructorId === item.id
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
          <AdminLegendItem className="bg-emerald-600" label="Livre" />
          <AdminLegendItem className="bg-amber-500" label="Solicitado" />
          <AdminLegendItem className="bg-[#003B95]" label="Agendado" />
          <AdminLegendItem className="bg-rose-600" label="Desmarque/cancelado" />
        </div>
      </div>

      <div className="grid gap-4 bg-white p-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(420px,0.9fr)]">
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
                (lesson) => lesson.status === "disponivel",
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
                      {dayLessons.length ? `${dayLessons.length} horarios de ${selectedInstructorName}` : ""}
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
                      {dayAvailableCount} livres
                    </span>
                    <span className="text-xs font-bold text-amber-600">
                      {
                        dayRequestCount
                      }{" "}
                      solicitacoes
                    </span>
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
            <p className="text-xs font-semibold text-slate-500">
              Clique em um dia no calendario para administrar os horarios.
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">
            {selectedDayLessons.length} horarios
          </span>
        </div>
        <div className="grid gap-2 lg:grid-cols-2">
          {selectedDayLessons.map((lesson) => {
            const tone = getLessonCardTone(lesson.status);

            return (
              <article
                className={`relative grid gap-3 overflow-hidden rounded-md border p-3 pl-5 sm:grid-cols-[90px_1fr_auto] sm:items-center ${tone.card}`}
                key={lesson.id}
              >
                <span className={`absolute inset-y-0 left-0 w-1.5 ${tone.accent}`} />
                <strong className={`text-lg ${tone.text}`}>{lesson.hora}</strong>
                <div>
                  <p className="font-black text-slate-800">
                    {getLessonStudentName(data.students, lesson)}
                  </p>
                  <p className="text-sm font-semibold text-slate-500">
                    {getVehicleName(data.vehicles, lesson.veiculoId)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill>{lesson.status}</StatusPill>
                  <AdminLessonActions
                    lesson={lesson}
                    onApprove={() => onApprove(lesson)}
                    onEdit={() => onEdit(lesson)}
                    onKeep={() => onKeep(lesson)}
                    onRelease={() => onRelease(lesson)}
                  />
                </div>
              </article>
            );
          })}
          {!selectedDayLessons.length ? (
            <p className="rounded-md border border-slate-200 p-4 font-semibold text-slate-500">
              Nenhum horario para este instrutor neste dia.
            </p>
          ) : null}
        </div>
      </div>
      </div>
    </div>
  );
}

function AdminScheduleMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="text-xl font-black text-[#003B95]">{value}</p>
    </div>
  );
}

function AdminLegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600">
      <span className={`size-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function AdminLessonActions({
  compact = false,
  lesson,
  onApprove,
  onEdit,
  onKeep,
  onRelease,
}: {
  compact?: boolean;
  lesson: Lesson;
  onApprove: () => void;
  onEdit: () => void;
  onKeep: () => void;
  onRelease: () => void;
}) {
  const textSize = compact ? "text-[10px]" : "text-xs";
  const buttonHeight = compact ? "min-h-7" : "h-9";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {lesson.status === "solicitada" ? (
        <button
          className={`inline-flex ${buttonHeight} items-center gap-1 rounded-md bg-emerald-100 px-2 font-black text-emerald-700 hover:bg-emerald-200 ${textSize}`}
          onClick={onApprove}
          type="button"
        >
          <CheckCircle2 size={15} />
          Aprovar
        </button>
      ) : null}
      {lesson.status === "cancelamento_solicitado" ? (
        <button
          className={`inline-flex ${buttonHeight} items-center gap-1 rounded-md bg-emerald-100 px-2 font-black text-emerald-700 hover:bg-emerald-200 ${textSize}`}
          onClick={onRelease}
          type="button"
        >
          <CheckCircle2 size={15} />
          Liberar
        </button>
      ) : null}
      {lesson.status === "cancelamento_solicitado" ? (
        <button
          className={`inline-flex ${buttonHeight} items-center gap-1 rounded-md bg-slate-100 px-2 font-black text-slate-700 hover:bg-slate-200 ${textSize}`}
          onClick={onKeep}
          type="button"
        >
          <XCircle size={15} />
          Manter
        </button>
      ) : null}
      {lesson.status === "agendada" ? (
        <button
          className={`inline-flex ${buttonHeight} items-center gap-1 rounded-md bg-orange-100 px-2 font-black text-orange-700 hover:bg-orange-200 ${textSize}`}
          onClick={onRelease}
          type="button"
        >
          <XCircle size={15} />
          Desmarcar
        </button>
      ) : null}
      <button
        aria-label="Editar"
        className={`${compact ? "size-7" : "size-9"} grid place-items-center rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200`}
        onClick={onEdit}
        title="Editar"
        type="button"
      >
        <Pencil size={16} />
      </button>
    </div>
  );
}

function FormShell({
  children,
  editing,
  onCancel,
  saving,
}: {
  children: ReactNode;
  editing: boolean;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton icon={Plus} type="submit">
          {saving ? "Salvando..." : editing ? "Atualizar" : "Cadastrar"}
        </ActionButton>
        {editing ? (
          <ActionButton icon={Trash2} onClick={onCancel} tone="muted">
            Cancelar
          </ActionButton>
        ) : null}
      </div>
    </div>
  );
}

function InstructorForm({
  editing,
  onCancel,
  onSubmit,
  saving,
}: {
  editing: Instructor | null;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  return (
    <form onSubmit={onSubmit}>
      <FormShell editing={Boolean(editing)} onCancel={onCancel} saving={saving}>
        <Field defaultValue={editing?.nome} label="Nome" name="nome" />
        <Field defaultValue={editing?.telefone} label="Telefone" name="telefone" />
        <Field defaultValue={editing?.categorias} label="Categorias" name="categorias" />
        <SelectField
          defaultValue={editing?.status ?? "ativo"}
          label="Status"
          name="status"
          options={["ativo", "ferias", "inativo"].map((value) => ({ label: value, value }))}
        />
      </FormShell>
    </form>
  );
}

function VehicleForm({
  editing,
  onCancel,
  onSubmit,
  saving,
}: {
  editing: Vehicle | null;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  return (
    <form onSubmit={onSubmit}>
      <FormShell editing={Boolean(editing)} onCancel={onCancel} saving={saving}>
        <Field defaultValue={editing?.modelo} label="Modelo" name="modelo" />
        <Field defaultValue={editing?.placa} label="Placa" name="placa" />
        <SelectField
          defaultValue={editing?.cambio ?? "manual"}
          label="Cambio"
          name="cambio"
          options={[
            { label: "manual", value: "manual" },
            { label: "automatico", value: "automatico" },
          ]}
        />
        <SelectField
          defaultValue={editing?.categoria ?? "B"}
          label="Categoria"
          name="categoria"
          options={[{ label: "B", value: "B" }]}
        />
        <SelectField
          defaultValue={editing?.status ?? "disponivel"}
          label="Status"
          name="status"
          options={["disponivel", "aula", "manutencao"].map((value) => ({
            label: value,
            value,
          }))}
        />
      </FormShell>
    </form>
  );
}

function EnrollmentForm({
  data,
  editing,
  onCancel,
  onSubmit,
  saving,
}: {
  data: Database;
  editing: Enrollment | null;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  const student = data.students.find((item) => item.id === editing?.alunoId) ?? null;

  return (
    <form onSubmit={onSubmit}>
      <FormShell editing={Boolean(editing)} onCancel={onCancel} saving={saving}>
        <Field defaultValue={student?.nome} label="Nome completo" name="nome" />
        <Field defaultValue={student?.email} label="E-mail" name="email" type="email" />
        <Field defaultValue={student?.cpf} label="CPF" name="cpf" />
        <Field defaultValue={student?.endereco} label="Endereco" name="endereco" />
        <SelectField
          defaultValue={editing?.cambioPreferido ?? "manual"}
          label="Opcao de carro"
          name="cambioPreferido"
          options={[
            { label: "manual", value: "manual" },
            { label: "automatico", value: "automatico" },
          ]}
        />
        <Field
          defaultValue={editing?.aulasContratadas ?? 0}
          label="Aulas contratadas"
          name="aulasContratadas"
          type="number"
        />
        <SelectField
          defaultValue={editing?.status ?? "ativo"}
          label="Status da matricula"
          name="enrollmentStatus"
          options={["ativo", "pendente", "concluido", "cancelado"].map((value) => ({
            label: value,
            value,
          }))}
        />
      </FormShell>
    </form>
  );
}

function LessonForm({
  data,
  editing,
  onCancel,
  onSubmit,
  saving,
}: {
  data: Database;
  editing: Lesson | null;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  return (
    <form onSubmit={onSubmit}>
      <FormShell editing={Boolean(editing)} onCancel={onCancel} saving={saving}>
        <SelectField
          defaultValue={editing?.alunoId ?? data.students[0]?.id}
          label="Aluno"
          name="alunoId"
          options={data.students.map((student) => ({ label: student.nome, value: student.id }))}
        />
        <SelectField
          defaultValue={editing?.instrutorId ?? data.instructors[0]?.id}
          label="Instrutor"
          name="instrutorId"
          options={data.instructors.map((instructor) => ({
            label: instructor.nome,
            value: instructor.id,
          }))}
        />
        <SelectField
          defaultValue={editing?.veiculoId ?? data.vehicles[0]?.id}
          label="Veiculo"
          name="veiculoId"
          options={data.vehicles.map((vehicle) => ({ label: vehicle.modelo, value: vehicle.id }))}
        />
        <Field defaultValue={editing?.data} label="Data" name="data" type="date" />
        <Field defaultValue={editing?.hora} label="Hora" name="hora" type="time" />
        <SelectField
          defaultValue={editing?.tipo ?? "Pratica"}
          label="Tipo"
          name="tipo"
          options={["Pratica", "Teorica", "Simulado"].map((value) => ({
            label: value,
            value,
          }))}
        />
        <SelectField
          defaultValue={editing?.status ?? "agendada"}
          label="Status"
          name="status"
          options={[
            "disponivel",
            "solicitada",
            "agendada",
            "cancelamento_solicitado",
            "realizada",
            "cancelada",
          ].map((value) => ({
            label: value,
            value,
          }))}
        />
      </FormShell>
    </form>
  );
}

function PaymentForm({
  data,
  editing,
  onCancel,
  onSubmit,
  saving,
}: {
  data: Database;
  editing: Payment | null;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  return (
    <form onSubmit={onSubmit}>
      <FormShell editing={Boolean(editing)} onCancel={onCancel} saving={saving}>
        <SelectField
          defaultValue={editing?.alunoId ?? data.students[0]?.id}
          label="Aluno"
          name="alunoId"
          options={data.students.map((student) => ({ label: student.nome, value: student.id }))}
        />
        <Field defaultValue={editing?.vencimento} label="Vencimento" name="vencimento" type="date" />
        <Field defaultValue={editing?.valor ?? 0} label="Valor" name="valor" type="number" />
        <SelectField
          defaultValue={editing?.status ?? "aberto"}
          label="Status"
          name="status"
          options={["aberto", "pago", "atrasado"].map((value) => ({ label: value, value }))}
        />
      </FormShell>
    </form>
  );
}
