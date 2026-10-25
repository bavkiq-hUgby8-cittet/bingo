/* BINGO DOS VELOSO — painel do operador (telão) */

let db = null;
let salaAtual = null;
let salaAtualData = null;
let numerosSorteados = [];
let premioBase64 = null;
let animacaoGiroInterval = null;
let ganhadores = [];
let ultimoNumero = null;
let ultimaLetra = null;
let salaParaIniciar = null;
let faseRenderizada = '';
let vitoriaMostrada = false;
let sorteioTravado = false;
let sorteioGeracao = 0;
let assinaturaSalas = null;
let bancoIndisponivel = false;
const ouvintesJogadores = new Map();
let ouvinteSala = null;
let ouvinteAlertas = null;
let ouvinteReacoes = null;
let salaEscutada = null;

document.addEventListener('DOMContentLoaded', async () => {
    criarBolasGlobo();
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape') fecharModalAberto();
    });
    document.body.addEventListener('click', aoClicar);

    const inicio = BingoComum.iniciarFirebase();
    if (!inicio.ok) {
        mostrarAvisoBanco(BingoComum.mensagemBanco(inicio));
        return;
    }
    db = inicio.db;
    observarConexao();

    const saude = await BingoComum.verificarBanco();
    if (!saude.ok) {
        bancoIndisponivel = true;
        mostrarAvisoBanco(BingoComum.mensagemBanco(saude));
        return;
    }
    esconderAvisoBanco();
    carregarSalas();
});

function mostrarAvisoBanco(texto) {
    const aviso = document.getElementById('avisoBanco');
    const alvo = document.getElementById('avisoBancoTexto');
    if (alvo) alvo.textContent = texto;
    if (aviso) aviso.hidden = false;
}

function esconderAvisoBanco() {
    const aviso = document.getElementById('avisoBanco');
    if (aviso) aviso.hidden = true;
}

