"""
Выполняет все запросы из queries.sql на data/marketplace.db и собирает README.md:
вопрос → SQL → результат → вывод. Выводы лежат в conclusions.md (по заголовкам «## @N»).

Запуск из корня репозитория: python projects/sql-marketplace/run_queries.py
"""
from pathlib import Path
import re
import sqlite3
import pandas as pd

HERE = Path(__file__).resolve().parent
DB = HERE.parents[1] / "data" / "marketplace.db"

def blocks(sql_text: str):
    parts = re.split(r"^-- @(\d+) (.+)$", sql_text, flags=re.M)
    for i in range(1, len(parts), 3):
        num, title, body = parts[i], parts[i + 1].strip(), parts[i + 2]
        q = re.search(r"^-- Вопрос: (.+)$", body, flags=re.M)
        body = re.sub(r"^-- Вопрос: .+\n", "", body, flags=re.M).strip()
        yield int(num), title, q.group(1).strip() if q else "", body

def fmt(v):
    if isinstance(v, float):
        if v.is_integer():
            return f"{int(v):,}".replace(",", " ")
        return f"{v:,.2f}".replace(",", " ").rstrip("0").rstrip(".").replace(".", ",")
    if isinstance(v, int):
        return f"{v:,}".replace(",", " ")
    return "—" if v is None else str(v)

def to_md(df: pd.DataFrame) -> str:
    head = "| " + " | ".join(df.columns) + " |"
    sep = "|" + "|".join("---:" if pd.api.types.is_numeric_dtype(df[c]) else "---" for c in df.columns) + "|"
    rows = ["| " + " | ".join(fmt(v) for v in r) + " |" for r in df.astype(object).where(df.notna(), None).itertuples(index=False)]
    return "\n".join([head, sep, *rows])

def conclusions():
    path = HERE / "conclusions.md"
    if not path.exists():
        return {}
    parts = re.split(r"^## @(\d+)\s*$", path.read_text(encoding="utf-8"), flags=re.M)
    return {int(parts[i]): parts[i + 1].strip() for i in range(1, len(parts), 2)}

def main():
    con = sqlite3.connect(DB)
    concl = conclusions()
    intro = (HERE / "intro.md").read_text(encoding="utf-8") if (HERE / "intro.md").exists() else ""
    out = [intro.strip(), ""]
    toc = []
    for num, title, question, sql in blocks((HERE / "queries.sql").read_text(encoding="utf-8")):
        df = pd.read_sql_query(sql, con)
        toc.append(f"{num}. [{title}](#{num}-{title.lower().replace(' ', '-').replace(':', '').replace(',', '').replace('—', '').replace('.', '')})")
        out += [f"## {num}. {title}", "", f"**Вопрос.** {question}", "",
                "<details><summary>SQL-запрос</summary>", "", "```sql", sql, "```", "", "</details>", "",
                to_md(df), ""]
        if num in concl:
            out += [f"**Вывод.** {concl[num]}", ""]
        print(f"@{num} {title}: {len(df)} строк")
        print(df.to_string(index=False)[:2500], "\n")
    text = "\n".join(out).replace("{{TOC}}", "\n".join(toc))
    (HERE / "README.md").write_text(text + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
