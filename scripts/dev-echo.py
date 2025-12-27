#!/usr/bin/env python3
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import time
from urllib.parse import urlparse

HOST = "127.0.0.1"
PORT = 8787

def _lower_headers(headers):
  out = {}
  for k, v in headers.items():
    out[str(k)] = str(v)
  return out

class Handler(BaseHTTPRequestHandler):
  server_version = "wbs-echo/1.0"

  def _set_cors(self):
    self.send_header("Access-Control-Allow-Origin", "*")
    self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
    self.send_header("Access-Control-Allow-Headers", "*")
    self.send_header("Access-Control-Max-Age", "86400")

  def do_OPTIONS(self):
    self.send_response(204)
    self._set_cors()
    self.end_headers()

  def _read_body_text(self):
    n = int(self.headers.get("Content-Length", "0") or "0")
    if n <= 0:
      return ""
    raw = self.rfile.read(n)
    try:
      return raw.decode("utf-8", errors="replace")
    except Exception:
      return str(raw)

  def _send_json(self, obj, status=200):
    data = json.dumps(obj, indent=2).encode("utf-8")
    self.send_response(status)
    self._set_cors()
    self.send_header("Content-Type", "application/json; charset=utf-8")
    self.send_header("Content-Length", str(len(data)))
    self.end_headers()
    self.wfile.write(data)

  def _handle(self):
    parsed = urlparse(self.path)
    body_text = self._read_body_text()

    payload = {
      "ok": True,
      "method": self.command,
      "path": parsed.path,
      "query": parsed.query,
      "ts": int(time.time() * 1000),
      "headers": _lower_headers(self.headers),
      "bodyText": body_text,
    }

    # Convenience: if body is JSON, also include parsed
    ct = (self.headers.get("Content-Type") or "").lower()
    if "application/json" in ct or body_text.strip().startswith(("{", "[")):
      try:
        payload["bodyJson"] = json.loads(body_text) if body_text.strip() else None
      except Exception:
        payload["bodyJson"] = None

    self._send_json(payload, status=200)

  def do_GET(self):
    return self._handle()

  def do_POST(self):
    return self._handle()

  def do_PUT(self):
    return self._handle()

  def do_PATCH(self):
    return self._handle()

  def do_DELETE(self):
    return self._handle()

def main():
  print(f"[wbs] echo server listening on http://{HOST}:{PORT}")
  httpd = HTTPServer((HOST, PORT), Handler)
  try:
    httpd.serve_forever()
  except KeyboardInterrupt:
    pass
  finally:
    httpd.server_close()

if __name__ == "__main__":
  main()
