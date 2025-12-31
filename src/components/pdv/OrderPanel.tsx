import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Trash2, DollarSign, User, Plus, Table as TableIcon } from 'lucide-react';
import { Order, Product } from "../../types/pdv";
import { Button } from '../ui/Button';

interface OrderPanelProps {
  comanda: Order | null;
  selectedTableNumber: number | null;
  products: Product[];
  onAddItem: (productId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onToggleCourtesy: (itemId: string, currentStatus: boolean) => void;
  onCloseAccount: () => void;
  onCancelOrder: () => void;
  onOpenTable: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function OrderPanel({
  comanda,
  selectedTableNumber,
  products,
  onAddItem,
  onRemoveItem,
  onToggleCourtesy,
  onCancelOrder,
  onCloseAccount,
  onOpenTable
}: OrderPanelProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [showAddProduct, setShowAddProduct] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Extrai categorias únicas dos produtos
  const categories = useMemo(() => {
    const cats = products
      .filter((p) => p.category !== "PACKED_LUNCH")
      .map((p) => p.category)
      .filter(Boolean);
    return Array.from(new Set(cats));
  }, [products]);

  // Produtos filtrados por busca e categoria
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.category !== "PACKED_LUNCH")
      .filter((p) =>
        (!categoryFilter || p.category === categoryFilter) &&
        (!search || p.name.toLowerCase().includes(search.toLowerCase()))
      );
  }, [products, search, categoryFilter]);

  // Reset form when comanda changes
  useEffect(() => {
    setSelectedProduct("");
    setQuantity(1);
  }, [comanda?.id]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct && quantity > 0) {
      onAddItem(selectedProduct, quantity);
      setSelectedProduct("");
      setQuantity(1);
      setSearch("");
      if (searchInputRef.current) searchInputRef.current.focus();
    }
  };

  // ESTADO: Nenhuma mesa selecionada
  if (!comanda && !selectedTableNumber) {
    return (
      // ALTERADO: h-full -> h-screen sticky top-0
      <div className="h-screen sticky top-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <TableIcon size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">Nenhuma mesa selecionada</p>
        <p className="text-sm mt-2">Selecione uma mesa para ver os detalhes ou abrir uma nova comanda.</p>
      </div>
    );
  }

  // ESTADO: Mesa selecionada mas sem comanda (Livre)
  if (!comanda && selectedTableNumber) {
    return (
      // ALTERADO: h-full -> h-screen sticky top-0
      <div className="h-screen sticky top-0 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl transition-colors duration-200">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Mesa {selectedTableNumber}</h3>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Livre</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <TableIcon size={64} className="mb-6 text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-6">Esta mesa está livre.</p>
          <Button 
            onClick={onOpenTable}
            className="w-full max-w-xs py-4 text-lg"
          >
            Abrir Comanda
          </Button>
        </div>
      </div>
    );
  }

  if (!comanda) return null;

  // ESTADO PRINCIPAL: Comanda Aberta
  return (
    // Painel fixo à direita, sempre visível ao scrollar
    <div className="fixed right-0 top-0 h-screen w-[420px] max-w-full flex flex-col bg-white dark:bg-slate-900 border-l border-t border-slate-200 dark:border-slate-800 transition-colors duration-200 z-30">
      
      {/* Header (Tamanho fixo) */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {comanda.tableId}
          </h3>
          <span className="text-xs bg-amber-500 text-slate-950 px-2 py-1 rounded font-bold uppercase">
            Em Aberto
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Aberta em{" "}
          {new Date(comanda.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Items List (Ocupa o espaço restante e rola) */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-2">
        {comanda.items && comanda.items.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <p>Nenhum item adicionado.</p>
          </div>
        ) : (
          comanda?.items?.map((item) => (
            <div
              key={item.id}
              className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg flex justify-between items-start group border border-slate-200 dark:border-transparent transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-slate-800 dark:text-slate-200 break-anywhere">
                  {item.product?.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {item.quantity}x {formatCurrency(Number(item.unitPrice))}
                  </span>
                  {item.isCourtesy && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-1 rounded uppercase font-bold">
                      Cortesia
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className={`p-1.5 rounded transition-colors ${
                    item.isCourtesy
                      ? "text-emerald-500 bg-emerald-500/10"
                      : "text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                  title="Cortesia"
                  onClick={() => onToggleCourtesy(item.id, item.isCourtesy)}
                >
                  <DollarSign size={14} />
                </button>
                <button
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  title="Remover"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Item Form (Tamanho dinâmico, mas fixo na parte inferior da área de scroll) */}
      <div className="p-0 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-slate-500 uppercase bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-700 transition rounded-t"
          onClick={() => setShowAddProduct((v) => !v)}
          aria-expanded={showAddProduct}
        >
          <span>Adicionar Produto</span>
          {showAddProduct ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showAddProduct && (
          <div className="p-4 pt-2">
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="flex gap-2 mb-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar produto..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  autoComplete="off"
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown') {
                      const first = document.getElementById('product-option-0');
                      if (first) (first as HTMLElement).focus();
                    }
                  }}
                />
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="w-36 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                >
                  <option value="">Todas categorias</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              {/* Lista de sugestões com scroll próprio (max-h-48) */}
              <div className="max-h-48 overflow-y-auto rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mb-2">
                {filteredProducts.length === 0 && (
                  <div className="p-2 text-slate-400 text-sm">Nenhum produto encontrado.</div>
                )}
                {filteredProducts.map((p, idx) => (
                  <button
                    key={p.id}
                    id={`product-option-${idx}`}
                    type="button"
                    className={`w-full flex items-center gap-2 px-2 py-2 text-left text-sm hover:bg-amber-100 dark:hover:bg-amber-900/20 focus:bg-amber-200 dark:focus:bg-amber-900/40 transition ${selectedProduct === p.id ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}
                    onClick={() => setSelectedProduct(p.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') setSelectedProduct(p.id);
                      if (e.key === 'ArrowDown') {
                        const next = document.getElementById(`product-option-${idx+1}`);
                        if (next) (next as HTMLElement).focus();
                      }
                      if (e.key === 'ArrowUp') {
                        if (idx === 0 && searchInputRef.current) searchInputRef.current.focus();
                        const prev = document.getElementById(`product-option-${idx-1}`);
                        if (prev) (prev as HTMLElement).focus();
                      }
                    }}
                    tabIndex={0}
                  >
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded-lg border bg-white flex-shrink-0"
                        style={{ minWidth: 40, minHeight: 40, maxWidth: 40, maxHeight: 40 }}
                      />
                    )}
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[90px] sm:max-w-[140px]">{p.name}</span>
                    <span className="ml-2 flex-shrink-0 text-emerald-600 dark:text-emerald-400 font-bold text-right min-w-[70px] max-w-[80px] truncate pr-2">{formatCurrency(Number(p.sellingPrice))}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-20 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-center text-sm"
                />
                <button
                  type="submit"
                  disabled={!selectedProduct}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Totals & Actions (Tamanho fixo, sempre no rodapé) */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>Subtotal</span>
            <span>{formatCurrency(comanda.total)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <User size={14} /> Gorjeta (10%)
            </span>
            <input
              type="checkbox"
              className="accent-amber-500 h-4 w-4"
              disabled
            />
          </div>
          <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Total</span>
            <span>{formatCurrency(comanda.total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onCancelOrder}
            variant="danger"
            className="w-full py-3 text-sm"
            title="Cancelar comanda aberta por engano"
          >
            Cancelar
          </Button>
          <Button
            onClick={onCloseAccount}
            disabled={comanda?.items?.length === 0}
            variant="primary"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 text-sm focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}