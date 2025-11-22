// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, Fragment } from "react";
import { jwtDecode } from "jwt-decode";

type TokenPayload = {
  id: string;
  role: 'MANAGER' | 'CAIXA' | 'GARCOM';
  iat: number;
  exp: number;
};
type NavItem = {
  href: string;
  label: string;
  roles: Array<TokenPayload['role']>;
};

const navItems: NavItem[] = [
  { href: "/pdv", label: "PDV (Comandas)", roles: ['GARCOM', 'CAIXA', 'MANAGER'] },
  { href: "/estoque", label: "Estoque", roles: ['MANAGER'] },
  { href: "/compras", label: "Compras", roles: ['MANAGER'] },
  { href: "/fornecedores", label: "Fornecedores", roles: ['MANAGER'] },
  { href: "/relatorios", label: "Relatórios", roles: ['MANAGER'] },
  { href: "/usuarios", label: "Usuários", roles: ['MANAGER'] },
];

type SidebarProps = {
  isOpen: boolean;
};

export default function Sidebar({ isOpen }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname(); 
  const [userRole, setUserRole] = useState<TokenPayload['role'] | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/");
  };
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        setUserRole(decoded.role);
      } catch (error) { console.error("Token inválido:", error); handleLogout(); }
    } else { router.push("/"); }
  }, [router]);

  const renderLinks = () => {
    if (!userRole) {
      return <p className="p-5 text-center text-gray-500">Carregando...</p>;
    }
    const accessibleLinks = navItems.filter(item => item.roles.includes(userRole));
    const managerOnlyIndex = accessibleLinks.findIndex(
      item => item.roles.length === 1 && item.roles[0] === 'MANAGER'
    );

    return (
      <nav className="flex flex-col gap-2">
        {accessibleLinks.map((link, index) => {
          const isActive = pathname === link.href;
          const linkClasses = `
            px-4 py-3 rounded-md text-base text-gray-300 no-underline
            transition-colors duration-200 ease-in-out
            hover:bg-gray-700 hover:text-white
            ${isActive ? 'bg-gray-700 text-white font-medium' : ''}
          `;

          return (
            <Fragment key={link.href}>
              {index === managerOnlyIndex && userRole === 'MANAGER' && (
                <hr className="my-2.5 border-none border-t border-gray-700" />
              )}
              <Link href={link.href} className={linkClasses.trim()}>
                {link.label}
              </Link>
            </Fragment>
          );
        })}
      </nav>
    );
  };

  const sidebarClasses = `
    h-full bg-gray-800 text-white flex flex-col box-border
    border-r border-gray-700 flex-shrink-0 whitespace-nowrap
    transition-all duration-300 ease-in-out
    ${isOpen ? 'w-60 p-5' : 'w-0 p-0'}
  `;

  return (
    <aside className={sidebarClasses.trim()} style={{ overflow: 'hidden' }}>
      <div className="overflow-hidden">
        {renderLinks()}
      </div>
    </aside>
  );
}