# 🎰 Bingo dos Veloso

Sistema de bingo eletrônico multiplayer com cartelas clicáveis no celular.

![Bingo](https://img.shields.io/badge/Bingo-Multiplayer-red)
![Firebase](https://img.shields.io/badge/Firebase-Realtime-orange)
![Mobile](https://img.shields.io/badge/Mobile-Friendly-green)

## 🎮 Como Funciona

Este é um sistema de **BINGO REAL** onde:

1. **Operador** sorteia números no telão (TV/computador)
2. **Números aparecem por apenas 5 segundos** na tela
3. **Jogadores** devem **CLICAR MANUALMENTE** nos números de suas cartelas
4. **Se não clicar a tempo, perde a bolinha!** 😱
5. **Ganha** quem completar linha/coluna/diagonal primeiro

### ⚠️ Regras Importantes

- Os números sorteados **NÃO** ficam visíveis permanentemente
- Cada número aparece por **5 segundos** e depois some
- Os jogadores precisam estar **atentos** e marcar rapidamente
- Se você perder um número que estava na sua cartela, seu bingo será **INVÁLIDO**

## 📁 Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Painel do Operador (para TV/telão) |
| `jogador.html` | Cartelas no Celular (touch para marcar) |

## 🚀 Deploy no GitHub Pages

### Passo a Passo:

1. **Criar repositório no GitHub**
   - Acesse [github.com/new](https://github.com/new)
   - Nome sugerido: `bingo-dos-veloso`
   - Deixe público
   - Clique em "Create repository"

2. **Fazer upload dos arquivos**
   - Na página do repositório, clique em "uploading an existing file"
   - Arraste os arquivos: `index.html` e `jogador.html`
   - Clique em "Commit changes"

3. **Ativar GitHub Pages**
   - Vá em Settings (⚙️)
   - No menu lateral, clique em "Pages"
   - Em "Source", selecione "Deploy from a branch"
   - Em "Branch", selecione `main` e `/root`
   - Clique em "Save"

4. **Aguardar deploy** (1-2 minutos)
   - A URL será: `https://SEU-USUARIO.github.io/bingo-dos-veloso/`

## 📱 Como Usar

### Para o Operador (Telão):

1. Acesse `https://SEU-USUARIO.github.io/bingo-dos-veloso/`
2. Crie uma nova sala com nome e quantidade de cartelas
3. Mostre o **QR Code** para os jogadores escanearem
4. Aguarde todos entrarem
5. Clique em **"INICIAR JOGO"**
6. Clique em **"SORTEAR PRÓXIMO"** para sortear números
7. Quando alguém gritar BINGO, verifique e valide

### Para os Jogadores (Celular):

1. Escaneie o **QR Code** do telão
2. Digite seu **nome** e **sobrenome**
3. Tire uma **foto** (opcional)
4. Clique em **"ENTRAR NO BINGO"**
5. Aguarde o jogo começar
6. **FIQUE ATENTO!** Quando um número aparecer:
   - Verifique se está na sua cartela
   - **CLIQUE RÁPIDO** para marcar
   - Você tem apenas **5 segundos!**
7. Complete uma linha/coluna/diagonal
8. Clique em **"BINGO!"** para gritar

### Múltiplas Cartelas:

- Se tiver mais de uma cartela, **deslize para os lados** para ver as outras
- Cada cartela é independente
- Fique atento a **todas** as suas cartelas!

## 🎨 Recursos

✅ QR Code automático para entrada rápida  
✅ Múltiplas cartelas por jogador (1-5)  
✅ Múltiplas salas simultâneas  
✅ Touch otimizado para celular  
✅ Swipe entre cartelas  
✅ Som ao marcar número  
✅ Vibração ao marcar (celular)  
✅ Animações estilo Mario Party  
✅ Verificação rigorosa de bingo  
✅ Registro de números perdidos  
✅ Foto do jogador  
✅ Confetes na vitória  
✅ Responsivo para TV e celular  

## 🔧 Tecnologias

- **HTML5 / CSS3 / JavaScript** - Interface
- **Firebase Realtime Database** - Sincronização em tempo real
- **QRCode.js** - Geração de QR codes
- **Web Audio API** - Sons
- **Google Fonts** - Pacifico & Poppins

## ⚙️ Firebase

O sistema usa Firebase Realtime Database para sincronização em tempo real. As credenciais já estão configuradas nos arquivos.

### Estrutura do Banco:

```
├── salas/
│   └── {salaId}/
│       ├── nome
│       ├── cartelasPorJogador
│       ├── ativa
│       ├── jogando
│       ├── numeroAtual
│       ├── tempoRestante
│       ├── numerosSorteados[]
│       ├── vencedor
│       └── alertasBingo/
│
└── jogadores/
    └── {jogadorId}/
        ├── salaId
        ├── nome
        ├── sobrenome
        ├── foto
        ├── cartelas[]
        ├── gritouBingo
        └── cartelaVencedora
```

## 🎯 Verificação de Bingo

Para um bingo ser válido:

1. ✅ Deve ter uma sequência completa (linha, coluna ou diagonal)
2. ✅ Todos os números da sequência devem estar marcados
3. ✅ Não pode ter perdido nenhum número sorteado que estava na cartela

Se o jogador perdeu algum número (não clicou a tempo), o bingo é **INVÁLIDO** e ele deve continuar jogando.

## 🐛 Problemas Comuns

### "QR Code não funciona"
- Verifique se o deploy do GitHub Pages está ativo
- Tente copiar a URL manualmente

### "Números não aparecem"
- Verifique a conexão com a internet
- Recarregue a página

### "Não consigo marcar número"
- Verifique se o jogo já começou
- O número deve estar na sua cartela
- Toque diretamente no número

### "Bingo foi rejeitado"
- Você provavelmente perdeu algum número
- Preste mais atenção nos próximos sorteios!

## 📜 Licença

Projeto criado para diversão da família Veloso. Uso livre para fins não comerciais.

---

🎰 **Boa sorte no BINGO!** 🍀

Desenvolvido com ❤️ para a família Veloso
