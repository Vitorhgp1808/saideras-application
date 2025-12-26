import React from "react";
import { X, CreditCard, Banknote, Smartphone } from "lucide-react";
import { Order } from "../../types/pdv";
import { Button } from "../../components/ui/Button";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
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

        <div className="space-y-3">
          <Button
            onClick={() => onConfirmPayment("CASH")}
            variant="outline"
            className="w-full justify-between h-14 text-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
            disabled={isLoading}
          >
            <span className="flex items-center gap-3">
              <Banknote /> Dinheiro
            </span>
          </Button>

          <Button
            onClick={() => onConfirmPayment("DEBIT")}
            variant="outline"
            className="w-full justify-between h-14 text-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
            disabled={isLoading}
          >
            <span className="flex items-center gap-3">
              <CreditCard /> Cartão de Débito
            </span>
          </Button>

          <Button
            onClick={() => onConfirmPayment("CREDIT")}
            variant="outline"
            className="w-full justify-between h-14 text-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400"
            disabled={isLoading}
          >
            <span className="flex items-center gap-3">
              <CreditCard /> Cartão de Crédito
            </span>
          </Button>

          <Button
            onClick={() => onConfirmPayment("PIX")}
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
      </div>
    </div>
  );
}
