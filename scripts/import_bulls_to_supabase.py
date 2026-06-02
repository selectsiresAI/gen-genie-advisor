"""
import_bulls_to_supabase.py
Importa 258k touros do bulls.csv para a tabela public.bulls no Supabase.
Usa UPSERT (on conflict naab_code) via PostgREST API com service_role_key.

Uso:
  python scripts/import_bulls_to_supabase.py <service_role_key>
"""

import csv
import json
import os
import sys
import time
from pathlib import Path

import requests

# --- Config ---
SUPABASE_URL = "https://odactdxpecpiyiyaqfgi.supabase.co"
CSV_PATH = Path(__file__).parent.parent / "sms-engine" / "data" / "bulls.csv"
BATCH_SIZE = 500
TABLE = "bulls"

SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# --- Real table columns (from Supabase schema) ---
# All writable columns with their types
# Columns we will populate from the CSV:
#   naab_code (TEXT, UNIQUE), name, short_name, registration, birth_date, company,
#   pedigree, sire_naab (parsed), code_normalized,
#   beta_casein, kappa_casein,
#   tpi, nm_dollar, cm_dollar, fm_dollar, gm_dollar, hhp_dollar,
#   pta_milk, cfp, pta_fat, pta_fat_pct, pta_protein, pta_protein_pct,
#   pta_pl, pta_dpr, pta_livability, pta_scs, pta_ptat, pta_udc, pta_flc,
#   pta_sce, pta_ccr, pta_hcr,
#   mast, met, rp, da, ket, mf_num, h_liv, fi, f_sav,
#   ssb, dsb, bwc, sta, str_num, dfm, rua, rls, rtp, ftl,
#   rw, rlr, fta, fls, fua, ruh, ruw, ucl, udp, ftp, rfi, gfi, gl

# CSV header -> Supabase column (numeric)
NUMERIC_MAP = {
    "TPI": "tpi",
    "NM$": "nm_dollar",
    "CM$": "cm_dollar",
    "FM$": "fm_dollar",
    "GM$": "gm_dollar",
    "PTAM": "pta_milk",
    "CFP": "cfp",
    "PTAF": "pta_fat",
    "PTAF%": "pta_fat_pct",
    "PTAP": "pta_protein",
    "PTAP%": "pta_protein_pct",
    "PL": "pta_pl",
    "DPR": "pta_dpr",
    "LIV": "pta_livability",
    "SCS": "pta_scs",
    "PTAT": "pta_ptat",
    "UDC": "pta_udc",
    "FLC": "pta_flc",
    "SCE": "pta_sce",
    "CCR": "pta_ccr",
    "HCR": "pta_hcr",
    "MAST": "mast",
    "MET": "met",
    "RP": "rp",
    "DA": "da",
    "KET": "ket",
    "MF": "mf_num",
    "SSB": "ssb",
    "DSB": "dsb",
    "BWC": "bwc",
    "STA": "sta",
    "STR": "str_num",
    "DFM": "dfm",
    "RUA": "rua",
    "RLS": "rls",
    "RTP": "rtp",
    "FTL": "ftl",
    "RW": "rw",
    "RLR": "rlr",
    "FTA": "fta",
    "FLS": "fls",
    "FUA": "fua",
    "RUH": "ruh",
    "RUW": "ruw",
    "UCL": "ucl",
    "UDP": "udp",
    "FTP": "ftp",
    "RFI": "rfi",
    "GFI": "gfi",
    "FERT_INDEX": "fi",
    "F_SAV": "f_sav",
}

# All DB columns we write (for uniform keys in every row)
ALL_DB_COLUMNS = [
    "naab_code", "name", "short_name", "registration", "birth_date",
    "company", "pedigree", "code_normalized",
    "beta_casein", "kappa_casein", "ativo",
    # numeric traits
    "tpi", "nm_dollar", "cm_dollar", "fm_dollar", "gm_dollar", "hhp_dollar",
    "pta_milk", "cfp", "pta_fat", "pta_fat_pct", "pta_protein", "pta_protein_pct",
    "pta_pl", "pta_dpr", "pta_livability", "pta_scs", "pta_ptat", "pta_udc", "pta_flc",
    "pta_sce", "pta_ccr", "pta_hcr",
    "mast", "met", "rp", "da", "ket", "mf_num", "h_liv", "fi", "f_sav",
    "ssb", "dsb", "bwc", "sta", "str_num", "dfm", "rua", "rls", "rtp", "ftl",
    "rw", "rlr", "fta", "fls", "fua", "ruh", "ruw", "ucl", "udp", "ftp",
    "rfi", "gfi", "gl",
]


def safe_float(val):
    if not val or not isinstance(val, str) or val.strip() == "":
        return None
    try:
        return float(val.replace(",", ""))
    except (ValueError, TypeError):
        return None


def parse_date(val):
    if not val or val.strip() == "":
        return None
    val = val.strip()
    if len(val) == 8 and val.isdigit():
        return f"{val[:4]}-{val[4:6]}-{val[6:8]}"
    parts = val.split("/")
    if len(parts) == 3:
        month, day, year = parts
        if len(year) == 2:
            year = f"19{year}" if int(year) > 50 else f"20{year}"
        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    return None


