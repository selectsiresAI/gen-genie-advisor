import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { InventoryRow } from '@/lib/conversion/types';
import { Button } from '@/components/ui/button';

interface InventoryTableProps {
  inventory: InventoryRow[];
}

const InventoryTable: React.FC<InventoryTableProps> = ({ inventory }) => {
  const handleCopy = (columns: string) => {
    navigator.clipboard.writeText(columns).catch(() => {
      // No-op caso clipboard falhe
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Inventário de Abas e Colunas</CardTitle>
        <CardDescription>Resumo das abas encontradas no arquivo com suas respectivas colunas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aba</TableHead>
                <TableHead>Colunas</TableHead>
                <TableHead className="w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((row) => (
                <TableRow key={row.sheet}>
                  <TableCell className="font-medium">{row.sheet}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.columns}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => handleCopy(row.columns)}>
                      Copiar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {inventory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nenhum inventário disponível. Faça o upload de um arquivo para visualizar esta tabela.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryTable;
