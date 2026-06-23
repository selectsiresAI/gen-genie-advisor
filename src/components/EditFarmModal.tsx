import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

interface EditFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  farmId: string;
  initialFarmName: string;
  initialOwnerName: string;
}

const EditFarmModal: React.FC<EditFarmModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  farmId,
  initialFarmName,
  initialOwnerName,
}) => {
  const [farmName, setFarmName] = useState(initialFarmName);
  const [ownerName, setOwnerName] = useState(initialOwnerName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setFarmName(initialFarmName);
      setOwnerName(initialOwnerName);
      setError('');
    }
  }, [isOpen, initialFarmName, initialOwnerName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!farmName.trim()) {
      setError(t('createFarm.farmNameRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('update_farm_basic' as any, {
        farm_uuid: farmId,
        new_farm_name: farmName.trim(),
        new_owner_name: ownerName.trim(),
      });

      if (rpcError) throw rpcError;

      const result = Array.isArray(data) ? data[0] : data;
      if (result && result.success === false) {
        throw new Error(result.message || 'Erro ao atualizar fazenda');
      }

      toast({ title: t('editFarm.success') || 'Fazenda atualizada' });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao atualizar fazenda:', err);
      setError(err.message || 'Erro ao atualizar fazenda');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            {t('editFarm.title') || 'Editar fazenda'}
          </DialogTitle>
          <DialogDescription>
            {t('editFarm.desc') || 'Atualize o nome da fazenda ou do proprietário.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-farm-name">{t('createFarm.farmName')}</Label>
              <Input
                id="edit-farm-name"
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-owner-name">{t('createFarm.ownerName')}</Label>
              <Input
                id="edit-owner-name"
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {t('createFarm.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('editFarm.saving') || 'Salvando...'}
                </>
              ) : (
                t('editFarm.save') || 'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFarmModal;
