/**
 * Sound Effects Module
 * Uses Web Audio API to generate sounds - no external audio files needed
 */

class SoundEffects {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    /**
     * Lazily initialize AudioContext (must be after user gesture)
     */
    getContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    /**
     * Short click/tick sound for wheel segments passing the pointer
     */
    playTick() {
        if (!this.enabled) return;
        try {
            const ctx = this.getContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03);

            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.04);
        } catch (e) { /* ignore audio errors */ }
    }

    /**
     * Satisfying click for adding squares
     */
    playAddSquare() {
        if (!this.enabled) return;
        try {
            const ctx = this.getContext();

            // Pop sound
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
            osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);

            // Chime
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.05);

            gain2.gain.setValueAtTime(0, ctx.currentTime);
            gain2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.06);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

            osc2.start(ctx.currentTime + 0.05);
            osc2.stop(ctx.currentTime + 0.3);
        } catch (e) { /* ignore audio errors */ }
    }

    /**
     * Celebratory fanfare for winning a prize
     */
    playWinFanfare() {
        if (!this.enabled) return;
        try {
            const ctx = this.getContext();
            const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
            const startTime = ctx.currentTime;

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, startTime + i * 0.12);

                gain.gain.setValueAtTime(0, startTime + i * 0.12);
                gain.gain.linearRampToValueAtTime(0.1, startTime + i * 0.12 + 0.02);
                gain.gain.setValueAtTime(0.1, startTime + i * 0.12 + 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.12 + 0.25);

                osc.start(startTime + i * 0.12);
                osc.stop(startTime + i * 0.12 + 0.25);
            });

            // Final sustained chord
            const chordTime = startTime + notes.length * 0.12;
            [523, 659, 784, 1047].forEach(freq => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, chordTime);

                gain.gain.setValueAtTime(0, chordTime);
                gain.gain.linearRampToValueAtTime(0.06, chordTime + 0.03);
                gain.gain.setValueAtTime(0.06, chordTime + 0.3);
                gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.8);

                osc.start(chordTime);
                osc.stop(chordTime + 0.8);
            });
        } catch (e) { /* ignore audio errors */ }
    }

    /**
     * Grand fanfare for milestone celebrations
     */
    playMilestoneFanfare(isFinal) {
        if (!this.enabled) return;
        try {
            const ctx = this.getContext();
            const t = ctx.currentTime;

            // Rising arpeggio - C major with octave jump
            const notes = isFinal
                ? [523, 659, 784, 1047, 1319, 1568, 2093] // C5 up to C7
                : [523, 659, 784, 1047, 1319];             // C5 up to E6

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'square';
                const noteTime = t + i * 0.1;
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0, noteTime);
                gain.gain.linearRampToValueAtTime(0.1, noteTime + 0.02);
                gain.gain.setValueAtTime(0.1, noteTime + 0.07);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);

                osc.start(noteTime);
                osc.stop(noteTime + 0.2);
            });

            // Big sustained chord after arpeggio
            const chordTime = t + notes.length * 0.1;
            const chordNotes = isFinal
                ? [523, 659, 784, 1047, 1568, 2093] // full spread
                : [523, 659, 784, 1047];
            const chordDuration = isFinal ? 1.5 : 1.0;

            chordNotes.forEach(freq => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, chordTime);

                gain.gain.setValueAtTime(0, chordTime);
                gain.gain.linearRampToValueAtTime(0.07, chordTime + 0.04);
                gain.gain.setValueAtTime(0.07, chordTime + chordDuration * 0.4);
                gain.gain.exponentialRampToValueAtTime(0.001, chordTime + chordDuration);

                osc.start(chordTime);
                osc.stop(chordTime + chordDuration);
            });
        } catch (e) { /* ignore audio errors */ }
    }

    /**
     * Simple UI click for tab switching etc
     */
    playClick() {
        if (!this.enabled) return;
        try {
            const ctx = this.getContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000, ctx.currentTime);

            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.03);
        } catch (e) { /* ignore audio errors */ }
    }
}

export { SoundEffects };
