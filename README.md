# 🎰 Bingo dos Veloso

Bingo da família Veloso para o telão e para o celular. A edição em uso é a de **Natal 2026**. Não havia data fixa de 2025 no código; o exemplo da sala passou a sugerir “Natal dos Veloso 2026”.

Este repositório (`bingo`) é a versão principal: HTML, CSS e JavaScript separados, com o README. O repositório irmão `bingo2` é uma cópia achatada do mesmo jogo (só `index.html` e `jogador.html`, animações embutidas), enviada no mesmo dia 11/12/2025, apontando para o mesmo Firebase. Dá para arquivar o `bingo2`; o que vale manter é este.

## Estado do Firebase

O jogo sincroniza o telão e os celulares pelo Realtime Database `bingo-16f47`. Em outubro de 2026 esse banco responde **desativado** (`423`). A chave no código é a chave pública do SDK — o risco de verdade são as regras abertas de leitura e escrita. Nada de família foi apagado daqui.

Para a noite de Natal, o Ramon reativa o banco em um clique:

1. Abra o [Realtime Database do projeto bingo-16f47](https://console.firebase.google.com/project/bingo-16f47/database/bingo-16f47-default-rtdb/data)
2. Reative o banco
3. Nas regras, mantenha leitura/escrita liberadas para a família (o jogo não tem login) e, se puder, o índice:

```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "jogadores": { ".indexOn": ["salaId"] }
  }
}
```

Enquanto o banco estiver desativado, o telão mostra um aviso e não cria sala. Qualquer pessoa com o link do projeto consegue ler e gravar salas, nomes e fotos. Não coloque foto de documento nem dado sensível.

## 📁 Estrutura de Arquivos

```
bingo-dos-veloso/
├── index.html          # Painel do Operador
├── jogador.html        # Interface Mobile dos Jogadores
├── README.md           # Este arquivo
├── css/
│   ├── operador.css    # Estilos do painel operador
│   ├── jogador.css     # Estilos mobile
│   └── animacoes.css   # Animações profissionais do sorteio
├── js/
│   ├── operador.js     # Lógica do operador
│   ├── jogador.js      # Lógica mobile
│   ├── animacoes.js    # Sistema de animações e sons
│   └── comum.js        # Regras da cartela, Firebase e utilidades
└── vendor/             # Firebase 13 e QR Code, servidos junto com o site
```

## 🚀 Como Usar

### Deploy no GitHub Pages

1. Crie um repositório no GitHub
2. Faça upload de TODOS os arquivos mantendo a estrutura de pastas
3. Vá em Settings → Pages → Source: "Deploy from a branch"
4. Selecione a branch `main` e pasta `/ (root)`
5. Aguarde o deploy (1-2 minutos)

### URLs

- **Operador**: `https://seu-usuario.github.io/seu-repo/`
- **Jogadores**: escaneiam o QR Code, ou usam o botão “Copiar link”

## 🎮 Funcionalidades

### Operador (Telão/Computador)
- ✅ Criar salas com nome e foto do prêmio
- ✅ QR Code automático para jogadores
- ✅ Globo animado com bolas girando
- ✅ **Animação dramática**: Mostra LETRA primeiro (3.5s), depois NÚMERO (5s)
- ✅ **Botão "VER ÚLTIMO"**: Mostra o último número sorteado novamente
- ✅ Alertas de BINGO no topo da tela
- ✅ Verificação automática de cartelas
- ✅ Lista de ganhadores durante o jogo
- ✅ Confetes na vitória

### Jogador (Celular)
- ✅ Cadastro com nome e foto
- ✅ Múltiplas cartelas com swipe
- ✅ Marcação manual (números NÃO aparecem automaticamente!)
- ✅ Vibração quando globo gira
- ✅ Botão BINGO só ativa com sequência válida
- ✅ Reações em tempo real
- ✅ Tela de fim de jogo

### Regras de Vitória
1. **➖ Linha** - 5 números na horizontal
2. **| Coluna** - 5 números na vertical
3. **↗️ Diagonal** - 5 números em diagonal
4. **✖️ Cruzada** - As duas diagonais (X)
5. **🏆 Cartela Cheia** - SUPER PRÊMIO (encerra o jogo)

## 🎬 Sistema de Animação

A animação do sorteio foi projetada para gerar suspense:

1. **Globo Gira**: Operador clica em "GIRAR GLOBO"
2. **Para**: Operador clica em "PARAR!"
3. **FASE 1 - LETRA**: Letra gigante aparece por 3.5 segundos
   - Som de suspense crescente
   - Interrogações animadas ("Qual será o número...?")
4. **FASE 2 - NÚMERO**: Bola com número aparece por 5 segundos
   - Explosão de partículas coloridas
   - Ondas de expansão
   - Fanfarra musical
5. **Esconde**: Volta ao globo para próximo sorteio

### Botão "VER ÚLTIMO"
Se alguém perdeu o número, o operador pode clicar em "VER ÚLTIMO" para mostrar novamente o último número sorteado com a animação completa.

## 🧪 Ensaio neste computador

O fluxo de verdade usa o Firebase. Para ensaiar sem o banco da família, com o [emulador](https://firebase.google.com/docs/emulator-suite):

```bash
npx -y firebase-tools@13 emulators:start --only database --project demo-bingo
python3 -m http.server 5500
```

Abra `http://127.0.0.1:5500/?emulador=1`. O QR Code do jogador já leva o mesmo modo de ensaio.

## ⚙️ Configuração Firebase

A configuração fica em `js/comum.js`. Para trocar de projeto, crie outro Realtime Database e substitua o `FIREBASE_CONFIG` desse arquivo. As bibliotecas estão em `vendor/` (Firebase JS 13 compat e QRCode), para o jogo não depender de CDN na hora da festa.

## 🎨 Personalização

### Cores
Edite as variáveis CSS no arquivo `css/operador.css`:
```css
:root {
    --red: #ff6b6b;
    --cyan: #4ecdc4;
    --yellow: #ffe66d;
    --purple: #a855f7;
    --green: #22c55e;
    --blue: #3b82f6;
}
```

### Tempos de Animação
Edite as constantes no arquivo `js/comum.js`:
```javascript
const TEMPO_MOSTRAR_LETRA = 3500;  // 3.5 segundos
const TEMPO_MOSTRAR_NUMERO = 5000; // 5 segundos
```

## 📱 Requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Conexão com internet
- Para jogadores: dispositivo com câmera (opcional, para foto)

## 🎯 Dicas de Uso

1. **Telão grande**: Projete o painel do operador em uma TV/projetor
2. **Som alto**: Conecte caixas de som para os efeitos
3. **Iluminação**: Escureça o ambiente durante as animações
4. **Foto do prêmio**: Adicione uma foto do prêmio para motivar!
5. **Cartelas impressas**: Opcionalmente, imprima cartelas físicas também

## 📄 Licença

Projeto livre para uso pessoal e comercial.

---

Desenvolvido com ❤️ para a família Veloso
