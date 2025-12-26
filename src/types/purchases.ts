export type Supplier = {
  id: string;
  name: string;
  cnpj: string;
  contact: string;
  productsProvided: string[];
};

export type Purchase = {
  id: string;
  purchaseDate: string;
  quantity: number;
  costPrice: number;
  batch?: string;
  expiryDate?: string;
  productId: string;
  supplierId: string;
  product: { name: string };
  supplier: { name: string };
};

export type ProductFilter = {
  id: string;
  name: string;
  costPrice: number;
};