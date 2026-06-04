"use client";

import {
  User,
  LayoutDashboard,
  Calendar,
  GraduationCap,
  Settings,
  LogOut,
  Menu,
  Users,
  Car,
  CreditCard,
  BadgeCheck,
  UserCheck2,
  CalendarDays,
  CalendarCheck,
  PenBox,
} from "lucide-react";

export default function Home() {
  return (
    <main className="flex h-screen overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#003B95] text-white flex flex-col justify-between p-6">
        <div>
          <div className="mb-14">
            <h1 className="text-5xl font-bold text-[#FFD000]">Dirija</h1>
            <h1 className="text-5xl font-bold text-[#FFD000]">Melhor</h1>

            <p className="mt-4 text-white/80">
              Treinamento para habilitados
            </p>
          </div>

          <nav className="flex flex-col gap-2">

  <button className="flex items-center gap-3 bg-[#FFD000] text-[#003B95] p-4 rounded-2xl font-semibold">
    <LayoutDashboard />
    Administração
  </button>

  <button className="flex items-center gap-3 hover:bg-white/10 p-4 rounded-2xl">
    <GraduationCap />
    Alunos
  </button>

  <button className="flex items-center gap-3 hover:bg-white/10 p-4 rounded-2xl">
    <CalendarDays />
    Escala
  </button>

  <button className="flex items-center gap-3 hover:bg-white/10 p-4 rounded-2xl">
    <CalendarCheck />
    Aulas
  </button>

  <button className="flex items-center gap-3 hover:bg-white/10 p-4 rounded-2xl">
    <PenBox />
    Matrículas
  </button>

  <button className="flex items-center gap-3 hover:bg-white/10 p-4 rounded-2xl">
    <Users />
    Instrutores
  </button>

  <button className="flex items-center gap-3 hover:bg-white/10 p-4 rounded-2xl">
    <Car />
    Veículos
  </button>

  <button className="flex items-center gap-3 hover:bg-white/10 p-4 rounded-2xl">
    <Settings />
    Financeiro
  </button>

  <button className="flex items-center gap-3 hover:bg-white/10 p-4 rounded-2xl">
    <Settings />
    Relatórios
  </button>

  <button className="flex items-center gap-3 hover:bg-white/10 p-4 rounded-2xl">
    <Settings />
    Configurações
  </button>

</nav>
        </div>

        <button className="flex items-center gap-3 hover:bg-white/10 p-4 rounded-2xl">
          <LogOut />
          Logout
        </button>
      </aside>

      {/* CONTEÚDO */}
      <section className="flex-1 relative overflow-hidden">
        {/* TOPO */}
        {/* TOPO */}
<div className="h-20 bg-[#FFD000] flex items-center justify-between px-10 shadow-lg border-b-4 border-[#003B95] relative z-20">

  <div className="flex items-center gap-6">
    <button className="bg-white p-3 rounded-xl shadow">
      <Menu className="text-[#003B95]" />
    </button>

    <span className="font-semibold text-[#003B95] text-lg">
      Sistema Dirija Melhor
    </span>
  </div>

  <div className="flex items-center gap-8">

    <span className="text-[#003B95] font-medium">
      📅 0 aulas hoje
    </span>

    <span className="text-[#003B95] font-medium">
      🚗 0 veículos
    </span>

    <span className="text-[#003B95] font-medium">
      👨‍🎓 0 alunos
    </span>

    <button className="flex items-center gap-3">

  <div className="w-12 h-12 rounded-full bg-[#003B95] flex items-center justify-center">

    <User
      size={24}
      className="text-white"
    />

  </div>

  <span className="font-bold text-[#003B95]">
    Administrador
  </span>

</button>
    </div>

  </div>


        {/* IMAGEM DE FUNDO */}
        <img
          src="/FOTO CARRO.png"
          alt="Carro Dirija Melhor"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* CAMADA ESCURA */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="absolute top-36 left-16 z-10 max-w-5xl">
          <h1 className="text-5xl font-bold text-white">
            Carros Manual e Automático
          </h1>

          <p className="mt-4 text-xl text-white/90">
            Bem-vindo ao sistema da Dirija Melhor 🚗
          </p>

          {/* CARDS */}
          <div className="flex gap-6 mt-10 flex-wrap">
            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl w-56 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <Users className="text-[#003B95]" />
                <span className="text-gray-600">Alunos</span>
              </div>

              <p className="text-4xl font-bold text-[#003B95]">
                0
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl w-56 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <Car className="text-[#003B95]" />
                <span className="text-gray-600">Aulas Hoje</span>
              </div>

              <p className="text-4xl font-bold text-[#003B95]">
                0
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl w-56 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <GraduationCap className="text-[#003B95]" />
                <span className="text-gray-600">Matrículas</span>
              </div>

              <p className="text-4xl font-bold text-[#003B95]">
                0
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl w-56 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard className="text-[#003B95]" />
                <span className="text-gray-600">Recebimentos</span>
              </div>

              <p className="text-3xl font-bold text-[#003B95]">
                R$ 0
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}