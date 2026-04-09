(function() {
	'use strict';

	const storage = browser.storage;

 	// DOM
	const enabledToggle = document.getElementById('enabled-toggle');
	const toggleStatusText = document.getElementById('toggle-status-text');
	const modeSettings = document.getElementById('mode-settings');
	const modeRadios = document.querySelectorAll('input[name="mode"]');
	const thresholdSetting = document.getElementById('threshold-setting');
	const thresholdInput = document.getElementById('threshold-input');
	const apparentToggle = document.getElementById('apparent-toggle');
	const toggleApparentStatusText = document.getElementById('apptoggle-status-text');
	const saveButton = document.getElementById('save-button');

	// Default settings
	const defaultSettings = {
		enabled: true,
		mode: 'always',
		threshold: 70,
		apparent: true
	};

  	// Load settings
	function loadSettings() {
		storage.local.get(['settings'], (result) => {
			const settings = result.settings || defaultSettings;
	  
			// toggle
	  		enabledToggle.checked = settings.enabled !== false;
			updateToggleText(toggleStatusText,enabledToggle.checked);
			updateModeSettingsVisibility(enabledToggle.checked);


	  		apparentToggle.checked = settings.apparent !== false;
			updateToggleText(toggleApparentStatusText,apparentToggle.checked);
	  		
			// radio
			const modeRadio = document.getElementById(`mode-${settings.mode}`);
			if (modeRadio) {
				modeRadio.checked = true;
			}
	  		
			// Set threshold
			thresholdInput.value = settings.threshold;
	  		
			// Threshold visibility
			updateThresholdVisibility(settings.mode);
		});
	}

	// Update threshold visibility
	function updateThresholdVisibility(mode) {
		if (mode === 'threshold') {
			thresholdSetting.classList.remove('disabled');
		}
		else {
			thresholdSetting.classList.add('disabled');
		}
	}

	// Update toggle status text
	function updateToggleText(target,isEnabled) {
		target.textContent = isEnabled ? 'Enabled' : 'Disabled';
	}

	// Update mode settings visibility based on enabled state
	function updateModeSettingsVisibility(isEnabled) {
		if (isEnabled) {
			modeSettings.classList.remove('disabled');
		}
		else {
			modeSettings.classList.add('disabled');
		}
	}

	// Listen for mode changes
	modeRadios.forEach(radio => {
		radio.addEventListener('change', (e) => {
			updateThresholdVisibility(e.target.value);
		});
	});

	// Listen for toggle changes
	enabledToggle.addEventListener('change', (e) => {
		updateToggleText(toggleStatusText,e.target.checked);
		updateModeSettingsVisibility(e.target.checked);
	});

	apparentToggle.addEventListener('change', (e) => {
		updateToggleText(toggleApparentStatusText,e.target.checked);
	});

	function saveSettings() {
		const isEnabled = enabledToggle.checked;
		const isApparent  = apparentToggle.checked;
		const selectedMode = document.querySelector('input[name="mode"]:checked').value;
		const threshold = parseInt(thresholdInput.value, 10);

		// Check threshold
		if (isNaN(threshold) || threshold < 0 || threshold > 100) {
			showStatus('Please enter a valid threshold between 0 and 100', false);
			return;
		}

		const settings = {
			enabled: isEnabled,
			mode: selectedMode,
			threshold: threshold,
			apparent: isApparent
		};

		storage.local.set({ settings }, () => {
			showStatus('Settings saved! Reload Gradescope to apply changes.', true);
		});
	}

	// Listeners
	saveButton.addEventListener('click', saveSettings);

	// Initialize
	loadSettings();
})();