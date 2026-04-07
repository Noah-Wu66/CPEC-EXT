// ==UserScript==
// @name         央视频 AI 视频分析助手
// @namespace    http://tampermonkey.net/
// @version      1.2.2
// @description  使用 Qwen3.5-Omni / MiMo-V2-Omni 模型分析央视频视频内容，支持浅色/深色/跟随系统主题
// @author       CPEC
// @match        https://yangshipin.cn/video/*
// @match        https://www.yangshipin.cn/video/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      dashscope.aliyuncs.com
// @connect      zenmux.ai
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/Noah-Wu66/CPEC-EXT/main/yangshipin-ai-analyzer.user.js
// @downloadURL  https://raw.githubusercontent.com/Noah-Wu66/CPEC-EXT/main/yangshipin-ai-analyzer.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ============ 模型配置 ============
    const MODELS = {
        'qwen3.5-omni-plus': {
            name: 'Qwen3.5-Omni',
            apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            model: 'qwen3.5-omni-plus',
            keyName: 'dashscope_api_key',
            keyLabel: 'DashScope API Key（阿里云百炼）',
            authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
            // Qwen 需要 modalities 和 stream_options
            buildBody: (messages) => ({
                model: 'qwen3.5-omni-plus',
                messages,
                stream: true,
                stream_options: { include_usage: true },
                modalities: ['text']
            })
        },
        'mimo-v2-omni': {
            name: 'MiMo-V2-Omni',
            apiBase: 'https://zenmux.ai/api/v1/chat/completions',
            model: 'xiaomi/mimo-v2-omni',
            keyName: 'zenmux_api_key',
            keyLabel: 'ZenMux API Key',
            authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
            buildBody: (messages) => ({
                model: 'xiaomi/mimo-v2-omni',
                messages,
                stream: true
            })
        }
    };

    // ============ 当前模型 & API Key 管理 ============
    function getCurrentModelId() {
        return GM_getValue('current_model', 'qwen3.5-omni-plus');
    }

    function setCurrentModelId(id) {
        GM_setValue('current_model', id);
    }

    function getCurrentModel() {
        return MODELS[getCurrentModelId()];
    }

    function getApiKey(modelId) {
        const m = MODELS[modelId || getCurrentModelId()];
        return GM_getValue(m.keyName, '');
    }

    function setApiKey(modelId, key) {
        const m = MODELS[modelId || getCurrentModelId()];
        GM_setValue(m.keyName, key);
    }

    GM_registerMenuCommand('设置 DashScope API Key (Qwen)', () => {
        const current = getApiKey('qwen3.5-omni-plus');
        const key = prompt('请输入阿里云百炼 DashScope API Key:', current);
        if (key !== null) {
            setApiKey('qwen3.5-omni-plus', key.trim());
            alert('DashScope API Key 已保存');
        }
    });

    GM_registerMenuCommand('设置 ZenMux API Key (MiMo)', () => {
        const current = getApiKey('mimo-v2-omni');
        const key = prompt('请输入 ZenMux API Key:', current);
        if (key !== null) {
            setApiKey('mimo-v2-omni', key.trim());
            alert('ZenMux API Key 已保存');
        }
    });

    // ============ 样式 ============
    const STYLES = `
        .ysp-ai-panel[data-theme="dark"] {
            --bg: rgba(18, 18, 32, 0.92);
            --bg-secondary: rgba(255,255,255,0.06);
            --bg-hover: rgba(255,255,255,0.1);
            --bg-input: rgba(0,0,0,0.35);
            --border: rgba(255,255,255,0.08);
            --border-hover: rgba(255,255,255,0.15);
            --text: #eaeaea;
            --text-secondary: #b0b0b0;
            --text-muted: #707070;
            --shadow: 0 12px 48px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3);
            --scrollbar: rgba(255,255,255,0.12);
            --accent: #e63946;
            --accent-soft: rgba(230,57,70,0.12);
            --accent-border: rgba(230,57,70,0.25);
            --success: #4caf50;
            --error: #ff6b6b;
            --error-bg: rgba(255,107,107,0.08);
            --divider: rgba(255,255,255,0.06);
        }
        .ysp-ai-panel[data-theme="light"] {
            --bg: rgba(255, 255, 255, 0.92);
            --bg-secondary: rgba(0,0,0,0.03);
            --bg-hover: rgba(0,0,0,0.06);
            --bg-input: rgba(245,245,250,1);
            --border: rgba(0,0,0,0.08);
            --border-hover: rgba(0,0,0,0.15);
            --text: #1a1a2e;
            --text-secondary: #555;
            --text-muted: #999;
            --shadow: 0 12px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
            --scrollbar: rgba(0,0,0,0.15);
            --accent: #d62839;
            --accent-soft: rgba(214,40,57,0.08);
            --accent-border: rgba(214,40,57,0.2);
            --success: #2e7d32;
            --error: #d32f2f;
            --error-bg: rgba(211,47,47,0.06);
            --divider: rgba(0,0,0,0.06);
        }
        .ysp-ai-panel {
            position: fixed;
            right: 20px;
            top: 80px;
            width: 420px;
            max-height: 80vh;
            background: var(--bg);
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid var(--border);
            border-radius: 16px;
            box-shadow: var(--shadow);
            z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
            color: var(--text);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                        width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                        box-shadow 0.3s ease;
        }
        .ysp-ai-panel.collapsed {
            max-height: 48px;
            width: 260px;
        }

        /* ---- Header ---- */
        .ysp-ai-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: linear-gradient(135deg, #e63946 0%, #c1121f 100%);
            cursor: move;
            user-select: none;
            flex-shrink: 0;
            position: relative;
        }
        .ysp-ai-header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
        }
        .ysp-ai-header-title {
            font-size: 14px;
            font-weight: 600;
            color: #fff;
            letter-spacing: 0.3px;
        }
        .ysp-ai-header-btns {
            display: flex;
            gap: 5px;
            align-items: center;
        }
        .ysp-ai-header-btn, .ysp-ai-theme-btn {
            background: rgba(255,255,255,0.18);
            border: none;
            color: rgba(255,255,255,0.9);
            width: 26px;
            height: 26px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, transform 0.15s;
        }
        .ysp-ai-header-btn:hover, .ysp-ai-theme-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: scale(1.05);
        }
        .ysp-ai-theme-btn.active {
            background: rgba(255,255,255,0.4);
            color: #fff;
        }

        /* ---- Separator between theme and window btns ---- */
        .ysp-ai-header-sep {
            width: 1px;
            height: 16px;
            background: rgba(255,255,255,0.25);
            margin: 0 3px;
        }

        /* ---- Body ---- */
        .ysp-ai-body {
            padding: 16px;
            overflow-y: auto;
            flex: 1;
            min-height: 0;
        }
        .ysp-ai-panel.collapsed .ysp-ai-body {
            display: none;
        }

        /* ---- Result sections ---- */
        .ysp-ai-section {
            margin-bottom: 16px;
            animation: ysp-fadeIn 0.3s ease;
        }
        @keyframes ysp-fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .ysp-ai-section-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--accent);
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .ysp-ai-section-content {
            font-size: 13px;
            line-height: 1.75;
            color: var(--text-secondary);
            white-space: pre-wrap;
            word-break: break-word;
        }

        /* ---- Timeline item ---- */
        .ysp-ai-timeline-item {
            display: flex;
            gap: 10px;
            margin-bottom: 8px;
            padding: 6px 8px;
            border-radius: 8px;
            transition: background 0.2s;
        }
        .ysp-ai-timeline-item:hover {
            background: var(--bg-secondary);
        }
        .ysp-ai-timeline-time {
            color: var(--accent);
            font-weight: 600;
            font-size: 12px;
            white-space: nowrap;
            min-width: 90px;
            padding-top: 1px;
            font-variant-numeric: tabular-nums;
        }
        .ysp-ai-timeline-text {
            color: var(--text-secondary);
            font-size: 13px;
            line-height: 1.6;
        }

        /* ---- Tags ---- */
        .ysp-ai-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .ysp-ai-tag {
            background: var(--accent-soft);
            color: var(--accent);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            border: 1px solid var(--accent-border);
            transition: all 0.2s;
        }
        .ysp-ai-tag:hover {
            background: var(--accent-border);
        }

        /* ---- Action button ---- */
        .ysp-ai-btn {
            width: 100%;
            padding: 11px;
            background: linear-gradient(135deg, #e63946, #c1121f);
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
            letter-spacing: 0.3px;
        }
        .ysp-ai-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(230,57,70,0.35);
        }
        .ysp-ai-btn:active:not(:disabled) {
            transform: translateY(0);
        }
        .ysp-ai-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }

        /* ---- Video info ---- */
        .ysp-ai-video-info {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 14px;
            font-size: 12px;
            color: var(--text-secondary);
            line-height: 1.8;
        }
        .ysp-ai-video-info strong {
            color: var(--text);
        }

        /* ---- Loading ---- */
        .ysp-ai-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 24px;
            color: var(--text-muted);
            font-size: 13px;
        }
        .ysp-ai-spinner {
            width: 20px;
            height: 20px;
            border: 2.5px solid var(--accent-border);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: ysp-spin 0.75s linear infinite;
        }
        @keyframes ysp-spin {
            to { transform: rotate(360deg); }
        }

        /* ---- Error ---- */
        .ysp-ai-error {
            color: var(--error);
            background: var(--error-bg);
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 12px;
            margin-top: 10px;
            border: 1px solid rgba(255,107,107,0.15);
            line-height: 1.6;
        }

        /* ---- Trigger button ---- */
        .ysp-ai-trigger {
            position: fixed;
            right: 20px;
            top: 80px;
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #e63946, #c1121f);
            border: none;
            border-radius: 50%;
            color: #fff;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            z-index: 99998;
            box-shadow: 0 4px 20px rgba(230,57,70,0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .ysp-ai-trigger:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 28px rgba(230,57,70,0.55);
        }

        /* ---- Scrollbar ---- */
        .ysp-ai-body::-webkit-scrollbar {
            width: 5px;
        }
        .ysp-ai-body::-webkit-scrollbar-track {
            background: transparent;
        }
        .ysp-ai-body::-webkit-scrollbar-thumb {
            background: var(--scrollbar);
            border-radius: 3px;
        }

        /* ---- Model switcher ---- */
        .ysp-ai-model-switcher {
            display: flex;
            gap: 0;
            margin-bottom: 12px;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--border);
        }
        .ysp-ai-model-opt {
            flex: 1;
            padding: 9px 6px;
            background: var(--bg-secondary);
            color: var(--text-muted);
            border: none;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
        }
        .ysp-ai-model-opt:first-child {
            border-right: 1px solid var(--border);
        }
        .ysp-ai-model-opt:hover {
            background: var(--bg-hover);
            color: var(--text-secondary);
        }
        .ysp-ai-model-opt.active {
            background: var(--accent-soft);
            color: var(--accent);
            font-weight: 600;
        }
        .ysp-ai-key-status {
            font-size: 11px;
            margin-top: 3px;
        }

        /* ---- Key config ---- */
        .ysp-ai-key-config {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 12px;
        }
        .ysp-ai-key-input {
            width: 100%;
            padding: 8px 10px;
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text);
            font-size: 12px;
            margin-top: 6px;
            font-family: "SF Mono", "Cascadia Code", "Consolas", monospace;
            transition: border-color 0.2s, box-shadow 0.2s;
            box-sizing: border-box;
        }
        .ysp-ai-key-input:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px var(--accent-soft);
        }
        .ysp-ai-key-label {
            font-size: 12px;
            color: var(--text-muted);
        }
        .ysp-ai-key-save {
            margin-top: 8px;
            padding: 6px 14px;
            background: var(--accent-soft);
            color: var(--accent);
            border: 1px solid var(--accent-border);
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        .ysp-ai-key-save:hover {
            background: var(--accent-border);
        }
    `;

    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = STYLES;
        document.head.appendChild(style);
    }

    // ============ 视频信息提取 ============
    function getVideoInfo() {
        const info = { title: '', videoUrl: '', description: '', vid: '', duration: '' };

        // 从 URL 提取 vid
        const urlParams = new URLSearchParams(window.location.search);
        info.vid = urlParams.get('vid') || '';

        // 提取标题
        const titleEl = document.querySelector('.video-main-l-title .title');
        if (titleEl) {
            info.title = titleEl.textContent.trim();
        }

        // 提取简介
        const introEls = document.querySelectorAll('.video-main-l-intro div');
        if (introEls.length >= 2) {
            info.description = introEls[1].textContent.trim();
        }

        // 提取视频 URL — 从 video 元素的 src
        const videoEl = document.querySelector('video[id^="myvideo"]');
        if (videoEl && videoEl.src) {
            info.videoUrl = videoEl.src;
        }

        // 提取时长
        if (videoEl && videoEl.duration && isFinite(videoEl.duration)) {
            const d = videoEl.duration;
            const m = Math.floor(d / 60);
            const s = Math.floor(d % 60);
            info.duration = `${m}:${s.toString().padStart(2, '0')}`;
        } else {
            // 从控件文字提取
            const timeR = document.querySelector('.time-r');
            if (timeR) {
                info.duration = timeR.textContent.replace('/', '').trim();
            }
        }

        return info;
    }

    // ============ API 调用（通用） ============
    function callModel(videoUrl, title, description, onDone, onError) {
        const modelId = getCurrentModelId();
        const modelCfg = MODELS[modelId];
        const apiKey = getApiKey(modelId);
        if (!apiKey) {
            onError(`请先在面板中设置 ${modelCfg.keyLabel}`);
            return;
        }

        const systemPrompt = `你是一个专业的视频内容分析助手。请分析用户提供的视频，并严格按照以下 JSON 格式输出，不要输出任何其他内容：

{
  "timeline": [
    {"time": "00:00-00:30", "content": "时间段内的内容描述"},
    {"time": "00:30-01:00", "content": "时间段内的内容描述"}
  ],
  "summary": "视频的整体总结，200字以内",
  "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
}

要求：
1. timeline（时间线）：按视频时间顺序，划分出主要内容段落，每段标注时间范围和该段的核心内容
2. summary（总结）：简明扼要地概括视频的主题、核心观点和关键信息
3. tags（标签）：提取5-8个最能代表视频内容的关键词标签

请只输出 JSON，不要有任何额外文字。`;

        const userContent = [
            {
                type: 'video_url',
                video_url: { url: videoUrl }
            },
            {
                type: 'text',
                text: `请分析这个视频。视频标题：「${title}」${description ? '，简介：' + description : ''}`
            }
        ];

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
        ];

        const body = JSON.stringify(modelCfg.buildBody(messages));

        GM_xmlhttpRequest({
            method: 'POST',
            url: modelCfg.apiBase,
            headers: {
                'Content-Type': 'application/json',
                ...modelCfg.authHeader(apiKey)
            },
            data: body,
            onload(res) {
                if (res.status !== 200) {
                    try {
                        const errData = JSON.parse(res.responseText);
                        onError(`API 错误 (${res.status}): ${errData.error?.message || res.responseText}`);
                    } catch {
                        onError(`API 错误 (${res.status}): ${res.responseText}`);
                    }
                    return;
                }

                // Parse SSE response
                const lines = res.responseText.split('\n');
                let fullText = '';
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.choices && parsed.choices.length > 0) {
                            const delta = parsed.choices[0].delta;
                            if (delta && delta.content) {
                                fullText += delta.content;
                            }
                        }
                    } catch (e) {
                        // skip unparseable chunks
                    }
                }
                onDone(fullText);
            },
            onerror(err) {
                onError(`网络错误: ${err.error || '请检查网络连接'}`);
            },
            ontimeout() {
                onError('请求超时，视频可能过长，请稍后重试');
            },
            timeout: 300000 // 5 minutes for long videos
        });
    }

    // ============ 解析模型输出 ============
    function parseModelOutput(text) {
        // Try to extract JSON from the response
        let jsonStr = text.trim();

        // Remove markdown code block wrapper if present
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        // Try to find JSON object
        const braceStart = jsonStr.indexOf('{');
        const braceEnd = jsonStr.lastIndexOf('}');
        if (braceStart !== -1 && braceEnd !== -1) {
            jsonStr = jsonStr.substring(braceStart, braceEnd + 1);
        }

        try {
            const data = JSON.parse(jsonStr);
            return {
                timeline: data.timeline || [],
                summary: data.summary || '',
                tags: data.tags || []
            };
        } catch (e) {
            // Fallback: display raw text
            return {
                timeline: [],
                summary: text,
                tags: [],
                raw: true
            };
        }
    }

    // ============ 主题管理 ============
    function getTheme() {
        return GM_getValue('theme', 'auto');
    }

    function setTheme(theme) {
        GM_setValue('theme', theme);
    }

    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function getEffectiveTheme() {
        const pref = getTheme();
        return pref === 'auto' ? getSystemTheme() : pref;
    }

    function applyTheme() {
        if (!panelEl) return;
        const effectiveTheme = getEffectiveTheme();
        panelEl.setAttribute('data-theme', effectiveTheme);
    }

    // ============ UI ============
    let panelVisible = false;
    let panelEl = null;
    let triggerBtn = null;

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (getTheme() === 'auto') {
            applyTheme();
        }
    });

    function createTriggerButton() {
        triggerBtn = document.createElement('button');
        triggerBtn.className = 'ysp-ai-trigger';
        triggerBtn.title = 'AI 视频分析';
        triggerBtn.innerHTML = 'AI';
        triggerBtn.addEventListener('click', togglePanel);
        document.body.appendChild(triggerBtn);
    }

    function togglePanel() {
        if (panelVisible) {
            if (panelEl) panelEl.remove();
            panelEl = null;
            panelVisible = false;
            triggerBtn.style.display = '';
        } else {
            createPanel();
            panelVisible = true;
            triggerBtn.style.display = 'none';
        }
    }

    function createPanel() {
        panelEl = document.createElement('div');
        panelEl.className = 'ysp-ai-panel';

        const videoInfo = getVideoInfo();

        const curModelId = getCurrentModelId();

        const currentTheme = getTheme();

        panelEl.innerHTML = `
            <div class="ysp-ai-header">
                <span class="ysp-ai-header-title">AI 视频分析助手</span>
                <div class="ysp-ai-header-btns">
                    <button class="ysp-ai-theme-btn ${currentTheme === 'light' ? 'active' : ''}" data-theme="light" title="浅色">&#9728;</button>
                    <button class="ysp-ai-theme-btn ${currentTheme === 'dark' ? 'active' : ''}" data-theme="dark" title="深色">&#9790;</button>
                    <button class="ysp-ai-theme-btn ${currentTheme === 'auto' ? 'active' : ''}" data-theme="auto" title="跟随系统">&#9684;</button>
                    <span class="ysp-ai-header-sep"></span>
                    <button class="ysp-ai-header-btn" id="ysp-ai-collapse" title="折叠">&minus;</button>
                    <button class="ysp-ai-header-btn" id="ysp-ai-close" title="关闭">&times;</button>
                </div>
            </div>
            <div class="ysp-ai-body">
                <div class="ysp-ai-model-switcher">
                    ${Object.entries(MODELS).map(([id, m]) => {
                        const hasKey = !!getApiKey(id);
                        return `<button class="ysp-ai-model-opt ${id === curModelId ? 'active' : ''}" data-model="${id}">
                            ${m.name}
                            <div class="ysp-ai-key-status" style="color:${hasKey ? 'var(--success)' : 'var(--error)'}">
                                ${hasKey ? 'Key ✓' : 'Key ✗'}
                            </div>
                        </button>`;
                    }).join('')}
                </div>
                <div class="ysp-ai-key-config">
                    <div class="ysp-ai-key-label">${MODELS[curModelId].keyLabel}</div>
                    <input type="password" class="ysp-ai-key-input" id="ysp-ai-key-input"
                           placeholder="输入 API Key" value="${escapeHtml(getApiKey(curModelId))}">
                    <button class="ysp-ai-key-save" id="ysp-ai-key-save">保存 Key</button>
                </div>
                <div class="ysp-ai-video-info">
                    <div><strong>标题：</strong>${escapeHtml(videoInfo.title || '未检测到')}</div>
                    <div><strong>时长：</strong>${escapeHtml(videoInfo.duration || '未知')}</div>
                    <div><strong>VID：</strong>${escapeHtml(videoInfo.vid || '未知')}</div>
                    ${videoInfo.videoUrl ? '<div style="color:var(--success);margin-top:4px;">✓ 已捕获视频地址</div>' : '<div style="color:var(--error);margin-top:4px;">✗ 未捕获到视频地址，请等待视频加载</div>'}
                </div>
                <button class="ysp-ai-btn" id="ysp-ai-analyze" ${!videoInfo.videoUrl ? 'disabled' : ''}>
                    开始分析
                </button>
                <div id="ysp-ai-result"></div>
            </div>
        `;

        document.body.appendChild(panelEl);

        // Apply theme
        applyTheme();

        // Event listeners
        panelEl.querySelector('#ysp-ai-close').addEventListener('click', togglePanel);
        panelEl.querySelector('#ysp-ai-collapse').addEventListener('click', () => {
            panelEl.classList.toggle('collapsed');
            const btn = panelEl.querySelector('#ysp-ai-collapse');
            btn.textContent = panelEl.classList.contains('collapsed') ? '+' : '−';
        });
        panelEl.querySelector('#ysp-ai-analyze').addEventListener('click', startAnalysis);

        // Theme switcher
        panelEl.querySelectorAll('.ysp-ai-theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                setTheme(theme);
                panelEl.querySelectorAll('.ysp-ai-theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                applyTheme();
            });
        });

        // Model switcher
        panelEl.querySelectorAll('.ysp-ai-model-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                const modelId = btn.dataset.model;
                setCurrentModelId(modelId);
                panelEl.querySelectorAll('.ysp-ai-model-opt').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update key input
                const keyInput = panelEl.querySelector('#ysp-ai-key-input');
                const keyLabel = panelEl.querySelector('.ysp-ai-key-label');
                keyInput.value = getApiKey(modelId);
                keyLabel.textContent = MODELS[modelId].keyLabel;
            });
        });

        // Key save
        panelEl.querySelector('#ysp-ai-key-save').addEventListener('click', () => {
            const keyInput = panelEl.querySelector('#ysp-ai-key-input');
            const key = keyInput.value.trim();
            const modelId = getCurrentModelId();
            setApiKey(modelId, key);

            // Update status indicator
            const activeBtn = panelEl.querySelector('.ysp-ai-model-opt.active');
            const statusEl = activeBtn.querySelector('.ysp-ai-key-status');
            const hasKey = !!key;
            statusEl.style.color = hasKey ? 'var(--success)' : 'var(--error)';
            statusEl.textContent = hasKey ? 'Key ✓' : 'Key ✗';

            // Show feedback
            const saveBtn = panelEl.querySelector('#ysp-ai-key-save');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '已保存 ✓';
            setTimeout(() => { saveBtn.textContent = originalText; }, 1500);
        });

        // Draggable
        makeDraggable(panelEl, panelEl.querySelector('.ysp-ai-header'));
    }

    function startAnalysis() {
        const videoInfo = getVideoInfo();
        if (!videoInfo.videoUrl) {
            showError('未捕获到视频地址，请等待视频播放后重试');
            return;
        }

        const btn = panelEl.querySelector('#ysp-ai-analyze');
        const resultDiv = panelEl.querySelector('#ysp-ai-result');

        const modelName = getCurrentModel().name;

        btn.disabled = true;
        btn.textContent = '分析中...';
        resultDiv.innerHTML = `
            <div class="ysp-ai-loading">
                <div class="ysp-ai-spinner"></div>
                <span>正在发送视频至 ${escapeHtml(modelName)} 分析，请耐心等待...</span>
            </div>
        `;

        callModel(
            videoInfo.videoUrl,
            videoInfo.title,
            videoInfo.description,
            // onDone
            (fullText) => {
                btn.disabled = false;
                btn.textContent = '重新分析';
                const parsed = parseModelOutput(fullText);
                renderResult(resultDiv, parsed);
            },
            // onError
            (errMsg) => {
                btn.disabled = false;
                btn.textContent = '重试分析';
                resultDiv.innerHTML = `<div class="ysp-ai-error">${escapeHtml(errMsg)}</div>`;
            }
        );
    }

    function renderResult(container, data) {
        let html = '';

        // Timeline
        if (data.timeline && data.timeline.length > 0) {
            html += `
                <div class="ysp-ai-section">
                    <div class="ysp-ai-section-title">&#9200; 时间线</div>
                    <div class="ysp-ai-section-content">`;
            for (const item of data.timeline) {
                html += `<div class="ysp-ai-timeline-item"><span class="ysp-ai-timeline-time">${escapeHtml(item.time)}</span><span class="ysp-ai-timeline-text">${escapeHtml(item.content)}</span></div>`;
            }
            html += `</div></div>`;
        }

        // Summary
        if (data.summary) {
            html += `
                <div class="ysp-ai-section">
                    <div class="ysp-ai-section-title">&#128196; ${data.raw ? '模型原始输出' : '视频总结'}</div>
                    <div class="ysp-ai-section-content">${escapeHtml(data.summary)}</div>
                </div>`;
        }

        // Tags
        if (data.tags && data.tags.length > 0) {
            html += `
                <div class="ysp-ai-section">
                    <div class="ysp-ai-section-title">&#127991; 标签</div>
                    <div class="ysp-ai-tags">`;
            for (const tag of data.tags) {
                html += `<span class="ysp-ai-tag">${escapeHtml(tag)}</span>`;
            }
            html += `</div></div>`;
        }

        if (!html) {
            html = '<div class="ysp-ai-error">未能解析模型输出</div>';
        }

        container.innerHTML = html;
    }

    function showError(msg) {
        const resultDiv = panelEl.querySelector('#ysp-ai-result');
        if (resultDiv) {
            resultDiv.innerHTML = `<div class="ysp-ai-error">${escapeHtml(msg)}</div>`;
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ============ 拖拽 ============
    function makeDraggable(el, handle) {
        let offsetX = 0, offsetY = 0, dragging = false;

        handle.addEventListener('mousedown', (e) => {
            dragging = true;
            offsetX = e.clientX - el.getBoundingClientRect().left;
            offsetY = e.clientY - el.getBoundingClientRect().top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            dragging = false;
        });
    }

    // ============ 初始化 ============
    function init() {
        injectStyles();
        // Wait for video page to be ready
        const checkReady = setInterval(() => {
            const videoEl = document.querySelector('video[id^="myvideo"]');
            const titleEl = document.querySelector('.video-main-l-title .title');
            if (videoEl || titleEl) {
                clearInterval(checkReady);
                createTriggerButton();
            }
        }, 1000);
        // Fallback: show button after 8s anyway
        setTimeout(() => {
            clearInterval(checkReady);
            if (!triggerBtn) createTriggerButton();
        }, 8000);
    }

    init();
})();
