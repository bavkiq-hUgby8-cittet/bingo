/* BINGO DOS VELOSO - JOGADOR JS */

const firebaseConfig = {
    apiKey: "AIzaSyCPYcph6zvKD-pIrDSwlL378hJKQoz-r2I",
    authDomain: "bingo-16f47.firebaseapp.com",
    databaseURL: "https://bingo-16f47-default-rtdb.firebaseio.com",
    projectId: "bingo-16f47",
    storageBucket: "bingo-16f47.firebasestorage.app",
    messagingSenderId: "549011622250",
    appId: "1:549011622250:web:d86e8112d2d108f239fd13"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let salaId = null, sala = null, jogadorId = null, jogador = null, cartelaAtual = 0, fotoBase64 = null;
let touchStartX = 0, touchEndX = 0, vibrando = false, ganhadores = [];

document.addEventListener('DOMContentLoaded', () => {
    const p = new URLSearchParams(location.search);
    salaId = p.get('sala');
    if (!salaId) { mostrarErro(); return; }
    const saved = localStorage.getItem('bingo_jogador_' + salaId);
    if (saved) { jogadorId = saved; verificarJogadorExistente(); }
    else { carregarSala(); }
    setupSwipe();
});

const showToast = (msg) => { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('active'); setTimeout(() => t.classList.remove('active'), 3000); };
const showLoading = () => document.getElementById('loading').classList.add('active');
const hideLoading = () => document.getElementById('loading').classList.remove('active');
const mostrarErro = () => { document.getElementById('telaCadastro').classList.remove('active'); document.getElementById('telaErro').classList.add('active'); };
const getDefaultAvatar = () => "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%234ecdc4' width='100' height='100'/><text x='50' y='60' text-anchor='middle' font-size='40'>👤</text></svg>";

async function carregarSala() {
    showLoading();
    try {
        const snap = await db.ref('salas/' + salaId).once('value');
        sala = snap.val();
        if (!sala || !sala.ativa) { mostrarErro(); return; }
        document.getElementById('salaNome').textContent = sala.nome;
        document.getElementById('qtdCartelas').textContent = sala.cartelasPorJogador;
        document.getElementById('telaCadastro').classList.add('active');
    } catch (e) { showToast('Erro'); mostrarErro(); }
    hideLoading();
}

async function verificarJogadorExistente() {
    showLoading();
    try {
        const jSnap = await db.ref('jogadores/' + jogadorId).once('value');
        jogador = jSnap.val();
        if (!jogador || jogador.salaId !== salaId) { localStorage.removeItem('bingo_jogador_' + salaId); jogadorId = null; carregarSala(); return; }
        const sSnap = await db.ref('salas/' + salaId).once('value');
        sala = sSnap.val();
        if (!sala || !sala.ativa) { mostrarErro(); return; }
        document.getElementById('salaNome').textContent = sala.nome;
        document.getElementById('telaCadastro').classList.remove('active');
        sala.jogando ? iniciarJogo() : mostrarAguardo();
        escutarMudancas();
    } catch (e) { showToast('Erro'); localStorage.removeItem('bingo_jogador_' + salaId); carregarSala(); }
    hideLoading();
}

function handleFoto(e) {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = c.height = 200;
            const ctx = c.getContext('2d');
            const min = Math.min(img.width, img.height);
            ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, 200, 200);
            fotoBase64 = c.toDataURL('image/jpeg', 0.7);
            document.getElementById('fotoPreview').innerHTML = '<img src="' + fotoBase64 + '">';
        };
        img.src = ev.target.result;
    };
    r.readAsDataURL(f);
}

const gerarId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const gerarNumerosUnicos = (min, max, qtd) => {
    const n = [];
    while (n.length < qtd) { const x = Math.floor(Math.random() * (max - min + 1)) + min; if (!n.includes(x)) n.push(x); }
    return n;
};

function gerarCartela(idx) {
    const B = gerarNumerosUnicos(1, 15, 5), I = gerarNumerosUnicos(16, 30, 5), N = gerarNumerosUnicos(31, 45, 4), G = gerarNumerosUnicos(46, 60, 5), O = gerarNumerosUnicos(61, 75, 5);
    const nums = [];
    for (let l = 0; l < 5; l++) nums.push([B[l], I[l], l === 2 ? 0 : N[l < 2 ? l : l - 1], G[l], O[l]]);
    return { id: idx + 1, numeros: nums, marcados: [0], totalMarcados: 1 };
}

