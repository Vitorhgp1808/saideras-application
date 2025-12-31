import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/app/api/api/authUtils';

// Definição do tipo para Next.js 15
type RouteContext = {
  params: Promise<{ id: string }>
};

// GET: Lista todos os grupos
export async function GET(req: Request, context: RouteContext) {
  // AWAIT OBRIGATÓRIO NO NEXT.JS 15
  const params = await context.params;
  const id = params.id;
  
  const groups = await prisma.modifierGroup.findMany({
    where: { productId: id },
    include: {
      items: true
    },
    orderBy: {
      order: 'asc'
    }
  });
  
  return NextResponse.json(groups);
}

// POST: Cria um novo grupo
export async function POST(req: Request, context: RouteContext) {
  // 1. AWAIT OBRIGATÓRIO NO NEXT.JS 15 PARA LER O ID
  const params = await context.params;
  const id = params.id;

  const auth = await getAuth(req);
  if (!auth.user || auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  if (!id) {
    return NextResponse.json({ error: 'ID do produto não informado na URL' }, { status: 400 });
  }

  const body = await req.json();
  const { name, minSelections, maxSelections, order } = body;

  try {
    const group = await prisma.modifierGroup.create({
      data: {
        name,
        minSelections: Number(minSelections),
        maxSelections: Number(maxSelections),
        order: order ? Number(order) : 0,
        productId: id,
      },
    });
    
    return NextResponse.json(group, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar grupo:", error);
    return NextResponse.json({ error: 'Erro interno ao criar grupo' }, { status: 500 });
  }
}