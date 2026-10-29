
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import random
from datetime import datetime, timezone

# 模擬イベントの送信元。IPアドレスは文書用の例示アドレスを使用。
SOURCES = [
    {"country": "United States", "lat": 40.7, "lon": -74.0, "ip": "198.51.100.10"},
    {"country": "United Kingdom", "lat": 51.5, "lon": -0.1, "ip": "203.0.113.20"},
    {"country": "Brazil", "lat": -23.5, "lon": -46.6, "ip": "192.0.2.30"},
    {"country": "India", "lat": 28.6, "lon": 77.2, "ip": "198.51.100.40"},
    {"country": "Australia", "lat": -33.9, "lon": 151.2, "ip": "203.0.113.50"},
]

class Handler(SimpleHTTPRequestHandler):

    def do_GET(self):
        # /api/event にアクセスされた場合は模擬イベントを返す
        if self.path == "/api/event":
            source = random.choice(SOURCES)

            event = {
                **source,
                "port": random.choice([22, 80, 443, 3389, 8080]),
                "time": datetime.now(timezone.utc).isoformat(),
                "type": "simulated_connection"
            }

            body = json.dumps(event).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return

        # それ以外はHTMLやJavaScriptファイルを配信
        super().do_GET()


# 外部には公開せず、自分のMacだけで待ち受ける
server = HTTPServer(("127.0.0.1", 8000), Handler)

print("GLOBAL THREAT MONITOR")
print("http://127.0.0.1:8000")

server.serve_forever()

