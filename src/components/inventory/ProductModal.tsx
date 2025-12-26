import React, { useState, useEffect } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image"; 
import { Product, ProductCategory } from "../../types/pdv";
import { Button } from "../../components/ui/Button";
import { supabase } from "../../lib/supabase";
interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Partial<Product>) => void;
  product?: Product | null;
  isLoading?: boolean;
}

export function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  isLoading,
}: ProductModalProps) {

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    sellingPrice: 0,
    unitOfMeasure: "UN",
    minStockLevel: 0,
    category: ProductCategory.OTHER,
    imageUrl: "",
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        sellingPrice: Number(product.sellingPrice),
        unitOfMeasure: product.unitOfMeasure,
        minStockLevel: Number(product.minStockLevel),
        category: product.category || ProductCategory.OTHER,
        imageUrl: product.imageUrl,
      });
      setPreviewUrl(product.imageUrl || null);
    } else {
      setFormData({
        name: "",
        description: "",
        sellingPrice: 0,
        unitOfMeasure: "UN",
        minStockLevel: 0,
        category: ProductCategory.OTHER,
        imageUrl: "",
      });
      setPreviewUrl(null);
    }
    setImageFile(null);
  }, [product, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploadingImage(true);

    try {
      let finalImageUrl = formData.imageUrl;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('products') 
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrl;
      }

      onSubmit({
        ...formData,
        imageUrl: finalImageUrl,
      });

    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao salvar imagem. Tente novamente.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {product ? "Editar Produto" : "Novo Produto"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
            
            <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="relative w-32 h-32 mb-4 group">
                  {previewUrl ? (
                    <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-md">

                        <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                      <ImageIcon size={40} />
                    </div>
                  )}
                  
                  <label 
                    htmlFor="image-upload" 
                    className="absolute bottom-0 right-0 p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full cursor-pointer shadow-lg transition-transform hover:scale-105"
                  >
                    <Upload size={16} />
                  </label>
                </div>
                
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Clique no ícone para adicionar uma foto (JPG, PNG)
                </p>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Nome do Produto
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Descrição
              </label>
              <input
                type="text"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Preço Venda (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.sellingPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sellingPrice: parseFloat(e.target.value),
                  })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as ProductCategory,
                  })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
              >
                <option value="OTHER">Geral</option>
                <option value="CHOPP">Chopp</option>
                <option value="DRINK">Bebida</option>
                <option value="FOOD">Comida</option> 
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Unidade de Medida
              </label>
              <select
                value={formData.unitOfMeasure}
                onChange={(e) =>
                  setFormData({ ...formData, unitOfMeasure: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
              >
                <option value="UN">Unidade (UN)</option>
                <option value="L">Litro (L)</option>
                <option value="KG">Quilo (KG)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Estoque Mínimo
              </label>
              <input
                type="number"
                step="1"
                required
                value={formData.minStockLevel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minStockLevel: parseFloat(e.target.value),
                  })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading || isUploadingImage}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isLoading || isUploadingImage}
            >
              {isUploadingImage ? "Enviando Imagem..." : (product ? "Salvar Alterações" : "Cadastrar Produto")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}