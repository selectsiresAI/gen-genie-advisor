import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import UploadStep, { UploadResult } from '@/components/conversao/UploadStep';
import DetectionTable from '@/components/conversao/DetectionTable';
import InventoryTable from '@/components/conversao/InventoryTable';
import ReviewMapper from '@/components/conversao/ReviewMapper';
import ValidationPanel from '@/components/conversao/ValidationPanel';
import PreviewBeforeAfter from '@/components/conversao/PreviewBeforeAfter';
import SaveProfileModal from '@/components/conversao/SaveProfileModal';
import { detectAliasesFromHeaders } from '@/lib/conversion/detect';
import type { DetectionRow, InventoryRow } from '@/lib/conversion/types';
import { supabase } from '@/integrations/supabase/client';

const STEPS = [
  {
    title: 'Upload e Inventário',
    description: 'Envie o arquivo de origem e gere o inventário de abas/colunas.',
  },
  {
    title: 'Sugestões Automáticas',
    description: 'Analise as primeiras 200 sugestões de mapeamento.',
  },
  {
    title: 'Revisão Humana',
    description: 'Ajuste manualmente as chaves canônicas e aplique regras de negócio.',
  },
  {
    title: 'Validações e Prévia',
    description: 'Valide tipos/unidades, visualize antes/depois e salve o perfil.',
  },
];

const ConversaoPage: React.FC = () => {
  const { toast } = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [detections, setDetections] = useState<DetectionRow[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) {
        setUserId(data.user.id);
      }
    });
  }, []);

  const handleUpload = (result: UploadResult) => {
    setUploadResult(result);
    setInventory(result.inventory);
    const detectionResults = detectAliasesFromHeaders(result.headers, { inventory: result.inventory });
    setDetections(detectionResults);
    const mapping = detectionResults.reduce<Record<string, string>>((acc, row) => {
      if (row.suggested) {
        acc[row.alias_original] = row.suggested;
      }
      return acc;
    }, {});
    setSelections(mapping);
    setActiveStep(1);
  };

  const handleExportJson = () => {
    const data = {
      file: uploadResult?.fileName ?? 'preview.csv',
      generated_at: new Date().toISOString(),
      detections,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'conversion-detections.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectionChange = (alias: string, canonical: string) => {
    setSelections((prev) => ({
      ...prev,
      [alias]: canonical,
    }));
  };

  const finalMappings = useMemo(() => {
    return detections.map((row) => ({
      ...row,
      chosen: selections[row.alias_original] ?? row.suggested ?? '',
    }));
  }, [detections, selections]);

  const canProceed = (nextStep: number) => {
    if (nextStep === 1) {
      return Boolean(uploadResult);
    }
    if (nextStep === 2) {
      return detections.length > 0;
    }
    if (nextStep === 3) {
      return detections.length > 0;
    }
    return true;
  };

  const handleNext = () => {
    const nextStep = Math.min(activeStep + 1, STEPS.length - 1);
    if (!canProceed(nextStep)) {
      toast({
        title: 'Etapa pendente',
        description: 'Finalize a etapa atual antes de avançar.',
        variant: 'destructive',
      });
      return;
    }
    setActiveStep(nextStep);
  };

  const handlePrevious = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const handleSaveProfile = async (profileName: string, scope: 'global' | 'private') => {
    if (!userId) {
      toast({
        title: 'Sessão não encontrada',
        description: 'Faça login novamente para salvar perfis.',
        variant: 'destructive',
      });
      return;
    }

    const payload = finalMappings
      .filter((row) => row.chosen)
      .map((row) => ({
        alias_original: row.alias_original,
        canonical_key: row.chosen,
        confidence: row.score,
        source_hint: row.method,
      }));

    if (payload.length === 0) {
      toast({
        title: 'Nenhum mapeamento selecionado',
        description: 'Selecione pelo menos uma chave canônica antes de salvar o perfil.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingProfile(true);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('source_profiles')
        .insert({
          name: profileName,
          scope,
          owner: userId,
        })
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      const profileId = profileData?.id;
      if (!profileId) {
        throw new Error('Não foi possível recuperar o identificador do perfil.');
      }

      const mappingPayload = payload.map((row) => ({
        profile_id: profileId,
        alias_original: row.alias_original,
        canonical_key: row.canonical_key,
        confidence: row.confidence,
        source_hint: row.source_hint,
      }));

      const { error: mappingsError } = await supabase.from('profile_mappings').insert(mappingPayload);
      if (mappingsError) {
        throw mappingsError;
      }

      const mappedCount = payload.length;
      const ambiguousCount = finalMappings.filter((row) => row.method !== 'exact' && row.chosen).length;
      const ignoredCount = finalMappings.filter((row) => !row.chosen).length;

      const { error: runError } = await supabase.from('conversion_runs').insert({
        profile_id: profileId,
        dataset_name: uploadResult?.fileName ?? 'preview',
        mapped_count: mappedCount,
        ambiguous_count: ambiguousCount,
        ignored_count: ignoredCount,
        inventory,
        mappings: payload,
        created_by: userId,
      });

      if (runError) {
        throw runError;
      }

      toast({
        title: 'Perfil salvo com sucesso',
        description: `${profileName} disponível para futuras importações.`,
      });
    } catch (error) {
      console.error('Erro ao salvar perfil', error);
      toast({
        title: 'Erro ao salvar perfil',
        description: error instanceof Error ? error.message : 'Não foi possível concluir a operação.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Conversão (provisório)</h1>
        <p className="text-muted-foreground max-w-3xl">
          Funil de padronização de colunas com detecção automática, revisão humana e validações antes de salvar um perfil reutilizável.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        {STEPS.map((step, index) => {
          const completed = index < activeStep;
          const current = index === activeStep;
          return (
            <Card
              key={step.title}
              className={`flex-1 min-w-[220px] border ${current ? 'border-primary shadow-sm' : ''}`}
            >
              <div className="flex items-center gap-3 p-4">
                <Badge variant={completed ? 'default' : current ? 'secondary' : 'outline'}>{index + 1}</Badge>
                <div>
                  <p className="font-semibold flex items-center gap-1">
                    {step.title}
                    {completed && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {activeStep === 0 && <UploadStep onUploadComplete={handleUpload} />}

      {activeStep === 1 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <DetectionTable rows={detections} onExportJson={handleExportJson} />
          <InventoryTable inventory={inventory} />
        </div>
      )}

      {activeStep === 2 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ReviewMapper rows={detections} selected={selections} onChange={handleSelectionChange} />
          <ValidationPanel rows={detections} selections={selections} />
        </div>
      )}

      {activeStep === 3 && (
        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <PreviewBeforeAfter
              rows={uploadResult?.previewRows ?? []}
              detections={detections}
              selections={selections}
            />
            <ValidationPanel rows={detections} selections={selections} />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setSaveModalOpen(true)} disabled={isSavingProfile}>
              {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar Perfil e Log
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-4">
        <Button variant="outline" onClick={handlePrevious} disabled={activeStep === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button onClick={handleNext} disabled={activeStep === STEPS.length - 1}>
          Avançar <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <SaveProfileModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        onSave={handleSaveProfile}
      />
    </div>
  );
};

export default ConversaoPage;
