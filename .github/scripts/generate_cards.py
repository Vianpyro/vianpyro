#!/usr/bin/env python3
"""Generate SVG profile cards from the GitHub GraphQL API."""

import os
from datetime import datetime, timezone
from pathlib import Path

import requests

USERNAME: str = os.environ.get("GITHUB_USERNAME", "Vianpyro")
_TOKEN: str = os.environ["GH_TOKEN"]
OUTPUT_DIR: Path = Path(os.environ.get("OUTPUT_DIR", "assets/cards"))

_HEADERS = {
    "Authorization": f"Bearer {_TOKEN}",
    "X-GitHub-Api-Version": "2022-11-28",
}
_GQL_URL = "https://api.github.com/graphql"

_Q_REPOS = """
query($login: String!, $after: String) {
  user(login: $login) {
    repositories(
      ownerAffiliations: [OWNER, ORGANIZATION_MEMBER]
      isFork: false
      first: 100
      after: $after
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        stargazerCount
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }
      }
    }
  }
}
"""

_Q_CONTRIB = """
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays { contributionCount date }
        }
      }
    }
  }
}
"""


def _gql(query: str, variables: dict | None = None) -> dict:
    resp = requests.post(
        _GQL_URL,
        json={"query": query, "variables": variables or {}},
        headers=_HEADERS,
        timeout=30,
    )
    resp.raise_for_status()
    payload = resp.json()
    if "errors" in payload:
        raise RuntimeError(payload["errors"])
    return payload["data"]


def _fetch_repos() -> list:
    repos, cursor = [], None
    while True:
        page = _gql(_Q_REPOS, {"login": USERNAME, "after": cursor})["user"]["repositories"]
        repos.extend(page["nodes"])
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]
    return repos


def _compute_streak(weeks: list) -> int:
    days = sorted(
        (d for w in weeks for d in w["contributionDays"]),
        key=lambda d: d["date"],
        reverse=True,
    )
    streak = 0
    for day in days:
        if day["contributionCount"] > 0:
            streak += 1
        else:
            break
    return streak


def _accumulate_languages(repos: list) -> dict:
    totals: dict = {}
    for repo in repos:
        for edge in repo["languages"]["edges"]:
            name = edge["node"]["name"]
            color = edge["node"]["color"] or "#8b949e"
            totals.setdefault(name, {"color": color, "bytes": 0})["bytes"] += edge["size"]
    return totals


def _top_languages(repos: list, n: int = 8) -> list:
    totals = _accumulate_languages(repos)
    total = sum(v["bytes"] for v in totals.values()) or 1
    top = sorted(totals.items(), key=lambda x: x[1]["bytes"], reverse=True)[:n]
    return [
        {"name": name, "color": d["color"], "pct": round(d["bytes"] / total * 100, 1)}
        for name, d in top
    ]


def fetch_stats() -> dict:
    repos = _fetch_repos()
    col = _gql(_Q_CONTRIB, {"login": USERNAME})["user"]["contributionsCollection"]
    cal = col["contributionCalendar"]
    return {
        "repos": len(repos),
        "stars": sum(r["stargazerCount"] for r in repos),
        "commits": col["totalCommitContributions"],
        "prs": col["totalPullRequestContributions"],
        "contributions": cal["totalContributions"],
        "streak": _compute_streak(cal["weeks"]),
        "languages": _top_languages(repos),
    }


# ---------------------------------------------------------------------------
# SVG rendering
# ---------------------------------------------------------------------------

_W = 495
_UPDATED = datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _svg_defs(h: int) -> str:
    return (
        f'  <defs>\n'
        f'    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"'
        f' gradientUnits="objectBoundingBox">\n'
        f'      <stop offset="0%" stop-color="#0d1117"/>'
        f'<stop offset="100%" stop-color="#161b22"/>\n'
        f'    </linearGradient>\n'
        f'    <linearGradient id="ac" x1="0" y1="0" x2="1" y2="0"'
        f' gradientUnits="objectBoundingBox">\n'
        f'      <stop offset="0%" stop-color="#58a6ff"/>'
        f'<stop offset="100%" stop-color="#bc8cff"/>\n'
        f'    </linearGradient>\n'
        f'    <clipPath id="cl"><rect width="{_W}" height="{h}" rx="10"/></clipPath>\n'
        f'  </defs>'
    )


