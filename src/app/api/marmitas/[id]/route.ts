export async function PATCH(req: Request, context: RouteContext) {
  const params = await context.params;
  const id = params.id;
  const data = await req.json();
  try {
    const marmita = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
        ...(data.unitOfMeasure !== undefined && { unitOfMeasure: data.unitOfMeasure }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      },
    });
    return NextResponse.json(marmita);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar marmita" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma'; // Ajuste o import conforme seu projeto

type RouteContext = {
  params: Promise<{ id: string }>
};

export async function PUT(req: Request, context: RouteContext) {
  // 1. AWAIT OBRIGATÓRIO
  const params = await context.params;
  const id = params.id;

  const data = await req.json();

  try {
    const marmita = await prisma.product.update({
      where: { id: id },
      data: {
        name: data.name,
        description: data.description,
        sellingPrice: data.sellingPrice,
        unitOfMeasure: data.unitOfMeasure,
        active: data.active,
        imageUrl: data.imageUrl || null,
      },
    });
    return NextResponse.json(marmita);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar marmita" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  // 1. AWAIT OBRIGATÓRIO
  const params = await context.params;
  const id = params.id;

  try {
    await prisma.product.delete({ where: { id: id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar marmita" }, { status: 500 });
  }
}