async function entrarNoBingo() {
    const nome = document.getElementById('inputNome').value.trim();
    const sobrenome = document.getElementById('inputSobrenome').value.trim();
    if (!nome || !sobrenome) { showToast('Preencha nome e sobrenome!'); return; }
    showLoading();
    try {
        const carts = [];
        for (let i = 0; i < sala.cartelasPorJogador; i++) carts.push(gerarCartela(i));
        jogadorId = gerarId();
        jogador = { salaId: salaId, nome: nome, sobrenome: sobrenome, foto: fotoBase64, cartelas: carts, gritouBingo: false, cartelaVencedora: null, entradaEm: Date.now() };
        await db.ref('jogadores/' + jogadorId).set(jogador);
        localStorage.setItem('bingo_jogador_' + salaId, jogadorId);
        document.getElementById('telaCadastro').classList.remove('active');
        sala.jogando ? iniciarJogo() : mostrarAguardo();
        escutarMudancas();
        showToast('Bem-vindo, ' + nome + '!');
    } catch (e) { showToast('Erro: ' + e.message); }
    hideLoading();
}

function mostrarAguardo() {
    document.getElementById('telaAguardo').classList.add('active');
    document.getElementById('telaJogo').classList.remove('active');
    document.getElementById('aguardoCartelas').textContent = jogador.cartelas.length;
    db.ref('jogadores').orderByChild('salaId').equalTo(salaId).on('value', (snap) => {
        document.getElementById('aguardoJogadores').textContent = Object.keys(snap.val() || {}).length;
    });
}

function iniciarJogo() {
    document.getElementById('telaAguardo').classList.remove('active');
    document.getElementById('telaJogo').classList.add('active');
    document.getElementById('nomeJogador').textContent = jogador.nome + ' ' + jogador.sobrenome;
    document.getElementById('cartelaTotalNum').textContent = jogador.cartelas.length;
    if (jogador.cartelas.length <= 1) document.getElementById('swipeHint').style.display = 'none';
    renderizarCartelas();
    atualizarNavegacao();
    atualizarBotaoBingo();
}

function renderizarCartelas() {
    const cont = document.getElementById('cartelasContainer');
    cont.innerHTML = '';
    jogador.cartelas.forEach((cart, idx) => {
        const div = document.createElement('div');
        div.className = 'cartela';
        div.id = 'cartela-' + idx;
        let grid = '';
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const n = cart.numeros[r][c];
                const marc = cart.marcados.includes(n);
                const cor = n === 0;
                let cls = 'numero';
                if (cor) cls += ' coringa';
                else if (marc) cls += ' marcado';
                grid += '<div class="' + cls + '" id="num-' + idx + '-' + n + '" ' + (cor ? '' : 'onclick="marcarNumero(' + idx + ',' + n + ')"') + '>' + (cor ? 'V' : n) + '</div>';
            }
        }
        const tot = cart.marcados.filter(n => n !== 0).length;
        let dots = '';
        for (let i = 0; i < 24; i++) dots += '<div class="marcado-dot ' + (i < tot ? 'ativo' : '') + '"></div>';
        div.innerHTML = '<div class="cartela-card"><div class="bingo-header"><div class="bingo-letra">B</div><div class="bingo-letra">I</div><div class="bingo-letra">N</div><div class="bingo-letra">G</div><div class="bingo-letra">O</div></div><div class="cartela-grid">' + grid + '</div><div class="marcados-counter" id="counter-' + idx + '">' + dots + '<div class="marcados-text">' + tot + '/24 marcados</div></div></div>';
        cont.appendChild(div);
    });
    const dots = document.getElementById('paginationDots');
    dots.innerHTML = '';
    if (jogador.cartelas.length > 1) {
        jogador.cartelas.forEach((_, idx) => {
            const d = document.createElement('div');
            d.className = 'pagination-dot ' + (idx === 0 ? 'active' : '');
            d.onclick = () => irParaCartela(idx);
            dots.appendChild(d);
        });
    }
}

async function marcarNumero(cartIdx, num) {
    const cart = jogador.cartelas[cartIdx];
    const idx = cart.marcados.indexOf(num);
    if (idx > -1) cart.marcados.splice(idx, 1);
    else cart.marcados.push(num);
    const el = document.getElementById('num-' + cartIdx + '-' + num);
    el.classList.toggle('marcado');
    playSound('ploc');
    if (navigator.vibrate) navigator.vibrate(50);
    atualizarContador(cartIdx);
    try {
        await db.ref('jogadores/' + jogadorId + '/cartelas/' + cartIdx + '/marcados').set(cart.marcados);
        if (cart.marcados.includes(num)) {
            await db.ref('salas/' + salaId + '/reacoes').push({ nome: jogador.nome, foto: jogador.foto, numero: num, timestamp: Date.now() });
        }
    } catch (e) { showToast('Erro ao salvar'); }
    atualizarBotaoBingo();
}

