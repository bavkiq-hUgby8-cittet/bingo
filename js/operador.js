/* BINGO DOS VELOSO - OPERADOR JS */

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

let salaAtual = null;
let salaAtualData = null;
let numerosSorteados = [];
let premioBase64 = null;
let animacaoGiroInterval = null;
let ganhadores = [];
let ultimoNumero = null;
let ultimaLetra = null;

const TEMPO_MOSTRAR_LETRA = 3500;
const TEMPO_MOSTRAR_NUMERO = 5000;

document.addEventListener('DOMContentLoaded', () => {
    carregarSalas();
    criarBolasGlobo();
});

const showToast = (msg) => {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('active');
    setTimeout(() => t.classList.remove('active'), 3000);
};

const showLoading = () => document.getElementById('loading').classList.add('active');
const hideLoading = () => document.getElementById('loading').classList.remove('active');
const fecharModal = (id) => document.getElementById(id).classList.remove('active');
const gerarId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
const getLetra = (n) => n <= 15 ? 'B' : n <= 30 ? 'I' : n <= 45 ? 'N' : n <= 60 ? 'G' : 'O';

function getDefaultAvatar() {
    return "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%234ecdc4' width='100' height='100'/><text x='50' y='60' text-anchor='middle' font-size='40'>👤</text></svg>";
}

function handlePremio(e) {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = c.height = 300;
            const ctx = c.getContext('2d');
            const min = Math.min(img.width, img.height);
            ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, 300, 300);
            premioBase64 = c.toDataURL('image/jpeg', 0.8);
            document.getElementById('premioPreview').innerHTML = '<img class="premio-preview" src="' + premioBase64 + '"><p style="color:var(--yellow)">✅ Adicionado!</p>';
        };
        img.src = ev.target.result;
    };
    r.readAsDataURL(f);
}

async function criarSala() {
    const n = document.getElementById('nomeSala').value.trim();
    const c = parseInt(document.getElementById('qtdCartelas').value);
    if (!n) { showToast('📝 Digite o nome!'); return; }
    showLoading();
    const id = gerarId();
    try {
        await db.ref('salas/' + id).set({
            nome: n, cartelasPorJogador: c, premio: premioBase64, ativa: true, jogando: false, girando: false,
            numeroAtual: null, letraAtual: null, faseAnimacao: 'idle', numerosSorteados: [], ganhadores: [], superVencedor: null, criadaEm: Date.now()
        });
        document.getElementById('nomeSala').value = '';
        document.getElementById('premioPreview').innerHTML = '<div class="premio-icon">🎁</div><p>Clique para adicionar</p>';
        premioBase64 = null;
        showToast('✅ Sala criada!');
    } catch (e) { showToast('❌ Erro: ' + e.message); }
    hideLoading();
}

function carregarSalas() {
    db.ref('salas').on('value', (s) => renderizarSalas(s.val() || {}));
}

function renderizarSalas(salas) {
    const l = document.getElementById('salasLista');
    const atv = Object.entries(salas).filter(([_, s]) => s.ativa);
    
    if (!atv.length) {
        l.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎱</div><p>Nenhuma sala ativa</p></div>';
        return;
    }
    
    l.innerHTML = atv.map(([id, s]) => {
        return '<div class="sala-card"><div class="sala-header"><div class="sala-nome">🎰 ' + s.nome + '</div>' +
            (s.premio ? '<img class="sala-premio" src="' + s.premio + '">' : '') +
            '</div><div class="sala-info"><div class="sala-info-item"><span>📋</span><span>' + s.cartelasPorJogador + ' cartela(s)</span></div>' +
            '<div class="sala-info-item" id="jog-' + id + '"><span>👥</span><span>...</span></div></div>' +
            '<div class="qr-container" id="qr-' + id + '"></div><div class="sala-buttons">' +
            (s.jogando ? '<button class="btn-sala btn-iniciar" onclick="entrarJogo(\'' + id + '\')">▶️ CONTINUAR</button>'
                      : '<button class="btn-sala btn-iniciar" onclick="mostrarRegras(\'' + id + '\')">🎮 INICIAR</button>') +
            '<button class="btn-sala btn-jogadores" onclick="verJogadores(\'' + id + '\')">👥 JOGADORES</button>' +
            '<button class="btn-sala btn-encerrar" onclick="encerrarSala(\'' + id + '\')">🗑️ ENCERRAR</button></div></div>';
    }).join('');
    
    atv.forEach(([id]) => {
        const url = location.origin + location.pathname.replace('index.html', '') + 'jogador.html?sala=' + id;
        const qr = document.getElementById('qr-' + id);
        if (qr) { qr.innerHTML = ''; new QRCode(qr, { text: url, width: 180, height: 180 }); }
        db.ref('jogadores').orderByChild('salaId').equalTo(id).on('value', (snap) => {
            const el = document.getElementById('jog-' + id);
            if (el) el.innerHTML = '<span>👥</span><span>' + Object.keys(snap.val() || {}).length + '</span>';
        });
    });
}

