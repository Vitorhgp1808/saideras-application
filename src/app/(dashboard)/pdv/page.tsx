"use client";

import { useState, useEffect, useMemo } from "react";
import type { Order, Product } from "../../../types/pdv";
import { TableGrid, ComandaSlot } from "../../../components/pdv/TableGrid";
import { OrderPanel } from "../../../components/pdv/OrderPanel";
import { PaymentModal } from "../../../components/pdv/PaymentModal";
import useSWR, { mutate } from 'swr';
import { fetcher } from '../../../lib/fetcher';

const COMANDA_COUNT = 30; // Número fixo de comandas

export default function PdvPage() {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const {
    data: ordersData,
    error: ordersError,
    isLoading: isOrdersLoading,
  } = useSWR<Order[]>(`/api/orders?date=${today}`, fetcher);
  const { data: productsData, error: productsError, isLoading: isProductsLoading } = useSWR<Product[]>('/api/products', fetcher);

  const orders = useMemo(() => ordersData || [], [ordersData]);
  const products = useMemo(() => productsData || [], [productsData]);
  const isLoading = isOrdersLoading || isProductsLoading;
  const error = ordersError || productsError;

  const [selectedComanda, setSelectedComanda] = useState<Order | null>(null);
  const [selectedTableNumber, setSelectedTableNumber] = useState<number | null>(
    null
  );
  
  // Estado para controle visual das comandas (slots)
  const [extraSlots, setExtraSlots] = useState(0);
  const [filter, setFilter] = useState<"TODAS" | "ABERTAS" | "LIVRES">("TODAS");

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Gera os slots combinando o array fixo com as ordens da API
  const slots: ComandaSlot[] = useMemo(() => {
    // Encontra o maior número de comanda existente na API
    const maxOrderNumber = orders.reduce((max, order) => {
      const num = order.tableId;
      return !isNaN(num) && num > max ? num : max;
    }, 0);

    // O total base é o maior entre 30 e o maior número existente
    const baseCount = Math.max(COMANDA_COUNT, maxOrderNumber);

    const totalSlots = baseCount + extraSlots;

    return Array.from(
      { length: totalSlots },
      (_, i) => {
        const number = i + 1;
        const ordersForSlot = orders.filter((o) => o.tableId === number);

        const activeOrder = ordersForSlot.find((o) => o.status === "OPEN");
        const lastClosedOrder = ordersForSlot
          .filter((o) => o.status !== "OPEN")
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];

        if (activeOrder) {
          return { number, status: "OCUPADA", order: activeOrder };
        } else if (lastClosedOrder) {
          return { number, status: "FECHADA", order: lastClosedOrder };
        } else {
          return { number, status: "LIVRE" };
        }
      }
    );
  }, [orders, extraSlots]);

  // Update selectedComanda if its data has changed in ordersData
  useEffect(() => {
    if (selectedComanda && orders) {
      const updatedComanda = orders.find(
        (c) => c.id === selectedComanda.id
      );
      if (updatedComanda) {
        setSelectedComanda(updatedComanda);
      }
    }
  }, [orders, selectedComanda]);

  const handleAddSlot = () => {
    setExtraSlots((prev) => prev + 1);
  };

  const handleOpenTable = async () => {
    if (!selectedTableNumber) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Não autorizado.");

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ table: selectedTableNumber }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Falha ao criar comanda");
      }

      const newOrder = await res.json();
      mutate(`/api/orders?date=${today}`);

      // Auto-select the newly created order
      setSelectedTableNumber(null); // Reset table selection
      setSelectedComanda(newOrder);
    } catch (err) {
      if (err instanceof Error) console.error(err.message);
      else console.error("Erro desconhecido");
    }
  };

  const handleSelectSlot = (slot: ComandaSlot) => {
    if (slot.order) {
      setSelectedComanda(slot.order);
      setSelectedTableNumber(null);
    } else {
      setSelectedTableNumber(slot.number);
      setSelectedComanda(null);
    }
  };

  const handleAddItem = async (productId: string, quantity: number) => {
    if (!selectedComanda) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Não autorizado.");

      const res = await fetch(
        `/api/orders/${encodeURIComponent(selectedComanda.id)}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId, quantity }),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Falha ao adicionar item");
      }

      mutate(`/api/orders?date=${today}`);
    } catch (err) {
      if (err instanceof Error) console.error(err.message);
      else console.error("Erro desconhecido");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!selectedComanda) return;
    if (!confirm("Tem certeza que deseja remover este item?")) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Não autorizado.");

      const res = await fetch(
        `/api/orders/${selectedComanda.id}/items/${itemId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Falha ao remover item");

      mutate(`/api/orders?date=${today}`);
    } catch (err) {
      if (err instanceof Error) console.error(err.message);
    }
  };

  const handleToggleCourtesy = async (
    itemId: string,
    currentStatus: boolean
  ) => {
    if (!selectedComanda) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Não autorizado.");

      const res = await fetch(
        `/api/orders/${selectedComanda.id}/items/${itemId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isCourtesy: !currentStatus }),
        }
      );

      if (!res.ok) throw new Error("Falha ao atualizar cortesia");

      mutate(`/api/orders?date=${today}`);
    } catch (err) {
      if (err instanceof Error) console.error(err.message);
    }
  };

  const handleCloseAccount = () => {
    if (!selectedComanda) return;
    setIsPaymentModalOpen(true);
  };

  const handleCancelOrder = async () => {
    if (!selectedComanda) return;
    if (
      !confirm(
        `Tem certeza que deseja CANCELAR a comanda ${selectedComanda.tableId}? Essa ação não pode ser desfeita.`
      )
    )
      return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Não autorizado.");

      const res = await fetch(`/api/orders/${selectedComanda.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Falha ao cancelar comanda");
      }

      mutate(`/api/orders?date=${today}`);
      setSelectedComanda(null);
    } catch (err) {
      if (err instanceof Error) console.error(err.message);
      else console.error("Erro desconhecido");
    }
  };

  const handleConfirmPayment = async (
    method: "CASH" | "DEBIT" | "CREDIT" | "PIX"
  ) => {
    if (!selectedComanda) return;
    setIsProcessingPayment(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Não autorizado.");

      const res = await fetch(`/api/orders/${selectedComanda.id}/close`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethod: method }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Falha ao fechar comanda");
      }

      mutate(`/api/orders?date=${today}`);
      setIsPaymentModalOpen(false);
      setSelectedComanda(null);
    } catch (err) {
      if (err instanceof Error) console.error(err.message);
      else console.error("Erro desconhecido");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md"
          role="alert"
        >
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error instanceof Error ? error.message : 'Erro desconhecido'}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
        <div className="flex-1 overflow-hidden flex flex-col">
          <TableGrid
            slots={slots}
            selectedComandaId={selectedComanda?.id || null}
            onSelectSlot={handleSelectSlot}
            onAddSlot={handleAddSlot}
            filter={filter}
            setFilter={setFilter}
          />
        </div>

        <div className="w-96 h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-20 flex flex-col">
          <OrderPanel
            comanda={selectedComanda}
            selectedTableNumber={selectedTableNumber}
            products={products}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onToggleCourtesy={handleToggleCourtesy}
            onCloseAccount={handleCloseAccount}
            onCancelOrder={handleCancelOrder}
            onOpenTable={handleOpenTable}
          />
        </div>
      </div>

      {selectedComanda && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onConfirmPayment={handleConfirmPayment}
          comanda={selectedComanda}
          isLoading={isProcessingPayment}
        />
      )}
    </>
  );
}
