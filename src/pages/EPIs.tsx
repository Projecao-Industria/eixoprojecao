import GenericItemPage from "./GenericItemPage";

export default function EPIs() {
  return (
    <GenericItemPage
      pageTitle="EPIs"
      pageSubtitle="Gerenciamento de Equipamentos de Proteção Individual"
      itemTable="epis"
      entregaTable="epis_entregas"
      entregaTitle="Imprimir Entrega de EPIs"
      devolucaoTitle="Devolução de EPIs"
      pdfEntregaTitle="FICHA DE ENTREGA DE EPIs"
      pdfDevolucaoTitle="FICHA DE DEVOLUÇÃO DE EPIs"
      pdfEntregaFilename="entrega_epis"
      pdfDevolucaoFilename="devolucao_epis"
    />
  );
}
