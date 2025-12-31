import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma'; // Ajuste o import conforme seu projeto

export async function GET() {
  const marmitas = await prisma.product.findMany({
    where: { isComposite: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(marmitas);
}

export async function POST(req: Request) {
  const data = await req.json();

  try {
    const marmita = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        sellingPrice: data.sellingPrice,
        isComposite: true,
        unitOfMeasure: data.unitOfMeasure,
        category: "PACKED_LUNCH",
        active: data.active,
        imageUrl: data.imageUrl || null,
      },
    });
    return NextResponse.json(marmita);
  } catch (error: any) {
    // Tratamento para nome duplicado (Unique Constraint)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Já existe uma marmita com este nome." },
        { status: 409 } // 409 Conflict
      );
    }
    
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar marmita." },
      { status: 500 }
    );
  }
}