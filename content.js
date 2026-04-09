(function() {
	'use strict';

	// Declaring default settings
	let settings = {
		enabled: true,
		mode: 'always', // always, threshold
		threshold: 70
	};

	// Load settings
	async function loadSettings() {
		try {
			const result = await browser.storage.local.get('settings');
			if (result.settings) {
				settings = { ...settings, ...result.settings };
			}
		} catch (error) {
			console.error("Error loading settings:", error);
			// we fall back to defaults set above
		}
	}

	// Parse score
	function parseScore(scoreText) {
		const match = scoreText.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
		if (match) {
			const earned = parseFloat(match[1]);
			const total = parseFloat(match[2]);
			return { earned, total, percentage: total > 0 ? (earned / total) * 100 : 0 };
		}
		return null;
	}

 	// Determine if score should be visible
	function shouldHideScore(scoreInfo) {
		if (!settings.enabled) {
			return false;
    	}
		if (settings.mode === 'always') {
			return true;
		}
		if (settings.mode === 'threshold' && scoreInfo) {
			return scoreInfo.percentage < settings.threshold;
		}
		return false;
	}

	// Match wrapper classes
	function syncOverlayState(wrapper, scoreDisplay) {
		const hidden = scoreDisplay.classList.contains('gs-discrete-hidden');
		wrapper.classList.toggle('gs-discrete-state-hidden', hidden);
		wrapper.classList.toggle('gs-discrete-state-visible', !hidden);
		wrapper.setAttribute('aria-pressed', hidden ? 'false' : 'true');
		wrapper.setAttribute('aria-label', hidden ? 'Show grade' : 'Hide grade');
	}

	// Process score element
	function processScoreElement(scoreElement) {
		if (scoreElement.hasAttribute('data-gs-discrete-processed')) {
			return;
    	}

		const scoreText = scoreElement.textContent.trim();
	    
		// Skip ungraded assignments
		if (scoreText.match(/^-\s*\/\s*\d/)) return;

		const scoreInfo = parseScore(scoreText);
		const shouldHide = shouldHideScore(scoreInfo);

		scoreElement.setAttribute('data-gs-discrete-processed', 'true');

		// Overlay wrapper with blur
		const wrapper = document.createElement('div');
		wrapper.className = 'gs-discrete-overlay';
		wrapper.setAttribute('role', 'button');
		wrapper.setAttribute('tabindex', '0');

		const scoreDisplay = document.createElement('div');
		scoreDisplay.className = 'gs-discrete-score-value';
		scoreDisplay.textContent = scoreText;

		// Overlay hint labels
		const hint = document.createElement('div');
		hint.className = 'gs-discrete-hint';
		hint.setAttribute('aria-hidden', 'true');
		const hintShow = document.createElement('span');
		hintShow.className = 'gs-discrete-hint-show';
		hintShow.textContent = 'Show';
		const hintHide = document.createElement('span');
		hintHide.className = 'gs-discrete-hint-hide';
		hintHide.textContent = 'Hide';
		hint.appendChild(hintShow);
		hint.appendChild(hintHide);

		if (shouldHide) {
			scoreDisplay.classList.add('gs-discrete-hidden');
		}
		syncOverlayState(wrapper, scoreDisplay);

		scoreElement.innerHTML = '';
		wrapper.appendChild(scoreDisplay);
		wrapper.appendChild(hint);
		scoreElement.appendChild(wrapper);

		// Toggle blur and refresh overlay state
		function onActivate(e) {
			e.preventDefault();
			e.stopPropagation();
			scoreDisplay.classList.toggle('gs-discrete-hidden');
			syncOverlayState(wrapper, scoreDisplay);
		}

		wrapper.addEventListener('click', onActivate);
		wrapper.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				onActivate(e);
			}
		});
	}

	// Process the scores on the page
	function processPage() {
		const url = window.location.href;
		if (url.match(/\/courses\/\d+$/)) {
			const scoreElements = document.querySelectorAll('.submissionStatus--score');
			scoreElements.forEach(el => processScoreElement(el));
		}
	}

	// Initialize extension
	async function init() {
		await loadSettings();
    
		if (!settings.enabled) return;
    
		processPage();
    
		// Watch for live grade updates
		const observer = new MutationObserver((mutations) => {
			clearTimeout(window.gsDiscreteTimeout);
			window.gsDiscreteTimeout = setTimeout(() => {
				if (settings.enabled) processPage();
			}, 100);
		});
		observer.observe(document.body, {childList: true, subtree: true});
	}

 	// Waiting for page to load
 	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
 	} 
	else {
		init();
	}

	// Listen for settings changes
	browser.storage.onChanged.addListener((changes) => {
		if (changes.settings) {
			settings = { ...settings, ...changes.settings.newValue };
			location.reload();
		}
	});
})();