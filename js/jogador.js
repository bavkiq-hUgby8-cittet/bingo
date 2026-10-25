/* BINGO DOS VELOSO — cartela no celular */

let db = null;
let salaId = null;
let sala = null;
let jogadorId = null;
let jogador = null;
let cartelaAtual = 0;
let fotoBase64 = null;
let touchStartX = 0;
let vibrando = false;
let ganhadores = [];
let ouvintesLigados = false;
let ganhadoresProntos = false;
let vitoriaAnunciada = false;
let bancoIndisponivel = false;
const filasMarcacao = {};
let ouvinteContagem = null;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(location.search);
    salaId = params.get('sala');
    setupSwipe();
    const form = document.getElementById('formCadastro');
    if (form) form.addEventListener('submit', (evento) => {
        evento.preventDefault();
        entrarNoBingo();
    });

    if (!salaId) {
        mostrarErro('Falta o código da sala. Peça o QR Code de quem está no telão.');
        return;
    }

    const inicio = BingoComum.iniciarFirebase();
    if (!inicio.ok) {
        mostrarAvisoBanco(BingoComum.mensagemBanco(inicio));
        mostrarErro('Sem conexão com o bingo.');
        return;
    }
    db = inicio.db;
    observarConexao();
    const saude = await BingoComum.verificarBanco();
    if (!saude.ok) {
        bancoIndisponivel = true;
        mostrarAvisoBanco(BingoComum.mensagemBanco(saude));
        mostrarErro('O bingo está sem o banco de dados.');
        return;
    }

    const salvo = localStorage.getItem('bingo_jogador_' + salaId);
    if (salvo) {
        jogadorId = salvo;
        verificarJogadorExistente();
    } else {
        carregarSala();
    }
});

function mostrarAvisoBanco(texto) {
    const aviso = document.getElementById('avisoBanco');
    const alvo = document.getElementById('avisoBancoTexto');
    if (alvo) alvo.textContent = texto;
    if (aviso) aviso.hidden = false;
}

