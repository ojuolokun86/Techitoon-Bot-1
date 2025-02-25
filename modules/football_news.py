import os
import requests
from dotenv import load_dotenv

# Load API keys from .env
load_dotenv()
FOOTBALL_API_KEY = os.getenv("FOOTBALL_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# Get live scores of top European leagues
def get_live_scores():
    url = "https://api.football-data.org/v4/matches"
    headers = {"X-Auth-Token": FOOTBALL_API_KEY}
    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        return "⚠️ Error fetching live scores. Try again later."

    matches = response.json().get("matches", [])
    if not matches:
        return "No live matches at the moment."

    scores = "⚽ *Live Scores:* ⚽\n\n"
    for match in matches:
        home = match["homeTeam"]["name"]
        away = match["awayTeam"]["name"]
        score = match["score"]
        scores += f"{home} {score['fullTime']['home']} - {score['fullTime']['away']} {away}\n"

    return scores

# Get football news
def get_football_news():
    url = f"https://newsapi.org/v2/top-headlines?category=sports&q=football&apiKey={NEWS_API_KEY}"
    response = requests.get(url)

    if response.status_code != 200:
        return "⚠️ Error fetching football news. Try again later."

    articles = response.json().get("articles", [])[:5]
    if not articles:
        return "No latest football news."

    news = "📰 *Football News:* 📰\n\n"
    for article in articles:
        news += f"🔹 {article['title']}\n🔗 {article['url']}\n\n"

    return news

# Get match highlights (placeholder function)
def get_match_highlights():
    return "📹 Match highlights will be added soon!"  # Replace with actual highlight fetching logic

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "news":
            print(get_football_news())
        elif command == "highlight":
            print(get_match_highlights())
    else:
        print(get_live_scores())
