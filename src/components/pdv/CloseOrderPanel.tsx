import { useState, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@mui/material";
import { Toast } from "@/components/ui/Toast";

export default function CloseOrderPanel({ orderId, onClosed }: { orderId: string, onClosed?: () => void }) {
  const { data: order, error, isLoading, mutate } = useSWR(orderId ? `/api/orders/${orderId}` : null, fetcher);
  const [closing, setClosing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMsg(null), 4000);
  }

  const handleCloseOrder = async () => {
    setClosing(true);
    setResult(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/close`, { method: "POST" });
      const data = await res.json();
      setResult(data.message || "Pedido fechado com sucesso.");
      mutate();
      if (onClosed) onClosed();
    } catch (err: any) {
      showToast(err?.message || "Erro ao fechar pedido.");
    } finally {
      setClosing(false);
    }
  };

  if (isLoading) return <div>Carregando pedido...</div>;
  if (error) return <div>Erro ao carregar pedido.</div>;
  if (!order) return <div>Pedido não encontrado.</div>;

  return (
    <div style={{ padding: 24, border: "1px solid #ccc", borderRadius: 8, background: "#fff", maxWidth: 500 }}>
      {toastMsg && (
        <Toast message={toastMsg} type="error" onClose={() => setToastMsg(null)} />
      )}
      <h2>Fechar Pedido #{order.id}</h2>
      <div>
        <strong>Status:</strong> {order.status}
      </div>
      <div>
        <strong>Itens:</strong>
        <ul>
          {order.items.map((item: any) => (
            <li key={item.id}>
              {item.product.name} x{item.quantity}
              {item.modifiers && item.modifiers.length > 0 && (
                <ul>
                  {item.modifiers.map((mod: any, idx: number) => (
                    <li key={idx}>
                      <em>{mod.group}:</em> {mod.choice}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
      <Button variant="contained" color="primary" onClick={handleCloseOrder} disabled={closing || order.status !== "OPEN"}>
        {closing ? "Processando..." : "Fechar Pedido e Baixar Estoque"}
      </Button>
      {result && <div style={{ marginTop: 16 }}>{result}</div>}
    </div>
  );
}
