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
    <Stack direction="row" sx={{ minHeight: "100vh" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: { xs: "100%", md: "50%" },
          bgcolor: "grey.200",
          px: { xs: 2, sm: 4, md: 10 },
          py: 8,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              bgcolor: "transparent",
            }}
          >
            <Box sx={{ mb: 4 }}>
              <Image
                src="/saidera-logo.png"
                alt="Logo Saideira"
                width={400}
                height={400}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    "https://placehold.co/80x80/f97316/ffffff?text=Logo";
                  target.onerror = null;
                }}
              />
            </Box>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ width: "100%" }}
            >
              <Stack spacing={2}>
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
              </Stack>
            </Box>
          </Paper>
        </Container>
      </Box>

      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: "50%",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundImage: "url(saidera-copos.png)",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(120, 53, 15, 0.4)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            pb: 16,
          }}
        >
          <Typography
            component="h2"
            align="center"
            sx={{
              px: { xs: 2, sm: 6 },
              fontSize: {
                xs: "2.25rem",
                md: "3rem",
                lg: "3.75rem",
              },
              fontWeight: "900",
              fontStyle: "italic",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              textShadow:
                "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)",
              transform: "translateY(1rem)",
            }}
          >
            <Box
              component="span"
              sx={{
                background:
                  "linear-gradient(to right, #FDE68A, #FEF3C7, #FFFFFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              “O melhor chope é o da Saideira ”
            </Box>
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}
