export async function PATCH(request: NextRequest, { params }: Params) {
  const userRole = request.headers.get("X-User-Role");
  if (userRole !== "ADMIN") {
    return NextResponse.json(
      { message: "Acesso negado. Somente gerentes podem atualizar produtos." },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const body = await request.json();
    // Monta objeto de atualização apenas com campos enviados
    type UpdateProductData = {
      name?: string;
      description?: string;
      sellingPrice?: Prisma.Decimal;
      unitOfMeasure?: string;
      minStockLevel?: number;
      category?: string;
      imageUrl?: string;
      active?: boolean;
    };
    const updateData: UpdateProductData = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.sellingPrice !== undefined) updateData.sellingPrice = new Prisma.Decimal(body.sellingPrice);
    if (body.unitOfMeasure !== undefined) updateData.unitOfMeasure = body.unitOfMeasure;
    if (body.minStockLevel !== undefined) updateData.minStockLevel = body.minStockLevel;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.active !== undefined) updateData.active = body.active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "Nenhum campo para atualizar." },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(updatedProduct);
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Produto não encontrado." },
          { status: 404 }
        );
      }
      if (error.code === "P2002") {
        const target = (error.meta as { target?: string[] })?.target?.join(
          ", "
        );
        return NextResponse.json(
          { message: `Já existe um produto com este ${target}.` },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      { message: "Erro ao atualizar produto.", error },
      { status: 500 }
    );
  }
}
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Busca um produto pelo ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto encontrado com sucesso
 *       404:
 *         description: Produto não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Atualiza um produto pelo ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sellingPrice
 *               - unitOfMeasure
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               sellingPrice:
 *                 type: number
 *               unitOfMeasure:
 *                 type: string
 *               minStockLevel:
 *                 type: number
 *               category:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 description: URL pública da imagem do produto
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado (somente ADMIN)
 *       404:
 *         description: Produto não encontrado
 *       409:
 *         description: Conflito de dados (campo único duplicado)
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Remove um produto pelo ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Produto deletado com sucesso
 *       403:
 *         description: Acesso negado (somente ADMIN)
 *       404:
 *         description: Produto não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      return NextResponse.json(
        { message: "Produto não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar produto.", error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const userRole = request.headers.get("X-User-Role");
  if (userRole !== "ADMIN") {
    return NextResponse.json(
      { message: "Acesso negado. Somente gerentes podem atualizar produtos." },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const {
      name,
      description,
      sellingPrice,
      unitOfMeasure,
      minStockLevel,
      category,
      imageUrl,
      stock,
    } = body;

    if (!name || !sellingPrice || !unitOfMeasure || !category) {
      return NextResponse.json(
        {
          message:
            "Campos obrigatórios (name, sellingPrice, unitOfMeasure, category) não foram preenchidos.",
        },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        sellingPrice: new Prisma.Decimal(sellingPrice),
        unitOfMeasure,
        category,
        minStockLevel,
        imageUrl,
        stock,
      },
    });
    return NextResponse.json(updatedProduct);
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Produto não encontrado." },
          { status: 404 }
        );
      }
      if (error.code === "P2002") {
        const target = (error.meta as { target?: string[] })?.target?.join(
          ", "
        );
        return NextResponse.json(
          { message: `Já existe um produto com este ${target}.` },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      { message: "Erro ao atualizar produto.", error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const userRole = request.headers.get("X-User-Role");
  if (userRole !== "ADMIN") {
    return NextResponse.json(
      { message: "Acesso negado. Somente gerentes podem deletar produtos." },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    await prisma.product.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Produto não encontrado." },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { message: "Erro ao deletar produto.", error },
      { status: 500 }
    );
  }
}