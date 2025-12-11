/* BINGO DOS VELOSO - SISTEMA DE ANIMAÇÕES */

class BingoAnimacoes {
    constructor() {
        this.audioCtx = null;
        this.cores = {
            B: { cor: '#ef4444' },
            I: { cor: '#f59e0b' },
            N: { cor: '#22c55e' },
            G: { cor: '#3b82f6' },
            O: { cor: '#a855f7' }
        };
    }

    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioCtx;
    }

    mostrarLetra(letra) {
        const overlay = document.getElementById('animacaoOverlay');
        const faseLetra = document.getElementById('faseLetra');
        const faseNumero = document.getElementById('faseNumero');
        const letraEl = document.getElementById('letraGigante');
        const particulas = document.getElementById('particulas');

        particulas.innerHTML = '';
        faseNumero.classList.remove('active');
        
        letraEl.textContent = letra;
        letraEl.className = 'letra-gigante ' + letra.toLowerCase();

        overlay.classList.add('active');
        faseLetra.classList.add('active');

        this.tocarSomSuspense();
        this.criarInterrogacoes();
    }

    criarInterrogacoes() {
        const container = document.querySelector('.interrogacoes');
        if (container) {
            container.innerHTML = '';
            for (let i = 0; i < 3; i++) {
                const span = document.createElement('span');
                span.className = 'interrogacao';
                span.textContent = '?';
                span.style.animationDelay = (i * 0.2) + 's';
                container.appendChild(span);
            }
        }
    }

    mostrarNumero(numero, letra) {
        const faseLetra = document.getElementById('faseLetra');
        const faseNumero = document.getElementById('faseNumero');
        const bola = document.getElementById('bolaNumeroGrande');
        const letraEl = document.getElementById('bolaLetra');
        const numEl = document.getElementById('bolaNumero');

        faseLetra.classList.remove('active');
        
        setTimeout(() => {
            bola.className = 'bola-numero-grande ' + letra.toLowerCase();
            letraEl.textContent = letra;
            numEl.textContent = numero;

            faseNumero.classList.add('active');

            this.criarExplosaoParticulas(letra);
            this.criarOndasExpansao(letra);
            this.tocarSomNumero();
        }, 300);
    }

    esconder() {
        const overlay = document.getElementById('animacaoOverlay');
        const faseLetra = document.getElementById('faseLetra');
        const faseNumero = document.getElementById('faseNumero');
        const particulas = document.getElementById('particulas');

        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.5s ease';

        setTimeout(() => {
            overlay.classList.remove('active');
            faseLetra.classList.remove('active');
            faseNumero.classList.remove('active');
            particulas.innerHTML = '';
            overlay.style.opacity = '';
            overlay.style.transition = '';
        }, 500);
    }

    criarExplosaoParticulas(letra) {
        const container = document.getElementById('particulas');
        container.innerHTML = '';
        
        const cor = this.cores[letra].cor;
        const numParticulas = 40;

        for (let i = 0; i < numParticulas; i++) {
            const particula = document.createElement('div');
            particula.className = 'particula';
            
            const size = 8 + Math.random() * 20;
            particula.style.width = size + 'px';
            particula.style.height = size + 'px';
            particula.style.background = cor;
            particula.style.boxShadow = '0 0 ' + (size/2) + 'px ' + cor;
            
            const angle = (Math.PI * 2 / numParticulas) * i + (Math.random() * 0.5);
            const distance = 150 + Math.random() * 350;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particula.style.setProperty('--tx', tx + 'px');
            particula.style.setProperty('--ty', ty + 'px');
            
            const duration = 0.8 + Math.random() * 0.6;
            particula.style.animation = 'particleExplode ' + duration + 's ease-out forwards';
            particula.style.animationDelay = (Math.random() * 0.2) + 's';
            
            container.appendChild(particula);
        }

        this.criarEstrelas(container);
    }

    criarEstrelas(container) {
        const estrelas = ['⭐', '✨', '🌟', '💫'];
        
        for (let i = 0; i < 15; i++) {
            const estrela = document.createElement('div');
            estrela.className = 'estrela';
            estrela.textContent = estrelas[Math.floor(Math.random() * estrelas.length)];
            
            const startX = 30 + Math.random() * 40;
            const startY = 30 + Math.random() * 40;
            
            estrela.style.left = startX + '%';
            estrela.style.top = startY + '%';
            estrela.style.animationDuration = (1 + Math.random()) + 's';
            estrela.style.animationDelay = (Math.random() * 0.5) + 's';
            
            container.appendChild(estrela);
        }
    }

    criarOndasExpansao(letra) {
        const container = document.getElementById('particulas');
        const cor = this.cores[letra].cor;
        
        for (let i = 0; i < 3; i++) {
            const onda = document.createElement('div');
            onda.className = 'onda';
            onda.style.borderColor = cor;
            onda.style.animationDelay = (i * 0.3) + 's';
            container.appendChild(onda);
        }
    }

    tocarSomSuspense() {
        try {
            const ctx = this.initAudio();
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, ctx.currentTime);
            filter.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 3);
            
            osc.frequency.setValueAtTime(100, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 3);
            
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 2.5);
            gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 3.5);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 3.5);
        } catch (e) {}
    }

    tocarSomNumero() {
        try {
            const ctx = this.initAudio();
            const notas = [523, 659, 784, 1047, 1319, 1568];
            
            notas.forEach((freq, i) => {
                setTimeout(() => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    
                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                    
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.25);
                }, i * 80);
            });
            
            setTimeout(() => {
                [523, 659, 784, 1047].forEach(freq => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    
                    gain.gain.setValueAtTime(0.2, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
                    
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.8);
                });
            }, notas.length * 80 + 100);
        } catch (e) {}
    }

    tocarSomGanhador() {
        try {
            const ctx = this.initAudio();
            const melodia = [
                { freq: 523, dur: 0.15 },
                { freq: 659, dur: 0.15 },
                { freq: 784, dur: 0.15 },
                { freq: 1047, dur: 0.3 },
                { freq: 784, dur: 0.15 },
                { freq: 1047, dur: 0.5 }
            ];
            
            let tempo = 0;
            melodia.forEach(nota => {
                setTimeout(() => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.frequency.value = nota.freq;
                    gain.gain.setValueAtTime(0.35, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + nota.dur);
                    
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + nota.dur);
                }, tempo * 1000);
                
                tempo += nota.dur;
            });
        } catch (e) {}
    }

    tocarSomVitoria() {
        try {
            const ctx = this.initAudio();
            const acordes = [
                [523, 659, 784],
                [587, 740, 880],
                [659, 830, 988],
                [698, 880, 1047],
                [784, 988, 1175],
                [523, 659, 784, 1047]
            ];
            
            acordes.forEach((acorde, i) => {
                setTimeout(() => {
                    acorde.forEach(freq => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        
                        osc.type = i === acordes.length - 1 ? 'sine' : 'square';
                        osc.frequency.value = freq;
                        
                        const duracao = i === acordes.length - 1 ? 1 : 0.25;
                        gain.gain.setValueAtTime(0.25, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duracao);
                        
                        osc.start(ctx.currentTime);
                        osc.stop(ctx.currentTime + duracao);
                    });
                }, i * 200);
            });
        } catch (e) {}
    }
}

const bingoAnimacoes = new BingoAnimacoes();
