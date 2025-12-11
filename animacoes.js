/* ================================================
   BINGO DOS VELOSO - SISTEMA DE ANIMAÇÕES
   Arquivo dedicado às animações profissionais
   ================================================ */

class BingoAnimacoes {
    constructor() {
        this.audioCtx = null;
        this.cores = {
            B: { cor: '#ef4444', gradiente: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
            I: { cor: '#f59e0b', gradiente: 'linear-gradient(135deg, #f59e0b, #b45309)' },
            N: { cor: '#22c55e', gradiente: 'linear-gradient(135deg, #22c55e, #15803d)' },
            G: { cor: '#3b82f6', gradiente: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
            O: { cor: '#a855f7', gradiente: 'linear-gradient(135deg, #a855f7, #7c3aed)' }
        };
    }

    // Inicializa contexto de áudio
    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioCtx;
    }

    // =====================
    // FASE 1: MOSTRAR LETRA
    // =====================
    mostrarLetra(letra) {
        const overlay = document.getElementById('animacaoOverlay');
        const faseLetra = document.getElementById('faseLetra');
        const faseNumero = document.getElementById('faseNumero');
        const letraEl = document.getElementById('letraGigante');
        const particulas = document.getElementById('particulas');

        // Limpa e prepara
        particulas.innerHTML = '';
        faseNumero.classList.remove('active');
        
        // Configura a letra
        letraEl.textContent = letra;
        letraEl.className = 'letra-gigante ' + letra.toLowerCase();

        // Mostra
        overlay.classList.add('active');
        faseLetra.classList.add('active');

        // Sons
        this.tocarSomSuspense();

        // Cria efeitos visuais
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

    // =====================
    // FASE 2: MOSTRAR NÚMERO
    // =====================
    mostrarNumero(numero, letra) {
        const faseLetra = document.getElementById('faseLetra');
        const faseNumero = document.getElementById('faseNumero');
        const bola = document.getElementById('bolaNumeroGrande');
        const letraEl = document.getElementById('bolaLetra');
        const numEl = document.getElementById('bolaNumero');

        // Transição
        faseLetra.classList.remove('active');
        
        // Pequeno delay para transição suave
        setTimeout(() => {
            // Configura a bola
            bola.className = 'bola-numero-grande ' + letra.toLowerCase();
            letraEl.textContent = letra;
            numEl.textContent = numero;

            // Mostra
            faseNumero.classList.add('active');

            // Efeitos
            this.criarExplosaoParticulas(letra);
            this.criarOndasExpansao(letra);
            this.criarRaiosLuz(letra);
            this.tocarSomNumero();
        }, 300);
    }

    // =====================
    // ESCONDER ANIMAÇÃO
    // =====================
    esconder() {
        const overlay = document.getElementById('animacaoOverlay');
        const faseLetra = document.getElementById('faseLetra');
        const faseNumero = document.getElementById('faseNumero');
        const particulas = document.getElementById('particulas');

        // Fade out
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

    // =====================
    // EFEITOS VISUAIS
    // =====================
    criarExplosaoParticulas(letra) {
        const container = document.getElementById('particulas');
        container.innerHTML = '';
        
        const cor = this.cores[letra].cor;
        const numParticulas = 40;

        for (let i = 0; i < numParticulas; i++) {
            const particula = document.createElement('div');
            particula.className = 'particula';
            
            // Tamanho variado
            const size = 8 + Math.random() * 20;
            particula.style.width = size + 'px';
            particula.style.height = size + 'px';
            
            // Cor com variação
            const hueShift = Math.random() * 30 - 15;
            particula.style.background = cor;
            particula.style.boxShadow = `0 0 ${size/2}px ${cor}`;
            
            // Direção aleatória
            const angle = (Math.PI * 2 / numParticulas) * i + (Math.random() * 0.5);
            const distance = 150 + Math.random() * 350;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particula.style.setProperty('--tx', tx + 'px');
            particula.style.setProperty('--ty', ty + 'px');
            
            // Animação
            const duration = 0.8 + Math.random() * 0.6;
            particula.style.animation = `particleExplode ${duration}s ease-out forwards`;
            particula.style.animationDelay = (Math.random() * 0.2) + 's';
            
            container.appendChild(particula);
        }

        // Adicionar estrelas
        this.criarEstrelas(container, cor);
    }

    criarEstrelas(container, cor) {
        const estrelas = ['⭐', '✨', '🌟', '💫'];
        
        for (let i = 0; i < 15; i++) {
            const estrela = document.createElement('div');
            estrela.className = 'estrela';
            estrela.textContent = estrelas[Math.floor(Math.random() * estrelas.length)];
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 300;
            const startX = 50 + Math.cos(angle) * 50;
            const startY = 50 + Math.sin(angle) * 50;
            
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

    criarRaiosLuz(letra) {
        const container = document.getElementById('particulas');
        const cor = this.cores[letra].cor;
        const numRaios = 12;
        
        for (let i = 0; i < numRaios; i++) {
            const raio = document.createElement('div');
            raio.className = 'raio';
            raio.style.background = `linear-gradient(to top, ${cor}, transparent)`;
            raio.style.transform = `rotate(${(360 / numRaios) * i}deg)`;
            raio.style.animationDelay = (Math.random() * 0.3) + 's';
            container.appendChild(raio);
        }
    }

    // =====================
    // SONS
    // =====================
    tocarSomSuspense() {
        try {
            const ctx = this.initAudio();
            
            // Som de rufar de tambores / suspense crescente
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
            
            // Adiciona tremolo
            const tremolo = ctx.createOscillator();
            const tremoloGain = ctx.createGain();
            tremolo.connect(tremoloGain);
            tremoloGain.connect(gain.gain);
            tremolo.frequency.value = 8;
            tremoloGain.gain.value = 0.05;
            tremolo.start(ctx.currentTime);
            tremolo.stop(ctx.currentTime + 3.5);
            
        } catch (e) {
            console.log('Erro de áudio:', e);
        }
    }

    tocarSomNumero() {
        try {
            const ctx = this.initAudio();
            
            // Fanfarra dramática
            const notas = [523, 659, 784, 1047, 1319, 1568]; // C5 até G6
            
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
            
            // Acorde final
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
            
        } catch (e) {
            console.log('Erro de áudio:', e);
        }
    }

    tocarSomGanhador() {
        try {
            const ctx = this.initAudio();
            
            // Fanfarra de vitória
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
            
        } catch (e) {
            console.log('Erro de áudio:', e);
        }
    }

    tocarSomVitoria() {
        try {
            const ctx = this.initAudio();
            
            // Fanfarra épica de super vitória
            const acordes = [
                [523, 659, 784],       // C maior
                [587, 740, 880],       // D maior  
                [659, 830, 988],       // E maior
                [698, 880, 1047],      // F maior
                [784, 988, 1175],      // G maior
                [523, 659, 784, 1047]  // C maior final
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
            
        } catch (e) {
            console.log('Erro de áudio:', e);
        }
    }
}

// Instância global
const bingoAnimacoes = new BingoAnimacoes();
