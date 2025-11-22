import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "@prisma/client";
import { getAuth } from "../api/authUtils";

export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const products = await prisma.product.findMany({
      include: {
        stockEntries: true, 
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json({ message: "Erro ao buscar produtos.", error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  console.log("User role:", auth.user);
  if (auth.user.role !== 'MANAGER') {
    return NextResponse.json({ message: 'Acesso negado. Somente gerentes podem criar produtos.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, description, sellingPrice, unitOfMeasure, minStockLevel } = body;

    if (!name || !sellingPrice || !unitOfMeasure) {
      return NextResponse.json({ message: 'Campos obrigatórios (name, sellingPrice, unitOfMeasure) não foram preenchidos.' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        sellingPrice: new Prisma.Decimal(sellingPrice), 
        unitOfMeasure,
        minStockLevel: minStockLevel ? parseInt(minStockLevel) : undefined,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = (error.meta?.target as string[]) || ["campo"];
        return NextResponse.json(
          { message: `Já existe um produto com este ${target.join(', ')}.` },
          { status: 409 }
        );
      }
    }
    console.error("Erro ao criar produto:", error);
    return NextResponse.json({ message: 'Erro ao criar produto.', error }, { status: 500 });
  }
}