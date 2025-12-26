"use client";

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from "../../../components/ui/Card";

interface DashboardStats {
  todaySales: number;
  activeTables: number;
  lowStockCount: number;
  totalProducts: number;
  chartData: { name: string; vendas: number }[];
  lowStockItems: { id: string; name: string; stock: number; unit: string }[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Não autorizado");

        const res = await fetch('/api/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error("Falha ao carregar dados do dashboard");

        const data = await res.json();
        setStats(data);
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Erro desconhecido");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-red-500">
        Erro ao carregar dashboard: {error}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Visão Geral</h1>
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Vendas Hoje</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {formatCurrency(stats.todaySales)}
              </h3>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Mesas Ativas</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {stats.activeTables}
              </h3>
            </div>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Estoque Baixo</p>
              <h3 className="text-2xl font-bold text-amber-500 mt-1">
                {stats.lowStockCount} <span className="text-sm font-normal text-slate-400">itens</span>
              </h3>
            </div>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <AlertTriangle size={20} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Produtos</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {stats.totalProducts}
              </h3>
            </div>
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
              <Package size={20} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2">
          <Card className="h-full min-h-[400px]">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Faturamento Semanal</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `R$${value}`} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderColor: '#334155', 
                      color: '#f1f5f9',
                      borderRadius: '8px'
                    }}
                    itemStyle={{ color: '#f59e0b' }}
                    formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                  />
                  <Bar dataKey="vendas" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Low Stock List */}
        <div>
          <Card className="h-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Alertas de Estoque</h3>
            <div className="space-y-4">
              {stats.lowStockItems.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Nenhum item com estoque baixo.</p>
              ) : (
                stats.lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{item.name}</p>
                      <p className="text-xs text-slate-500">Restante: {item.stock} {item.unit}</p>
                    </div>
                    <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded">
                      BAIXO
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}