function atualizarContador(cartIdx) {
    const cart = jogador.cartelas[cartIdx];
    const tot = cart.marcados.filter(n => n !== 0).length;
    const counter = document.getElementById('counter-' + cartIdx);
    counter.querySelectorAll('.marcado-dot').forEach((d, i) => { d.classList.toggle('ativo', i < tot); });
    counter.querySelector('.marcados-text').textContent = tot + '/24 marcados';
}

function verificarSequencia(nums, marc) {
    for (let i = 0; i < 5; i++) { if (nums[i].every(n => n === 0 || marc.includes(n))) return true; }
    for (let c = 0; c < 5; c++) { if (nums.map(l => l[c]).every(n => n === 0 || marc.includes(n))) return true; }
    if ([nums[0][0], nums[1][1], nums[2][2], nums[3][3], nums[4][4]].every(n => n === 0 || marc.includes(n))) return true;
    if ([nums[0][4], nums[1][3], nums[2][2], nums[3][1], nums[4][0]].every(n => n === 0 || marc.includes(n))) return true;
    return false;
}

function atualizarBotaoBingo() {
    const btn = document.getElementById('btnBingo');
    let pode = false;
    for (let i = 0; i < jogador.cartelas.length; i++) {
        if (verificarSequencia(jogador.cartelas[i].numeros, jogador.cartelas[i].marcados)) { pode = true; break; }
    }
    btn.classList.toggle('ativo', pode);
}

async function gritarBingo() {
    const btn = document.getElementById('btnBingo');
    if (!btn.classList.contains('ativo')) { showToast('Complete uma sequência!'); return; }
    let cartVenc = -1;
    for (let i = 0; i < jogador.cartelas.length; i++) {
        if (verificarSequencia(jogador.cartelas[i].numeros, jogador.cartelas[i].marcados)) { cartVenc = i; break; }
    }
    if (cartVenc === -1) { showToast('Nenhuma sequência!'); return; }
    playSound('bingo');
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
    try {
        await db.ref('salas/' + salaId + '/alertasBingo').push({ jogadorId: jogadorId, jogadorNome: jogador.nome + ' ' + jogador.sobrenome, foto: jogador.foto, cartelaIndex: cartVenc, timestamp: Date.now() });
        await db.ref('jogadores/' + jogadorId).update({ gritouBingo: true, cartelaVencedora: cartVenc });
        document.getElementById('telaVerificacao').classList.add('active');
    } catch (e) { showToast('Erro'); }
}

function escutarMudancas() {
    db.ref('salas/' + salaId).on('value', (snap) => {
        const s = snap.val();
        if (!s) return;
        sala = s;
        ganhadores = s.ganhadores || [];
        renderizarGanhadores();
        if (s.jogando && !document.getElementById('telaJogo').classList.contains('active')) {
            document.getElementById('fimJogoOverlay').classList.remove('active');
            iniciarJogo();
        }
        if (s.girando) {
            document.getElementById('globoGirandoAviso').classList.add('active');
            if (!vibrando && navigator.vibrate) { vibrando = true; vibraContinuo(); }
        } else {
            document.getElementById('globoGirandoAviso').classList.remove('active');
            vibrando = false;
        }
        if (s.superVencedor) {
            document.getElementById('telaVerificacao').classList.remove('active');
            document.getElementById('telaResultado').classList.remove('active');
            document.getElementById('fimJogoOverlay').classList.add('active');
            document.getElementById('fimJogoVencedor').textContent = s.superVencedor.nome + ' venceu com CARTELA CHEIA!';
            criarConfetes();
            playSound('vitoria');
        }
    });
    db.ref('jogadores/' + jogadorId).on('value', (snap) => {
        const d = snap.val();
        if (!d) return;
        const antigoBingo = jogador?.gritouBingo;
        jogador = d;
        renderizarCartelas();
        atualizarNavegacao();
        atualizarBotaoBingo();
        if (antigoBingo && !jogador.gritouBingo) { document.getElementById('telaVerificacao').classList.remove('active'); showToast('Bingo não validado!'); }
    });
    db.ref('salas/' + salaId + '/ganhadores').on('value', (snap) => {
        const g = snap.val() || [];
        const meusNomes = jogador.nome + ' ' + jogador.sobrenome;
        const novoGanhador = g.find(x => x.nome === meusNomes && !ganhadores.find(y => y.nome === meusNomes && y.timestamp === x.timestamp));
        if (novoGanhador && !novoGanhador.tipo.includes('CARTELA CHEIA')) {
            document.getElementById('telaVerificacao').classList.remove('active');
            document.getElementById('resultadoIcon').textContent = '🎉';
            document.getElementById('resultadoTitulo').textContent = 'VOCÊ GANHOU!';
            document.getElementById('resultadoTitulo').className = 'resultado-titulo venceu';
            document.getElementById('resultadoMsg').textContent = novoGanhador.tipo + ' - Continue jogando!';
            document.getElementById('telaResultado').classList.add('active');
            criarConfetes();
            playSound('vitoria');
            db.ref('jogadores/' + jogadorId + '/gritouBingo').set(false);
        }
        ganhadores = g;
    });
    db.ref('salas/' + salaId + '/reacoes').on('child_added', (snap) => {
        const r = snap.val();
        if (r.nome !== jogador.nome) mostrarBalaoReacao(r);
    });
}

