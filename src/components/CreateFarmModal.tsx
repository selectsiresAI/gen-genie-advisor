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
import { useTranslation } from '@/hooks/useTranslation';

interface CreateFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateFarmModal: React.FC<CreateFarmModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [farmName, setFarmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { t } = useTranslation();

  const resetForm = () => {
    setFarmName('');
    setOwnerName('');
    setCity('');
    setState('');
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
      setError(t("createFarm.farmNameRequired"));
      setIsLoading(false);
      return;
    }

    if (!ownerName.trim()) {
      setError(t("createFarm.ownerRequired"));
      setIsLoading(false);
      return;
    }

    if (!city.trim()) {
      setError(t("createFarm.cityRequired"));
      setIsLoading(false);
      return;
    }

    if (!state.trim()) {
      setError(t("createFarm.stateRequired"));
      setIsLoading(false);
      return;
    }

    try {
      const metadata = description.trim() ? { description: description.trim() } : {};

      const { data, error } = await supabase.rpc('create_farm_basic', {
        farm_name: farmName.trim(),
        owner_name: ownerName.trim(),
        farm_metadata: metadata,
        p_city: city.trim(),
        p_state: state.trim(),
      });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const result = data[0];
        
        if (result.success) {
          toast({
            title: t("createFarm.success"),
            description: `${farmName} ${t("createFarm.addedToPortfolio")}`,
          });
          
          resetForm();
          onSuccess();
          onClose();
        } else {
          setError(result.message || t("createFarm.error"));
        }
      }
    } catch (error: any) {
      console.error('Erro ao criar fazenda:', error);
      setError(error.message || t("createFarm.unexpectedError"));
      toast({
        title: t("createFarm.error"),
        description: error.message || t("createFarm.tryAgain"),
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
            {t("createFarm.title")}
          </DialogTitle>
          <DialogDescription>
            {t("createFarm.desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="farm-name">{t("createFarm.farmName")}</Label>
              <Input
                id="farm-name"
                type="text"
                placeholder={t("createFarm.farmNamePlaceholder")}
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner-name">{t("createFarm.ownerName")}</Label>
              <Input
                id="owner-name"
                type="text"
                placeholder={t("createFarm.ownerNamePlaceholder")}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="farm-city">{t("createFarm.city")}</Label>
                <Input
                  id="farm-city"
                  type="text"
                  placeholder={t("createFarm.cityPlaceholder")}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="farm-state">{t("createFarm.state")}</Label>
                <Input
                  id="farm-state"
                  type="text"
                  placeholder={t("createFarm.statePlaceholder")}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("createFarm.description")}</Label>
              <Textarea
                id="description"
                placeholder={t("createFarm.descPlaceholder")}
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
              {t("createFarm.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("createFarm.creating")}
                </>
              ) : (
                t("createFarm.create")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFarmModal;