"""
retry_failed_batches.py
Reprocessa lotes especificos que falharam no import_bulls_to_supabase.py.
- Lotes de timeout (57014): reenvia o lote inteiro (transitorio).
- Lotes de colisao code_normalized (23505): identifica a(s) linha(s) cujo
  code_normalized colide com outra ja existente no banco, remove-a(s) do
  lote e reenvia o restante. As linhas excluidas sao reportadas no final
  para decisao manual (nao sao descartadas silenciosamente).
"""

import csv
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from import_bulls_to_supabase import row_to_bull, ALL_DB_COLUMNS  # noqa: E402

import requests

SUPABASE_URL = "https://odactdxpecpiyiyaqfgi.supabase.co"
CSV_PATH = Path(__file__).parent.parent / "sms-engine" / "data" / "bulls.csv"
TABLE = "bulls"
BATCH_SIZE = 500

SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

TIMEOUT_BATCHES = [71, 74, 76, 161, 216, 227, 282, 317, 399]
CONFLICT_BATCHES = {219: "4H01116", 313: "4H00826", 343: "4H00898", 404: "4H00778"}


def headers():
    return {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }


def load_all_bulls():
    bulls = []
    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            bull = row_to_bull(row)
            if bull:
                bulls.append(bull)
    return bulls


def send(session, bulls, label):
    url = f"{SUPABASE_URL}/rest/v1/{TABLE}?on_conflict=naab_code"
    for attempt in range(1, 4):
        try:
            resp = session.post(url, headers=headers(), json=bulls, timeout=120)
        except requests.exceptions.RequestException as e:
            if attempt == 3:
                print(f"  {label}: FALHOU (conexao) - {e}")
                return False
            time.sleep(2 * attempt)
            continue
        if resp.status_code in (200, 201):
            print(f"  {label}: OK ({len(bulls)} touros)")
            return True
        if resp.status_code in (429, 502, 503, 504) and attempt < 3:
            time.sleep(2 * attempt)
            continue
        print(f"  {label}: ERRO {resp.status_code} - {resp.text[:300]}")
        return False
    return False


def main():
    if not SERVICE_ROLE_KEY:
        print("ERRO: defina SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    print("Carregando bulls.csv completo...")
    bulls = load_all_bulls()
    print(f"  {len(bulls)} touros carregados")

    session = requests.Session()
    excluded_report = []

    print("\n=== Retentando lotes de timeout (transitorios) ===")
    for batch_num in TIMEOUT_BATCHES:
        start = (batch_num - 1) * BATCH_SIZE
        batch = bulls[start : start + BATCH_SIZE]
        send(session, batch, f"lote {batch_num}")

    print("\n=== Retentando lotes com colisao code_normalized ===")
    for batch_num, conflict_code in CONFLICT_BATCHES.items():
        start = (batch_num - 1) * BATCH_SIZE
        batch = bulls[start : start + BATCH_SIZE]
        offenders = [b for b in batch if b["code_normalized"] == conflict_code]
        clean_batch = [b for b in batch if b["code_normalized"] != conflict_code]
        for o in offenders:
            excluded_report.append((o["naab_code"], o["code_normalized"]))
        send(session, clean_batch, f"lote {batch_num} (excluindo {len(offenders)} linha(s) em colisao)")

    if excluded_report:
        print("\n=== NAABs excluidos por colisao de code_normalized (decisao manual) ===")
        for naab, cn in excluded_report:
            print(f"  naab_code={naab}  code_normalized={cn}")

    print("\nConcluido.")


if __name__ == "__main__":
    main()