function renderizarGanhadores() {
    const sec = document.getElementById('ganhadoresAviso');
    const lst = document.getElementById('ganhadoresMini');
    if (!ganhadores.length) { sec.style.display = 'none'; return; }
    sec.style.display = 'block';
    lst.innerHTML = ganhadores.map(g => '<div class="ganhador-mini"><img src="' + (g.foto || getDefaultAvatar()) + '"><span>' + g.nome.split(' ')[0] + '</span></div>').join('');
}

function vibraContinuo() { if (!vibrando) return; if (navigator.vibrate) navigator.vibrate(200); setTimeout(vibraContinuo, 300); }

function mostrarBalaoReacao(r) {
    const balao = document.createElement('div');
    balao.className = 'balao-reacao';
    balao.style.left = (10 + Math.random() * 70) + '%';
    balao.innerHTML = '<img class="balao-foto" src="' + (r.foto || getDefaultAvatar()) + '"><span class="balao-nome">' + r.nome + ' ✅</span>';
    document.body.appendChild(balao);
    setTimeout(() => balao.remove(), 2500);
}

function voltarJogo() {
    document.querySelectorAll('.confetti').forEach(c => c.remove());
    document.getElementById('telaResultado').classList.remove('active');
}

function atualizarNavegacao() {
    const tot = jogador.cartelas.length;
    document.getElementById('cartelaAtualNum').textContent = cartelaAtual + 1;
    document.getElementById('btnAnterior').disabled = cartelaAtual === 0;
    document.getElementById('btnProxima').disabled = cartelaAtual === tot - 1;
    document.querySelectorAll('.pagination-dot').forEach((d, idx) => { d.classList.toggle('active', idx === cartelaAtual); });
    document.getElementById('cartelasContainer').style.transform = 'translateX(-' + cartelaAtual * 100 + '%)';
}

function cartelaAnterior() { if (cartelaAtual > 0) { cartelaAtual--; atualizarNavegacao(); } }
function proximaCartela() { if (cartelaAtual < jogador.cartelas.length - 1) { cartelaAtual++; atualizarNavegacao(); } }
function irParaCartela(idx) { cartelaAtual = idx; atualizarNavegacao(); }

function setupSwipe() {
    const w = document.getElementById('cartelasWrapper');
    w.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    w.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) { diff > 0 ? proximaCartela() : cartelaAnterior(); }
    }, { passive: true });
}

function criarConfetes() {
    const cores = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ffd700', '#ec4899', '#4ecdc4'];
    for (let i = 0; i < 80; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + '%';
        c.style.background = cores[Math.floor(Math.random() * cores.length)];
        c.style.animationDelay = Math.random() * 3 + 's';
        c.style.animationDuration = (2 + Math.random() * 2) + 's';
        document.body.appendChild(c);
    }
}

function playSound(tipo) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (tipo === 'ploc') {
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
        } else if (tipo === 'bingo') {
            [600, 800, 1000, 1200].forEach((f, i) => {
                setTimeout(() => {
                    const osc = ctx.createOscillator(); const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.frequency.value = f;
                    gain.gain.setValueAtTime(0.4, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
                }, i * 100);
            });
        } else if (tipo === 'vitoria') {
            [523, 659, 784, 880, 1047].forEach((n, i) => {
                setTimeout(() => {
                    const osc = ctx.createOscillator(); const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.frequency.value = n;
                    gain.gain.setValueAtTime(0.4, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
                }, i * 150);
            });
        }
    } catch (e) {}
}
