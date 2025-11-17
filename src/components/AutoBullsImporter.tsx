import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Card } from "./ui/card";
import { Loader2 } from "lucide-react";

export function AutoBullsImporter() {
  const [status, setStatus] = useState<"idle" | "importing" | "done" | "error">("idle");
  const [progress, setProgress] = useState("");
  const [details, setDetails] = useState<{ inserted: number; updated: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const importBulls = async () => {
      setStatus("importing");
      setProgress("Carregando arquivo Excel...");

      try {
        const response = await fetch("/USA_-_holstein_List_57.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        
        setProgress("Processando arquivo Excel...");
        const workbook = XLSX.read(arrayBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        setProgress(`${jsonData.length} touros encontrados. Preparando dados...`);

        const bulls = jsonData.map((row: any) => {
          let birthDate = null;
          if (row["Birth Date"]) {
            if (typeof row["Birth Date"] === "number") {
              // Excel date serial number to JS date
              const date = new Date((row["Birth Date"] - 25569) * 86400 * 1000);
              birthDate = date.toISOString().split("T")[0];
            } else if (typeof row["Birth Date"] === "string") {
              // Try to parse string date (MM/DD/YY format)
              const parts = row["Birth Date"].split("/");
              if (parts.length === 3) {
                const month = parts[0].padStart(2, "0");
                const day = parts[1].padStart(2, "0");
                let year = parts[2];
                // Convert 2-digit year to 4-digit
                if (year.length === 2) {
                  year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
                }
                birthDate = `${year}-${month}-${day}`;
              }
            }
          }

          return {
            code: row["Naab Code"]?.toString().trim() || "",
            name: row["Name"]?.toString().trim() || "",
            registration: row["Reg Name"] || null,
            company: row["Company"] || null,
            beta_casein: row["Beta Casein"] || null,
            kappa_casein: row["Kappa Casein"] || null,
            birth_date: birthDate,
            tpi: row["TPI"] != null ? parseFloat(row["TPI"]) : null,
            nm_dollar: row["Net Merit"] != null ? parseFloat(row["Net Merit"]) : null,
            cm_dollar: row["CM$"] != null ? parseFloat(row["CM$"]) : null,
            fm_dollar: row["FM$"] != null ? parseFloat(row["FM$"]) : null,
            gm_dollar: row["Grazing Merit"] != null ? parseFloat(row["Grazing Merit"]) : null,
            hhp_dollar: row["Health Index"] != null ? parseFloat(row["Health Index"]) : null,
            ptam: row["PTA Milk"] != null ? parseFloat(row["PTA Milk"]) : null,
            ptaf: row["PTA Fat"] != null ? parseFloat(row["PTA Fat"]) : null,
            ptaf_pct: row["% Fat"] != null ? parseFloat(row["% Fat"]) : null,
            ptap: row["PTA Pro"] != null ? parseFloat(row["PTA Pro"]) : null,
            ptap_pct: row["% Pro"] != null ? parseFloat(row["% Pro"]) : null,
            cfp: row["CFP"] != null ? parseFloat(row["CFP"]) : null,
            scs: row["SCS"] != null ? parseFloat(row["SCS"]) : null,
            pl: row["PL"] != null ? parseFloat(row["PL"]) : null,
            dpr: row["PTA DPR"] != null ? parseFloat(row["PTA DPR"]) : null,
            liv: row["PTA LIV"] != null ? parseFloat(row["PTA LIV"]) : null,
            gl: row["PTA GL"] != null ? parseFloat(row["PTA GL"]) : null,
            met: row["Metritis"] != null ? parseFloat(row["Metritis"]) : null,
            mast: row["Mastitis"] != null ? parseFloat(row["Mastitis"]) : null,
            ket: row["Ketosis"] != null ? parseFloat(row["Ketosis"]) : null,
            ccr: row["CCR"] != null ? parseFloat(row["CCR"]) : null,
            hcr: row["HCR"] != null ? parseFloat(row["HCR"]) : null,
            fi: row["Fertil Index"] != null ? parseFloat(row["Fertil Index"]) : null,
            f_sav: row["Feed Saved"] != null ? parseFloat(row["Feed Saved"]) : null,
            rfi: row["RFI"] != null ? parseFloat(row["RFI"]) : null,
            ptat: row["PTA Type"] != null ? parseFloat(row["PTA Type"]) : null,
            udc: row["UDC"] != null ? parseFloat(row["UDC"]) : null,
            flc: row["FLC"] != null ? parseFloat(row["FLC"]) : null,
            bwc: row["BWC"] != null ? parseFloat(row["BWC"]) : null,
            sta: row["STA"] != null ? parseFloat(row["STA"]) : null,
            str: row["STR"] != null ? parseFloat(row["STR"]) : null,
            dfm: row["DF"] != null ? parseFloat(row["DF"]) : null,
            rua: row["RA"] != null ? parseFloat(row["RA"]) : null,
            rls: row["RLS"] != null ? parseFloat(row["RLS"]) : null,
            rlr: row["RLR"] != null ? parseFloat(row["RLR"]) : null,
            rtp: row["RTP"] != null ? parseFloat(row["RTP"]) : null,
            fls: row["FLS"] != null ? parseFloat(row["FLS"]) : null,
            fua: row["FUA"] != null ? parseFloat(row["FUA"]) : null,
            ruh: row["RUH"] != null ? parseFloat(row["RUH"]) : null,
            ruw: row["RUW"] != null ? parseFloat(row["RUW"]) : null,
            ucl: row["UC"] != null ? parseFloat(row["UC"]) : null,
            udp: row["UD"] != null ? parseFloat(row["UD"]) : null,
            ftp: row["FTP"] != null ? parseFloat(row["FTP"]) : null,
            ftl: row["TL"] != null ? parseFloat(row["TL"]) : null,
            fta: row["FA"] != null ? parseFloat(row["FA"]) : null,
            sce: row["SCE"] != null ? parseFloat(row["SCE"]) : null,
            dce: row["DCE"] != null ? parseFloat(row["DCE"]) : null,
            ssb: row["SSB"] != null ? parseFloat(row["SSB"]) : null,
            dsb: row["DSB"] != null ? parseFloat(row["DSB"]) : null,
            h_liv: row["Heifer Livability"] != null ? parseFloat(row["Heifer Livability"]) : null,
            da: row["Displaced Abomasum"] != null ? parseFloat(row["Displaced Abomasum"]) : null,
            rp: row["Retained Placenta"] != null ? parseFloat(row["Retained Placenta"]) : null,
            efc: row["Early First Calving"] != null ? parseFloat(row["Early First Calving"]) : null,
            gfi: row["Feed Effic"] != null ? parseFloat(row["Feed Effic"]) : null,
            rw: row["TW"] != null ? parseFloat(row["TW"]) : null,
            pedigree: row["Sire x MGS x MGGS"] || null,
          };
        });

        setProgress("Inserindo touros no banco de dados...");

        const batchSize = 50;
        let totalInserted = 0;

        for (let i = 0; i < bulls.length; i += batchSize) {
          const batch = bulls.slice(i, i + batchSize);
          
          const { error } = await supabase.from("bulls").upsert(batch, {
            onConflict: "code",
            ignoreDuplicates: false,
          });

          if (error) {
            console.error("Erro ao inserir lote:", error);
            throw error;
          }

          totalInserted += batch.length;
          setProgress(`${totalInserted} de ${bulls.length} touros processados...`);
        }

        setDetails({ inserted: bulls.length, updated: 0 });
        setStatus("done");
        setProgress(`✓ Importação concluída! ${bulls.length} touros importados.`);

        toast({
          title: "Importação concluída!",
          description: `${bulls.length} touros foram importados com sucesso.`,
        });
      } catch (error) {
        console.error("Erro na importação:", error);
        setStatus("error");
        setProgress(`Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
        toast({
          title: "Erro na importação",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
      }
    };

    importBulls();
  }, [toast]);

  return (
    <Card className="p-6 max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Importação Automática de Touros</h2>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {status === "importing" && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          {status === "done" && (
            <span className="text-2xl">✓</span>
          )}
          {status === "error" && (
            <span className="text-2xl text-destructive">✗</span>
          )}
          <p className="text-sm">{progress}</p>
        </div>
        {details && (
          <div className="text-sm text-muted-foreground border-t pt-4">
            <p>Total de touros: {details.inserted}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