function observarConexao() {
    const selo = document.getElementById('statusConexao');
    db.ref('.info/connected').on('value', (snap) => {
        if (!selo) return;
        const ligado = snap.val() === true;
        selo.textContent = ligado ? 'No ar' : 'Reconectando…';
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

function mostrarErro(texto) {
    document.querySelectorAll('.tela').forEach((tela) => tela.classList.remove('active'));
    const erro = document.getElementById('telaErro');
    erro.classList.add('active');
    const paragrafo = erro.querySelector('p');
    if (paragrafo && texto) paragrafo.textContent = texto;
}

async function carregarSala() {
    showLoading();
    try {
        const snap = await db.ref('salas/' + salaId).once('value');
        sala = snap.val();
        if (!sala || !sala.ativa) {
            mostrarErro('Esta sala não existe ou já foi encerrada.');
            return;
        }
        document.getElementById('salaNome').textContent = sala.nome || 'Bingo';
        document.getElementById('qtdCartelas').textContent = String(sala.cartelasPorJogador || 1);
        document.querySelectorAll('.tela').forEach((tela) => tela.classList.remove('active'));
        document.getElementById('telaCadastro').classList.add('active');
    } catch (erro) {
        showToast(erro.message || 'Erro ao abrir a sala');
        mostrarErro('Não consegui abrir a sala.');
    } finally {
        hideLoading();
    }
}

async function verificarJogadorExistente() {
    showLoading();
    let abrirCadastro = false;
    try {
        const jogadorSnap = await db.ref('jogadores/' + jogadorId).once('value');
        jogador = jogadorSnap.val();
        if (!jogador || jogador.salaId !== salaId) {
            localStorage.removeItem('bingo_jogador_' + salaId);
            jogadorId = null;
            jogador = null;
            abrirCadastro = true;
            return;
        }
        const salaSnap = await db.ref('salas/' + salaId).once('value');
        sala = salaSnap.val();
        if (!sala || !sala.ativa) {
            mostrarErro('Esta sala não existe ou já foi encerrada.');
            return;
        }
        document.getElementById('salaNome').textContent = sala.nome || 'Bingo';
        document.getElementById('telaCadastro').classList.remove('active');
        if (sala.jogando) iniciarJogo();
        else mostrarAguardo();
        escutarMudancas();
    } catch (erro) {
        showToast(erro.message || 'Erro ao entrar de novo');
        localStorage.removeItem('bingo_jogador_' + salaId);
        jogadorId = null;
        abrirCadastro = true;
    } finally {
        hideLoading();
    }
    if (abrirCadastro) await carregarSala();
}

async function handleFoto(evento) {
    const arquivo = evento.target.files && evento.target.files[0];
    if (!arquivo) return;
    try {
        fotoBase64 = await BingoComum.reduzirImagem(arquivo, 200, 0.7);
        document.getElementById('fotoPreview').innerHTML = '<img alt="Sua foto" src="' + fotoBase64 + '">';
    } catch (erro) {
        fotoBase64 = null;
        showToast(erro.message || 'Não consegui usar essa foto');
    }
}

async function entrarNoBingo() {
    if (bancoIndisponivel || !db) {
        showToast('O banco do bingo está desativado.');
        return;
    }
    const nome = document.getElementById('inputNome').value.trim();
    const sobrenome = document.getElementById('inputSobrenome').value.trim();
    if (!nome || !sobrenome) {
        showToast('Preencha nome e sobrenome');
        return;
    }
    if (!sala || !sala.ativa) {
        mostrarErro('Esta sala não está mais aberta.');
        return;
    }
    showLoading();
    try {
        const quantidade = Math.min(10, Math.max(1, Number(sala.cartelasPorJogador) || 1));
        const cartelas = [];
        for (let i = 0; i < quantidade; i += 1) cartelas.push(BingoComum.gerarCartela(i));
        jogadorId = BingoComum.gerarId();
        jogador = {
            salaId: salaId,
            nome: nome,
            sobrenome: sobrenome,
            foto: fotoBase64,
            cartelas: cartelas,
            gritouBingo: false,
            ultimoBingo: null,
            cartelaVencedora: null,
            entradaEm: Date.now()
        };
        await db.ref('jogadores/' + jogadorId).set(jogador);
        localStorage.setItem('bingo_jogador_' + salaId, jogadorId);
        document.getElementById('telaCadastro').classList.remove('active');
        if (sala.jogando) iniciarJogo();
        else mostrarAguardo();
        escutarMudancas();
        showToast('Bem-vindo, ' + nome + '!');
    } catch (erro) {
        showToast(erro.message || 'Não consegui entrar');
    } finally {
        hideLoading();
    }
}

function mostrarAguardo() {
    document.getElementById('telaAguardo').classList.add('active');
    document.getElementById('telaJogo').classList.remove('active');
    document.getElementById('aguardoCartelas').textContent = String((jogador.cartelas || []).length);
    if (ouvinteContagem) ouvinteContagem.consulta.off('value', ouvinteContagem.callback);
    const consulta = db.ref('jogadores').orderByChild('salaId').equalTo(salaId);
    const callback = (snap) => {
        const alvo = document.getElementById('aguardoJogadores');
        if (alvo) alvo.textContent = String(Object.keys(snap.val() || {}).length);
    };
    ouvinteContagem = { consulta: consulta, callback: callback };
    consulta.on('value', callback);
}

function iniciarJogo() {
    if (ouvinteContagem) {
        ouvinteContagem.consulta.off('value', ouvinteContagem.callback);
        ouvinteContagem = null;
    }
    document.getElementById('telaAguardo').classList.remove('active');
    document.getElementById('telaErro').classList.remove('active');
    document.getElementById('telaJogo').classList.add('active');
    document.getElementById('nomeJogador').textContent = (jogador.nome || '') + ' ' + (jogador.sobrenome || '');
    document.getElementById('cartelaTotalNum').textContent = String((jogador.cartelas || []).length);
    document.getElementById('swipeHint').style.display = (jogador.cartelas || []).length <= 1 ? 'none' : '';
    renderizarCartelas();
    atualizarNavegacao();
    atualizarBotaoBingo();
    renderizarChamados();
}

function renderizarCartelas() {
    const cont = document.getElementById('cartelasContainer');
    cont.innerHTML = '';
    (jogador.cartelas || []).forEach((cartela, idx) => {
        const div = document.createElement('div');
        div.className = 'cartela';
        div.id = 'cartela-' + idx;
        const grid = document.createElement('div');
        grid.className = 'cartela-grid';
        const marcados = new Set(BingoComum.listaNumeros(cartela.marcados));
        for (let linha = 0; linha < 5; linha += 1) {
            for (let coluna = 0; coluna < 5; coluna += 1) {
                const numero = cartela.numeros[linha][coluna];
                if (numero === 0) {
                    const coringa = document.createElement('div');
                    coringa.className = 'numero coringa';
                    coringa.textContent = 'V';
                    coringa.setAttribute('aria-label', 'Coringa, centro já marcado');
                    grid.appendChild(coringa);
                    continue;
                }
                const botao = document.createElement('button');
                botao.type = 'button';
                botao.className = 'numero' + (marcados.has(numero) ? ' marcado' : '');
                botao.id = 'num-' + idx + '-' + numero;
                botao.textContent = String(numero);
                botao.setAttribute('aria-pressed', marcados.has(numero) ? 'true' : 'false');
                botao.setAttribute('aria-label', 'Número ' + numero);
                botao.addEventListener('click', () => marcarNumero(idx, numero));
                grid.appendChild(botao);
            }
        }
        const total = BingoComum.listaNumeros(cartela.marcados).filter((n) => n !== 0).length;
        const counter = document.createElement('div');
        counter.className = 'marcados-counter';
        counter.id = 'counter-' + idx;
        for (let i = 0; i < 24; i += 1) {
            const ponto = document.createElement('div');
            ponto.className = 'marcado-dot' + (i < total ? ' ativo' : '');
            counter.appendChild(ponto);
        }
        const texto = document.createElement('div');
        texto.className = 'marcados-text';
        texto.textContent = total + '/24 marcados';
        counter.appendChild(texto);

        const card = document.createElement('div');
        card.className = 'cartela-card';
        const header = document.createElement('div');
        header.className = 'bingo-header';
        ['B', 'I', 'N', 'G', 'O'].forEach((letra) => {
            const el = document.createElement('div');
            el.className = 'bingo-letra';
            el.textContent = letra;
            header.appendChild(el);
        });
        card.append(header, grid, counter);
        div.appendChild(card);
        cont.appendChild(div);
    });

    const dots = document.getElementById('paginationDots');
    dots.innerHTML = '';
    if ((jogador.cartelas || []).length > 1) {
        jogador.cartelas.forEach((_, idx) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'pagination-dot' + (idx === cartelaAtual ? ' active' : '');
            dot.setAttribute('aria-label', 'Cartela ' + (idx + 1));
            dot.addEventListener('click', () => irParaCartela(idx));
            dots.appendChild(dot);
        });
    }
}

function enfileirar(cartelaIndex, tarefa) {
    const anterior = filasMarcacao[cartelaIndex] || Promise.resolve();
    const atual = anterior.then(tarefa, tarefa);
    filasMarcacao[cartelaIndex] = atual.catch(() => {});
    return atual;
}

async function marcarNumero(cartelaIndex, numero) {
    const cartela = jogador.cartelas[cartelaIndex];
    if (!cartela) return;
    if (!Array.isArray(cartela.marcados)) cartela.marcados = [0];
    const posicao = cartela.marcados.indexOf(numero);
    if (posicao > -1) cartela.marcados.splice(posicao, 1);
    else cartela.marcados.push(numero);
    const el = document.getElementById('num-' + cartelaIndex + '-' + numero);
    if (el) {
        const marcado = cartela.marcados.includes(numero);
        el.classList.toggle('marcado', marcado);
        el.setAttribute('aria-pressed', marcado ? 'true' : 'false');
    }
    playSound('ploc');
    if (navigator.vibrate) navigator.vibrate(30);
    atualizarContador(cartelaIndex);
    atualizarBotaoBingo();
    const marcadoAgora = cartela.marcados.includes(numero);
    try {
        await enfileirar(cartelaIndex, async () => {
            await db.ref('jogadores/' + jogadorId + '/cartelas/' + cartelaIndex + '/marcados').set(jogador.cartelas[cartelaIndex].marcados);
        });
        if (marcadoAgora) {
            await db.ref('salas/' + salaId + '/reacoes').push({
                nome: jogador.nome,
                foto: jogador.foto || null,
                numero: numero,
                timestamp: Date.now()
            });
        }
    } catch (erro) {
        showToast('Não salvei a marcação. Tente de novo.');
    }
}

function atualizarContador(cartelaIndex) {
    const cartela = jogador.cartelas[cartelaIndex];
    const total = BingoComum.listaNumeros(cartela.marcados).filter((n) => n !== 0).length;
    const counter = document.getElementById('counter-' + cartelaIndex);
    if (!counter) return;
    counter.querySelectorAll('.marcado-dot').forEach((ponto, i) => ponto.classList.toggle('ativo', i < total));
    const texto = counter.querySelector('.marcados-text');
    if (texto) texto.textContent = total + '/24 marcados';
}

function atualizarBotaoBingo() {
    const botao = document.getElementById('btnBingo');
    let pode = false;
    (jogador.cartelas || []).forEach((cartela) => {
        if (BingoComum.verificarSequencias(cartela.numeros, cartela.marcados).tipoVitoria) pode = true;
    });
    botao.classList.toggle('ativo', pode);
    botao.setAttribute('aria-disabled', pode ? 'false' : 'true');
}

async function gritarBingo() {
    const botao = document.getElementById('btnBingo');
    if (!botao.classList.contains('ativo')) {
        showToast('Complete uma linha, coluna ou diagonal');
        return;
    }
    if (document.getElementById('telaVerificacao').classList.contains('active')) {
        showToast('Seu bingo já está com o operador');
        return;
    }
    let cartelaVencedora = -1;
    let tipo = '';
    (jogador.cartelas || []).forEach((cartela, indice) => {
        if (cartelaVencedora !== -1) return;
        const sequencia = BingoComum.verificarSequencias(cartela.numeros, cartela.marcados);
        if (sequencia.tipoVitoria) {
            cartelaVencedora = indice;
            tipo = sequencia.tipoVitoria;
        }
    });
    if (cartelaVencedora === -1) {
        showToast('Nenhuma sequência ainda');
        return;
    }
    playSound('bingo');
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    try {
        await db.ref('salas/' + salaId + '/alertasBingo').push({
            jogadorId: jogadorId,
            jogadorNome: (jogador.nome || '') + ' ' + (jogador.sobrenome || ''),
            foto: jogador.foto || null,
            cartelaIndex: cartelaVencedora,
            tipo: tipo,
            timestamp: Date.now()
        });
        await db.ref('jogadores/' + jogadorId).update({ gritouBingo: true, ultimoBingo: null, cartelaVencedora: cartelaVencedora });
        document.getElementById('telaVerificacao').classList.add('active');
    } catch (erro) {
        showToast(erro.message || 'Não consegui avisar o operador');
    }
}

async function cancelarBingo() {
    document.getElementById('telaVerificacao').classList.remove('active');
    try {
        await db.ref('jogadores/' + jogadorId).update({ gritouBingo: false, ultimoBingo: 'cancelado' });
        const snap = await db.ref('salas/' + salaId + '/alertasBingo').once('value');
        const alertas = snap.val() || {};
        await Promise.all(Object.entries(alertas).map(([id, alerta]) => {
            if (alerta && alerta.jogadorId === jogadorId) return db.ref('salas/' + salaId + '/alertasBingo/' + id).remove();
            return Promise.resolve();
        }));
        showToast('Aviso cancelado');
    } catch (erro) {
        showToast(erro.message || 'Não consegui cancelar');
    }
}

function escutarMudancas() {
    if (ouvintesLigados) return;
    ouvintesLigados = true;
    db.ref('salas/' + salaId).on('value', (snap) => {
        const dados = snap.val();
        if (!dados) {
            mostrarErro('A sala foi encerrada.');
            return;
        }
        const estavaJogando = sala && sala.jogando;
        const anteriores = ganhadores;
        sala = dados;
        ganhadores = BingoComum.listaDe(dados.ganhadores);
        if (ganhadoresProntos) {
            const novo = ganhadores.find((item) => item.jogadorId === jogadorId && !anteriores.some((antigo) => antigo.jogadorId === jogadorId && antigo.timestamp === item.timestamp));
            if (novo && !(novo.tipo || '').includes('CARTELA CHEIA')) {
                document.getElementById('telaVerificacao').classList.remove('active');
                document.getElementById('resultadoIcon').textContent = '🎉';
                document.getElementById('resultadoTitulo').textContent = 'Você ganhou!';
                document.getElementById('resultadoTitulo').className = 'resultado-titulo venceu';
                document.getElementById('resultadoMsg').textContent = (novo.tipo || 'Bingo') + ' — o jogo continua.';
                document.getElementById('telaResultado').classList.add('active');
                criarConfetes();
                playSound('vitoria');
            }
        }
        ganhadoresProntos = true;
        renderizarGanhadores();
        renderizarChamados();
        const telaJogoAtiva = document.getElementById('telaJogo').classList.contains('active');
        if (dados.jogando && !telaJogoAtiva && jogador) iniciarJogo();
        if (dados.jogando && telaJogoAtiva && !estavaJogando) {
            document.getElementById('fimJogoOverlay').classList.remove('active');
            vitoriaAnunciada = false;
            document.querySelectorAll('.confetti').forEach((item) => item.remove());
        }
        const aviso = document.getElementById('globoGirandoAviso');
        if (dados.girando) {
            aviso.classList.add('active');
            if (!vibrando && navigator.vibrate) {
                vibrando = true;
                vibraContinuo();
            }
        } else {
            aviso.classList.remove('active');
            vibrando = false;
        }
        if (dados.superVencedor) {
            document.getElementById('telaVerificacao').classList.remove('active');
            document.getElementById('telaResultado').classList.remove('active');
            document.getElementById('fimJogoOverlay').classList.add('active');
            document.getElementById('fimJogoVencedor').textContent = (dados.superVencedor.nome || 'Alguém') + ' venceu com a cartela cheia.';
            if (!vitoriaAnunciada) {
                vitoriaAnunciada = true;
                criarConfetes();
                playSound('vitoria');
            }
        } else if (!dados.superVencedor) {
            document.getElementById('fimJogoOverlay').classList.remove('active');
            if (!dados.jogando) vitoriaAnunciada = false;
        }
    });

    db.ref('jogadores/' + jogadorId).on('value', (snap) => {
        const dados = snap.val();
        if (!dados) return;
        const antigoBingo = jogador ? jogador.gritouBingo : false;
        const cartelasIguais = JSON.stringify(jogador && jogador.cartelas) === JSON.stringify(dados.cartelas);
        jogador = dados;
        if (!cartelasIguais && document.getElementById('telaJogo').classList.contains('active')) {
            renderizarCartelas();
            atualizarNavegacao();
        }
        if (document.getElementById('telaJogo').classList.contains('active')) atualizarBotaoBingo();
        if (antigoBingo && !jogador.gritouBingo) {
            document.getElementById('telaVerificacao').classList.remove('active');
            if (jogador.ultimoBingo === 'recusado') showToast('Bingo não confirmado. Confira a cartela e continue.');
        }
    });

    const reacoesRef = db.ref('salas/' + salaId + '/reacoes');
    let reacoesProntas = false;
    reacoesRef.on('child_added', (snap) => {
        if (!reacoesProntas) return;
        const reacao = snap.val();
        if (reacao && reacao.nome && reacao.nome !== jogador.nome) mostrarBalaoReacao(reacao);
    });
    reacoesRef.once('value', () => { reacoesProntas = true; });
}

function renderizarChamados() {
    const lista = document.getElementById('listaChamados');
    const resumo = document.getElementById('resumoChamados');
    if (!lista || !sala) return;
    const numeros = BingoComum.listaNumeros(sala.numerosSorteados);
    if (resumo) resumo.textContent = numeros.length ? numeros.length + ' números chamados' : 'Nenhum número ainda';
    const ultimo = numeros.length ? numeros[numeros.length - 1] : null;
    lista.innerHTML = '';
    numeros.forEach((numero) => {
        const item = document.createElement('span');
        item.className = 'chamado chamado-' + BingoComum.getLetra(numero).toLowerCase() + (numero === ultimo ? ' ultimo' : '');
        item.textContent = BingoComum.getLetra(numero) + ' ' + numero;
        lista.appendChild(item);
    });
}

function renderizarGanhadores() {
    const secao = document.getElementById('ganhadoresAviso');
    const lista = document.getElementById('ganhadoresMini');
    if (!ganhadores.length) {
        secao.style.display = 'none';
        lista.innerHTML = '';
        return;
    }
    secao.style.display = 'block';
    lista.innerHTML = '';
    ganhadores.forEach((item) => {
        const bloco = document.createElement('div');
        bloco.className = 'ganhador-mini';
        const img = document.createElement('img');
        img.alt = '';
        img.src = BingoComum.srcSegura(item.foto) || BingoComum.avatarPadrao();
        const nome = document.createElement('span');
        nome.textContent = String(item.nome || 'Jogador').split(' ')[0];
        bloco.append(img, nome);
        lista.appendChild(bloco);
    });
}

function vibraContinuo() {
    if (!vibrando) return;
    if (navigator.vibrate) navigator.vibrate(120);
    setTimeout(vibraContinuo, 500);
}

function mostrarBalaoReacao(reacao) {
    const balao = document.createElement('div');
    balao.className = 'balao-reacao';
    balao.style.left = (10 + Math.random() * 60) + '%';
    const img = document.createElement('img');
    img.className = 'balao-foto';
    img.alt = '';
    img.src = BingoComum.srcSegura(reacao.foto) || BingoComum.avatarPadrao();
    const nome = document.createElement('span');
    nome.className = 'balao-nome';
    nome.textContent = (reacao.nome || '') + ' marcou';
    balao.append(img, nome);
    document.body.appendChild(balao);
    setTimeout(() => balao.remove(), 2500);
}

function voltarJogo() {
    document.querySelectorAll('.confetti').forEach((item) => item.remove());
    document.getElementById('telaResultado').classList.remove('active');
}

function trocarJogador() {
    if (!confirm('Sair desta cartela neste celular?')) return;
    localStorage.removeItem('bingo_jogador_' + salaId);
    location.reload();
}

function atualizarNavegacao() {
    const total = (jogador.cartelas || []).length;
    if (cartelaAtual > total - 1) cartelaAtual = Math.max(0, total - 1);
    document.getElementById('cartelaAtualNum').textContent = String(cartelaAtual + 1);
    document.getElementById('btnAnterior').disabled = cartelaAtual === 0;
    document.getElementById('btnProxima').disabled = cartelaAtual >= total - 1;
    document.querySelectorAll('.pagination-dot').forEach((dot, idx) => dot.classList.toggle('active', idx === cartelaAtual));
    document.getElementById('cartelasContainer').style.transform = 'translateX(-' + (cartelaAtual * 100) + '%)';
}

function cartelaAnterior() {
    if (cartelaAtual > 0) {
        cartelaAtual -= 1;
        atualizarNavegacao();
    }
}
function proximaCartela() {
    if (jogador && cartelaAtual < jogador.cartelas.length - 1) {
        cartelaAtual += 1;
        atualizarNavegacao();
    }
}
function irParaCartela(idx) {
    cartelaAtual = idx;
    atualizarNavegacao();
}

function setupSwipe() {
    const wrapper = document.getElementById('cartelasWrapper');
    if (!wrapper) return;
    wrapper.addEventListener('touchstart', (evento) => {
        touchStartX = evento.changedTouches[0].screenX;
    }, { passive: true });
    wrapper.addEventListener('touchend', (evento) => {
        const diff = touchStartX - evento.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) proximaCartela();
            else cartelaAnterior();
        }
    }, { passive: true });
}

