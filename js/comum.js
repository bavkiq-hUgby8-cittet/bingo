/* BINGO DOS VELOSO — funções compartilhadas entre o telão e o celular.
   A apiKey abaixo é a chave pública do SDK (Firebase espera isso no navegador).
   O que protege os dados são as regras do Realtime Database, hoje abertas. */
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.BingoComum = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
    const FIREBASE_CONFIG = {
        apiKey: 'AIzaSyCPYcph6zvKD-pIrDSwlL378hJKQoz-r2I',
        authDomain: 'bingo-16f47.firebaseapp.com',
        databaseURL: 'https://bingo-16f47-default-rtdb.firebaseio.com',
        projectId: 'bingo-16f47',
        storageBucket: 'bingo-16f47.firebasestorage.app',
        messagingSenderId: '549011622250',
        appId: '1:549011622250:web:d86e8112d2d108f239fd13'
    };

    const TEMPO_MOSTRAR_LETRA = 3500;
    const TEMPO_MOSTRAR_NUMERO = 5000;

    function escaparHtml(texto) {
        return String(texto ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function gerarId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }

    function getLetra(n) {
        const numero = Number(n);
        if (numero <= 15) return 'B';
        if (numero <= 30) return 'I';
        if (numero <= 45) return 'N';
        if (numero <= 60) return 'G';
        return 'O';
    }

    function avatarPadrao() {
        return "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%234ecdc4' width='100' height='100'/><text x='50' y='62' text-anchor='middle' font-size='42'>V</text></svg>";
    }

    function srcSegura(url) {
        if (!url || typeof url !== 'string') return '';
        const limpa = url.trim();
        if (limpa.startsWith('data:image/')) return limpa;
        if (limpa.startsWith('https://') || limpa.startsWith('http://')) return limpa;
        return '';
    }

    function usarEmuladorLocal() {
        if (typeof location === 'undefined') return false;
        const flag = new URLSearchParams(location.search).get('emulador');
        return flag === '1' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    }

    function montarUrlJogador(href, salaId) {
        const origem = new URL(href, 'http://localhost');
        let diretorio = origem.pathname || '/';
        if (diretorio.endsWith('index.html')) diretorio = diretorio.slice(0, -'index.html'.length);
        if (!diretorio.endsWith('/')) diretorio += '/';
        const url = new URL(origem.href);
        url.hash = '';
        url.pathname = diretorio + 'jogador.html';
        url.search = '';
        url.searchParams.set('sala', String(salaId));
        if (origem.searchParams.get('emulador') === '1') url.searchParams.set('emulador', '1');
        return url.href;
    }

    function gerarNumerosUnicos(min, max, qtd) {
        const numeros = [];
        let tentativas = 0;
        while (numeros.length < qtd && tentativas < 500) {
            tentativas += 1;
            const sorteado = Math.floor(Math.random() * (max - min + 1)) + min;
            if (!numeros.includes(sorteado)) numeros.push(sorteado);
        }
        return numeros;
    }

    function gerarCartela(idx) {
        const colunaB = gerarNumerosUnicos(1, 15, 5);
        const colunaI = gerarNumerosUnicos(16, 30, 5);
        const colunaN = gerarNumerosUnicos(31, 45, 4);
        const colunaG = gerarNumerosUnicos(46, 60, 5);
        const colunaO = gerarNumerosUnicos(61, 75, 5);
        const numeros = [];
        for (let linha = 0; linha < 5; linha += 1) {
            numeros.push([
                colunaB[linha],
                colunaI[linha],
                linha === 2 ? 0 : colunaN[linha < 2 ? linha : linha - 1],
                colunaG[linha],
                colunaO[linha]
            ]);
        }
        return { id: idx + 1, numeros: numeros, marcados: [0], totalMarcados: 1 };
    }

    function listaNumeros(valor) {
        if (Array.isArray(valor)) return valor.map(Number).filter((n) => Number.isFinite(n));
        if (valor && typeof valor === 'object') {
            return Object.keys(valor)
                .sort((a, b) => Number(a) - Number(b))
                .map((chave) => Number(valor[chave]))
                .filter((n) => Number.isFinite(n));
        }
        return [];
    }

    function listaDe(valor) {
        if (Array.isArray(valor)) return valor.filter(Boolean);
        if (valor && typeof valor === 'object') return Object.values(valor).filter(Boolean);
        return [];
    }

    function verificarSequencias(nums, marc) {
        const marcados = new Set(listaNumeros(marc));
        const tem = (n) => n === 0 || marcados.has(n);
        const resultado = { linhas: [], colunas: [], diagonais: [], cruzada: false, cartelaCheia: false, tipoVitoria: null };
        if (!Array.isArray(nums) || nums.length !== 5) return resultado;
        for (let i = 0; i < 5; i += 1) {
            if (Array.isArray(nums[i]) && nums[i].every(tem)) resultado.linhas.push(i);
        }
        for (let c = 0; c < 5; c += 1) {
            if (nums.every((linha) => Array.isArray(linha) && tem(linha[c]))) resultado.colunas.push(c);
        }
        if ([0, 1, 2, 3, 4].every((i) => Array.isArray(nums[i]) && tem(nums[i][i]))) resultado.diagonais.push('d1');
        if ([0, 1, 2, 3, 4].every((i) => Array.isArray(nums[i]) && tem(nums[i][4 - i]))) resultado.diagonais.push('d2');
        resultado.cruzada = resultado.diagonais.length === 2;
        const todos = nums.flat().filter((n) => n !== 0);
        resultado.cartelaCheia = todos.length > 0 && todos.every((n) => marcados.has(n));
        if (resultado.cartelaCheia) resultado.tipoVitoria = '🏆 CARTELA CHEIA';
        else if (resultado.cruzada) resultado.tipoVitoria = '✖️ Cruzada';
        else if (resultado.diagonais.length) resultado.tipoVitoria = '↗️ Diagonal';
        else if (resultado.linhas.length) resultado.tipoVitoria = '➖ Linha';
        else if (resultado.colunas.length) resultado.tipoVitoria = '| Coluna';
        return resultado;
    }

    let audioCtx = null;
    function obterAudio() {
        try {
            const AudioCtx = root.AudioContext || root.webkitAudioContext;
            if (!AudioCtx) return null;
            if (!audioCtx || audioCtx.state === 'closed') audioCtx = new AudioCtx();
            if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
            return audioCtx;
        } catch (erro) {
            return null;
        }
    }

    let db = null;
    function iniciarFirebase() {
        if (typeof firebase === 'undefined') {
            return { ok: false, motivo: 'sdk' };
        }
        try {
            if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
            db = firebase.database();
            if (usarEmuladorLocal()) {
                db.useEmulator('127.0.0.1', 9000);
                return { ok: true, emulador: true, db: db };
            }
            return { ok: true, emulador: false, db: db };
        } catch (erro) {
            return { ok: false, motivo: 'init', detalhe: erro && erro.message ? erro.message : String(erro) };
        }
    }

    function obterDb() {
        return db;
    }

    async function verificarBanco() {
        if (usarEmuladorLocal()) return { ok: true, emulador: true };
        if (typeof fetch !== 'function') return { ok: true, aviso: true };
        try {
            const controle = new AbortController();
            const timer = setTimeout(() => controle.abort(), 8000);
            const resposta = await fetch(FIREBASE_CONFIG.databaseURL + '/.json?shallow=true', { signal: controle.signal });
            clearTimeout(timer);
            const texto = await resposta.text();
            if (resposta.status === 423 || /deactivated/i.test(texto)) return { ok: false, motivo: 'desativado' };
            if (resposta.status === 401 || resposta.status === 403) return { ok: false, motivo: 'regras' };
            if (!resposta.ok) return { ok: false, motivo: 'http', status: resposta.status };
            return { ok: true };
        } catch (erro) {
            return { ok: true, aviso: true, detalhe: erro && erro.message ? erro.message : 'rede' };
        }
    }

    function mensagemBanco(resultado) {
        if (!resultado || resultado.ok) return '';
        if (resultado.motivo === 'desativado') {
            return 'O Realtime Database do projeto bingo-16f47 está desativado. Ramon, abra o Firebase Console, entre em Realtime Database e reative o banco. Os dados da família continuam ligados a esse projeto. Depois é só recarregar esta página.';
        }
        if (resultado.motivo === 'regras') {
            return 'O banco recusou a leitura. Confira as regras do Realtime Database: a família precisa de leitura e escrita liberadas enquanto o jogo não tem login.';
        }
        if (resultado.motivo === 'sdk') {
            return 'Não carregou a biblioteca do Firebase. Confira se a pasta vendor veio no deploy.';
        }
        return 'Não foi possível conectar ao banco do bingo' + (resultado.status ? ' (erro ' + resultado.status + ').' : '.');
    }

    function reduzirImagem(arquivo, tamanho, qualidade) {
        return new Promise((resolve, reject) => {
            if (!arquivo) {
                reject(new Error('Arquivo vazio'));
                return;
            }
            if (arquivo.size > 12 * 1024 * 1024) {
                reject(new Error('Foto grande demais (máximo 12 MB)'));
                return;
            }
            const leitor = new FileReader();
            leitor.onerror = () => reject(new Error('Não consegui ler o arquivo'));
            leitor.onload = (evento) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = tamanho;
                    canvas.height = tamanho;
                    const ctx = canvas.getContext('2d');
                    const lado = Math.min(img.width, img.height);
                    ctx.drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, tamanho, tamanho);
                    resolve(canvas.toDataURL('image/jpeg', qualidade));
                };
                img.onerror = () => reject(new Error('Use uma foto JPG, PNG ou WEBP'));
                img.src = evento.target.result;
            };
            leitor.readAsDataURL(arquivo);
        });
    }

    return {
        FIREBASE_CONFIG: FIREBASE_CONFIG,
        TEMPO_MOSTRAR_LETRA: TEMPO_MOSTRAR_LETRA,
        TEMPO_MOSTRAR_NUMERO: TEMPO_MOSTRAR_NUMERO,
        escaparHtml: escaparHtml,
        gerarId: gerarId,
        getLetra: getLetra,
        avatarPadrao: avatarPadrao,
        srcSegura: srcSegura,
        usarEmuladorLocal: usarEmuladorLocal,
        montarUrlJogador: montarUrlJogador,
        gerarCartela: gerarCartela,
        listaNumeros: listaNumeros,
        listaDe: listaDe,
        verificarSequencias: verificarSequencias,
        obterAudio: obterAudio,
        iniciarFirebase: iniciarFirebase,
        obterDb: obterDb,
        verificarBanco: verificarBanco,
        mensagemBanco: mensagemBanco,
        reduzirImagem: reduzirImagem
    };
});
