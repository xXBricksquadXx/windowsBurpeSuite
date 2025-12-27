from __future__ import annotations

from http.server import BaseHTTPRequestHandler, HTTPServer
import json


class H(BaseHTTPRequestHandler):
    def _cors(self) -> None:
        # Note: wildcard Allow-Headers is not reliably honored by all browsers.
        # Reflect requested headers for preflight requests.
        req_hdrs = self.headers.get("Access-Control-Request-Headers")
        allow_hdrs = req_hdrs if req_hdrs else "Content-Type, Authorization, Accept"

        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", allow_hdrs)
        self.send_header("Access-Control-Max-Age", "86400")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._cors()
        self.end_headers()

    def _read(self) -> bytes:
        n = int(self.headers.get("Content-Length", "0") or "0")
        return self.rfile.read(n) if n else b""

    def _reply(self, code: int, payload: dict) -> None:
        body = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        self._reply(
            200,
            {
                "ok": True,
                "method": "GET",
                "path": self.path,
                "headers": dict(self.headers),
            },
        )

    def do_POST(self) -> None:
        raw = self._read()
        self._reply(
            200,
            {
                "ok": True,
                "method": "POST",
                "path": self.path,
                "headers": dict(self.headers),
                "bodyText": raw.decode("utf-8", errors="replace"),
            },
        )


if __name__ == "__main__":
    host, port = "127.0.0.1", 8787
    print(f"dev-echo listening on http://{host}:{port}")
    HTTPServer((host, port), H).serve_forever()
