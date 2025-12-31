"use client";
import React, { useEffect, useState } from "react";
import { Marmita, MarmitaFormValues } from "@/types/marmitas";
import { MarmitasList } from "./MarmitasList";
import { MarmitaForm } from "./MarmitaForm";
import ModifiersPanel from "./ModifiersPanel";
import Modal from "@/components/ui/Modal";

export default function MarmitasManager() {
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
    const headers = getAuthHeaders();
    const res = await fetch("/api/marmitas", { headers });
    const data = await res.json();
    setMarmitas(data);
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
      console.error("Erro ao atualizar status", error);
      // Reverte a mudança se der erro na API
      setMarmitas((prev) =>
        prev.map((m) => (m.id === marmita.id ? { ...m, active: !active } : m))
      );
      alert("Erro ao atualizar o status da marmita.");
    }
  }
  // ------------------------------------

  async function handleDelete(marmita: Marmita) {
    if (!confirm(`Excluir marmita "${marmita.name}"?`)) return;
    const headers = getAuthHeaders();
    await fetch(`/api/marmitas/${marmita.id}`, { method: "DELETE", headers });
    fetchMarmitas();
  }

  async function handleSubmit(values: MarmitaFormValues) {
    const headers = getAuthHeaders();
    if (editing) {
      await fetch(`/api/marmitas/${editing.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(values),
      });
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
        setShowForm(false);
        fetchMarmitas();
      }
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
    </div>
  );
}