def _card_base(h: int, title: str) -> str:
    return (
        f'  <rect width="{_W}" height="{h}" rx="10" fill="url(#bg)"'
        f' stroke="rgba(255,255,255,0.08)" stroke-width="1"/>\n'
        f'  <rect width="{_W}" height="3" fill="url(#ac)" clip-path="url(#cl)"/>\n'
        f'  <text x="25" y="35" font-family="sans-serif" font-size="15"'
        f' font-weight="600" fill="#e6edf3">{title}</text>\n'
        f'  <line x1="25" y1="45" x2="470" y2="45"'
        f' stroke="rgba(255,255,255,0.08)" stroke-width="1"/>'
    )


def _stat_block(x: int, value: int, label: str, color: str) -> str:
    return (
        f'  <text x="{x}" y="98" font-family="monospace" font-size="24"'
        f' font-weight="bold" fill="{color}">{value:,}</text>\n'
        f'  <text x="{x}" y="117" font-family="sans-serif" font-size="11"'
        f' fill="#7d8590">{label}</text>\n'
    )


def _stacked_bar(languages: list, y: int) -> str:
    top_total = sum(l["pct"] for l in languages) or 1.0
    segs, x = [], 25.0
    for lang in languages:
        w = lang["pct"] / top_total * 445
        segs.append(
            f'  <rect x="{x:.1f}" y="{y}" width="{w:.1f}" height="8"'
            f' fill="{lang["color"]}"/>'
        )
        x += w
    return "\n".join(segs)


def _lang_row(i: int, lang: dict, max_pct: float) -> str:
    y = 68 + i * 26
    bar_w = int(lang["pct"] / max_pct * 240)
    return (
        f'  <circle cx="25" cy="{y + 6}" r="5" fill="{lang["color"]}"/>'
        f'<text x="38" y="{y + 11}" font-family="sans-serif" font-size="12"'
        f' fill="#e6edf3">{lang["name"]}</text>'
        f'<rect x="165" y="{y}" width="{bar_w}" height="13" rx="3"'
        f' fill="{lang["color"]}" opacity="0.75"/>'
        f'<text x="415" y="{y + 11}" font-family="monospace" font-size="11"'
        f' fill="#7d8590" text-anchor="end">{lang["pct"]}%</text>'
    )


def render_stats(s: dict) -> str:
    h = 195
    year = datetime.now(timezone.utc).year
    # 5 columns in 445px usable width (25px margin each side): step = 89px
    blocks = (
        _stat_block(25,  s["stars"],   "stars earned",  "#e3b341")
        + _stat_block(114, s["commits"], "commits / yr",  "#3fb950")
        + _stat_block(203, s["repos"],   "repositories",  "#bc8cff")
        + _stat_block(292, s["streak"],  "day streak",    "#f78166")
        + _stat_block(381, s["prs"],     "pull requests", "#58a6ff")
    )
    return "\n".join([
        f'<svg width="{_W}" height="{h}" viewBox="0 0 {_W} {h}"'
        f' xmlns="http://www.w3.org/2000/svg">',
        _svg_defs(h),
        _card_base(h, "Vianney&#39;s GitHub Stats"),
        f'  <text x="470" y="35" font-family="sans-serif" font-size="12"'
        f' fill="#7d8590" text-anchor="end">{year}</text>',
        blocks,
        f'  <text x="25" y="184" font-family="sans-serif" font-size="10"'
        f' fill="rgba(125,133,144,0.35)">Updated {_UPDATED}</text>',
        '</svg>',
    ])


def render_languages(languages: list) -> str:
    h = 60 + len(languages) * 26 + 30
    max_pct = languages[0]["pct"] if languages else 1.0
    rows = [_lang_row(i, lang, max_pct) for i, lang in enumerate(languages)]
    return "\n".join([
        f'<svg width="{_W}" height="{h}" viewBox="0 0 {_W} {h}"'
        f' xmlns="http://www.w3.org/2000/svg">',
        _svg_defs(h),
        _card_base(h, "Top Languages"),
        _stacked_bar(languages, 52),
        "\n".join(rows),
        f'  <text x="25" y="{h - 10}" font-family="sans-serif" font-size="10"'
        f' fill="rgba(125,133,144,0.35)">Updated {_UPDATED}</text>',
        '</svg>',
    ])


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stats = fetch_stats()
    (OUTPUT_DIR / "stats.svg").write_text(render_stats(stats), encoding="utf-8")
    (OUTPUT_DIR / "languages.svg").write_text(render_languages(stats["languages"]), encoding="utf-8")
    print(f"Generated cards in {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
