import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getAuth } from "../../api/authUtils";

type CountResult = {
  count: number;
};

type LowStockItemResult = {
  id: string;
  name: string;
  stock: number;
  unit: string;
};

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Retorna estatísticas para o dashboard
 *     tags:
 *       - Dashboard
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Estatísticas do dashboard
 *       '401':
 *         description: Não autorizado
 *       '500':
 *         description: Erro interno do servidor
 */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user || auth.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Sales Today
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: today,
        },
        status: {
          in: ['CLOSED', 'PAID']
        }
      },
      select: {
        total: true
      }
    });

    const todaySales = todayOrders.reduce((acc, order) => acc + Number(order.total), 0);

    // 2. Active Tables
    const activeTables = await prisma.order.count({
      where: {
        status: 'OPEN'
      }
    });

    // 3. Low Stock Products
    // Prisma doesn't support comparing two columns directly in `where` easily without raw query or client-side filtering for this specific case efficiently in basic mode,
    // but we can fetch and filter or use a raw query. Let's fetch and filter for simplicity if dataset isn't huge, or raw query.
    // Raw query is better for performance.
    const lowStockProducts = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Product" p
      WHERE p.stock <= p."minStockLevel"
    `;
    
    const lowStockCount = Number((lowStockProducts as CountResult[])[0]?.count || 0);

    // 4. Total Products
    const totalProducts = await prisma.product.count();

    // 5. Sales Chart Data (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklySales = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
        status: {
          in: ['CLOSED', 'PAID']
        }
      },
      select: {
        createdAt: true,
        total: true
      }
    });

    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      const dateStr = d.toDateString();

      const salesForDay = weeklySales
        .filter(o => new Date(o.createdAt).toDateString() === dateStr)
        .reduce((acc, o) => acc + Number(o.total), 0);

      return { name: dayName.charAt(0).toUpperCase() + dayName.slice(1), vendas: salesForDay };
    });

    // 6. Low Stock Items List (Top 5)
    const lowStockItems: LowStockItemResult[] = await prisma.$queryRaw`
      SELECT p.id, p.name, p.stock, p."unitOfMeasure" as unit
      FROM "Product" p
      WHERE p.stock <= p."minStockLevel"
      LIMIT 5
    `;

    return NextResponse.json({
      todaySales,
      activeTables,
      lowStockCount,
      totalProducts,
      chartData,
      lowStockItems
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}