async function verJogadores(salaId) {
    const snap = await db.ref('jogadores').orderByChild('salaId').equalTo(salaId).once('value');
    const jogs = snap.val() || {};
    const salaSnap = await db.ref('salas/' + salaId).once('value');
    const sala = salaSnap.val();
    const l = document.getElementById('jogadoresLista');
    const arr = Object.entries(jogs);
    
    if (!arr.length) {
        l.innerHTML = '<div class="empty-state"><p>Nenhum jogador</p></div>';
    } else {
        l.innerHTML = arr.map(([id, j]) => '<div class="jogador-item"><div class="jogador-info">' +
            '<img class="jogador-foto" src="' + (j.foto || getDefaultAvatar()) + '">' +
            '<div><div class="jogador-nome">' + j.nome + ' ' + j.sobrenome + '</div>' +
            '<div class="jogador-cartelas-info">' + (j.cartelas?.length || sala.cartelasPorJogador) + ' cartela(s)</div></div></div>' +
            '<div class="jogador-cartelas-edit"><input type="number" class="cartelas-input" id="cart-' + id + '" value="' + (j.cartelas?.length || sala.cartelasPorJogador) + '" min="1" max="10">' +
            '<button class="btn-salvar-cartelas" onclick="atualizarCartelas(\'' + id + '\',\'' + salaId + '\')">💾</button></div></div>'
        ).join('');
    }
    
    let tot = 0;
    arr.forEach(([_, j]) => tot += j.cartelas?.length || sala.cartelasPorJogador);
    document.getElementById('totalJogadores').textContent = '📊 ' + arr.length + ' jogadores, ' + tot + ' cartelas';
    document.getElementById('modalJogadores').classList.add('active');
}

async function atualizarCartelas(jId, sId) {
    const q = parseInt(document.getElementById('cart-' + jId).value);
    if (q < 1 || q > 10) { showToast('❌ 1-10 cartelas'); return; }
    showLoading();
    try {
        const snap = await db.ref('jogadores/' + jId).once('value');
        const j = snap.val();
        let carts = [...(j.cartelas || [])];
        if (q > carts.length) { for (let i = carts.length; i < q; i++) carts.push(gerarCartela(i)); }
        else { carts = carts.slice(0, q); }
        await db.ref('jogadores/' + jId + '/cartelas').set(carts);
        showToast('✅ Atualizado!');
        verJogadores(sId);
    } catch (e) { showToast('❌ ' + e.message); }
    hideLoading();
}

function gerarCartela(idx) {
    const gen = (mi, ma, qt) => { const n = []; while (n.length < qt) { const x = Math.floor(Math.random() * (ma - mi + 1)) + mi; if (!n.includes(x)) n.push(x); } return n; };
    const B = gen(1, 15, 5), I = gen(16, 30, 5), N = gen(31, 45, 4), G = gen(46, 60, 5), O = gen(61, 75, 5);
    const nums = [];
    for (let l = 0; l < 5; l++) nums.push([B[l], I[l], l === 2 ? 0 : N[l < 2 ? l : l - 1], G[l], O[l]]);
    return { id: idx + 1, numeros: nums, marcados: [0], totalMarcados: 1 };
}

