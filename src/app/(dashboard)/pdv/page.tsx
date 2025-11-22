// app/pdv/page.tsx
"use client";

import { useState, useEffect } from "react";
import type { Comanda, Product, OrderItem } from "./types/pdv";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};


export default function PdvPage() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newComandaTable, setNewComandaTable] = useState("");
  const [isCreatingComanda, setIsCreatingComanda] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("Nenhum token encontrado");
      setError("Não autorizado. Faça login novamente.");
      return null;
    }
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  const fetchData = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setIsLoading(false);
        return;
      }

      const [comandasRes, productsRes] = await Promise.all([
        fetch('/api/orders?status=OPEN', { headers }),
        fetch('/api/products', { headers })
      ]);

      if (!comandasRes.ok) throw new Error("Falha ao buscar comandas");
      const comandasData: Comanda[] = await comandasRes.json();
      setComandas(comandasData);

      if (!productsRes.ok) throw new Error("Falha ao buscar produtos");
      const productsData: Product[] = await productsRes.json();
      setProducts(productsData);

      if (selectedComanda) {
        const updatedComanda = comandasData.find(c => c.id === selectedComanda.id);
        setSelectedComanda(updatedComanda || null);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const handleOpenCreateModal = () => {
    setIsModalOpen(true);
    setNewComandaTable("");
    setError(null); 
  };

  const handleCloseCreateModal = () => {
    if (isCreatingComanda) return; 
    setIsModalOpen(false);
    setNewComandaTable("");
    setIsCreatingComanda(false);
  };

  const handleCreateComandaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComandaTable || isCreatingComanda) return;

    setIsCreatingComanda(true);
    setError(null);

    try {
      const headers = getAuthHeaders();
      if (!headers) throw new Error("Não autorizado.");

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ table: newComandaTable })
      });

      if (!res.ok) {
         const errData = await res.json();
         throw new Error(errData.message || "Falha ao criar comanda");
      }
      
      await fetchData(); 
      handleCloseCreateModal(); 

    } catch (err: any) {
      setError(err.message); 
    } finally {
      setIsCreatingComanda(false);
    }
  };

  const handleSelectComanda = (comanda: Comanda) => {
    setSelectedComanda(comanda);
  };

  const handleAddItem = async (productId: string, quantity: number) => {
    if (!selectedComanda) return;
    
    try {
      const headers = getAuthHeaders();
      if (!headers) throw new Error("Não autorizado.");
      
      const res = await fetch(`/api/orders/${encodeURIComponent(selectedComanda.id)}/items`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ productId, quantity })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Falha ao adicionar item");
      }

      await fetchData();
    } catch (err: any) {
      setError(err.message); 
    }
  };

  const handleCloseAccount = () => {
    if (!selectedComanda) return;
    alert(`Implementar Modal de Pagamento para ${selectedComanda.table}. Total: ${formatCurrency(selectedComanda.total)}`);
  };


  if (isLoading && !isModalOpen) { 
    return <LoadingSpinner />;
  }
  
  if (error && !isModalOpen) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50 font-sans">
        <div className="w-3/5 border-r border-gray-200 overflow-y-auto">
          <ComandaGrid
            comandas={comandas}
            selectedComandaId={selectedComanda?.id || null}
            onCreateComanda={handleOpenCreateModal} 
            onSelectComanda={handleSelectComanda}
          />
        </div>

        <div className="w-2/5 overflow-y-auto">
          <ComandaDetail
            comanda={selectedComanda}
            products={products}
            onAddItem={handleAddItem}
            onCloseAccount={handleCloseAccount}
          />
        </div>
      </div>

      <CreateComandaModal
        isOpen={isModalOpen}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateComandaSubmit}
        tableName={newComandaTable}
        setTableName={setNewComandaTable}
        isLoading={isCreatingComanda}
        error={error} 
      />
    </>
  );
}


type CreateComandaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  tableName: string;
  setTableName: (value: string) => void;
  isLoading: boolean;
  error: string | null;
};

