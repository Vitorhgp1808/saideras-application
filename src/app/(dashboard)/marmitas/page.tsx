import React from "react";
import { Metadata } from "next";
import MarmitasManager from "../../../components/marmitas/MarmitasManager";

export const metadata: Metadata = {
  title: "Gestão de Marmitas",
  description: "Gerencie produtos compostos (marmitas), ingredientes e receitas.",
};

export default function MarmitasPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span role="img" aria-label="marmita">🍱</span> Gestão de Marmitas
        </h1>
        <p className="mb-6 text-gray-600 dark:text-slate-400">Aqui você pode criar, editar e visualizar marmitas (produtos compostos), seus ingredientes e receitas.</p>
        <MarmitasManager />
      </div>
    </div>
  );
}
