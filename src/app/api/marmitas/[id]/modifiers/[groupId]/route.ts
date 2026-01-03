import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/app/api/api/authUtils';
import { NextRequest } from "next/server";

// Define o tipo para Next.js 15
type RouteContext = {
  params: Promise<{ id: string; groupId: string }>
};

// PUT: Edita um grupo de modificador
export async function PUT(req: NextRequest, context: RouteContext) {
  // 1. AWAIT OBRIGATÓRIO NO NEXT.JS 15
  const params = await context.params;
  const { id, groupId } = params;

  const auth = await getAuth(req);
  if (!auth.user || auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  // Verifica se os IDs existem
  if (!id || !groupId) {
    return NextResponse.json({ error: 'ID do produto ou grupo não informado' }, { status: 400 });
  }

  const body = await req.json();
  const { name, minSelections, maxSelections, order } = body;

  try {
    const group = await prisma.modifierGroup.update({
      where: { id: groupId }, // Prisma busca pelo ID único do grupo
      data: { 
        name, 
        minSelections: Number(minSelections), 
        maxSelections: Number(maxSelections),
        order: order ? Number(order) : undefined,
        // Não costumamos mudar o productId (id) na edição, mas se precisar:
        // productId: id 
      },
    });
    return NextResponse.json(group);
  } catch (error) {
    console.error("Erro ao atualizar grupo:", error);
    return NextResponse.json({ error: 'Erro ao atualizar grupo' }, { status: 500 });
  }
}

// DELETE: Remove um grupo de modificador
export async function DELETE(req: NextRequest, context: RouteContext) {
  // 1. AWAIT OBRIGATÓRIO NO NEXT.JS 15
  const params = await context.params;
  const { id, groupId } = params;

  const auth = await getAuth(req);
  if (!auth.user || auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  if (!id || !groupId) {
    return NextResponse.json({ error: 'ID do produto ou grupo não informado' }, { status: 400 });
  }

  try {
    await prisma.modifierGroup.delete({
      where: { id: groupId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir grupo:", error);
    return NextResponse.json({ error: 'Erro ao excluir grupo' }, { status: 500 });
  }
}