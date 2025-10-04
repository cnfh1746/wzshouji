// ==SillyTavern Extension==
// @name         Mobile Context Monitor with Upload & Editor & Custom API & MesID Floor Monitor
// @version      2.3.0
// @description  实时监控 SillyTavern 上下文变化的移动端插件，带文件上传功能、上下文编辑器、自定义API配置和MesID楼层监听器 v2.3（SillyTavern.getContext() API集成）
// @author       Assistant
// @license      MIT

(function () {
    const extensionName = "waizhishouji-main";
    const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

    const defaultSettings = {
        enabled: true,
        monitorChat: true,
        monitorCharacter: true,
        monitorEvents: true,
        logLevel: 'info',
        maxLogEntries: 100,
        historyLimit: 50,
        monitorInterval: 3000,
        enableEventLogging: true,
        enableContextLogging: true,
        enableAutoSave: false,
        uploadEnabled: true,
        maxUploadSize: 50 * 1024 * 1024,
        showUploadNotifications: true,
        contextEditorEnabled: true,
        customAPIEnabled: true,
        showAPIConfigButton: true,
        mesidFloorEnabled: true,
        floorSelector: '.message',
        enableFloorNotifications: true,
        forumEnabled: true,
        forumAutoUpdate: true,
        forumThreshold: 10,
        forumStyle: '贴吧老哥',
        tavernCompatibilityMode: true,
        hidePhone: false,
    };

    let contextMonitor = null;
    let isInitialized = false;

    async function loadSettings() {
        const { extension_settings } = await import("../../../extensions.js");
        extension_settings[extensionName] = extension_settings[extensionName] || {};
        if (Object.keys(extension_settings[extensionName]).length === 0) {
            Object.assign(extension_settings[extensionName], defaultSettings);
        }
        return extension_settings[extensionName];
    }

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
        console.log('[Mobile Context] Initializing extension...');
        await loadSettings();

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

        initMobileContextPlugin();
    }

    async function initMobileContextPlugin() {
        try {
            await waitForContextMonitor();
            const { extension_settings } = await import("../../../extensions.js");
            contextMonitor = new window.ContextMonitor(extension_settings[extensionName]);
            await waitForAllModules();
            registerConsoleCommands();
            if (extension_settings[extensionName].enabled) {
                contextMonitor.start();
            }
            if (extension_settings[extensionName].uploadEnabled) {
                initUploadFeature();
            }
            if (extension_settings[extensionName].mesidFloorEnabled) {
                initMesIDFloorMonitor();
            }
            initForumFeatures();
            initWeiboFeatures();
            updatePhoneVisibility();
            isInitialized = true;
            console.log('[Mobile Context] v2.4 插件已加载');
        } catch (error) {
            console.error('[Mobile Context] 插件初始化失败:', error);
        }
    }

    function createSettingsUI() {
        const settingsHtml = `
    <div id="mobile_context_settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>外置手机</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="flex-container" style='flex-wrap: wrap;flex-direction: row;'>
                    <label class="checkbox_label" for="mobile_context_enabled">
                        <input id="mobile_context_enabled" type="checkbox" />
                        <span>启用上下文监控</span>
                    </label>
                    <label class="checkbox_label" for="mobile_context_monitor_chat">
                        <input id="mobile_context_monitor_chat" type="checkbox" />
                        <span>监控聊天变化</span>
                    </label>
                    <label class="checkbox_label" for="mobile_context_monitor_character">
                        <input id="mobile_context_monitor_character" type="checkbox" />
                        <span>监控角色变化</span>
                    </label>
                    <label class="checkbox_label" for="mobile_context_monitor_events">
                        <input id="mobile_context_monitor_events" type="checkbox" />
                        <span>监控系统事件</span>
                    </label>
                    <hr style="margin: 15px 0;">
                    <h4>文件上传设置</h4>
                    <label class="checkbox_label" for="mobile_upload_enabled">
                        <input id="mobile_upload_enabled" type="checkbox" />
                        <span>启用文件上传功能</span>
                    </label>
                    <label class="checkbox_label" for="mobile_upload_notifications">
                        <input id="mobile_upload_notifications" type="checkbox" />
                        <span>显示上传通知</span>
                    </label>
                    <hr style="margin: 15px 0;">
                    <h4>上下文编辑器设置</h4>
                    <label class="checkbox_label" for="mobile_context_editor_enabled">
                        <input id="mobile_context_editor_enabled" type="checkbox" />
                        <span>启用上下文编辑器</span>
                    </label>
                    <hr style="margin: 15px 0;">
                    <h4>自定义API配置设置</h4>
                    <label class="checkbox_label" for="mobile_custom_api_enabled">
                        <input id="mobile_custom_api_enabled" type="checkbox" />
                        <span>启用自定义API配置功能</span>
                    </label>
                    <label class="checkbox_label" for="mobile_show_api_config_button">
                        <input id="mobile_show_api_config_button" type="checkbox" />
                        <span>显示API配置按钮</span>
                    </label>
                    <hr style="margin: 15px 0;">
                    <h4>手机交互设置</h4>
                    <label class="checkbox_label" for="mobile_tavern_compatibility_mode">
                        <input id="mobile_tavern_compatibility_mode" type="checkbox" />
                        <span>酒馆页面与手机控制兼容</span>
                    </label>
                    <label class="checkbox_label" for="mobile_hide_phone">
                        <input id="mobile_hide_phone" type="checkbox" />
                        <span>隐藏手机按钮</span>
                    </label>
                    <div class="flex m-t-1" style='flex-wrap: wrap;'>
                        <button id="mobile_context_clear_btn" class="menu_button">清除日志</button>
                        <button id="mobile_custom_api_show_btn" class="menu_button">自定义API配置</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

        $('#extensions_settings').append(settingsHtml);
        bindSettingsControls();
    }

    async function bindSettingsControls() {
        const { extension_settings, saveSettingsDebounced } = await import("../../../extensions.js");
        
        $('#mobile_context_enabled').prop('checked', extension_settings[extensionName].enabled).on('change', function () {
            extension_settings[extensionName].enabled = $(this).prop('checked');
            saveSettingsDebounced();
            if (contextMonitor) {
                if (extension_settings[extensionName].enabled) contextMonitor.start();
                else contextMonitor.stop();
            }
        });
        $('#mobile_context_monitor_chat').prop('checked', extension_settings[extensionName].monitorChat).on('change', function () {
            extension_settings[extensionName].monitorChat = $(this).prop('checked');
            saveSettingsDebounced();
            if (contextMonitor) contextMonitor.updateSettings(extension_settings[extensionName]);
        });
        $('#mobile_context_monitor_character').prop('checked', extension_settings[extensionName].monitorCharacter).on('change', function () {
            extension_settings[extensionName].monitorCharacter = $(this).prop('checked');
            saveSettingsDebounced();
            if (contextMonitor) contextMonitor.updateSettings(extension_settings[extensionName]);
        });
        $('#mobile_context_monitor_events').prop('checked', extension_settings[extensionName].monitorEvents).on('change', function () {
            extension_settings[extensionName].monitorEvents = $(this).prop('checked');
            saveSettingsDebounced();
            if (contextMonitor) contextMonitor.updateSettings(extension_settings[extensionName]);
        });
        $('#mobile_upload_enabled').prop('checked', extension_settings[extensionName].uploadEnabled).on('change', function () {
            extension_settings[extensionName].uploadEnabled = $(this).prop('checked');
            saveSettingsDebounced();
            const uploadButton = document.getElementById('mobile-upload-trigger');
            if (uploadButton) uploadButton.style.display = extension_settings[extensionName].uploadEnabled ? 'flex' : 'none';
        });
        $('#mobile_upload_notifications').prop('checked', extension_settings[extensionName].showUploadNotifications).on('change', function () {
            extension_settings[extensionName].showUploadNotifications = $(this).prop('checked');
            saveSettingsDebounced();
        });
        $('#mobile_context_editor_enabled').prop('checked', extension_settings[extensionName].contextEditorEnabled).on('change', function () {
            extension_settings[extensionName].contextEditorEnabled = $(this).prop('checked');
            saveSettingsDebounced();
            const editorButton = document.getElementById('mobile-context-editor-btn');
            if (editorButton) editorButton.style.display = extension_settings[extensionName].contextEditorEnabled ? 'flex' : 'none';
        });
        $('#mobile_custom_api_enabled').prop('checked', extension_settings[extensionName].customAPIEnabled).on('change', function () {
            extension_settings[extensionName].customAPIEnabled = $(this).prop('checked');
            saveSettingsDebounced();
            const apiButton = document.getElementById('mobile-api-config-trigger');
            if (apiButton) apiButton.style.display = extension_settings[extensionName].customAPIEnabled ? 'flex' : 'none';
        });
        $('#mobile_show_api_config_button').prop('checked', extension_settings[extensionName].showAPIConfigButton).on('change', function () {
            extension_settings[extensionName].showAPIConfigButton = $(this).prop('checked');
            saveSettingsDebounced();
            const apiButton = document.getElementById('mobile-api-config-trigger');
            if (apiButton) apiButton.style.display = extension_settings[extensionName].customAPIEnabled && extension_settings[extensionName].showAPIConfigButton ? 'flex' : 'none';
        });
        $('#mobile_tavern_compatibility_mode').prop('checked', extension_settings[extensionName].tavernCompatibilityMode).on('change', function () {
            extension_settings[extensionName].tavernCompatibilityMode = $(this).prop('checked');
            saveSettingsDebounced();
            updatePointerEventsSettings();
        });
        $('#mobile_hide_phone').prop('checked', extension_settings[extensionName].hidePhone).on('change', function () {
            extension_settings[extensionName].hidePhone = $(this).prop('checked');
            saveSettingsDebounced();
            updatePhoneVisibility();
        });
        $('#mobile_context_clear_btn').on('click', () => { if (contextMonitor) contextMonitor.clearLogs(); });
        $('#mobile_custom_api_show_btn').on('click', () => { if (window.mobileCustomAPIConfig) window.mobileCustomAPIConfig.showConfigPanel(); });
    }

    function waitForContextMonitor() {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if (window.ContextMonitor) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    function waitForAllModules() {
        return new Promise(resolve => {
            const checkModules = () => {
                if (window.mobileContextEditor && window.mobileCustomAPIConfig && window.mobileUploadManager && window.mesidFloorMonitor && window.forumStyles && window.forumAutoListener && window.forumManager && window.voiceMessageHandler) {
                    console.log('[Mobile Context] ✅ 所有模块加载完成');
                    resolve();
                } else {
                    setTimeout(checkModules, 200);
                }
            };
            checkModules();
        });
    }

    function registerConsoleCommands() {
        window.MobileContext = { ...window.MobileContext, ...getConsoleCommands() };
    }

    function getConsoleCommands() {
        return {
            getContext: () => contextMonitor ? contextMonitor.getCurrentContext() : null,
            getHistory: (limit = 10) => contextMonitor ? contextMonitor.getHistory(limit) : [],
            getStats: () => contextMonitor ? contextMonitor.getStats() : null,
            showStatus: () => { if (contextMonitor) contextMonitor.showStatus(); },
            start: () => { if (contextMonitor) contextMonitor.start(); },
            stop: () => { if (contextMonitor) contextMonitor.stop(); },
            getChatJsonl: async () => contextMonitor ? await contextMonitor.getCurrentChatJsonl() : null,
            getChatMessages: async () => contextMonitor ? await contextMonitor.getCurrentChatMessages() : null,
            downloadChatJsonl: async () => {
                const chatData = await MobileContext.getChatJsonl();
                if (chatData) {
                    const blob = new Blob([chatData.jsonlData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${chatData.chatId}.jsonl`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            },
            setLogLevel: (level) => { if (contextMonitor) contextMonitor.setLogLevel(level); },
            clearLogs: () => { if (contextMonitor) contextMonitor.clearLogs(); },
            listFormats: () => contextMonitor ? contextMonitor.listExtractorFormats() : [],
            extractFromChat: async (formatName) => contextMonitor ? await contextMonitor.extractFromCurrentChat(formatName) : null,
            extractFromJsonl: async (formatName) => contextMonitor ? await contextMonitor.extractFromCurrentChatJsonl(formatName) : null,
            extractFromText: (text, formatName) => contextMonitor ? contextMonitor.extractDataFromText(text, formatName) : [],
            addFormat: (name, regex, fields, description) => contextMonitor ? contextMonitor.addExtractorFormat(name, { regex, fields, description }) : false,
            quickExtract: async (formatName, useJsonl = false) => {
                const result = useJsonl ? await MobileContext.extractFromJsonl(formatName) : await MobileContext.extractFromChat(formatName);
                console.log(result && result.extractedCount > 0 ? result : '未找到匹配的数据');
                return result;
            },
            debugChatData: async () => { if (contextMonitor) await contextMonitor.debugChatData(); },
            debugJsonlData: async () => { if (contextMonitor) await contextMonitor.debugJsonlData(); },
            showContextEditor: () => { if (window.mobileContextEditor) window.mobileContextEditor.showEditor(); },
            forceShowEditor: () => { if (window.mobileContextEditor) window.mobileContextEditor.forceInitialize(); },
            loadChatToEditor: () => window.mobileContextEditor ? window.mobileContextEditor.getCurrentChatData() : null,
            modifyMessage: async (index, content, name) => window.mobileContextEditor ? await window.mobileContextEditor.modifyMessage(index, content, name) : false,
            addMessage: async (content, isUser, name) => window.mobileContextEditor ? await window.mobileContextEditor.addMessage(content, isUser, name) : -1,
            deleteMessage: async (index) => window.mobileContextEditor ? await window.mobileContextEditor.deleteMessage(index) : null,
            saveEditedChat: async () => window.mobileContextEditor ? await window.mobileContextEditor.saveChatData() : false,
            refreshChatDisplay: async () => window.mobileContextEditor ? await window.mobileContextEditor.refreshChatDisplay() : false,
            exportEditedJsonl: () => window.mobileContextEditor ? window.mobileContextEditor.exportToJsonl() : null,
            getEditorStats: () => window.mobileContextEditor ? window.mobileContextEditor.getStatistics() : null,
            debugSillyTavernStatus: () => window.mobileContextEditor ? window.mobileContextEditor.debugSillyTavernStatus() : null,
            waitForSillyTavernReady: async (timeout = 30000) => window.mobileContextEditor ? await window.mobileContextEditor.waitForSillyTavernReady(timeout) : false,
            showAPIConfig: () => { if (window.mobileCustomAPIConfig) window.mobileCustomAPIConfig.showConfigPanel(); },
            getAPIConfig: () => window.mobileCustomAPIConfig ? window.mobileCustomAPIConfig.getCurrentConfig() : null,
            isAPIAvailable: () => window.mobileCustomAPIConfig ? window.mobileCustomAPIConfig.isAPIAvailable() : false,
            testAPIConnection: async () => { try { await window.mobileCustomAPIConfig.testConnection(); return true; } catch { return false; } },
            callCustomAPI: async (messages, options = {}) => window.mobileCustomAPIConfig ? await window.mobileCustomAPIConfig.callAPI(messages, options) : null,
            getSupportedProviders: () => window.mobileCustomAPIConfig ? Object.keys(window.mobileCustomAPIConfig.supportedProviders) : [],
            getAPIDebugInfo: () => window.mobileCustomAPIConfig ? window.mobileCustomAPIConfig.getDebugInfo() : null,
            quickSetupAPI: (apiUrl, apiKey, model) => {
                if (window.mobileCustomAPIConfig) {
                    window.mobileCustomAPIConfig.currentSettings = { ...window.mobileCustomAPIConfig.currentSettings, enabled: true, provider: 'custom', apiUrl, apiKey: apiKey || '', model };
                    window.mobileCustomAPIConfig.saveSettings();
                    return true;
                }
                return false;
            },
            debugAPIConfig: () => { if (window.mobileCustomAPIConfig) window.mobileCustomAPIConfig.debugConfig(); },
            debugModuleStatus: () => { /* ... */ },
            smartLoadChat: async () => { /* ... */ },
            startFloorMonitor: () => { if (window.mesidFloorMonitor) window.mesidFloorMonitor.start(); return !!window.mesidFloorMonitor; },
            stopFloorMonitor: () => { if (window.mesidFloorMonitor) window.mesidFloorMonitor.stop(); return !!window.mesidFloorMonitor; },
            getFloorStatus: () => window.mesidFloorMonitor ? window.mesidFloorMonitor.getStatus() : null,
            getFloorDebugInfo: () => window.mesidFloorMonitor ? window.mesidFloorMonitor.getDebugInfo() : null,
            forceCheckFloor: () => { if (window.mesidFloorMonitor) window.mesidFloorMonitor.forceCheck(); return !!window.mesidFloorMonitor; },
            setFloorSelector: (selector) => { if (window.mesidFloorMonitor) window.mesidFloorMonitor.setFloorSelector(selector); return !!window.mesidFloorMonitor; },
            addFloorListener: (event, callback) => window.mesidFloorMonitor ? window.mesidFloorMonitor.addEventListener(event, callback) : false,
            removeFloorListener: (event, callback) => window.mesidFloorMonitor ? window.mesidFloorMonitor.removeEventListener(event, callback) : false,
            quickSetupFloorMonitor: (selector = '.message') => { /* ... */ },
            testFloorMonitor: () => { /* ... */ },
            showForumPanel: () => { if (window.forumManager) window.forumManager.showForumPanel(); },
            generateForum: () => { if (window.forumManager) window.forumManager.generateForumContent(); },
            clearForum: () => { if (window.forumManager) window.forumManager.clearForumContent(); },
            getForumStatus: () => window.forumManager ? { isInitialized: window.forumManager.isInitialized, isProcessing: window.forumManager.isProcessing, settings: window.forumManager.currentSettings, lastProcessedCount: window.forumManager.lastProcessedCount } : null,
            setForumStyle: (styleName) => { if (window.forumManager) { window.forumManager.currentSettings.selectedStyle = styleName; window.forumManager.saveSettings(); return true; } return false; },
            setForumThreshold: (threshold) => { if (window.forumManager) { window.forumManager.currentSettings.threshold = threshold; window.forumManager.saveSettings(); return true; } return false; },
            toggleForumAutoUpdate: () => { if (window.forumManager) { window.forumManager.currentSettings.autoUpdate = !window.forumManager.currentSettings.autoUpdate; window.forumManager.saveSettings(); return window.forumManager.currentSettings.autoUpdate; } return false; },
            getForumStyles: () => window.forumStyles ? window.forumStyles.getAvailableStyles() : [],
            startForumListener: () => { if (window.forumAutoListener) window.forumAutoListener.start(); return !!window.forumAutoListener; },
            stopForumListener: () => { if (window.forumAutoListener) window.forumAutoListener.stop(); return !!window.forumAutoListener; },
            getForumListenerStatus: () => window.forumAutoListener ? window.forumAutoListener.getStatus() : null,
            debugForumFeatures: () => { /* ... */ },
            setForumPrefix: (text) => { if (window.forumStyles) window.forumStyles.setCustomPrefix(text); },
            getForumPrefix: () => window.forumStyles ? window.forumStyles.getCustomPrefix() : null,
            clearForumPrefix: () => { if (window.forumStyles) window.forumStyles.clearCustomPrefix(); },
            previewForumPrompt: (styleName = '贴吧老哥') => window.forumStyles ? window.forumStyles.previewStyleWithPrefix(styleName) : null,
            getForumPrefixStatus: () => window.forumStyles ? window.forumStyles.getPrefixStatus() : null,
            getGlobalForumPrefix: () => window.forumStyles ? window.forumStyles.getGlobalBackendPrefix() : null,
            hasGlobalForumPrefix: () => window.forumStyles ? window.forumStyles.hasGlobalBackendPrefix() : false,
            getFullForumPrefixPreview: () => window.forumStyles ? window.forumStyles.getFullPrefixPreview() : null,
            getForumPrefixPriority: () => window.forumStyles ? window.forumStyles.getPrefixPriorityInfo() : null,
            previewFullForumPrompt: (styleName = '贴吧老哥') => window.forumStyles ? window.forumStyles.previewStyleWithPrefix(styleName) : null,
        };
    }

    function initUploadFeature() {
        document.addEventListener('mobile-upload-complete', function (event) {
            const detail = event.detail;
            if (contextMonitor && contextMonitor.log) {
                contextMonitor.log('info', `文件上传: ${detail.originalFilename} (${(detail.size / 1024).toFixed(1)} KB)`);
            }
        });
    }

    async function initMesIDFloorMonitor() {
        await waitForAllModules();
        if (window.mesidFloorMonitor) {
            const { extension_settings } = await import("../../../extensions.js");
            if (extension_settings[extensionName].floorSelector) {
                window.mesidFloorMonitor.setFloorSelector(extension_settings[extensionName].floorSelector);
            }
            if (extension_settings[extensionName].enableFloorNotifications) {
                window.mesidFloorMonitor.addEventListener('onFloorAdded', (data) => contextMonitor.log('info', `楼层增加: ${data.oldCount} -> ${data.newCount}`));
                window.mesidFloorMonitor.addEventListener('onFloorRemoved', (data) => contextMonitor.log('info', `楼层减少: ${data.oldCount} -> ${data.newCount}`));
            }
            window.mesidFloorMonitor.start();
        }
    }

    async function initForumFeatures() {
        await waitForAllModules();
        if (window.forumManager) {
            await window.forumManager.initialize();
            if (window.forumAutoListener) window.forumAutoListener.start();
            if (contextMonitor) contextMonitor.log('info', '论坛管理器已启动');
        }
    }

    async function initWeiboFeatures() {
        await waitForAllModules();
        if (window.weiboManager) {
            await window.weiboManager.initialize();
            if (window.weiboAutoListener) window.weiboAutoListener.start();
            if (contextMonitor) contextMonitor.log('info', '微博管理器已启动');
        }
    }

    async function updatePhoneVisibility() {
        const phoneTrigger = document.getElementById('mobile-phone-trigger');
        if (phoneTrigger) {
            const { extension_settings } = await import("../../../extensions.js");
            phoneTrigger.style.display = extension_settings[extensionName].hidePhone ? 'none' : 'block';
        }
    }
    
    function updatePointerEventsSettings() {
        const container = document.querySelector('.mobile-phone-container');
        const frame = document.querySelector('.mobile-phone-frame');
        if(container && frame){
            const { extension_settings } = SillyTavern.extensions.get();
            container.style.pointerEvents = extension_settings[extensionName].tavernCompatibilityMode ? 'none' : 'auto';
            frame.style.pointerEvents = 'auto';
        }
    }

    window.SillyTavern.registerExtension({
        name: 'waizhishouji-main',
        init: init,
        settings: function () {
            createSettingsUI();
            return "";
        }
    });

})();
