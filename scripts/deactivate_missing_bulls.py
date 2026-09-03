"""
deactivate_missing_bulls.py
Marca ativo=false os touros que estao no banco Supabase (public.bulls) mas
NAO aparecem no bulls.csv recem-gerado (descontinuados/removidos do arquivo
oficial). NAO faz DELETE fisico -- preserva FKs (farm_bull_picks,
semen_inventory, matings, predicoes historicas) e o proprio bull_naab_aliases.

Uso:
  python scripts/deactivate_missing_bulls.py --dry-run
  python scripts/deactivate_missing_bulls.py           # aplica de verdade

Requer SUPABASE_SERVICE_ROLE_KEY no ambiente.
"""

import csv
import os
import re
import sys
import time
from pathlib import Path

import requests

# Variantes de codigo de raca (formato legado 2 letras -> formato atual 1 letra),
# conforme a mesma equivalencia ja usada pelo lookup do ToolSS (get_bull_by_naab).
BREED_ALIASES = {"HO": "H", "JE": "J", "BS": "B", "AY": "A", "GU": "G", "MS": "M"}


def canonical_key(naab):
    """naab_code -> chave canonica p/ diff (remove zeros a esquerda + normaliza raca)."""
    n = naab.strip().replace(" ", "").replace("-", "").upper()
    n = re.sub(r"^0+([1-9]\d*[A-Z]+)", r"\1", n)
    n = re.sub(r"^0+([A-Z]+)", r"\1", n)
    m = re.match(r"^(\d*)([A-Z]+)(\d+)$", n)
    if m:
        stud, breed, bnum = m.groups()
        breed = BREED_ALIASES.get(breed, breed)
        n = f"{stud}{breed}{bnum}"
    return n

SUPABASE_URL = "https://odactdxpecpiyiyaqfgi.supabase.co"
CSV_PATH = Path(__file__).parent.parent / "sms-engine" / "data" / "bulls.csv"
TABLE = "bulls"
PAGE_SIZE = 1000
PATCH_BATCH_SIZE = 200

SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


def headers():
    return {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


def load_new_naabs():
    naabs = set()
    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            naab = (row.get("﻿NAAB") or row.get("NAAB", "")).strip()
            if naab:
                naabs.add(naab)
    return naabs


def fetch_active_naabs(session):
    """Pagina toda a tabela bulls (naab_code, ativo) usando keyset pagination
    (naab_code > cursor) -- OFFSET/LIMIT degrada em tabelas grandes."""
    naabs = {}
    cursor = ""
    total = 0
    while True:
        filt = f"&naab_code=gt.{cursor}" if cursor else ""
        url = (
            f"{SUPABASE_URL}/rest/v1/{TABLE}"
            f"?select=naab_code,ativo&order=naab_code.asc&limit={PAGE_SIZE}{filt}"
        )
        resp = session.get(url, headers=headers(), timeout=60)
        if resp.status_code != 200:
            print(f"ERRO paginando bulls (cursor={cursor}): {resp.status_code} - {resp.text[:300]}")
            sys.exit(1)
        rows = resp.json()
        if not rows:
            break
        for r in rows:
            naabs[r["naab_code"]] = r.get("ativo")
        cursor = rows[-1]["naab_code"]
        total += len(rows)
        if total % 20000 == 0:
            print(f"  lidos {total:,} touros do banco...")
        if len(rows) < PAGE_SIZE:
            break
    return naabs


def patch_batch(session, naab_codes, active_flag):
    url = f"{SUPABASE_URL}/rest/v1/{TABLE}?naab_code=in.({','.join(naab_codes)})"
    resp = session.patch(url, headers=headers(), json={"ativo": active_flag}, timeout=60)
    return resp.status_code in (200, 204), resp


def main():
    dry_run = "--dry-run" in sys.argv

    if not SERVICE_ROLE_KEY:
        print("ERRO: defina SUPABASE_SERVICE_ROLE_KEY no ambiente.")
        sys.exit(1)
    if not CSV_PATH.exists():
        print(f"ERRO: {CSV_PATH} nao encontrado. Rode convert_newbms.py antes.")
        sys.exit(1)

    print("Lendo bulls.csv (arquivo novo)...")
    new_naabs = load_new_naabs()
    new_keys = {canonical_key(n) for n in new_naabs}
    print(f"  {len(new_naabs):,} NAABs no arquivo novo ({len(new_keys):,} chaves canonicas)")

    print("Paginando tabela bulls no Supabase (naab_code, ativo)...")
    session = requests.Session()
    db_naabs = fetch_active_naabs(session)
    print(f"  {len(db_naabs):,} touros no banco")

    # Diff por CHAVE CANONICA (zeros a esquerda + raca HO/JE/BS -> H/J/B), nao por
    # string exata -- naab_code legado (2-letras raca) e naab_code atual (1-letra)
    # podem ser o MESMO touro fisico. Comparar cru gera falso-positivo massivo.
    db_by_key = {}
    for naab, ativo in db_naabs.items():
        db_by_key.setdefault(canonical_key(naab), []).append((naab, ativo))

    to_deactivate = []
    to_reactivate = []
    for key, entries in db_by_key.items():
        present_in_new = key in new_keys
        for naab, ativo in entries:
            if ativo is True and not present_in_new:
                to_deactivate.append(naab)
            elif ativo is False and present_in_new:
                to_reactivate.append(naab)
    to_deactivate.sort()
    to_reactivate.sort()

    print(f"\nDiagnostico:")
    print(f"  Touros ativos no banco ausentes do arquivo novo (candidatos a ativo=false): {len(to_deactivate):,}")
    print(f"  Touros inativos no banco que VOLTARAM a aparecer no arquivo novo (candidatos a ativo=true): {len(to_reactivate):,}")
    if to_deactivate:
        print(f"  Amostra a desativar: {to_deactivate[:20]}")

    if dry_run:
        print("\n[--dry-run] Nenhuma escrita realizada.")
        return

    if to_deactivate:
        print(f"\nDesativando {len(to_deactivate):,} touros...")
        for i in range(0, len(to_deactivate), PATCH_BATCH_SIZE):
            batch = to_deactivate[i : i + PATCH_BATCH_SIZE]
            ok, resp = patch_batch(session, batch, False)
            if not ok:
                print(f"  ERRO batch {i//PATCH_BATCH_SIZE + 1}: {resp.status_code} - {resp.text[:300]}")
            if (i // PATCH_BATCH_SIZE) % 20 == 0:
                print(f"  [{i + len(batch)}/{len(to_deactivate)}] processados")

    if to_reactivate:
        print(f"\nReativando {len(to_reactivate):,} touros que voltaram...")
        for i in range(0, len(to_reactivate), PATCH_BATCH_SIZE):
            batch = to_reactivate[i : i + PATCH_BATCH_SIZE]
            ok, resp = patch_batch(session, batch, True)
            if not ok:
                print(f"  ERRO batch {i//PATCH_BATCH_SIZE + 1}: {resp.status_code} - {resp.text[:300]}")

    print("\nConcluido.")


if __name__ == "__main__":
    main()
