import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "./../../../../../lib/prisma";
import { getAuth } from "<saidera>/app/api/api/authUtils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["GARCOM", "MANAGER"].includes(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orderId = params.id;
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
      const stock = await tx.stock.findUnique({
        where: { productId },
      });

      if (!stock || stock.quantityCurrent < quantity) {
        throw new Error("Insufficient stock");
      }

      await tx.stock.update({
        where: { productId },
        data: { quantityCurrent: { decrement: quantity } },
      });

      await tx.orderItem.create({
        data: {
          orderId,
          productId,
          quantity,
          unitPrice: product.sellingPrice,
        },
      });

      const orderItems = await tx.orderItem.findMany({
        where: { orderId },
      });

      const total = orderItems.reduce(
        (acc, item) => acc + item.quantity * item.unitPrice.toNumber(),
        0
      );

      const finalOrder = await tx.order.update({
        where: { id: orderId },
        data: { total },
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
