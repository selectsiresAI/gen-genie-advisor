import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
interface FileUploadCardProps {
  title: string;
  description: string;
  onFileSelected: (file: File) => void;
  accept?: string;
  fileName?: string;
  helper?: React.ReactNode;
  disabled?: boolean;
  badge?: React.ReactNode;
}
export const FileUploadCard: React.FC<FileUploadCardProps> = ({
  title,
  description,
  onFileSelected,
  accept,
  fileName,
  helper,
  disabled,
  badge
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSelectClick = () => {
    inputRef.current?.click();
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelected(file);
      event.target.value = "";
    }
  };
  return <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {badge}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFileChange} />
        <Button variant="outline" onClick={handleSelectClick} disabled={disabled} className="bg-gray-200 hover:bg-gray-100">
          Selecionar arquivo
        </Button>
        {fileName ? <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">Selecionado</Badge>
            <span className="truncate" title={fileName}>
              {fileName}
            </span>
          </div> : <p className="text-sm text-muted-foreground">
            Nenhum arquivo selecionado até o momento.
          </p>}
        {helper}
      </CardContent>
    </Card>;
};