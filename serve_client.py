"""
TuncerLab AR Touch - Client Sunucusu
--------------------------------------
client/ klasorunu yerel agda HTTP uzerinden yayinlar (ES module'ler icin
file:// calismaz, bu yuzden basit bir sunucu gerekli).

Kullanim:
    cd client
    python serve_client.py

Sonra telefonun tarayicisinda PC'nin yerel IP'sini ac, orn:
    http://192.168.1.10:8080
"""

import http.server
import socketserver
import socket
import ssl
from pathlib import Path

PORT = 8080

CERT_PATH = Path(__file__).parent.parent / "cert.pem"
KEY_PATH = Path(__file__).parent.parent / "key.pem"


def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # GLB dosyalari icin dogru cache/CORS davranisi
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    ip = get_local_ip()
    httpd = socketserver.TCPServer(("0.0.0.0", PORT), Handler)

    if CERT_PATH.exists() and KEY_PATH.exists():
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(str(CERT_PATH), str(KEY_PATH))
        httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
        proto = "https"
        print("Sertifika bulundu -> HTTPS (guvenli) modda baslatiliyor.")
    else:
        proto = "http"
        print("UYARI: cert.pem/key.pem bulunamadi -> duz HTTP (guvensiz) modda baslatiliyor.")
        print("       Telefonun jiroskopu HTTPS olmadan calismayabilir!")
        print("       Proje kok dizininde 'python generate_cert.py' calistir.")

    print(f"\nClient yayinda: {proto}://{ip}:{PORT}")
    print("Telefonun tarayicisinda bu adresi ac (ayni Wi-Fi agda olmali).")
    if proto == "https":
        print("Tarayici 'guvenli degil' uyarisi gosterecek (kendinden imzali sertifika) -")
        print("'Gelismis' / 'Advanced' -> 'Yine de devam et' ile gec, normal.")
    httpd.serve_forever()
