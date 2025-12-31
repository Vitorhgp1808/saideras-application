import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/app/api/api/authUtils';

// Definição do tipo para Next.js 15
type RouteContext = {
  params: Promise<{ id: string }>
};

// GET: Lista todos os itens de um grupo de modificador
export async function GET(_req: Request, context: RouteContext) {
  // 1. AWAIT OBRIGATÓRIO
  const params = await context.params;
  
  const items = await prisma.modifierItem.findMany({
    where: { modifierGroupId: params.id },
    orderBy: { order: 'asc' },
  });
  
  return NextResponse.json(items);
}

// POST: Cria um novo item de modificador em um grupo
export async function POST(req: Request, context: RouteContext) {
  // 1. AWAIT OBRIGATÓRIO PARA LER O ID DO GRUPO
  const params = await context.params;
  const groupId = params.id;

  const auth = await getAuth(req);
  if (!auth.user || auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const body = await req.json();
  const { name, priceExtra, order, productId } = body;

  try {
    const data = {
      name: name as string,
      priceExtra: priceExtra ? Number(priceExtra) : 0,
      order: order ? Number(order) : 0,
      modifierGroupId: groupId as string,
      ...(productId ? { productId: productId as string } : {})
    };

    // Opcional: Se sua lógica exige productId no Item também
    if (productId) {
      data.productId = productId;
    }

    const item = await prisma.modifierItem.create({
      data,
    });
    
    return NextResponse.json(item, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar item:", error);
    return NextResponse.json(
      { error: 'Erro interno ao criar item', details: String(error) }, 
      { status: 500 }
    );
  }
}