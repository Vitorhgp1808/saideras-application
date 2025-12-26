// components/Sidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import useSWR from "swr"; // Import useSWR
import { jwtDecode } from "jwt-decode";
import { Beer, LayoutDashboard, ShoppingCart, Truck, BarChart3, Users, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { fetcher } from "../lib/fetcher";
import { CustomError } from "../types/error";

// Interfaces para decodificar o token e dados do usuário
interface DecodedToken {
  id: string;
  role: "ADMIN" | "CASHIER" | "WAITER";
  name: string;
  exp: number;
}

interface UserData {
  id: string;
  role: "ADMIN" | "CASHIER" | "WAITER";
  name: string;
  username: string;
}

type TokenPayload = {
  id: string;
  name: string;
  role: "ADMIN" | "CASHIER" | "WAITER";
  iat: number;
  exp: number;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Array<TokenPayload['role']>;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} />, roles: ['ADMIN'] },
  { href: "/pdv", label: "PDV (Comandas)", icon: <Beer size={20} />, roles: ['WAITER', 'CASHIER', 'ADMIN'] },
  { href: "/estoque", label: "Estoque", icon: <ShoppingCart size={20} />, roles: ['ADMIN'] },
  { href: "/compras", label: "Compras", icon: <Truck size={20} />, roles: ['ADMIN'] },
  { href: "/relatorios", label: "Relatórios", icon: <BarChart3 size={20} />, roles: ['ADMIN'] },
  { href: "/usuarios", label: "Usuários", icon: <Users size={20} />, roles: ['ADMIN'] },
];

type SidebarProps = {
  isOpen: boolean;
};

export default function Sidebar({ isOpen }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [authToken, setAuthToken] = useState<string | null>(null); // Armazena o token
  const [isReady, setIsReady] = useState(false); // Novo estado para controlar o readiness

  // Carrega o token uma única vez ao montar o componente
  useEffect(() => {
    setAuthToken(localStorage.getItem("authToken"));
    setIsReady(true);
  }, []);

  const userId = authToken ? (jwtDecode(authToken) as DecodedToken).id : null;

  // Use useSWR para revalidar a sessão do usuário periodicamente
  const { data: userData, error: userSessionError } = useSWR<UserData, CustomError>(
    isReady && userId ? `/api/users/${userId}` : null,
    fetcher,
    {
      refreshInterval: 10000, // Revalida a cada 10 segundos
      shouldRetryOnError: false, // Não tenta novamente em caso de erro na sessão
      revalidateOnFocus: true, // Revalida ao focar na janela
    }
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("authToken");
    setAuthToken(null); // Limpa o token do estado
    router.push("/");
  }, [router]);

  useEffect(() => {
    // Só prossegue se o componente estiver pronto (token carregado)
    if (!isReady) return;

    if (!authToken) {
      // Se não há token, redireciona para a página de login
      if (pathname !== "/") {
        router.push("/");
      }
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(authToken);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        // Token expirado
        console.warn("Token expirado.");
        handleLogout();
        return;
      }

      if (userSessionError) {
        // Erro na sessão do usuário (ex: usuário não encontrado na API ou token inválido/expirado)
        // Só faz logout se o erro for 401 (Unauthorized), 403 (Forbidden) ou 404 (Not Found)
        const errorStatus = userSessionError.status;
        if ([401, 403, 404].includes(errorStatus as number)) {
          console.error("Erro na sessão do usuário, efetuando logout:", userSessionError);
          handleLogout();
        } else {
          console.warn("Erro na sessão do usuário, mas não efetuando logout (status diferente de 401/403/404):", userSessionError);
        }
        return;
      }

      if (userData) {
        // Se os dados do usuário foram carregados com sucesso pelo SWR
        // Aqui você pode fazer verificações de role e redirecionamentos se necessário
        // Por exemplo, se a página atual exige uma role que o usuário não tem
        const userRole = userData.role;
        const currentPath = pathname;

        const requiresManager = ["/dashboard", "/estoque", "/compras", "/relatorios", "/usuarios", "/fornecedores"];
        const requiresCaixaOuGarcom = ["/pdv"];

        if (requiresManager.includes(currentPath) && userRole !== 'ADMIN') {
            router.push("/pdv"); // Redireciona para PDV se não for gerente
            return;
        }

        if (requiresCaixaOuGarcom.includes(currentPath) && !['CASHIER', 'WAITER', 'ADMIN'].includes(userRole)) {
            router.push("/"); // Redireciona para login se não for caixa, garçom ou gerente
            return;
        }

        // Se tudo OK e já está em uma rota de dashboard/pdv, não faz nada
        // Se estiver na página de login e tiver token válido, redireciona para o dashboard
        if (pathname === "/" && authToken) {
            router.push("/pdv"); // ou "/dashboard" dependendo da rota padrão
            return;
        }
      }

    } catch (error) {
      // Erro ao decodificar o token
      console.error("Erro ao decodificar token:", error);
      handleLogout();
    }
  }, [router, pathname, authToken, userData, userSessionError, isReady, handleLogout]);

  // Exibe um loading enquanto a sessão não é verificada
  if (!isReady || (authToken && !userData && !userSessionError)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Se não há token e não está na página de login, esconde a Sidebar
  if (!authToken && pathname !== "/") {
    return null;
  }

  const sidebarClasses = `
    h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col box-border
    flex-shrink-0 whitespace-nowrap transition-all duration-300 ease-in-out
    ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}
  `;

  const currentRole = userData?.role || (authToken ? (jwtDecode(authToken) as DecodedToken).role : null);
  const currentUserName = userData?.name || (authToken ? (jwtDecode(authToken) as DecodedToken).name : null);

  if (!currentRole) return null; // Não renderiza a sidebar se não houver role (não autenticado)

  return (
    <aside className={sidebarClasses}>
      <div className="p-6 flex items-center justify-center">
        <div className="relative h-16 w-40">
          <Image
            src="/saidera-logo.png"
            alt="Saidera Logo"
            fill
            className="object-contain dark:invert"
            priority
          />
        </div>
      </div>

      <div className="px-6 pb-6 mb-2 border-b border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
          Logado como
        </p>
        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
          {currentUserName}
        </p>
        <span className="text-xs text-amber-500 font-medium capitalize">
          {currentRole === "ADMIN"
            ? "Gerente"
            : currentRole === "CASHIER"
            ? "Caixa"
            : "Garçom"}
        </span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => currentRole && item.roles.includes(currentRole))
          .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          <span className="font-medium">
            {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}