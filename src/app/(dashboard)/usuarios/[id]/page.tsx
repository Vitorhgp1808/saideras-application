// app/(dashboard)/usuarios/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@prisma/client";

export default function EditarUsuarioPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.WAITER);
  const [password, setPassword] = useState(""); 

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
       setError("Não autorizado. Faça login novamente.");
       return null;
    }
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  useEffect(() => {
    if (!id) return;
    
    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const headers = getAuthHeaders();
        if (!headers) {
          setIsLoading(false);
          return;
        }
        
        const res = await fetch(`/api/users/${id}`, { headers });
        if (!res.ok) {
          throw new Error("Falha ao carregar dados do usuário.");
        }
        const user = await res.json();
        setName(user.name);
        setUsername(user.username);
        setRole(user.role);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Erro desconhecido");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username) {
      setError("Nome e username são obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const headers = getAuthHeaders();
    if (!headers) {
      setIsSubmitting(false);
      return;
    }

    const body: { name: string; username: string; role: UserRole; password?: string } = {
      name,
      username,
      role,
    };
    if (password.trim() !== "") {
      body.password = password;
    }

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT', 
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Falha ao atualizar usuário.");
      }

      setSuccess("Usuário atualizado com sucesso!");
      setPassword(""); 
      setTimeout(() => {
        router.push('/usuarios'); 
        router.refresh();
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

  const handleDelete = async () => {
    if (!window.confirm(`Tem certeza que deseja deletar o usuário "${name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    const headers = getAuthHeaders();
    if (!headers) {
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: headers,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Falha ao deletar usuário.");
      }
      
      setSuccess("Usuário deletado com sucesso.");
      setTimeout(() => {
        router.push('/usuarios');
        router.refresh();
      }, 2000);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro desconhecido");
      }
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const inputClass = "w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 truncate">
          Editar Usuário
        </h1>
        <Link 
          href="/usuarios" 
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 
                     transition-colors font-medium flex-shrink-0"
        >
          <ArrowLeftIcon />
          Voltar para a Lista
        </Link>
      </div>

      <form 
        className="bg-white p-6 md:p-8 rounded-lg shadow-md border border-gray-200" 
        onSubmit={handleSubmit}
      >
        <div className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              Nome Completo*
            </label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
              Nome de Usuário (Login)*
            </label>
            <input id="username" type="username" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} required />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Nova Senha
            </label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            <small className="text-xs text-gray-500 mt-1">
              Deixe em branco para não alterar a senha atual.
            </small>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">
              Cargo / Nível de Acesso (RNF003)
            </label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={inputClass}>
              <option value={UserRole.WAITER}>Garçom</option>
              <option value={UserRole.CASHIER}>Caixa</option>
              <option value={UserRole.ADMIN}>Gerente</option>
            </select>
          </div>

          <div className="pt-2">
            {error && <ErrorAlert message={error} />}
            {success && <SuccessAlert message={success} />}
          </div>

          <div 
            className="flex flex-col-reverse sm:flex-row justify-between 
                       items-center gap-4 pt-4 border-t border-gray-200"
          >
            <button 
              type="button" 
              onClick={handleDelete}
              className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white font-semibold 
                         rounded-lg shadow-md hover:bg-red-700 transition-colors
                         disabled:bg-red-300 disabled:cursor-not-allowed
                         flex items-center justify-center" 
              disabled={isSubmitting || !!success}
            >
              {isSubmitting && <SpinnerIcon />}
              Deletar Usuário
            </button>
            
            <button 
              type="submit" 
              className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-semibold 
                         rounded-lg shadow-md hover:bg-green-700 transition-colors
                         disabled:bg-green-300 disabled:cursor-not-allowed
                         flex items-center justify-center" 
              disabled={isSubmitting || !!success}
            >
              {isSubmitting && <SpinnerIcon />}
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg" role="alert">
      <strong className="font-bold">Erro: </strong>
      <span>{message}</span>
    </div>
  );
}

function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="p-4 bg-green-50 border border-green-300 text-green-700 rounded-lg" role="alert">
      <strong className="font-bold">Sucesso! </strong>
      <span>{message}</span>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg 
      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="http://www.w3.org/2000/svg"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}