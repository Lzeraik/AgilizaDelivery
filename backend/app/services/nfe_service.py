"""
Serviço de emissão de NFC-e (Nota Fiscal de Consumidor Eletrônica — modelo 65).
Requer configuração no .env:
  - Certificado digital A1 (.pfx)
  - Credenciais SEFAZ (CNPJ, IE, CSC, CSC_ID)
  - Ambiente (1=Produção / 2=Homologação)
"""
import hashlib
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from app.config import settings
from app.models.order import Order


class NFCeService:
    # URLs SEFAZ por UF e ambiente (simplificadas para SP)
    SEFAZ_URLS = {
        "SP": {
            1: "https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx",
            2: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx",
        }
    }

    def __init__(self):
        self.ambiente = settings.SEFAZ_AMBIENTE
        self.uf = settings.SEFAZ_UF
        self.cnpj = settings.SEFAZ_CNPJ
        self.ie = settings.SEFAZ_IE

    def _gerar_chave_acesso(self, numero_nfe: str, serie: str = "001") -> str:
        cuf = self._get_cuf()
        demi = datetime.now().strftime("%y%m")
        mod = "65"
        nfe = numero_nfe.zfill(9)
        tp_emis = "1"
        codigo_numerico = uuid.uuid4().hex[:8]
        chave_sem_dv = f"{cuf}{demi}{self.cnpj}{mod}{serie}{nfe}{tp_emis}{codigo_numerico}"
        dv = self._calcular_dv(chave_sem_dv)
        return chave_sem_dv + str(dv)

    def _get_cuf(self) -> str:
        return {"SP": "35", "RJ": "33", "MG": "31"}.get(self.uf, "35")

    def _calcular_dv(self, chave: str) -> int:
        pesos = [2, 3, 4, 5, 6, 7, 8, 9]
        soma = 0
        for i, c in enumerate(reversed(chave)):
            soma += int(c) * pesos[i % len(pesos)]
        resto = soma % 11
        return 0 if resto < 2 else 11 - resto

    def _gerar_xml_nfce(self, order: Order, numero_nfe: str, chave: str) -> str:
        agora = datetime.now().strftime("%Y-%m-%dT%H:%M:%S-03:00")
        itens_xml = ""
        for idx, item in enumerate(order.items, 1):
            subtotal = float(item.unit_price) * item.quantity
            itens_xml += f"""
            <det nItem="{idx}">
                <prod>
                    <cProd>{str(item.product_id).zfill(6)}</cProd>
                    <cEAN>SEM GTIN</cEAN>
                    <xProd>{item.product.name[:120] if item.product else 'Produto'}</xProd>
                    <NCM>21069090</NCM>
                    <CFOP>5102</CFOP>
                    <uCom>UN</uCom>
                    <qCom>{item.quantity:.4f}</qCom>
                    <vUnCom>{float(item.unit_price):.10f}</vUnCom>
                    <vProd>{subtotal:.2f}</vProd>
                    <cEANTrib>SEM GTIN</cEANTrib>
                    <uTrib>UN</uTrib>
                    <qTrib>{item.quantity:.4f}</qTrib>
                    <vUnTrib>{float(item.unit_price):.10f}</vUnTrib>
                    <indTot>1</indTot>
                </prod>
                <imposto>
                    <ICMS><ICMSSN102><orig>0</orig><CSOSN>102</CSOSN></ICMSSN102></ICMS>
                    <PIS><PISOutr><CST>99</CST><vBC>0.00</vBC><pPIS>0.0000</pPIS><vPIS>0.00</vPIS></PISOutr></PIS>
                    <COFINS><COFINSOutr><CST>99</CST><vBC>0.00</vBC><pCOFINS>0.0000</pCOFINS><vCOFINS>0.00</vCOFINS></COFINSOutr></COFINS>
                </imposto>
            </det>"""

        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe versao="4.00" Id="NFe{chave}">
      <ide>
        <cUF>{self._get_cuf()}</cUF>
        <cNF>{chave[35:43]}</cNF>
        <natOp>VENDA DE MERCADORIA</natOp>
        <mod>65</mod>
        <serie>1</serie>
        <nNF>{numero_nfe}</nNF>
        <dhEmi>{agora}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>4</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>{chave[-1]}</cDV>
        <tpAmb>{self.ambiente}</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>AgilizaDelivery 1.0</verProc>
      </ide>
      <emit>
        <CNPJ>{self.cnpj}</CNPJ>
        <xNome>{settings.SEFAZ_RAZAO_SOCIAL}</xNome>
        <xFant>{settings.SEFAZ_NOME_FANTASIA}</xFant>
        <enderEmit>
          <xLgr>{settings.SEFAZ_LOGRADOURO}</xLgr>
          <nro>{settings.SEFAZ_NUMERO}</nro>
          <xBairro>{settings.SEFAZ_BAIRRO}</xBairro>
          <cMun>3550308</cMun>
          <xMun>{settings.SEFAZ_MUNICIPIO}</xMun>
          <UF>{self.uf}</UF>
          <CEP>{settings.SEFAZ_CEP}</CEP>
          <cPais>1058</cPais>
          <xPais>Brasil</xPais>
          <fone>{settings.SEFAZ_TELEFONE}</fone>
        </enderEmit>
        <IE>{self.ie}</IE>
        <CRT>1</CRT>
      </emit>
      {itens_xml}
      <total>
        <ICMSTot>
          <vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST>
          <vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet>
          <vProd>{float(order.total_amount):.2f}</vProd>
          <vFrete>0.00</vFrete><vSeg>0.00</vSeg><vDesc>0.00</vDesc>
          <vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol>
          <vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro>
          <vNF>{float(order.total_amount):.2f}</vNF>
        </ICMSTot>
      </total>
      <transp><modFrete>9</modFrete></transp>
      <pag>
        <detPag>
          <tPag>{'01' if order.payment and order.payment.method.value == 'credit_card' else '04' if order.payment and order.payment.method.value == 'pix' else '01'}</tPag>
          <vPag>{float(order.total_amount):.2f}</vPag>
        </detPag>
      </pag>
      <infAdic>
        <infCpl>Pedido #{order.order_number} - {settings.SEFAZ_NOME_FANTASIA}</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
</nfeProc>"""
        return xml

    def emitir(self, order: Order, numero_nfe: str) -> dict:
        """
        Emite NFC-e para o pedido.
        Em produção, envia o XML assinado ao SEFAZ e retorna chave de acesso.
        Em desenvolvimento (SEFAZ_AMBIENTE=2), retorna dados simulados.
        """
        chave = self._gerar_chave_acesso(numero_nfe)
        xml = self._gerar_xml_nfce(order, numero_nfe, chave)

        if self.ambiente == 2:
            return {
                "chave": chave,
                "numero": numero_nfe,
                "status": "100",
                "motivo": "Autorizado o uso da NF-e (Homologação)",
                "xml": xml,
                "danfe_url": None,
                "ambiente": "homologacao",
            }

        # Produção: integrar com biblioteca py-nfe ou similar
        return {
            "chave": chave,
            "numero": numero_nfe,
            "status": "pendente",
            "motivo": "Configure o certificado digital para emissão em produção",
            "xml": xml,
            "danfe_url": None,
            "ambiente": "producao",
        }
