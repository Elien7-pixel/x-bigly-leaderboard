/**
 * Spinning Wheel Module
 * Professional smooth spinning wheel with easing
 * Data is driven by Convex subscriptions - no localStorage
 */

import * as convex from './convexClient.js';

class SpinningWheel {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Wheel properties
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) - 10;

        // Animation properties
        this.currentRotation = 0;
        this.isSpinning = false;
        this.animationId = null;
        this.lastTickSegment = -1;

        // Sound callbacks (wired up by app.js)
        this.onTick = null;
        this.onWin = null;

        // Prizes (populated by Convex subscription)
        this.prizes = [];

        // Spin history (populated by Convex subscription)
        this.spinHistory = [];

        // DOM elements
        this.spinBtn = document.getElementById('spinBtn');
        this.prizeDisplay = document.getElementById('prizeDisplay');
        this.prizeText = document.getElementById('prizeText');
        this.prizeList = document.getElementById('prizeList');
        this.spinHistoryList = document.getElementById('spinHistoryList');

        // Initialize
        this.draw();
        this.setupEventListeners();
        this.renderPrizeList();
        this.renderSpinHistory();
    }

    /**
     * Called by Convex subscription when prizes data changes
     */
    updatePrizes(convexPrizes) {
        if (!convexPrizes) return;

        this.prizes = convexPrizes.map(p => ({
            _id: p._id,
            name: p.name,
            color: p.color,
            order: p.order,
        }));

        this.draw();
        this.renderPrizeList();
    }

    /**
     * Called by Convex subscription when spin history data changes
     */
    updateSpinHistory(convexHistory) {
        if (!convexHistory) return;

        this.spinHistory = convexHistory.map(h => ({
            prize: h.prize,
            color: h.color,
            timestamp: h.timestamp,
        }));

        this.renderSpinHistory();
    }

    /**
     * Smooth easing - quartic ease out for professional deceleration
     */
    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    /**
     * Draw the wheel
     */
    draw() {
        const ctx = this.ctx;
        const numSegments = this.prizes.length;

        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (numSegments === 0) {
            // Draw empty state
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#E5E7EB';
            ctx.fill();
            ctx.strokeStyle = '#5C2D82';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.fillStyle = '#6B7280';
            ctx.font = '600 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Loading prizes...', this.centerX, this.centerY);
            return;
        }

        const segmentAngle = (2 * Math.PI) / numSegments;

        // Draw segments
        this.prizes.forEach((prize, i) => {
            const startAngle = this.currentRotation + (i * segmentAngle);
            const endAngle = startAngle + segmentAngle;

            // Draw segment
            ctx.beginPath();
            ctx.moveTo(this.centerX, this.centerY);
            ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = prize.color;
            ctx.fill();

            // Draw segment border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(startAngle + segmentAngle / 2);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';

            // Text color based on background brightness
            const isLightBg = prize.color === '#FFD100' || prize.color === '#F1C40F';
            ctx.fillStyle = isLightBg ? '#1A1A1A' : '#FFFFFF';

            // Auto-size font to fit the available space
            const maxTextWidth = this.radius - 55;
            let fontSize = 13;
            ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
            while (ctx.measureText(prize.name).width > maxTextWidth && fontSize > 7) {
                fontSize--;
                ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
            }

            ctx.fillText(prize.name, this.radius - 25, 0);
            ctx.restore();
        });

        // Draw outer ring
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#5C2D82';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw center circle
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 28, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#5C2D82';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw center dot
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 12, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFD100';
        ctx.fill();
    }

    /**
     * Spin the wheel with butter-smooth animation
     */
    spin() {
        if (this.isSpinning || this.prizes.length === 0) return;

        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.prizeDisplay.classList.remove('winner');
        this.prizeText.textContent = 'Spinning...';

        // Cancel any existing animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Calculate spin - 4-6 full rotations + random landing
        const totalSpins = 4 + Math.random() * 2;
        const totalRotation = totalSpins * 2 * Math.PI + Math.random() * 2 * Math.PI;

        // Animation timing - 4 to 5 seconds for smooth deceleration
        const duration = 4000 + Math.random() * 1000;
        const startTime = performance.now();
        const startRotation = this.currentRotation;

        this.lastTickSegment = -1;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Apply smooth easing
            const easedProgress = this.easeOutQuart(progress);

            // Update rotation
            this.currentRotation = startRotation + (totalRotation * easedProgress);

            // Tick sound when crossing segment boundaries
            if (this.onTick && this.prizes.length > 0) {
                const segmentAngle = (2 * Math.PI) / this.prizes.length;
                const currentSegment = Math.floor(((this.currentRotation % (2 * Math.PI)) + 2 * Math.PI) / segmentAngle) % this.prizes.length;
                if (currentSegment !== this.lastTickSegment) {
                    this.lastTickSegment = currentSegment;
                    this.onTick();
                }
            }

            // Redraw wheel
            this.draw();

            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.finishSpin();
            }
        };

        this.animationId = requestAnimationFrame(animate);
    }

    /**
     * Finish spin and show winner
     */
    finishSpin() {
        this.isSpinning = false;
        this.spinBtn.disabled = false;

        // Normalize rotation
        this.currentRotation = this.currentRotation % (2 * Math.PI);

        // Calculate winning segment (pointer at top = 270° = 3π/2)
        const pointerAngle = (3 * Math.PI / 2);
        const numSegments = this.prizes.length;
        const segmentAngle = (2 * Math.PI) / numSegments;

        let winningAngle = (pointerAngle - this.currentRotation + 2 * Math.PI) % (2 * Math.PI);
        let winningIndex = Math.floor(winningAngle / segmentAngle) % this.prizes.length;

        const winner = this.prizes[winningIndex];

        // Reveal winner with slight delay for effect
        setTimeout(() => {
            this.prizeText.textContent = winner.name;
            this.prizeDisplay.classList.add('winner');
            this.triggerConfetti();
            if (this.onWin) this.onWin();
            this.logSpin(winner.name, winner.color);
        }, 100);
    }

    /**
     * Confetti celebration
     */
    triggerConfetti() {
        const colors = ['#5C2D82', '#FFD100', '#7B4A9E', '#1A1A1A', '#9B59B6'];

        for (let i = 0; i < 35; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDuration = (2 + Math.random() * 1.5) + 's';
                document.body.appendChild(confetti);

                setTimeout(() => confetti.remove(), 3500);
            }, i * 25);
        }
    }

    /**
     * Add a prize via Convex mutation
     */
    addPrize(name, color) {
        if (!name.trim()) return;
        convex.addPrize(name.trim(), color);
    }

    /**
     * Remove a prize via Convex mutation (uses stored _id)
     */
    removePrize(index) {
        if (this.prizes.length <= 2) {
            alert('You need at least 2 prizes on the wheel!');
            return;
        }

        const prize = this.prizes[index];
        if (prize && prize._id) {
            convex.removePrize(prize._id);
        }
    }

    /**
     * Render prize list in admin panel
     */
    renderPrizeList() {
        if (!this.prizeList) return;

        this.prizeList.innerHTML = this.prizes.map((prize, i) => `
            <div class="prize-item">
                <span class="prize-color" style="background: ${prize.color}"></span>
                <span>${prize.name}</span>
                <button class="prize-remove" data-index="${i}">×</button>
            </div>
        `).join('');

        this.prizeList.querySelectorAll('.prize-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removePrize(parseInt(e.target.dataset.index));
            });
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this.spinBtn) {
            this.spinBtn.addEventListener('click', () => this.spin());
        }

        const addPrizeBtn = document.getElementById('addPrizeBtn');
        const newPrizeName = document.getElementById('newPrizeName');
        const newPrizeColor = document.getElementById('newPrizeColor');

        if (addPrizeBtn) {
            addPrizeBtn.addEventListener('click', () => {
                this.addPrize(newPrizeName.value, newPrizeColor.value);
                newPrizeName.value = '';
            });
        }

        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Handle resize
     */
    handleResize() {
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) - 10;
        this.draw();
    }

    /**
     * Log a spin result via Convex mutation
     */
    logSpin(prizeName, prizeColor) {
        convex.logSpin(prizeName, prizeColor);
    }

    /**
     * Render spin history list
     */
    renderSpinHistory() {
        if (!this.spinHistoryList) return;

        const entries = this.spinHistory.slice(0, 20);

        if (entries.length === 0) {
            this.spinHistoryList.innerHTML = '<div class="activity-empty">No spins yet. Give it a try!</div>';
            return;
        }

        this.spinHistoryList.innerHTML = entries.map((entry, i) => {
            const timeAgo = this.formatTimeAgo(entry.timestamp);
            const isNew = i === 0 && (Date.now() - entry.timestamp < 3000);
            return `
                <div class="spin-history-entry${isNew ? ' activity-new' : ''}">
                    <span class="spin-history-color" style="background: ${entry.color}"></span>
                    <span class="spin-history-prize">${entry.prize}</span>
                    <span class="spin-history-time">${timeAgo}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Format a timestamp as relative time
     */
    formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 5) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return new Date(timestamp).toLocaleDateString();
    }

    /**
     * Export spin history as CSV
     */
    exportSpinHistoryCSV() {
        let csv = 'SPIN HISTORY REPORT\r\n';
        csv += `Generated,${new Date().toLocaleString()}\r\n`;
        csv += `Total Spins,${this.spinHistory.length}\r\n\r\n`;

        // Prize summary
        const prizeCounts = {};
        this.spinHistory.forEach(entry => {
            prizeCounts[entry.prize] = (prizeCounts[entry.prize] || 0) + 1;
        });
        csv += 'PRIZE SUMMARY\r\n';
        csv += 'Prize,Times Won\r\n';
        Object.entries(prizeCounts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([prize, count]) => {
                csv += `${prize},${count}\r\n`;
            });

        csv += '\r\nDETAILED LOG\r\n';
        csv += 'Spin #,Time,Prize\r\n';
        this.spinHistory.slice().reverse().forEach((entry, i) => {
            const time = new Date(entry.timestamp).toLocaleString();
            csv += `${i + 1},${time},${entry.prize}\r\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bigly-spin-history-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

export { SpinningWheel };
