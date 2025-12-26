import React from "react";
import { Table, CheckCircle, Plus } from "lucide-react";
import { Order } from "../../types/pdv";

// Estrutura para representar o slot da comanda no grid
export type ComandaSlot = {
  number: number;
  status: "LIVRE" | "OCUPADA" | "FECHADA";
  order?: Order;
};

interface TableGridProps {
  slots: ComandaSlot[];
  selectedComandaId: string | null;
  onSelectSlot: (slot: ComandaSlot) => void;
  onAddSlot: () => void;
  filter: 'TODAS' | 'ABERTAS' | 'LIVRES';
  setFilter: (filter: 'TODAS' | 'ABERTAS' | 'LIVRES') => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function TableGrid({
  slots,
  selectedComandaId,
  onSelectSlot,
  onAddSlot,
  filter,
  setFilter
}: TableGridProps) {

  const filteredSlots = slots.filter(slot => {
    if (filter === 'TODAS') return true;
    if (filter === 'ABERTAS') return slot.status === 'OCUPADA';
    if (filter === 'LIVRES') return slot.status === 'LIVRE';
    return true;
  });

  return (
    <div className="p-6 flex flex-col h-full">
      {/* Header com Filtros */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Comandas
        </h2>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {(['TODAS', 'ABERTAS', 'LIVRES'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${filter === f 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }
              `}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 overflow-y-auto pb-4">
        {filteredSlots.map((slot) => {
          const isSelected = slot.order?.id === selectedComandaId;
          
          let statusColor = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400"; // LIVRE
          let iconColor = "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500";
          let statusLabel = "Livre";

          if (slot.status === 'OCUPADA') {
            statusColor = "border-amber-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100";
            iconColor = "bg-amber-500/20 text-amber-500";
            statusLabel = "Aberta";
          } else if (slot.status === 'FECHADA') {
            statusColor = "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-100";
            iconColor = "bg-emerald-500/20 text-emerald-500";
            statusLabel = "Fechada";
          }

          if (isSelected) {
            statusColor += " ring-4 ring-amber-500/20 z-10";
          } else {
            statusColor += " hover:shadow-md hover:-translate-y-0.5";
          }

          return (
            <button
              key={slot.number}
              onClick={() => onSelectSlot(slot)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200
                flex flex-col items-center justify-between gap-3 aspect-square
                ${statusColor}
              `}
            >
              <div className="flex justify-between w-full items-start">
                <span className="text-xs font-bold opacity-50">#{slot.number.toString().padStart(2, '0')}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${iconColor.replace('text-', 'bg-').replace('/20', '/10')} ${slot.status === 'OCUPADA' ? 'text-amber-600' : slot.status === 'FECHADA' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {statusLabel}
                </span>
              </div>

              <div className={`p-3 rounded-full ${iconColor} transition-colors`}>
                {slot.status === 'FECHADA' ? <CheckCircle size={28} /> : <Table size={28} />}
              </div>

              <div className="text-center w-full">
                {slot.status === 'LIVRE' ? (
                  <span className="block text-sm font-medium opacity-60">Disponível</span>
                ) : (
                  <>
                    <span className="block font-bold text-lg truncate w-full">
                      {formatCurrency(slot.order?.total || 0)}
                    </span>
                  </>
                )}
              </div>
            </button>
          );
        })}

        {/* Botão de Adicionar Nova Comanda - Sempre visível se o filtro permitir */}
        {filter !== 'ABERTAS' && (
          <button
            onClick={onAddSlot}
            className="
              relative p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 
              bg-transparent text-slate-400 dark:text-slate-500
              hover:border-amber-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10
              transition-all duration-200 flex flex-col items-center justify-center gap-3 aspect-square
            "
          >
            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-amber-100 transition-colors">
              <Plus size={32} />
            </div>
            <span className="text-sm font-medium">Nova Comanda</span>
          </button>
        )}
      </div>
    </div>
  );
}
