import React from 'react';
import { Switch } from '@headlessui/react';
import { Pencil, Trash2, AlertTriangle, Droplet, Image as ImageIcon, Beer, Utensils, Wine, Box } from 'lucide-react';
import Image from "next/image";
import { Product } from '../../types/pdv';
import { Badge } from "../../components/ui/Badge";

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (product: Product, active: boolean) => void;
}

export function ProductList({ products, onEdit, onDelete, onToggleActive }: ProductListProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-sm">
      <table className="min-w-[700px] w-full text-left">
        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm font-medium uppercase border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="px-4 sm:px-6 py-4">Foto</th>
            <th className="px-4 sm:px-6 py-4">Produto</th>
            <th className="px-4 sm:px-6 py-4">Categoria</th>
            <th className="px-4 sm:px-6 py-4">Preço Venda</th>
            <th className="px-4 sm:px-6 py-4">Estoque Atual</th>
            <th className="px-4 sm:px-6 py-4">Status</th>
            <th className="px-4 sm:px-6 py-4">Ativo</th>
            <th className="px-4 sm:px-6 py-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {products.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                Nenhum produto encontrado.
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const currentStock = product.stock ?? 0;
              const minStock = product.minStockLevel ?? 0;
              const isLowStock = currentStock <= minStock;

              return (
                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  
                  <td className="px-4 sm:px-6 py-4">
                    <div className="h-10 w-10 relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-sm">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">
                          {product.category === 'CHOPP' && <Beer size={18} />}
                          {product.category === 'FOOD' && <Utensils size={18} />}
                          {product.category === 'DRINK' && <Wine size={18} />}
                          {(!product.category || product.category === 'OTHER') && <Box size={18} />}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 sm:px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <Badge variant="neutral" className="capitalize">
                      {product.category || 'Geral'}
                    </Badge>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-slate-700 dark:text-slate-300">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(product.sellingPrice))}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-2">
                      {product.unitOfMeasure === 'L' && <Droplet size={14} className="text-blue-400" />}
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {currentStock} {product.unitOfMeasure}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    {isLowStock ? (
                      <div className="flex items-center gap-1 text-red-500 dark:text-red-400 text-xs font-bold">
                        <AlertTriangle size={14} />
                        BAIXO
                      </div>
                    ) : (
                      <div className="text-emerald-500 dark:text-emerald-400 text-xs font-bold">NORMAL</div>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <Switch
                      checked={product.active}
                      onChange={(value) => onToggleActive && onToggleActive(product, value)}
                      className={`${product.active ? 'bg-emerald-600' : 'bg-slate-300'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                    >
                      <span
                        className={`${product.active ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    {/* Aumentei o gap para gap-3 no mobile para separar mais os botões */}
                    <div className="flex flex-nowrap justify-end gap-3 sm:gap-2">
                      
                      {/* Botão de Editar */}
                      <button 
                        onClick={() => onEdit(product)}
                        /* Mudei p-2 para p-3 no mobile para aumentar a área de toque */
                        className="p-3 sm:p-2 text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                        title="Editar"
                        tabIndex={0}
                      >
                        {/* Ícone responsivo: w-6 (24px) no mobile, w-5 (20px) no desktop */}
                        <Pencil className="w-6 h-6 sm:w-5 sm:h-5" />
                      </button>

                      {/* Botão de Excluir */}
                      <button 
                        onClick={() => onDelete(product.id)}
                        className="p-3 sm:p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                        title="Excluir"
                        tabIndex={0}
                      >
                        <Trash2 className="w-6 h-6 sm:w-5 sm:h-5" />
                      </button>

                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}