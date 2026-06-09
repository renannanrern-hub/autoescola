export type Status = "ativo" | "pendente" | "concluido" | "cancelado";

export type Student = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  endereco?: string;
  categoria: "B";
  status: Status;
  aulasRealizadas: number;
};

export type Instructor = {
  id: string;
  nome: string;
  telefone: string;
  categorias: string;
  status: "ativo" | "ferias" | "inativo";
};

export type Vehicle = {
  id: string;
  modelo: string;
  placa: string;
  categoria: "B";
  cambio: "automatico" | "manual";
  status: "disponivel" | "aula" | "manutencao";
};

export type Enrollment = {
  id: string;
  alunoId: string;
  curso: string;
  inicio: string;
  valor: number;
  cambioPreferido?: "automatico" | "manual";
  aulasContratadas?: number;
  status: Status;
};

export type Lesson = {
  id: string;

  alunoId?: string;

  instrutorId: string;

  veiculoId: string;

  data: string;

  hora: string;

  tipo:
    | "Pratica"
    | "Teorica"
    | "Simulado";

  status:
    | "disponivel"
    | "solicitada"
    | "agendada"
    | "cancelamento_solicitado"
    | "realizada"
    | "cancelada";

  observacao?: string;
};

export type Payment = {
  id: string;
  alunoId: string;
  vencimento: string;
  valor: number;
  status: "pago" | "aberto" | "atrasado";
};

export type Database = {
  students: Student[];
  instructors: Instructor[];
  vehicles: Vehicle[];
  enrollments: Enrollment[];
  lessons: Lesson[];
  payments: Payment[];
};

export type CollectionName = keyof Database;

export type DashboardStats = {
  alunosAtivos: number;
  aulasHoje: number;
  veiculosDisponiveis: number;
  receitaRecebida: number;
  pendenciasFinanceiras: number;
};

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeAccessText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
}

export function getStudentInitialPassword(student: Pick<Student, "cpf" | "nome">) {
  const cpfDigits = onlyDigits(student.cpf).slice(0, 6);
  const nameLetters = normalizeAccessText(student.nome).slice(0, 2);
  return `${cpfDigits}${nameLetters}`;
}
