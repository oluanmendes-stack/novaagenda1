#!/usr/bin/env python3
"""
Local server para abrir pastas e arquivos no Windows Explorer.

Use este script quando acessar a ferramenta de outro computador.

Como usar:
  1. Coloque este arquivo na raiz do projeto
  2. Execute: python local-server.py
  3. O servidor ficará ouvindo em http://localhost:8080

O servidor receberá requisições do React para abrir pastas/arquivos no seu PC.
"""

import http.server
import socketserver
import json
import os
import subprocess
import platform
from urllib.parse import urlparse, parse_qs
from pathlib import Path

PORT = 8080

class OpenFileHandler(http.server.SimpleHTTPRequestHandler):
    """Handler para requisições de abrir pastas/arquivos"""
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def do_POST(self):
        """Handle POST requests to open files/folders"""
        
        # Add CORS headers
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            file_path = data.get('filePath', '')
            
            if not file_path:
                self.wfile.write(json.dumps({
                    'error': 'filePath is required'
                }).encode())
                return
            
            # Normalize path
            file_path = os.path.normpath(file_path)
            
            # Check if path exists
            if not os.path.exists(file_path):
                self.wfile.write(json.dumps({
                    'error': f'Path does not exist: {file_path}'
                }).encode())
                return
            
            # Open the file/folder based on platform
            system = platform.system()
            
            try:
                if system == 'Windows':
                    # Use os.startfile on Windows (native and simple)
                    os.startfile(file_path)
                elif system == 'Darwin':
                    # macOS: use open command
                    subprocess.Popen(['open', file_path])
                else:
                    # Linux: use xdg-open or nautilus
                    subprocess.Popen(['xdg-open', file_path])
                
                self.wfile.write(json.dumps({
                    'success': True,
                    'message': f'Opened: {file_path}'
                }).encode())
            
            except Exception as e:
                self.wfile.write(json.dumps({
                    'error': f'Failed to open: {str(e)}'
                }).encode())
        
        except Exception as e:
            self.wfile.write(json.dumps({
                'error': f'Server error: {str(e)}'
            }).encode())
    
    def log_message(self, format, *args):
        """Override to customize log messages"""
        print(f"[{self.log_date_time_string()}] {format % args}")


def main():
    """Start the local server"""
    Handler = OpenFileHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🚀 Local server running on http://localhost:{PORT}")
        print(f"📁 Ready to open files and folders")
        print(f"✅ Keep this window open while using the app\n")
        print(f"Press Ctrl+C to stop the server\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n✋ Server stopped")


if __name__ == "__main__":
    main()
