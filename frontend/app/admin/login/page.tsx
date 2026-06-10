"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin-auth", {
      body: JSON.stringify({
        email: String(form.get("email")),
        password: String(form.get("password")),
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const body = (await response.json()) as { message?: string };
      setError(body.message ?? "Falha no acesso.");
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-md bg-[#003B95] text-[#FFD000]">
            <LockKeyhole size={24} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#003B95]/70">
              Dirija Melhor
            </p>
            <h1 className="text-2xl font-black text-[#003B95]">Acesso administrativo</h1>
          </div>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1.5 text-sm font-bold text-slate-700">
            E-mail
            <input
              className="h-11 rounded-md border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#003B95] focus:ring-2 focus:ring-[#003B95]/15"
              name="email"
              required
              type="email"
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

          {error ? (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
              {error}
            </p>
          ) : null}

          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#003B95] text-sm font-black text-white hover:bg-[#002f78]"
            disabled={loading}
            type="submit"
          >
            <LogIn size={17} />
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
