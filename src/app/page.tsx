"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("authToken", data.token);
      window.location.href = "/pdv";
    } else {
      setError(data.message || "Erro ao fazer login");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full">
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-gray-100 px-4 py-8">
        <div className="w-full max-w-sm mx-auto">
          <div className="flex flex-col items-center mb-6">
            <Image
              src="/saidera-logo.png"
              alt="Logo Saideira"
              width={180}
              height={180}
              style={{ maxWidth: '100%', height: 'auto' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://placehold.co/80x80/f97316/ffffff?text=Logo";
                target.onerror = null;
              }}
            />
          </div>
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <TextField
              required
              fullWidth
              id="username"
              label="Usuário"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{ className: 'break-anywhere' }}
            />
            <TextField
              required
              fullWidth
              name="password"
              label="Senha"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{ className: 'break-anywhere' }}
            />
            {error && (
              <Alert severity="error" sx={{ width: "100%" }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                py: 1.5,
                bgcolor: "warning.main",
                "&:hover": { bgcolor: "warning.dark" },
                transition: "transform 0.15s ease-in-out",
                "&:hover:not(:active)": {
                  transform: "scale(1.02)",
                },
              }}
            >
              Entrar
            </Button>
          </form>
        </div>
      </div>
      <div className="hidden md:flex w-1/2 relative bg-cover bg-center" style={{ backgroundImage: 'url(/saidera-copos.png)' }}>
        <div className="absolute inset-0 bg-[rgba(120,53,15,0.4)] flex items-end justify-center pb-16">
          <h2 className="px-4 sm:px-8 text-2xl md:text-3xl lg:text-5xl font-extrabold italic uppercase text-white text-center drop-shadow-lg" style={{ WebkitTextStroke: '1px #fbbf24' }}>
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-100 to-white bg-clip-text text-transparent">
              “O melhor chope é o da Saideira ”
            </span>
          </h2>
        </div>
      </div>
    </div>
  );
}
