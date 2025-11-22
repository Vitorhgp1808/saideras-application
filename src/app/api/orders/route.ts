import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import type { OrderStatus } from "@prisma/client";
import { getAuth } from "../api/authUtils";
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["GARCOM", "MANAGER"].includes(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden: Apenas GARCOM ou MANAGER" }, { status: 403 });
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
        table,
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

export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    const orders = await prisma.order.findMany({
      where: {
        status: status ? { equals: status as OrderStatus } : undefined,
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true }
            }
          }
        },
        waiter: {
          select: { id: true, name: true }
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

        const ordersWithTotal = orders.map(order => {
          const itemsTotal = order.items.reduce<number>((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
          const total = itemsTotal + Number(order.tip || 0);
          
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