import GenericItemPage from "./GenericItemPage";

export default function FerramentasConsumo() {
  return (
    <GenericItemPage
      pageTitle="Ferramentas de Consumo"
      pageSubtitle="Gerenciamento de ferramentas de consumo"
      itemTable="ferramentas_consumo"
      entregaTable="ferramentas_consumo_entregas"
      entregaTitle="Imprimir Entrega de Ferramentas de Consumo"
      devolucaoTitle="Devolução de Ferramentas de Consumo"
      pdfEntregaTitle="FICHA DE ENTREGA DE FERRAMENTAS DE CONSUMO"
      pdfDevolucaoTitle="FICHA DE DEVOLUÇÃO DE FERRAMENTAS DE CONSUMO"
      pdfEntregaFilename="entrega_ferramentas_consumo"
      pdfDevolucaoFilename="devolucao_ferramentas_consumo"
    />
  );
}
