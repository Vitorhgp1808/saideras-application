"use client";

import { useState, useRef } from "react";
import { Toast } from '../../../components/ui/Toast';
import { Product } from "../../../types/pdv";
import { ProductList } from "../../../components/inventory/ProductList";
import { ProductModal } from "../../../components/inventory/ProductModal";
import { Button } from "../../../components/ui/Button";
import { Plus, Search } from "lucide-react";
import useSWR, { mutate } from 'swr';
import { fetcher } from '../../../lib/fetcher';

export default function EstoquePage() {
  const { data: products = [], error, isLoading } = useSWR<Product[]>('/api/products', fetcher);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    if (!token) return null;
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  const filteredProducts = products
    .filter(p => !p.isComposite)
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

  const handleOpenNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // --- NOVA FUNÇÃO: Atualiza o status Ativo/Inativo ---
    // Toast de erro
    const [errorToast, setErrorToast] = useState<string | null>(null);
    const toastTimeout = useRef<NodeJS.Timeout | null>(null);
    function showErrorToast(msg: string) {
    setErrorToast(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setErrorToast(null), 4000);
    }

    const handleToggleActive = async (product: Product, active: boolean) => {
    const headers = getAuthHeaders();
    if (!headers) return;
    mutate('/api/products', (currentProducts: Product[] | undefined) => {
      if (!currentProducts) return [];
      return currentProducts.map(p => 
        p.id === product.id ? { ...p, active } : p
      );
    }, false);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH', 
        headers,
        body: JSON.stringify({ active })
      });
      if (!res.ok) {
        const err = await res.json();
        showErrorToast(err.error || err.message || "Não foi possível atualizar o status.");
        mutate('/api/products');
        return;
      }
      mutate('/api/products');
    } catch (error) {
      showErrorToast("Não foi possível atualizar o status.");
      mutate('/api/products');
    }
    };
  // ----------------------------------------------------

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) {
        const err = await res.json();
        showErrorToast(err.error || err.message || "Falha ao excluir produto");
        return;
      }
      mutate('/api/products');
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Erro desconhecido");
    }
  };

  const handleSave = async (productData: Partial<Product>) => {
    setIsSaving(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(productData)
      });
      if (!res.ok) {
        const err = await res.json();
        showErrorToast(err.error || err.message || "Falha ao salvar produto");
        return;
      }
      mutate('/api/products');
      setIsModalOpen(false);
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Toast message={error instanceof Error ? error.message : 'Erro ao carregar produtos'} type="error" onClose={() => setErrorToast(null)} />
        <ErrorDisplay message={error instanceof Error ? error.message : 'Erro ao carregar produtos'} />
      </>
    );
  }

  return (
    <div className="p-6 md:p-8 animate-fade-in">
      {errorToast && (
        <Toast message={errorToast} type="error" onClose={() => setErrorToast(null)} />
      )}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Gestão de Estoque
        </h1>
        <Button onClick={handleOpenNew} icon={<Plus size={18} />}>
          Novo Produto
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar produto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
        
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2 rounded-lg focus:outline-none focus:border-amber-500"
        >
          <option value="all">Todos os tipos</option>
          <option value="CHOPP">Chopp</option>
          <option value="FOOD">Comida</option>
          <option value="DRINK">Bebida</option>
          <option value="OTHER">Outros</option>
        </select>
      </div>

      {/* CORREÇÃO AQUI: Passando a prop onToggleActive */}
      <ProductList 
        products={filteredProducts} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        onToggleActive={handleToggleActive}
      />

      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        product={editingProduct}
        isLoading={isSaving}
      />
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