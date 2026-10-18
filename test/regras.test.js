const assert = require('assert');
const C = require('../js/comum.js');

function cartelaFixa() {
    return [
        [1, 16, 31, 46, 61],
        [2, 17, 32, 47, 62],
        [3, 18, 0, 48, 63],
        [4, 19, 33, 49, 64],
        [5, 20, 34, 50, 65]
    ];
}

const linha = C.verificarSequencias(cartelaFixa(), [0, 1, 16, 31, 46, 61]);
assert.deepStrictEqual(linha.linhas, [0]);
assert.strictEqual(linha.tipoVitoria, '➖ Linha');
assert.strictEqual(linha.cartelaCheia, false);

const coluna = C.verificarSequencias(cartelaFixa(), [0, 1, 2, 3, 4, 5]);
assert.deepStrictEqual(coluna.colunas, [0]);
assert.strictEqual(coluna.tipoVitoria, '| Coluna');

const diagonal = C.verificarSequencias(cartelaFixa(), [0, 1, 17, 49, 65]);
assert.deepStrictEqual(diagonal.diagonais, ['d1']);
assert.strictEqual(diagonal.tipoVitoria, '↗️ Diagonal');

const cruzada = C.verificarSequencias(cartelaFixa(), [0, 1, 17, 49, 65, 61, 47, 19, 5]);
assert.strictEqual(cruzada.cruzada, true);
assert.strictEqual(cruzada.tipoVitoria, '✖️ Cruzada');

const cheia = C.verificarSequencias(cartelaFixa(), [0, 1, 16, 31, 46, 61, 2, 17, 32, 47, 62, 3, 18, 48, 63, 4, 19, 33, 49, 64, 5, 20, 34, 50, 65]);
assert.strictEqual(cheia.cartelaCheia, true);
assert.strictEqual(cheia.tipoVitoria, '🏆 CARTELA CHEIA');

const nada = C.verificarSequencias(cartelaFixa(), [0, 1, 2]);
assert.strictEqual(nada.tipoVitoria, null);

assert.deepStrictEqual(C.listaNumeros({ 1: 20, 0: 5 }), [5, 20]);
assert.strictEqual(C.escaparHtml("D'Ávila <img>"), 'D&#39;Ávila &lt;img&gt;');

assert.strictEqual(
    C.montarUrlJogador('https://bavkiq-hugby8-cittet.github.io/bingo/', 'sala1'),
    'https://bavkiq-hugby8-cittet.github.io/bingo/jogador.html?sala=sala1'
);
assert.strictEqual(
    C.montarUrlJogador('https://bavkiq-hugby8-cittet.github.io/bingo/index.html', 'a b'),
    'https://bavkiq-hugby8-cittet.github.io/bingo/jogador.html?sala=a+b'
);
assert.strictEqual(
    C.montarUrlJogador('https://bavkiq-hugby8-cittet.github.io/bingo', 'x'),
    'https://bavkiq-hugby8-cittet.github.io/bingo/jogador.html?sala=x'
);
assert.strictEqual(
    C.montarUrlJogador('http://127.0.0.1:5500/index.html?emulador=1', 'abc'),
    'http://127.0.0.1:5500/jogador.html?sala=abc&emulador=1'
);

for (let i = 0; i < 30; i += 1) {
    const cartela = C.gerarCartela(i);
    const flat = cartela.numeros.flat();
    assert.strictEqual(cartela.numeros[2][2], 0);
    assert.strictEqual(flat.filter((n) => n !== 0).length, 24);
    assert.strictEqual(new Set(flat.filter((n) => n !== 0)).size, 24);
    cartela.numeros.forEach((linhaCartela, indice) => {
        assert.ok(linhaCartela[0] >= 1 && linhaCartela[0] <= 15);
        assert.ok(linhaCartela[1] >= 16 && linhaCartela[1] <= 30);
        if (indice !== 2) assert.ok(linhaCartela[2] >= 31 && linhaCartela[2] <= 45);
        assert.ok(linhaCartela[3] >= 46 && linhaCartela[3] <= 60);
        assert.ok(linhaCartela[4] >= 61 && linhaCartela[4] <= 75);
    });
    assert.strictEqual(C.getLetra(1), 'B');
    assert.strictEqual(C.getLetra(16), 'I');
    assert.strictEqual(C.getLetra(31), 'N');
    assert.strictEqual(C.getLetra(46), 'G');
    assert.strictEqual(C.getLetra(75), 'O');
}

assert.strictEqual(C.srcSegura('javascript:alert(1)'), '');
assert.strictEqual(C.srcSegura('data:image/jpeg;base64,aaa'), 'data:image/jpeg;base64,aaa');

console.log('regras ok');