def normalize_naab(code):
    """Normalize NAAB code: uppercase, remove spaces/hyphens, strip leading zeros."""
    n = code.strip().replace(" ", "").replace("-", "").upper()
    # Remove leading zeros before digits+letters: 007HO -> 7HO, 011HO -> 11HO
    import re
    n = re.sub(r'^0+([1-9]\d*[A-Z]+)', r'\1', n)
    n = re.sub(r'^0+([A-Z]+)', r'\1', n)
    return n


def row_to_bull(row):
    """Convert a CSV row dict to a Supabase bull record with uniform keys."""
    naab = (row.get("\ufeffNAAB") or row.get("NAAB", "")).strip()
    if not naab:
        return None

    bull = {col: None for col in ALL_DB_COLUMNS}

    bull["naab_code"] = naab
    bull["code_normalized"] = normalize_naab(naab)
    bull["name"] = row.get("Name", "").strip() or naab
    bull["short_name"] = row.get("Registration Name", "").strip() or None
    bull["registration"] = row.get("Registration Name", "").strip() or None
    bull["birth_date"] = parse_date(row.get("Birthdate", "") or row.get("DOB_RAW", ""))
    bull["company"] = row.get("LINEUP", "").strip() or None
    bull["pedigree"] = row.get("Sire Stack", "").strip() or None
    bull["ativo"] = True

    # Beta/Kappa casein
    bull["beta_casein"] = row.get("Beta-Casein", "").strip() or None
    bull["kappa_casein"] = row.get("Kappa-Casein", "").strip() or None

    # Numeric traits from mapping
    for csv_col, db_col in NUMERIC_MAP.items():
        bull[db_col] = safe_float(row.get(csv_col, ""))

    # HHP$ with ® symbol fallback
    hhp = safe_float(row.get("HHP$\u00ae", ""))
    if hhp is None:
        hhp = safe_float(row.get("HHP$", ""))
    bull["hhp_dollar"] = hhp

    # DCE -> pta_sce already mapped as SCE; also check DCE
    # GL
    bull["gl"] = safe_float(row.get("GL", ""))

    # h_liv (Heifer Livability)
    for col in ["H LIV", "Heifer Livability", "HLIV"]:
        if col in row:
            bull["h_liv"] = safe_float(row.get(col, ""))
            break

    # f_sav fallback names
    if bull["f_sav"] is None:
        for col in ["Feed Saved", "FSAV"]:
            if col in row:
                bull["f_sav"] = safe_float(row.get(col, ""))
                break

    return bull


def upsert_batch(session, bulls, batch_num, total_batches):
    """UPSERT a batch of bulls via PostgREST."""
    url = f"{SUPABASE_URL}/rest/v1/{TABLE}"
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    resp = session.post(url, headers=headers, json=bulls, timeout=120)

    if resp.status_code in (200, 201):
        return True
    else:
        print(f"  ERRO batch {batch_num}/{total_batches}: {resp.status_code} - {resp.text[:500]}")
        return False


def main():
    global SERVICE_ROLE_KEY

    if not SERVICE_ROLE_KEY:
        if len(sys.argv) > 1:
            SERVICE_ROLE_KEY = sys.argv[1]
        else:
            print("ERRO: Defina SUPABASE_SERVICE_ROLE_KEY ou passe como argumento.")
            sys.exit(1)

    if not CSV_PATH.exists():
        print(f"ERRO: CSV nao encontrado: {CSV_PATH}")
        sys.exit(1)

    print(f"Lendo {CSV_PATH}...")
    t0 = time.time()

    bulls = []
    skipped = 0
    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            bull = row_to_bull(row)
            if bull:
                bulls.append(bull)
            else:
                skipped += 1

    elapsed = time.time() - t0
    print(f"  {len(bulls)} touros lidos, {skipped} ignorados ({elapsed:.1f}s)")

    # Verify uniform keys
    key_set = set(tuple(sorted(b.keys())) for b in bulls[:100])
    if len(key_set) > 1:
        print("ERRO: keys nao uniformes!")
        sys.exit(1)
    print(f"  {len(bulls[0])} colunas por registro")

    # Upload in batches
    total_batches = (len(bulls) + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"Enviando {len(bulls)} touros em {total_batches} batches de {BATCH_SIZE}...")

    session = requests.Session()
    success = 0
    errors = 0
    t0 = time.time()

    for i in range(0, len(bulls), BATCH_SIZE):
        batch_num = i // BATCH_SIZE + 1
        batch = bulls[i : i + BATCH_SIZE]

        if upsert_batch(session, batch, batch_num, total_batches):
            success += len(batch)
        else:
            errors += len(batch)

        if batch_num % 50 == 0 or batch_num == total_batches:
            elapsed = time.time() - t0
            rate = success / elapsed if elapsed > 0 else 0
            print(f"  [{batch_num}/{total_batches}] {success} ok, {errors} erros ({rate:.0f} touros/s)")

    elapsed = time.time() - t0
    print(f"\nConcluido em {elapsed:.1f}s")
    print(f"  Sucesso: {success}")
    print(f"  Erros:   {errors}")
    print(f"  Total:   {success + errors}")


if __name__ == "__main__":
    main()
