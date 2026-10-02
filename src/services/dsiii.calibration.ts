/**
 * DSIII — calibração do Nexus 2 (fase 1, sem V11).
 *
 * Predição final = a + b · Nexus2, com a e b por PTA (mínimos quadrados ponderados, peso igual por
 * rebanho, ajustados em fêmeas genotipadas HOUSA/HOBRA; sem correção de nível do rebanho).
 * Validação cega em 8 rebanhos novos (pedigree só; genômico lido depois): R² do valor 0,35 contra
 * 0,05 do Nexus 2 sem calibração; ordem dos animais (quartis, top/bottom %) idêntica à do Nexus 2.
 * Parâmetros gerados de genetic_prediction/dsii_v14/dsii14_params.json. NÃO editar à mão.
 */
export const DSIII_VERSION = 'DSIII 1.0 (fase 1, sem V11)';

export type DsiiiStatus = 'calibrated' | 'provisional' | 'uncalibrated' | 'not_predicted';

const DSIII_PARAMS: Record<string, { a: number; b: number }> = {
  tpi: { a: 238.08415676734296, b: 0.8712387216531631 },
  ptam: { a: 0.0448084448591725, b: 0.7487788204035939 },
  ptaf: { a: -9.269633315671753, b: 0.7290413905563318 },
  ptap: { a: -5.041689033991711, b: 0.8576575569411212 },
  ptaf_pct: { a: -0.02077353188899599, b: 0.8315886004234383 },
  ptap_pct: { a: -0.010077463115250403, b: 0.8166901229620752 },
  pl: { a: 0.04012686313684573, b: 0.7761947426202772 },
  dpr: { a: -0.7261706571175656, b: 0.7726445715025784 },
  ccr: { a: -0.691875768007895, b: 0.717330197878342 },
  liv: { a: 0.2606271227580761, b: 0.6901254819152538 },
  scs: { a: 1.1512762528198248, b: 0.6156936443511271 },
  mast: { a: -0.16054407718638125, b: 0.806364264622977 },
  udc: { a: -0.42145484707729197, b: 0.7771962040258554 },
  flc: { a: -0.0995748004291635, b: 0.6768116551078563 },
  hhp_dollar: { a: -138.89289711379485, b: 0.8309215895006522 },
  nm_dollar: { a: -220.6521966522027, b: 1.0994785404754708 },
  cm_dollar: { a: -218.19059434420726, b: 1.0876201841096877 },
  fm_dollar: { a: -128.97967640398295, b: 1.017514455613611 },
  gm_dollar: { a: -188.31590928930396, b: 1.039559509901593 },
  cfp: { a: -16.60469197126955, b: 0.7422108810355529 },
  hcr: { a: -0.08812358932740215, b: 0.8054950669809448 },
  fi: { a: -0.605711971583587, b: 0.7689661540776297 },
  ptat: { a: -0.2757073341613561, b: 0.7577404158057309 },
  ssb: { a: 0.8910178652791971, b: 0.8072565591474521 },
  dsb: { a: 1.2423497954283487, b: 0.7849903071227735 },
  ftl: { a: 0.08085260541923672, b: 0.6087347868246893 },
  rw: { a: -0.051689142441340936, b: 0.6653464899107815 },
  fta: { a: -0.22449020463593697, b: 0.662392464607531 },
  sta: { a: -0.20703172307336612, b: 0.6917884557716119 },
  str: { a: -0.1352902550842993, b: 0.701265362562364 },
  dfm: { a: -0.2282022210343501, b: 0.8584497126333706 },
  rls: { a: 0.02639317247913086, b: 0.6223561223009302 },
  rtp: { a: -0.12198565288326023, b: 0.8041068709591969 },
  rlr: { a: -0.15958687885137662, b: 0.6068650748977971 },
  fls: { a: -0.1362468904617137, b: 0.6360682662671507 },
  fua: { a: -0.415028248433204, b: 0.7854225701354418 },
  ruh: { a: -0.4112472330953145, b: 0.7808212877271852 },
  ruw: { a: -0.45460077753801387, b: 0.8543782031291117 },
  ucl: { a: -0.09447725519598088, b: 0.7413188116161248 },
  udp: { a: -0.3070376791203869, b: 0.640444674597981 },
  ftp: { a: -0.14340468701487122, b: 0.809579912948363 },
  bd: { a: -0.3271168914976631, b: 0.50728343703865 },
};

/** PTAs sem sinal de pedigree (r² ~ 0 na validação): não predizer. */
const DSIII_NOT_PREDICTED = new Set<string>(["met", "rp", "da", "ket", "mf", "sce", "rua"]);
/** Calibrado em um só rebanho, sem validação. */
const DSIII_PROVISIONAL = new Set<string>(["bd"]);

export function getDsiiiStatus(traitKey: string): DsiiiStatus {
  if (DSIII_NOT_PREDICTED.has(traitKey)) return 'not_predicted';
  if (!(traitKey in DSIII_PARAMS)) return 'uncalibrated';
  return DSIII_PROVISIONAL.has(traitKey) ? 'provisional' : 'calibrated';
}

/** Aplica a calibração DSIII ao valor do Nexus 2 (média ponderada dos ancestrais). */
export function applyDsiii(traitKey: string, nexus2Value: number | null): number | null {
  if (nexus2Value == null || !Number.isFinite(nexus2Value)) return null;
  const status = getDsiiiStatus(traitKey);
  if (status === 'not_predicted') return null;
  if (status === 'uncalibrated') return nexus2Value;
  const p = DSIII_PARAMS[traitKey];
  return p.a + p.b * nexus2Value;
}
