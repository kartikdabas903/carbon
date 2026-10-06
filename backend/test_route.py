from main import get_recommendations
try:
    recs = get_recommendations()
    for r in recs:
        print(r.title)
except Exception as e:
    print(f"Failed: {e}")
