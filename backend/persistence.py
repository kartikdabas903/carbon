import os
from typing import Any

from supabase import Client, create_client


_client: Client | None = None


def configured() -> bool:
    return bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY"))


def _db() -> Client:
    global _client
    if not configured():
        raise RuntimeError("Cloud accounts are not configured. Add the Supabase backend settings.")
    if _client is None:
        _client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    return _client


def user_id_from_token(access_token: str) -> str:
    try:
        user = _db().auth.get_user(access_token).user
    except Exception as exc:
        raise ValueError("Your session is invalid or expired. Sign in again.") from exc
    if user is None:
        raise ValueError("Your session is invalid or expired. Sign in again.")
    return str(user.id)


def save_history_entry(user_id: str, entry: dict[str, Any]) -> None:
    db = _db()
    prediction = dict(entry.get("prediction") or {})
    recommendations = prediction.pop("recommendations", []) or []
    request = dict(entry.get("request") or {})
    prediction_id = str(entry["id"])
    created_at = entry.get("createdAt")

    db.table("predictions").upsert({
        "id": prediction_id,
        "user_id": user_id,
        "prompt": str(request.get("prompt") or "")[:2000],
        "request": request,
        "prediction": prediction,
        "kind": entry.get("kind") or "prediction",
        "created_at": created_at,
    }).execute()

    db.table("recommendations").delete().eq("user_id", user_id).eq("prediction_id", prediction_id).execute()
    if recommendations:
        db.table("recommendations").insert([
            {
                "id": str(recommendation["id"]),
                "user_id": user_id,
                "prediction_id": prediction_id,
                "data": recommendation,
            }
            for recommendation in recommendations
        ]).execute()

    choice = entry.get("choice")
    if choice:
        db.table("chosen_actions").upsert({
            "prediction_id": prediction_id,
            "user_id": user_id,
            "recommendation_id": choice.get("recommendationId"),
            "choice": choice,
        }).execute()
    else:
        db.table("chosen_actions").delete().eq("user_id", user_id).eq("prediction_id", prediction_id).execute()


def save_history(user_id: str, entries: list[dict[str, Any]]) -> None:
    for entry in entries[:50]:
        if entry.get("id") and isinstance(entry.get("prediction"), dict):
            save_history_entry(user_id, entry)


def delete_history_entry(user_id: str, prediction_id: str) -> None:
    _db().table("predictions").delete().eq("user_id", user_id).eq("id", prediction_id).execute()


def clear_user_history(user_id: str) -> None:
    _db().table("predictions").delete().eq("user_id", user_id).execute()


def get_history(user_id: str) -> list[dict[str, Any]]:
    db = _db()
    predictions = db.table("predictions").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(50).execute().data or []
    ids = [row["id"] for row in predictions]
    if not ids:
        return []

    recommendation_rows = db.table("recommendations").select("id,prediction_id,data").eq("user_id", user_id).in_("prediction_id", ids).execute().data or []
    choices = db.table("chosen_actions").select("prediction_id,choice").eq("user_id", user_id).in_("prediction_id", ids).execute().data or []
    recommendations_by_prediction: dict[str, list[dict[str, Any]]] = {}
    for row in recommendation_rows:
        recommendations_by_prediction.setdefault(row["prediction_id"], []).append(row["data"])
    choices_by_prediction = {row["prediction_id"]: row["choice"] for row in choices}

    entries = []
    for row in predictions:
        prediction = dict(row.get("prediction") or {})
        prediction["recommendations"] = recommendations_by_prediction.get(row["id"], [])
        entry = {
            "id": row["id"],
            "createdAt": row["created_at"],
            "request": row.get("request") or {"prompt": row.get("prompt", "")},
            "prediction": prediction,
            "kind": row.get("kind", "prediction"),
        }
        if row["id"] in choices_by_prediction:
            entry["choice"] = choices_by_prediction[row["id"]]
        entries.append(entry)
    return entries


def save_choice(user_id: str, prediction_id: str, choice: dict[str, Any] | None) -> None:
    db = _db()
    if choice:
        db.table("chosen_actions").upsert({
            "prediction_id": prediction_id,
            "user_id": user_id,
            "recommendation_id": choice.get("recommendationId"),
            "choice": choice,
        }).execute()
    else:
        db.table("chosen_actions").delete().eq("user_id", user_id).eq("prediction_id", prediction_id).execute()


def get_goal(user_id: str) -> dict[str, Any] | None:
    rows = _db().table("user_goals").select("reduction_pct,target_year").eq("user_id", user_id).limit(1).execute().data or []
    if not rows:
        return None
    return {"reductionPct": rows[0]["reduction_pct"], "targetYear": rows[0]["target_year"]}


def save_goal(user_id: str, reduction_pct: int, target_year: int) -> dict[str, Any]:
    row = _db().table("user_goals").upsert({
        "user_id": user_id,
        "reduction_pct": reduction_pct,
        "target_year": target_year,
    }).execute().data[0]
    return {"reductionPct": row["reduction_pct"], "targetYear": row["target_year"]}


def get_monthly_budget(user_id: str) -> float | None:
    rows = _db().table("user_preferences").select("monthly_budget_kg").eq("user_id", user_id).limit(1).execute().data or []
    return float(rows[0]["monthly_budget_kg"]) if rows else None


def save_monthly_budget(user_id: str, monthly_budget_kg: float) -> float:
    row = _db().table("user_preferences").upsert({
        "user_id": user_id,
        "monthly_budget_kg": monthly_budget_kg,
    }).execute().data[0]
    return float(row["monthly_budget_kg"])


def user_context(user_id: str) -> str:
    db = _db()
    goal = get_goal(user_id)
    selected = db.table("chosen_actions").select("choice").eq("user_id", user_id).order("created_at", desc=True).limit(5).execute().data or []
    recent = db.table("predictions").select("prompt").eq("user_id", user_id).order("created_at", desc=True).limit(5).execute().data or []
    parts = []
    if goal:
        parts.append(f"User-approved goal: reduce emissions by {goal['reductionPct']}% by {goal['targetYear']}.")
    choices = [str((row.get("choice") or {}).get("title", "")).strip() for row in selected]
    choices = [title for title in choices if title]
    if choices:
        parts.append("Recent chosen changes: " + "; ".join(choices) + ".")
    prompts = [str(row.get("prompt", "")).strip() for row in recent]
    prompts = [prompt for prompt in prompts if prompt]
    if prompts:
        parts.append("Recent plans (for personalization only): " + "; ".join(prompts) + ".")
    return " ".join(parts)[:1500]