"use client";
import React, { useEffect, useState, useRef } from "react";
import { Toast } from "@/components/ui/Toast";
import { Marmita, MarmitaFormValues } from "@/types/marmitas";
import { MarmitasList } from "./MarmitasList";
import { MarmitaForm } from "./MarmitaForm";
import ModifiersPanel from "./ModifiersPanel"; // Importação padrão
import Modal from "@/components/ui/Modal";

export default function MarmitasManager() {
  // --- Estados Gerais ---
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);

  const [marmitas, setMarmitas] = useState<Marmita[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar o formulário principal da Marmita
  const [editing, setEditing] = useState<Marmita | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Estado auxiliar para mostrar o painel logo após criar uma marmita
  const [showModifiersModal, setShowModifiersModal] = useState<null | string>(null); 

  // --- Helpers ---

  function showErrorToast(msg: string) {
    setErrorToast(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setErrorToast(null), 4000);
  }

  function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  // --- Fetch Data ---

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

  // --- Handlers Marmita ---

  function handleCreate() {
    setEditing(null);
    setShowForm(true);
    setShowModifiersModal(null);
  }

  function handleEdit(marmita: Marmita) {
    setEditing(marmita);
    setShowForm(true);
    setShowModifiersModal(null);
  }

  async function handleToggleActive(marmita: Marmita, active: boolean) {
    // Atualização Otimista
    setMarmitas((prev) =>
      prev.map((m) => (m.id === marmita.id ? { ...m, active } : m))
    );

    try {
      const headers = getAuthHeaders();
      await fetch(`/api/marmitas/${marmita.id}`, {
        method: "PATCH", 
        headers,
        body: JSON.stringify({ active }),
      });
    } catch (error) {
      showErrorToast("Erro ao atualizar o status da marmita.");
      // Reverte em caso de erro
      setMarmitas((prev) =>
        prev.map((m) => (m.id === marmita.id ? { ...m, active: !active } : m))
      );
    }
  }

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
        // Edição
        const res = await fetch(`/api/marmitas/${editing.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          const err = await res.json();
          showErrorToast(err.error || err.message || "Erro ao editar marmita.");
          return;
        }
        setShowForm(false);
        fetchMarmitas();
      } else {
        // Criação
        const res = await fetch("/api/marmitas", {
          method: "POST",
          headers,
          body: JSON.stringify(values),
        });
        if (res.ok) {
          const newMarmita = await res.json();
          // Não fecha o form, mas muda para modo edição para permitir adicionar modificadores
          setEditing(newMarmita);
          setShowModifiersModal(newMarmita.id);
          fetchMarmitas();
          // showForm continua true
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

  // --- Render ---

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

      {/* MODAL PRINCIPAL: Formulário da Marmita + Painel de Modificadores */}
      <Modal 
        open={showForm} 
        onClose={() => setShowForm(false)} 
        title={editing ? "Editar Marmita" : "Nova Marmita"}
      >
        <div className="flex flex-col md:flex-row gap-8">
          {/* Lado Esquerdo: Dados da Marmita */}
          <div className="flex-1">
            <MarmitaForm
              initialValues={editing || undefined}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              isEdit={!!editing}
            />
          </div>

          {/* Lado Direito: Modificadores (Só aparece se já existir a marmita) */}
          {(editing || showModifiersModal) && (
            <div className="flex-1 bg-white/60 dark:bg-white/10 rounded-lg p-4 shadow border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span role="img" aria-label="modificadores">🛠️</span> Modificadores
              </h3>
              
              {/* LÓGICA A: O ModifiersPanel gerencia seus próprios formulários e modais internamente.
                 Passamos props vazias apenas para satisfazer a interface TypeScript,
                 pois não queremos controlar o estado aqui no pai.
              */}
              <ModifiersPanel
                marmitaId={editing ? editing.id : showModifiersModal!}
                onAddGroup={() => {}}
                onEditGroup={() => {}}
                onAddItem={() => {}}
                onEditItem={() => {}}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Lista de Marmitas */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow">
        {loading ? (
          <div className="flex items-center gap-2 text-blue-600 animate-pulse">
            <span className="h-4 w-4 rounded-full bg-blue-300 animate-bounce"></span> Carregando...
          </div>
        ) : (
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