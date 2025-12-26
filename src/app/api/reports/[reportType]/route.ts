// app/api/reports/[reportType]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import jwt, { JwtPayload } from "jsonwebtoken";
import { OrderStatus, UserRole, Prisma } from "@prisma/client";

async function getAuth(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token de autenticação não fornecido.");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    if (decoded.role !== UserRole.ADMIN) {
      throw new Error("Acesso não autorizado. Apenas Gerentes.");
    }
    return decoded;
  } catch (error) {
    console.error(error);
    throw new Error("Token inválido ou expirado.");
  }
}

function getEndDate(dateString: string): Date {
  const date = new Date(dateString);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}

/**
 * @swagger
 * /api/reports/{reportType}:
 *   get:
 *     summary: Gera relatórios diversos
 *     tags:
 *       - Reports
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [faturamento, performance, fluxoCaixa, detailed_orders]
 *         description: "Tipo de relatório a ser gerado"
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data de início do período do relatório (YYYY-MM-DD)"
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data de fim do período do relatório (YYYY-MM-DD)"
 *     responses:
 *       '200':
 *         description: Relatório gerado com sucesso
 *       '400':
 *         description: "Datas de início e fim são obrigatórias ou tipo de relatório inválido"
 *       '401':
 *         description: "Não autorizado (Token inválido ou acesso negado)"
 *       '500':
 *         description: Erro interno do servidor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportType: string }> }
) {
  const { reportType } = await params;
  try {
    await getAuth(request);

    const { searchParams } = new URL(request.url);

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { message: "Datas de início e fim são obrigatórias." },
        { status: 400 }
      );
    }

    const dateFrom = new Date(fromParam);
    const dateTo = getEndDate(toParam);

    switch (reportType) {
      case "faturamento":
        const faturamento = await getFaturamentoReport(dateFrom, dateTo);
        return NextResponse.json(faturamento);

      case "performance":
        const performance = await getPerformanceReport(dateFrom, dateTo);
        return NextResponse.json(performance);

      case "fluxoCaixa":
        const fluxoCaixa = await getFluxoCaixaReport(dateFrom, dateTo);
        return NextResponse.json(fluxoCaixa);

      case "detailed_orders":
        const orders = await getDetailedOrdersReport(dateFrom, dateTo);
        return NextResponse.json(orders);

      default:
        return NextResponse.json(
          { message: "Tipo de relatório inválido." },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message.includes("autorizado") || error.message.includes("Token"))) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error(`Erro ao gerar relatório ${reportType}:`, error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

async function getFaturamentoReport(from: Date, to: Date) {
  const orderAggregates = await prisma.order.aggregate({
    _sum: {
      tip: true,
      total: true,
    },
    where: {
      status: OrderStatus.PAID,
      updatedAt: { gte: from, lte: to },
    },
  });

  const courtesyResult: Array<{ total_cortesias: number }> =
    await prisma.$queryRaw`
    SELECT SUM(oi.quantity * oi."unitPrice") as total_cortesias
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    WHERE oi."isCourtesy" = true
      AND o.status = ${OrderStatus.PAID}::"OrderStatus" 
      AND o."updatedAt" >= ${from}
      AND o."updatedAt" <= ${to};
  `;

  const totalGorjetas = Number(orderAggregates._sum.tip || 0);
  const totalLiquido = Number(orderAggregates._sum.total || 0);
  const totalCortesias = Number(courtesyResult[0]?.total_cortesias || 0);

  const totalVendasBruto = totalLiquido + totalCortesias;

  return {
    periodo: { inicio: from.toISOString(), fim: to.toISOString() },
    totalVendasBruto,
    totalCortesias,
    totalGorjetas,
    totalLiquido,
  };
}

async function getPerformanceReport(from: Date, to: Date) {
  const productSalesRaw: Array<{ productId: string; total_vendido: number }> =
    await prisma.$queryRaw`
    SELECT 
      oi."productId", 
      SUM(oi.quantity * oi."unitPrice") as total_vendido
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    WHERE oi."isCourtesy" = false
      AND o.status = ${OrderStatus.PAID}::"OrderStatus"
      AND o."updatedAt" >= ${from}
      AND o."updatedAt" <= ${to}
    GROUP BY oi."productId"
    ORDER BY total_vendido DESC
    LIMIT 10;
  `;

  const productIds = productSalesRaw.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });

  const topProdutos = productSalesRaw.map((sale) => {
    const product = products.find((p) => p.id === sale.productId);
    return {
      id: sale.productId,
      name: product?.name || "Produto Desconhecido",
      totalVendido: Number(sale.total_vendido || 0),
    };
  });

  return { topProdutos };
}

async function getFluxoCaixaReport(from: Date, to: Date) {
  const entradasAgg = await prisma.order.aggregate({
    _sum: {
      total: true,
    },
    where: {
      status: OrderStatus.PAID,
      updatedAt: { gte: from, lte: to },
    },
  });
  const totalEntradas = entradasAgg._sum.total || new Prisma.Decimal(0);

  const saidasData = await prisma.purchase.findMany({
    where: {
      purchaseDate: { gte: from, lte: to },
    },
    select: {
      quantity: true,
      costPrice: true,
    },
  });

  const totalSaidas = saidasData.reduce((acc, purchase) => {
    return acc.plus(new Prisma.Decimal(purchase.quantity).times(purchase.costPrice));
  }, new Prisma.Decimal(0));

  const saldo = totalEntradas.minus(totalSaidas);

  return {
    totalEntradas,
    totalSaidas,
    saldo,
  };
}

async function getDetailedOrdersReport(from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: [OrderStatus.CLOSED, OrderStatus.PAID] },
      updatedAt: { gte: from, lte: to },
    },
    include: {
      items: {
        include: {
          product: {
            select: { name: true },
          },
        },
      },
      payments: true,
    },
    orderBy: {
      updatedAt: "asc",
    },
  });

  return orders.map((order) => {
    const paymentMethod = order.payments[0]?.paymentMethod || null;
    let mappedPaymentMethod = "other";

    if (paymentMethod === "CREDIT") mappedPaymentMethod = "card_credit";
    else if (paymentMethod === "DEBIT") mappedPaymentMethod = "card_debit";
    else if (paymentMethod === "CASH") mappedPaymentMethod = "cash";
    else if (paymentMethod === "PIX") mappedPaymentMethod = "pix";

    return {
      id: order.id,
      tableId: order.tableId,
      status: "closed",
      openTime: order.createdAt.toISOString(),
      closeTime: order.closedAt?.toISOString() || order.updatedAt.toISOString(),
      subtotal: Prisma.Decimal.sub(order.total || new Prisma.Decimal(0), order.tip || new Prisma.Decimal(0)).toNumber(),
      discount: (order.discount || new Prisma.Decimal(0)).toNumber(),
      tip: (order.tip || new Prisma.Decimal(0)).toNumber(),
      total: (order.total || new Prisma.Decimal(0)).toNumber(),
      paymentMethod: mappedPaymentMethod,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.product.name,
        quantity: item.quantity,
        price: Number(item.unitPrice),
        isCourtesy: item.isCourtesy,
      })),
    };
  });
}
