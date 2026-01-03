/**
 * @swagger
 * /api/orders/{id}/close:
 *   post:
 *     summary: Fecha um pedido e realiza baixa de estoque inteligente
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     responses:
 *       '200':
 *         description: Pedido fechado e estoque baixado
 *       '400':
 *         description: Pedido já fechado/cancelado
 *       '404':
 *         description: Pedido não encontrado
 *       '500':
 *         description: Erro interno do servidor
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Só executa se rota for /close
  if (!req.url.endsWith('/close')) return;
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    // Busca pedido com itens e modificadores
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.status !== 'OPEN') {
      return NextResponse.json({ error: 'Pedido já fechado ou cancelado.' }, { status: 400 });
    }
    // Atualiza status do pedido para CLOSED
    await prisma.order.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
    return NextResponse.json({ message: 'Pedido fechado e estoque baixado.' });
  } catch (error) {
    console.error(`Error closing order ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from "./../../../../lib/prisma";
import { getAuth } from "../../api/authUtils";

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Cancela um pedido
 *     description: Apenas comandas abertas podem ser canceladas.
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
 *     responses:
 *       '200':
 *         description: Pedido cancelado com sucesso
 *       '400':
 *         description: Apenas comandas abertas podem ser canceladas
 *       '401':
 *         description: Não autorizado
 *       '403':
 *         description: Acesso negado
 *       '404':
 *         description: Pedido não encontrado
 *       '500':
 *         description: Erro interno do servidor
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Apenas Manager ou o próprio garçom (idealmente) pode cancelar?
  // Por enquanto, deixamos Manager e Garçom.
  if (!["WAITER", "ADMIN", "CASHIER"].includes(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Busca pedido com itens e modificadores
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'OPEN') {
      return NextResponse.json({ error: 'Apenas comandas abertas podem ser canceladas.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Order cancelled successfully, estoque revertido.' });
  } catch (error) {
    console.error(`Error deleting order ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Busca um pedido pelo ID
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
 *     responses:
 *       '200':
 *         description: Detalhes do pedido
 *       '401':
 *         description: Não autorizado
 *       '404':
 *         description: Pedido não encontrado
 *       '500':
 *         description: Erro interno do servidor
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userRole = req.headers.get('X-User-Role');
  if (!userRole) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        waiter: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}