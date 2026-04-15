# Servidor Local para Abrir Pastas

Se você está acessando a ferramenta de **outro computador** (não o servidor), use este servidor Python para abrir pastas e arquivos automaticamente no seu PC.

## Como Usar

### 1. Execute o Servidor Python

Abra o **Prompt de Comando** ou **PowerShell** e execute:

```bash
python local-server.py
```

Você verá:
```
🚀 Local server running on http://localhost:8080
📁 Ready to open files and folders
✅ Keep this window open while using the app

Press Ctrl+C to stop the server
```

**Deixe esta janela aberta** enquanto usa a ferramenta.

### 2. Configure o Caminho no Cliente

Na aba **Configurações** da ferramenta, preencha:

- **Caminho Raiz do Servidor**: `C:\Bids` (ou onde está sendo criada a pasta no servidor)
- **Caminho Raiz do Seu Computador (Cliente)**: `Z:\1 -DIMAVE E\01 - EDITAIS E PROPOSTAS` (seu caminho local)

### 3. Use Normalmente

Quando você clicar em **"Pasta"** ou em um **anexo**, o servidor Python abrirá automaticamente no seu PC.

## Requisitos

- Python 3.x instalado
- Nenhuma dependência extra (usa apenas stdlib do Python)

## Fallback

Se o servidor Python não estiver rodando, o caminho será **copiado para a área de transferência** e você poderá colar no Explorador manualmente (Win + E).

## Parar o Servidor

Pressione `Ctrl+C` na janela do terminal.
