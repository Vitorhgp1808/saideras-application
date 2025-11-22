"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Purchase = {
  id: string;
  purchaseDate: string;
  quantity: number;
  costPrice: number;
  product: { name: string };
  supplier: { name: string };
};

type FilterData = {
  id: string;
  name: string;
};

export default function ComprasPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<FilterData[]>([]);
  const [suppliers, setSuppliers] = useState<FilterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");


  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setError("Não autorizado. Faça login novamente.");
      return null;
    }
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers) return;

        const [productsRes, suppliersRes] = await Promise.all([
          fetch("/api/products", { headers }),
          fetch("/api/suppliers", { headers }),
        ]);

        if (!productsRes.ok || !suppliersRes.ok) {
          throw new Error("Falha ao carregar dados do filtro.");
        }

        setProducts(await productsRes.json());
        setSuppliers(await suppliersRes.json());
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchFilterData();
  }, []);


  useEffect(() => {
    const fetchPurchases = async () => {
      setIsLoading(true);
      try {
        const headers = getAuthHeaders();
        if (!headers) {
          setIsLoading(false);
          return;
        }

        const params = new URLSearchParams();
        if (selectedProduct) params.append("productId", selectedProduct);
        if (selectedSupplier) params.append("supplierId", selectedSupplier);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const res = await fetch(`/api/purchases?${params.toString()}`, { headers });

        if (!res.ok) {
          throw new Error("Falha ao carregar histórico de compras.");
        }
        const data: Purchase[] = await res.json();
        setPurchases(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPurchases();
  }, [selectedProduct, selectedSupplier, startDate, endDate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency", currency: "BRL",
    }).format(value);
  };

  const handleClearFilters = () => {
    setSelectedProduct("");
    setSelectedSupplier("");
    setStartDate("");
    setEndDate("");
  };

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Histórico de Compras
        </h1>
        <Link
          href="/compras/registrar"
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold
                     rounded-lg shadow-md hover:bg-blue-700 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          + Registrar Nova Compra
        </Link>
      </div>

      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          
          <div className="flex-1">
            <label htmlFor="filter-product" className="block text-sm font-medium text-gray-600 mb-1">Produto</label>
            <select
              id="filter-product"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os Produtos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="filter-supplier" className="block text-sm font-medium text-gray-600 mb-1">Fornecedor</label>
            <select
              id="filter-supplier"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os Fornecedores</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-600 mb-1">Data Início</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex-1">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-600 mb-1">Data Fim</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={handleClearFilters}
            className="w-full lg:w-auto px-4 py-2 bg-gray-600 text-white text-sm font-medium
                       rounded-md hover:bg-gray-700 transition-colors
                       focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd.</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo (Unid.)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Total</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    Nenhuma compra encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowGrap text-sm text-gray-700">
                      {formatDate(p.purchaseDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {p.product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {p.supplier.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {p.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(p.costPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(p.quantity * p.costPrice)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-5">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600 [animation-delay:0.2s]"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600 [animation-delay:0.4s]"></div>
        <span className="ml-3 text-lg font-medium text-gray-700">
          Carregando histórico...
        </span>
      </div>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex h-screen items-center justify-center p-4">
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md"
        role="alert"
      >
        <strong className="font-bold">Erro: </strong>
        <span className="block sm:inline">{message}</span>
      </div>
    </div>
  );
}