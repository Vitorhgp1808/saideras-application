import React, { useState, useEffect } from 'react';
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
    }
  };

  if (!comanda && !selectedTableNumber) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <TableIcon size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">Nenhuma mesa selecionada</p>
        <p className="text-sm mt-2">Selecione uma mesa para ver os detalhes ou abrir uma nova comanda.</p>
      </div>
    );
  }

  if (!comanda && selectedTableNumber) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl transition-colors duration-200">
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

  // Aqui comanda é garantido não nulo pelo if acima, mas TypeScript precisa de ajuda
  if (!comanda) return null;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl transition-colors duration-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
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

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
                <p className="font-medium text-slate-800 dark:text-slate-200">
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
                {/* Botão de Cortesia não implementado funcionalmente na API ainda, mas visualmente presente */}
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

      {/* Add Item Form (Compact) */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs font-bold text-slate-500 uppercase mb-2">
          Adicionar Produto
        </p>
        <form onSubmit={handleAdd} className="space-y-3">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
          >
            <option value="">Selecione um produto...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {formatCurrency(Number(p.sellingPrice))}
              </option>
            ))}
          </select>

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

      {/* Totals & Actions */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>Subtotal</span>
            <span>{formatCurrency(comanda.total)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <User size={14} /> Gorjeta (10%)
            </span>
            {/* Checkbox visual por enquanto */}
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