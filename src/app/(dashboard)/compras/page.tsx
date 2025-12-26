"use client";

import React, { useState } from "react";
import {
  Truck,
  Calendar,
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Supplier, Purchase, ProductFilter } from "../../../types/purchases";
import { Button } from "../../../components/ui/Button";
import useSWR, { mutate } from 'swr';
import { fetcher } from '../../../lib/fetcher';

export default function ComprasPage() {
  // --- Filter State ---
  const [filterTerm, setFilterTerm] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  // --- API Data State ---
  const { data: purchases = [], error: purchasesError, isLoading: isPurchasesLoading } = useSWR<Purchase[]>(`/api/purchases?startDate=${dateStart}&endDate=${dateEnd}`, fetcher);
  const { data: products = [], error: productsError, isLoading: isProductsLoading } = useSWR<ProductFilter[]>('/api/products', fetcher);
  const {
    data: suppliersData = [],
    error: suppliersError,
    isLoading: isSuppliersLoading,
  } = useSWR<Supplier[]>("/api/suppliers", fetcher);

  const suppliers: Supplier[] = suppliersData.map((s) => ({
    ...s,
    productsProvided: s.productsProvided || [],
  }));

  const isLoading = isPurchasesLoading || isProductsLoading || isSuppliersLoading;
  const error = purchasesError || productsError || suppliersError;

  // --- Purchase Entry State ---
  const [newPurchase, setNewPurchase] = useState({
    supplierId: "",
    productId: "",
    quantity: "",
    costPrice: "",
    batch: "",
    expiryDate: "",
  });

  // --- Supplier Management State ---
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(
    null
  );
  const [supplierFormData, setSupplierFormData] = useState({
    name: "",
    cnpj: "",
    contact: "",
    productsProvided: "",
  });

  // --- Auth Helper ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return null;
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // --- Filter Logic ---
  const filteredPurchases = purchases.filter((p) => {
    const term = filterTerm.toLowerCase();
    const productName = p.product?.name || "";
    const supplierName = p.supplier?.name || "";
    const batch = p.batch || "";

    return (
      productName.toLowerCase().includes(term) ||
      supplierName.toLowerCase().includes(term) ||
      batch.toLowerCase().includes(term)
    );
  });

  // --- Handlers ---

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newPurchase.supplierId ||
      !newPurchase.productId ||
      !newPurchase.quantity ||
      !newPurchase.costPrice
    ) {
      alert("Por favor preencha os campos obrigatórios");
      return;
    }

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers,
        body: JSON.stringify({
          supplierId: newPurchase.supplierId,
          productId: newPurchase.productId,
          quantity: parseFloat(newPurchase.quantity),
          costPrice: parseFloat(newPurchase.costPrice),
          batch: newPurchase.batch,
          expiryDate: newPurchase.expiryDate || undefined,
        }),
      });

      if (!res.ok) throw new Error("Erro ao registrar compra.");

      setNewPurchase({
        supplierId: "",
        productId: "",
        quantity: "",
        costPrice: "",
        batch: "",
        expiryDate: "",
      });

      alert("Compra registrada e estoque atualizado!");
      mutate(`/api/purchases?startDate=${dateStart}&endDate=${dateEnd}`);
    } catch (err) {
      if (err instanceof Error) alert(err.message);
      else alert("Erro desconhecido");
    }
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productsArray = supplierFormData.productsProvided
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const url = editingSupplierId
        ? `/api/suppliers/${editingSupplierId}`
        : "/api/suppliers";
      const method = editingSupplierId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          name: supplierFormData.name,
          cnpj: supplierFormData.cnpj,
          contact: supplierFormData.contact,
          productsProvided: productsArray,
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar fornecedor.");

      setIsSupplierModalOpen(false);
      mutate('/api/suppliers');
    } catch (err) {
      if (err instanceof Error) alert(err.message);
      else alert("Erro desconhecido");
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm("Excluir fornecedor?")) return;

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Erro ao excluir fornecedor.");
      mutate('/api/suppliers');
    } catch (err) {
      if (err instanceof Error) alert(err.message);
      else alert("Erro desconhecido");
    }
  };

  const handleOpenSupplierModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplierId(supplier.id);
      setSupplierFormData({
        name: supplier.name,
        cnpj: supplier.cnpj,
        contact: supplier.contact,
        productsProvided: supplier.productsProvided
          ? supplier.productsProvided.join(", ")
          : "",
      });
    } else {
      setEditingSupplierId(null);
      setSupplierFormData({
        name: "",
        cnpj: "",
        contact: "",
        productsProvided: "",
      });
    }
    setIsSupplierModalOpen(true);
  };

  if (isLoading && purchases.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Erro ao carregar dados: {error instanceof Error ? error.message : 'Erro desconhecido'}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Register Purchase Form */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Package className="text-amber-500" size={20} />
            Registrar Nova Compra
          </h3>
          <form onSubmit={handlePurchaseSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                  Fornecedor *
                </label>
                <select
                  required
                  value={newPurchase.supplierId}
                  onChange={(e) =>
                    setNewPurchase({
                      ...newPurchase,
                      supplierId: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Selecione...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                  Produto *
                </label>
                <select
                  required
                  value={newPurchase.productId}
                  onChange={(e) => {
                    const prod = products.find((p) => p.id === e.target.value);
                    setNewPurchase({
                      ...newPurchase,
                      productId: e.target.value,
                      costPrice: prod?.costPrice
                        ? prod.costPrice.toString()
                        : newPurchase.costPrice,
                    });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Selecione...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                  Qtd. Entrada *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="0.00"
                  value={newPurchase.quantity}
                  onChange={(e) =>
                    setNewPurchase({ ...newPurchase, quantity: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                  Custo Unit. (R$) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="0.00"
                  value={newPurchase.costPrice}
                  onChange={(e) =>
                    setNewPurchase({
                      ...newPurchase,
                      costPrice: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                  Lote
                </label>
                <input
                  type="text"
                  placeholder="Ex: A1"
                  value={newPurchase.batch}
                  onChange={(e) =>
                    setNewPurchase({ ...newPurchase, batch: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                  Validade
                </label>
                <input
                  type="date"
                  value={newPurchase.expiryDate}
                  onChange={(e) =>
                    setNewPurchase({
                      ...newPurchase,
                      expiryDate: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-lg mt-2 transition-colors"
            >
              Registrar Entrada de Estoque
            </Button>
          </form>
        </div>

        {/* Suppliers List */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Truck className="text-amber-500" size={20} />
              Fornecedores
            </h3>
            <button
              onClick={() => handleOpenSupplierModal()}
              className="text-sm bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-slate-900 px-3 py-1 rounded-full transition-all font-medium flex items-center gap-1"
            >
              <Plus size={14} /> Novo
            </button>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 group relative"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">
                      {supplier.name}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">
                      CNPJ: {supplier.cnpj}
                    </p>
                    <p className="text-sm text-slate-500">
                      Contato: {supplier.contact}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenSupplierModal(supplier)}
                      className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {supplier.productsProvided &&
                    supplier.productsProvided.map((p, i) => (
                      <span
                        key={i}
                        className="text-xs bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded border border-slate-200 dark:border-slate-700"
                      >
                        {p}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History Table & Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transition-colors duration-200">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Histórico de Compras
          </h3>

          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Buscar produto, lote..."
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 w-full md:w-48"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5">
              <span className="text-xs text-slate-400">De:</span>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="bg-transparent text-sm text-slate-900 dark:text-slate-100 focus:outline-none w-28"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5">
              <span className="text-xs text-slate-400">Até:</span>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="bg-transparent text-sm text-slate-900 dark:text-slate-100 focus:outline-none w-28"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm font-medium uppercase border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Fornecedor</th>
                <th className="px-6 py-3">Produto</th>
                <th className="px-6 py-3">Lote</th>
                <th className="px-6 py-3 text-right">Custo Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar
                          size={14}
                          className="text-slate-400 dark:text-slate-500"
                        />
                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-700 dark:text-slate-300">
                      {purchase.supplier?.name || "N/A"}
                    </td>
                    <td className="px-6 py-3 text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-amber-600 dark:text-amber-500">
                        {purchase.quantity}x
                      </span>{" "}
                      {purchase.product?.name || "N/A"}
                    </td>
                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {purchase.batch || "-"}
                    </td>
                    <td className="px-6 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                      R$ {(purchase.costPrice * purchase.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    Nenhuma compra encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {editingSupplierId ? "Editar Fornecedor" : "Novo Fornecedor"}
              </h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  required
                  value={supplierFormData.name}
                  onChange={(e) =>
                    setSupplierFormData({
                      ...supplierFormData,
                      name: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0000-00"
                    value={supplierFormData.cnpj}
                    onChange={(e) =>
                      setSupplierFormData({
                        ...supplierFormData,
                        cnpj: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                    Contato
                  </label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={supplierFormData.contact}
                    onChange={(e) =>
                      setSupplierFormData({
                        ...supplierFormData,
                        contact: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">
                  Produtos Fornecidos (separados por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cerveja, Refrigerante, Gás"
                  value={supplierFormData.productsProvided}
                  onChange={(e) =>
                    setSupplierFormData({
                      ...supplierFormData,
                      productsProvided: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="flex-1 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-lg transition-colors"
                >
                  {editingSupplierId ? "Salvar Alterações" : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
