// app/(dashboard)/usuarios/novo/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@prisma/client";

export default function NovoUsuarioPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.WAITER);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) {
      setError("Nome, username e senha são obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const body = { name, username, password, role };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Falha ao cadastrar usuário.");
      }

      setSuccess(`Usuário "${name}" cadastrado com sucesso!`);
      setName("");
      setUsername("");
      setPassword("");
      setRole(UserRole.WAITER);

      setTimeout(() => {
        router.push('/usuarios');
      }, 2000);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro desconhecido");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2.5">
      <div className="flex flex-col justify-between items-start mb-5">
        <h1 className="text-2xl font-bold">Cadastrar Novo Usuário</h1>
        <Link href="/usuarios" className="text-blue-500 no-underline mt-2.5">
          &larr; Ver Lista
        </Link>
      </div>

      <form
        className="p-5 bg-gray-50 rounded-lg shadow-md"
        onSubmit={handleSubmit}
      >
        {/* Campo Nome */}
        <div className="mb-4">
          <label className="block mb-1.5 font-bold" htmlFor="name">
            Nome Completo
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md box-border text-base"
            required
          />
        </div>

        {/* Campo Email */}
        <div className="mb-4">
          <label className="block mb-1.5 font-bold" htmlFor="username">
            Nome de Usuário (Login)
          </label>
          <input
            id="username"
            type="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md box-border text-base"
            required
          />
        </div>

        {/* Campo Senha */}
        <div className="mb-4">
          <label className="block mb-1.5 font-bold" htmlFor="password">
            Senha Provisória
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md box-border text-base"
            required
          />
        </div>

        {/* Campo Cargo (RNF003) */}
        <div className="mb-4">
          <label className="block mb-1.5 font-bold" htmlFor="role">
            Cargo / Nível de Acesso
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full p-3 border border-gray-300 rounded-md box-border text-base"
          >
            <option value={UserRole.WAITER}>Garçom</option>
            <option value={UserRole.CASHIER}>Caixa</option>
            <option value={UserRole.ADMIN}>Gerente</option>
          </select>
        </div>

        {/* --- Ações e Mensagens --- */}
        <button
          type="submit"
          className="bg-green-500 text-white w-full p-4 border-none rounded-md cursor-pointer text-base mt-2.5 disabled:bg-gray-400"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Salvar Usuário"}
        </button>
        {error && <p className="text-red-600 mt-2.5">{error}</p>}
        {success && <p className="text-green-600 mt-2.5">{success}</p>}
      </form>
    </div>
  );
}