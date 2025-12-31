"use client";
import React, { useState } from "react";

interface ModifierGroupFormProps {
  onSubmit: (data: { name: string; minSelections: number; maxSelections: number; order: number }) => void;
  onCancel: () => void;
  initialData?: { name: string; minSelections: number; maxSelections: number; order: number };
}

export default function ModifierGroupForm({ onSubmit, onCancel, initialData }: ModifierGroupFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [minSelections, setMinSelections] = useState(initialData?.minSelections ?? 0);
  const [maxSelections, setMaxSelections] = useState(initialData?.maxSelections ?? 1);
  const [order, setOrder] = useState(initialData?.order ?? 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ name, minSelections, maxSelections, order });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2 sm:p-4 border rounded bg-white max-w-full">
      <div>
        <label className="block font-medium mb-1">Nome do Grupo</label>
        <input
          className="w-full border rounded p-2"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-4">
        <div>
          <label className="block font-medium mb-1">Mínimo</label>
          <input
            type="number"
            className="w-20 border rounded p-2"
            value={minSelections}
            min={0}
            onChange={e => setMinSelections(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Máximo</label>
          <input
            type="number"
            className="w-20 border rounded p-2"
            value={maxSelections}
            min={1}
            onChange={e => setMaxSelections(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Ordem</label>
          <input
            type="number"
            className="w-20 border rounded p-2"
            value={order}
            min={0}
            onChange={e => setOrder(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold">Salvar</button>
        <button type="button" className="text-slate-500 hover:underline" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