let salaParaIniciar = null;

function mostrarRegras(id) {
    salaParaIniciar = id;
    document.getElementById('regrasModal').classList.add('active');
}

async function confirmarInicioJogo() {
    document.getElementById('regrasModal').classList.remove('active');
    if (salaParaIniciar) await iniciarJogo(salaParaIniciar);
}

async function iniciarJogo(sId) {
    showLoading();
    try {
        await db.ref('salas/' + sId).update({
            jogando: true, girando: false, numeroAtual: null, letraAtual: null, faseAnimacao: 'idle',
            numerosSorteados: [], ganhadores: [], superVencedor: null, alertasBingo: null
        });
        entrarJogo(sId);
    } catch (e) { showToast('❌ ' + e.message); }
    hideLoading();
}

function entrarJogo(sId) {
    salaAtual = sId;
    document.getElementById('telaInicial').style.display = 'none';
    document.getElementById('telaJogo').classList.add('active');
    
    db.ref('salas/' + sId).on('value', (snap) => {
        const s = snap.val();
        if (!s) return;
        salaAtualData = s;
        document.getElementById('jogoTitulo').textContent = '🎰 ' + s.nome + ' 🎰';
        numerosSorteados = s.numerosSorteados || [];
        ganhadores = s.ganhadores || [];
        
        if (s.premio) {
            document.getElementById('premioDestaque').style.display = 'flex';
            document.getElementById('premioImgJogo').src = s.premio;
        } else { document.getElementById('premioDestaque').style.display = 'none'; }
        
        renderizarGrade();
        renderizarGanhadores();
        document.getElementById('contadorSorteados').textContent = numerosSorteados.length;
        atualizarEstadoSorteio(s);
        atualizarBotaoUltimo();
        
        if (s.superVencedor) mostrarSuperVencedor(s.superVencedor, s.premio);
    });
    
    db.ref('salas/' + sId + '/reacoes').on('child_added', (snap) => {
        mostrarReacao(snap.val());
        setTimeout(() => db.ref('salas/' + sId + '/reacoes/' + snap.key).remove(), 4000);
    });
    
    db.ref('salas/' + sId + '/alertasBingo').on('value', (snap) => {
        renderizarAlertasTopo(Object.entries(snap.val() || {}));
    });
}

function renderizarGanhadores() {
    const sec = document.getElementById('ganhadoresSection');
    const lst = document.getElementById('ganhadoresLista');
    if (!ganhadores.length) { sec.style.display = 'none'; return; }
    sec.style.display = 'block';
    lst.innerHTML = ganhadores.map(g => '<div class="ganhador-badge"><img class="ganhador-foto" src="' + (g.foto || getDefaultAvatar()) + '">' +
        '<div class="ganhador-info"><div class="ganhador-nome">' + g.nome + '</div><div class="ganhador-tipo">' + g.tipo + '</div></div></div>').join('');
}

function atualizarEstadoSorteio(s) {
    const btn = document.getElementById('btnSortear');
    const cage = document.getElementById('globoCage');
    
    if (s.girando) {
        btn.textContent = '✋ PARAR!';
        btn.classList.add('girando');
        cage.classList.add('girando');
        animarBolasGlobo();
    } else if (s.faseAnimacao === 'letra') {
        btn.disabled = true;
        btn.textContent = '🎲 GIRAR GLOBO';
        btn.classList.remove('girando');
        cage.classList.remove('girando');
        pararAnimacaoBolas();
        bingoAnimacoes.mostrarLetra(s.letraAtual);
    } else if (s.faseAnimacao === 'numero') {
        btn.disabled = true;
        bingoAnimacoes.mostrarNumero(s.numeroAtual, s.letraAtual);
    } else {
        btn.textContent = '🎲 GIRAR GLOBO';
        btn.classList.remove('girando');
        btn.disabled = false;
        cage.classList.remove('girando');
        pararAnimacaoBolas();
        bingoAnimacoes.esconder();
    }
}

