import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";

async function getAuthManager(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token de autenticação não fornecido.");
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    if (decoded.role !== UserRole.ADMIN) {
      throw new Error("Acesso não autorizado. Apenas Gerentes.");
    }
    return decoded;
  } catch (error) {
    throw new Error("Token inválido ou expirado.");
  }
}

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Busca um usuário pelo ID
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       '200':
 *         description: Detalhes do usuário
 *       '401':
 *         description: Não autorizado
 *       '404':
 *         description: Usuário não encontrado
 *       '500':
 *         description: Erro interno do servidor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthManager(request);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
    }
    return NextResponse.json(user);

  } catch (error: unknown) {
    if (error instanceof Error && (error.message.includes("autorizado") || error.message.includes("Token"))) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}


/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Atualiza um usuário
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, CASHIER, WAITER]
 *               password:
 *                 type: string
 *                 description: "A senha é opcional. Se fornecida, será atualizada."
 *     responses:
 *       '200':
 *         description: Usuário atualizado com sucesso
 *       '401':
 *         description: Não autorizado
 *       '409':
 *         description: Username já está em uso
 *       '500':
 *         description: Erro interno do servidor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthManager(request);
    const { id } = await params;
    const body = await request.json();
    const { name, username, role, password } = body;

    const updateData: { name?: string; username?: string; role?: UserRole; password?: string } = { name, username, role };

    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: id },
        },
      });
      if (existingUser) {
        return NextResponse.json({ message: "Este username já está em uso." }, { status: 409 });
      }
    }

    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);

  } catch (error: unknown) {
    if (error instanceof Error && (error.message.includes("autorizado") || error.message.includes("Token"))) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}


/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Deleta um usuário
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       '204':
 *         description: Usuário deletado com sucesso
 *       '401':
 *         description: Não autorizado
 *       '409':
 *         description: "Não é possível deletar o usuário pois ele possui registros associados"
 *       '500':
 *         description: Erro interno do servidor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthManager(request);
    const { id } = await params;

    await prisma.user.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });

  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("autorizado")) {
        return NextResponse.json({ message: error.message }, { status: 401 });
      }
      if ('code' in error && error.code === 'P2003') { // Type guard for Prisma error code
        return NextResponse.json(
          { message: "Não é possível deletar este usuário. Ele possui comandas ou outros registros associados." },
          { status: 409 }
        );
      }
    }
    console.error("Erro ao deletar usuário:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}
