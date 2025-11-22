"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import Image from "next/image"; // Precisamos do Image para o preview e as opções

// --- 1. DEFINA SUAS OPÇÕES DE AVATAR AQUI ---
// (Exemplos do boringavatars.com)
// Você pode substituir por URLs de imagens que você hospedou
const AVATAR_OPTIONS = [
  "https://source.boringavatars.com/marble/120/Maria%20Silva?colors=264653,2a9d8f,e9c46a,f4a261,e76f51",
  "https://source.boringavatars.com/marble/120/Joao%20Santos?colors=8ecae6,219ebc,023047,ffb703,fb8500",
  "https://source.boringavatars.com/marble/120/Ana%20Souza?colors=ffadad,ffd6a5,fdffb6,caffbf,9bf6ff",
  "https://source.boringavatars.com/marble/120/Lucas%20Oliveira?colors=2d00f7,6a00f4,8900f2,a100f2,b100e8",
  "https://source.boringavatars.com/marble/120/Julia%20Costa?colors=f72585,b5179e,7209b7,560bad,480ca8",
  "https://source.boringavatars.com/marble/120/Pedro%20Alves?colors=f94144,f3722c,f8961e,f9c74f,90be6d",
  "https://source.boringavatars.com/marble/120/Carla%20Dias?colors=006d77,83c5be,edf6f9,ffddd2,e29578",
  "https://source.boringavatars.com/marble/120/Marcos%20Lima?colors=001219,005f73,0a9396,94d2bd,e9d8a6",
  "https://source.boringavatars.com/marble/120/Beatriz%20Lopes?colors=d62828,f77f00,fcbf49,eae2b7,003049",
  "https://source.boringavatars.com/marble/120/Rafael%20Gomes?colors=5f0f40,9a031e,fb8b24,e36414,0f4c5c",
];
// ---------------------------------------------


// Ícone placeholder
function UserIconPlaceholder() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A1.5 1.5 0 0118 21.75H6a1.5 1.5 0 01-1.499-1.632z" />
    </svg>
  );
}

export default function NovoUsuarioPage() {
  const router = useRouter();

  // Campos do formulário
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.GARCOM);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // <-- Estado atualizado

  // Estados de controle
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

    // O 'avatarUrl' vem do estado (que foi setado ao clicar em uma opção)
    const body = { 
      name, 
      username, 
      password, 
      role, 
      avatarUrl: avatarUrl // Envia a URL selecionada (ou null)
    };

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
      // Limpa o formulário
      setName("");
      setUsername("");
      setPassword("");
      setRole(UserRole.GARCOM);
      setAvatarUrl(null); // Limpa a seleção

      setTimeout(() => {
        router.push('/usuarios');
        router.refresh();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full p-3 border border-gray-300 rounded-md box-border text-base";

  return (
    <div className="w-full max-w-4xl mx-auto px-2.5">
      <div className="flex flex-col justify-between items-start mb-5">
        <h1 className="text-2xl font-bold">Cadastrar Novo Usuário</h1>
        <Link href="/usuarios" className="text-blue-500 no-underline mt-2.5">
          &larr; Ver Lista
        </Link>
      </div>

      <form className="p-5 bg-gray-50 rounded-lg shadow-md" onSubmit={handleSubmit}>
        
        {/* --- CAMPO DE AVATAR (versão SELEÇÃO) --- */}
        <div className="mb-4">
          <label className="block mb-2 font-bold text-center">Avatar (Opcional)</label>
          
          {/* Preview */}
          <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden flex items-center justify-center mx-auto ring-2 ring-offset-2 ring-gray-300">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar Selecionado"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIconPlaceholder />
            )}
          </div>

          {/* Grade de Seleção */}
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 p-3 bg-white border border-gray-200 rounded-md">
            {AVATAR_OPTIONS.map((url) => (
              <button
                type="button"
                key={url}
                onClick={() => setAvatarUrl(url)}
                className={`w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden transition-all duration-150
                            focus:outline-none focus:ring-4 focus:ring-blue-400
                            ${avatarUrl === url ? 'ring-4 ring-blue-500' : 'ring-0 ring-transparent hover:ring-2 hover:ring-gray-300'}
                           `}
              >
                <Image 
                  src={url} 
                  alt="Opção de Avatar" 
                  width={64} 
                  height={64} 
                  className="w-full h-full object-cover" 
                />
              </button>
            ))}
          </div>
          {/* Botão de Limpar */}
          {avatarUrl && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setAvatarUrl(null)}
                className="text-sm text-red-600 hover:underline mt-2"
              >
                Remover seleção
              </button>
            </div>
          )}
        </div>
        {/* --- FIM DO CAMPO DE AVATAR --- */}
        
        {/* Campo Nome */}
        <div className="mb-4">
          <label className="block mb-1.5 font-bold" htmlFor="name">Nome Completo</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Campo Username */}
        <div className="mb-4">
          <label className="block mb-1.5 font-bold" htmlFor="username">Nome de Usuário (Login)</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Campo Senha */}
        <div className="mb-4">
          <label className="block mb-1.5 font-bold" htmlFor="password">Senha Provisória</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Campo Cargo (RNF003) */}
        <div className="mb-4">
          <label className="block mb-1.5 font-bold" htmlFor="role">Cargo / Nível de Acesso</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className={inputClass + " bg-white"}
            disabled={isSubmitting}
          >
            <option value={UserRole.GARCOM}>Garçom</option>
            <option value={UserRole.CAIXA}>Caixa</option>
            <option value={UserRole.MANAGER}>Gerente</option>
          </select>
        </div>

        {/* --- Ações e Mensagens --- */}
        <button type="submit" className="bg-green-500 text-white w-full p-4 border-none rounded-md cursor-pointer text-base mt-2.5 disabled:bg-gray-400" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Usuário"}
        </button>
        {error && <p className="text-red-600 mt-2.5">{error}</p>}
        {success && <p className="text-green-600 mt-2.5">{success}</p>}
      </form>
    </div>
  );
}