import React, { useEffect, useState, useRef } from "react";
import { Pencil, Trash2 } from "lucide-react";
import ModifierGroupForm from "@/components/modifiers/ModifierGroupForm";
import ModifierItemForm from "@/components/modifiers/ModifierItemForm";
import Modal from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { ModifierGroup, ModifierItem } from "@prisma/client";

interface ModifiersPanelProps {
  marmitaId: string;
  onEditGroup: (groupId: string) => void;
  onAddGroup: () => void;
  onEditItem: (groupId: string, itemId: string) => void;
  onAddItem: (groupId: string) => void;
}

// 1. Remova o "export default" daqui e declare como const
const ModifiersPanel = ({ marmitaId }: ModifiersPanelProps) => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para controle interno (caso use o Modal interno deste componente)
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [showItemFormGroupId, setShowItemFormGroupId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ModifierItem | null>(null);
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMsg(null), 4000);
  }

  useEffect(() => {
    if (marmitaId) fetchGroups(marmitaId);
  }, [marmitaId]);

  async function fetchGroups(marmitaId: string) {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/marmitas/${marmitaId}/modifiers`, { headers });
      if (!res.ok) throw new Error("Erro ao buscar grupos de modificadores");
      const data = await res.json();
      setGroups(data as ModifierGroup[]);
    } catch (err: any) {
      showToast(err?.message || "Erro ao buscar grupos de modificadores.");
    }
    setLoading(false);
  }

  // ... (Mantenha as funções handleAddGroup, handleEditGroup, handleDeleteGroup, etc. exatamente como estavam)
  async function handleAddGroup(data: { name: string; minSelections: number; maxSelections: number; order: number }) {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const headers: HeadersInit = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(`/api/marmitas/${marmitaId}/modifiers`, { method: "POST", headers, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Erro ao criar grupo de modificador");
      await fetchGroups(marmitaId);
      setShowGroupForm(false);
      setEditingGroup(null);
      setMessage({ type: 'success', text: 'Grupo criado com sucesso!' });
    } catch (err: any) { showToast(err?.message || "Erro ao criar grupo de modificador."); }
    setLoading(false);
  }

  async function handleEditGroup(data: { name: string; minSelections: number; maxSelections: number; order: number }) {
    if (!editingGroup) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const headers: HeadersInit = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(`/api/marmitas/${marmitaId}/modifiers/${editingGroup.id}`, { method: "PUT", headers, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Erro ao editar grupo de modificador");
      await fetchGroups(marmitaId);
      setShowGroupForm(false);
      setEditingGroup(null);
      setMessage({ type: 'success', text: 'Grupo editado com sucesso!' });
    } catch (err: any) { showToast(err?.message || "Erro ao editar grupo de modificador."); }
    setLoading(false);
  }

  async function handleDeleteGroup(groupId: string) {
    if (!window.confirm("Tem certeza que deseja excluir este grupo?")) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/marmitas/${marmitaId}/modifiers/${groupId}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Erro ao excluir grupo de modificador");
      await fetchGroups(marmitaId);
      setMessage({ type: 'success', text: 'Grupo excluído com sucesso!' });
    } catch (err: any) { showToast(err?.message || "Erro ao excluir grupo de modificador."); }
    setLoading(false);
  }

  async function handleAddItem(groupId: string, data: { name: string; priceExtra: number; order: number }) {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const headers: HeadersInit = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(`/api/modifiers/${groupId}/items`, { method: "POST", headers, body: JSON.stringify({ ...data, productId: marmitaId }) });
      if (!res.ok) throw new Error("Erro ao criar item de modificador");
      await fetchGroups(marmitaId);
      setShowItemFormGroupId(null);
      setEditingItem(null);
      setMessage({ type: 'success', text: 'Item criado com sucesso!' });
    } catch (err: any) { showToast(err?.message || "Erro ao criar item de modificador."); }
    setLoading(false);
  }

  async function handleEditItem(groupId: string, itemId: string, data: { name: string; priceExtra: number; order: number }) {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const headers: HeadersInit = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(`/api/modifiers/${groupId}/items/${itemId}`, { method: "PUT", headers, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Erro ao editar item de modificador");
      await fetchGroups(marmitaId);
      setShowItemFormGroupId(null);
      setEditingItem(null);
      setMessage({ type: 'success', text: 'Item editado com sucesso!' });
    } catch (err: any) { showToast(err?.message || "Erro ao editar item de modificador."); }
    setLoading(false);
  }

  async function handleDeleteItem(groupId: string, itemId: string) {
    if (!window.confirm("Tem certeza que deseja excluir este item?")) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/modifiers/${groupId}/items/${itemId}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Erro ao excluir item de modificador");
      await fetchGroups(marmitaId);
      setMessage({ type: 'success', text: 'Item excluído com sucesso!' });
    } catch (err: any) { showToast(err?.message || "Erro ao excluir item de modificador."); }
    setLoading(false);
  }

  return (
    <div className="mt-6">
      {toastMsg && <Toast message={toastMsg} type="error" onClose={() => setToastMsg(null)} />}
      {message && (
        <div className={`mb-4 px-4 py-2 rounded font-semibold ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      {/* ... (Todo o JSX de listagem que você já tinha) ... */}
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span role="img" aria-label="grupos">🧩</span> Grupos de Modificadores
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((g: any) => (
          <div key={g.id} className="border rounded-xl p-5 bg-linear-to-br from-white/80 to-blue-50 dark:from-white/10 dark:to-blue-900 shadow flex flex-col max-w-2xl w-full mx-auto">
             <div className="flex justify-between items-start mb-2">
               <div className="flex-1 min-w-0">
                 <span className="font-semibold text-lg text-blue-700 dark:text-blue-300 block">{g.name}</span>
                 <span className="mt-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded block w-fit">min: {g.minSelections}</span>
                 <span className="mt-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded block w-fit">max: {g.maxSelections}</span>
               </div>
               <div className="flex justify-end gap-2 ml-2">
                 {/* ATENÇÃO: Se usar o ModifiersPanel no modo "Controlado pelo Pai", 
                     deve usar as props onEditGroup passadas para o componente,
                     em vez de setEditingGroup local.
                     
                     No código atual, você está usando o estado local.
                 */}
                 <button onClick={() => { setEditingGroup(g); setShowGroupForm(true); }} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded">
                   <Pencil size={16} />
                 </button>
                 <button onClick={() => handleDeleteGroup(g.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded">
                   <Trash2 size={16} />
                 </button>
               </div>
             </div>
             
             {/* Lista de Itens */}
             <div className="mt-2">
               <h4 className="font-medium text-slate-700 dark:text-slate-200 mb-2 text-sm flex items-center gap-1">🍴 Itens</h4>
               <ul className="space-y-2">
                 {g.items && g.items.length > 0 ? g.items.map((item: any) => (
                   <li key={item.id} className="flex items-center bg-slate-100 dark:bg-slate-800 rounded px-3 py-2">
                     <div className="flex-1 min-w-0 flex items-center gap-2">
                       <span className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</span>
                       {item.priceExtra > 0 && <span className="text-xs text-emerald-600">(+R$ {Number(item.priceExtra).toFixed(2)})</span>}
                     </div>
                     <div className="flex justify-end gap-2 ml-2">
                        <button onClick={() => { setShowItemFormGroupId(g.id); setEditingItem({ ...item, groupId: g.id }); }} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDeleteItem(g.id, item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded">
                          <Trash2 size={16} />
                        </button>
                     </div>
                   </li>
                 )) : <li className="text-xs text-slate-500 italic">Nenhum item cadastrado.</li>}
               </ul>
               <button className="mt-3 text-green-700 hover:bg-green-100 text-xs font-semibold px-2 py-1 rounded" onClick={() => { setShowItemFormGroupId(g.id); setEditingItem(null); }}>+ Adicionar Item</button>
             </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold shadow" onClick={() => { setShowGroupForm(true); setEditingGroup(null); }}>
          + Adicionar Grupo de Modificador
        </button>
      </div>

      {/* Modais Internos (Caso o componente funcione sozinho) */}
      <Modal open={showGroupForm} onClose={() => { setShowGroupForm(false); setEditingGroup(null); }} title={editingGroup ? "Editar Grupo" : "Novo Grupo"}>
        <ModifierGroupForm
          onSubmit={editingGroup ? handleEditGroup : handleAddGroup}
          onCancel={() => { setShowGroupForm(false); setEditingGroup(null); }}
          initialData={editingGroup || undefined}
        />
      </Modal>
      
      <Modal open={!!showItemFormGroupId} onClose={() => { setShowItemFormGroupId(null); setEditingItem(null); }} title={editingItem ? "Editar Item" : "Novo Item"}>
        {showItemFormGroupId && (
          <ModifierItemForm
             onSubmit={editingItem ? (data => handleEditItem(showItemFormGroupId, editingItem.id, data)) : (data => handleAddItem(showItemFormGroupId, data))}
             onCancel={() => { setShowItemFormGroupId(null); setEditingItem(null); }}
             initialData={editingItem ? {
              name: editingItem.name,
              order: editingItem.order,
              // Converte Decimal ou null para number
              priceExtra: editingItem.priceExtra 
                ? Number(editingItem.priceExtra) 
                : 0
            } : undefined}
          />
        )}
      </Modal>
    </div>
  );
};

// 2. A CORREÇÃO PRINCIPAL: Anexar os sub-componentes ao componente principal na exportação
export default Object.assign(ModifiersPanel, {
  GroupForm: ModifierGroupForm,
  ItemForm: ModifierItemForm
});