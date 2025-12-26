import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getAuth } from "../../../../api/authUtils";
import { Prisma } from "@prisma/client";

/**
 * @swagger
 * /api/orders/{id}/items/{itemId}:
 *   delete:
 *     summary: Remove um item de um pedido
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
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do item do pedido a ser removido
 *     responses:
 *       '200':
 *         description: Item removido com sucesso
 *       '401':
 *         description: Não autorizado
 *       '403':
 *         description: Acesso negado
 *       '404':
 *         description: Item não encontrado
 *       '500':
 *         description: Erro interno do servidor
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["WAITER", "ADMIN"].includes(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { itemId } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      const itemToDelete = await tx.orderItem.findUnique({
        where: { id: itemId },
      });

      if (!itemToDelete) {
        throw new Error("Item not found");
      }

      await tx.orderItem.delete({
        where: { id: itemId },
      });

      // Recalcular o total do pedido
      const updatedOrderItems = await tx.orderItem.findMany({
        where: { orderId: itemToDelete.orderId },
      });

      let newSubtotal = 0;
      for (const item of updatedOrderItems) {
        if (!item.isCourtesy) {
          newSubtotal += Number(item.quantity) * Number(item.unitPrice);
        }
      }

      const currentOrder = await tx.order.findUnique({
        where: { id: itemToDelete.orderId },
        select: { discount: true, tip: true },
      });

      const newTotal = new Prisma.Decimal(newSubtotal)
        .minus(currentOrder?.discount || new Prisma.Decimal(0))
        .plus(currentOrder?.tip || new Prisma.Decimal(0));

      await tx.order.update({
        where: { id: itemToDelete.orderId },
        data: {
          subtotal: new Prisma.Decimal(newSubtotal),
          total: newTotal,
        },
      });

      return itemToDelete;
    });

    return NextResponse.json({ message: "Item deleted" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/orders/{id}/items/{itemId}:
 *   patch:
 *     summary: Atualiza um item do pedido (ex. marcar como cortesia)
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
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do item do pedido a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isCourtesy:
 *                 type: boolean
 *                 description: Marcar o item como cortesia
 *             required:
 *               - isCourtesy
 *     responses:
 *       '200':
 *         description: Item atualizado com sucesso
 *       '401':
 *         description: Não autorizado
 *       '403':
 *         description: Acesso negado
 *       '404':
 *         description: Item não encontrado
 *       '500':
 *         description: Erro interno do servidor
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["WAITER", "ADMIN"].includes(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { itemId } = await params;

  try {
    const body = await req.json();
    const { isCourtesy } = body;

    const updatedItem = await prisma.$transaction(async (tx) => {
      const itemToUpdate = await tx.orderItem.findUnique({
        where: { id: itemId },
      });

      if (!itemToUpdate) {
        throw new Error("Item not found");
      }

      const updatedOrderItem = await tx.orderItem.update({
        where: { id: itemId },
        data: {
          isCourtesy: isCourtesy,
        },
      });

      // Recalcular o total do pedido
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: itemToUpdate.orderId },
      });

      let newSubtotal = 0;
      for (const item of orderItems) {
        if (!item.isCourtesy) {
          newSubtotal += Number(item.quantity) * Number(item.unitPrice);
        }
      }

      const currentOrder = await tx.order.findUnique({
        where: { id: itemToUpdate.orderId },
        select: { discount: true, tip: true },
      });

      const newTotal = new Prisma.Decimal(newSubtotal)
        .minus(currentOrder?.discount || new Prisma.Decimal(0))
        .plus(currentOrder?.tip || new Prisma.Decimal(0));

      await tx.order.update({
        where: { id: itemToUpdate.orderId },
        data: {
          subtotal: new Prisma.Decimal(newSubtotal),
          total: newTotal,
        },
      });

      return updatedOrderItem;
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}