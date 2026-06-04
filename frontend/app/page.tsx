"use client";


import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";

export default function Home() {
  return (
    <main className="flex h-screen overflow-hidden">

      {/* MENU */}
      <aside className="w-72 bg-[#003B95] text-white flex flex-col justify-between p-6">

        <div>

          <div className="mb-14">
            <h1 className="text-5xl font-bold text-[#FFD000]">
              Dirija
            </h1>

            <h1 className="text-5xl font-bold text-[#FFD000]">
              Melhor
            </h1>

            <p className="mt-4 text-white/80">
              Treinamento para habilitados
            </p>
          </div>

          <nav className="flex flex-col gap-4">

            <button className="flex items-center gap-3 bg-[#FFD000] text-[#003B95] p-4 rounded-2xl font-semibold">
              <LayoutDashboard />
              Administração
            </button>

            <button className="flex items-center gap-3 hover:bg-white/10 p-4 rounded-2xl">
              <Calendar />
              Escala
            </button>

            <button className="flex items-center gap-3 hover:bg-white/10 p-4 rounded-2xl">
              <GraduationCap />
              Matrículas
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
      <section className="flex-1 bg-gray-100">

        {/* TOPO */}
        <div className="h-24 bg-white flex items-center justify-between px-10 shadow">

          <button className="bg-gray-100 p-3 rounded-xl">
            <Menu />
          </button>

          <span className="font-semibold">
            Administrador
          </span>

        </div>

        <div className="p-10">

          <h1 className="text-6xl font-bold text-[#003B95]">
            Dashboard
          </h1>

          <p className="mt-4 text-xl text-gray-600">
            Bem-vindo ao sistema da Dirija Melhor 🚗
          </p>

        </div>

      </section>

    </main>
  );
}