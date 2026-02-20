import os
import json
import time
import requests
import re
from io import BytesIO
from pydub import AudioSegment
from bs4 import BeautifulSoup

class RadioAutomator:
    def __init__(self, settings_file='settings.json'):
        self.settings_file = settings_file
        self.settings = self._load_settings()
        self.status = "Idle"

    def _load_settings(self):
        if os.path.exists(self.settings_file):
            with open(self.settings_file, 'r') as f:
                return json.load(f)
        return {}

    def fetch_news(self, custom_url=None):
        """Fetch news from a specific URL or default local feed as JSON."""
        try:
            url = custom_url or "http://192.168.10.106:9090/feed"
            resp = requests.get(url)
            resp.raise_for_status()
            
            # Parse as JSON
            data = resp.json()
            if isinstance(data, list) and len(data) > 0:
                first_item = data[0]
                title = first_item.get('title', 'No Title')
                description = first_item.get('description') or first_item.get('content') or ""
                return f"【{title}】\n{description}"
            elif isinstance(data, dict):
                # Fallback for single object response
                title = data.get('title', 'No Title')
                description = data.get('description') or data.get('content') or ""
                return f"【{title}】\n{description}"
            
            return "ニュースデータが見つかりませんでした。"
        except Exception as e:
            print(f"Error fetching news: {e}")
            return "最新ニュースの取得に失敗しました。"

    def generate_script(self, news_text):
        if not self.settings.get('apiUrl'):
            return None
        
        persona_name = self.settings.get('personalityName', 'パーソナリティ')
        prompt = f"あなたはラジオパーソナリティの「{persona_name}」です。以下のニュースを元に、リスナーを飽きさせない楽しいラジオ番組の台本を書いてください。適宜（効果音：拍手）などの効果音指示も入れてください。\n\n参考資料:\n{news_text}"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.settings.get('apiKey')}"
        }
        
        payload = {
            "model": self.settings.get('modelId', 'gpt-3.5-turbo'),
            "messages": [
                {"role": "system", "content": f"設定: あなたは{persona_name}です。"},
                {"role": "user", "content": prompt}
            ]
        }
        
        try:
            resp = requests.post(f"{self.settings['apiUrl'].rstrip('/')}/chat/completions", json=payload, headers=headers)
            resp.raise_for_status()
            return resp.json()['choices'][0]['message']['content']
        except Exception as e:
            print(f"Error generating script: {e}")
            return None

    def synthesize_speech(self, text):
        tts_url = self.settings.get('ttsUrl', '').rstrip('/')
        if not tts_url:
            return None
        
        headers = {"Content-Type": "application/json"}
        if self.settings.get('ttsKey'):
            headers["X-API-KEY"] = self.settings['ttsKey']
            
        payload = {
            "text": text,
            "speaker": int(self.settings.get('ttsSpeakerId', 1)),
            "format": "wav"
        }
        
        try:
            # Creation
            resp = requests.post(f"{tts_url}/api/tasks/synthesis", json=payload, headers=headers)
            resp.raise_for_status()
            job_id = resp.json()['job_id']
            
            # Polling
            for _ in range(60): # 3 mins max
                status_resp = requests.get(f"{tts_url}/api/tasks/{job_id}/status", headers=headers)
                status = status_resp.json().get('status', '').upper()
                if status in ['COMPLETED', 'DONE', 'SUCCESS']:
                    result_resp = requests.get(f"{tts_url}/api/tasks/{job_id}/result", headers=headers)
                    return AudioSegment.from_wav(BytesIO(result_resp.content))
                elif status in ['FAILED', 'ERROR']:
                    break
                time.sleep(3)
        except Exception as e:
            print(f"Error synthesizing speech: {e}")
        return None

    def fetch_se(self, query):
        search_api = self.settings.get('searchApiUrl', '').rstrip('/')
        if not search_api: return None
        try:
            resp = requests.get(f"{search_api}/search", params={"q": query})
            results = resp.json()
            if results:
                se_resp = requests.get(results[0]['url'])
                return AudioSegment.from_file(BytesIO(se_resp.content))
        except Exception as e:
            print(f"Error fetching SE: {e}")
        return None

    def mix_audio(self, script):
        lines = script.split('\n')
        combined = AudioSegment.silent(duration=0)
        
        # Simplified parser for backend
        se_regex = r'[（\(]効果音[:：]\s*(.*?)[）\)]'
        
        for line in lines:
            if not line.strip(): continue
            
            segments = re.split(f"({se_regex})", line)
            for seg in segments:
                if not seg.strip(): continue
                
                se_match = re.match(se_regex, seg)
                if se_match:
                    se_audio = self.fetch_se(se_match.group(1))
                    if se_audio:
                        combined = combined.append(se_audio, crossfade=0)
                else:
                    speech_audio = self.synthesize_speech(seg)
                    if speech_audio:
                        combined = combined.append(speech_audio, crossfade=300)
        
        return combined

    def post_to_discord(self, audio_segment):
        webhook_url = self.settings.get('discordWebhookUrl')
        if not webhook_url: return
        
        buf = BytesIO()
        # Export as mono 24k as per optimization plan
        audio_segment.set_frame_rate(24000).set_channels(1).export(buf, format="wav")
        buf.seek(0)
        
        files = {'file': ('radio_show.wav', buf, 'audio/wav')}
        payload = {"content": "🎙️ **AI Radio Maker - 定期配信 ON AIR**"}
        
        try:
            requests.post(webhook_url, data={"payload_json": json.dumps(payload)}, files=files)
        except Exception as e:
            print(f"Error posting to Discord: {e}")

    def run_once(self, news_url=None):
        self.status = "Working (Fetching News)"
        print("Starting automated radio generation...")
        news = self.fetch_news(news_url) if news_url else self.fetch_news()
        
        self.status = "Working (Generating Script)"
        script = self.generate_script(news)
        if not script:
            self.status = "Failed (Script Generation)"
            return
        
        self.status = "Working (Mixing Audio)"
        audio = self.mix_audio(script)
        if audio and len(audio) > 0:
            self.status = "Working (Posting to Discord)"
            self.post_to_discord(audio)
            self.status = "Finished (Success)"
            print("Automation finished successfully.")
        else:
            self.status = "Failed (Audio Generation)"
            print("Failed to generate audio.")

if __name__ == "__main__":
    automator = RadioAutomator()
    automator.run_once()
