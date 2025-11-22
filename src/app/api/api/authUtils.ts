import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

interface UserPayload {
  id: string;
  role: string;
}

export async function getAuth(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return {
      user: null,
      error: NextResponse.json({ error: "Authorization header missing" }, { status: 401 }),
    };
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return {
      user: null,
      error: NextResponse.json({ error: "Bearer token missing" }, { status: 401 }),
    };
  }

  try {

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "seu-segredo-super-secreto");
    
    const { payload } = await jose.jwtVerify<UserPayload>(token, secret);

    return { user: payload, error: null };

  } catch (err) {
    console.error("JWT Verification Error:", err);
    return {
      user: null,
      error: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }
}