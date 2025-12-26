import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getAuth } from "../../../api/authUtils";

/**
 * @swagger
 * paths:
 *   /api/orders/{id}/close:
 *     put:
 *       summary: Fecha um pedido
 *       tags:
 *         - Orders
 *       security:
 *         - BearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           schema:
 *             type: string
 *           required: true
 *           description: ID do pedido
 *       responses:
 *         '200':
 *           description: Pedido fechado com sucesso
 *         '401':
 *           description: Não autorizado
 *         '403':
 *           description: Acesso negado (apenas CASHIER ou ADMIN)
 *         '404':
 *           description: Pedido não encontrado
 *         '409':
 *           description: Pedido não pode ser fechado
 *         '500':
 *           description: Erro interno do servidor
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["CASHIER", "ADMIN"].includes(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: orderId } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "OPEN") {
      return NextResponse.json(
        { error: "Order cannot be closed" },
        { status: 409 }
      );
    }

    const closedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
      },
    });

    return NextResponse.json(closedOrder);
  } catch (error) {
    console.error(`Error closing order ${orderId}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
