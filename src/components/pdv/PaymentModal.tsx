import React, { useState, useRef } from "react";
import { X, CreditCard, Banknote, Smartphone } from "lucide-react";
import { Order } from "../../types/pdv";
import { Button } from "../../components/ui/Button";
import { Toast } from "@/components/ui/Toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (
    method: "CASH" | "DEBIT" | "CREDIT" | "PIX"
  ) => Promise<void>;
  comanda: Order;
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function PaymentModal({
  isOpen,
  onClose,
  onConfirmPayment,
  comanda,
  isLoading,
}: PaymentModalProps) {

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  
  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMsg(null), 4000);
  }

  // Estado para pagamento em dinheiro
  const [showCashInput, setShowCashInput] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>("");
  const [change, setChange] = useState<number | null>(null);

  // ---------------------------------------------------------
  // CORREÇÃO: O useEffect foi movido para ANTES do early return
  // ---------------------------------------------------------
  
  // Atualiza troco ao digitar
  React.useEffect(() => {
    if (!showCashInput) {
      setChange(null);
      setCashReceived("");
      return;
    }
    const received = parseFloat(cashReceived.replace(/,/g, "."));
    if (!isNaN(received)) {
      setChange(received - comanda.total);
    } else {
      setChange(null);
    }
  }, [cashReceived, showCashInput, comanda.total]);

  // ---------------------------------------------------------
  // AGORA sim podemos fazer o retorno condicional
  // ---------------------------------------------------------
  if (!isOpen) return null;

  // Wrappers para capturar erros dos handlers
  const handleConfirmPayment = async (method: "CASH" | "DEBIT" | "CREDIT" | "PIX") => {
    if (method === "CASH") {
      setShowCashInput(true);
      return;
    }
    try {
      await onConfirmPayment(method);
    } catch (err: any) {
      showToast(err?.message || "Erro ao processar pagamento.");
    }
  };

  // Confirmação final do pagamento em dinheiro
  const handleCashPayment = async () => {
    const received = parseFloat(cashReceived.replace(/,/g, "."));
    if (isNaN(received) || received < comanda.total) {
      showToast("Valor recebido insuficiente para pagamento.");
      return;
    }
    try {
      await onConfirmPayment("CASH");
      setShowCashInput(false);
      setCashReceived("");
      setChange(null);
    } catch (err: any) {
      showToast(err?.message || "Erro ao processar pagamento.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-2 sm:p-6">
      {toastMsg && (
        <Toast message={toastMsg} type="error" onClose={() => setToastMsg(null)} />
      )}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-[95vw] sm:max-w-md p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[95vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Pagamento
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            Valor Total
          </p>
          <p className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">
            {formatCurrency(comanda.total)}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Mesa:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {comanda.tableId}
            </span>
          </p>
        </div>

        {/* Pagamento em Dinheiro: Input para valor recebido e cálculo de troco */}
        {showCashInput ? (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Valor Recebido</label>
              <input
                type="number"
                min={comanda.total}
                step="0.01"
                inputMode="decimal"
                className="w-full border rounded-lg px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder="Digite o valor recebido"
                value={cashReceived}
                onChange={e => setCashReceived(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base text-slate-700 dark:text-slate-200 font-semibold">Troco:</span>
              <span className={`text-2xl font-bold ${change !== null && change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {change !== null ? formatCurrency(Math.max(0, change)) : "-"}
              </span>
            </div>
            <Button
              onClick={handleCashPayment}
              className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={isLoading || !cashReceived || change === null || change < 0}
            >
              Confirmar Pagamento
            </Button>
            <Button
              onClick={() => { setShowCashInput(false); setCashReceived(""); setChange(null); }}
              variant="ghost"
              className="w-full"
              disabled={isLoading}
            >
              Voltar
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <Button
                onClick={() => handleConfirmPayment("CASH")}
                variant="outline"
                className="w-full justify-between h-14 text-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                disabled={isLoading}
              >
                <span className="flex items-center gap-3">
                  <Banknote /> Dinheiro
                </span>
              </Button>

              <Button
                onClick={() => handleConfirmPayment("DEBIT")}
                variant="outline"
                className="w-full justify-between h-14 text-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                disabled={isLoading}
              >
                <span className="flex items-center gap-3">
                  <CreditCard /> Cartão de Débito
                </span>
              </Button>

              <Button
                onClick={() => handleConfirmPayment("CREDIT")}
                variant="outline"
                className="w-full justify-between h-14 text-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400"
                disabled={isLoading}
              >
                <span className="flex items-center gap-3">
                  <CreditCard /> Cartão de Crédito
                </span>
              </Button>

              <Button
                onClick={() => handleConfirmPayment("PIX")}
                variant="outline"
                className="w-full justify-between h-14 text-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400"
                disabled={isLoading}
              >
                <span className="flex items-center gap-3">
                  <Smartphone /> PIX
                </span>
              </Button>
            </div>

            <div className="mt-6">
              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full"
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}