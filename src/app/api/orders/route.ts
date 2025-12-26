import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import type { OrderStatus } from "@prisma/client";
import { getAuth } from "../api/authUtils";
/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Cria um novo pedido
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               table:
 *                 type: string
 *                 description: "ID da mesa para o pedido"
 *             required:
 *               - table
 *     responses:
 *       '201':
 *         description: Pedido criado com sucesso
 *       '400':
 *         description: "Table é obrigatório"
 *       '401':
 *         description: Não autorizado
 *       '403':
 *         description: Acesso negado (apenas WAITER ou ADMIN)
 *       '500':
 *         description: Erro interno do servidor
 */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["WAITER", "ADMIN"].includes(auth.user.role)) {
    return NextResponse.json(
      { error: "Forbidden: Apenas WAITER ou ADMIN" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { table } = body;

    if (!table) {
      return NextResponse.json(
        { error: "Table é obrigatório" },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: {
        tableId: table,
        waiterId: auth.user.id,
        status: "OPEN",
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Lista todos os pedidos
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED, CANCELED]
 *         description: Filtra pedidos pelo status
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: "Filtra pedidos pela data (formato: YYYY-MM-DD)"
 *     responses:
 *       '200':
 *         description: Lista de pedidos
 *       '401':
 *         description: Não autorizado
 *       '500':
 *         description: Erro interno do servidor
 */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const dateParam = searchParams.get("date"); // YYYY-MM-DD

  try {
    // Usando any para permitir flexibilidade na cláusula OR sem importar tipos complexos do Prisma
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    if (status) {
      whereClause.status = { equals: status as OrderStatus };
    }

    if (dateParam) {
      const startOfDay = new Date(dateParam);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(dateParam);
      endOfDay.setUTCHours(23, 59, 59, 999);

      if (status) {
        // Se um status específico foi solicitado, filtra estritamente pela data
        whereClause.createdAt = {
          gte: startOfDay,
          lte: endOfDay,
        };
      } else {
        // Se for listagem geral, traz ordens do dia OU ordens abertas de qualquer data
        whereClause.OR = [
          {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          {
            status: "OPEN",
          },
        ];
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
        waiter: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const ordersWithTotal = orders.map((order) => {
      const itemsTotal = order.items.reduce<number>((sum, item) => {
        if (item.isCourtesy) return sum;
        return sum + Number(item.unitPrice) * Number(item.quantity);
      }, 0);
      const total =
        itemsTotal - Number(order.discount || 0) + Number(order.tip || 0);

      return { ...order, total };
    });

    return NextResponse.json(ordersWithTotal);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