function atualizarBotaoUltimo() {
    const btn = document.getElementById('btnUltimo');
    btn.disabled = !numerosSorteados.length;
    if (numerosSorteados.length) {
        ultimoNumero = numerosSorteados[numerosSorteados.length - 1];
        ultimaLetra = getLetra(ultimoNumero);
    }
}

function criarBolasGlobo() {
    const e = document.getElementById('globoInterior');
    const cores = { B: 'bola-b', I: 'bola-i', N: 'bola-n', G: 'bola-g', O: 'bola-o' };
    e.innerHTML = '';
    for (let i = 0; i < 18; i++) {
        const b = document.createElement('div');
        b.className = 'bola-bingo';
        const l = ['B', 'I', 'N', 'G', 'O'][Math.floor(Math.random() * 5)];
        b.classList.add(cores[l]);
        b.style.top = (10 + Math.random() * 70) + '%';
        b.style.left = (10 + Math.random() * 70) + '%';
        const num = l === 'B' ? Math.floor(Math.random() * 15) + 1 : l === 'I' ? Math.floor(Math.random() * 15) + 16 : l === 'N' ? Math.floor(Math.random() * 15) + 31 : l === 'G' ? Math.floor(Math.random() * 15) + 46 : Math.floor(Math.random() * 15) + 61;
        b.textContent = num;
        e.appendChild(b);
    }
}

function animarBolasGlobo() {
    if (animacaoGiroInterval) return;
    const bolas = document.querySelectorAll('.bola-bingo');
    animacaoGiroInterval = setInterval(() => {
        bolas.forEach(b => {
            b.style.transition = 'all .08s ease-out';
            b.style.top = (5 + Math.random() * 80) + '%';
            b.style.left = (5 + Math.random() * 80) + '%';
        });
    }, 80);
}

function pararAnimacaoBolas() {
    if (animacaoGiroInterval) { clearInterval(animacaoGiroInterval); animacaoGiroInterval = null; }
}

async function iniciarSorteio() {
    if (salaAtualData.girando) { await pararESortear(); }
    else { await db.ref('salas/' + salaAtual).update({ girando: true, faseAnimacao: 'girando' }); }
}

async function pararESortear() {
    const disp = [];
    for (let i = 1; i <= 75; i++) { if (!numerosSorteados.includes(i)) disp.push(i); }
    if (!disp.length) {
        showToast('🎉 Todos sorteados!');
        await db.ref('salas/' + salaAtual).update({ girando: false, faseAnimacao: 'idle' });
        return;
    }
    const num = disp[Math.floor(Math.random() * disp.length)];
    const let_ = getLetra(num);
    ultimoNumero = num;
    ultimaLetra = let_;
    
    await db.ref('salas/' + salaAtual).update({ girando: false, letraAtual: let_, faseAnimacao: 'letra' });
    
    setTimeout(async () => {
        await db.ref('salas/' + salaAtual).update({ numeroAtual: num, faseAnimacao: 'numero', numerosSorteados: [...numerosSorteados, num] });
        setTimeout(async () => {
            await db.ref('salas/' + salaAtual).update({ numeroAtual: null, letraAtual: null, faseAnimacao: 'idle' });
        }, TEMPO_MOSTRAR_NUMERO);
    }, TEMPO_MOSTRAR_LETRA);
}

function mostrarUltimoNumero() {
    if (!ultimoNumero || !ultimaLetra) { showToast('Nenhum número sorteado ainda!'); return; }
    const overlay = document.getElementById('animacaoOverlay');
    const faseLetra = document.getElementById('faseLetra');
    const faseNumero = document.getElementById('faseNumero');
    overlay.classList.add('active');
    faseLetra.classList.remove('active');
    faseNumero.classList.add('active');
    bingoAnimacoes.mostrarNumero(ultimoNumero, ultimaLetra);
    setTimeout(() => { bingoAnimacoes.esconder(); }, 4000);
}

