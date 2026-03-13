document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const setupContainer = document.getElementById('setup-container');
    const webviewContainer = document.getElementById('webview-container');
    const mosqueInput = document.getElementById('mosque-input');
    const saveBtn = document.getElementById('save-btn');
    const mosqueFrame = document.getElementById('mosque-frame');
    const findMosqueLink = document.getElementById('find-mosque');
    
    const backBtn = document.getElementById('back-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const refreshBtn = document.getElementById('refresh-btn');

    // Mawaqit Base URL for TV view
    const mawaqitBaseUrl = 'https://mawaqit.net/ar/';
    const tvViewSuffix = '?view=desktop';

    // Format URL from input
    function getMosqueUrl(input) {
        input = input.trim();
        if (!input) return null;

        // If it's already a full URL
        if (input.startsWith('http://') || input.startsWith('https://')) {
            let finalUrl = input;
            if (!finalUrl.includes('?view=') && !finalUrl.includes('&view=')) {
                finalUrl += finalUrl.includes('?') ? '&view=desktop' : '?view=desktop';
            }
            return { url: finalUrl, raw: input };
        }

        // If it's just the mosque ID/name
        return { 
            url: `${mawaqitBaseUrl}${input}${tvViewSuffix}`, 
            raw: input 
        };
    }

    // Load Mosque into frame
    function loadMosque(mosqueData) {
        if (!mosqueData || !mosqueData.url) return;

        mosqueFrame.src = mosqueData.url;
        setupContainer.classList.add('hidden');
        webviewContainer.classList.remove('hidden');
    }

    // Save & View action
    saveBtn.addEventListener('click', async () => {
        const urlData = getMosqueUrl(mosqueInput.value);
        if (urlData) {
            await window.mawaqitAPI.saveMosque(urlData);
            loadMosque(urlData);
        } else {
            mosqueInput.style.borderColor = 'red';
            setTimeout(() => { mosqueInput.style.borderColor = '#2c3e50'; }, 2000);
        }
    });

    mosqueInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveBtn.click();
        }
    });

    // Toolbar actions
    backBtn.addEventListener('click', async () => {
        await window.mawaqitAPI.clearMosque();
        mosqueFrame.src = '';
        webviewContainer.classList.add('hidden');
        setupContainer.classList.remove('hidden');
        mosqueInput.value = '';
    });

    fullscreenBtn.addEventListener('click', async () => {
        await window.mawaqitAPI.toggleFullscreen();
    });

    refreshBtn.addEventListener('click', () => {
        if (mosqueFrame.src) {
            const currentSrc = mosqueFrame.src;
            mosqueFrame.src = '';
            setTimeout(() => { mosqueFrame.src = currentSrc; }, 100);
        }
    });

    // External Links
    findMosqueLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.mawaqitAPI.openExternal('https://mawaqit.net/ar/mosques');
    });

    // Listen for IPC events from main process (e.g. initial load)
    window.mawaqitAPI.onLoadSavedMosque((savedMosque) => {
        if (savedMosque && savedMosque.url) {
            loadMosque(savedMosque);
        }
    });

    window.mawaqitAPI.onResetMosque(() => {
        mosqueFrame.src = '';
        webviewContainer.classList.add('hidden');
        setupContainer.classList.remove('hidden');
    });
});
