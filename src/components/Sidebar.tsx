"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react"; // Mantenha apenas esta linha
import { useRef } from "react";
import useSWR from "swr";
import { jwtDecode } from "jwt-decode";
// Combinei seus ícones do lucide-react em um único import para ficar mais limpo
import { 
  LayoutDashboard,
   LogOut, Sun, Moon, ChevronLeft, ChevronRight , Gauge,
  ChefHat,
  Utensils,
  Boxes,
  ShoppingCart,
  BarChart3,
  Users,
  Beer,
  Truck,
  Receipt
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Toast } from './ui/Toast';
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
  { href: "/dashboard", label: "Dashboard", icon: <Gauge size={20} />, roles: ['ADMIN'] },
  { href: "/pdv", label: "Comandas", icon: <Receipt size={20} />, roles: ['WAITER', 'CASHIER', 'ADMIN'] },
  { href: "/cozinha/marmitas", label: "Cozinha", icon: <ChefHat size={20} />, roles: ['ADMIN', 'CASHIER', 'WAITER'] },
  { href: "/marmitas", label: "Delivery", icon: <Utensils size={20} />, roles: ['ADMIN', 'CASHIER', 'WAITER'] },
  { href: "/estoque", label: "Estoque", icon: <Boxes size={20} />, roles: ['ADMIN'] },
  { href: "/compras", label: "Compras", icon: <ShoppingCart size={20} />, roles: ['ADMIN'] },
  { href: "/relatorios", label: "Relatórios", icon: <BarChart3 size={20} />, roles: ['ADMIN'] },
  { href: "/usuarios", label: "Usuários", icon: <Users size={20} />, roles: ['ADMIN'] },
];
type SidebarProps = {
  isOpen: boolean;
  onToggle?: () => void;
};

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  // Detecta se está em mobile
  const [isMobile, setIsMobile] = useState(false);
  // Toast de erro
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMsg(null), 4000);
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
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
          showToast("Erro na sessão do usuário, efetuando logout: " + (userSessionError.message || userSessionError.status));
          handleLogout();
        } else {
          showToast("Erro na sessão do usuário, mas não efetuando logout (status diferente de 401/403/404): " + (userSessionError.message || userSessionError.status));
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
      showToast("Erro ao decodificar token");
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
    fixed top-0 left-0 z-30 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col box-border
    flex-shrink-0 whitespace-nowrap transition-all duration-300 ease-in-out
    ${isMobile ? 'w-16 items-center' : isOpen ? 'w-64' : 'w-16 items-center'}
    shadow-lg
  `;

  const currentRole = userData?.role || (authToken ? (jwtDecode(authToken) as DecodedToken).role : null);
  const currentUserName = userData?.name || (authToken ? (jwtDecode(authToken) as DecodedToken).name : null);

  if (!currentRole) return null; // Não renderiza a sidebar se não houver role (não autenticado)

  return (
    <>
      {toastMsg && (
        <Toast message={toastMsg} type="error" onClose={() => setToastMsg(null)} />
      )}
      <aside className={sidebarClasses}>
      {/* Botão de minimizar/expandir só aparece se não for mobile */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-6 z-20 w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full shadow transition hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label={isOpen ? 'Minimizar sidebar' : 'Expandir sidebar'}
          tabIndex={0}
          type="button"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      )}

      <div className={`flex items-center justify-center ${isOpen && !isMobile ? 'p-6' : 'py-4 px-2'}`}>
        {isMobile ? (
          <div className="relative h-8 w-8">
            <Image
              src="/saidera-logo.png"
              alt="Saidera Logo"
              fill
              className="object-contain dark:invert rounded-full"
              priority
            />
          </div>
        ) : (
          <div className={`relative ${isOpen ? 'h-16 w-40' : 'h-10 w-10'}`}>
            <Image
              src="/saidera-logo.png"
              alt="Saidera Logo"
              fill
              className={`object-contain dark:invert transition-all duration-300 ${isOpen ? '' : 'rounded-full'}`}
              priority
            />
          </div>
        )}
      </div>

      {!isMobile && isOpen && (
        <div className="px-6 pb-6 mb-2 border-b border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Logado como</p>
          <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{currentUserName}</p>
          <span className="text-xs text-amber-500 font-medium capitalize">
            {currentRole === "ADMIN"
              ? "Gerente"
              : currentRole === "CASHIER"
              ? "Caixa"
              : "Garçom"}
          </span>
        </div>
      )}

      <nav className={`flex-1 ${isMobile ? 'px-1 py-4 space-y-2' : isOpen ? 'px-4 py-4 space-y-1' : 'px-1 py-4 space-y-2'} overflow-y-auto`}> 
        {navItems
          .filter((item) => currentRole && item.roles.includes(currentRole))
          .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center ${isMobile ? 'p-2' : isOpen ? 'flex-row gap-3 px-4 py-3' : 'justify-center p-3'} rounded-lg transition-colors font-medium ${
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title={item.label}
              >
                {item.icon}
                {(isOpen && !isMobile) && <span className="truncate">{item.label}</span>}
                {isMobile && <span className="text-xs mt-1 text-center break-anywhere">{item.label}</span>}
              </Link>
            );
          })}
      </nav>

      <div className={`border-t border-slate-200 dark:border-slate-800 space-y-2 ${isMobile ? 'p-2 flex flex-col items-center' : isOpen ? 'p-4' : 'p-2 flex flex-col items-center'}`}>
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 rounded-lg cursor-pointer transition-colors w-full ${isMobile ? 'justify-center p-3' : isOpen ? 'px-4 py-3' : 'justify-center p-3'} text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800`}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          {(!isMobile && isOpen) && <span className="font-medium">{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>}
          {isMobile && <span className="text-xs mt-1">{theme === "dark" ? "Claro" : "Escuro"}</span>}
        </button>

        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 rounded-lg cursor-pointer transition-colors w-full ${isMobile ? 'justify-center p-3' : isOpen ? 'px-4 py-3' : 'justify-center p-3'} text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800`}
        >
          <LogOut size={20} />
          {(!isMobile && isOpen) && <span className="font-medium">Sair</span>}
          {isMobile && <span className="text-xs mt-1">Sair</span>}
        </button>
      </div>
    </aside>
    </>
  );
}