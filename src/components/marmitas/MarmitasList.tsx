import React, { useState, useRef } from "react";
import { Switch } from "@headlessui/react";
import { Pencil, Trash2 } from "lucide-react";
import { Marmita } from "@/types/marmitas";
import { Toast } from "@/components/ui/Toast";

// CORREÇÃO AQUI: Adicionei a definição da interface
interface MarmitasListProps {
  marmitas: Marmita[];
  onEdit: (marmita: Marmita) => void;
  onDelete: (marmita: Marmita) => void;
  onToggleActive?: (marmita: Marmita, active: boolean) => void;
}

export function MarmitasList({ marmitas, onEdit, onDelete, onToggleActive }: MarmitasListProps) {
  const marmitasArray = Array.isArray(marmitas) ? marmitas : [];
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMsg(null), 4000);
  }

  // Wrappers para capturar erros dos handlers
  const handleEdit = (marmita: Marmita) => {
    try {
      onEdit(marmita);
    } catch (err: any) {
      showToast(err?.message || "Erro ao editar marmita.");
    }
  };
  const handleDelete = (marmita: Marmita) => {
    try {
      onDelete(marmita);
    } catch (err: any) {
      showToast(err?.message || "Erro ao excluir marmita.");
    }
  };
  const handleToggleActive = (marmita: Marmita, active: boolean) => {
    try {
      onToggleActive && onToggleActive(marmita, active);
    } catch (err: any) {
      showToast(err?.message || "Erro ao alterar status da marmita.");
    }
  };

  return (
    <>
      {toastMsg && (
        <Toast message={toastMsg} type="error" onClose={() => setToastMsg(null)} />
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-separate border-spacing-y-1">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs">
              <th className="px-4 py-2 text-left rounded-tl-lg">Foto</th>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">Descrição</th>
              <th className="px-4 py-2 text-left">Preço</th>
              <th className="px-4 py-2 text-left">Ativo</th>
              <th className="px-4 py-2 rounded-tr-lg">Ações</th>
            </tr>
          </thead>
          <tbody>
            {marmitasArray.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 py-8">Nenhuma marmita cadastrada.</td>
              </tr>
            ) : (
              marmitasArray.map((marmita) => (
                <tr key={marmita.id} className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm hover:shadow transition-all">
                  <td className="px-4 py-2">
                    {marmita.imageUrl ? (
                      <img src={marmita.imageUrl} alt={marmita.name} className="h-12 w-12 object-cover rounded border" />
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-100">{marmita.name}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{marmita.description}</td>
                  <td className="px-4 py-2 text-emerald-600 dark:text-emerald-400 font-bold">R$ {Number(marmita.sellingPrice).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <Switch
                      checked={marmita.active}
                      onChange={(value) => handleToggleActive(marmita, value)}
                      className={`${marmita.active ? 'bg-emerald-600' : 'bg-slate-300'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                    >
                      <span
                        className={`${marmita.active ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </td>
                  <td className="px-2 py-4 min-w-[80px]">
                    <div className="flex flex-row flex-nowrap justify-center items-center gap-1 sm:gap-2">
                      <button 
                        onClick={() => handleEdit(marmita)}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                        title="Editar"
                        tabIndex={0}
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(marmita)}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                        title="Excluir"
                        tabIndex={0}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}