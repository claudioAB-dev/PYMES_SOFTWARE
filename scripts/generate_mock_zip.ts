import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const mockXML1 = `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="A" Folio="12345" Fecha="2026-02-28T12:00:00" Sello="dummy_sello" FormaPago="01" NoCertificado="00001000000000000000" Certificado="dummy_certificado" SubTotal="1000.00" Moneda="MXN" Total="1160.00" TipoDeComprobante="I" Exportacion="01" MetodoPago="PUE" LugarExpedicion="12345">
  <cfdi:Emisor Rfc="EKU9003173C9" Nombre="EMPRESA CONOCIDA SA DE CV" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="XAXX010101000" Nombre="PUBLICO EN GENERAL" UsoCFDI="G03" DomicilioFiscalReceptor="12345" RegimenFiscalReceptor="616"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111506" NoIdentificacion="001" Cantidad="1" ClaveUnidad="E48" Unidad="Servicio" Descripcion="Servicios de Consultoría" ValorUnitario="1000.00" Importe="1000.00" ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="1000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="160.00"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="160.00">
    <cfdi:Traslados>
      <cfdi:Traslado Base="1000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="160.00"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="1.1" UUID="DUMMY-UUID-1111-2222-333333333333" FechaTimbrado="2026-02-28T12:05:00" RfcProvCertif="SAT970701NN3" SelloCFD="dummy_sello" NoCertificadoSAT="00001000000000000000" SelloSAT="dummy_sello_sat"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

const mockXML2 = `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="B" Folio="98765" Fecha="2026-02-28T14:30:00" Sello="dummy_sello_2" FormaPago="99" NoCertificado="00001000000000000000" Certificado="dummy_certificado" SubTotal="5000.00" Moneda="MXN" Total="5800.00" TipoDeComprobante="I" Exportacion="01" MetodoPago="PPD" LugarExpedicion="12345">
  <cfdi:Emisor Rfc="EKU9003173C9" Nombre="EMPRESA CONOCIDA SA DE CV" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="OOT0310243P4" Nombre="OTRA ORGANIZACION DE PRUEBAS" UsoCFDI="G03" DomicilioFiscalReceptor="54321" RegimenFiscalReceptor="601"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111506" NoIdentificacion="002" Cantidad="5" ClaveUnidad="E48" Unidad="Servicio" Descripcion="Licencias de Software" ValorUnitario="1000.00" Importe="5000.00" ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="5000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="800.00"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="800.00">
    <cfdi:Traslados>
      <cfdi:Traslado Base="5000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="800.00"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="1.1" UUID="DUMMY-UUID-4444-5555-666666666666" FechaTimbrado="2026-02-28T14:35:00" RfcProvCertif="SAT970701NN3" SelloCFD="dummy_sello_2" NoCertificadoSAT="00001000000000000000" SelloSAT="dummy_sello_sat_2"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

async function generateMockZip() {
    const zip = new AdmZip();
    zip.addFile("mock_cfdi_1.xml", Buffer.from(mockXML1, "utf8"));
    zip.addFile("mock_cfdi_2.xml", Buffer.from(mockXML2, "utf8"));

    const outputPath = path.join(process.cwd(), "src/lib/sat/__mocks__/dummy_cfdis.zip");
    zip.writeZip(outputPath);
    console.log("Mock ZIP created at:", outputPath);
}

generateMockZip().catch(console.error);
