import { NextResponse } from "next/server";
import { prisma } from '../../../../lib/prisma';


// GET: Lista todas as marmitas pedidas e não baixadas
export async function GET() {
  // Busca todos os itens de pedido de produtos compostos (marmitas) que ainda não foram baixados
  const marmitas = await prisma.orderItem.findMany({
    where: {
      product: { isComposite: true },
      baixadoNaCozinha: false,
      order: { status: { in: ["OPEN", "CLOSED"] } },
    },
    include: {
      order: true,
      product: true,
      modifiers: {
        include: {
          modifierItem: {
            include: { modifierGroup: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Formata para o frontend
  const result = marmitas.map((item) => ({
    id: item.id,
    orderId: item.orderId,
    mesa: item.order.tableId,
    status: item.order.status,
    createdAt: item.createdAt,
    nome: item.product.name,
    descricao: item.product.description,
    tamanho: item.product.unitOfMeasure,
    observacaoPedido: item.observacaoPedido, // Adapte se houver campo de observação
    nomePedido: item.order.nomePedido,
    modificadores: groupModifiers(item.modifiers),

  }));

  return NextResponse.json(result);
}

function groupModifiers(modifiers : any[]) {
  // Agrupa por grupo de modificador
  const groups: Record<string, string[]> = {};
  for (const mod of modifiers) {
    const groupName = mod.modifierItem.modifierGroup.name;
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(mod.modifierItem.name);
  }
  return Object.entries(groups).map(([grupo, itens]) => ({ grupo, itens }));
}