function CreateComandaModal({
  isOpen,
  onClose,
  onSubmit,
  tableName,
  setTableName,
  isLoading,
  error,
}: CreateComandaModalProps) {
  if (!isOpen) {
    return null; 
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 transition-opacity"
      onClick={onClose} 
    >
      <div
        className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()} 
      >
        <h3 className="text-2xl font-semibold mb-4 text-gray-900">
          Criar Nova Comanda
        </h3>
        
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label htmlFor="tableName" className="block text-sm font-medium text-gray-700 mb-1">
              N° da Mesa ou Cliente
            </label>
            <input
              id="tableName"
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Ex: Mesa 05"
              autoFocus
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="my-3 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !tableName}
              className="px-5 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 
                         disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon />
                  Criando...
                </>
              ) : (
                "Criar Comanda"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


type ComandaGridProps = {
  comandas: Comanda[];
  selectedComandaId: string | null;
  onCreateComanda: () => void;
  onSelectComanda: (comanda: Comanda) => void;
};

function ComandaGrid({
  comandas,
  selectedComandaId,
  onCreateComanda,
  onSelectComanda
}: ComandaGridProps) {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Comandas Abertas</h2>
      <button
        onClick={onCreateComanda} 
        className="w-full p-4 text-lg font-bold bg-blue-600 text-white rounded-lg shadow-md
                   hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2
                   focus:ring-blue-500 focus:ring-opacity-50 mb-4"
      >
        + Nova Comanda
      </button>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {comandas.map((comanda) => (
          <div
            key={comanda.id}
            onClick={() => onSelectComanda(comanda)}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all
              flex flex-col items-center justify-center aspect-square
              ${selectedComandaId === comanda.id
                ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-500 shadow-lg'
                : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-md'
              }
            `}
          >
            <strong className="text-xl font-bold text-gray-900">{comanda.table}</strong>
            <span className="text-sm text-gray-600">
              {formatCurrency(comanda.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


type ComandaDetailProps = {
  comanda: Comanda | null;
  products: Product[];
  onAddItem: (productId: string, quantity: number) => void;
  onCloseAccount: () => void;
};

function ComandaDetail({ 
  comanda, 
  products, 
  onAddItem, 
  onCloseAccount 
}: ComandaDetailProps) {
  
  const [addItemId, setAddItemId] = useState<string>("");
  const [addItemQty, setAddItemQty] = useState<number>(1);
  const [addItemError, setAddItemError] = useState<string | null>(null);

  useEffect(() => {
    setAddItemId("");
    setAddItemQty(1);
    setAddItemError(null);
  }, [comanda?.id]);
  
  useEffect(() => {
    setAddItemError(null);
  }, [addItemId, addItemQty]);

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    setAddItemError(null);

    if (!addItemId) {
      setAddItemError("Selecione um produto para adicionar.");
      return;
    }
    if (addItemQty <= 0) {
      setAddItemError("A quantidade deve ser maior que zero.");
      return;
    }
    
    onAddItem(addItemId, addItemQty);
    
    setAddItemId("");
    setAddItemQty(1);
  };

  if (!comanda) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-gray-500">
        <p className="text-lg">Selecione uma comanda à esquerda para ver os detalhes.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6">
      <h3 className="text-3xl font-bold text-gray-900 mb-4">
        Detalhes: {comanda.table}
      </h3>

      <div className="flex-grow min-h-0 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white shadow-inner">
        {comanda.items.length === 0 ? (
          <p className="p-4 text-gray-500">Nenhum item consumido.</p>
        ) : (
          comanda.items.map(item => (
            <div key={item.id} className="flex justify-between p-3 border-b border-gray-100 last:border-b-0">
              <span className="font-medium text-gray-800">
                {item.quantity}x {item.product.name}
              </span>
              <span className="text-gray-700">
                {formatCurrency(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))
        )}
      </div>

      <strong className="block text-3xl font-extrabold text-right my-4 text-gray-900">
        Total: {formatCurrency(comanda.total)}
      </strong>

      <hr className="my-4 border-t border-gray-200" />

      <form onSubmit={handleSubmitItem}>
        <h4 className="text-xl font-semibold mb-3 text-gray-800">Adicionar Produto</h4>
        <div className="flex gap-3">
          <select
            value={addItemId}
            onChange={(e) => setAddItemId(e.target.value)}
            className={`flex-grow p-3 border rounded-lg bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       ${addItemError && !addItemId ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
          >
            <option value="">Selecione um produto...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.unitOfMeasure === 'LITRO' ? 'Litro' : 'Unidade'})
              </option>
            ))}
          </select>
          <input
            type="number"
            value={addItemQty}
            onChange={(e) => setAddItemQty(Number(e.target.value))}
            min="0.1"
            step="0.1"
            className={`w-24 p-3 border rounded-lg text-center
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       ${addItemError && addItemQty <= 0 ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
          />
          <button 
            type="submit" 
            className="p-3 px-6 bg-gray-800 text-white font-semibold rounded-lg
                       hover:bg-gray-700 transition-colors"
          >
            Adicionar
          </button>
        </div>
        
        {addItemError && (
          <p className="text-red-600 text-sm mt-2">{addItemError}</p>
        )}
      </form>

      <hr className="my-6 border-t border-gray-200" />

      <div className="mt-auto">
        <button
          onClick={onCloseAccount}
          className="w-full p-4 text-xl font-bold bg-green-600 text-white rounded-lg shadow-md
                     hover:bg-green-700 transition-colors focus:outline-none focus:ring-2
                     focus:ring-green-500 focus:ring-opacity-50"
        >
          Fechar Conta
        </button>
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
        <span className="ml-3 text-lg font-medium text-gray-700">Carregando PDV...</span>
      </div>
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
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      ></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}