function observarConexao() {
    const selo = document.getElementById('statusConexao');
    db.ref('.info/connected').on('value', (snap) => {
        if (!selo) return;
        const ligado = snap.val() === true;
        selo.textContent = ligado ? 'Conectado' : 'Reconectando…';
        selo.classList.toggle('offline', !ligado);
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('active');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove('active'), 3200);
}

function showLoading() {
    document.getElementById('loading').classList.add('active');
}
function hideLoading() {
    document.getElementById('loading').classList.remove('active');
}

function fecharModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

function fecharModalAberto() {
    document.querySelectorAll('.modal.active').forEach((modal) => modal.classList.remove('active'));
}

function aoClicar(evento) {
    const alvo = evento.target.closest('[data-acao]');
    if (!alvo) return;
    const acao = alvo.dataset.acao;
    if (acao === 'verificar') verificarBingo(alvo.dataset.jogador, Number(alvo.dataset.cartela), alvo.dataset.alerta);
    else if (acao === 'ignorar') ignorarBingo(alvo.dataset.alerta);
    else if (acao === 'ganhador') declararGanhador(alvo.dataset.jogador, alvo.dataset.alerta, alvo.dataset.tipo, alvo.dataset.cheia === '1');
    else if (acao === 'recusar') {
        fecharModal('modalVerificacao');
        ignorarBingo(alvo.dataset.alerta);
    }
    else if (acao === 'iniciar') mostrarRegras(alvo.dataset.sala);
    else if (acao === 'continuar') entrarJogo(alvo.dataset.sala);
    else if (acao === 'jogadores') verJogadores(alvo.dataset.sala);
    else if (acao === 'encerrar') encerrarSala(alvo.dataset.sala);
    else if (acao === 'copiar') copiarLink(alvo.dataset.url);
    else if (acao === 'salvar-cartelas') atualizarCartelas(alvo.dataset.jogador, alvo.dataset.sala);
}

async function copiarLink(url) {
    if (!url) return;
    try {
        await navigator.clipboard.writeText(url);
        showToast('Link da cartela copiado');
    } catch (erro) {
        window.prompt('Copie o link dos jogadores:', url);
    }
}

async function handlePremio(evento) {
    const arquivo = evento.target.files && evento.target.files[0];
    if (!arquivo) return;
    try {
        premioBase64 = await BingoComum.reduzirImagem(arquivo, 300, 0.8);
        document.getElementById('premioPreview').innerHTML = '<img class="premio-preview" alt="Foto do prêmio" src="' + premioBase64 + '"><p style="color:var(--yellow)">Adicionado</p>';
    } catch (erro) {
        premioBase64 = null;
        showToast(erro.message || 'Não consegui usar essa foto');
    }
}

async function criarSala() {
    if (bancoIndisponivel || !db) {
        showToast('O banco ainda está desativado. Reative o Firebase antes de criar a sala.');
        return;
    }
    const nome = document.getElementById('nomeSala').value.trim();
    const cartelas = parseInt(document.getElementById('qtdCartelas').value, 10);
    if (!nome) {
        showToast('Digite o nome da sala');
        document.getElementById('nomeSala').focus();
        return;
    }
    if (!Number.isFinite(cartelas) || cartelas < 1 || cartelas > 6) {
        showToast('Escolha de 1 a 6 cartelas');
        return;
    }
    showLoading();
    const id = BingoComum.gerarId();
    try {
        await db.ref('salas/' + id).set({
            nome: nome,
            cartelasPorJogador: cartelas,
            premio: premioBase64,
            ativa: true,
            jogando: false,
            girando: false,
            numeroAtual: null,
            letraAtual: null,
            faseAnimacao: 'idle',
            numerosSorteados: [],
            ganhadores: [],
            superVencedor: null,
            criadaEm: Date.now()
        });
        document.getElementById('nomeSala').value = '';
        document.getElementById('premioPreview').innerHTML = '<div class="premio-icon">🎁</div><p>Clique para adicionar</p>';
        document.getElementById('premioInput').value = '';
        premioBase64 = null;
        showToast('Sala criada');
    } catch (erro) {
        showToast('Erro ao criar sala: ' + erro.message);
    } finally {
        hideLoading();
    }
}

function carregarSalas() {
    db.ref('salas').on('value', (snap) => renderizarSalas(snap.val() || {}), (erro) => {
        mostrarAvisoBanco('Não deu para ler as salas. ' + (erro && erro.message ? erro.message : ''));
    });
}

function renderizarSalas(salas) {
    const lista = document.getElementById('salasLista');
    const ativas = Object.entries(salas).filter(([, sala]) => sala && sala.ativa);
    const assinatura = ativas.map(([id, sala]) => [
        id,
        sala.nome,
        sala.cartelasPorJogador,
        sala.jogando ? 1 : 0,
        sala.premio ? String(sala.premio).length : 0
    ].join(':')).join('|');

    const idsAtivos = new Set(ativas.map(([id]) => id));
    for (const [id, ouvinte] of ouvintesJogadores) {
        if (!idsAtivos.has(id)) {
            ouvinte.consulta.off('value', ouvinte.callback);
            ouvintesJogadores.delete(id);
        }
    }

    if (assinatura === assinaturaSalas) return;
    assinaturaSalas = assinatura;

    if (!ativas.length) {
        lista.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎱</div><p>Nenhuma sala ativa</p></div>';
        return;
    }

    lista.innerHTML = ativas.map(([id, sala]) => {
        const nome = BingoComum.escaparHtml(sala.nome || 'Sala');
        const premio = BingoComum.srcSegura(sala.premio);
        const url = BingoComum.escaparHtml(BingoComum.montarUrlJogador(location.href, id));
        const botaoJogo = sala.jogando
            ? '<button type="button" class="btn-sala btn-iniciar" data-acao="continuar" data-sala="' + id + '">Continuar</button>'
            : '<button type="button" class="btn-sala btn-iniciar" data-acao="iniciar" data-sala="' + id + '">Iniciar</button>';
        return '<article class="sala-card"><div class="sala-header"><h3 class="sala-nome">🎰 ' + nome + '</h3>' +
            (premio ? '<img class="sala-premio" alt="Prêmio da sala" src="' + premio + '">' : '') +
            '</div><div class="sala-info"><div class="sala-info-item"><span aria-hidden="true">📋</span><span>' + (sala.cartelasPorJogador || 1) + ' cartela(s)</span></div>' +
            '<div class="sala-info-item" id="jog-' + id + '"><span aria-hidden="true">👥</span><span>…</span></div></div>' +
            '<div class="qr-container" id="qr-' + id + '"></div>' +
            '<p class="qr-legenda">Aponte a câmera do celular para o QR Code</p>' +
            '<p class="qr-url"><a href="' + url + '" target="_blank" rel="noopener">' + url + '</a></p>' +
            '<div class="sala-buttons">' + botaoJogo +
            '<button type="button" class="btn-sala btn-copiar" data-acao="copiar" data-url="' + url + '">Copiar link</button>' +
            '<button type="button" class="btn-sala btn-jogadores" data-acao="jogadores" data-sala="' + id + '">Jogadores</button>' +
            '<button type="button" class="btn-sala btn-encerrar" data-acao="encerrar" data-sala="' + id + '">Encerrar</button></div></article>';
    }).join('');

    ativas.forEach(([id]) => {
        const url = BingoComum.montarUrlJogador(location.href, id);
        const qr = document.getElementById('qr-' + id);
        if (qr) {
            qr.innerHTML = '';
            if (typeof QRCode === 'function') {
                new QRCode(qr, { text: url, width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M });
                const imagem = qr.querySelector('img');
                if (imagem) imagem.alt = 'QR Code para entrar na sala';
            } else {
                qr.innerHTML = '<p>QR Code indisponível. Use o link.</p>';
            }
        }
        if (!ouvintesJogadores.has(id)) {
            const consulta = db.ref('jogadores').orderByChild('salaId').equalTo(id);
            const callback = (snap) => {
                const el = document.getElementById('jog-' + id);
                if (el) el.innerHTML = '<span aria-hidden="true">👥</span><span>' + Object.keys(snap.val() || {}).length + ' na sala</span>';
            };
            ouvintesJogadores.set(id, { consulta: consulta, callback: callback });
            consulta.on('value', callback);
        }
    });
}

async function verJogadores(salaId) {
    showLoading();
    try {
        const snap = await db.ref('jogadores').orderByChild('salaId').equalTo(salaId).once('value');
        const jogadores = snap.val() || {};
        const salaSnap = await db.ref('salas/' + salaId).once('value');
        const sala = salaSnap.val();
        const lista = document.getElementById('jogadoresLista');
        const entradas = Object.entries(jogadores);
        if (!sala) {
            showToast('Sala não encontrada');
            return;
        }
        if (!entradas.length) {
            lista.innerHTML = '<div class="empty-state"><p>Nenhum jogador ainda. Mostre o QR Code.</p></div>';
        } else {
            lista.innerHTML = entradas.map(([id, jogador]) => {
                const foto = BingoComum.srcSegura(jogador.foto) || BingoComum.avatarPadrao();
                const qtd = (jogador.cartelas && jogador.cartelas.length) || sala.cartelasPorJogador || 1;
                return '<div class="jogador-item"><div class="jogador-info"><img class="jogador-foto" alt="" src="' + foto + '">' +
                    '<div><div class="jogador-nome">' + BingoComum.escaparHtml(jogador.nome || '') + ' ' + BingoComum.escaparHtml(jogador.sobrenome || '') + '</div>' +
                    '<div class="jogador-cartelas-info">' + qtd + ' cartela(s)</div></div></div>' +
                    '<div class="jogador-cartelas-edit"><label class="sr-only" for="cart-' + id + '">Cartelas</label>' +
                    '<input type="number" class="cartelas-input" id="cart-' + id + '" value="' + qtd + '" min="1" max="10" inputmode="numeric">' +
                    '<button type="button" class="btn-salvar-cartelas" data-acao="salvar-cartelas" data-jogador="' + id + '" data-sala="' + salaId + '">Salvar</button></div></div>';
            }).join('');
        }
        let total = 0;
        entradas.forEach(([, jogador]) => {
            total += (jogador.cartelas && jogador.cartelas.length) || sala.cartelasPorJogador || 1;
        });
        document.getElementById('totalJogadores').textContent = entradas.length + ' jogadores, ' + total + ' cartelas';
        document.getElementById('modalJogadores').classList.add('active');
    } catch (erro) {
        showToast('Erro ao listar jogadores: ' + erro.message);
    } finally {
        hideLoading();
    }
}

async function atualizarCartelas(jogadorId, salaId) {
    const campo = document.getElementById('cart-' + jogadorId);
    const quantidade = campo ? parseInt(campo.value, 10) : NaN;
    if (!Number.isFinite(quantidade) || quantidade < 1 || quantidade > 10) {
        showToast('Use de 1 a 10 cartelas');
        return;
    }
    showLoading();
    try {
        const snap = await db.ref('jogadores/' + jogadorId).once('value');
        const jogador = snap.val();
        if (!jogador) {
            showToast('Jogador não encontrado');
            return;
        }
        let cartelas = Array.isArray(jogador.cartelas) ? jogador.cartelas.slice() : [];
        if (quantidade > cartelas.length) {
            for (let i = cartelas.length; i < quantidade; i += 1) cartelas.push(BingoComum.gerarCartela(i));
        } else {
            cartelas = cartelas.slice(0, quantidade);
        }
        await db.ref('jogadores/' + jogadorId + '/cartelas').set(cartelas);
        showToast('Cartelas atualizadas');
        await verJogadores(salaId);
    } catch (erro) {
        showToast(erro.message || 'Erro ao salvar');
    } finally {
        hideLoading();
    }
}

function mostrarRegras(id) {
    salaParaIniciar = id;
    document.getElementById('regrasModal').classList.add('active');
    const botao = document.querySelector('#regrasModal .btn-iniciar-jogo');
    if (botao) botao.focus();
}

async function confirmarInicioJogo() {
    fecharModal('regrasModal');
    if (salaParaIniciar) await iniciarJogo(salaParaIniciar);
}

async function iniciarJogo(salaId) {
    showLoading();
    try {
        const jogadoresSnap = await db.ref('jogadores').orderByChild('salaId').equalTo(salaId).once('value');
        const total = Object.keys(jogadoresSnap.val() || {}).length;
        await db.ref('salas/' + salaId).update({
            jogando: true,
            girando: false,
            numeroAtual: null,
            letraAtual: null,
            faseAnimacao: 'idle',
            numerosSorteados: [],
            ganhadores: [],
            superVencedor: null,
            alertasBingo: null
        });
        if (!total) showToast('Sala sem jogadores ainda. O QR Code continua valendo.');
        entrarJogo(salaId);
    } catch (erro) {
        showToast(erro.message || 'Não consegui iniciar');
    } finally {
        hideLoading();
    }
}

function desligarOuvintesJogo() {
    if (!salaEscutada || !db) return;
    if (ouvinteSala) db.ref('salas/' + salaEscutada).off('value', ouvinteSala);
    if (ouvinteAlertas) db.ref('salas/' + salaEscutada + '/alertasBingo').off('value', ouvinteAlertas);
    if (ouvinteReacoes) db.ref('salas/' + salaEscutada + '/reacoes').off('child_added', ouvinteReacoes);
    ouvinteSala = null;
    ouvinteAlertas = null;
    ouvinteReacoes = null;
    salaEscutada = null;
}

function entrarJogo(salaId) {
    if (salaEscutada && salaEscutada !== salaId) desligarOuvintesJogo();
    salaAtual = salaId;
    faseRenderizada = '';
    vitoriaMostrada = false;
    document.getElementById('telaInicial').style.display = 'none';
    document.getElementById('telaJogo').classList.add('active');
    document.getElementById('telaVitoria').classList.remove('active');

    if (salaEscutada === salaId && ouvinteSala) return;

    let reacoesProntas = false;
    ouvinteSala = (snap) => {
        const sala = snap.val();
        if (!sala) return;
        salaAtualData = sala;
        document.getElementById('jogoTitulo').textContent = '🎰 ' + (sala.nome || 'Bingo') + ' 🎰';
        numerosSorteados = BingoComum.listaNumeros(sala.numerosSorteados);
        ganhadores = BingoComum.listaDe(sala.ganhadores);
        const premio = BingoComum.srcSegura(sala.premio);
        const destaque = document.getElementById('premioDestaque');
        if (premio) {
            destaque.style.display = 'flex';
            document.getElementById('premioImgJogo').src = premio;
            document.getElementById('premioImgJogo').alt = 'Prêmio';
        } else {
            destaque.style.display = 'none';
        }
        const grade = document.getElementById('gradeNumeros');
        const chaveGrade = numerosSorteados.join(',');
        if (grade.dataset.chave !== chaveGrade) {
            grade.dataset.chave = chaveGrade;
            renderizarGrade();
        }
        document.getElementById('contadorSorteados').textContent = String(numerosSorteados.length);
        renderizarGanhadores();
        atualizarEstadoSorteio(sala);
        atualizarBotaoUltimo();
        if (sala.superVencedor && !vitoriaMostrada) {
            vitoriaMostrada = true;
            mostrarSuperVencedor(sala.superVencedor, sala.premio);
        }
    };
    ouvinteAlertas = (snap) => renderizarAlertasTopo(Object.entries(snap.val() || {}));
    ouvinteReacoes = (snap) => {
        if (!reacoesProntas) return;
        const reacao = snap.val();
        if (reacao) mostrarReacao(reacao);
        setTimeout(() => db.ref('salas/' + salaId + '/reacoes/' + snap.key).remove().catch(() => {}), 4000);
    };

    salaEscutada = salaId;
    db.ref('salas/' + salaId).on('value', ouvinteSala);
    db.ref('salas/' + salaId + '/alertasBingo').on('value', ouvinteAlertas);
    const reacoesRef = db.ref('salas/' + salaId + '/reacoes');
    reacoesRef.on('child_added', ouvinteReacoes);
    reacoesRef.once('value', () => { reacoesProntas = true; });
}

function renderizarGanhadores() {
    const secao = document.getElementById('ganhadoresSection');
    const lista = document.getElementById('ganhadoresLista');
    const chave = ganhadores.map((g) => (g.jogadorId || g.nome) + '|' + g.tipo + '|' + g.timestamp).join(',');
    if (lista.dataset.chave === chave) {
        secao.style.display = ganhadores.length ? 'block' : 'none';
        return;
    }
    lista.dataset.chave = chave;
    if (!ganhadores.length) {
        secao.style.display = 'none';
        lista.innerHTML = '';
        return;
    }
    secao.style.display = 'block';
    lista.innerHTML = ganhadores.map((g) => {
        const foto = BingoComum.srcSegura(g.foto) || BingoComum.avatarPadrao();
        return '<div class="ganhador-badge"><img class="ganhador-foto" alt="" src="' + foto + '">' +
            '<div class="ganhador-info"><div class="ganhador-nome">' + BingoComum.escaparHtml(g.nome || '') + '</div>' +
            '<div class="ganhador-tipo">' + BingoComum.escaparHtml(g.tipo || '') + '</div></div></div>';
    }).join('');
}

function atualizarEstadoSorteio(sala) {
    const botao = document.getElementById('btnSortear');
    const cage = document.getElementById('globoCage');
    const fase = sala.girando ? 'girando' : (sala.faseAnimacao || 'idle');
    const chave = fase + '|' + (sala.letraAtual || '') + '|' + (sala.numeroAtual == null ? '' : sala.numeroAtual);

    if (sala.girando) {
        botao.textContent = '✋ PARAR!';
        botao.classList.add('girando');
        botao.disabled = false;
        cage.classList.add('girando');
    } else if (fase === 'letra' || fase === 'numero') {
        botao.disabled = true;
        botao.textContent = '🎲 GIRAR GLOBO';
        botao.classList.remove('girando');
        cage.classList.remove('girando');
    } else {
        botao.textContent = numerosSorteados.length >= 75 ? 'Fim dos números' : '🎲 GIRAR GLOBO';
        botao.classList.remove('girando');
        botao.disabled = numerosSorteados.length >= 75;
        cage.classList.remove('girando');
    }

    if (chave === faseRenderizada) return;
    const anterior = faseRenderizada;
    faseRenderizada = chave;

    if (sala.girando) {
        animarBolasGlobo();
        return;
    }
    pararAnimacaoBolas();
    if (typeof bingoAnimacoes === 'undefined') return;
    if (fase === 'letra' && sala.letraAtual) bingoAnimacoes.mostrarLetra(sala.letraAtual);
    else if (fase === 'numero' && sala.numeroAtual != null && sala.letraAtual) bingoAnimacoes.mostrarNumero(sala.numeroAtual, sala.letraAtual);
    else if (anterior) bingoAnimacoes.esconder();
}

function atualizarBotaoUltimo() {
    const botao = document.getElementById('btnUltimo');
    botao.disabled = !numerosSorteados.length;
    if (numerosSorteados.length) {
        ultimoNumero = numerosSorteados[numerosSorteados.length - 1];
        ultimaLetra = BingoComum.getLetra(ultimoNumero);
    }
}

function criarBolasGlobo() {
    const interior = document.getElementById('globoInterior');
    if (!interior) return;
    const cores = { B: 'bola-b', I: 'bola-i', N: 'bola-n', G: 'bola-g', O: 'bola-o' };
    interior.innerHTML = '';
    for (let i = 0; i < 18; i += 1) {
        const bola = document.createElement('div');
        bola.className = 'bola-bingo';
        const letra = ['B', 'I', 'N', 'G', 'O'][Math.floor(Math.random() * 5)];
        bola.classList.add(cores[letra]);
        bola.style.top = (10 + Math.random() * 70) + '%';
        bola.style.left = (10 + Math.random() * 70) + '%';
        const base = { B: 1, I: 16, N: 31, G: 46, O: 61 }[letra];
        bola.textContent = String(base + Math.floor(Math.random() * 15));
        interior.appendChild(bola);
    }
}

function animarBolasGlobo() {
    if (animacaoGiroInterval) return;
    const bolas = document.querySelectorAll('.bola-bingo');
    animacaoGiroInterval = setInterval(() => {
        bolas.forEach((bola) => {
            bola.style.transition = 'all .08s ease-out';
            bola.style.top = (5 + Math.random() * 80) + '%';
            bola.style.left = (5 + Math.random() * 80) + '%';
        });
    }, 80);
}

function pararAnimacaoBolas() {
    if (animacaoGiroInterval) {
        clearInterval(animacaoGiroInterval);
        animacaoGiroInterval = null;
    }
}

async function iniciarSorteio() {
    if (!salaAtual || !db) return;
    try { BingoComum.obterAudio(); } catch (erro) { /* o sorteio segue sem som */ }
    if (sorteioTravado) return;
    if (salaAtualData && salaAtualData.girando) {
        sorteioTravado = true;
        document.getElementById('btnSortear').disabled = true;
        try {
            await pararESortear();
        } catch (erro) {
            document.getElementById('btnSortear').disabled = false;
            showToast(erro.message || 'Não consegui sortear');
        } finally {
            sorteioTravado = false;
        }
        return;
    }
    if (numerosSorteados.length >= 75) {
        showToast('Todos os 75 números já saíram');
        return;
    }
    try {
        await db.ref('salas/' + salaAtual).update({ girando: true, faseAnimacao: 'girando' });
    } catch (erro) {
        showToast(erro.message || 'Não consegui girar o globo');
    }
}

async function pararESortear() {
    const salaId = salaAtual;
    const geracao = ++sorteioGeracao;
    const ocupados = new Set(numerosSorteados);
    const disponiveis = [];
    for (let i = 1; i <= 75; i += 1) {
        if (!ocupados.has(i)) disponiveis.push(i);
    }
    if (!disponiveis.length) {
        showToast('Todos os números já saíram');
        await db.ref('salas/' + salaId).update({ girando: false, faseAnimacao: 'idle' });
        return;
    }
    const numero = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    const letra = BingoComum.getLetra(numero);
    ultimoNumero = numero;
    ultimaLetra = letra;

    await db.ref('salas/' + salaId).update({ girando: false, letraAtual: letra, numeroAtual: null, faseAnimacao: 'letra' });

    window.setTimeout(async () => {
        if (geracao !== sorteioGeracao) return;
        try {
            const snap = await db.ref('salas/' + salaId + '/numerosSorteados').once('value');
            const lista = BingoComum.listaNumeros(snap.val());
            if (!lista.includes(numero)) lista.push(numero);
            await db.ref('salas/' + salaId).update({
                numeroAtual: numero,
                faseAnimacao: 'numero',
                numerosSorteados: lista
            });
        } catch (erro) {
            showToast(erro.message || 'Erro ao revelar o número');
        }
    }, BingoComum.TEMPO_MOSTRAR_LETRA);

    window.setTimeout(async () => {
        if (geracao !== sorteioGeracao) return;
        try {
            await db.ref('salas/' + salaId).update({ numeroAtual: null, letraAtual: null, faseAnimacao: 'idle' });
        } catch (erro) {
            showToast(erro.message || 'Erro ao fechar o sorteio');
        }
    }, BingoComum.TEMPO_MOSTRAR_LETRA + BingoComum.TEMPO_MOSTRAR_NUMERO);
}

function mostrarUltimoNumero() {
    if (!ultimoNumero || !ultimaLetra) {
        showToast('Nenhum número sorteado ainda');
        return;
    }
    if (typeof bingoAnimacoes === 'undefined') {
        showToast('A animação não carregou');
        return;
    }
    BingoComum.obterAudio();
    faseRenderizada = 'replay|' + ultimaLetra + '|' + ultimoNumero;
    bingoAnimacoes.mostrarNumero(ultimoNumero, ultimaLetra);
    window.setTimeout(() => {
        bingoAnimacoes.esconder();
        faseRenderizada = '';
    }, 4000);
}

function renderizarAlertasTopo(alertas) {
    const secao = document.getElementById('alertasTopo');
    const lista = document.getElementById('alertasTopoLista');
    if (!alertas.length) {
        secao.classList.remove('active');
        lista.innerHTML = '';
        return;
    }
    secao.classList.add('active');
    lista.innerHTML = alertas.map(([id, alerta]) => {
        const foto = BingoComum.srcSegura(alerta.foto) || BingoComum.avatarPadrao();
        const cartela = Number(alerta.cartelaIndex) + 1;
        return '<div class="alerta-topo-item"><img class="alerta-topo-foto" alt="" src="' + foto + '">' +
            '<div class="alerta-topo-info"><div class="alerta-topo-nome">' + BingoComum.escaparHtml(alerta.jogadorNome || 'Jogador') + '</div>' +
            '<div class="alerta-topo-cartela">Cartela ' + cartela + '</div></div>' +
            '<div class="alerta-topo-buttons">' +
            '<button type="button" class="alerta-topo-btn verificar" data-acao="verificar" data-jogador="' + BingoComum.escaparHtml(alerta.jogadorId || '') + '" data-cartela="' + Number(alerta.cartelaIndex) + '" data-alerta="' + BingoComum.escaparHtml(id) + '">Conferir</button>' +
            '<button type="button" class="alerta-topo-btn ignorar" data-acao="ignorar" data-alerta="' + BingoComum.escaparHtml(id) + '">Recusar</button></div></div>';
    }).join('');
}

async function verificarBingo(jogadorId, cartelaIndex, alertaId) {
    if (!jogadorId) return;
    showLoading();
    try {
        const snap = await db.ref('jogadores/' + jogadorId).once('value');
        const jogador = snap.val();
        if (!jogador || !Array.isArray(jogador.cartelas) || !jogador.cartelas[cartelaIndex]) {
            showToast('Cartela não encontrada');
            return;
        }
        const cartela = jogador.cartelas[cartelaIndex];
        const marcados = BingoComum.listaNumeros(cartela.marcados);
        const perdidos = [];
        cartela.numeros.flat().filter((n) => n !== 0).forEach((n) => {
            if (numerosSorteados.includes(n) && !marcados.includes(n)) perdidos.push(n);
        });
        const sequencia = BingoComum.verificarSequencias(cartela.numeros, marcados);
        renderizarVerificacao(jogador, jogadorId, cartela, marcados, perdidos, sequencia, alertaId);
    } catch (erro) {
        showToast(erro.message || 'Erro ao conferir');
    } finally {
        hideLoading();
    }
}

function renderizarVerificacao(jogador, jogadorId, cartela, marcados, perdidos, sequencia, alertaId) {
    document.getElementById('verificacaoNome').textContent = (jogador.nome || '') + ' ' + (jogador.sobrenome || '') + ' — cartela ' + cartela.id;
    const grade = document.getElementById('verificacaoCartela');
    grade.innerHTML = '<div class="verificacao-header">B</div><div class="verificacao-header">I</div><div class="verificacao-header">N</div><div class="verificacao-header">G</div><div class="verificacao-header">O</div>';
    for (let linha = 0; linha < 5; linha += 1) {
        for (let coluna = 0; coluna < 5; coluna += 1) {
            const numero = cartela.numeros[linha][coluna];
            let classe = 'verificacao-cell';
            if (numero === 0) classe += ' coringa';
            else if (marcados.includes(numero)) classe += ' marcado-correto';
            else if (numerosSorteados.includes(numero)) classe += ' nao-marcou';
            const naSequencia = sequencia.linhas.includes(linha) || sequencia.colunas.includes(coluna) ||
                (sequencia.diagonais.includes('d1') && linha === coluna) ||
                (sequencia.diagonais.includes('d2') && linha + coluna === 4);
            if (naSequencia) classe += ' sequencia';
            const celula = document.createElement('div');
            celula.className = classe;
            celula.textContent = numero === 0 ? '⭐' : String(numero);
            grade.appendChild(celula);
        }
    }
    const resultado = document.getElementById('resultadoVerificacao');
    const temSequencia = sequencia.linhas.length || sequencia.colunas.length || sequencia.diagonais.length || sequencia.cartelaCheia;
    const valido = !perdidos.length && temSequencia;
    if (valido) {
        resultado.className = 'resultado-verificacao valido';
        resultado.innerHTML = '<h3 class="resultado-titulo" style="color:var(--green)">Bingo válido</h3><p style="font-size:1.3rem">' +
            BingoComum.escaparHtml(sequencia.tipoVitoria) + '</p>' +
            (sequencia.cartelaCheia ? '<p style="color:var(--yellow);font-size:1.1rem;margin-top:10px">Super prêmio — fim do jogo</p>' : '');
    } else {
        resultado.className = 'resultado-verificacao invalido';
        const perdidosHtml = perdidos.map((n) => '<span class="numero-perdido">' + BingoComum.getLetra(n) + ' ' + n + '</span>').join('');
        resultado.innerHTML = '<h3 class="resultado-titulo" style="color:var(--red)">Bingo inválido</h3>' +
            (perdidos.length
                ? '<p>Faltou marcar ' + perdidos.length + ' número(s) que já saíram:</p><div class="numeros-perdidos-lista">' + perdidosHtml + '</div>'
                : '<p>Ainda não há linha, coluna ou diagonal completa.</p>');
    }
    const botoes = document.getElementById('verificacaoButtons');
    botoes.innerHTML = '';
    if (valido) {
        const confirmar = document.createElement('button');
        confirmar.type = 'button';
        confirmar.className = 'btn-vencedor';
        confirmar.dataset.acao = 'ganhador';
        confirmar.dataset.jogador = jogadorId;
        confirmar.dataset.alerta = alertaId;
        confirmar.dataset.tipo = sequencia.tipoVitoria;
        confirmar.dataset.cheia = sequencia.cartelaCheia ? '1' : '0';
        confirmar.textContent = sequencia.cartelaCheia ? '🏆 Super campeão' : '🎉 Confirmar ganhador';
        const voltar = document.createElement('button');
        voltar.type = 'button';
        voltar.className = 'btn-continuar';
        voltar.textContent = 'Voltar';
        voltar.addEventListener('click', () => fecharModal('modalVerificacao'));
        botoes.append(confirmar, voltar);
    } else {
        const continuar = document.createElement('button');
        continuar.type = 'button';
        continuar.className = 'btn-continuar';
        continuar.dataset.acao = 'recusar';
        continuar.dataset.alerta = alertaId;
        continuar.textContent = 'Continuar o jogo';
        botoes.append(continuar);
    }
    document.getElementById('modalVerificacao').classList.add('active');
}

async function ignorarBingo(alertaId) {
    if (!salaAtual || !alertaId) return;
    try {
        const snap = await db.ref('salas/' + salaAtual + '/alertasBingo/' + alertaId).once('value');
        const alerta = snap.val();
        if (alerta && alerta.jogadorId) {
            await db.ref('jogadores/' + alerta.jogadorId).update({ gritouBingo: false, ultimoBingo: 'recusado' });
        }
        await db.ref('salas/' + salaAtual + '/alertasBingo/' + alertaId).remove();
    } catch (erro) {
        showToast(erro.message || 'Não consegui recusar o bingo');
    }
}

async function declararGanhador(jogadorId, alertaId, tipo, cartelaCheia) {
    fecharModal('modalVerificacao');
    try {
        const snap = await db.ref('jogadores/' + jogadorId).once('value');
        const jogador = snap.val() || {};
        const nome = ((jogador.nome || '') + ' ' + (jogador.sobrenome || '')).trim();
        const novo = {
            nome: nome,
            foto: jogador.foto || '',
            tipo: tipo,
            timestamp: Date.now(),
            jogadorId: jogadorId
        };
        const proximos = ganhadores.concat([novo]);
        await db.ref('salas/' + salaAtual + '/ganhadores').set(proximos);
        await db.ref('jogadores/' + jogadorId).update({ gritouBingo: false, ultimoBingo: 'aceito' });
        if (alertaId) await db.ref('salas/' + salaAtual + '/alertasBingo/' + alertaId).remove();
        if (cartelaCheia) {
            const vencedor = { nome: nome, foto: jogador.foto || '', jogadorId: jogadorId };
            await db.ref('salas/' + salaAtual).update({ jogando: false, superVencedor: vencedor });
            if (!vitoriaMostrada) {
                vitoriaMostrada = true;
                mostrarSuperVencedor(vencedor, salaAtualData && salaAtualData.premio);
            }
        } else {
            showToast(nome + ' ganhou. O jogo continua.');
            if (typeof bingoAnimacoes !== 'undefined') bingoAnimacoes.tocarSomGanhador();
        }
    } catch (erro) {
        showToast(erro.message || 'Erro ao declarar o ganhador');
    }
}

function mostrarSuperVencedor(vencedor, premio) {
    document.getElementById('vencedorNome').textContent = vencedor.nome || '';
    const foto = document.getElementById('vencedorFoto');
    foto.src = BingoComum.srcSegura(vencedor.foto) || BingoComum.avatarPadrao();
    foto.alt = 'Foto de ' + (vencedor.nome || 'campeão');
    const blocoPremio = document.getElementById('premioVencedor');
    const premioSeguro = BingoComum.srcSegura(premio);
    if (premioSeguro) {
        blocoPremio.style.display = 'flex';
        document.getElementById('premioVencedorImg').src = premioSeguro;
        document.getElementById('premioVencedorImg').alt = 'Prêmio';
    } else {
        blocoPremio.style.display = 'none';
    }
    document.getElementById('telaVitoria').classList.add('active');
    criarConfetes();
    if (typeof bingoAnimacoes !== 'undefined') bingoAnimacoes.tocarSomVitoria();
}

function criarConfetes() {
    const cores = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ffd700', '#ec4899', '#4ecdc4'];
    const cont = document.getElementById('telaVitoria');
    cont.querySelectorAll('.confetti').forEach((item) => item.remove());
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const quantidade = reduzir ? 0 : 80;
    for (let i = 0; i < quantidade; i += 1) {
        const confete = document.createElement('div');
        confete.className = 'confetti';
        confete.style.left = Math.random() * 100 + '%';
        confete.style.background = cores[Math.floor(Math.random() * cores.length)];
        confete.style.animationDelay = Math.random() * 2 + 's';
        confete.style.animationDuration = (2 + Math.random() * 2) + 's';
        confete.style.width = confete.style.height = (8 + Math.random() * 10) + 'px';
        confete.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        cont.appendChild(confete);
    }
}

async function novoJogo() {
    if (!salaAtual) return;
    document.querySelectorAll('.confetti').forEach((item) => item.remove());
    document.getElementById('telaVitoria').classList.remove('active');
    vitoriaMostrada = false;
    sorteioGeracao += 1;
    showLoading();
    try {
        await db.ref('salas/' + salaAtual).update({
            jogando: true,
            girando: false,
            numeroAtual: null,
            letraAtual: null,
            faseAnimacao: 'idle',
            numerosSorteados: [],
            ganhadores: [],
            superVencedor: null,
            alertasBingo: null,
            reacoes: null
        });
        const snap = await db.ref('jogadores').orderByChild('salaId').equalTo(salaAtual).once('value');
        const jogadores = snap.val() || {};
        for (const [id, jogador] of Object.entries(jogadores)) {
            if (jogador.cartelas) {
                await db.ref('jogadores/' + id + '/cartelas').set(jogador.cartelas.map((cartela) => Object.assign({}, cartela, { marcados: [0], totalMarcados: 1 })));
                await db.ref('jogadores/' + id).update({ gritouBingo: false, ultimoBingo: null, cartelaVencedora: null });
            }
        }
        ultimoNumero = null;
        ultimaLetra = null;
        showToast('Novo jogo. As cartelas foram limpas.');
    } catch (erro) {
        showToast(erro.message || 'Erro ao recomeçar');
    } finally {
        hideLoading();
    }
}

function mostrarReacao(reacao) {
    const cont = document.getElementById('reacoesContainer');
    const div = document.createElement('div');
    div.className = 'reacao';
    const foto = document.createElement('img');
    foto.className = 'reacao-foto';
    foto.alt = '';
    foto.src = BingoComum.srcSegura(reacao.foto) || BingoComum.avatarPadrao();
    const nome = document.createElement('span');
    nome.className = 'reacao-nome';
    nome.textContent = reacao.nome || '';
    const icone = document.createElement('span');
    icone.className = 'reacao-icon';
    icone.textContent = '✅';
    div.append(foto, nome, icone);
    cont.appendChild(div);
    setTimeout(() => div.remove(), 3500);
}

function renderizarGrade() {
    const cont = document.getElementById('gradeNumeros');
    const faixas = [[1, 15, 'b'], [16, 30, 'i'], [31, 45, 'n'], [46, 60, 'g'], [61, 75, 'o']];
    const cabecalho = document.createElement('div');
    cabecalho.className = 'letras-header';
    ['B', 'I', 'N', 'G', 'O'].forEach((letra, indice) => {
        const el = document.createElement('div');
        el.className = 'letra-col ' + faixas[indice][2];
        el.textContent = letra;
        cabecalho.appendChild(el);
    });
    const colunas = document.createElement('div');
    colunas.className = 'numeros-colunas';
    faixas.forEach(([min, max, letra]) => {
        const coluna = document.createElement('div');
        coluna.className = 'coluna-numeros';
        for (let i = min; i <= max; i += 1) {
            const celula = document.createElement('div');
            celula.className = 'numero-cell' + (numerosSorteados.includes(i) ? ' sorteado ' + letra : '');
            celula.textContent = String(i);
            coluna.appendChild(celula);
        }
        colunas.appendChild(coluna);
    });
    cont.replaceChildren(cabecalho, colunas);
}

function voltarInicio() {
    sorteioGeracao += 1;
    desligarOuvintesJogo();
    salaAtual = null;
    salaAtualData = null;
    faseRenderizada = '';
    document.getElementById('telaInicial').style.display = 'grid';
    document.getElementById('telaJogo').classList.remove('active');
    document.getElementById('alertasTopo').classList.remove('active');
    pararAnimacaoBolas();
    if (typeof bingoAnimacoes !== 'undefined') bingoAnimacoes.esconder();
}

async function encerrarSala(salaId) {
    if (!confirm('Encerrar esta sala e apagar os jogadores dela?')) return;
    showLoading();
    try {
        const snap = await db.ref('jogadores').orderByChild('salaId').equalTo(salaId).once('value');
        for (const id of Object.keys(snap.val() || {})) await db.ref('jogadores/' + id).remove();
        await db.ref('salas/' + salaId).update({ ativa: false, jogando: false });
        if (salaAtual === salaId) voltarInicio();
        showToast('Sala encerrada');
    } catch (erro) {
        showToast(erro.message || 'Erro ao encerrar');
    } finally {
        hideLoading();
    }
}

async function resetarTudo() {
    if (bancoIndisponivel || !db) {
        showToast('O banco está desativado, não há o que apagar daqui.');
        return;
    }
    if (!confirm('Apagar todas as salas e jogadores deste bingo?')) return;
    if (!confirm('Isso some com o histórico que ainda estiver no Firebase. Tem certeza?')) return;
    showLoading();
    try {
        await db.ref('salas').remove();
        await db.ref('jogadores').remove();
        if (salaAtual) voltarInicio();
        showToast('Tudo apagado');
    } catch (erro) {
        showToast(erro.message || 'Erro ao resetar');
    } finally {
        hideLoading();
    }
}
