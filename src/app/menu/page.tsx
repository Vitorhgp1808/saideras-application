import { PrismaClient } from '@prisma/client';
import MenuBoard from '@/src/components/menu/MenuBoard';
const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const rawProducts = await prisma.product.findMany({
    orderBy: {
      name: 'asc',
    },

  });

  const products = rawProducts.map((p) => ({
    ...p,
    sellingPrice: Number(p.sellingPrice), 
    stock: Number(p.stock),
    minStockLevel: Number(p.minStockLevel),
  }));

  return <MenuBoard products={products} />;
}