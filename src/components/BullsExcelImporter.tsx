import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { useTranslation } from "@/hooks/useTranslation";

export function BullsExcelImporter() {
  const { locale } = useTranslation();
  const isEn = locale === "en-US";
  const isEs = locale === "es";
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState("");
  const { toast } = useToast();

  const processExcelFile = async (file: File) => {
    setImporting(true);
    setProgress(isEs ? "Leyendo archivo Excel..." : isEn ? "Reading Excel file..." : "Lendo arquivo Excel...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setProgress(isEs ? `${jsonData.length} toros encontrados. Procesando...` : isEn ? `${jsonData.length} bulls found. Processing...` : `${jsonData.length} touros encontrados. Processando...`);

      // Convert to bulls format and insert
      const bulls = jsonData.map((row: any) => {
        const birthDate = row["Birth Date"]
          ? new Date(
              typeof row["Birth Date"] === "number"
                ? (row["Birth Date"] - 25569) * 86400 * 1000
                : row["Birth Date"]
            )
              .toISOString()
              .split("T")[0]
          : null;

        return {
          naab_code: row["Naab Code"]?.toString() || "",
          code_normalized: (row["Naab Code"]?.toString() || "").trim().replace(/[\s-]/g, '').toUpperCase(),
          name: row["Name"] || "",
          registration: row["Reg Name"] || null,
          company: row["Company"] || null,
          beta_casein: row["Beta Casein"] || null,
          kappa_casein: row["Kappa Casein"] || null,
          birth_date: birthDate,
          tpi: parseFloat(row["TPI"]) || null,
          nm_dollar: parseFloat(row["Net Merit"]) || null,
          cm_dollar: parseFloat(row["CM$"]) || null,
          fm_dollar: parseFloat(row["FM$"]) || null,
          gm_dollar: parseFloat(row["Grazing Merit"]) || null,
          hhp_dollar: parseFloat(row["Health Index"]) || null,
          pta_milk: parseFloat(row["PTA Milk"]) || null,
          pta_fat: parseFloat(row["PTA Fat"]) || null,
          pta_fat_pct: parseFloat(row["% Fat"]) || null,
          pta_protein: parseFloat(row["PTA Pro"]) || null,
          pta_protein_pct: parseFloat(row["% Pro"]) || null,
          cfp: parseFloat(row["CFP"]) || null,
          pta_scs: parseFloat(row["SCS"]) || null,
          pta_pl: parseFloat(row["PL"]) || null,
          pta_dpr: parseFloat(row["PTA DPR"]) || null,
          pta_livability: parseFloat(row["PTA LIV"]) || null,
          gl: parseFloat(row["PTA GL"]) || null,
          met: parseFloat(row["Metritis"]) || null,
          mast: parseFloat(row["Mastitis"]) || null,
          ket: parseFloat(row["Ketosis"]) || null,
          pta_ccr: parseFloat(row["CCR"]) || null,
          pta_hcr: parseFloat(row["HCR"]) || null,
          fi: parseFloat(row["Fertil Index"]) || null,
          f_sav: parseFloat(row["Feed Saved"]) || null,
          rfi: parseFloat(row["RFI"]) || null,
          pta_ptat: parseFloat(row["PTA Type"]) || null,
          pta_udc: parseFloat(row["UDC"]) || null,
          pta_flc: parseFloat(row["FLC"]) || null,
          bwc: parseFloat(row["BWC"]) || null,
          sta: parseFloat(row["STA"]) || null,
          str_num: parseFloat(row["STR"]) || null,
          dfm: parseFloat(row["DF"]) || null,
          rua: parseFloat(row["RA"]) || null,
          rls: parseFloat(row["RLS"]) || null,
          rlr: parseFloat(row["RLR"]) || null,
          rtp: parseFloat(row["RTP"]) || null,
          fls: parseFloat(row["FLS"]) || null,
          fua: parseFloat(row["FUA"]) || null,
          ruh: parseFloat(row["RUH"]) || null,
          ruw: parseFloat(row["RUW"]) || null,
          ucl: parseFloat(row["UC"]) || null,
          udp: parseFloat(row["UD"]) || null,
          ftp: parseFloat(row["FTP"]) || null,
          ftl: parseFloat(row["TL"]) || null,
          fta: parseFloat(row["FA"]) || null,
          pta_sce: parseFloat(row["SCE"]) || null,
          pta_sire_sce: parseFloat(row["DCE"]) || null,
          ssb: parseFloat(row["SSB"]) || null,
          dsb: parseFloat(row["DSB"]) || null,
          h_liv: parseFloat(row["Heifer Livability"]) || null,
          da: parseFloat(row["Displaced Abomasum"]) || null,
          rp: parseFloat(row["Retained Placenta"]) || null,
          // efc removido: coluna não existe na tabela bulls
          gfi: parseFloat(row["Feed Effic"]) || null,
          rw: parseFloat(row["TW"]) || null,
          pedigree: row["Sire x MGS x MGGS"] || null,
        };
      });

      setProgress(isEs ? "Insertando toros en la base de datos..." : isEn ? "Inserting bulls into the database..." : "Inserindo touros no banco de dados...");

      // Insert bulls in batches of 50
      const batchSize = 50;
      let inserted = 0;
      let updated = 0;

      for (let i = 0; i < bulls.length; i += batchSize) {
        const batch = bulls.slice(i, i + batchSize);

        const { error } = await supabase.from("bulls").upsert(batch, {
          onConflict: "naab_code",
          ignoreDuplicates: false,
        });

        if (error) {
          console.error("Erro ao inserir lote:", error);
          throw error;
        }

        inserted += batch.length;
        setProgress(isEs ? `${inserted} de ${bulls.length} toros procesados...` : isEn ? `${inserted} of ${bulls.length} bulls processed...` : `${inserted} de ${bulls.length} touros processados...`);
      }

      setProgress(isEs ? `✓ Importación completada! ${bulls.length} toros importados.` : isEn ? `✓ Import complete! ${bulls.length} bulls imported.` : `✓ Importação concluída! ${bulls.length} touros importados.`);

      toast({
        title: isEs ? "Importación completada!" : isEn ? "Import complete!" : "Importação concluída!",
        description: isEs ? `${bulls.length} toros fueron importados con éxito.` : isEn ? `${bulls.length} bulls were successfully imported.` : `${bulls.length} touros foram importados com sucesso.`,
      });
    } catch (error) {
      console.error("Erro na importação:", error);
      toast({
        title: isEs ? "Error en la importación" : isEn ? "Import error" : "Erro na importação",
        description: error instanceof Error ? error.message : (isEs ? "Error desconocido" : isEn ? "Unknown error" : "Erro desconhecido"),
        variant: "destructive",
      });
      setProgress(isEs ? "Error en la importación" : isEn ? "Import error" : "Erro na importação");
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">{isEs ? "Importar Toros desde Excel" : isEn ? "Import Bulls from Excel" : "Importar Touros do Excel"}</h2>
      <div className="space-y-4">
        <input
          type="file"
          accept=".xlsx,.xls,.xlsm,.csv"
          onChange={handleFileUpload}
          disabled={importing}
          className="block w-full text-sm"
        />
        {progress && (
          <div className="text-sm text-muted-foreground">{progress}</div>
        )}
        {importing && (
          <div className="text-sm text-primary animate-pulse">
            {isEs ? "Procesando..." : isEn ? "Processing..." : "Processando..."}
          </div>
        )}
      </div>
    </Card>
  );
}
