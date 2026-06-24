#!/usr/bin/env python3
"""Google Trends via pytrends — stdout JSON for Node integration."""
import json
import sys

def main():
    geo = sys.argv[1] if len(sys.argv) > 1 else "AZ"
    try:
        from pytrends.request import TrendReq

        pytrends = TrendReq(hl="az-AZ", tz=240, timeout=(10, 25))
        keywords = ["restaurant", "food delivery", "azerbaijan food", "coffee", "sushi"]
        pytrends.build_payload(keywords, timeframe="now 7-d", geo=geo)
        interest = pytrends.interest_over_time()
        trending = pytrends.trending_searches(pn="azerbaijan")

        trends = []
        if trending is not None and len(trending) > 0:
            for i, row in enumerate(trending.head(15).values):
                tag = str(row[0]).strip()
                if tag and not tag.startswith("#"):
                    tag = f"#{tag.replace(' ', '')}"
                trends.append(tag)

        scores = {}
        if interest is not None and not interest.empty:
            for col in keywords:
                if col in interest.columns:
                    scores[col] = int(interest[col].iloc[-1])

        print(
            json.dumps(
                {
                    "source": "google",
                    "trends": trends[:15] if trends else [f"#{k.replace(' ', '')}" for k in keywords],
                    "scores": scores,
                    "geo": geo,
                    "updatedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                }
            )
        )
    except Exception as e:
        print(json.dumps({"source": "google", "error": str(e), "trends": [], "updatedAt": None}))
        sys.exit(1)


if __name__ == "__main__":
    main()
