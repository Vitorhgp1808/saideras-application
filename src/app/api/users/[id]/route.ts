// app/api/users/[id]/route.ts
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
    if (decoded.role !== UserRole.MANAGER) {
      throw new Error("Acesso não autorizado. Apenas Gerentes.");
    }
    return decoded;
  } catch (error) {
    throw new Error("Token inválido ou expirado.");
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getAuthManager(request);
    const { id } = params;

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

  } catch (error: any) {
    if (error.message.includes("autorizado")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}


export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getAuthManager(request);
    const { id } = params;
    const body = await request.json();
    const { name, username, role, password } = body;

    const updateData: any = { name, username, role };

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

  } catch (error: any) {
    if (error.message.includes("autorizado")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getAuthManager(request);
    const { id } = params;

    await prisma.user.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    if (error.message.includes("autorizado")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    if ((error as any).code === 'P2003') {
       return NextResponse.json(
        { message: "Não é possível deletar este usuário. Ele possui comandas ou outros registros associados." },
        { status: 409 }
      );
    }
    console.error("Erro ao deletar usuário:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}