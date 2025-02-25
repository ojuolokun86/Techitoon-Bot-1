import requests
import json
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import schedule
import threading
import time

# Load environment variables
load_dotenv()
FOOTBALL_API_KEY = os.getenv("FOOTBALL_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL")
CHANNEL_ID = os.getenv("CHANNEL_ID")
BACKUP_NUMBER = os.getenv("BACKUP_NUMBER")  # The number allowed to start the bot

# Function to send messages to WhatsApp channel
def send_message_to_channel(message):
    url = f"{WHATSAPP_API_URL}/sendMessage"
    data = {
        "chat_id": CHANNEL_ID,
        "text": message
    }
    response = requests.post(url, json=data)
    return response.json()

# Function to get live scores from the football API
def get_live_scores():
    url = "https://api.football-data.org/v4/matches"
    headers = {"X-Auth-Token": FOOTBALL_API_KEY}
    
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        matches = data.get("matches", [])
        live_scores = []

        if not matches:
            return "No live matches at the moment."

        for match in matches:
            home_team = match["homeTeam"]["name"]
            away_team = match["awayTeam"]["name"]
            score = match["score"]
            full_time = score.get("fullTime", {})
            home_score = full_time.get("home", 0)
            away_score = full_time.get("away", 0)
            match_time = match.get("utcDate", "Unknown time")
            match_status = match.get("status", "Scheduled")

            if match_status == "LIVE":
                live_scores.append(f"{home_team} {home_score} - {away_score} {away_team}\nStatus: {match_status} - {match_time}")
        
        return live_scores if live_scores else "No live matches at the moment."
    except Exception as e:
        return f"Error fetching live scores: {str(e)}"

# Function to get football news
def get_football_news():
    url = f"https://newsapi.org/v2/everything?q=football&apiKey={NEWS_API_KEY}"
    
    try:
        response = requests.get(url)
        data = response.json()
        articles = data.get("articles", [])[:5]

        if not articles:
            return "No football news available."

        news_list = "📰 *Latest Football News:* 📰\n\n"
        for article in articles:
            title = article["title"]
            url = article["url"]
            image = article["urlToImage"]
            news_list += f"🔹 {title}\n🔗 {url}\n🖼️ {image if image else 'No Image'}\n\n"
        
        return news_list
    except Exception as e:
        return f"Error fetching news: {str(e)}"

# Function to get eFootball news
def get_efootball_news():
    url = f"https://newsapi.org/v2/everything?q=efootball&apiKey={NEWS_API_KEY}"
    
    try:
        response = requests.get(url)
        data = response.json()
        articles = data.get("articles", [])[:3]

        if not articles:
            return "No eFootball news available."

        news_list = "🎮 *Efootball News:* 🎮\n\n"
        for article in articles:
            title = article["title"]
            url = article["url"]
            image = article["urlToImage"]
            news_list += f"🔹 {title}\n🔗 {url}\n🖼️ {image if image else 'No Image'}\n\n"
        
        return news_list

    except Exception as e:
        return f"Error fetching eFootball news: {str(e)}"

# Function to get match highlights (placeholder function)
def get_match_highlights():
    return "📹 Match highlights will be added soon!"  # Replace with actual highlight fetching logic

# Function to check live scores and post to channel
def check_and_post_live_scores():
    live_scores = get_live_scores()
    if isinstance(live_scores, list):
        for score in live_scores:
            send_message_to_channel(score)
    else:
        send_message_to_channel(live_scores)

# Function to post football news daily
def post_daily_news():
    news = get_football_news()
    send_message_to_channel(news)

# Function to start the bot when backup number sends command
def start_bot(command, sender_number):
    if sender_number == BACKUP_NUMBER:
        if command == ".enable_channel":
            schedule.every().day.at("06:00").do(post_daily_news)
            schedule.every().day.at("18:00").do(post_daily_news)
            schedule.every(5).minutes.do(check_and_post_live_scores)
            
            def run_scheduler():
                while True:
                    schedule.run_pending()
                    time.sleep(1)
            
            threading.Thread(target=run_scheduler).start()
            return "Bot started and will post news & live scores."
    return "Unauthorized number. Cannot start bot."

# Example function to handle user commands
def handle_command(command, sender_number):
    response = start_bot(command, sender_number)
    send_message_to_channel(response)

# Simulate command handling (This part simulates receiving a message and processing it)
def simulate_command(input_command, sender_number):
    print(f"Received command: {input_command} from {sender_number}")
    handle_command(input_command, sender_number)

# For example, simulate a command to enable the bot from backup number
simulate_command(".enable_channel", BACKUP_NUMBER)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "news":
            print(get_football_news())
        elif command == "highlight":
            print(get_match_highlights())
        elif command == "efootball":
            print(get_efootball_news())
    else:
        print(get_live_scores())
