import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateFarmModal: React.FC<CreateFarmModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [farmName, setFarmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const resetForm = () => {
    setFarmName('');
    setOwnerName('');
    setDescription('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validações
    if (!farmName.trim()) {
      setError('Nome da fazenda é obrigatório');
      setIsLoading(false);
      return;
    }

    if (!ownerName.trim()) {
      setError('Nome do proprietário é obrigatório');
      setIsLoading(false);
      return;
    }

    try {
      const metadata = description.trim() ? { description: description.trim() } : {};

      const { data, error } = await supabase.rpc('create_farm_basic', {
        farm_name: farmName.trim(),
        owner_name: ownerName.trim(),
        farm_metadata: metadata,
      });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const result = data[0];
        
        if (result.success) {
          toast({
            title: "Fazenda criada com sucesso!",
            description: `${farmName} foi adicionada ao seu portfólio`,
          });
          
          resetForm();
          onSuccess();
          onClose();
        } else {
          setError(result.message || 'Erro ao criar fazenda');
        }
      }
    } catch (error: any) {
      console.error('Erro ao criar fazenda:', error);
      setError(error.message || 'Erro inesperado ao criar fazenda');
      toast({
        title: "Erro ao criar fazenda",
        description: error.message || 'Tente novamente',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Criar Nova Fazenda
          </DialogTitle>
          <DialogDescription>
            Cadastre uma nova fazenda no seu portfólio para gerenciar fêmeas, touros e análises genéticas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="farm-name">Nome da Fazenda *</Label>
              <Input
                id="farm-name"
                type="text"
                placeholder="Ex: Fazenda Santa Rosa"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner-name">Nome do Proprietário *</Label>
              <Input
                id="owner-name"
                type="text"
                placeholder="Ex: João Silva"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                placeholder="Informações adicionais sobre a fazenda..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Fazenda'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFarmModal;