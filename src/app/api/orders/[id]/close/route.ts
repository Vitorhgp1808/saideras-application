import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from "../../../../../lib/prisma";
import { getAuth } from "<saidera>/app/api/api/authUtils";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["CAIXA", "MANAGER"].includes(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orderId = params.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Order cannot be closed' },
        { status: 409 }
      );
    }

    const closedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    return NextResponse.json(closedOrder);
  } catch (error) {
    console.error(`Error closing order ${orderId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}