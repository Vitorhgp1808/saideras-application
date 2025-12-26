/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lista todos os produtos
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de produtos retornada com sucesso
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Cria um novo produto
 *     tags: [Products]
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
 *               imageUrl:
 *                 type: string
 *                 description: URL da imagem do produto (opcional)
 *               sellingPrice:
 *                 type: number
 *               unitOfMeasure:
 *                 type: string
 *               minStockLevel:
 *                 type: number
 *               category:
 *                 type: string
 *                 enum:
 *                   - FOOD
 *                   - DRINK
 *                   - CLEANING
 *                   - OTHER
 *                   - CHOPP
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *       400:
 *         description: Dados inválidos ou campos obrigatórios ausentes
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (somente ADMIN)
 *       409:
 *         description: Já existe um produto com esse nome ou campo único
 *       500:
 *         description: Erro interno do servidor
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { Prisma, ProductCategory } from "@prisma/client";
import { getAuth } from "../api/authUtils"; // Ajuste o caminho conforme sua estrutura

export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' }
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

  if (auth.user.role !== "ADMIN") {
    return NextResponse.json(
      { message: "Acesso negado. Somente gerentes podem criar produtos." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { name, description, sellingPrice, unitOfMeasure, minStockLevel, category, imageUrl } = body;

    if (!name || !sellingPrice || !unitOfMeasure || !category) {
      return NextResponse.json({ message: 'Campos obrigatórios (name, sellingPrice, unitOfMeasure, category) não foram preenchidos.' }, { status: 400 });
    }

    // Validação da categoria
    let validCategory: ProductCategory = ProductCategory.OTHER;
    if (Object.values(ProductCategory).includes(category as ProductCategory)) {
      validCategory = category as ProductCategory;
    } else {
      console.warn(`Categoria '${category}' não reconhecida. Usando 'OTHER'.`);
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        imageUrl, 
        sellingPrice: new Prisma.Decimal(sellingPrice),
        unitOfMeasure,
        category: validCategory,
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