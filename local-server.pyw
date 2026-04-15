#!/usr/bin/env python3
"""
Servidor Local para abrir pastas e arquivos no Windows - com Bandeja do Sistema

Este script roda em background na bandeja do Windows (sem exibir console).

Requisitos:
  - Python 3.x
  - pystray (pip install pystray)
  - Pillow (pip install Pillow)

Como usar:
  1. Coloque este arquivo na raiz do projeto
  2. Execute: python local-server.pyw (ou clique duas vezes no arquivo)
  3. Um ícone aparecerá na bandeja do Windows
  4. O servidor ficará ouvindo em http://localhost:8080
"""

import http.server
import socketserver
import json
import os
import subprocess
import platform
import threading
import logging
from urllib.parse import urlparse, parse_qs
from pathlib import Path
from datetime import datetime

# Tente importar pystray e Pillow
try:
    from pystray import Icon, Menu, MenuItem
    from PIL import Image, ImageDraw
except ImportError:
    print("❌ Erro: pystray e/ou Pillow não estão instalados")
    print("\nExecute no prompt de comando:")
    print("  pip install pystray Pillow")
    print("\nDepois execute novamente este arquivo.")
    input("Pressione Enter para fechar...")
    exit(1)

PORT = 8080

# Configurar logging em arquivo
LOG_FILE = "local-server.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()  # Também mostra no console se houver
    ]
)
logger = logging.getLogger(__name__)

# Variáveis globais para controlar o servidor
server = None
server_thread = None
is_running = False


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
                logger.warning("Requisição recebida sem filePath")
                self.wfile.write(json.dumps({
                    'error': 'filePath is required'
                }).encode())
                return
            
            # Normalize path
            file_path = os.path.normpath(file_path)
            
            # Check if path exists
            if not os.path.exists(file_path):
                logger.warning(f"Caminho não existe: {file_path}")
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
                
                logger.info(f"Aberto com sucesso: {file_path}")
                self.wfile.write(json.dumps({
                    'success': True,
                    'message': f'Opened: {file_path}'
                }).encode())
            
            except Exception as e:
                logger.error(f"Erro ao abrir arquivo: {str(e)}")
                self.wfile.write(json.dumps({
                    'error': f'Failed to open: {str(e)}'
                }).encode())
        
        except Exception as e:
            logger.error(f"Erro no servidor: {str(e)}")
            self.wfile.write(json.dumps({
                'error': f'Server error: {str(e)}'
            }).encode())
    
    def log_message(self, format, *args):
        """Override to customize log messages"""
        logger.info(format % args)


def create_icon():
    """Criar ícone para a bandeja do Windows"""
    # Criar uma imagem simples (azul com letra S)
    width, height = 64, 64
    image = Image.new('RGB', (width, height), color='#0066CC')
    draw = ImageDraw.Draw(image)
    
    # Desenhar um círculo branco no centro
    margin = 10
    draw.ellipse(
        [(margin, margin), (width - margin, height - margin)],
        fill='#FFFFFF'
    )
    
    return image


def start_server():
    """Iniciar o servidor HTTP"""
    global server, server_thread, is_running
    
    if is_running:
        logger.warning("Servidor já está rodando")
        return
    
    try:
        Handler = OpenFileHandler
        server = socketserver.TCPServer(("", PORT), Handler)
        is_running = True
        
        logger.info("=" * 60)
        logger.info("🚀 Servidor Local iniciado")
        logger.info(f"📁 Ouvindo em http://localhost:{PORT}")
        logger.info(f"✅ Pronto para abrir arquivos e pastas")
        logger.info("=" * 60)
        
        # Rodar o servidor em thread separada
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()
        
    except Exception as e:
        logger.error(f"Erro ao iniciar servidor: {str(e)}")
        is_running = False


def stop_server():
    """Parar o servidor HTTP"""
    global server, is_running
    
    if not is_running:
        return
    
    try:
        if server:
            server.shutdown()
            server.server_close()
        is_running = False
        logger.info("⏹️  Servidor parado")
    except Exception as e:
        logger.error(f"Erro ao parar servidor: {str(e)}")


def open_log_file():
    """Abrir arquivo de log"""
    try:
        log_path = os.path.abspath(LOG_FILE)
        if os.path.exists(log_path):
            if platform.system() == 'Windows':
                os.startfile(log_path)
            elif platform.system() == 'Darwin':
                subprocess.Popen(['open', log_path])
            else:
                subprocess.Popen(['xdg-open', log_path])
        else:
            logger.warning("Arquivo de log não encontrado")
    except Exception as e:
        logger.error(f"Erro ao abrir log: {str(e)}")


def open_folder():
    """Abrir a pasta do projeto"""
    try:
        folder_path = os.path.abspath('.')
        if platform.system() == 'Windows':
            os.startfile(folder_path)
        elif platform.system() == 'Darwin':
            subprocess.Popen(['open', folder_path])
        else:
            subprocess.Popen(['xdg-open', folder_path])
    except Exception as e:
        logger.error(f"Erro ao abrir pasta: {str(e)}")


def on_quit(icon, item):
    """Callback para sair da aplicação"""
    logger.info("❌ Encerrando aplicação...")
    stop_server()
    icon.stop()


def main():
    """Iniciar o servidor com ícone na bandeja"""
    # Iniciar o servidor HTTP
    start_server()
    
    # Criar ícone na bandeja
    icon = Icon(
        name="LocalServer",
        icon=create_icon(),
        title="Servidor Local - Agenda",
        menu=Menu(
            MenuItem(
                "Status: 🟢 Rodando" if is_running else "Status: 🔴 Parado",
                None,
                enabled=False
            ),
            MenuItem("─" * 40, None, enabled=False),
            MenuItem("📁 Abrir Pasta do Projeto", open_folder),
            MenuItem("📋 Ver Log", open_log_file),
            MenuItem("─" * 40, None, enabled=False),
            MenuItem("🛑 Sair", on_quit),
        )
    )
    
    logger.info("✨ Ícone criado na bandeja do Windows")
    icon.run()


if __name__ == "__main__":
    main()
