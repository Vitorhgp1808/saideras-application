import React from "react";

export interface Marmita {
  id: string;
  name: string;
  description?: string;
  sellingPrice: number;
  active: boolean;
  unitOfMeasure?: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
}

export interface MarmitaFormValues {
  name: string;
  description?: string;
  sellingPrice: number;
  active: boolean;
  unitOfMeasure?: string;
  imageUrl?: string;
}
