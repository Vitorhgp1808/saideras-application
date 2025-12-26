import React from 'react';
import { Pencil, Trash2, AlertTriangle, Droplet, Image as ImageIcon, Beer, Utensils, Wine, Box } from 'lucide-react';
import Image from "next/image";
import { Product } from '../../types/pdv';
import { Badge } from "../../components/ui/Badge";

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductList({ products, onEdit, onDelete }: ProductListProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm font-medium uppercase border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="px-6 py-4">Foto</th>
            <th className="px-6 py-4">Produto</th>
            <th className="px-6 py-4">Categoria</th>
            <th className="px-6 py-4">Preço Venda</th>
            <th className="px-6 py-4">Estoque Atual</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {products.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
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
                  
                  <td className="px-6 py-4">
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

                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral" className="capitalize">
                      {product.category || 'Geral'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(product.sellingPrice))}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {product.unitOfMeasure === 'L' && <Droplet size={14} className="text-blue-400" />}
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {currentStock} {product.unitOfMeasure}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isLowStock ? (
                      <div className="flex items-center gap-1 text-red-500 dark:text-red-400 text-xs font-bold">
                        <AlertTriangle size={14} />
                        BAIXO
                      </div>
                    ) : (
                      <div className="text-emerald-500 dark:text-emerald-400 text-xs font-bold">NORMAL</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onEdit(product)}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => onDelete(product.id)}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
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