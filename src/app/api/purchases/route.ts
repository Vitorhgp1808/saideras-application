import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const purchaseSchema = z.object({
  productId: z.string().cuid(),
  supplierId: z.string().cuid(),
  quantity: z.number().positive(),
  costPrice: z.number().positive(),
});

export async function POST(request: NextRequest) {
  const userRole = request.headers.get('X-User-Role');

  if (userRole !== 'MANAGER') {
    return NextResponse.json({ message: 'Acesso negado. Somente gerentes podem registrar compras.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = purchaseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Dados de entrada inválidos.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { productId, supplierId, quantity, costPrice } = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      const newPurchase = await tx.purchase.create({
        data: {
          productId,
          supplierId,
          quantity,
          costPrice,
        },
      });

      const existingStock = await tx.stock.findUnique({
        where: {
          productId: productId,
        },
      });

      if (existingStock) {
        await tx.stock.update({
          where: {
            id: existingStock.id,
          },
          data: {
            quantityCurrent: {
              increment: quantity,
            },
          },
        });
      } else {
        await tx.stock.create({
          data: {
            productId: productId,
            quantityCurrent: quantity,
          },
        });
      }

      return newPurchase;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          { message: `Falha na restrição de chave estrangeira: ${error.meta?.field_name}` },
          { status: 400 }
        );
      }
    }
    return NextResponse.json({ message: 'Erro ao registrar compra.', error }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
    const userRole = request.headers.get('X-User-Role');

    if (userRole !== 'MANAGER') {
        return NextResponse.json({ message: 'Acesso negado. Somente gerentes podem visualizar as compras.' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const supplierId = searchParams.get('supplierId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const where: Prisma.PurchaseWhereInput = {};

        if (productId) {
            where.productId = productId;
        }

    if (supplierId) {
        where.supplierId = supplierId;
    }

    if (startDate || endDate) {
        const dateFilter: Prisma.DateTimeFilter = {};
        if (startDate) {
            dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
            const nextDay = new Date(endDate);
            nextDay.setDate(nextDay.getDate() + 1);
            dateFilter.lt = nextDay;
        }
        where.purchaseDate = dateFilter;
    }

    const purchases = await prisma.purchase.findMany({
            where,
            include: {
                product: true,
                supplier: true,
            },
            orderBy: {
                purchaseDate: 'desc',
            }
        });

        return NextResponse.json(purchases);
    } catch (error) {
        return NextResponse.json({ message: 'Erro ao buscar compras.', error }, { status: 500 });
    }
}