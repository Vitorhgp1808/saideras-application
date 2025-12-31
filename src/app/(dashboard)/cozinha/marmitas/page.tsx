"use client";

import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { PaymentModal } from '@/components/pdv/PaymentModal';
import { Order } from '@/types/pdv';

export default function MarmitasCozinhaPage() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingOrderTotal, setPendingOrderTotal] = useState<number>(0);
  const [pendingOrderCallback, setPendingOrderCallback] = useState<null | ((method: "CASH" | "DEBIT" | "CREDIT" | "PIX") => void)>(null);
  
  const [marmitasPedidos, setMarmitasPedidos] = useState<any[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [showPedidoForm, setShowPedidoForm] = useState(false);
  const [marmitasDisponiveis, setMarmitasDisponiveis] = useState<any[]>([]);
  const [selectedMarmitaId, setSelectedMarmitaId] = useState<string | null>(null);
  const [modifierGroups, setModifierGroups] = useState<any[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<{ [groupId: string]: string[] }>({});
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // Lista de marmitas do pedido
  const [marmitasPedido, setMarmitasPedido] = useState<any[]>([]);

  // Estado para nome do pedido
  const [pedidoNome, setPedidoNome] = useState("");
  
  // --- FIX 1: Ensure this state is used correctly below ---
  const [observacaoMarmita, setObservacaoMarmita] = useState(""); 

  async function fetchMarmitasDisponiveis() {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch('/api/marmitas', { headers });
    const data = await res.json();
    setMarmitasDisponiveis(Array.isArray(data) ? data.filter((m) => m.active !== false) : []);
  }

  async function fetchModifierGroups(productId: string) {
    if (!productId) return;
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`/api/marmitas/${productId}/modifiers`, { headers });
    const data = await res.json();
    setModifierGroups(data);
  }

  async function fetchMarmitasPedidos() {
    setLoadingPedidos(true);
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch('/api/cozinha/marmitas', { headers });
    const data = await res.json();
    setMarmitasPedidos(data);
    setLoadingPedidos(false);
  }

  useEffect(() => {
    fetchMarmitasPedidos();
    fetchMarmitasDisponiveis();
    const interval = setInterval(fetchMarmitasPedidos, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedMarmitaId) {
      fetchModifierGroups(selectedMarmitaId);
    } else {
      setModifierGroups([]);
      setSelectedModifiers({});
    }
  }, [selectedMarmitaId]);

  useEffect(() => {
    const marmita = marmitasDisponiveis.find((m) => m.id === selectedMarmitaId);
    let price = marmita ? Number(marmita.sellingPrice) : 0;
    modifierGroups.forEach((group: any) => {
      const selected = selectedModifiers[group.id] || [];
      group.items.forEach((item: any) => {
        if (selected.includes(item.id)) {
          price += Number(item.priceExtra || 0);
        }
      });
    });
    setTotalPrice(price);
  }, [selectedMarmitaId, selectedModifiers, modifierGroups, marmitasDisponiveis]);

  async function handleBaixar(id: string) {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
    await fetch(`/api/cozinha/marmitas/${id}/baixar`, { method: 'POST', headers });
    fetchMarmitasPedidos();
  }

  async function handleCriarPedido() {
    if (!pedidoNome.trim()) {
      alert("Por favor, informe o nome de quem está pedindo.");
      return;
    }
    if (marmitasPedido.length === 0) {
      alert("Adicione ao menos uma marmita ao pedido.");
      return;
    }
    const totalPedido = marmitasPedido.reduce((acc, m) => acc + (m.unitPrice * m.quantity), 0);
    setPendingOrderTotal(totalPedido);
    setShowPedidoForm(false);
    setIsPaymentModalOpen(true);
    setPendingOrderCallback(() => async (method: "CASH" | "DEBIT" | "CREDIT" | "PIX") => {
      try {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
        await fetch('/api/cozinha/marmitas/pedido', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            marmitas: marmitasPedido,
            paymentMethod: method,
            nome: pedidoNome,
          }),
        });
        setIsPaymentModalOpen(false);
        setSelectedMarmitaId(null);
        setModifierGroups([]);
        setSelectedModifiers({});
        setPedidoNome("");
        setObservacaoMarmita("");
        setMarmitasPedido([]);
        fetchMarmitasPedidos();
        alert('Pedido de marmita criado!');
      } catch (error) {
        console.error(error);
        alert('Erro ao criar pedido.');
      }
    });
  }

  return (
    <div className="p-6">
      {/* Modal de Escolha da Marmita */}
      {showPedidoForm && (
        <Modal 
          open={showPedidoForm} 
          onClose={() => { setShowPedidoForm(false); setSelectedMarmitaId(null); setModifierGroups([]); setSelectedModifiers({}); setPedidoNome(""); setObservacaoMarmita(""); setMarmitasPedido([]); }}
          title="Escolha o tipo de marmita"
        >
          <div className="flex flex-col gap-4">
            {/* Lista de marmitas adicionadas ao pedido */}
            {marmitasPedido.length > 0 && (
              <div className="mb-2">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Marmitas do pedido:</h3>
                <ul className="mb-2">
                  {marmitasPedido.map((m, idx) => (
                    <li key={idx} className="flex flex-col gap-1 py-1 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{m.name} ({m.quantity}x) - R$ {m.unitPrice.toFixed(2)}</span>
                        <button className="text-red-600 text-xs px-2 py-1" onClick={() => setMarmitasPedido(p => p.filter((_, i) => i !== idx))}>Remover</button>
                      </div>
                      {m.observacaoPedido && (
                        <span className="text-xs text-amber-700 dark:text-amber-400 ml-2">Obs: {m.observacaoPedido}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Campo nome de quem pediu */}
            <input
              type="text"
              className="p-2 rounded border border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-600 w-full"
              placeholder="Nome de quem está pedindo"
              value={pedidoNome}
              onChange={e => setPedidoNome(e.target.value)}
              maxLength={40}
              required
            />
            
            {/* --- FIX 2: Updated Variable Names --- */}
            <textarea
              className="p-2 rounded border border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-600 w-full resize-none"
              placeholder="Observação da marmita (opcional)"
              value={observacaoMarmita} 
              onChange={e => setObservacaoMarmita(e.target.value)}
              maxLength={120}
              rows={2}
            />

            {marmitasDisponiveis.length > 0 ? (
              <select
                className="p-2 rounded border border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-600 w-full"
                value={selectedMarmitaId || ''}
                onChange={e => setSelectedMarmitaId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {marmitasDisponiveis.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} - R$ {Number(m.sellingPrice).toFixed(2)}</option>
                ))}
              </select>
            ) : (
              <div className="text-center text-gray-400 py-4">Nenhuma marmita disponível para pedido.</div>
            )}
            {modifierGroups.length > 0 && (
              <div className="mt-2">
                <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">Monte sua marmita:</h3>
                {modifierGroups.map((group: any) => (
                  <div key={group.id} className="mb-4">
                    <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">{group.name} <span className="text-xs text-slate-500">(Escolha {group.minSelections} a {group.maxSelections})</span></div>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item: any) => {
                        const selected = selectedModifiers[group.id] || [];
                        const checked = selected.includes(item.id);
                        return (
                          <label key={item.id} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-600">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={selected.length >= group.maxSelections && !checked}
                              onChange={e => {
                                setSelectedModifiers(prev => {
                                  const current = prev[group.id] || [];
                                  if (e.target.checked) {
                                    if (current.length < group.maxSelections) {
                                      return { ...prev, [group.id]: [...current, item.id] };
                                    }
                                  } else {
                                    return { ...prev, [group.id]: current.filter((id: string) => id !== item.id) };
                                  }
                                  return prev;
                                });
                              }}
                            />
                            <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                            {item.priceExtra && Number(item.priceExtra) > 0 && (
                              <span className="text-xs text-emerald-700 dark:text-emerald-400 ml-1">+R$ {Number(item.priceExtra).toFixed(2)}</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="font-bold text-lg mt-2 text-slate-900 dark:text-slate-100 border-t pt-4">Total: R$ {totalPrice.toFixed(2)}</div>
            <div className="flex gap-2 justify-end mt-2">
              <button
                className="text-slate-500 hover:text-slate-700 px-4 py-2"
                onClick={() => { setShowPedidoForm(false); setSelectedMarmitaId(null); setModifierGroups([]); setSelectedModifiers({}); setPedidoNome(""); setObservacaoMarmita(""); setMarmitasPedido([]); }}
              >
                Cancelar
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  if (!selectedMarmitaId) return;
                  const marmita = marmitasDisponiveis.find((m) => m.id === selectedMarmitaId);
                  if (!marmita) return;
                  
                  for (const group of modifierGroups) {
                    const selected = selectedModifiers[group.id] || [];
                    if (selected.length < group.minSelections || selected.length > group.maxSelections) {
                      alert(`Selecione entre ${group.minSelections} e ${group.maxSelections} opções para o grupo "${group.name}".`);
                      return;
                    }
                  }
                  
                  setMarmitasPedido(prev => [...prev, {
                    marmitaId: marmita.id,
                    name: marmita.name,
                    quantity: 1,
                    unitPrice: totalPrice,
                    // --- FIX 3: Add observation to the item object ---
                    observacaoPedido: observacaoMarmita, 
                    modifiers: Object.entries(selectedModifiers).map(([groupId, itemIds]) => ({ groupId, itemIds })),
                  }]);
                  
                  // Reset fields for the next marmita
                  setSelectedMarmitaId(null);
                  setModifierGroups([]);
                  setSelectedModifiers({});
                  // --- FIX 4: Clear the observation input ---
                  setObservacaoMarmita(""); 
                }}
                disabled={!selectedMarmitaId}
              >
                Adicionar Marmita
              </button>
              <button
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCriarPedido}
                disabled={!pedidoNome.trim() || marmitasPedido.length === 0}
              >
                Finalizar Pedido
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Modal para marmita */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        comanda={{
          id: "marmita-avulsa",
          tableId: 0, 
          status: "OPEN",
          openTime: new Date().toISOString(),
          closeTime: "",
          subtotal: pendingOrderTotal,
          discount: 0,
          tip: 0,
          total: pendingOrderTotal,
          paymentMethod: "",
          items: [],
        } as unknown as Order} 
        onConfirmPayment={async (method) => {
          if (pendingOrderCallback) await pendingOrderCallback(method);
        }}
      />

      {/* ... Rest of your UI code (List of pending orders) ... */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span role="img" aria-label="marmita">🍱</span> Marmitas Pedidas
                </h1>
                <p className="text-gray-600 dark:text-slate-400">Acompanhe aqui as marmitas pedidas e monte conforme as escolhas.</p>
            </div>
            <button 
                onClick={() => setShowPedidoForm(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold shadow flex items-center gap-2"
            >
                + Novo Pedido
            </button>
        </div>

        {loadingPedidos ? (
          <div className="flex items-center gap-2 text-blue-600 animate-pulse"><span className="h-4 w-4 rounded-full bg-blue-300 animate-bounce"></span> Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marmitasPedidos.length === 0 ? (
              <div className="col-span-full text-center text-slate-400 py-12">Nenhuma marmita pendente.</div>
            ) : (
              marmitasPedidos.map((m) => (
                <div key={m.id} className="bg-white dark:bg-slate-800 border-2 border-emerald-600 dark:border-emerald-400 rounded-xl p-5 shadow-lg flex flex-col gap-3 transition-all hover:scale-[1.01] hover:shadow-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-base px-3 py-1 rounded font-bold shadow ${m.status === 'PENDENTE' ? 'bg-amber-200 text-amber-900' : m.status === 'PRONTO' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-300 text-slate-900'}`}>{m.status}</span>
                    {m.nomePedido && (
                      <span className="text-lg font-bold text-black dark:text-white">{m.nomePedido}</span>
                    )}
                  </div>
                  <div className="flex flex-row items-center justify-between gap-2">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 text-lg">{m.nome}</span>
                    <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded font-semibold">{m.tamanho}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {m.modificadores.length > 0 && (
                      <div>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-xs">Itens:</span>
                        <ul className="flex flex-wrap gap-1 mt-1">
                          {m.modificadores.map((g: any, i: number) => (
                            <li key={i} className="flex items-center gap-1">
                              <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">{g.grupo}:</span>
                              {g.itens.map((item: string, idx: number) => (
                                <span key={idx} className="bg-emerald-50 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded text-xs font-medium border border-emerald-200 dark:border-emerald-700">{item}</span>
                              ))}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {m.observacaoPedido && (
                    <div className="text-amber-700 dark:text-amber-400 text-xs font-semibold border-t border-dashed border-amber-300 pt-2">Obs: {m.observacaoPedido}</div>
                  )}
                  <div className="flex flex-row items-center justify-between mt-2">
                    <span />
                    {m.preco && (
                      <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">R$ {Number(m.preco).toFixed(2)}</span>
                    )}
                    <button
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl shadow text-sm transition-all duration-150"
                      onClick={() => handleBaixar(m.id)}
                    >
                      Dar Baixa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}