"""
Выгружает вакансии по слову «аналитик» из открытого API портала «Работа России»
(https://opendata.trudvsem.ru/) и сохраняет их в data/vacancies.tsv.

Навыки размечаются регулярными выражениями по названию, требованиям и обязанностям,
чтобы не хранить длинные тексты. Запуск: python projects/analyst-market/fetch_vacancies.py
"""
import csv
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

BASE = "https://opendata.trudvsem.ru/api/v1/vacancies"
OUT = Path(__file__).resolve().parent / "data" / "vacancies.tsv"
SKILLS = {
    "sql": r"\bsql\b|postgres|clickhouse|mysql|oracle|t-sql",
    "python": r"python|pandas|питон",
    "excel": r"excel|эксель|vba|сводн",
    "bi": r"power ?bi|tableau|datalens|qlik|superset|looker|metabase",
    "stat": r"статистик|a/b|ab-тест|а/б|гипотез|регресси",
    "c1": r"1с|1c",
    "mp": r"маркетплейс|wildberries|ozon|озон|вайлдберриз",
    "bpmn": r"bpmn|uml|сбор\w* требовани|техническ\w* задани",   # в выгрузке 21.10.2026 шаблон был шире, см. ноутбук
    "ml": r"машинн\w* обучен|machine learning|\bml\b",
}
COLUMNS = ["id", "region", "company", "job_name", "salary_min", "salary_max", "schedule", "employment",
           "experience_years", "education", "category", "created", "workplace_type", "skill_flags"]


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "portfolio-analysis"}), timeout=60) as r:
        return json.load(r)


def main(text="аналитик"):
    rows, page = [], 0
    while True:
        data = get(f"{BASE}?text={urllib.parse.quote(text)}&limit=100&offset={page}")
        vacancies = (data.get("results") or {}).get("vacancies") or []
        if not vacancies:
            break
        for item in vacancies:
            v = item["vacancy"]
            blob = " ".join(str(x) for x in [v.get("job-name"), v.get("requirements"), v.get("duty"), v.get("skills"), v.get("qualification")])
            flags = "|".join(k for k, rx in SKILLS.items() if re.search(rx, blob, flags=re.I))
            req = v.get("requirement") or {}
            rows.append([v.get("id"), (v.get("region") or {}).get("name"), (v.get("company") or {}).get("name"), v.get("job-name"),
                         v.get("salary_min") or "", v.get("salary_max") or "", v.get("schedule") or "", v.get("employment") or "",
                         req.get("experience", ""), req.get("education", ""), (v.get("category") or {}).get("specialisation", ""),
                         v.get("creation-date", ""), "", flags])
        page += 1
        time.sleep(0.5)
    OUT.parent.mkdir(exist_ok=True)
    with OUT.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter="\t")
        w.writerow(COLUMNS)
        w.writerows([[str(x).replace("\t", " ").replace("\n", " ") for x in r] for r in rows])
    print(f"Сохранено {len(rows)} вакансий в {OUT}")


if __name__ == "__main__":
    main()