function renderizarAlertasTopo(alertas) {
    const sec = document.getElementById('alertasTopo');
    const lst = document.getElementById('alertasTopoLista');
    if (!alertas.length) { sec.classList.remove('active'); return; }
    sec.classList.add('active');
    lst.innerHTML = alertas.map(([id, a]) => '<div class="alerta-topo-item"><img class="alerta-topo-foto" src="' + (a.foto || getDefaultAvatar()) + '">' +
        '<div class="alerta-topo-info"><div class="alerta-topo-nome">' + a.jogadorNome + '</div><div class="alerta-topo-cartela">Cartela ' + (a.cartelaIndex + 1) + '</div></div>' +
        '<div class="alerta-topo-buttons"><button class="alerta-topo-btn verificar" onclick="verificarBingo(\'' + a.jogadorId + '\',' + a.cartelaIndex + ',\'' + id + '\')">✅</button>' +
        '<button class="alerta-topo-btn ignorar" onclick="ignorarBingo(\'' + id + '\')">❌</button></div></div>').join('');
}

async function verificarBingo(jId, cIdx, aId) {
    showLoading();
    try {
        const snap = await db.ref('jogadores/' + jId).once('value');
        const j = snap.val();
        if (!j?.cartelas) { showToast('❌ Não encontrado'); hideLoading(); return; }
        const cart = j.cartelas[cIdx];
        const marc = cart.marcados || [];
        const perd = [];
        cart.numeros.flat().filter(n => n !== 0).forEach(n => { if (numerosSorteados.includes(n) && !marc.includes(n)) perd.push(n); });
        const seq = verificarSequencias(cart.numeros, marc);
        renderizarVerificacao(j, cart, marc, perd, seq, aId);
    } catch (e) { showToast('❌ ' + e.message); }
    hideLoading();
}

function verificarSequencias(nums, marc) {
    const s = { linhas: [], colunas: [], diagonais: [], cruzada: false, cartelaCheia: true, tipoVitoria: null };
    for (let i = 0; i < 5; i++) { if (nums[i].every(n => n === 0 || marc.includes(n))) s.linhas.push(i); }
    for (let c = 0; c < 5; c++) { if (nums.map(l => l[c]).every(n => n === 0 || marc.includes(n))) s.colunas.push(c); }
    if ([nums[0][0], nums[1][1], nums[2][2], nums[3][3], nums[4][4]].every(n => n === 0 || marc.includes(n))) s.diagonais.push('d1');
    if ([nums[0][4], nums[1][3], nums[2][2], nums[3][1], nums[4][0]].every(n => n === 0 || marc.includes(n))) s.diagonais.push('d2');
    if (s.diagonais.length === 2) s.cruzada = true;
    s.cartelaCheia = nums.flat().filter(n => n !== 0).every(n => marc.includes(n));
    if (s.cartelaCheia) s.tipoVitoria = '🏆 CARTELA CHEIA';
    else if (s.cruzada) s.tipoVitoria = '✖️ Cruzada';
    else if (s.diagonais.length) s.tipoVitoria = '↗️ Diagonal';
    else if (s.linhas.length) s.tipoVitoria = '➖ Linha';
    else if (s.colunas.length) s.tipoVitoria = '| Coluna';
    return s;
}

