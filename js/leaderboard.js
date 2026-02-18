/**
 * Leaderboard Module
 * Manages the tribe leaderboard for the 67 Blankets campaign
 * Data is driven by Convex subscriptions - no localStorage
 */

import * as convex from './convexClient.js';

class Leaderboard {
    constructor() {
        // The 4 tribes with their data (populated by Convex subscription)
        this.tribes = [
            { id: 0, name: 'Integrated Digital Engagement', squares: 0, color: '#6366F1' },
            { id: 1, name: 'Integrated Health Enablement', squares: 0, color: '#10B981' },
            { id: 2, name: 'Wholesale Excellence', squares: 0, color: '#F59E0B' },
            { id: 3, name: 'Enterprise Acceleration', squares: 0, color: '#EC4899' }
        ];

        // Goal: 67 blankets, approximately 35 squares per blanket
        this.squaresPerBlanket = 35;
        this.targetBlankets = 67;
        this.targetSquares = this.squaresPerBlanket * this.targetBlankets;

        // DOM elements
        this.leaderboardList = document.getElementById('leaderboardList');
        this.totalSquaresEl = document.getElementById('totalSquares');
        this.goalProgressEl = document.getElementById('goalProgress');
        this.blanketsCompleteEl = document.getElementById('blanketsComplete');

        // Animated counter state
        this.displayedTotal = 0;
        this.displayedBlankets = 0;
        this.counterAnimationId = null;

        // Activity feed (populated by Convex subscription)
        this.activityFeed = [];

        // Milestone tracking
        this.milestones = [10, 25, 50, 67];
        this.onMilestone = null; // callback wired by app.js

        // Initialize
        this.render();
        this.setupEventListeners();
    }

    /**
     * Called by Convex subscription when tribes data changes
     */
    updateTribes(convexTribes) {
        if (!convexTribes || convexTribes.length === 0) return;

        const blanketsBefore = Math.floor(this.getTotalSquares() / this.squaresPerBlanket);

        convexTribes.forEach(ct => {
            const tribe = this.tribes.find(t => t.id === ct.tribeId);
            if (tribe) {
                tribe.squares = ct.squares;
                tribe.color = ct.color;
                tribe.name = ct.name;
            }
        });

        this.render();
        this.checkMilestones(blanketsBefore);
    }

    /**
     * Called by Convex subscription when activities data changes
     */
    updateActivities(convexActivities) {
        if (!convexActivities) return;

        this.activityFeed = convexActivities.map(a => ({
            tribe: a.tribeName,
            count: a.count,
            timestamp: a.timestamp,
        }));

        this.renderActivityFeed();
    }

    /**
     * Add squares to a tribe via Convex mutation
     */
    addSquares(tribeId, count) {
        convex.addSquares(tribeId, count);
    }

    /**
     * Check if any blanket milestones were crossed
     */
    checkMilestones(blanketsBefore) {
        const blanketsNow = Math.floor(this.getTotalSquares() / this.squaresPerBlanket);
        for (const milestone of this.milestones) {
            if (blanketsBefore < milestone && blanketsNow >= milestone) {
                this.triggerMilestone(milestone);
                break; // only fire the highest newly-crossed milestone
            }
        }
    }

