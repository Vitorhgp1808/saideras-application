// app/(dashboard)/fornecedores/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Supplier = {
  id: string;
  name: string;
  cnpj?: string;
  contact?: string;
};

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const fetchSuppliers = async () => {
      setIsLoading(true);
      try {
        const headers = getAuthHeaders();
        if (!headers) {
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/suppliers', { headers });
        if (!res.ok) {
          throw new Error("Falha ao carregar fornecedores.");
        }
        const data: Supplier[] = await res.json();
        setSuppliers(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuppliers();
  }, []);


  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Fornecedores
        </h1>
        <Link 
          href="/fornecedores/novo" 
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold 
                     rounded-lg shadow-md hover:bg-blue-700 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                     w-full md:w-auto text-center"
        >
          + Novo Fornecedor
        </Link>
      </div>

      {suppliers.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm border">
          Nenhum fornecedor cadastrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {suppliers.map(supplier => (
            <div 
              key={supplier.id} 
              className="flex flex-col bg-white shadow-md rounded-lg border border-gray-200 
                         overflow-hidden transition-all hover:shadow-lg"
            >
              <div className="p-4 flex-grow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {supplier.name}
                </h3>
                {supplier.cnpj && (
                  <p className="text-sm text-gray-600 mb-1">
                    <strong className="font-medium text-gray-800">CNPJ:</strong> {supplier.cnpj}
                  </p>
                )}
                {supplier.contact && (
                  <p className="text-sm text-gray-600">
                    <strong className="font-medium text-gray-800">Contato:</strong> {supplier.contact}
                  </p>
                )}
              </div>
              
              <div className="mt-auto bg-gray-50 px-4 py-3 border-t border-gray-200">
                <Link
                  href={`/fornecedores/${supplier.id}`}
                  className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-md shadow-sm hover:bg-yellow-600 transition-colors text-center"
                  aria-label={`Editar fornecedor ${supplier.name}`}
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600 [animation-delay:0.2s]"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600 [animation-delay:0.4s]"></div>
        <span className="ml-3 text-lg font-medium text-gray-700">Carregando fornecedores...</span>
      </div>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex h-screen items-center justify-center p-4">
      <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md" role="alert">
        <strong className="font-bold">Erro: </strong>
        <span className="block sm:inline">{message}</span>
      </div>
    </div>
  );
}