function renderizarVerificacao(j, cart, marc, perd, seq, aId) {
    document.getElementById('verificacaoNome').innerHTML = '<strong>' + j.nome + ' ' + j.sobrenome + '</strong> - Cartela ' + cart.id;
    const g = document.getElementById('verificacaoCartela');
    g.innerHTML = '<div class="verificacao-header">B</div><div class="verificacao-header">I</div><div class="verificacao-header">N</div><div class="verificacao-header">G</div><div class="verificacao-header">O</div>';
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const n = cart.numeros[r][c];
            let cls = 'verificacao-cell';
            if (n === 0) cls += ' coringa';
            else if (marc.includes(n)) cls += ' marcado-correto';
            else if (numerosSorteados.includes(n)) cls += ' nao-marcou';
            if (seq.linhas.includes(r) || seq.colunas.includes(c) || (seq.diagonais.includes('d1') && r === c) || (seq.diagonais.includes('d2') && r + c === 4)) cls += ' sequencia';
            g.innerHTML += '<div class="' + cls + '">' + (n === 0 ? '⭐' : n) + '</div>';
        }
    }
    const res = document.getElementById('resultadoVerificacao');
    const tem = seq.linhas.length || seq.colunas.length || seq.diagonais.length || seq.cartelaCheia;
    const valido = !perd.length && tem;
    if (valido) {
        res.className = 'resultado-verificacao valido';
        res.innerHTML = '<h3 class="resultado-titulo" style="color:var(--green)">✅ BINGO VÁLIDO!</h3><p style="font-size:1.3rem">' + seq.tipoVitoria + '</p>' + (seq.cartelaCheia ? '<p style="color:var(--yellow);font-size:1.1rem;margin-top:10px">🏆 SUPER PRÊMIO - FIM DO JOGO!</p>' : '');
    } else {
        res.className = 'resultado-verificacao invalido';
        res.innerHTML = '<h3 class="resultado-titulo" style="color:var(--red)">❌ BINGO INVÁLIDO!</h3>' + (perd.length ? '<p>Perdeu ' + perd.length + ' número(s):</p><div class="numeros-perdidos-lista">' + perd.map(n => '<span class="numero-perdido">' + getLetra(n) + ' ' + n + '</span>').join('') + '</div>' : '<p>Sem sequência válida</p>');
    }
    document.getElementById('verificacaoButtons').innerHTML = valido ? '<button class="btn-vencedor" onclick="declararGanhador(\'' + j.nome + ' ' + j.sobrenome + '\',\'' + (j.foto || '') + '\',\'' + aId + '\',\'' + seq.tipoVitoria + '\',' + seq.cartelaCheia + ')">' + (seq.cartelaCheia ? '🏆 SUPER CAMPEÃO!' : '🎉 CONFIRMAR GANHADOR') + '</button><button class="btn-continuar" onclick="fecharModal(\'modalVerificacao\')">▶️ VOLTAR</button>' : '<button class="btn-continuar" onclick="fecharModal(\'modalVerificacao\');ignorarBingo(\'' + aId + '\')">▶️ CONTINUAR</button>';
    document.getElementById('modalVerificacao').classList.add('active');
}

async function ignorarBingo(aId) { await db.ref('salas/' + salaAtual + '/alertasBingo/' + aId).remove(); }

async function declararGanhador(nome, foto, aId, tipo, isCartelaCheia) {
    fecharModal('modalVerificacao');
    const novoGanhador = { nome: nome, foto: foto, tipo: tipo, timestamp: Date.now() };
    const novosGanhadores = [...ganhadores, novoGanhador];
    await db.ref('salas/' + salaAtual + '/ganhadores').set(novosGanhadores);
    await db.ref('salas/' + salaAtual + '/alertasBingo/' + aId).remove();
    if (isCartelaCheia) {
        await db.ref('salas/' + salaAtual).update({ jogando: false, superVencedor: { nome: nome, foto: foto } });
        mostrarSuperVencedor({ nome: nome, foto: foto }, salaAtualData.premio);
    } else {
        showToast('🎉 ' + nome + ' ganhou! Jogo continua...');
        bingoAnimacoes.tocarSomGanhador();
    }
}

function mostrarSuperVencedor(v, premio) {
    document.getElementById('vencedorNome').textContent = v.nome;
    document.getElementById('vencedorFoto').src = v.foto || getDefaultAvatar();
    if (premio) { document.getElementById('premioVencedor').style.display = 'flex'; document.getElementById('premioVencedorImg').src = premio; }
    else { document.getElementById('premioVencedor').style.display = 'none'; }
    document.getElementById('telaVitoria').classList.add('active');
    criarConfetes();
    bingoAnimacoes.tocarSomVitoria();
}

