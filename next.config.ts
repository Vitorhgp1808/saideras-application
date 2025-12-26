import type { NextConfig } from "next";
import * as pkg from "./package.json";

const nextConfig: NextConfig = {
  // 1. reactStrictMode geralmente é bom manter true, mas se quiser false ok
  reactStrictMode: false,
  
  // 2. USE 'env' AO INVÉS DE 'publicRuntimeConfig'
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },

  // 3. Mantenha os pacotes transpilados se necessário
  transpilePackages: [
    "@saidera/lib",
    "@saidera/ui",
  ],

  // 4. Configuração de imagens
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  
  // REMOVA: publicRuntimeConfig (Não existe mais)
  // REMOVA: eslint (Agora é configurado no arquivo .eslintrc.json separado)
};

export default nextConfig;