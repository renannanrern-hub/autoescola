export type Status = "ativo" | "pendente" | "concluido" | "cancelado";

export type Student = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  categoria: "A" | "B" | "AB" | "D";
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
  categoria: "A" | "B" | "D";
  status: "disponivel" | "aula" | "manutencao";
};

export type Enrollment = {
  id: string;
  alunoId: string;
  curso: string;
  inicio: string;
  valor: number;
  status: Status;
};

export type Lesson = {
  id: string;
  alunoId: string;
  instrutorId: string;
  veiculoId: string;
  data: string;
  hora: string;
  tipo: "Pratica" | "Teorica" | "Simulado";
  status: "agendada" | "realizada" | "cancelada";
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
