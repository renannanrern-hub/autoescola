"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  Car,
  CheckCircle2,
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
  students: "Cadastro de alunos",
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
  return vehicles.find((vehicle) => vehicle.id === id)?.modelo ?? "Veiculo";
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

  function handleStudentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = editing as Student | null;

    save("students", {
      id: current?.id ?? "",
      nome: String(form.get("nome")),
      cpf: String(form.get("cpf")),
      telefone: String(form.get("telefone")),
      email: String(form.get("email")),
      categoria: String(form.get("categoria")),
      status: String(form.get("status")),
      aulasRealizadas: Number(form.get("aulasRealizadas") || 0),
    });
    event.currentTarget.reset();
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
      status: String(form.get("status")),
    });
    event.currentTarget.reset();
  }

  function handleEnrollmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = editing as Enrollment | null;

    save("enrollments", {
      id: current?.id ?? "",
      alunoId: String(form.get("alunoId")),
      curso: String(form.get("curso")),
      inicio: String(form.get("inicio")),
      valor: Number(form.get("valor") || 0),
      status: String(form.get("status")),
    });
    event.currentTarget.reset();
  }

  function handleLessonSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = editing as Lesson | null;

    save("lessons", {
      id: current?.id ?? "",
      alunoId: String(form.get("alunoId")),
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
      normalize(`${student.nome} ${student.cpf} ${student.telefone}`).includes(term),
    );
  }, [data.students, query]);

  const todayLessons = data.lessons.filter(
    (lesson) => lesson.data === new Date().toISOString().slice(0, 10),
  );

  const pendingPayments = data.payments.filter((payment) => payment.status !== "pago");

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
                            {getStudentName(data.students, lesson.alunoId)}
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
                  placeholder="Pesquisar por nome, CPF ou telefone"
                  value={query}
                />
              }
              title="Alunos cadastrados"
            >
              <StudentForm
                editing={editing as Student | null}
                onCancel={() => setEditing(null)}
                onSubmit={handleStudentSubmit}
                saving={saving}
              />
              <Table
                headers={["Nome", "CPF", "Telefone", "Categoria", "Status", "Acoes"]}
                rows={filteredStudents.map((student) => [
                  student.nome,
                  student.cpf,
                  student.telefone,
                  student.categoria,
                  <StatusPill key="status">{student.status}</StatusPill>,
                  <RowActions
                    key="actions"
                    onDelete={() => remove("students", student.id)}
                    onEdit={() => setEditing(student)}
                  />,
                ])}
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
              <Table
                headers={["Data", "Hora", "Aluno", "Instrutor", "Veiculo", "Status", "Acoes"]}
                rows={data.lessons.map((lesson) => [
                  lesson.data,
                  lesson.hora,
                  getStudentName(data.students, lesson.alunoId),
                  getInstructorName(data.instructors, lesson.instrutorId),
                  getVehicleName(data.vehicles, lesson.veiculoId),
                  <StatusPill key="status">{lesson.status}</StatusPill>,
                  <RowActions
                    key="actions"
                    onDelete={() => remove("lessons", lesson.id)}
                    onEdit={() => setEditing(lesson)}
                    onCancel={
                      lesson.status === "agendada"
                        ? () =>
                            save("lessons", {
                              id: lesson.id,
                              status: "cancelada",
                            })
                        : undefined
                    }
                  />,
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
                headers={["Aluno", "Curso", "Inicio", "Valor", "Status", "Acoes"]}
                rows={data.enrollments.map((enrollment) => [
                  getStudentName(data.students, enrollment.alunoId),
                  enrollment.curso,
                  enrollment.inicio,
                  currency.format(enrollment.valor),
                  <StatusPill key="status">{enrollment.status}</StatusPill>,
                  <RowActions
                    key="actions"
                    onDelete={() => remove("enrollments", enrollment.id)}
                    onEdit={() => setEditing(enrollment)}
                  />,
                ])}
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
                headers={["Modelo", "Placa", "Categoria", "Status", "Acoes"]}
                rows={data.vehicles.map((vehicle) => [
                  vehicle.modelo,
                  vehicle.placa,
                  vehicle.categoria,
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

function StudentForm({
  editing,
  onCancel,
  onSubmit,
  saving,
}: {
  editing: Student | null;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  return (
    <form onSubmit={onSubmit}>
      <FormShell editing={Boolean(editing)} onCancel={onCancel} saving={saving}>
        <Field defaultValue={editing?.nome} label="Nome completo" name="nome" />
        <Field defaultValue={editing?.cpf} label="CPF" name="cpf" />
        <Field defaultValue={editing?.telefone} label="Telefone" name="telefone" />
        <Field defaultValue={editing?.email} label="E-mail" name="email" type="email" />
        <SelectField
          defaultValue={editing?.categoria ?? "B"}
          label="Categoria"
          name="categoria"
          options={["A", "B", "AB", "D"].map((value) => ({ label: value, value }))}
        />
        <SelectField
          defaultValue={editing?.status ?? "ativo"}
          label="Status"
          name="status"
          options={["ativo", "pendente", "concluido", "cancelado"].map((value) => ({
            label: value,
            value,
          }))}
        />
        <Field
          defaultValue={editing?.aulasRealizadas ?? 0}
          label="Aulas realizadas"
          name="aulasRealizadas"
          type="number"
        />
      </FormShell>
    </form>
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
          defaultValue={editing?.categoria ?? "B"}
          label="Categoria"
          name="categoria"
          options={["A", "B", "D"].map((value) => ({ label: value, value }))}
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
  return (
    <form onSubmit={onSubmit}>
      <FormShell editing={Boolean(editing)} onCancel={onCancel} saving={saving}>
        <SelectField
          defaultValue={editing?.alunoId ?? data.students[0]?.id}
          label="Aluno"
          name="alunoId"
          options={data.students.map((student) => ({ label: student.nome, value: student.id }))}
        />
        <Field defaultValue={editing?.curso} label="Curso" name="curso" />
        <Field defaultValue={editing?.inicio} label="Inicio" name="inicio" type="date" />
        <Field defaultValue={editing?.valor ?? 0} label="Valor" name="valor" type="number" />
        <SelectField
          defaultValue={editing?.status ?? "ativo"}
          label="Status"
          name="status"
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
          options={["agendada", "realizada", "cancelada"].map((value) => ({
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