function criarConfetes() {
    const cores = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ffd700', '#ec4899', '#4ecdc4'];
    const cont = document.getElementById('telaVitoria');
    for (let i = 0; i < 150; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + '%';
        c.style.background = cores[Math.floor(Math.random() * cores.length)];
        c.style.animationDelay = Math.random() * 3 + 's';
        c.style.animationDuration = (2 + Math.random() * 3) + 's';
        c.style.width = c.style.height = (8 + Math.random() * 12) + 'px';
        c.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        cont.appendChild(c);
    }
}

async function novoJogo() {
    document.querySelectorAll('.confetti').forEach(c => c.remove());
    document.getElementById('telaVitoria').classList.remove('active');
    await db.ref('salas/' + salaAtual).update({ jogando: true, girando: false, numeroAtual: null, letraAtual: null, faseAnimacao: 'idle', numerosSorteados: [], ganhadores: [], superVencedor: null, alertasBingo: null, reacoes: null });
    const snap = await db.ref('jogadores').orderByChild('salaId').equalTo(salaAtual).once('value');
    const jogs = snap.val() || {};
    for (const [id, j] of Object.entries(jogs)) {
        if (j.cartelas) {
            await db.ref('jogadores/' + id + '/cartelas').set(j.cartelas.map(c => ({ ...c, marcados: [0], totalMarcados: 1 })));
            await db.ref('jogadores/' + id + '/gritouBingo').set(false);
        }
    }
    ultimoNumero = null;
    ultimaLetra = null;
    showToast('🎰 Novo jogo!');
}

function mostrarReacao(r) {
    const cont = document.getElementById('reacoesContainer');
    const div = document.createElement('div');
    div.className = 'reacao';
    div.innerHTML = '<img class="reacao-foto" src="' + (r.foto || getDefaultAvatar()) + '"><span class="reacao-nome">' + r.nome + '</span><span class="reacao-icon">✅</span>';
    cont.appendChild(div);
    setTimeout(() => div.remove(), 3500);
}

function renderizarGrade() {
    const c = document.getElementById('gradeNumeros');
    let h = '<div class="letras-header"><div class="letra-col b">B</div><div class="letra-col i">I</div><div class="letra-col n">N</div><div class="letra-col g">G</div><div class="letra-col o">O</div></div><div class="numeros-colunas">';
    [[1, 15, 'b'], [16, 30, 'i'], [31, 45, 'n'], [46, 60, 'g'], [61, 75, 'o']].forEach(([mi, ma, l]) => {
        h += '<div class="coluna-numeros">';
        for (let i = mi; i <= ma; i++) h += '<div class="numero-cell ' + (numerosSorteados.includes(i) ? 'sorteado ' + l : '') + '">' + i + '</div>';
        h += '</div>';
    });
    h += '</div>';
    c.innerHTML = h;
}

function voltarInicio() {
    salaAtual = null;
    salaAtualData = null;
    document.getElementById('telaInicial').style.display = 'grid';
    document.getElementById('telaJogo').classList.remove('active');
    document.getElementById('alertasTopo').classList.remove('active');
    pararAnimacaoBolas();
    bingoAnimacoes.esconder();
}

async function encerrarSala(sId) {
    if (!confirm('⚠️ Encerrar sala?')) return;
    showLoading();
    try {
        const snap = await db.ref('jogadores').orderByChild('salaId').equalTo(sId).once('value');
        for (const id of Object.keys(snap.val() || {})) await db.ref('jogadores/' + id).remove();
        await db.ref('salas/' + sId).update({ ativa: false });
        showToast('✅ Encerrada!');
    } catch (e) { showToast('❌ ' + e.message); }
    hideLoading();
}

async function resetarTudo() {
    if (!confirm('⚠️ APAGAR TUDO?')) return;
    if (!confirm('🚨 CERTEZA?')) return;
    showLoading();
    try {
        await db.ref('salas').remove();
        await db.ref('jogadores').remove();
        if (salaAtual) voltarInicio();
        showToast('✅ Resetado!');
    } catch (e) { showToast('❌ ' + e.message); }
    hideLoading();
}