    /**
     * Fire a milestone celebration
     */
    triggerMilestone(blanketCount) {
        // Show overlay banner
        const overlay = document.createElement('div');
        overlay.className = 'milestone-overlay';

        const isFinal = blanketCount >= this.targetBlankets;
        const emoji = isFinal ? '🏆' : '🎉';
        const heading = isFinal ? 'GOAL REACHED!' : 'MILESTONE!';
        const sub = isFinal
            ? `All ${this.targetBlankets} blankets complete!`
            : `${blanketCount} blankets knitted!`;

        overlay.innerHTML = `
            <div class="milestone-card ${isFinal ? 'milestone-final' : ''}">
                <div class="milestone-emoji">${emoji}</div>
                <div class="milestone-heading">${heading}</div>
                <div class="milestone-sub">${sub}</div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Trigger entrance animation
        requestAnimationFrame(() => overlay.classList.add('milestone-visible'));

        // Heavy confetti burst
        this.milestoneConfetti(isFinal ? 80 : 50);

        // Sound callback
        if (this.onMilestone) this.onMilestone(blanketCount, isFinal);

        // Auto-dismiss after 4s
        setTimeout(() => {
            overlay.classList.remove('milestone-visible');
            overlay.classList.add('milestone-exit');
            setTimeout(() => overlay.remove(), 500);
        }, 4000);

        // Also dismiss on click
        overlay.addEventListener('click', () => {
            overlay.classList.remove('milestone-visible');
            overlay.classList.add('milestone-exit');
            setTimeout(() => overlay.remove(), 500);
        });
    }

    /**
     * Big confetti burst for milestones
     */
    milestoneConfetti(count) {
        const colors = ['#5C2D82', '#FFD100', '#7B4A9E', '#EC4899', '#10B981', '#F59E0B'];
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const c = document.createElement('div');
                c.className = 'confetti';
                c.style.left = Math.random() * 100 + 'vw';
                c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                c.style.animationDuration = (2 + Math.random() * 2) + 's';
                c.style.width = (6 + Math.random() * 6) + 'px';
                c.style.height = (6 + Math.random() * 6) + 'px';
                document.body.appendChild(c);
                setTimeout(() => c.remove(), 4500);
            }, i * 20);
        }
    }

    /**
     * Get total squares across all tribes
     */
    getTotalSquares() {
        return this.tribes.reduce((sum, tribe) => sum + tribe.squares, 0);
    }

    /**
     * Get tribes sorted by squares (descending)
     */
    getSortedTribes() {
        return [...this.tribes].sort((a, b) => b.squares - a.squares);
    }

    /**
     * Render the leaderboard
     */
    render() {
        const sortedTribes = this.getSortedTribes();
        const maxSquares = Math.max(...this.tribes.map(t => t.squares), 1);
        const totalSquares = this.getTotalSquares();

        // Animate counters
        this.animateCounter(totalSquares);

        // Update goal progress
        const progressPercent = Math.min((totalSquares / this.targetSquares) * 100, 100);
        this.goalProgressEl.style.width = `${progressPercent}%`;

        // Render tribe cards
        this.leaderboardList.innerHTML = sortedTribes.map((tribe, index) => {
            const progressPercent = (tribe.squares / maxSquares) * 100;
            const rankClass = index < 3 ? `rank-${index + 1}` : '';

            return `
                <div class="tribe-card" data-tribe="${tribe.id}">
                    <div class="tribe-rank ${rankClass}">${index + 1}</div>
                    <div class="tribe-info">
                        <div class="tribe-name">${tribe.name}</div>
                        <div class="tribe-progress">
                            <div class="tribe-progress-bar">
                                <div class="tribe-progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="tribe-squares">
                        <span class="tribe-count">${tribe.squares.toLocaleString()}</span>
                        <span class="tribe-label">squares</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Animate total squares and blankets counters smoothly
     */
    animateCounter(targetTotal) {
        if (this.counterAnimationId) {
            cancelAnimationFrame(this.counterAnimationId);
        }

        const startTotal = this.displayedTotal;
        const startBlankets = this.displayedBlankets;
        const targetBlankets = Math.floor(targetTotal / this.squaresPerBlanket);
        const duration = 600;
        const startTime = performance.now();

        const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            const currentTotal = Math.round(startTotal + (targetTotal - startTotal) * ease);
            const currentBlankets = Math.round(startBlankets + (targetBlankets - startBlankets) * ease);

            this.totalSquaresEl.textContent = currentTotal.toLocaleString();
            this.blanketsCompleteEl.textContent = currentBlankets;

            if (progress < 1) {
                this.counterAnimationId = requestAnimationFrame(step);
            } else {
                this.displayedTotal = targetTotal;
                this.displayedBlankets = targetBlankets;
                this.counterAnimationId = null;
            }
        };

        this.counterAnimationId = requestAnimationFrame(step);
    }

