// app/(dashboard)/estoque/novo/page.tsx
"use client";

import { useState, ChangeEvent } from "react"; // Adicionado ChangeEvent
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // NOVO: Para mostrar o preview
import { supabase } from "@/src/lib/supabase";
export default function NovoProdutoPage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState<"UNIDADE" | "LITRO" | "KG">("UNIDADE");
  const [minStockLevel, setMinStockLevel] = useState("");
  const [category, setCategory] = useState<"CHOPP" | "FOOD" | "DRINK" | "OTHER">("OTHER");
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

        if (!name || !sellingPrice || !minStockLevel || !category) {
          setError("Nome, Preço de Venda, Nível Mínimo e Categoria são obrigatórios.");
          setIsLoading(false);
          return;
        }
        
        const headers = getAuthHeaders();
        if (!headers) {
          setIsLoading(false);
          return;
        }

        try {
          let finalImageUrl = null;

          if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('products') 
              .upload(filePath, imageFile);

            if (uploadError) throw new Error(`Erro ao enviar imagem: ${uploadError.message}`);

            const { data: { publicUrl } } = supabase.storage
              .from('products')
              .getPublicUrl(filePath);

            finalImageUrl = publicUrl;
          }
    
          const body = {
            name,
            description,
            sellingPrice: parseFloat(sellingPrice),
            unitOfMeasure,
            minStockLevel: parseInt(minStockLevel, 10),
            category,
            imageUrl: finalImageUrl,
          };
    
          const res = await fetch('/api/products', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
          });
    
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || "Falha ao cadastrar produto.");
          }
    
          setSuccess(`Produto "${name}" cadastrado com sucesso!`);
          
          setName("");
          setDescription("");
          setSellingPrice("");
          setUnitOfMeasure("UNIDADE");
          setMinStockLevel("");
          setCategory("OTHER");
          setImageFile(null);
          setImagePreview(null);
    
          setTimeout(() => {
            router.push('/estoque');
            router.refresh();
          }, 2000);
    
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Ocorreu um erro desconhecido.");
          }
        } finally {
          setIsLoading(false);
        }
      };
    
      const inputClass = "w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
    
      return (
        <div className="max-w-4xl mx-auto p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Cadastrar Novo Produto
            </h1>
            <Link
              href="/estoque"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              <ArrowLeftIcon />
              Voltar para o Estoque
            </Link>
          </div>
    
          <form
            className="bg-white p-6 md:p-8 rounded-lg shadow-md border border-gray-200"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex flex-col items-center justify-center mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 self-start">
                  Foto do Produto
                </label>
                
                <div className="flex items-center gap-6 w-full">
                  <div className="w-32 h-32 relative rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 flex-shrink-0">
                    {imagePreview ? (
                      <Image 
                        src={imagePreview} 
                        alt="Preview" 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-gray-400">
                        <ImageIcon />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <input
                      type="file"
                      id="imageUpload"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden" 
                    />
                    <label 
                      htmlFor="imageUpload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                    >
                      Selecionar Imagem
                    </label>
                    <p className="mt-2 text-sm text-gray-500">
                      PNG, JPG ou WEBP (Max. 5MB)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                  Nome do Produto*
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Porção de Fritas"
                />
              </div>
    
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="unitOfMeasure">
                  Unidade de Medida*
                </label>
                <select
                  id="unitOfMeasure"
                  value={unitOfMeasure}
                  onChange={(e) => setUnitOfMeasure(e.target.value as "UNIDADE" | "LITRO" | "KG")}
                  className={inputClass}
                >
                  <option value="UNIDADE">Unidade (Ex: Porções, Garrafas)</option>
                  <option value="LITRO">Litro (Ex: Chopp, Refri)</option>
                  <option value="KG">Quilograma (Ex: Carnes)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category">
                  Categoria*
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as "CHOPP" | "FOOD" | "DRINK" | "OTHER")}
                  className={inputClass}
                >
                  <option value="CHOPP">Chopp</option>
                  <option value="FOOD">Comida</option>
                  <option value="DRINK">Bebida (não chopp)</option>
                  <option value="OTHER">Outros</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="sellingPrice">
                  Preço de Venda (R$)*
                </label>
                <input
                  id="sellingPrice"
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className={inputClass}
                  placeholder="Ex: 29.90"
                  min="0.01"
                  step="0.01"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="minStock">
                  Nível Mínimo de Estoque*
                </label>
                <input
                  id="minStock"
                  type="number"
                  value={minStockLevel}
                  onChange={(e) => setMinStockLevel(e.target.value)}
                  className={inputClass}
                  placeholder="Ex: 10"
                  min="0"
                  step="1"
                />
                <small className="text-xs text-gray-500 mt-1">
                  O sistema alertará quando o estoque for igual ou menor que este valor.
                </small>
              </div>
    
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                  Descrição (Opcional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputClass} min-h-[100px]`}
                  placeholder="Ingredientes, observações, etc."
                />
              </div>
    
              <div className="md:col-span-2">
                {error && <ErrorAlert message={error} />}
                {success && <SuccessAlert message={success} />}
              </div>
    
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="w-full md:w-auto px-6 py-3 bg-green-600 text-white font-semibold
                             rounded-lg shadow-md hover:bg-green-700 transition-colors
                             disabled:bg-green-300 disabled:cursor-not-allowed
                             flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading && <SpinnerIcon />}
                  {isLoading ? "Salvando..." : "Salvar Produto"}
                </button>
              </div>
              
            </div>
          </form>
        </div>
      );
    }
    

    function ImageIcon() {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      );
    }
    function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg" role="alert">
      <strong className="font-bold">Erro: </strong>
      <span>{message}</span>
    </div>
  );
}

function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="p-4 bg-green-50 border border-green-300 text-green-700 rounded-lg" role="alert">
      <strong className="font-bold">Sucesso! </strong>
      <span>{message}</span>
    </div>
  );
}

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

function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}