function criarConfetes() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.confetti').forEach((item) => item.remove());
    const cores = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ffd700', '#ec4899', '#4ecdc4'];
    for (let i = 0; i < 50; i += 1) {
        const confete = document.createElement('div');
        confete.className = 'confetti';
        confete.style.left = Math.random() * 100 + '%';
        confete.style.background = cores[Math.floor(Math.random() * cores.length)];
        confete.style.animationDelay = Math.random() * 2 + 's';
        confete.style.animationDuration = (2 + Math.random() * 2) + 's';
        document.body.appendChild(confete);
    }
}

function playSound(tipo) {
    try {
        const ctx = BingoComum.obterAudio();
        if (!ctx) return;
        const tocar = (freq, inicio, duracao, tipoOnda, volume) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = tipoOnda || 'sine';
            osc.frequency.setValueAtTime(freq, inicio);
            gain.gain.setValueAtTime(volume, inicio);
            gain.gain.exponentialRampToValueAtTime(0.01, inicio + duracao);
            osc.start(inicio);
            osc.stop(inicio + duracao);
        };
        if (tipo === 'ploc') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        } else if (tipo === 'bingo') {
            [600, 800, 1000, 1200].forEach((freq, i) => tocar(freq, ctx.currentTime + i * 0.1, 0.28, 'square', 0.2));
        } else if (tipo === 'vitoria') {
            [523, 659, 784, 880, 1047].forEach((freq, i) => tocar(freq, ctx.currentTime + i * 0.12, 0.35, 'sine', 0.22));
        }
    } catch (erro) {
        /* áudio é opcional */
    }
}