    /**
     * Animate when squares are added
     */
    animateAddition(tribeId) {
        const card = document.querySelector(`[data-tribe="${tribeId}"]`);
        if (card) {
            card.style.transform = 'scale(1.02)';
            card.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.3)';
            setTimeout(() => {
                card.style.transform = '';
                card.style.boxShadow = '';
            }, 300);
        }
    }

    /**
     * Setup event listeners for admin controls
     */
    setupEventListeners() {
        const addBtn = document.getElementById('addSquaresBtn');
        const tribeSelect = document.getElementById('tribeSelect');
        const squareCount = document.getElementById('squareCount');

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const tribeId = parseInt(tribeSelect.value);
                const count = parseInt(squareCount.value) || 1;
                this.addSquares(tribeId, count);
                squareCount.value = 1;
            });
        }
    }

    /**
     * Reset all data via Convex mutation
     */
    reset() {
        convex.resetTribes();
    }

    /**
     * Set demo data via Convex mutation
     */
    setDemoData() {
        convex.setDemoData();
    }

    /**
     * Render the activity feed
     */
    renderActivityFeed() {
        const feedEl = document.getElementById('activityFeed');
        if (!feedEl) return;

        const entries = this.activityFeed.slice(0, 15);

        if (entries.length === 0) {
            feedEl.innerHTML = '<div class="activity-empty">No activity yet. Add some squares!</div>';
            return;
        }

        feedEl.innerHTML = entries.map((entry, i) => {
            const timeAgo = this.formatTimeAgo(entry.timestamp);
            const isNew = i === 0 && (Date.now() - entry.timestamp < 3000);
            return `
                <div class="activity-entry${isNew ? ' activity-new' : ''}">
                    <div class="activity-dot"></div>
                    <div class="activity-text">
                        <strong>${entry.tribe}</strong> added <strong>${entry.count}</strong> square${entry.count !== 1 ? 's' : ''}
                    </div>
                    <div class="activity-time">${timeAgo}</div>
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
     * Get activity feed data for export
     */
    getActivityData() {
        return this.activityFeed;
    }

    /**
     * Export leaderboard and activity data as CSV
     */
    exportCSV() {
        const totalSquares = this.getTotalSquares();
        const blankets = Math.floor(totalSquares / this.squaresPerBlanket);

        let csv = 'LEADERBOARD REPORT\r\n';
        csv += `Generated,${new Date().toLocaleString()}\r\n`;
        csv += `Total Squares,${totalSquares}\r\n`;
        csv += `Blankets Complete,${blankets} / ${this.targetBlankets}\r\n`;
        csv += '\r\n';

        csv += 'TRIBE RANKINGS\r\n';
        csv += 'Rank,Tribe,Squares,Blankets Contribution,% of Total\r\n';
        const sorted = this.getSortedTribes();
        sorted.forEach((tribe, i) => {
            const pct = totalSquares > 0 ? ((tribe.squares / totalSquares) * 100).toFixed(1) : '0.0';
            const tribeBlankets = (tribe.squares / this.squaresPerBlanket).toFixed(1);
            csv += `${i + 1},${tribe.name},${tribe.squares},${tribeBlankets},${pct}%\r\n`;
        });

        csv += '\r\nACTIVITY LOG\r\n';
        csv += 'Time,Tribe,Squares Added\r\n';
        this.activityFeed.forEach(entry => {
            const time = new Date(entry.timestamp).toLocaleString();
            csv += `${time},${entry.tribe},${entry.count}\r\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bigly-leaderboard-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

export { Leaderboard };
