// app/(dashboard)/fornecedores/novo/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NovoFornecedorPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contact, setContact] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("O nome do fornecedor é obrigatório.");
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

    const body = {
      name,
      cnpj: cnpj || null, 
      contact: contact || null,
    };

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Falha ao cadastrar fornecedor.");
      }

      setSuccess(`Fornecedor "${name}" cadastrado com sucesso!`);
      setName("");
      setCnpj("");
      setContact("");

      setTimeout(() => {
        router.push('/fornecedores');
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

  const inputClass = "w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Cadastrar Novo Fornecedor
        </h1>
        <Link 
          href="/fornecedores" 
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 
                     transition-colors font-medium"
        >
          <ArrowLeftIcon />
          Ver Lista de Fornecedores
        </Link>
      </div>

      <form 
        className="bg-white p-6 md:p-8 rounded-lg shadow-md border border-gray-200" 
        onSubmit={handleSubmit}
      >
        <div className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              Nome do Fornecedor*
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Ex: Distribuidora de Bebidas XYZ"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cnpj">
              CNPJ (Opcional)
            </label>
            <input
              id="cnpj"
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className={inputClass}
              placeholder="XX.XXX.XXX/0001-XX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="contact">
              Nome do Usuário
            </label>
            <input
              id="contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className={inputClass}
              placeholder="rafael-caixa"
            />
          </div>

          <div className="pt-2">
            {error && <ErrorAlert message={error} />}
            {success && <SuccessAlert message={success} />}
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" 
              className="w-full md:w-auto px-6 py-3 bg-green-600 text-white font-semibold 
                         rounded-lg shadow-md hover:bg-green-700 transition-colors
                         disabled:bg-green-300 disabled:cursor-not-allowed
                         flex items-center justify-center" 
              disabled={isSubmitting || !!success}
            >
              {isSubmitting && <SpinnerIcon />}
              {isSubmitting ? "Salvando..." : "Salvar Fornecedor"}
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
      viewBox="0 0 24 24"
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