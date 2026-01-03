'use client';

import { useState, useRef } from 'react';
import { Search, Beer, Utensils, Wine, Box, ShoppingBag } from 'lucide-react';
import { Toast } from '@/components/ui/Toast';

type SerializedProduct = {
  id: string;
  name: string;
  description: string | null;
  sellingPrice: number;
  category: 'CHOPP' | 'FOOD' | 'DRINK' | 'OTHER';
  unitOfMeasure: string;
  stock: number;
  active: boolean;
  imageUrl?: string | null;
};

const CATEGORIES = [
  { id: 'ALL', label: 'Todos', icon: ShoppingBag },
  { id: 'CHOPP', label: 'Chopps', icon: Beer },
  { id: 'FOOD', label: 'Comidas', icon: Utensils },
  { id: 'DRINK', label: 'Bebidas', icon: Wine },
  { id: 'PACKED_LUNCH', label: 'Marmitas', icon: Box },
  { id: 'OTHER', label: 'Outros', icon: Box },
];

export default function MenuBoard({ products }: { products: SerializedProduct[] }) {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMsg(null), 4000);
  }

 
  let filteredProducts: SerializedProduct[] = [];
  try {
    filteredProducts = products
      .filter((product) => (product.active !== false)) 
      .filter((product) => {
        const matchesCategory = activeCategory === 'ALL' || product.category === activeCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      });
  } catch (err: any) {
    showToast(err?.message || 'Erro ao filtrar produtos.');
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {toastMsg && (
        <Toast message={toastMsg} type="error" onClose={() => setToastMsg(null)} />
      )}
      <div className="sticky top-0 z-10 bg-white shadow-sm pt-4 pb-2 px-2 sm:px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Nosso Cardápio</h1>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="O que você procura hoje?"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm font-medium
                  ${isActive 
                    ? 'bg-orange-600 text-white shadow-md transform scale-105' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}
                `}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="p-2 sm:p-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex gap-3 sm:gap-4 group cursor-pointer min-w-0"
            >
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative">
                {product.imageUrl ? (
                    <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                       {product.category === 'CHOPP' && <Beer size={32} />}
                        {product.category === 'FOOD' && <Utensils size={32} />}
                        {product.category === 'DRINK' && <Wine size={32} />}
                        {product.category === 'OTHER' && <Box size={32} />}
                    </div>
                )}
                </div>

              <div className="flex flex-col flex-1 justify-between">
                <div>
                  <div className="flex justify-between items-start min-w-0">
                    <h3 className="font-semibold text-gray-800 line-clamp-1 break-anywhere min-w-0">{product.name}</h3>
                    {product.stock <= 0 && (
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Esgotado
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 line-clamp-2 leading-relaxed break-anywhere">
                    {product.description || 'Sem descrição.'}
                  </p>
                </div>
                
                <div className="flex justify-between items-end mt-2 sm:mt-3">
                  <span className="text-gray-400 text-[10px] sm:text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                    {product.unitOfMeasure}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-gray-900">
                    {formatCurrency(product.sellingPrice)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-10 sm:py-20 text-gray-400">
            <Utensils className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-4 opacity-20" />
            <p>Nenhum produto disponível nesta categoria.</p>
          </div>
        )}
      </main>
    </div>
  );
}