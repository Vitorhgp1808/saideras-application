"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

type TokenPayload = {
  id: string;
  name: string;
  role: "ADMIN" | "CASHIER" | "WAITER";
  iat: number;
  exp: number;
};

type NavbarProps = {
  onToggleSidebar: () => void;
};

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("authToken");
    router.push("/");
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        setUserName(decoded.name);
        setUserRole(decoded.role);
      } catch (error) {
        console.error("Token inválido:", error);
        handleLogout();
      }
    } else {
      router.push("/");
    }
  }, [router, handleLogout]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const getInitials = (name: string | null): string => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].substring(0, 1).toUpperCase();
    return (
      parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)
    ).toUpperCase();
  };

  const getRoleDisplayName = (role: string | null) => {
    switch (role) {
      case "ADMIN":
        return "Gerente";
      case "CASHIER":
        return "Caixa";
      case "WAITER":
        return "Garçom";
      default:
        return "Usuário";
    }
  };

  return (
    <header className="w-full h-[60px] px-5 flex items-center justify-between bg-gray-800 border-b border-gray-700 box-border text-gray-200 flex-shrink-0">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="bg-transparent border-none cursor-pointer p-2.5 rounded-lg transition-colors duration-200 ease-in-out hover:bg-gray-700"
          aria-label="Toggle sidebar"
        >
          <span className="block w-[22px] h-[2px] bg-gray-200 my-1 rounded-[1px]"></span>
          <span className="block w-[22px] h-[2px] bg-gray-200 my-1 rounded-[1px]"></span>
          <span className="block w-[22px] h-[2px] bg-gray-200 my-1 rounded-[1px]"></span>
        </button>
        <h1 className="text-[19px] font-semibold text-gray-200 ml-3 whitespace-nowrap">
          Gestão Choperia
        </h1>
      </div>

      <div className="relative inline-block" ref={menuRef}>
        <button
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="flex items-center bg-transparent border-none rounded-lg p-1 cursor-pointer transition-colors duration-200 ease-in-out hover:bg-gray-700"
          aria-haspopup="true"
          aria-expanded={isDropdownOpen}
          aria-controls="profile-menu-id"
        >
          <div className="w-9 h-9 rounded-full bg-gray-600 text-white text-[15px] font-semibold flex items-center justify-center overflow-hidden flex-shrink-0">
            {getInitials(userName)}
          </div>
          <div className="flex flex-col ml-3 text-left leading-tight">
            <span className="text-[15px] font-semibold text-gray-200 whitespace-nowrap">
              {userName || "Usuário"}
            </span>
            <span className="text-[13px] text-gray-400 whitespace-nowrap">
              {getRoleDisplayName(userRole)}
            </span>
          </div>
        </button>

        {isDropdownOpen && (
          <div
            className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
            id="profile-menu-id"
            role="menu"
          >
            <div className="py-1" role="none">
              <button
                onClick={() => {
                  const token = localStorage.getItem("authToken");
                  if (!token) {
                    router.push("/");
                    return;
                  }
                  try {
                    const decoded = jwtDecode<{ id: string }>(token);
                    const userId = decoded.id;
                    setIsDropdownOpen(false);
                    router.push(`/usuarios/${userId}`);
                  } catch (error) {
                    console.error("Erro ao decodificar token:", error);
                    router.push("/");
                  }
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors duration-200 ease-in-out hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
              >
                Ver usuário
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-700 transition-colors duration-200 ease-in-out hover:bg-red-50 hover:text-red-800"
                role="menuitem"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
