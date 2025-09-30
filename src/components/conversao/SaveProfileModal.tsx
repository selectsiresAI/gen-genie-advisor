import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SaveProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (profileName: string, scope: 'global' | 'private') => Promise<void>;
}

const SaveProfileModal: React.FC<SaveProfileModalProps> = ({ open, onOpenChange, onSave }) => {
  const [profileName, setProfileName] = useState('');
  const [scope, setScope] = useState<'global' | 'private'>('private');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profileName.trim()) {
      return;
    }
    try {
      setSaving(true);
      await onSave(profileName.trim(), scope);
      setProfileName('');
      setScope('private');
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Salvar Perfil de Conversão</DialogTitle>
            <DialogDescription>
              Armazene este mapeamento para reutilizar em futuras importações. Um log da execução será criado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome do perfil</Label>
            <Input
              id="profile-name"
              placeholder="Ex.: CDCB leite 2024"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Visibilidade</Label>
            <Select value={scope} onValueChange={(value) => setScope(value as 'global' | 'private')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Privado</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !profileName.trim()}>
              {saving ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SaveProfileModal;
