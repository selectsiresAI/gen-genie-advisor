-- DROP e recriar funções para corrigir ambiguidade na coluna 'code'

DROP FUNCTION IF EXISTS public.search_bulls(text, integer);
DROP FUNCTION IF EXISTS public.get_bull_by_naab(text);

-- Função search_bulls retornando todos os dados necessários
CREATE FUNCTION public.search_bulls(q text, limit_count integer DEFAULT 20)
RETURNS TABLE(
    bull_id uuid,
    code text,
    name text,
    company text,
    hhp_dollar numeric,
    tpi numeric,
    nm_dollar numeric,
    cm_dollar numeric,
    fm_dollar numeric,
    gm_dollar numeric,
    f_sav numeric,
    ptam numeric,
    cfp numeric,
    ptaf numeric,
    ptaf_pct numeric,
    ptap numeric,
    ptap_pct numeric,
    pl numeric,
    dpr numeric,
    liv numeric,
    scs numeric,
    mast numeric,
    met numeric,
    rp numeric,
    da numeric,
    ket numeric,
    mf numeric,
    ptat numeric,
    udc numeric,
    flc numeric,
    sce numeric,
    dce numeric,
    ssb numeric,
    dsb numeric,
    h_liv numeric,
    ccr numeric,
    hcr numeric,
    fi numeric,
    bwc numeric,
    sta numeric,
    str numeric,
    dfm numeric,
    rua numeric,
    rls numeric,
    rtp numeric,
    ftl numeric,
    rw numeric,
    rlr numeric,
    fta numeric,
    fls numeric,
    fua numeric,
    ruh numeric,
    ruw numeric,
    ucl numeric,
    udp numeric,
    ftp numeric,
    rfi numeric,
    gfi numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF q IS NULL OR LENGTH(TRIM(q)) < 1 THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        bd.id,
        bd.code,
        bd.name,
        bd.company,
        bd.hhp_dollar,
        bd.tpi,
        bd.nm_dollar,
        bd.cm_dollar,
        bd.fm_dollar,
        bd.gm_dollar,
        bd.f_sav,
        bd.ptam,
        bd.cfp,
        bd.ptaf,
        bd.ptaf_pct,
        bd.ptap,
        bd.ptap_pct,
        bd.pl,
        bd.dpr,
        bd.liv,
        bd.scs,
        bd.mast,
        bd.met,
        bd.rp,
        bd.da,
        bd.ket,
        bd.mf,
        bd.ptat,
        bd.udc,
        bd.flc,
        bd.sce,
        bd.dce,
        bd.ssb,
        bd.dsb,
        bd.h_liv,
        bd.ccr,
        bd.hcr,
        bd.fi,
        bd.bwc,
        bd.sta,
        bd.str,
        bd.dfm,
        bd.rua,
        bd.rls,
        bd.rtp,
        bd.ftl,
        bd.rw,
        bd.rlr,
        bd.fta,
        bd.fls,
        bd.fua,
        bd.ruh,
        bd.ruw,
        bd.ucl,
        bd.udp,
        bd.ftp,
        bd.rfi,
        bd.gfi
    FROM public.bulls_denorm bd
    WHERE 
        public.normalize_naab(bd.code) ILIKE public.normalize_naab(q) || '%'
        OR UPPER(bd.name) ILIKE '%' || UPPER(TRIM(q)) || '%'
    ORDER BY 
        CASE 
            WHEN public.normalize_naab(bd.code) = public.normalize_naab(q) THEN 1
            WHEN public.normalize_naab(bd.code) ILIKE public.normalize_naab(q) || '%' THEN 2
            ELSE 3
        END,
        bd.name
    LIMIT limit_count;
END;
$$;

-- Função get_bull_by_naab retornando dados completos
CREATE FUNCTION public.get_bull_by_naab(naab text)
RETURNS TABLE(
    bull_id uuid,
    code text,
    name text,
    company text,
    hhp_dollar numeric,
    tpi numeric,
    nm_dollar numeric,
    cm_dollar numeric,
    fm_dollar numeric,
    gm_dollar numeric,
    f_sav numeric,
    ptam numeric,
    cfp numeric,
    ptaf numeric,
    ptaf_pct numeric,
    ptap numeric,
    ptap_pct numeric,
    pl numeric,
    dpr numeric,
    liv numeric,
    scs numeric,
    mast numeric,
    met numeric,
    rp numeric,
    da numeric,
    ket numeric,
    mf numeric,
    ptat numeric,
    udc numeric,
    flc numeric,
    sce numeric,
    dce numeric,
    ssb numeric,
    dsb numeric,
    h_liv numeric,
    ccr numeric,
    hcr numeric,
    fi numeric,
    bwc numeric,
    sta numeric,
    str numeric,
    dfm numeric,
    rua numeric,
    rls numeric,
    rtp numeric,
    ftl numeric,
    rw numeric,
    rlr numeric,
    fta numeric,
    fls numeric,
    fua numeric,
    ruh numeric,
    ruw numeric,
    ucl numeric,
    udp numeric,
    ftp numeric,
    rfi numeric,
    gfi numeric,
    found boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    normalized_naab TEXT;
BEGIN
    normalized_naab := public.normalize_naab(naab);
    
    IF normalized_naab IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        bd.id,
        bd.code,
        bd.name,
        bd.company,
        bd.hhp_dollar,
        bd.tpi,
        bd.nm_dollar,
        bd.cm_dollar,
        bd.fm_dollar,
        bd.gm_dollar,
        bd.f_sav,
        bd.ptam,
        bd.cfp,
        bd.ptaf,
        bd.ptaf_pct,
        bd.ptap,
        bd.ptap_pct,
        bd.pl,
        bd.dpr,
        bd.liv,
        bd.scs,
        bd.mast,
        bd.met,
        bd.rp,
        bd.da,
        bd.ket,
        bd.mf,
        bd.ptat,
        bd.udc,
        bd.flc,
        bd.sce,
        bd.dce,
        bd.ssb,
        bd.dsb,
        bd.h_liv,
        bd.ccr,
        bd.hcr,
        bd.fi,
        bd.bwc,
        bd.sta,
        bd.str,
        bd.dfm,
        bd.rua,
        bd.rls,
        bd.rtp,
        bd.ftl,
        bd.rw,
        bd.rlr,
        bd.fta,
        bd.fls,
        bd.fua,
        bd.ruh,
        bd.ruw,
        bd.ucl,
        bd.udp,
        bd.ftp,
        bd.rfi,
        bd.gfi,
        TRUE as found
    FROM public.bulls_denorm bd
    WHERE public.normalize_naab(bd.code) = normalized_naab
    LIMIT 1;
END;
$$;