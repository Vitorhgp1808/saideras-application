// components/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      router.push("/");
    } else {
      setIsAuthenticated(true);
      
    }
  }, [router]);

  if (!isAuthenticated) {
    return <p>Carregando...</p>; 
  }

  return <>{children}</>;
}