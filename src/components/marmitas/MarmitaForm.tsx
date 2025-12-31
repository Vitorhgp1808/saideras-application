import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { MarmitaFormValues, Marmita } from "@/types/marmitas";

interface MarmitaFormProps {
  initialValues?: MarmitaFormValues;
  onSubmit: (values: MarmitaFormValues) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

export function MarmitaForm({ initialValues, onSubmit, onCancel, isEdit }: MarmitaFormProps) {
  const [values, setValues] = useState<MarmitaFormValues>(
    initialValues || { name: "", description: "", sellingPrice: 0, active: true, imageUrl: "" }
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialValues?.imageUrl || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsUploadingImage(true);
    let finalImageUrl = values.imageUrl || "";
    try {
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `marmita-${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      }
      onSubmit({ ...values, sellingPrice: Number(values.sellingPrice), imageUrl: finalImageUrl });
    } catch (error) {
      alert("Erro ao salvar imagem. Tente novamente.");
    } finally {
      setIsUploadingImage(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium text-slate-700 dark:text-slate-200">Nome</label>
          <input
            name="name"
            value={values.name}
            onChange={handleChange}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-slate-700 dark:text-slate-200">Tamanho</label>
          <input
            name="unitOfMeasure"
            type="text"
            value={values.unitOfMeasure || ""}
            onChange={handleChange}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            required
          />
        </div>
      </div>
      <div>
        <label className="block mb-1 font-medium text-slate-700 dark:text-slate-200">Descrição</label>
        <textarea
          name="description"
          value={values.description || ""}
          onChange={handleChange}
          className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium text-slate-700 dark:text-slate-200">Preço</label>
          <input
            name="sellingPrice"
            type="number"
            min="0"
            step="0.01"
            value={values.sellingPrice}
            onChange={handleChange}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div className="flex items-center gap-2 mt-7">
          <input
            name="active"
            type="checkbox"
            checked={values.active}
            onChange={handleChange}
            id="active"
            className="accent-blue-600 h-4 w-4"
          />
          <label htmlFor="active" className="text-slate-700 dark:text-slate-200">Ativo</label>
        </div>
      </div>
      <div className="mt-4">
        <label className="block mb-1 font-medium text-slate-700 dark:text-slate-200">Imagem da Marmita</label>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M4 12l4-4a2 2 0 012.828 0l2.344 2.344a2 2 0 002.828 0L20 8m-4 4v4m0 0h-4m4 0h4" /></svg>
          <span className="text-blue-600 font-medium">Selecionar foto</span>
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </label>
        {previewUrl && (
          <div className="mt-2">
            <img src={previewUrl} alt="Preview" className="h-24 w-24 object-cover rounded border" />
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-6">
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg shadow transition-colors" disabled={isUploadingImage}>
          {isUploadingImage ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
        </button>
        <button type="button" className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
