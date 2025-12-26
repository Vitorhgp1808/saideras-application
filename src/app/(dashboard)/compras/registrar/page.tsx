// app/(dashboard)/compras/registrar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
};
type Supplier = {
  id: string;
  name: string; 
};

export default function RegistrarCompraPage() {
  const router = useRouter();

  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState(""); 
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [lote, setLote] = useState("");
  const [validade, setValidade] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

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
    const fetchData = async () => {
      setIsLoading(true);
      setError(null); 
      try {
        const headers = getAuthHeaders();
        if (!headers) {
           setIsLoading(false);
           return;
        }
        
        const [productsRes, suppliersRes] = await Promise.all([
          fetch('/api/products', { headers }),
          fetch('/api/suppliers', { headers })
        ]);

        if (!productsRes.ok) throw new Error("Falha ao carregar produtos.");
        if (!suppliersRes.ok) throw new Error("Falha ao carregar fornecedores.");

        setProducts(await productsRes.json());
        setSuppliers(await suppliersRes.json());
        
      } catch (err: unknown) { // Alterado para unknown
        if (err instanceof Error) { // Verificação de tipo
          setError(err.message);
        } else {
          setError("Ocorreu um erro desconhecido ao carregar dados.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !supplierId || !quantity || !costPrice || !purchaseDate) {
      setError("Todos os campos principais são obrigatórios.");
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
      productId,
      supplierId,
      quantity: parseFloat(quantity),
      costPrice: parseFloat(costPrice),
      date: new Date(purchaseDate),
      lote,
      validade: validade ? new Date(validade) : null
    };

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Falha ao registrar a compra.");
      }

      setSuccess("Compra registrada com sucesso! Estoque atualizado.");
      setProductId("");
      setSupplierId("");
      setQuantity("");
      setCostPrice("");
      setLote("");
      setValidade("");

      setTimeout(() => {
        router.push('/compras');
        router.refresh();
      }, 2000);

    } catch (err: unknown) { // Alterado para unknown
      if (err instanceof Error) { // Verificação de tipo
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido ao registrar a compra.");
      }
    } finally {
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

  const inputClass = `w-full p-3 border border-gray-300 rounded-lg shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 
                    transition-colors bg-white 
                    disabled:bg-gray-100 disabled:cursor-not-allowed`;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Registrar Nova Compra
        </h1>
        <Link 
          href="/compras" 
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 
                     transition-colors font-medium"
        >
          <ArrowLeftIcon />
          Ver Histórico
        </Link>
      </div>

      <form 
        className="bg-white p-6 md:p-8 rounded-lg shadow-md border border-gray-200" 
        onSubmit={handleSubmit}
      >
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="supplier">
              Fornecedor*
            </label>
            <select
              id="supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className={inputClass}
              disabled={suppliers.length === 0}
            >
              <option value="">
                {error ? "Erro ao carregar" : suppliers.length > 0 ? "Selecione..." : "Nenhum fornecedor cadastrado"}
              </option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="product">
              Produto*
            </label>
            <select
              id="product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={inputClass}
              disabled={products.length === 0}
            >
              <option value="">
                {error ? "Erro ao carregar" : products.length > 0 ? "Selecione..." : "Nenhum produto cadastrado"}
              </option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="quantity">
              Quantidade (Unid/Litros)*
            </label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={inputClass}
              placeholder="Ex: 50"
              min="0.01"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="costPrice">
              Custo por Unidade (R$)*
            </label>
            <input
              id="costPrice"
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className={inputClass}
              placeholder="Ex: 12.50"
              min="0.01"
              step="0.01"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="date">
              Data da Compra*
            </label>
            <input
              id="date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <hr className="my-8 border-t border-gray-200" />

        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Controle de Lote
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lote">
              Lote
            </label>
            <input
              id="lote"
              type="text"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
              className={inputClass}
              placeholder="Ex: LOTE-A123"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="validade">
              Data de Validade
            </label>
            <input
              id="validade"
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-8">
          {error && <ErrorAlert message={error} />}
          {success && <SuccessAlert message={success} />}

          <button 
            type="submit" 
            className="w-full px-6 py-3 bg-green-600 text-white font-semibold 
                       rounded-lg shadow-md hover:bg-green-700 transition-colors
                       disabled:bg-green-300 disabled:cursor-not-allowed
                       flex items-center justify-center mt-4" 
            disabled={isSubmitting || !!success} 
          >
            {isSubmitting && <SpinnerIcon />}
            {isSubmitting ? "Salvando..." : "Salvar Compra e Atualizar Estoque"}
          </button>
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