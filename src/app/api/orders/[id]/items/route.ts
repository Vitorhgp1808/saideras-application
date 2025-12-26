import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "./../../../../../lib/prisma";
import { getAuth } from "../../../api/authUtils";
import { Prisma } from "@prisma/client";

/**
 * @swagger
 * /api/orders/{id}/items:
 *   post:
 *     summary: Adiciona um item a um pedido
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *             required:
 *               - productId
 *               - quantity
 *     responses:
 *       '200':
 *         description: Item adicionado com sucesso
 *       '400':
 *         description: productId e quantity são obrigatórios
 *       '401':
 *         description: Não autorizado
 *       '403':
 *         description: Acesso negado
 *       '404':
 *         description: Produto não encontrado
 *       '409':
 *         description: Estoque insuficiente
 *       '500':
 *         description: Erro interno do servidor
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["WAITER", "ADMIN"].includes(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: orderId } = await params;
  try {
    const body = await req.json();
    const { productId, quantity } = body;

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: "productId and quantity are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Verifica o estoque diretamente no Product
      if (product.stock < quantity) {
        throw new Error("Insufficient stock");
      }

      // Decrementa o estoque do Product
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } },
      });

      await tx.orderItem.create({
        data: {
          orderId,
          productId,
          quantity,
          unitPrice: product.sellingPrice,
        },
      });

      // Recalcula subtotal, discount, tip e total
      const updatedOrderItems = await tx.orderItem.findMany({
        where: { orderId },
      });

      let newSubtotal = 0;
      for (const item of updatedOrderItems) {
        if (!item.isCourtesy) {
          newSubtotal += Number(item.quantity) * Number(item.unitPrice); // Convertendo para Number explicitamente
        }
      }

      // Busca o pedido para obter discount e tip atuais
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        select: { discount: true, tip: true },
      });

      // newSubtotal já é um número, discount e tip podem ser Decimal
      const newTotal = new Prisma.Decimal(newSubtotal)
        .minus(currentOrder?.discount || new Prisma.Decimal(0))
        .plus(currentOrder?.tip || new Prisma.Decimal(0));

      const finalOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal: new Prisma.Decimal(newSubtotal),
          total: newTotal, // newTotal já é Prisma.Decimal
        },
        include: {
          items: true,
        },
      });

      return finalOrder;
    });

    return NextResponse.json(updatedOrder);
  } catch (error: unknown) {
    console.error(`Error adding item to order ${orderId}:`, error);
    const message = error instanceof Error ? error.message : String(error);
    if (message === "Insufficient stock") {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
