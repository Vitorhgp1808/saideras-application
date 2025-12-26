"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, DollarSign, CreditCard, Clock, Award, Filter } from 'lucide-react';

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  isCourtesy: boolean;
};

type Order = {
  id: string;
  tableId: number;
  status: string;
  openTime: string;
  closeTime: string;
  subtotal: number;
  discount: number;
  tip: number;
  total: number;
  paymentMethod: string;
  items: OrderItem[];
};

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

export default function RelatoriosPage() {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [dateStart, setDateStart] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [dateEnd, setDateEnd] = useState(today.toISOString().split('T')[0]);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Não autorizado");

      const params = new URLSearchParams({ from: dateStart, to: dateEnd });
      const res = await fetch(`/api/reports/detailed_orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Falha ao carregar dados");
      
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateStart, dateEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredOrders = useMemo(() => {
    const start = new Date(dateStart).getTime();
    const end = new Date(dateEnd).getTime() + (24 * 60 * 60 * 1000) - 1;
    
    return orders.filter(o => {
      const orderDate = new Date(o.openTime).getTime();
      return orderDate >= start && orderDate <= end;
    }).sort((a, b) => new Date(a.openTime).getTime() - new Date(b.openTime).getTime());
  }, [orders, dateStart, dateEnd]);

  const kpis = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((acc, o) => acc + Number(o.total), 0);
    const totalTips = filteredOrders.reduce((acc, o) => acc + Number(o.tip), 0);
    const totalOrders = filteredOrders.length;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalDiscount = filteredOrders.reduce((acc, o) => acc + Number(o.discount), 0);

    return { totalRevenue, totalTips, totalOrders, averageTicket, totalDiscount };
  }, [filteredOrders]);

  const revenueData = useMemo(() => {
    const dataMap = new Map<string, number>();
    
    filteredOrders.forEach(o => {
      const dateKey = new Date(o.openTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const current = dataMap.get(dateKey) || 0;
      dataMap.set(dateKey, current + Number(o.total));
    });

    return Array.from(dataMap.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const hourlyData = useMemo(() => {
    const hours = Array(24).fill(0);
    filteredOrders.forEach(o => {
      const hour = new Date(o.openTime).getHours();
      hours[hour]++;
    });
    return hours.map((count, hour) => ({
      name: `${hour}h`,
      count
    })).filter(h => h.count > 0);
  }, [filteredOrders]);

  const paymentData = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach(o => {
      const method = o.paymentMethod || 'Outros';
      const label = method === 'card_credit' ? 'Crédito' : 
                    method === 'card_debit' ? 'Débito' : 
                    method === 'cash' ? 'Dinheiro' : 
                    method === 'pix' ? 'PIX' : 'Outros';
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const topProducts = useMemo(() => {
    const productMap = new Map<string, { quantity: number; revenue: number }>();

    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        const current = productMap.get(item.name) || { quantity: 0, revenue: 0 };
        productMap.set(item.name, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + (item.price * item.quantity)
        });
      });
    });

    return Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  const cardClass = "bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200";

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Erro ao carregar relatório: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10 p-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Inteligência de Negócio</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Análise detalhada de performance histórica</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-3 py-1.5 flex items-center gap-2 border-r border-slate-200 dark:border-slate-700">
            <Filter size={16} className="text-amber-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Período</span>
          </div>
          <input 
            type="date" 
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="bg-transparent text-sm text-slate-600 dark:text-slate-300 focus:outline-none px-2 py-1"
          />
          <span className="text-slate-400">-</span>
          <input 
            type="date" 
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="bg-transparent text-sm text-slate-600 dark:text-slate-300 focus:outline-none px-2 py-1"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardClass}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Faturamento Total</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                R$ {kpis.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Descontos aplicados: <span className="text-red-400">R$ {kpis.totalDiscount.toFixed(2)}</span>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Ticket Médio</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                R$ {kpis.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
           <div className="mt-4 text-xs text-slate-400">
            Média por cliente/mesa
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Comandas Fechadas</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {kpis.totalOrders}
              </h3>
            </div>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <Users size={20} />
            </div>
          </div>
           <div className="mt-4 text-xs text-slate-400">
            No período selecionado
          </div>
        </div>

         <div className={cardClass}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Gorjetas (10%)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                R$ {kpis.totalTips.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
              <Award size={20} />
            </div>
          </div>
           <div className="mt-4 text-xs text-slate-400">
            Repasse para equipe
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Evolution */}
        <div className={`${cardClass} lg:col-span-2`}>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-500"/>
            Evolução do Faturamento
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} tick={{fontSize: 12}} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderColor: '#334155', 
                    color: '#f1f5f9' 
                  }}
                  itemStyle={{ color: '#f59e0b' }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className={cardClass}>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <CreditCard size={18} className="text-blue-500"/>
            Meios de Pagamento
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderColor: '#334155', 
                    color: '#f1f5f9' 
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Peak Hours */}
        <div className={cardClass}>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Clock size={18} className="text-purple-500"/>
            Horários de Pico (Abertura de Mesa)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#334155', opacity: 0.4}}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderColor: '#334155', 
                    color: '#f1f5f9' 
                  }}
                />
                <Bar dataKey="count" name="Pedidos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Table */}
        <div className={cardClass}>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Award size={18} className="text-emerald-500"/>
            Top 5 Produtos (Receita Gerada)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2 text-slate-500 dark:text-slate-400 font-normal text-sm">Produto</th>
                  <th className="py-2 text-slate-500 dark:text-slate-400 font-normal text-sm text-right">Qtd.</th>
                  <th className="py-2 text-slate-500 dark:text-slate-400 font-normal text-sm text-right">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {topProducts.length > 0 ? (
                  topProducts.map((product, index) => (
                    <tr key={index} className="group">
                      <td className="py-3 text-slate-700 dark:text-slate-200 text-sm font-medium flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs flex items-center justify-center text-slate-500">{index + 1}</span>
                        {product.name}
                      </td>
                      <td className="py-3 text-right text-slate-600 dark:text-slate-400 text-sm">{product.quantity}</td>
                      <td className="py-3 text-right text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                        R$ {product.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500 text-sm">Sem dados para o período.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};