import {
    eventSource,
    event_types,
    extension_settings,
    renderExtensionTemplateAsync,
    saveSettingsDebounced,
} from '../../../extensions.js';

const extensionName = "waizhishouji-main";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function init() {
    const settingsHtml = await renderExtensionTemplateAsync(extensionName, 'settings.html');
    $('#extensions_settings').append(settingsHtml);

    const scripts = [
        `${extensionFolderPath}/performance-config.js`,
        `${extensionFolderPath}/optimized-loader.js`,
        `${extensionFolderPath}/performance-test.js`,
        `${extensionFolderPath}/diagnostic-tool.js`,
        `${extensionFolderPath}/context-monitor.js`,
        `${extensionFolderPath}/mobile-upload.js`,
        `${extensionFolderPath}/mobile-phone.js`,
        `${extensionFolderPath}/context-editor.js`,
        `${extensionFolderPath}/custom-api-config.js`,
        `${extensionFolderPath}/mesid-floor-monitor.js`,
        `${extensionFolderPath}/app/weibo-app/weibo-manager.js`,
        `${extensionFolderPath}/app/forum-app/forum-manager.js`,
        `${extensionFolderPath}/app/weibo-app/weibo-auto-listener.js`,
        `${extensionFolderPath}/app/forum-app/forum-auto-listener.js`,
        `${extensionFolderPath}/app/voice-message-handler.js`,
        `${extensionFolderPath}/app/image-config-modal.js`,
    ];

    for (const script of scripts) {
        try {
            await loadScript(script);
            console.log(`[Mobile Context] Loaded ${script}`);
        } catch (error) {
            console.error(`[Mobile Context] Failed to load ${script}`, error);
        }
    }

    const styles = [
        `${extensionFolderPath}/mobile-phone.css`,
        `${extensionFolderPath}/app/image-config-modal.css`,
    ];

    styles.forEach(styleUrl => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = styleUrl;
        document.head.appendChild(link);
    });

    // Bind settings controls after UI is loaded
    // ...
}

jQuery(async () => {
    await init();
});
