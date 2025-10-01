import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PreviewBeforeAfterProps {
  originalHeaders: string[];
  convertedHeaders: string[];
  originalRows: Record<string, any>[];
  convertedRows: Record<string, any>[];
}

const renderTable = (headers: string[], rows: Record<string, any>[]) => {
  if (headers.length === 0) {
    return <p className="text-sm text-muted-foreground">Carregue um arquivo de dados para visualizar a prévia.</p>;
  }

  const previewRows = rows.slice(0, 5);

  return (
    <ScrollArea className="h-72">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header} className="min-w-[160px]">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {previewRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length} className="text-center text-sm text-muted-foreground">
                Sem dados para exibir.
              </TableCell>
            </TableRow>
          ) : (
            previewRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((header) => (
                  <TableCell key={header} className="whitespace-nowrap">
                    {row[header] ?? ""}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export const PreviewBeforeAfter: React.FC<PreviewBeforeAfterProps> = ({
  originalHeaders,
  convertedHeaders,
  originalRows,
  convertedRows,
}) => {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Antes</CardTitle>
        </CardHeader>
        <CardContent>{renderTable(originalHeaders, originalRows)}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Depois</CardTitle>
        </CardHeader>
        <CardContent>{renderTable(convertedHeaders, convertedRows)}</CardContent>
      </Card>
    </div>
  );
};
