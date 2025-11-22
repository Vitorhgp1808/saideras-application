import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      return NextResponse.json({ message: 'Produto não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar produto.', error }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const userRole = request.headers.get('X-User-Role');
  if (userRole !== 'MANAGER') {
    return NextResponse.json({ message: 'Acesso negado. Somente gerentes podem atualizar produtos.' }, { status: 403 });
  }

  const { id } = params;
  try {
    const body = await request.json();
    const { name, description, sellingPrice, unitOfMeasure, minStockLevel } = body;

    if (!name || !sellingPrice || !unitOfMeasure) {
      return NextResponse.json({ message: 'Campos obrigatórios (name, sellingPrice, unitOfMeasure) não foram preenchidos.' }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        sellingPrice,
        unitOfMeasure,
        minStockLevel,
      },
    });
    return NextResponse.json(updatedProduct);
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ message: 'Produto não encontrado.' }, { status: 404 });
      }
      if (error.code === 'P2002') {
        const target = (error.meta as { target?: string[] })?.target?.join(', ');
        return NextResponse.json({ message: `Já existe um produto com este ${target}.` }, { status: 409 });
      }
    }
    return NextResponse.json({ message: 'Erro ao atualizar produto.', error }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const userRole = request.headers.get('X-User-Role');
  if (userRole !== 'MANAGER') {
    return NextResponse.json({ message: 'Acesso negado. Somente gerentes podem deletar produtos.' }, { status: 403 });
  }

  const { id } = params;
  try {
    await prisma.product.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ message: 'Produto não encontrado.' }, { status: 404 });
      }
    }
    return NextResponse.json({ message: 'Erro ao deletar produto.', error }, { status: 500 });
  }
}