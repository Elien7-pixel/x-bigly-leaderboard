/**
 * Main Application
 * Initializes all components for the 67 Blankets campaign
 */

import { Leaderboard } from './leaderboard.js';
import { SpinningWheel } from './wheel.js';
import { SoundEffects } from './sounds.js';
import { subscribe, seed } from './convexClient.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    const leaderboard = new Leaderboard();
    const wheel = new SpinningWheel('wheelCanvas');
    const sfx = new SoundEffects();

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });

            // Redraw wheel when switching to wheel tab (fixes canvas sizing issues)
            if (tabId === 'wheel') {
                wheel.draw();
            }

            sfx.playClick();
        });
    });

    // Wire up sound effects to leaderboard
    const addBtn = document.getElementById('addSquaresBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => sfx.playAddSquare(), true);
    }

    // Wire up sound effects to wheel
    wheel.onTick = () => sfx.playTick();
    wheel.onWin = () => sfx.playWinFanfare();

    // Wire up milestone celebration sound
    leaderboard.onMilestone = (count, isFinal) => sfx.playMilestoneFanfare(isFinal);

    // Export buttons
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => leaderboard.exportCSV());
    }

    const exportSpinBtn = document.getElementById('exportSpinHistoryBtn');
    if (exportSpinBtn) {
        exportSpinBtn.addEventListener('click', () => wheel.exportSpinHistoryCSV());
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Press 'D' to load demo data
        if (e.key === 'd' && e.ctrlKey && e.shiftKey) {
            leaderboard.setDemoData();
            console.log('Demo data loaded');
        }

        // Press 'R' to reset data
        if (e.key === 'r' && e.ctrlKey && e.shiftKey) {
            if (confirm('Reset all leaderboard data?')) {
                leaderboard.reset();
                console.log('Data reset');
            }
        }

        // Press 'Space' to spin (when on wheel tab)
        if (e.key === ' ' && document.getElementById('wheel').classList.contains('active')) {
            e.preventDefault();
            wheel.spin();
        }
    });

    // Convex subscriptions - route live data into class update methods
    subscribe('getTribes', (tribes) => leaderboard.updateTribes(tribes));
    subscribe('getActivities', (activities) => leaderboard.updateActivities(activities));
    subscribe('getPrizes', (prizes) => wheel.updatePrizes(prizes));
    subscribe('getSpinHistory', (history) => wheel.updateSpinHistory(history));

    // Seed default data if DB is empty
    seed();

    // Make instances available globally for debugging
    window.app = {
        leaderboard,
        wheel,
        sfx
    };

    console.log('%c🧶 67 Blankets Campaign - X, bigly labs', 'font-size: 20px; font-weight: bold; color: #6366F1;');
    console.log('%cKeyboard shortcuts:', 'font-weight: bold;');
    console.log('  Ctrl+Shift+D: Load demo data');
    console.log('  Ctrl+Shift+R: Reset leaderboard');
    console.log('  Space:        Spin the wheel (on wheel tab)');
});
