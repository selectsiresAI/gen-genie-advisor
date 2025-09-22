-- Inserir touros de exemplo no banco
INSERT INTO bulls (code, name, registration, birth_date, sire_naab, mgs_naab, mmgs_naab, ptas) VALUES 
(
  '11HO15933',
  'LADYS-MANOR PK ALTAMONT-ET', 
  'HOLUSA000142457321',
  '2018-12-15',
  '7HO13386',
  '11HO11478', 
  '1HO09918',
  '{
    "nm_dollar": 1247, "fm_dollar": 1180, "gm_dollar": 1089, "cm_dollar": 1156, "hhp_dollar": 1098,
    "tpi": 2856, "ptam": 65, "ptaf": 89, "ptaf_pct": 0.15, "ptap": 75, "ptap_pct": 0.08,
    "pl": 6.8, "liv": 2.1, "scs": 2.89, "dpr": 1.8, "cfp": -0.8, "ptat": 1.89,
    "udc": 1.45, "flc": 0.78, "fls": 0.95, "fua": 1.23, "ruh": 0.87, "ruw": 1.12,
    "rlr": 0.94, "rls": 1.08, "rtp": 0.76, "str": 1.34, "dfm": 0.89, "rua": 1.67,
    "ftl": 0.98, "fta": 1.12, "ftp": 0.85, "rw": 1.05, "ucl": 1.23, "udp": 1.45,
    "rfi": 1.2, "gfi": -0.3, "ssb": 108, "dsb": 106, "dce": 105, "sce": 103,
    "h_liv": 102, "ccr": 104, "hcr": 103, "fi": 105, "gl": 102, "efc": 104,
    "bwc": 106, "sta": 108, "mf": 0.15, "da": 108, "rp": 105, "met": 103,
    "mast": 104, "ket": 102, "f_sav": 102, "kappa_casein": "AA", "beta_casein": "A2A2"
  }'::jsonb
),
(
  '29HO21513',
  'PINE-TREE ACHIEVER-ET',
  'HOLUSA000142658974', 
  '2019-03-20',
  '11HO15933',
  '7HO13386',
  '11HO11478',
  '{
    "nm_dollar": 1098, "fm_dollar": 1045, "gm_dollar": 987, "cm_dollar": 1023, "hhp_dollar": 965,
    "tpi": 2634, "ptam": 58, "ptaf": 76, "ptaf_pct": 0.12, "ptap": 68, "ptap_pct": 0.06,
    "pl": 5.9, "liv": 1.8, "scs": 2.95, "dpr": 1.5, "cfp": -0.6, "ptat": 1.67,
    "udc": 1.28, "flc": 0.65, "fls": 0.82, "fua": 1.05, "ruh": 0.74, "ruw": 0.98,
    "rlr": 0.81, "rls": 0.94, "rtp": 0.63, "str": 1.18, "dfm": 0.76, "rua": 1.42,
    "ftl": 0.85, "fta": 0.98, "ftp": 0.72, "rw": 0.91, "ucl": 1.06, "udp": 1.28,
    "rfi": 1.05, "gfi": -0.2, "ssb": 105, "dsb": 104, "dce": 103, "sce": 102,
    "h_liv": 101, "ccr": 103, "hcr": 102, "fi": 104, "gl": 101, "efc": 103,
    "bwc": 105, "sta": 106, "mf": 0.12, "da": 105, "rp": 103, "met": 102,
    "mast": 103, "ket": 101, "f_sav": 101, "kappa_casein": "AB", "beta_casein": "A1A2"
  }'::jsonb
),
(
  '551HO05064',
  'WESTCOAST LAMBORGHINI-ET',
  'HOLUSA000142789632',
  '2020-01-10', 
  '29HO21513',
  '11HO15933',
  '7HO13386',
  '{
    "nm_dollar": 1356, "fm_dollar": 1298, "gm_dollar": 1234, "cm_dollar": 1276, "hhp_dollar": 1187,
    "tpi": 3012, "ptam": 72, "ptaf": 98, "ptaf_pct": 0.18, "ptap": 82, "ptap_pct": 0.09,
    "pl": 7.2, "liv": 2.3, "scs": 2.78, "dpr": 2.1, "cfp": -0.9, "ptat": 2.05,
    "udc": 1.62, "flc": 0.89, "fls": 1.08, "fua": 1.38, "ruh": 0.96, "ruw": 1.25,
    "rlr": 1.07, "rls": 1.21, "rtp": 0.84, "str": 1.47, "dfm": 0.98, "rua": 1.78,
    "ftl": 1.06, "fta": 1.23, "ftp": 0.94, "rw": 1.15, "ucl": 1.36, "udp": 1.58,
    "rfi": 1.35, "gfi": -0.4, "ssb": 112, "dsb": 110, "dce": 108, "sce": 106,
    "h_liv": 105, "ccr": 107, "hcr": 106, "fi": 108, "gl": 105, "efc": 107,
    "bwc": 109, "sta": 112, "mf": 0.18, "da": 112, "rp": 108, "met": 106,
    "mast": 107, "ket": 105, "f_sav": 105, "kappa_casein": "BB", "beta_casein": "A2A2"
  }'::jsonb
);