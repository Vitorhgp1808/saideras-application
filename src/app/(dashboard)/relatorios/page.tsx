// app/(dashboard)/relatorios/page.tsx
"use client";

import { useState } from "react";

type FaturamentoData = {
  periodo: { inicio: string; fim: string };
  totalVendasBruto: number;
  totalCortesias: number;
  totalGorjetas: number;
  totalLiquido: number;
};

type PerformanceData = {
  topProdutos: Array<{
    id: string;
    name: string;
    totalVendido: number; 
  }>;
};

type FluxoCaixaData = {
  totalEntradas: number; 
  totalSaidas: number; 
  saldo: number;
};

type ReportData = {
  faturamento?: FaturamentoData;
  performance?: PerformanceData;
  fluxoCaixa?: FluxoCaixaData;
};

type ReportType = 'faturamento' | 'performance' | 'fluxoCaixa';


export default function RelatoriosPage() {
  const today = new Date().toISOString().split('T')[0];

  const [activeReport, setActiveReport] = useState<ReportType>('faturamento');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Não autorizado. Faça login novamente.");
      return null;
    }
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);
    setReportData(null);

    const params = new URLSearchParams({ from: startDate, to: endDate });
    const apiUrl = `/api/reports/${activeReport}?${params.toString()}`;

    try {
      const headers = getAuthHeaders();
      if (!headers) {
         setIsLoading(false);
         return;
      }
      
      const res = await fetch(apiUrl, { headers });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Falha ao gerar relatório.");
      }

      const data = await res.json();
      setReportData({ [activeReport]: data });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };


  const renderReportContent = () => {
    if (isLoading) return <InlineLoadingSpinner />;
    if (error) return <InlineErrorDisplay message={error} />;
    if (!reportData) {
      return (
        <p className="text-gray-500 text-center py-10">
          Selecione um período e clique em "Gerar Relatório".
        </p>
      );
    }

    switch (activeReport) {
      case 'faturamento':
        return <FaturamentoReport data={reportData.faturamento} formatCurrency={formatCurrency} />;
      case 'performance':
        return <PerformanceReport data={reportData.performance} formatCurrency={formatCurrency} />;
      case 'fluxoCaixa':
        return <FluxoCaixaReport data={reportData.fluxoCaixa} formatCurrency={formatCurrency} />;
      default:
        return null;
    }
  };
  
  const getTabClass = (report: ReportType) => {
    const baseClass = "px-4 py-2.5 text-sm font-semibold rounded-md cursor-pointer transition-colors flex-1 text-center";
    if (activeReport === report) {
      return `${baseClass} bg-blue-600 text-white shadow-md`;
    }
    return `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200`;
  };

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Relatórios e Análises</h1>

      <div className="p-4 md:p-6 bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-4">
          <button
            className={getTabClass('faturamento')}
            onClick={() => setActiveReport('faturamento')}
          >
            Faturamento
          </button>
          <button
            className={getTabClass('performance')}
            onClick={() => setActiveReport('performance')}
          >
            Performance
          </button>
          <button
            className={getTabClass('fluxoCaixa')}
            onClick={() => setActiveReport('fluxoCaixa')}
          >
            Fluxo de Caixa
          </button>
        </div>

        {/* Seletores de Data */}
        <div className="flex flex-col sm:flex-row gap-4 mb-5">
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">De:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Até:</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button 
          onClick={handleGenerateReport} 
          className="w-full p-3 bg-green-600 text-white font-semibold rounded-lg shadow-md 
                     hover:bg-green-700 disabled:bg-green-300 transition-colors
                     flex items-center justify-center" 
          disabled={isLoading}
        >
          {isLoading ? <SpinnerIcon /> : null}
          {isLoading ? "Gerando..." : "Gerar Relatório"}
        </button>
      </div>

 
      <div className="p-4 md:p-6 bg-white rounded-lg shadow-md border border-gray-200 min-h-[200px]">
        {renderReportContent()}
      </div>
    </div>
  );
}


type ReportProps = {
  formatCurrency: (value: number) => string;
};

const FaturamentoReport = ({ data, formatCurrency }: { data?: FaturamentoData } & ReportProps) => {
  if (!data) return <p className="text-gray-500">Nenhum dado de faturamento encontrado.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Vendas (Bruto)" value={formatCurrency(data.totalVendasBruto)} />
      <StatCard title="Cortesias" value={formatCurrency(data.totalCortesias)} />
      <StatCard title="Gorjetas" value={formatCurrency(data.totalGorjetas)} />
      <StatCard 
        title="Total Líquido (Vendas - Cortesias)" 
        value={formatCurrency(data.totalLiquido)} 
        className="bg-blue-600 text-white"
        titleClassName="text-blue-100"
      />
    </div>
  );
};

const PerformanceReport = ({ data, formatCurrency }: { data?: PerformanceData } & ReportProps) => {
  if (!data || !data.topProdutos || data.topProdutos.length === 0) {
    return <p className="text-gray-500">Nenhum dado de performance encontrado.</p>;
  }
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">Ranking de Produtos</h3>
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {data.topProdutos.map((produto, index) => (
          <div key={produto.id} className="flex justify-between items-center p-3 hover:bg-gray-50">
            <span className="text-sm font-medium text-gray-900">
              <strong className="mr-2">{index + 1}.</strong> {produto.name}
            </span>
            <span className="text-sm font-semibold text-gray-700">
              {formatCurrency(produto.totalVendido)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const FluxoCaixaReport = ({ data, formatCurrency }: { data?: FluxoCaixaData } & ReportProps) => {
  if (!data) return <p className="text-gray-500">Nenhum dado de fluxo de caixa encontrado.</p>;
  
  const saldoClass = data.saldo >= 0 
    ? "bg-gray-800 text-white" 
    : "bg-red-800 text-white";
  
  const saldoTitleClass = data.saldo >= 0 ? "text-gray-300" : "text-red-200";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard 
        title="Total Entradas (Vendas)" 
        value={formatCurrency(data.totalEntradas)}
        className="bg-green-50 border-green-200"
        titleClassName="text-green-700"
        valueClassName="text-green-900"
      />
      <StatCard 
        title="Total Saídas (Compras)" 
        value={formatCurrency(data.totalSaidas)}
        className="bg-red-50 border-red-200"
        titleClassName="text-red-700"
        valueClassName="text-red-900"
      />
      <StatCard 
        title="Saldo do Período" 
        value={formatCurrency(data.saldo)}
        className={saldoClass}
        titleClassName={saldoTitleClass}
      />
    </div>
  );
};


const StatCard = ({ title, value, className = "", titleClassName = "", valueClassName = "" }: 
  { title: string; value: string; className?: string; titleClassName?: string; valueClassName?: string }) => (
  <div className={`flex flex-col p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm ${className}`}>
    <span className={`text-sm font-medium text-gray-600 mb-1 ${titleClassName}`}>
      {title}
    </span>
    <span className={`text-2xl font-bold text-gray-900 ${valueClassName}`}>
      {value}
    </span>
  </div>
);

function SpinnerIcon() {
  return (
    <svg 
      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

function InlineLoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full animate-pulse bg-blue-600"></div>
        <div className="w-3 h-3 rounded-full animate-pulse bg-blue-600 [animation-delay:0.2s]"></div>
        <div className="w-3 h-3 rounded-full animate-pulse bg-blue-600 [animation-delay:0.4s]"></div>
        <span className="ml-2 text-sm font-medium text-gray-700">Gerando relatório...</span>
      </div>
    </div>
  );
}

function InlineErrorDisplay({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg" role="alert">
      <strong className="font-bold">Erro: </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  );
}