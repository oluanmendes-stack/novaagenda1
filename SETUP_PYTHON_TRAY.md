# ⚙️ Configurar Servidor Python na Bandeja do Windows

## 📋 Pré-requisitos

- Python 3.6+ instalado
- Acesso ao Prompt de Comando ou PowerShell

## 🚀 Instalação Rápida

### 1️⃣ Instalar Dependências Python

Abra o **Prompt de Comando** ou **PowerShell** na pasta do projeto e execute:

```bash
pip install pystray Pillow
```

**Alternativa** (se usar Python 3):
```bash
pip3 install pystray Pillow
```

### 2️⃣ Executar o Servidor

Existem 3 formas de executar:

#### Opção A: Clicando no arquivo (mais simples)
1. Na pasta do projeto, procure o arquivo `local-server.pyw`
2. **Clique duas vezes** nele
3. Um ícone azul aparecerá na bandeja do Windows (canto inferior direito)

#### Opção B: Pelo Prompt de Comando
```bash
python local-server.pyw
```

#### Opção C: Criar um Atalho de Inicialização (Windows)
Para que o servidor inicie automaticamente quando você ligar o PC:

1. Clique com botão direito no `local-server.pyw`
2. Selecione **"Enviar para"** → **"Área de Trabalho (criar atalho)"**
3. Mova o atalho para: `C:\Users\{SEU_USUARIO}\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`
4. Na próxima vez que ligar, o servidor iniciará automaticamente

## 🎯 Como Usar

### Na Bandeja do Windows:

```
┌─────────────────────────┐
│ 🟢 Servidor Local       │
├─────────────────────────┤
│ Status: 🟢 Rodando      │
├─────────────────────────┤
│ 📁 Abrir Pasta          │
│ 📋 Ver Log              │
├─────────────────────────┤
│ 🛑 Sair                 │
└─────────────────────────┘
```

- **Status**: Mostra se o servidor está ativo
- **📁 Abrir Pasta**: Abre a pasta do projeto no Explorer
- **📋 Ver Log**: Abre o arquivo `local-server.log` com todos os detalhes
- **🛑 Sair**: Encerra o servidor

## 📁 Arquivo de Log

O servidor salva um log em `local-server.log` com:
- Hora de início/parada do servidor
- Cada vez que um arquivo é aberto
- Erros que ocorrem

## ✅ Confirmação de Funcionamento

1. O ícone 🟢 apareceu na bandeja?
2. Abra `local-server.log` - deve mostrar a hora de início
3. Na aplicação web, tente abrir uma pasta - o log deve registrar

## ❌ Troubleshooting

### "ModuleNotFoundError: No module named 'pystray'"
**Solução**: Instale as dependências novamente:
```bash
pip install pystray Pillow --upgrade
```

### Ícone não aparece na bandeja
1. Verifique se não fechou a janela do Prompt de Comando (se usou a Opção B)
2. Veja o arquivo `local-server.log` para erros
3. Tente abrir via **Opção A** (clique duplo no arquivo)

### Porta 8080 já está em uso
Se houver outro servidor rodando na porta 8080:
1. Feche outros aplicativos que usem essa porta
2. Ou edite o arquivo `local-server.pyw` e mude `PORT = 8080` para outra porta (ex: `PORT = 9090`)

### Arquivo .pyw não executa
O Windows pode estar interpretando como texto. Tente:
```bash
python local-server.pyw
```

## 🔧 Desinstalação

Para parar permanentemente:
1. Clique no ícone da bandeja → **🛑 Sair**
2. Ou feche a janela do Prompt de Comando (se estiver rodando lá)

Para remover as dependências:
```bash
pip uninstall pystray Pillow
```

---

**Dúvidas?** Verifique o arquivo `local-server.log` para detalhes técnicos.
