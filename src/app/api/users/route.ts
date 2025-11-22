// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./../../../lib/prisma";
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


export async function GET(request: NextRequest) {
  try {
    await getAuthManager(request);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(users);

  } catch (error: any) {
    if (error.message.includes("autorizado") || error.message.includes("Token")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    await getAuthManager(request);

    const body = await request.json();
    const { name, username, password, role } = body;

    if (!name || !username || !password || !role) {
      return NextResponse.json({ message: "Nome, username, senha e cargo são obrigatórios." }, { status: 400 });
    }

    if (!Object.values(UserRole).includes(role)) {
       return NextResponse.json({ message: "Cargo inválido." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ message: "Este username já está em uso." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: role as UserRole
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true
      }
    });

    return NextResponse.json(newUser, { status: 201 });

  } catch (error: any) {
    if (error.message.includes("autorizado") || error.message.includes("Token")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}