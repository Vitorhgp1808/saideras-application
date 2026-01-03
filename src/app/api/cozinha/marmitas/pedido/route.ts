import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/app/api/api/authUtils";

/**
 * POST /api/cozinha/marmitas/pedido
 * Cria um novo pedido de marmita (sem mesa)
 * Body: { marmitaId: string, quantity?: number, unitPrice?: number }
 */
export async function POST(req: Request) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { marmitas = [], nome, paymentMethod } = body;
    if (!Array.isArray(marmitas) || marmitas.length === 0) {
      return NextResponse.json({ error: "É necessário ao menos uma marmita." }, { status: 400 });
    }

    let subtotal = 0;
    const itemsToCreate = [];
    for (const pedido of marmitas) {
      const { marmitaId, quantity = 1, unitPrice, modifiers = [], observacaoPedido } = pedido;
      if (!marmitaId) continue;
      const marmita = await prisma.product.findUnique({ where: { id: marmitaId } });
      if (!marmita) continue;
      let itemPrice = Number(unitPrice ?? marmita.sellingPrice);
      let modifierCreates: any[] = [];
      for (const modGroup of modifiers) {
        for (const itemId of modGroup.itemIds) {
          const item = await prisma.modifierItem.findUnique({ where: { id: itemId } });
          if (item) {
            itemPrice += Number(item.priceExtra || 0);
            modifierCreates.push({
              modifierItemId: item.id,
              nameSnapshot: item.name,
              priceSnapshot: item.priceExtra || 0,
            });
          }
        }
      }
      subtotal += itemPrice * quantity;
      itemsToCreate.push({
        productId: marmitaId,
        quantity,
        unitPrice: itemPrice,
        isCourtesy: false,
        observacaoPedido: observacaoPedido,
        modifiers: {
          create: modifierCreates,
        },
      });
    }

    if (itemsToCreate.length === 0) {
      return NextResponse.json({ error: "Nenhuma marmita válida para pedido." }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        tableId: null,
        waiterId: auth.user.id,
        status: "OPEN",
        nomePedido: nome,
        subtotal,
        total: subtotal,
        items: {
          create: itemsToCreate,
        },
      },
      include: {
        items: { include: { modifiers: true } },
      },
    });

    // Se paymentMethod foi enviado, cria o pagamento
    let payment = null;
    if (paymentMethod) {
      // Buscar o caixa aberto do usuário (waiter) para associar ao pagamento
      const cashier = await prisma.cashier.findFirst({
        where: {
          closingDate: null,
          openedById: auth.user.id,
        },
      });
      if (!cashier) {
        return NextResponse.json({ error: "Nenhum caixa aberto encontrado para o usuário." }, { status: 400 });
      }
      payment = await prisma.payment.create({
        data: {
          amount: subtotal,
          paymentMethod,
          orderId: order.id,
          cashierId: cashier.id,
        },
      });
    }

    return NextResponse.json({ ...order, payment }, { status: 201 });
  } catch (error) {
    console.error("Error creating marmita order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
