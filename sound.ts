// Simple synth for game sounds using Web Audio API
// This avoids external dependencies or broken links

let audioCtx: AudioContext | null = null;

const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};

type SoundType = 'select' | 'move' | 'recruit' | 'fuse' | 'combat' | 'capital' | 'catastrophe' | 'win' | 'click';

export const playSound = (type: SoundType) => {
    try {
        initAudio();
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        switch (type) {
            case 'select':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            
            case 'click':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, now);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;

            case 'move':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(600, now + 0.1);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;

            case 'recruit':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.linearRampToValueAtTime(1000, now + 0.1);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            
            case 'fuse':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.linearRampToValueAtTime(800, now + 0.3);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;

            case 'capital':
                osc.type = 'square';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;

            case 'combat':
                osc.type = 'sawtooth';
                // Noise-like effect by modulating frequency rapidly? 
                // Web Audio implies creating a noise buffer for real noise, but we keep it simple.
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.linearRampToValueAtTime(50, now + 0.1);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                
                // Secondary "hit"
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.type = 'square';
                osc2.frequency.setValueAtTime(50, now);
                gain2.gain.setValueAtTime(0.1, now);
                gain2.gain.linearRampToValueAtTime(0, now + 0.1);
                osc2.start(now);
                osc2.stop(now + 0.1);
                break;

            case 'catastrophe':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(80, now);
                osc.frequency.linearRampToValueAtTime(60, now + 1.5);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 1.5);
                osc.start(now);
                osc.stop(now + 1.5);
                break;

            case 'win':
                const melody = [523.25, 659.25, 783.99, 1046.50];
                let t = now;
                melody.forEach((note, i) => {
                    const o = audioCtx!.createOscillator();
                    const g = audioCtx!.createGain();
                    o.connect(g);
                    g.connect(audioCtx!.destination);
                    o.type = 'triangle';
                    o.frequency.value = note;
                    g.gain.setValueAtTime(0.1, t);
                    g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
                    o.start(t);
                    o.stop(t + 0.2);
                    t += 0.15;
                });
                break;
        }
    } catch (e) {
        console.error("Audio error", e);
    }
};
