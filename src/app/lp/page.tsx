import Link from "next/link";
import Image from "next/image";
export default function LoginPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center p-6 bg-cover bg-center text-white"
      style={{
        backgroundImage: `
          linear-gradient(180deg, rgba(15,23,42,0.75), rgba(8,12,20,0.75)),
          url('/saidera-gelo.png')
        `,
      }}
    >
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <section className="px-6 py-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center shadow-lg">
              <Image
                src="/saidera-logo.png"
                alt="Saídera logo"
                className=" rounded-full object-cover"
                width={300}
                height={300}
              />
            </div>
            <div>
              <h2 className="text-xs uppercase tracking-widest text-zinc-300">
                Saidera
              </h2>
              <p className="text-sm text-zinc-400">
                Gestão de chopp e atendimento
              </p>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Bem-vindo ao Sistema de gestão do Saídera — qualidade, controle e
            velocidade
          </h1>

          <p className="text-zinc-300 text-lg mb-8 max-w-xl">
            Simplifique a operação do bar: monitore estoque, acompanhe vendas em
            tempo real e mantenha o chopp sempre perfeito.
          </p>

          <div className="flex flex-wrap gap-3 items-center">
            <Link
              href="/pdv"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-600 to-yellow-500 text-zinc-900 font-semibold px-6 py-3 rounded-lg shadow-lg transform hover:scale-[1.02] transition"
              aria-label="Acessar painel de gestão (login)"
            >
              Acessar Painel
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M5 12h14M13 5l6 7-6 7"
                  stroke="#111827"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          <p className="text-sm text-zinc-400 mt-6">
            Acesso restrito a colaboradores — mantenha suas credenciais em
            segurança.
          </p>

          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <li className="bg-white/6 backdrop-blur-sm rounded-lg p-3 text-sm">
              <strong className="block text-white">Controle de estoque</strong>
              <span className="text-zinc-300">Evite desperdício</span>
            </li>
            <li className="bg-white/6 backdrop-blur-sm rounded-lg p-3 text-sm">
              <strong className="block text-white">Relatórios rápidos</strong>
              <span className="text-zinc-300">Decisões informadas</span>
            </li>
            <li className="bg-white/6 backdrop-blur-sm rounded-lg p-3 text-sm">
              <strong className="block text-white">Atendimento ágil</strong>
              <span className="text-zinc-300">Fila mais rápida</span>
            </li>
          </ul>
        </section>

        <aside className="px-6 py-8 flex items-center justify-center">
          <div className="w-full max-w-md bg-gradient-to-b from-black/40 to-white/5 border border-white/6 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-zinc-300">Controle de vendas</p>
                <h3 className="text-2xl font-bold">Em tempo real</h3>
              </div>
            </div>

            <div className="h-40 rounded-lg overflow-hidden bg-gradient-to-tr from-yellow-500/20 to-transparent border border-white/4 flex items-center justify-center">
              <svg
                width="120"
                height="60"
                viewBox="0 0 120 60"
                fill="none"
                aria-hidden
              >
                <path
                  d="M0 45 L20 20 L40 30 L60 10 L80 25 L100 15 L120 35"
                  stroke="white"
                  strokeOpacity="0.9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="60" cy="10" r="3.5" fill="#F59E0B" />
              </svg>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Última atualização: 2m
              </span>
              <Link
                href="/pdv"
                className="text-sm text-amber-600 hover:underline"
              >
                Ir ao painel →
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <footer className="absolute bottom-6 left-0 right-0 flex justify-center text-xs text-zinc-400">
        <span>
          © {new Date().getFullYear()} Saídera — Desenvolvido para bares e
          eventos
        </span>
      </footer>
    </main>
  );
}
