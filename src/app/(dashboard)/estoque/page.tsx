// app/(dashboard)/estoque/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  description?: string;
  currentStock: number;
  minStockLevel: number;
  unitOfMeasure: 'litro' | 'unidade';
  sellingPrice: number;
  stockEntries: { 
    quantityCurrent: number;
  }[];
};


export default function EstoquePage() {
  const [products, setProducts] = useState<Product[]>([]);
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

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/products', { headers });
      if (!res.ok) {
        throw new Error("Falha ao carregar produtos do estoque.");
      }
      const data: Product[] = await res.json();
      setProducts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);


  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestão de Estoque
        </h1>
        <Link 
          href="/estoque/novo" 
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold 
                     rounded-lg shadow-md hover:bg-blue-700 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          + Cadastrar Novo Produto
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estoque Atual
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nível Mínimo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unidade
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preço de Venda
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  Nenhum produto cadastrado.
                </td>
              </tr>
            ) : (
              products.map(product => {

                const currentStock = product.stockEntries?.[0]?.quantityCurrent ?? 0;
                
                const isLowStock = currentStock <= product.minStockLevel;

                return (
                  <tr 
                    key={product.id} 
                    className={`transition-colors ${isLowStock ? 'bg-yellow-50' : 'bg-white'} hover:bg-gray-50`}
                  >

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-gray-500">{product.description}</div>
                      )}
                    </td>

                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      isLowStock ? 'text-red-600 font-bold' : 'text-gray-700'
                    }`}>
                      {currentStock}
                      {isLowStock && <span className="ml-2">(BAIXO!)</span>}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {product.minStockLevel}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                      {product.unitOfMeasure}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      R$ {product.sellingPrice}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/estoque/${product.id}`}
                        className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-md shadow-sm hover:bg-yellow-600 transition-colors"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
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
        <span className="ml-3 text-lg font-medium text-gray-700">Carregando estoque...</span>
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