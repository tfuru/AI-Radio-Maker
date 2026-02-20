import os
import json
import requests
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup

from apscheduler.schedulers.background import BackgroundScheduler
from automation import RadioAutomator

app = Flask(__name__, static_folder='src')
CORS(app)

# Initialize Automator and Scheduler
automator = RadioAutomator()
scheduler = BackgroundScheduler(timezone="Asia/Tokyo")

def run_automation_task(news_url=None):
    print("Running automation task...")
    automator.run_once(news_url)

# Schedule tasks at 08:00, 12:00, and 20:00 JST
scheduler.add_job(run_automation_task, 'cron', hour=8, minute=0)
scheduler.add_job(run_automation_task, 'cron', hour=12, minute=0)
scheduler.add_job(run_automation_task, 'cron', hour=20, minute=0)
scheduler.start()

SETTINGS_FILE = 'settings.json'

def load_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_settings(settings):
    with open(SETTINGS_FILE, 'w') as f:
        json.dump(settings, f, indent=4)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/fetch-url', methods=['POST'])
def fetch_url():
    data = request.json
    url = data.get('url')
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'lxml')
        
        # Remove script and style elements
        for script_or_style in soup(["script", "style"]):
            script_or_style.decompose()

        # Get text
        text = soup.get_text()

        # Break into lines and remove leading/trailing whitespace
        lines = (line.strip() for line in text.splitlines())
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # Drop blank lines
        text = '\n'.join(chunk for chunk in chunks if chunk)

        # Truncate text to avoid overly large prompts (e.g., first 5000 chars)
        return jsonify({'text': text[:5000]})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    if request.method == 'POST':
        settings = request.json
        save_settings(settings)
        return jsonify({'status': 'success'})
    else:
        return jsonify(load_settings())

@app.route('/api/automation/test', methods=['GET', 'POST'])
def test_automation():
    # Run in background to avoid timeout
    scheduler.add_job(run_automation_task, 'date')
    return jsonify({'status': 'automation triggered'})

@app.route('/api/automation/status', methods=['GET'])
def get_automation_status():
    return jsonify({
        'status': automator.status,
        'scheduler_running': scheduler.running
    })

@app.route('/api/automation/run', methods=['POST'])
def run_automation_manual():
    data = request.json or {}
    url = data.get('url')
    # Trigger in background
    scheduler.add_job(run_automation_task, 'date', args=[url])
    return jsonify({'status': 'automation triggered', 'url': url})

if __name__ == '__main__':
    # Default to 8080 as per original Dockerfile
    app.run(host='0.0.0.0', port=8080)
