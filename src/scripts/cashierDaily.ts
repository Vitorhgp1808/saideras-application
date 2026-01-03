// src/scripts/cashierDaily.ts
import { prisma } from "../lib/prisma";

async function openCashiersForAllUsers() {
  const users = await prisma.user.findMany()
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const user of users) {
    const hasOpenCashier = await prisma.cashier.findFirst({
      where: {
        openedById: user.id,
        openingDate: { gte: today },
        closingDate: null,
      },
    });
    if (!hasOpenCashier) {
      await prisma.cashier.create({
        data: {
          openedById: user.id,
          openingDate: new Date(),
          initialAmount: 0,

        },
      });
    }
  }
}

async function closeAllOpenCashiers() {
  const now = new Date();
  await prisma.cashier.updateMany({
    where: { closingDate: null },
    data: { closingDate: now },
  });
}

export async function runDailyCashierRoutine() {
  await openCashiersForAllUsers();
  // Para fechar, chame closeAllOpenCashiers() no final do dia
}

// Para agendar, use node-cron ou agendador externo
// Exemplo de execução manual:
if (require.main === module) {
  const arg = process.argv[2];
  if (arg === "fechar") {
    closeAllOpenCashiers().then(() => {
      console.log("Todos os caixas abertos foram fechados.");
      process.exit(0);
    });
  } else {
    runDailyCashierRoutine().then(() => {
      console.log("Rotina de abertura de caixa executada.");
      process.exit(0);
    });
  }
}

