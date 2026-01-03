"use client";
import React, { useEffect, useState, useRef } from "react";
import { Toast } from "@/components/ui/Toast";
import { Marmita, MarmitaFormValues } from "@/types/marmitas";
import { MarmitasList } from "./MarmitasList";
import { MarmitaForm } from "./MarmitaForm";
import ModifiersPanel from "./ModifiersPanel";
import Modal from "@/components/ui/Modal";

export default function MarmitasManager() {
   // Toast de erro
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  function showErrorToast(msg: string) {
    setErrorToast(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setErrorToast(null), 4000);
  }
  const [marmitas, setMarmitas] = useState<Marmita[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Marmita | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showModifiersModal, setShowModifiersModal] = useState<null | string>(null); // marmitaId
  const [modifiersPanelState, setModifiersPanelState] = useState<{ groupId?: string; itemId?: string; mode?: 'group' | 'item'; } | null>(null);

  function getAuthHeaders() {
    const token = localStorage.getItem("authToken");
    if (!token) return { "Content-Type": "application/json" };
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async function fetchMarmitas() {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch("/api/marmitas", { headers });
      if (!res.ok) {
        const err = await res.json();
        showErrorToast(err.error || err.message || "Erro ao buscar marmitas.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMarmitas(data);
    } catch (error) {
      showErrorToast("Erro ao buscar marmitas.");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchMarmitas();
  }, []);

  function handleCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function handleEdit(marmita: Marmita) {
    setEditing(marmita);
    setShowForm(true);
  }

  // --- NOVA FUNÇÃO ADICIONADA AQUI ---
  async function handleToggleActive(marmita: Marmita, active: boolean) {
    // 1. Atualização Otimista (Muda na tela antes do banco responder)
    setMarmitas((prev) =>
      prev.map((m) => (m.id === marmita.id ? { ...m, active } : m))
    );

    try {
      const headers = getAuthHeaders();
      // Assume que sua API aceita PATCH para atualizar apenas um campo. 
      // Se sua API exigir PUT com todos os dados, me avise.
      await fetch(`/api/marmitas/${marmita.id}`, {
        method: "PATCH", 
        headers,
        body: JSON.stringify({ active }),
      });
      // Não precisa fazer fetchMarmitas() aqui se a atualização otimista funcionou, economiza requisição.
    } catch (error) {
      showErrorToast("Erro ao atualizar o status da marmita.");
      setMarmitas((prev) =>
        prev.map((m) => (m.id === marmita.id ? { ...m, active: !active } : m))
      );
    }
  }
  // ------------------------------------

  async function handleDelete(marmita: Marmita) {
    if (!confirm(`Excluir marmita "${marmita.name}"?`)) return;
    const headers = getAuthHeaders();
    try {
      const res = await fetch(`/api/marmitas/${marmita.id}`, { method: "DELETE", headers });
      if (!res.ok) {
        const err = await res.json();
        showErrorToast(err.error || err.message || "Erro ao excluir marmita.");
        return;
      }
      fetchMarmitas();
    } catch (error) {
      showErrorToast("Erro ao excluir marmita.");
    }
  }

  async function handleSubmit(values: MarmitaFormValues) {
    const headers = getAuthHeaders();
    try {
      if (editing) {
        const res = await fetch(`/api/marmitas/${editing.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          const err = await res.json();
          showErrorToast(err.error || err.message || "Erro ao editar marmita.");
          setShowForm(false);
          fetchMarmitas();
          return;
        }
        setShowForm(false);
        fetchMarmitas();
      } else {
        const res = await fetch("/api/marmitas", {
          method: "POST",
          headers,
          body: JSON.stringify(values),
        });
        if (res.ok) {
          const newMarmita = await res.json();
          setShowForm(false);
          fetchMarmitas();
          setEditing(newMarmita);
          setShowModifiersModal(newMarmita.id);
        } else {
          const err = await res.json();
          showErrorToast(err.error || err.message || "Erro ao criar marmita.");
          setShowForm(false);
          fetchMarmitas();
        }
      }
    } catch (error) {
      showErrorToast("Erro ao salvar marmita.");
      setShowForm(false);
      fetchMarmitas();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span role="img" aria-label="marmita">🍱</span> Marmitas
        </h2>
        <button
          className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-1 w-full sm:w-auto"
          onClick={handleCreate}
        >
          <span className="text-lg">+</span> Nova Marmita
        </button>
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Editar Marmita" : "Nova Marmita"}>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <MarmitaForm
              initialValues={editing || undefined}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              isEdit={!!editing}
            />
          </div>
          {(editing || showModifiersModal) && (
            <div className="flex-1 bg-white/60 dark:bg-white/10 rounded-lg p-4 shadow border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span role="img" aria-label="modificadores">🛠️</span> Modificadores
              </h3>
              <ModifiersPanel
                marmitaId={editing ? editing.id : showModifiersModal!}
                onEditGroup={groupId => setModifiersPanelState({ groupId, mode: 'group' })}
                onAddGroup={() => setModifiersPanelState({ mode: 'group' })}
                onEditItem={(groupId, itemId) => setModifiersPanelState({ groupId, itemId, mode: 'item' })}
                onAddItem={groupId => setModifiersPanelState({ groupId, mode: 'item' })}
              />
            </div>
          )}
        </div>
      </Modal>
      {/* Modal para editar/adicionar grupo/item */}
      <Modal
        open={!!modifiersPanelState}
        onClose={() => setModifiersPanelState(null)}
        title={modifiersPanelState?.mode === 'group' ? (modifiersPanelState?.groupId ? 'Editar Grupo de Modificador' : 'Novo Grupo de Modificador') : (modifiersPanelState?.itemId ? 'Editar Item de Modificador' : 'Novo Item de Modificador')}
      >
        {modifiersPanelState?.mode === 'group' && (
          <ModifiersPanel.GroupForm
            marmitaId={editing ? editing.id : showModifiersModal!}
            groupId={modifiersPanelState.groupId}
            onClose={() => setModifiersPanelState(null)}
          />
        )}
        {modifiersPanelState?.mode === 'item' && modifiersPanelState.groupId && (
          <ModifiersPanel.ItemForm
            groupId={modifiersPanelState.groupId}
            itemId={modifiersPanelState.itemId}
            onClose={() => setModifiersPanelState(null)}
          />
        )}
      </Modal>
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow">
        {loading ? (
          <div className="flex items-center gap-2 text-blue-600 animate-pulse"><span className="h-4 w-4 rounded-full bg-blue-300 animate-bounce"></span> Carregando...</div>
        ) : (
          /* CORREÇÃO AQUI: PASSEI A PROP onToggleActive */
          <MarmitasList 
            marmitas={marmitas} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
            onToggleActive={handleToggleActive}
          />
        )}
      </div>
    {errorToast && (
      <Toast message={errorToast} type="error" onClose={() => setErrorToast(null)} />
    )}
    </div>
  );
}