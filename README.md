# 🎰 Bingo dos Veloso

Sistema de Bingo Multiplayer com animações profissionais, jogo contínuo e experiência autêntica.

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
└── js/
    ├── operador.js     # Lógica do operador
    ├── jogador.js      # Lógica mobile
    └── animacoes.js    # Sistema de animações e sons
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
- **Jogadores**: Escaneiam o QR Code gerado automaticamente

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

## ⚙️ Configuração Firebase

O projeto usa Firebase Realtime Database. A configuração já está incluída nos arquivos JS. 

Para usar seu próprio Firebase:
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative Realtime Database
3. Configure as regras:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
4. Substitua o `firebaseConfig` nos arquivos `js/operador.js` e `js/jogador.js`

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
Edite as constantes no arquivo `js/operador.js`:
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
