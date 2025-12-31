import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>
};

// POST: Dá baixa na marmita (OrderItem)
export async function POST(_req: Request, context: RouteContext) {
  // 1. AWAIT OBRIGATÓRIO PARA LER O ID
  const params = await context.params;
  const { id } = params;

  try {
    // Atualiza o item da marmita
    const orderItem = await prisma.orderItem.update({
      where: { id },
      data: { baixadoNaCozinha: true },
      select: { orderId: true }
    });

    // Atualiza o status do pedido para CLOSED
    await prisma.order.update({
      where: { id: orderItem.orderId },
      data: { status: 'CLOSED' },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao dar baixa na marmita" }, { status: 500 });
  }
}