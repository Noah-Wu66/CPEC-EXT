// ==UserScript==
// @name         央视频标准化助手
// @namespace    https://github.com/Noah-Wu66/CPEC-EXT
// @version      1.0.6
// @description  在标准化系统页面执行视频标准化打标
// @author       Noah
// @match        http://std.video.cloud.cctv.com/*
// @match        https://std.video.cloud.cctv.com/*
// @match        https://yangshipin.cn/*
// @match        https://www.yangshipin.cn/*
// @match        https://m.yangshipin.cn/*
// @match        https://w.yangshipin.cn/*
// @updateURL    https://gh-proxy.com/https://raw.githubusercontent.com/Noah-Wu66/CPEC-EXT/main/ysp/standard.user.js
// @downloadURL  https://gh-proxy.com/https://raw.githubusercontent.com/Noah-Wu66/CPEC-EXT/main/ysp/standard.user.js
// @require      https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addStyle
// @grant        GM_info
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      ark.cn-beijing.volces.com
// @connect      std.video.cloud.cctv.com
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  if (window.__YSP_STANDARDIZATION__) {
    return;
  }
  window.__YSP_STANDARDIZATION__ = true;

  const SCRIPT_VERSION = GM_info.script.version;
  const nativeConsole = typeof console === 'object' ? console : null;
  const logger = {
    error(...args) {
      if (nativeConsole && typeof nativeConsole.error === 'function') {
        nativeConsole.error('[央视频标准化助手]', ...args);
      }
    }
  };
  const YANGSHIPIN_VIDEO_INFO_API_PATH = '/v1/player/get_video_info';
  const CURRENT_TAB_ID = `tab-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  const CURRENT_TAB_OPENED_AT = Date.now();
  let lastHandledCloseTabsSignalId = '';
  let closeTabsSignalWatcher = 0;
  let latestYangshipinVideoInfoResponse = null;
  const yangshipinVideoInfoResponseListeners = [];

  installYangshipinVideoInfoCaptureHook();
  const PANEL_STYLE = `
#ysp-standardization-panel-root {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  pointer-events: none;
  color: #17304b;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
}

#ysp-standardization-panel-root.is-settings-open {
  pointer-events: auto;
}

#ysp-standardization-panel-root.is-input-locked {
  pointer-events: auto;
}

.ysp-std-panel__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(8, 24, 40, 0.16);
  transition: background 0.22s ease;
}

#ysp-standardization-panel-root.is-focused .ysp-std-panel__backdrop {
  background: rgba(8, 24, 40, 0.28);
}

#ysp-standardization-panel-root.is-input-locked .ysp-std-panel__backdrop {
  pointer-events: auto;
  background: rgba(6, 14, 24, 0.56);
}

.ysp-std-panel {
  position: relative;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  width: min(960px, calc(100vw - 40px));
  max-height: calc(100vh - 40px);
  overflow: hidden;
  border: 1px solid rgba(21, 54, 85, 0.12);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(252, 248, 241, 0.98), rgba(244, 249, 255, 0.98)),
    #ffffff;
  box-shadow: 0 24px 60px rgba(19, 45, 71, 0.2);
  backdrop-filter: blur(18px);
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
}

#ysp-standardization-panel-root.is-minimized {
  justify-content: flex-end;
}

#ysp-standardization-panel-root.is-minimized .ysp-std-panel__backdrop {
  opacity: 0;
  pointer-events: none;
}

#ysp-standardization-panel-root.is-minimized .ysp-std-panel {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateX(32px) scale(0.98);
}

.ysp-std-panel::before,
.ysp-std-panel::after {
  content: "";
  position: absolute;
  pointer-events: none;
  border-radius: 999px;
  filter: blur(4px);
}

.ysp-std-panel::before {
  top: -84px;
  right: -42px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(254, 202, 137, 0.34), rgba(254, 202, 137, 0));
}

.ysp-std-panel::after {
  bottom: -96px;
  left: -54px;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(121, 166, 215, 0.28), rgba(121, 166, 215, 0));
}

.ysp-std-panel__header {
  position: relative;
  z-index: 2;
  padding: 20px 22px 16px;
  color: #f9fbff;
  background:
    linear-gradient(135deg, rgba(15, 41, 66, 0.98), rgba(27, 82, 122, 0.94)),
    #17314b;
}

.ysp-std-panel__header::after {
  content: "";
  position: absolute;
  inset: auto 22px 0 22px;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0));
}

.ysp-std-panel__header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.ysp-std-panel__header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.ysp-std-panel__title {
  margin: 0;
  font-family: "STZhongsong", "Songti SC", "Noto Serif SC", serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.15;
}

.ysp-std-panel__header-chip {
  position: relative;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 60px;
  height: 34px;
  box-sizing: border-box;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

button.ysp-std-panel__header-chip {
  cursor: pointer;
}

button.ysp-std-panel__header-chip:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.18);
}

.ysp-std-panel__body {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.78fr);
  gap: 16px;
  padding: 18px 18px 20px;
  overflow: hidden;
  flex: 1 1 auto;
  min-height: 0;
}

.ysp-std-panel__main,
.ysp-std-panel__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.ysp-std-panel__main {
  overflow-y: auto;
  padding-right: 4px;
}

.ysp-std-panel__side {
  overflow: hidden;
}

.ysp-std-panel__section {
  position: relative;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(25, 56, 84, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.ysp-std-panel__section--compact {
  padding: 14px 16px;
}

.ysp-std-panel__section--fill {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ysp-std-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.ysp-std-panel__label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #18344c;
}

.ysp-std-panel__toolbar .ysp-std-panel__label {
  margin-bottom: 0;
}

.ysp-std-panel__toolbar-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #37617f;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.ysp-std-panel__toolbar-button:hover {
  color: #17344d;
}

.ysp-std-panel__date {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid rgba(24, 52, 76, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  color: #17212b;
  box-shadow: inset 0 1px 2px rgba(17, 41, 66, 0.04);
  cursor: pointer;
}

.ysp-std-panel__date-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.ysp-std-panel__date-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ysp-std-panel__date-caption {
  font-size: 12px;
  font-weight: 700;
  color: #49657c;
}

.ysp-std-panel__badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(23, 52, 77, 0.08);
  color: #204160;
  font-size: 12px;
  font-weight: 600;
}

.ysp-std-panel__catalog {
  display: grid;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
  padding-right: 4px;
  overflow-y: auto;
}

.ysp-std-panel__group {
  --accent: #3276aa;
  --accent-soft: rgba(50, 118, 170, 0.1);
  --accent-border: rgba(50, 118, 170, 0.16);
  --accent-ink: #214866;
  padding: 16px 18px;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(250, 252, 255, 0.8)),
    #ffffff;
  border: 1px solid var(--accent-border);
  box-shadow: 0 10px 24px rgba(23, 56, 84, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  cursor: pointer;
}

.ysp-std-panel__group:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(23, 56, 84, 0.08);
}

.ysp-std-panel__group.is-selected {
  border-color: color-mix(in srgb, var(--accent) 28%, white);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 82%, white), rgba(255, 255, 255, 0.94)),
    #ffffff;
  box-shadow: 0 16px 28px rgba(23, 56, 84, 0.1);
  transform: translateY(-1px);
}

.ysp-std-panel__group[data-theme="knowledge"] {
  --accent: #cf7d2e;
  --accent-soft: rgba(207, 125, 46, 0.12);
  --accent-border: rgba(207, 125, 46, 0.16);
  --accent-ink: #7d4b1f;
}

.ysp-std-panel__group[data-theme="information"] {
  --accent: #4b7fab;
  --accent-soft: rgba(75, 127, 171, 0.12);
  --accent-border: rgba(75, 127, 171, 0.16);
  --accent-ink: #274766;
}

.ysp-std-panel__group[data-theme="culture"] {
  --accent: #be6b58;
  --accent-soft: rgba(190, 107, 88, 0.12);
  --accent-border: rgba(190, 107, 88, 0.16);
  --accent-ink: #733d31;
}

.ysp-std-panel__group-header {
  display: block;
}

.ysp-std-panel__group-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.45;
  color: var(--accent-ink);
}

.ysp-std-panel__actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.ysp-std-panel__side > .ysp-std-panel__actions {
  flex: 0 0 auto;
  margin-top: auto;
}

.ysp-std-panel__button {
  min-height: 48px;
  padding: 10px 12px;
  border: 0;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
}

.ysp-std-panel__button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.ysp-std-panel__button:disabled {
  opacity: 0.5;
  cursor: default;
  transform: none;
  box-shadow: none;
}

.ysp-std-panel__button.is-loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.ysp-std-panel__button.is-loading::before {
  content: "";
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: ysp-std-panel-spin 0.8s linear infinite;
}

@keyframes ysp-std-panel-spin {
  to {
    transform: rotate(360deg);
  }
}

.ysp-std-panel__button--primary {
  background: linear-gradient(135deg, #0f7d94, #1f5f86);
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(31, 95, 134, 0.2);
}

.ysp-std-panel__button--danger {
  background: linear-gradient(135deg, rgba(255, 245, 241, 0.96), rgba(255, 236, 231, 0.96));
  color: #b3472f;
  border: 1px solid rgba(194, 92, 64, 0.18);
  box-shadow: 0 10px 20px rgba(194, 92, 64, 0.12);
}

.ysp-std-panel__status {
  display: grid;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 250, 244, 0.92), rgba(241, 247, 255, 0.92));
  border: 1px solid rgba(22, 51, 78, 0.1);
  font-size: 12px;
  line-height: 1.5;
  color: #35516a;
  flex: 0 0 auto;
}

.ysp-std-panel__status-head {
  display: flex;
  align-items: center;
}

.ysp-std-panel__status-head .ysp-std-panel__label {
  margin-bottom: 0;
}

.ysp-std-panel__status-value {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.6;
  color: #17324f;
  word-break: break-word;
}

.ysp-std-panel__status-subtext {
  padding-top: 8px;
  border-top: 1px solid rgba(22, 51, 78, 0.08);
  font-size: 12px;
  color: #6b7a90;
}

.ysp-std-panel__result-card {
  flex: 0 0 auto;
}

.ysp-std-panel__download-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
}

.ysp-std-panel__log-card {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.ysp-std-panel__log-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.ysp-std-panel__log-entry {
  padding: 8px 0;
  border-bottom: 1px dashed #d8e2ee;
  color: #40556f;
  font-size: 12px;
  line-height: 1.65;
  word-break: break-all;
}

.ysp-std-panel__report {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(252, 244, 234, 0.9), rgba(238, 246, 255, 0.9));
  border: 1px solid rgba(25, 56, 84, 0.08);
}

.ysp-std-panel__report-empty {
  font-size: 12px;
  line-height: 1.6;
  color: #5d7690;
}

.ysp-std-panel__report-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.ysp-std-panel__report-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #18344c;
}

.ysp-std-panel__report-meta {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.55;
  color: #54708a;
}

.ysp-std-panel__download {
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #d37d2a, #b85e3c);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(184, 94, 60, 0.2);
}

.ysp-std-panel__download:disabled {
  opacity: 0.5;
  cursor: default;
  box-shadow: none;
}

.ysp-std-panel__report-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ysp-std-panel__dock {
  position: absolute;
  top: calc(50% + 86px);
  right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 156px;
  border: 0;
  border-radius: 20px 0 0 20px;
  background: linear-gradient(180deg, rgba(15, 41, 66, 0.98), rgba(27, 82, 122, 0.94));
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0;
  white-space: nowrap;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  box-shadow: 0 16px 30px rgba(19, 45, 71, 0.22);
  transform: translateY(-50%) translateX(12px);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
}

#ysp-standardization-panel-root.is-minimized .ysp-std-panel__dock {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(-50%) translateX(0);
}

@media (max-width: 1366px) {
  #ysp-standardization-panel-root {
    padding: 16px;
  }

  .ysp-std-panel {
    width: min(900px, calc(100vw - 24px));
  }
}

@media (max-width: 920px) {
  .ysp-std-panel {
    width: min(480px, calc(100vw - 24px));
  }

  .ysp-std-panel__body {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .ysp-std-panel__main,
  .ysp-std-panel__side {
    overflow: visible;
    padding-right: 0;
  }

  .ysp-std-panel__download-list,
  .ysp-std-panel__log-list {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }

  .ysp-std-panel__log-card {
    min-height: auto;
  }

  .ysp-std-panel__date-grid {
    grid-template-columns: 1fr;
  }
}

.ysp-std-panel__module-switcher {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ysp-std-panel__module-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid rgba(24, 52, 76, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
  color: #1c496b;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.ysp-std-panel__module-tab.is-active {
  border-color: rgba(31, 94, 139, 0.2);
  background: linear-gradient(135deg, rgba(27, 82, 122, 0.96), rgba(16, 50, 78, 0.98));
  color: #f9fbff;
  box-shadow: 0 10px 24px rgba(19, 57, 88, 0.18);
}

.ysp-std-panel__module {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ysp-std-panel__module-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ysp-std-panel__module[hidden] {
  display: none;
}

.ysp-std-panel__subheader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ysp-std-panel__subheader-title {
  font-size: 13px;
  font-weight: 700;
  color: #18344c;
}

.ysp-std-panel__help {
  font-size: 12px;
  color: #617688;
}

.ysp-std-panel__field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ysp-std-panel__field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: visible;
}

.ysp-std-panel__input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid rgba(24, 52, 76, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  color: #17212b;
  box-shadow: inset 0 1px 2px rgba(17, 41, 66, 0.04);
}

.ysp-std-panel__input:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ysp-std-panel__range-card {
  padding: 12px 14px;
  border: 1px solid rgba(24, 52, 76, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 1px 2px rgba(17, 41, 66, 0.04);
}

.ysp-std-panel__range-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.ysp-std-panel__range-value {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 700;
  color: #245a91;
}

.ysp-std-panel__range {
  width: 100%;
  height: 20px;
  margin: 0;
  accent-color: #2473d1;
}

.ysp-std-panel__range:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ysp-std-panel__range-labels {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  margin-top: 6px;
  font-size: 11px;
  line-height: 1.3;
  color: #617688;
}

.ysp-std-panel__range-labels span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ysp-std-panel__range-labels span:nth-child(2),
.ysp-std-panel__range-labels span:nth-child(3) {
  text-align: center;
}

.ysp-std-panel__range-labels span:last-child {
  text-align: right;
}

.ysp-std-panel__group-picker {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ysp-std-panel__popup-layer {
  position: fixed;
  inset: 0;
  z-index: 12;
  pointer-events: none;
}

.ysp-std-panel__popup-layer > * {
  pointer-events: auto;
}

.ysp-std-panel__group-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid rgba(24, 52, 76, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  color: #17212b;
  box-shadow: inset 0 1px 2px rgba(17, 41, 66, 0.04);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.ysp-std-panel__group-trigger:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ysp-std-panel__group-picker.is-open .ysp-std-panel__group-trigger {
  border-color: rgba(31, 94, 139, 0.32);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 0 0 3px rgba(46, 110, 158, 0.1), inset 0 1px 2px rgba(17, 41, 66, 0.04);
}

.ysp-std-panel__group-trigger-text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-align: left;
  text-overflow: ellipsis;
}

.ysp-std-panel__group-trigger-icon {
  flex: 0 0 auto;
  color: #60778d;
  font-size: 12px;
}

.ysp-std-panel__group-menu {
  position: fixed;
  left: var(--menu-left, 12px);
  width: var(--menu-width, 360px);
  max-width: calc(100vw - 24px);
  z-index: 1;
  display: grid;
  gap: 8px;
  max-height: var(--menu-max-height, 360px);
  padding: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid rgba(24, 52, 76, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 36px rgba(23, 56, 84, 0.16);
  backdrop-filter: blur(16px);
  transform-origin: top left;
  animation: ysp-std-panel__group-menu-in 0.18s ease;
}

@keyframes ysp-std-panel__group-menu-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ysp-std-panel__group-option {
  --accent: #3276aa;
  --accent-soft: rgba(50, 118, 170, 0.1);
  --accent-border: rgba(50, 118, 170, 0.14);
  --accent-ink: #214866;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--accent-border);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 251, 255, 0.9));
  color: var(--accent-ink);
  text-align: left;
  cursor: pointer;
}

.ysp-std-panel__group-option:hover {
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 44%, white), rgba(255, 255, 255, 0.94));
}

.ysp-std-panel__group-option.is-selected {
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 78%, white), rgba(255, 255, 255, 0.96));
  border-color: color-mix(in srgb, var(--accent) 26%, white);
}

.ysp-std-panel__group-option:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ysp-std-panel__group-option[data-theme="knowledge"] {
  --accent: #cf7d2e;
  --accent-soft: rgba(207, 125, 46, 0.12);
  --accent-border: rgba(207, 125, 46, 0.16);
  --accent-ink: #7d4b1f;
}

.ysp-std-panel__group-option[data-theme="information"] {
  --accent: #4b7fab;
  --accent-soft: rgba(75, 127, 171, 0.12);
  --accent-border: rgba(75, 127, 171, 0.16);
  --accent-ink: #274766;
}

.ysp-std-panel__group-option[data-theme="culture"] {
  --accent: #be6b58;
  --accent-soft: rgba(190, 107, 88, 0.12);
  --accent-border: rgba(190, 107, 88, 0.16);
  --accent-ink: #733d31;
}

.ysp-std-panel__group-option-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.ysp-std-panel__group-option-meta {
  font-size: 11px;
  font-weight: 700;
  color: #6a7f91;
}

.ysp-std-panel__group-option-label {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  color: inherit;
}

.ysp-std-panel__group-option-check {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 700;
  color: color-mix(in srgb, var(--accent) 82%, #18344c);
  white-space: nowrap;
}

.ysp-std-panel__input--secret {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.ysp-std-panel__hint {
  font-size: 12px;
  line-height: 1.6;
  color: #5f7284;
}

.ysp-std-panel__group-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ysp-std-panel__group-note {
  font-size: 12px;
  color: #5d7183;
}

.ysp-std-panel__button-row {
  display: flex;
  gap: 12px;
}

.ysp-std-panel__button-row > * {
  flex: 1 1 0;
}

.ysp-std-panel__stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ysp-std-panel__status-card,
.ysp-std-panel__result-card,
.ysp-std-panel__log-card {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(25, 56, 84, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.ysp-std-panel__status-title,
.ysp-std-panel__log-title,
.ysp-std-panel__result-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: #18344c;
}

.ysp-std-panel__status-text {
  font-size: 13px;
  line-height: 1.7;
  color: #28445a;
  white-space: pre-wrap;
}

.ysp-std-panel__result-empty,
.ysp-std-panel__log-empty {
  font-size: 12px;
  color: #6d7e8d;
}

.ysp-std-panel__result-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ysp-std-panel__result-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(247, 250, 253, 0.92);
  border: 1px solid rgba(25, 56, 84, 0.08);
}

.ysp-std-panel__result-head {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 700;
  color: #1e4260;
}

.ysp-std-panel__result-meta {
  font-size: 12px;
  line-height: 1.6;
  color: #5d7082;
}

.ysp-std-panel__link-button {
  min-width: 86px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(29, 78, 116, 0.12);
  background: rgba(36, 96, 140, 0.08);
  color: #1c547a;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.ysp-std-panel__log-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.ysp-std-panel__log-item {
  font-size: 12px;
  line-height: 1.6;
  color: #28445a;
  word-break: break-all;
}

.ysp-std-panel__settings-trigger {
  min-width: 56px;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.ysp-std-panel__modal-mask {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(9, 20, 33, 0.32);
  backdrop-filter: blur(8px);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.18s ease, visibility 0.18s ease;
}

#ysp-standardization-panel-root.is-settings-open .ysp-std-panel__modal-mask {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.ysp-std-panel__modal {
  width: min(440px, 100%);
  pointer-events: auto;
  display: grid;
  gap: 14px;
  padding: 20px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(252, 248, 241, 0.98), rgba(244, 249, 255, 0.98));
  border: 1px solid rgba(21, 54, 85, 0.12);
  box-shadow: 0 24px 60px rgba(19, 45, 71, 0.2);
}

.ysp-std-panel__modal-title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: #18344c;
}

.ysp-std-panel__modal-text {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.7;
  color: #5d7082;
}

.ysp-std-panel__modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.ysp-std-panel__modal-actions button {
  min-width: 92px;
}

@media (max-width: 920px) {
  .ysp-std-panel__field-grid,
  .ysp-std-panel__group-grid {
    grid-template-columns: 1fr;
  }

  .ysp-std-panel__button-row {
    flex-direction: column;
  }
}

.ysp-std-panel__download-card {
  padding: 12px;
  border: 1px solid #d8e2ee;
  border-radius: 16px;
  background: #fff;
}
  `;

  const CATEGORY_GROUPS = [
    {
      id: 'knowledge',
      label: '知识',
      theme: 'knowledge',
      subgroups: [
        {
          id: 'knowledge-core',
          label: '文史、教育、自然、科技',
          categories: [
            { key: 'knowledge-history', label: '文史', queryLabel: '文史' },
            { key: 'knowledge-education', label: '教育', queryLabel: '教育' },
            { key: 'knowledge-nature', label: '自然', queryLabel: '自然科学', exportLabel: '自然' },
            { key: 'knowledge-technology', label: '科技', queryLabel: '科技' }
          ]
        },
        {
          id: 'knowledge-life',
          label: '青少、健康、美食、生活',
          categories: [
            { key: 'knowledge-youth', label: '青少', queryLabel: '青少' },
            { key: 'knowledge-health', label: '健康', queryLabel: '健康' },
            { key: 'knowledge-food', label: '美食', queryLabel: '美食' },
            { key: 'knowledge-life-style', label: '生活', queryLabel: '生活方式', exportLabel: '生活' }
          ]
        },
        {
          id: 'knowledge-animals',
          label: '时尚、法治、动物',
          categories: [
            { key: 'knowledge-fashion', label: '时尚', queryLabel: '时尚' },
            { key: 'knowledge-law', label: '法治', queryLabel: '法治' },
            { key: 'knowledge-animal', label: '动物', queryLabel: '动物' }
          ]
        }
      ]
    },
    {
      id: 'information',
      label: '资讯',
      theme: 'information',
      subgroups: [
        {
          id: 'information-world',
          label: '国际、体育、军事',
          categories: [
            { key: 'information-international', label: '国际', queryLabel: '国际/港澳台', exportLabel: '国际/港澳台' },
            { key: 'information-sports', label: '体育', queryLabel: '体育' },
            { key: 'information-military', label: '军事', queryLabel: '军事' }
          ]
        },
        {
          id: 'information-economy',
          label: '财经、旅游、汽车',
          categories: [
            { key: 'information-finance', label: '财经', queryLabel: '财经' },
            { key: 'information-travel', label: '旅游', queryLabel: '旅游' },
            { key: 'information-auto', label: '汽车', queryLabel: '汽车' }
          ]
        },
        {
          id: 'information-public',
          label: '社会、民生、三农',
          categories: [
            { key: 'information-society', label: '社会', queryLabel: '社会' },
            { key: 'information-livelihood', label: '民生', queryLabel: '民生' },
            { key: 'information-agriculture', label: '三农', queryLabel: '三农' }
          ]
        },
      ]
    },
    {
      id: 'culture',
      label: '文艺',
      theme: 'culture',
      subgroups: [
        {
          id: 'culture-stage',
          label: '综艺、音乐、舞蹈、曲艺、搞笑',
          categories: [
            { key: 'culture-variety', label: '综艺', queryLabel: '综艺' },
            { key: 'culture-music', label: '音乐', queryLabel: '音乐' },
            { key: 'culture-dance', label: '舞蹈', queryLabel: '舞蹈' },
            { key: 'culture-folk-art', label: '曲艺', queryLabel: '曲艺' },
            { key: 'culture-comedy', label: '搞笑', queryLabel: '搞笑' }
          ]
        },
        {
          id: 'culture-screen',
          label: '电影、电视剧、动漫、游戏',
          categories: [
            { key: 'culture-film', label: '电影', queryLabel: '电影' },
            { key: 'culture-drama', label: '电视剧', queryLabel: '电视剧' },
            { key: 'culture-animation', label: '动漫', queryLabel: '动漫' },
            { key: 'culture-game', label: '游戏', queryLabel: '游戏' }
          ]
        }
      ]
    }
  ];

  const CATEGORY_ENTRIES = CATEGORY_GROUPS.flatMap((group, groupIndex) => {
    return group.subgroups.flatMap((subgroup, subgroupIndex) => {
      return subgroup.categories.map((category, categoryIndex) => {
        return {
          key: category.key,
          label: category.label,
          exportLabel: category.exportLabel || category.label,
          queryLabel: category.queryLabel || category.label,
          groupId: group.id,
          groupLabel: group.label,
          subgroupId: subgroup.id,
          subgroupLabel: subgroup.label,
          theme: group.theme,
          orderToken: `${groupIndex}-${subgroupIndex}-${categoryIndex}`
        };
      });
    });
  });

  const CATEGORY_ENTRY_MAP = new Map(CATEGORY_ENTRIES.map((entry) => [entry.key, entry]));
  const SUBGROUP_ENTRIES = CATEGORY_GROUPS.flatMap((group, groupIndex) => {
    return group.subgroups.map((subgroup, subgroupIndex) => {
      return {
        id: subgroup.id,
        label: subgroup.label,
        groupId: group.id,
        groupLabel: group.label,
        theme: group.theme,
        itemKeys: subgroup.categories.map((category) => category.key),
        orderToken: `${groupIndex}-${subgroupIndex}`
      };
    });
  });
  const SUBGROUP_ENTRY_MAP = new Map(SUBGROUP_ENTRIES.map((entry) => [entry.id, entry]));

  const METRIC_HEADERS = [
    '入库量',
    '标准化总量',
    '标准化通过',
    '标准化拒绝',
    '标准化拒绝率',
    '质检量',
    '质检通过',
    '质检拒绝',
    '质检拒绝率'
  ];

  const STORAGE_KEYS = {
    settings: 'yspStandardizationSettingsV1',
    report: 'yspStandardizationReportV1',
    checkpoint: 'yspStandardizationCheckpointV1',
    seenTaskIds: 'yspStandardizationSeenTaskIdsV1',
    pendingStart: 'yspStandardizationPendingStartV1',
    closeTabsSignal: 'yspStandardizationCloseTabsSignalV1',
    workerRequestPrefix: 'yspStandardizationWorkerRequestV1:',
    workerResponsePrefix: 'yspStandardizationWorkerResponseV1:',
    workerProgressPrefix: 'yspStandardizationWorkerProgressV1:',
    workerStopPrefix: 'yspStandardizationWorkerStopV1:',
    mediaWorkerRequestPrefix: 'yspStandardizationMediaWorkerRequestV1:',
    mediaWorkerResponsePrefix: 'yspStandardizationMediaWorkerResponseV1:'
  };
  const MAX_LOGS = 200;
  const QUERY_TIMEOUT = 90000;
  const PAGE_READY_TIMEOUT = 60000;
  const DETAIL_PAGE_TIMEOUT = 60000;
  const ARK_REQUEST_TIMEOUT = 30 * 60 * 1000;
  const WORKER_START_TIMEOUT = 15000;
  const WORKER_PROGRESS_STALL_TIMEOUT = 35 * 60 * 1000;
  const WORKER_RESPONSE_TIMEOUT = 95 * 60 * 1000;
  const MEDIA_WORKER_RESPONSE_TIMEOUT = 10 * 1000;
  const MAX_STANDARDIZATION_VIDEO_DURATION_SECONDS = 5 * 60;
  const ARK_RESPONSES_URL = 'https://ark.cn-beijing.volces.com/api/v3/responses';
  const STANDARDIZATION_MODEL = 'doubao-seed-2-0-lite-260428';
  const STANDARDIZATION_MODEL_LABEL = 'Doubao-Seed-2.0-lite 260428';
  const STANDARDIZATION_MODEL_THINKING_TYPE = 'enabled';
  const STANDARDIZATION_MODEL_MAX_OUTPUT_TOKENS = 65536;
  const STANDARDIZATION_REASONING_EFFORT_OPTIONS = [
    { value: 'minimal', label: '极少' },
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' }
  ];
  const STANDARDIZATION_DEFAULT_REASONING_EFFORT = 'medium';
  const STANDARDIZATION_RUN_MODES = [
    { value: 'demo', label: '演示模式' },
    { value: 'live', label: '实操模式' }
  ];
  const STANDARDIZATION_DEFAULT_RUN_MODE = 'demo';
  const STANDARDIZATION_CATEGORY_TYPE_IDS = {
    '文史': '10',
    '教育': '18',
    '自然科学': '25',
    '科技': '26',
    '青少': '16',
    '健康': '17',
    '美食': '19',
    '生活方式': '30',
    '时尚': '20',
    '法治': '23',
    '动物': '24',
    '国际/港澳台': '2',
    '体育': '6',
    '军事': '21',
    '财经': '5',
    '旅游': '27',
    '汽车': '28',
    '社会': '4',
    '民生': '3',
    '三农': '22',
    '综艺': '7',
    '音乐': '8',
    '舞蹈': '9',
    '曲艺': '13',
    '搞笑': '14',
    '电影': '11',
    '电视剧': '12',
    '动漫': '15',
    '游戏': '29'
  };
  const STANDARDIZATION_LIST_PAGE_SIZE = 50;
  const TAG_LIBRARY_MAX_OPTIONS_PER_KEYWORD = 30;
  const TAG_LIBRARY_IDB_NAME = 'yspStandardizationTagLibraryV2';
  const TAG_LIBRARY_IDB_STORE = 'csv';
  const TAG_LIBRARY_CACHE_KEY = 'active';
  const YANGSHIPIN_VIDEO_WORKER_URL = 'https://yangshipin.cn/video/home';
  const TAG_LIBRARY_MEMORY_CACHE = {
    library: null,
    loadingPromise: null
  };

  function createDefaultWorkbenchSettings() {
    return {
      version: 1,
      ui: { panelMinimized: true },
      startDate: '',
      endDate: '',
      targetCount: 10,
      runMode: STANDARDIZATION_DEFAULT_RUN_MODE,
      reasoningEffort: STANDARDIZATION_DEFAULT_REASONING_EFFORT,
      categoryKey: '',
      configWorkbookFileName: '',
      configWorkbookUploadedAt: '',
      ruleWorkbookFileName: '',
      ruleWorkbookUploadedAt: '',
      ruleWorkbookRuleCount: 0,
      categoryRulesContent: '',
      tagLibraryFileName: '',
      tagLibraryUploadedAt: '',
      tagLibraryCount: 0,
      secrets: { arkApiKey: '' }
    };
  }

  function normalizeDateInputValue(value, maxDateString) {
    const maxDate = normalizeText(maxDateString) || getTodayDateString();
    const date = normalizeText(value);
    if (!date) return '';
    return date > maxDate ? maxDate : date;
  }

  function normalizePositiveInteger(value, fallbackValue, minValue, maxValue) {
    const numberValue = Math.trunc(Number(value));
    if (!Number.isFinite(numberValue) || numberValue < (minValue || 1)) return fallbackValue;
    if (maxValue && numberValue > maxValue) return maxValue;
    return numberValue;
  }

  function getStandardizationReasoningEffortOption(value) {
    const normalizedValue = normalizeText(value);
    return STANDARDIZATION_REASONING_EFFORT_OPTIONS.find((option) => option.value === normalizedValue)
      || STANDARDIZATION_REASONING_EFFORT_OPTIONS.find((option) => option.value === STANDARDIZATION_DEFAULT_REASONING_EFFORT);
  }

  function getStandardizationReasoningEffortOptionByIndex(value) {
    const indexValue = Math.trunc(Number(value));
    const index = Number.isFinite(indexValue)
      ? Math.min(Math.max(indexValue, 0), STANDARDIZATION_REASONING_EFFORT_OPTIONS.length - 1)
      : 2;
    return STANDARDIZATION_REASONING_EFFORT_OPTIONS[index] || getStandardizationReasoningEffortOption(STANDARDIZATION_DEFAULT_REASONING_EFFORT);
  }

  function getStandardizationReasoningEffortIndex(value) {
    const option = getStandardizationReasoningEffortOption(value);
    const index = STANDARDIZATION_REASONING_EFFORT_OPTIONS.findIndex((item) => item.value === option.value);
    return index >= 0 ? index : 2;
  }

  function normalizeStandardizationReasoningEffort(value) {
    return getStandardizationReasoningEffortOption(value).value;
  }

  function getStandardizationReasoningEffortLabel(value) {
    return getStandardizationReasoningEffortOption(value).label;
  }

  function normalizeStandardizationRunMode(value) {
    const normalizedValue = normalizeText(value);
    return STANDARDIZATION_RUN_MODES.some((option) => option.value === normalizedValue)
      ? normalizedValue
      : STANDARDIZATION_DEFAULT_RUN_MODE;
  }

  function getStandardizationRunModeLabel(value) {
    const normalizedValue = normalizeStandardizationRunMode(value);
    const option = STANDARDIZATION_RUN_MODES.find((item) => item.value === normalizedValue);
    return option ? option.label : '演示模式';
  }

  function getStandardizationCategoryTypeId(item) {
    const queryLabel = normalizeText(item && item.queryLabel);
    const typeId = STANDARDIZATION_CATEGORY_TYPE_IDS[queryLabel];
    if (!typeId) {
      throw new Error(`当前品类没有列表接口编号：${queryLabel || '未选择'}`);
    }
    return typeId;
  }

  function normalizeWorkbenchSettings(rawSettings) {
    const defaults = createDefaultWorkbenchSettings();
    if (!rawSettings || typeof rawSettings !== 'object' || rawSettings.version !== defaults.version) return defaults;
    const startDate = normalizeDateInputValue(rawSettings.startDate, getTodayDateString()) || defaults.startDate;
    let endDate = normalizeDateInputValue(rawSettings.endDate, getTodayDateString());
    if (endDate && startDate && endDate < startDate) endDate = '';
    return {
      version: defaults.version,
      ui: {
        panelMinimized: rawSettings.ui && rawSettings.ui.panelMinimized !== undefined
          ? Boolean(rawSettings.ui.panelMinimized)
          : defaults.ui.panelMinimized
      },
      startDate,
      endDate,
      targetCount: normalizePositiveInteger(rawSettings.targetCount, defaults.targetCount, 1, 999),
      runMode: normalizeStandardizationRunMode(rawSettings.runMode || defaults.runMode),
      reasoningEffort: normalizeStandardizationReasoningEffort(rawSettings.reasoningEffort || defaults.reasoningEffort),
      categoryKey: normalizeSelectedKeys([rawSettings.categoryKey])[0] || '',
      configWorkbookFileName: normalizeText(rawSettings.configWorkbookFileName),
      configWorkbookUploadedAt: normalizeText(rawSettings.configWorkbookUploadedAt),
      ruleWorkbookFileName: normalizeText(rawSettings.ruleWorkbookFileName),
      ruleWorkbookUploadedAt: normalizeText(rawSettings.ruleWorkbookUploadedAt),
      ruleWorkbookRuleCount: normalizePositiveInteger(rawSettings.ruleWorkbookRuleCount, 0, 0, 99999999),
      categoryRulesContent: normalizeMultilineText(rawSettings.categoryRulesContent),
      tagLibraryFileName: normalizeText(rawSettings.tagLibraryFileName),
      tagLibraryUploadedAt: normalizeText(rawSettings.tagLibraryUploadedAt),
      tagLibraryCount: normalizePositiveInteger(rawSettings.tagLibraryCount, 0, 0, 99999999),
      secrets: {
        arkApiKey: normalizeText(rawSettings.secrets && rawSettings.secrets.arkApiKey)
      }
    };
  }

  function cloneWorkbenchSettings(settings) {
    return normalizeWorkbenchSettings(JSON.parse(JSON.stringify(settings || createDefaultWorkbenchSettings())));
  }
  /* ========================= 基础工具 ========================= */

  function injectPanelStyle() {
    GM_addStyle(PANEL_STYLE);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const PAGE_MUTE_CONTROLLER = {
    active: false,
    pausePlayback: false,
    observer: null,
    mediaStates: new Map(),
    mediaHandlers: new Map(),
    mediaPlayGuards: new Map()
  };

  const JOB_ABORT_CONTROLLER = {
    listJobGeneration: 0,
    listJobStoppedGeneration: 0,
    standardizationWorkerStopped: false,
    standardizationWorkerRequestId: '',
    standardizationWorkerStopWatcher: 0
  };

  function beginListJobAbortSession() {
    JOB_ABORT_CONTROLLER.listJobGeneration += 1;
    return JOB_ABORT_CONTROLLER.listJobGeneration;
  }

  function requestListJobAbort(token) {
    const normalizedToken = Number(token) || JOB_ABORT_CONTROLLER.listJobGeneration || 1;
    JOB_ABORT_CONTROLLER.listJobStoppedGeneration = Math.max(JOB_ABORT_CONTROLLER.listJobStoppedGeneration, normalizedToken);
  }

  function isListJobAbortRequested(token) {
    const normalizedToken = Number(token) || 0;
    return normalizedToken > 0 && JOB_ABORT_CONTROLLER.listJobStoppedGeneration >= normalizedToken;
  }

  function getMediaElementsFromNode(node) {
    if (!(node instanceof Element)) {
      return [];
    }
    const result = [];
    if (node instanceof HTMLMediaElement) {
      result.push(node);
    }
    result.push(...Array.from(node.querySelectorAll('video, audio')));
    return result;
  }

  function rememberMediaState(element) {
    if (!PAGE_MUTE_CONTROLLER.mediaStates.has(element)) {
      PAGE_MUTE_CONTROLLER.mediaStates.set(element, {
        muted: Boolean(element.muted),
        defaultMuted: Boolean(element.defaultMuted),
        autoplay: Boolean(element.autoplay)
      });
    }
  }

  function attachMediaMuteGuard(element) {
    if (PAGE_MUTE_CONTROLLER.mediaHandlers.has(element)) {
      return;
    }
    const handler = () => {
      if (PAGE_MUTE_CONTROLLER.active && !element.muted) {
        element.muted = true;
        element.defaultMuted = true;
      }
    };
    element.addEventListener('volumechange', handler, true);
    PAGE_MUTE_CONTROLLER.mediaHandlers.set(element, handler);
  }

  function attachMediaPauseGuard(element) {
    if (PAGE_MUTE_CONTROLLER.mediaPlayGuards.has(element)) {
      return;
    }
    const handler = () => {
      if (!PAGE_MUTE_CONTROLLER.active || !PAGE_MUTE_CONTROLLER.pausePlayback) {
        return;
      }
      if (!element.paused) {
        try {
          element.pause();
        } catch (error) {
          // ignore
        }
      }
    };
    element.addEventListener('play', handler, true);
    element.addEventListener('playing', handler, true);
    PAGE_MUTE_CONTROLLER.mediaPlayGuards.set(element, handler);
  }

  function muteMediaElement(element, pausePlayback) {
    if (!(element instanceof HTMLMediaElement)) {
      return;
    }
    rememberMediaState(element);
    attachMediaMuteGuard(element);
    if (pausePlayback) {
      attachMediaPauseGuard(element);
      element.autoplay = false;
      try {
        element.pause();
      } catch (error) {
        // ignore
      }
    }
    element.defaultMuted = true;
    element.muted = true;
  }

  function enforcePageMuted(options) {
    const pausePlayback = Boolean(options && options.pausePlayback);
    PAGE_MUTE_CONTROLLER.active = true;
    PAGE_MUTE_CONTROLLER.pausePlayback = PAGE_MUTE_CONTROLLER.pausePlayback || pausePlayback;
    Array.from(document.querySelectorAll('video, audio')).forEach((element) => {
      muteMediaElement(element, PAGE_MUTE_CONTROLLER.pausePlayback);
    });
    if (!PAGE_MUTE_CONTROLLER.observer) {
      PAGE_MUTE_CONTROLLER.observer = new MutationObserver((mutations) => {
        if (!PAGE_MUTE_CONTROLLER.active) {
          return;
        }
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            getMediaElementsFromNode(node).forEach((element) => muteMediaElement(element, PAGE_MUTE_CONTROLLER.pausePlayback));
          });
        });
      });
      PAGE_MUTE_CONTROLLER.observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  function releasePageMuted() {
    PAGE_MUTE_CONTROLLER.active = false;
    PAGE_MUTE_CONTROLLER.pausePlayback = false;
    if (PAGE_MUTE_CONTROLLER.observer) {
      PAGE_MUTE_CONTROLLER.observer.disconnect();
      PAGE_MUTE_CONTROLLER.observer = null;
    }
    PAGE_MUTE_CONTROLLER.mediaHandlers.forEach((handler, element) => {
      element.removeEventListener('volumechange', handler, true);
    });
    PAGE_MUTE_CONTROLLER.mediaHandlers.clear();
    PAGE_MUTE_CONTROLLER.mediaPlayGuards.forEach((handler, element) => {
      element.removeEventListener('play', handler, true);
      element.removeEventListener('playing', handler, true);
    });
    PAGE_MUTE_CONTROLLER.mediaPlayGuards.clear();
    PAGE_MUTE_CONTROLLER.mediaStates.forEach((state, element) => {
      if (!(element instanceof HTMLMediaElement)) {
        return;
      }
      element.autoplay = Boolean(state.autoplay);
      element.defaultMuted = Boolean(state.defaultMuted);
      element.muted = Boolean(state.muted);
    });
    PAGE_MUTE_CONTROLLER.mediaStates.clear();
  }

  function normalizeText(value) {
    return String(value == null ? '' : value)
      .replace(/\s+/g, ' ')
      .replace(/ /g, ' ')
      .trim();
  }

  function normalizeMultilineText(value) {
    return String(value || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  }

  function parseCategoryRuleSections(markdownText) {
    const source = normalizeMultilineText(markdownText);
    const rules = new Map();
    if (!source) {
      return rules;
    }
    const lines = source.split('\n');
    let currentCategory = '';
    let currentLines = [];
    const flushCurrentRule = () => {
      if (!currentCategory) {
        return;
      }
      rules.set(currentCategory, normalizeMultilineText(currentLines.join('\n')));
    };

    lines.forEach((line) => {
      const headingMatch = normalizeText(line).match(/^----(.+?)----$/);
      if (headingMatch) {
        flushCurrentRule();
        currentCategory = normalizeText(headingMatch[1]);
        currentLines = [];
        return;
      }
      if (currentCategory) {
        currentLines.push(line);
      }
    });
    flushCurrentRule();
    return rules;
  }

  function getCategoryRuleForCategory(markdownText, categoryLabel) {
    const normalizedCategoryLabel = normalizeText(categoryLabel);
    if (!normalizedCategoryLabel) {
      return '';
    }
    const rules = parseCategoryRuleSections(markdownText);
    const commonRule = normalizeMultilineText(rules.get('通用') || '');
    const categoryRule = normalizeMultilineText(rules.get(normalizedCategoryLabel) || '');
    return normalizeMultilineText([
      commonRule ? `通用规则：\n${commonRule}` : '',
      categoryRule ? `${normalizedCategoryLabel}规则：\n${categoryRule}` : ''
    ].filter(Boolean).join('\n\n'));
  }

  function buildCategoryRuleSystemPrompt(categoryRule, detailCategoryContext) {
    const normalizedRule = normalizeMultilineText(categoryRule);
    const normalizedCategoryContext = normalizeMultilineText(detailCategoryContext);
    if (!normalizeText(normalizedRule) && !normalizeText(normalizedCategoryContext)) {
      return '';
    }
    return [
      normalizedCategoryContext ? `当前视频品类信息：\n${normalizedCategoryContext}` : '',
      normalizedCategoryContext ? '请先看当前二级品类是什么；只有“规则内容”里出现对应二级分类段落时，才优先参考该段落。' : '',
      normalizedCategoryContext ? '如果“规则内容”里没有完全同名的二级分类段落，再参考当前一级品类下的其他规则。' : '',
      normalizedRule ? '“规则补充”是当前品类的通用补充，不按二级品类拆分，判断时始终一起参考。' : '',
      normalizedRule ? '以下是当前规则文件中的标准化规则。' : '',
      normalizedRule ? '必须把这些规则作为本次判断的额外要求。' : '',
      normalizedRule ? '' : '',
      normalizedRule
    ].filter((line) => line !== '').join('\n');
  }

  function buildDetailCategoryContext(primaryCategory, secondaryCategory, rawCategoryText) {
    const primary = normalizeText(primaryCategory);
    const secondary = normalizeText(secondaryCategory);
    const rawText = normalizeText(rawCategoryText);
    if (!primary && !secondary && !rawText) {
      return '';
    }
    return [
      primary ? `一级品类：${primary}` : '',
      secondary ? `二级品类：${secondary}` : '',
      rawText ? `页面品类原文：${rawText}` : ''
    ].filter(Boolean).join('\n');
  }

  function splitCategoryPathText(value) {
    const normalized = normalizeText(value);
    if (!normalized) {
      return [];
    }
    const tokens = normalized
      .split(/\s*(?:\/|>|›|»|→|->|，|,|、|\n)\s*/g)
      .map((item) => normalizeText(item))
      .filter(Boolean);
    return tokens.length ? tokens : [normalized];
  }

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function isVisible(element) {
    if (!element || !element.isConnected) {
      return false;
    }
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
      return false;
    }
    return element.getClientRects().length > 0;
  }

  function formatClock(value) {
    const date = value instanceof Date ? value : new Date();
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  function formatDisplayDate(dateString) {
    const [year, month, day] = dateString.split('-').map((part) => Number(part));
    return `${year}/${month}/${day}`;
  }

  function formatDateTime(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }

  function formatInputDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getQuarterCutoffDateString(referenceValue) {
    const date = referenceValue instanceof Date ? new Date(referenceValue) : new Date(referenceValue || Date.now());
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() - 3);
    return formatInputDate(date);
  }

  function isDateExpiredByQuarter(dateString, cutoffDateString) {
    const normalizedDate = normalizeText(dateString);
    return Boolean(normalizedDate && cutoffDateString && normalizedDate < cutoffDateString);
  }

  function getYesterdayDateString() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 1);
    return formatInputDate(date);
  }

  function getTodayDateString() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return formatInputDate(date);
  }

  /* ========================= 页面工具 ========================= */

  function buildDateList(startDateString, endDateString) {
    const startDate = normalizeText(startDateString);
    const endDate = normalizeText(endDateString) || startDate;
    if (!startDate || !endDate || endDate < startDate) {
      return [];
    }
    const [startYear, startMonth, startDay] = startDate.split('-').map((part) => Number(part));
    const [endYear, endMonth, endDay] = endDate.split('-').map((part) => Number(part));
    const cursor = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    const last = new Date(endYear, endMonth - 1, endDay, 0, 0, 0, 0);
    const dates = [];
    while (cursor <= last) {
      dates.push(formatInputDate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }

  function buildDateRange(dateString) {
    const [year, month, day] = dateString.split('-').map((part) => Number(part));
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
    return { start, end };
  }

  function calculateRatio(numerator, denominator) {
    if (!denominator) {
      return 0;
    }
    return numerator / denominator;
  }

  function getCategoryEntry(candidate) {
    if (!candidate && candidate !== '') {
      return null;
    }
    if (typeof candidate === 'object' && candidate.key && CATEGORY_ENTRY_MAP.has(candidate.key)) {
      return CATEGORY_ENTRY_MAP.get(candidate.key);
    }
    const token = normalizeText(candidate);
    if (!token) {
      return null;
    }
    return CATEGORY_ENTRY_MAP.get(token) || null;
  }

  function getSubgroupEntry(candidate) {
    if (!candidate && candidate !== '') {
      return null;
    }
    if (typeof candidate === 'object' && candidate.id && SUBGROUP_ENTRY_MAP.has(candidate.id)) {
      return SUBGROUP_ENTRY_MAP.get(candidate.id);
    }
    const token = normalizeText(candidate);
    if (!token) {
      return null;
    }
    return SUBGROUP_ENTRY_MAP.get(token) || null;
  }

  function normalizeSelectedKeys(rawValues) {
    const rawList = Array.isArray(rawValues) ? rawValues : [];
    const matchedKeys = new Set();
    for (const value of rawList) {
      const entry = getCategoryEntry(value);
      if (entry) {
        matchedKeys.add(entry.key);
      }
    }
    return CATEGORY_ENTRIES
      .filter((entry) => matchedKeys.has(entry.key))
      .map((entry) => entry.key);
  }

  function normalizeSelectedGroupIds(rawValues) {
    const rawList = Array.isArray(rawValues) ? rawValues : [];
    const matchedIds = [];
    for (const value of rawList) {
      const subgroupEntry = getSubgroupEntry(value);
      if (subgroupEntry) {
        matchedIds.push(subgroupEntry.id);
      }
    }
    const lastMatchedId = matchedIds.length ? matchedIds[matchedIds.length - 1] : '';
    return lastMatchedId && SUBGROUP_ENTRY_MAP.has(lastMatchedId) ? [lastMatchedId] : [];
  }

  function getEntriesByKeys(keys) {
    const selected = new Set(normalizeSelectedKeys(keys));
    return CATEGORY_ENTRIES.filter((entry) => selected.has(entry.key));
  }

  function getSubgroupEntriesByIds(groupIds) {
    const selected = new Set(normalizeSelectedGroupIds(groupIds));
    return SUBGROUP_ENTRIES.filter((entry) => selected.has(entry.id));
  }

  function getEntriesByGroupIds(groupIds) {
    const selected = new Set(normalizeSelectedGroupIds(groupIds));
    return CATEGORY_ENTRIES.filter((entry) => selected.has(entry.subgroupId));
  }

  function createEmptyResult(category) {
    const entry = getCategoryEntry(category);
    return {
      key: entry ? entry.key : normalizeText(category),
      category: entry ? entry.exportLabel : normalizeText(category),
      label: entry ? entry.exportLabel : normalizeText(category),
      groupLabel: entry ? entry.groupLabel : '',
      subgroupLabel: entry ? entry.subgroupLabel : '',
      theme: entry ? entry.theme : 'information',
      inboundCount: 0,
      stdPassCount: 0,
      stdRejectCount: 0,
      stdTotalCount: 0,
      stdRejectRate: 0,
      qcPassCount: 0,
      qcRejectCount: 0,
      qcTotalCount: 0,
      qcRejectRate: 0,
      collectionCompleted: false
    };
  }

  function normalizeStoredResultRow(rawRow) {
    const entry = getCategoryEntry(rawRow && rawRow.key);
    if (!rawRow || typeof rawRow !== 'object' || !entry) {
      return null;
    }
    return {
      ...createEmptyResult(entry),
      inboundCount: Number(rawRow.inboundCount || 0),
      stdPassCount: Number(rawRow.stdPassCount || 0),
      stdRejectCount: Number(rawRow.stdRejectCount || 0),
      stdTotalCount: Number(rawRow.stdTotalCount || 0),
      stdRejectRate: Number(rawRow.stdRejectRate || 0),
      qcPassCount: Number(rawRow.qcPassCount || 0),
      qcRejectCount: Number(rawRow.qcRejectCount || 0),
      qcTotalCount: Number(rawRow.qcTotalCount || 0),
      qcRejectRate: Number(rawRow.qcRejectRate || 0),
      collectionCompleted: rawRow.collectionCompleted === true
    };
  }

  function isReusableCachedResult(result) {
    return Boolean(result && result.collectionCompleted === true);
  }

  function isSupportedPage() {
    if (location.hostname !== 'std.video.cloud.cctv.com') {
      return false;
    }
    return isListPage() || isDetailPage();
  }

  function isYangshipinMediaWorkerPage() {
    return ['yangshipin.cn', 'www.yangshipin.cn', 'm.yangshipin.cn', 'w.yangshipin.cn'].includes(location.hostname)
      && location.pathname.startsWith('/video')
      && Boolean(getStandardizationMediaWorkerRequestIdFromLocation());
  }

  function getYangshipinPageWindow() {
    if (typeof unsafeWindow === 'object' && unsafeWindow) {
      return unsafeWindow;
    }
    return null;
  }

  function getYangshipinRequestUrl(input) {
    if (typeof input === 'string') {
      return input;
    }
    if (input && typeof input.url === 'string') {
      return input.url;
    }
    return '';
  }

  function isYangshipinVideoInfoRequestUrl(url) {
    const requestUrl = normalizeText(url);
    if (!requestUrl) {
      return false;
    }
    try {
      return new URL(requestUrl, location.href).pathname === YANGSHIPIN_VIDEO_INFO_API_PATH;
    } catch (error) {
      return false;
    }
  }

  function captureYangshipinVideoInfoResponse(responseText) {
    const normalizedResponseText = String(responseText || '').trim();
    if (!normalizedResponseText) {
      return;
    }
    latestYangshipinVideoInfoResponse = {
      responseText: normalizedResponseText,
      receivedAt: Date.now()
    };
    yangshipinVideoInfoResponseListeners.slice().forEach((listener) => {
      try {
        listener(latestYangshipinVideoInfoResponse);
      } catch (error) {
        // ignore listener errors
      }
    });
  }

  function installYangshipinVideoInfoCaptureHook() {
    if (!isYangshipinMediaWorkerPage()) {
      return;
    }
    const pageWindow = getYangshipinPageWindow();
    if (!pageWindow || pageWindow.__YSP_STANDARDIZATION_VIDEO_INFO_CAPTURE__) {
      return;
    }
    pageWindow.__YSP_STANDARDIZATION_VIDEO_INFO_CAPTURE__ = true;

    const originalFetch = pageWindow.fetch;
    if (typeof originalFetch === 'function') {
      pageWindow.fetch = function patchedYangshipinVideoInfoFetch(input, init) {
        const requestUrl = getYangshipinRequestUrl(input);
        const responsePromise = originalFetch.apply(this, arguments);
        if (isYangshipinVideoInfoRequestUrl(requestUrl)) {
          responsePromise.then((response) => {
            if (!response || typeof response.clone !== 'function') {
              return;
            }
            response.clone().text()
              .then(captureYangshipinVideoInfoResponse)
              .catch(() => undefined);
          }).catch(() => undefined);
        }
        return responsePromise;
      };
    }

    const xhrPrototype = pageWindow.XMLHttpRequest && pageWindow.XMLHttpRequest.prototype;
    if (xhrPrototype && typeof xhrPrototype.open === 'function' && typeof xhrPrototype.send === 'function') {
      const originalOpen = xhrPrototype.open;
      const originalSend = xhrPrototype.send;
      xhrPrototype.open = function patchedYangshipinVideoInfoXhrOpen(method, url) {
        this.__yspStandardizationVideoInfoUrl = getYangshipinRequestUrl(url);
        return originalOpen.apply(this, arguments);
      };
      xhrPrototype.send = function patchedYangshipinVideoInfoXhrSend() {
        if (isYangshipinVideoInfoRequestUrl(this.__yspStandardizationVideoInfoUrl)) {
          this.addEventListener('load', () => {
            try {
              captureYangshipinVideoInfoResponse(this.responseText);
            } catch (error) {
              // ignore unreadable xhr response
            }
          });
        }
        return originalSend.apply(this, arguments);
      };
    }
  }

  function isListPage() {
    return location.pathname.startsWith('/stdList');
  }

  function getStandardizationListPageUrl() {
    return `${location.origin}/stdList`;
  }

  function isDetailPage() {
    return location.pathname.startsWith('/stdDetail/');
  }

  async function waitForBodyReady(timeoutMs) {
    return waitFor(() => document.body, timeoutMs || 15000, '页面主体未准备完成');
  }

  function createMouseEvent(type, init) {
    return new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      ...(init || {})
    });
  }

  function createKeyboardEvent(type, init) {
    return new KeyboardEvent(type, {
      bubbles: true,
      ...(init || {})
    });
  }

  async function storageGet(keys) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    const result = {};
    for (const key of keyList) {
      result[key] = GM_getValue(key);
    }
    return result;
  }

  async function storageSet(values) {
    for (const [key, value] of Object.entries(values)) {
      GM_setValue(key, value);
    }
  }

  async function storageSetCached(values) {
    await storageSet(values);
  }

  async function storageRemove(keys) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const key of keyList) {
      GM_deleteValue(key);
    }
  }

  async function storageListKeys() {
    return GM_listValues();
  }

  async function clearNonConfigCacheStorage() {
    const cachePrefixes = [
      STORAGE_KEYS.workerRequestPrefix,
      STORAGE_KEYS.workerResponsePrefix,
      STORAGE_KEYS.workerProgressPrefix,
      STORAGE_KEYS.workerStopPrefix,
      STORAGE_KEYS.mediaWorkerRequestPrefix,
      STORAGE_KEYS.mediaWorkerResponsePrefix
    ];
    const keys = await storageListKeys();
    const cacheKeys = keys.filter((key) => {
      const text = normalizeText(key);
      return text === STORAGE_KEYS.checkpoint
        || text === STORAGE_KEYS.seenTaskIds
        || cachePrefixes.some((prefix) => text.startsWith(prefix));
    });
    if (cacheKeys.length) {
      await storageRemove(cacheKeys);
    }
  }

  function triggerMouseClick(element) {
    element.scrollIntoView({ block: 'center', inline: 'center' });
    const events = ['mouseover', 'mousedown', 'mouseup', 'click'];
    for (const type of events) {
      element.dispatchEvent(createMouseEvent(type));
    }
  }

  async function waitFor(checker, timeoutMs, message, options) {
    const cancelCheck = options && typeof options.cancelCheck === 'function' ? options.cancelCheck : null;
    const cancelMessage = normalizeText(options && options.cancelMessage) || '任务已结束';
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (cancelCheck && cancelCheck()) {
        throw new Error(cancelMessage);
      }
      const result = checker();
      if (result) {
        return result;
      }
      await sleep(200);
    }
    throw new Error(message);
  }

  function getAllButtons() {
    return Array.from(document.querySelectorAll('button')).filter(isVisible);
  }

  function findButtonByText(text) {
    return getAllButtons().find((button) => normalizeText(button.textContent) === text) || null;
  }

  function getFormItems() {
    return Array.from(document.querySelectorAll('.el-form-item'));
  }

  function getFormItemByLabel(labelText) {
    return getFormItems().find((item) => {
      const label = item.querySelector('.el-form-item__label');
      return label && normalizeText(label.textContent) === labelText;
    }) || null;
  }

  function getSelectWrapperByLabel(labelText, index) {
    const item = getFormItemByLabel(labelText);
    if (!item) {
      return null;
    }
    const wrappers = Array.from(item.querySelectorAll('.el-select__wrapper')).filter(isVisible);
    return wrappers[index || 0] || null;
  }

  function getCategoryWrapper(level) {
    const item = getFormItemByLabel('品类选择');
    if (!item) {
      return null;
    }
    const wrappers = Array.from(item.querySelectorAll('.el-select__wrapper')).filter(isVisible);
    return wrappers[level] || null;
  }

  function getSelectedTextFromWrapper(wrapper) {
    if (!wrapper) {
      return '';
    }
    const selected = wrapper.querySelector('.el-select__selected-item span');
    return normalizeText(selected ? selected.textContent : wrapper.textContent);
  }

  function getVisibleSelectDropdowns() {
    return Array.from(document.querySelectorAll('.el-select-dropdown, .el-popper'))
      .filter((element) => isVisible(element) && element.querySelector('.el-select-dropdown__item'));
  }

  function getDropdownOptions(dropdown) {
    return Array.from(dropdown.querySelectorAll('.el-select-dropdown__item')).filter(isVisible);
  }

  async function openDropdownForOption(wrapper, optionText, cancelCheck) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      triggerMouseClick(wrapper);
      const dropdown = await waitFor(() => {
        const candidates = getVisibleSelectDropdowns();
        return candidates.find((candidate) => {
          return getDropdownOptions(candidate).some((option) => normalizeText(option.textContent) === optionText);
        });
      }, 4000, `未找到可选内容：${optionText}`, { cancelCheck });
      if (dropdown) {
        return dropdown;
      }
    }
    throw new Error(`无法展开选项：${optionText}`);
  }

  async function selectOption(wrapper, optionText, cancelCheck) {
    if (getSelectedTextFromWrapper(wrapper) === optionText) {
      return;
    }
    const dropdown = await openDropdownForOption(wrapper, optionText, cancelCheck);
    const option = getDropdownOptions(dropdown).find((item) => {
      return normalizeText(item.textContent) === optionText && !item.classList.contains('is-disabled');
    });
    if (!option) {
      throw new Error(`未找到选项：${optionText}`);
    }
    triggerMouseClick(option);
    await waitFor(() => getSelectedTextFromWrapper(wrapper) === optionText, 4000, `选项未生效：${optionText}`, { cancelCheck });
  }

  function setNativeInputValue(input, value) {
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    descriptor.set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function setDateRange(labelText, startDate, endDate, cancelCheck) {
    const item = getFormItemByLabel(labelText);
    if (!item) {
      throw new Error(`未找到日期设置：${labelText}`);
    }
    const inputs = Array.from(item.querySelectorAll('input.el-range-input')).filter(isVisible);
    if (inputs.length < 2) {
      throw new Error(`日期设置暂时不可用：${labelText}`);
    }
    const startValue = formatDateTime(startDate);
    const endValue = formatDateTime(endDate);
    inputs[0].focus();
    setNativeInputValue(inputs[0], startValue);
    inputs[0].blur();
    await sleep(120);
    inputs[1].focus();
    setNativeInputValue(inputs[1], endValue);
    inputs[1].dispatchEvent(createKeyboardEvent('keydown', { key: 'Enter' }));
    inputs[1].dispatchEvent(createKeyboardEvent('keyup', { key: 'Enter' }));
    inputs[1].blur();
    document.body.dispatchEvent(createMouseEvent('click'));
    await waitFor(() => inputs[0].value === startValue && inputs[1].value === endValue, 4000, `${labelText} 未写入成功`, { cancelCheck });
  }

  function getVisibleLoadingMask() {
    return Array.from(document.querySelectorAll('.el-loading-mask, .vxe-loading')).find(isVisible) || null;
  }

  function getTopResultCount() {
    const wrappers = Array.from(document.querySelectorAll('.vxe-tools--wrapper, .vxe-toolbar'));
    for (const wrapper of wrappers) {
      const text = normalizeText(wrapper.textContent);
      const match = text.match(/共\s*([\d,]+)\s*个结果/);
      if (match) {
        return Number(match[1].replace(/,/g, ''));
      }
    }
    return null;
  }

  async function clickQueryAndReadCount(cancelCheck) {
    const queryButton = findButtonByText('查询');
    if (!queryButton) {
      throw new Error('页面还在加载，请稍后再试');
    }
    triggerMouseClick(queryButton);
    const startedAt = Date.now();
    let stableValue = null;
    let stableSince = 0;
    while (Date.now() - startedAt < QUERY_TIMEOUT) {
      if (cancelCheck && cancelCheck()) {
        throw new Error('任务已结束');
      }
      const loading = getVisibleLoadingMask();
      const current = getTopResultCount();
      const enoughWait = Date.now() - startedAt > 800;
      if (!loading && enoughWait && typeof current === 'number') {
        if (stableValue === current) {
          if (!stableSince) {
            stableSince = Date.now();
          }
          if (Date.now() - stableSince >= 1200) {
            return current;
          }
        } else {
          stableValue = current;
          stableSince = Date.now();
        }
      }
      await sleep(250);
    }
    throw new Error('查询结果读取超时');
  }

  async function clickResetButton() {
    const resetButton = findButtonByText('重置');
    if (!resetButton) {
      throw new Error('页面还在加载，请稍后再试');
    }
    triggerMouseClick(resetButton);
    await sleep(600);
  }

  async function waitForPageReady(cancelCheck) {
    await waitFor(() => {
      return findButtonByText('查询')
        && findButtonByText('重置')
        && getCategoryWrapper(0)
        && getFormItemByLabel('创建时间')
        && getFormItemByLabel('修改时间');
    }, PAGE_READY_TIMEOUT, '页面还在加载，请稍后再试', { cancelCheck });
  }

  async function waitForStandardizationListApiReady(cancelCheck) {
    await waitFor(() => {
      return getStdAdminToken() && getStdVueUserId();
    }, PAGE_READY_TIMEOUT, '标准化系统登录信息还在加载，请稍后再试', { cancelCheck });
  }

  function createRuntimeToken(prefix) {
    return `${prefix || 'ysp'}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  async function markPendingStandardizationStart() {
    await storageSetCached({
      [STORAGE_KEYS.pendingStart]: {
        id: createRuntimeToken('start'),
        sourceTabId: CURRENT_TAB_ID,
        createdAt: Date.now()
      }
    });
  }

  async function consumePendingStandardizationStart() {
    const state = await storageGet(STORAGE_KEYS.pendingStart);
    const pendingStart = state[STORAGE_KEYS.pendingStart];
    if (!pendingStart || typeof pendingStart !== 'object') {
      return null;
    }
    await storageRemove(STORAGE_KEYS.pendingStart);
    const createdAt = Number(pendingStart.createdAt) || 0;
    if (!createdAt || Date.now() - createdAt > 60000) {
      return null;
    }
    return pendingStart;
  }

  async function requestCloseOtherStandardizationTabs() {
    await storageSetCached({
      [STORAGE_KEYS.closeTabsSignal]: {
        id: createRuntimeToken('close-tabs'),
        sourceTabId: CURRENT_TAB_ID,
        createdAt: Date.now()
      }
    });
  }

  async function closeCurrentTabForStandardizationStart() {
    await closeCurrentWorkerPage();
  }

  async function handleCloseOtherTabsSignal() {
    if (location.hostname !== 'std.video.cloud.cctv.com' && !isYangshipinMediaWorkerPage()) {
      return;
    }
    const state = await storageGet(STORAGE_KEYS.closeTabsSignal);
    const signal = state[STORAGE_KEYS.closeTabsSignal];
    if (!signal || typeof signal !== 'object') {
      return;
    }
    const signalId = normalizeText(signal.id);
    const sourceTabId = normalizeText(signal.sourceTabId);
    const createdAt = Number(signal.createdAt) || 0;
    if (!signalId || signalId === lastHandledCloseTabsSignalId) {
      return;
    }
    lastHandledCloseTabsSignalId = signalId;
    if (sourceTabId === CURRENT_TAB_ID || !createdAt || createdAt < CURRENT_TAB_OPENED_AT || Date.now() - createdAt > 30000) {
      return;
    }
    await closeCurrentTabForStandardizationStart();
  }

  function startCloseTabsSignalWatcher() {
    if (closeTabsSignalWatcher) {
      return;
    }
    closeTabsSignalWatcher = window.setInterval(() => {
      handleCloseOtherTabsSignal().catch(() => undefined);
    }, 600);
    handleCloseOtherTabsSignal().catch(() => undefined);
  }

  function openUrlInNewTab(url) {
    const openedWindow = window.open(url, '_blank');
    if (openedWindow) {
      return openedWindow;
    }
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.click();
    return null;
  }

  function buildStandardizationWorkerRequestKey(requestId) {
    return `${STORAGE_KEYS.workerRequestPrefix}${requestId}`;
  }

  function buildStandardizationWorkerResponseKey(requestId) {
    return `${STORAGE_KEYS.workerResponsePrefix}${requestId}`;
  }

  function buildStandardizationWorkerProgressKey(requestId) {
    return `${STORAGE_KEYS.workerProgressPrefix}${requestId}`;
  }

  function buildStandardizationWorkerStopKey(requestId) {
    return `${STORAGE_KEYS.workerStopPrefix}${requestId}`;
  }

  function buildStandardizationMediaWorkerRequestKey(requestId) {
    return `${STORAGE_KEYS.mediaWorkerRequestPrefix}${requestId}`;
  }

  function buildStandardizationMediaWorkerResponseKey(requestId) {
    return `${STORAGE_KEYS.mediaWorkerResponsePrefix}${requestId}`;
  }

  function getStandardizationWorkerRequestIdFromLocation() {
    const params = new URLSearchParams(location.search);
    return normalizeText(params.get('ysp_standardization_request'));
  }

  function getStandardizationMediaWorkerRequestIdFromLocation() {
    const params = new URLSearchParams(location.search);
    return normalizeText(params.get('ysp_media_request'));
  }

  function formatUserVisibleLogText(value) {
    const rawText = normalizeText(value);
    if (!rawText) {
      return '';
    }
    const timeMatch = rawText.match(/^(\[\d{2}:\d{2}:\d{2}\]\s*)(.*)$/);
    const timePrefix = timeMatch ? timeMatch[1] : '';
    let text = timeMatch ? normalizeText(timeMatch[2]) : rawText;
    if (!text) {
      return timePrefix.trim();
    }
    text = text
      .replace(/https?:\/\/[^\s)）]+/gi, '视频播放地址')
      .replace(/^([a-z0-9_-]{8,})：/i, '视频 $1：')
      .replace(/视频\s*VID/gi, '视频编号')
      .replace(/\bVID\b/gi, '视频编号')
      .replace(/APIKEY\s*页/gi, '密钥页')
      .replace(/第\s*2\s*页\s*APIKEY/gi, '第 2 页密钥')
      .replace(/第\s*3\s*页\s*APIKEY/gi, '第 3 页密钥')
      .replace(/ARK_API_KEY|ARKAPIKEY/gi, '密钥')
      .replace(/API\s*Key/gi, '密钥')
      .replace(/JSON/gi, '内容格式')
      .replace(/接口/g, '页面数据')
      .replace(/请求/g, '连接')
      .replace(/响应/g, '返回')
      .replace(/模型/g, 'AI');
    return `${timePrefix}${text}`;
  }

  function formatTaskLogPrefix(taskId) {
    const normalizedTaskId = normalizeText(taskId);
    return normalizedTaskId ? `视频 ${normalizedTaskId}` : '';
  }

  function normalizeProgressLogLines(lines) {
    return Array.isArray(lines)
      ? lines.map((line) => formatUserVisibleLogText(line)).filter(Boolean)
      : [];
  }

  function createLogEntry(message) {
    return `[${formatClock()}] ${formatUserVisibleLogText(message)}`;
  }

  function getLogEntryMessage(entry) {
    const normalized = normalizeText(entry);
    if (!normalized) {
      return '';
    }
    const match = normalized.match(/^\[\d{2}:\d{2}:\d{2}\]\s*(.*)$/);
    return normalizeText(match ? match[1] : normalized);
  }

  function mergeLogEntries(existingLogs, messages) {
    const nextLogs = Array.isArray(existingLogs) ? existingLogs.slice(-MAX_LOGS) : [];
    const incomingMessages = Array.isArray(messages)
      ? messages.map((message) => formatUserVisibleLogText(message)).filter(Boolean)
      : [];
    for (const message of incomingMessages) {
      if (getLogEntryMessage(nextLogs[nextLogs.length - 1]) === message) {
        continue;
      }
      nextLogs.push(createLogEntry(message));
    }
    return nextLogs.slice(-MAX_LOGS);
  }

  function getResponseProgressToken(progress) {
    return normalizeText(progress && progress.updatedAt) || normalizeText(progress && progress.text);
  }

  async function updateStandardizationWorkerProgress(requestId, progressOrText) {
    const normalizedRequestId = normalizeText(requestId);
    const progress = progressOrText && typeof progressOrText === 'object'
      ? progressOrText
      : { text: progressOrText };
    const normalizedText = formatUserVisibleLogText(progress.text);
    const logLines = normalizeProgressLogLines(progress.logLines);
    if (!normalizedRequestId || (!normalizedText && !logLines.length)) {
      return;
    }
    await storageSetCached({
      [buildStandardizationWorkerProgressKey(normalizedRequestId)]: {
        text: normalizedText,
        logLines,
        updatedAt: new Date().toISOString()
      }
    });
  }

  async function requestStandardizationWorkerStop(requestId) {
    const normalizedRequestId = normalizeText(requestId);
    if (!normalizedRequestId) {
      return;
    }
    await storageSetCached({
      [buildStandardizationWorkerStopKey(normalizedRequestId)]: { stopped: true }
    });
  }

  async function clearStandardizationWorkerStopSignal(requestId) {
    const normalizedRequestId = normalizeText(requestId);
    if (!normalizedRequestId) {
      return;
    }
    await storageRemove(buildStandardizationWorkerStopKey(normalizedRequestId));
  }

  async function syncStandardizationWorkerStopState(requestId) {
    const normalizedRequestId = normalizeText(requestId);
    if (!normalizedRequestId) {
      return false;
    }
    const state = await storageGet(buildStandardizationWorkerStopKey(normalizedRequestId));
    const stopSignal = state[buildStandardizationWorkerStopKey(normalizedRequestId)];
    const stopped = Boolean(stopSignal && typeof stopSignal === 'object');
    JOB_ABORT_CONTROLLER.standardizationWorkerStopped = stopped;
    return stopped;
  }

  function stopStandardizationWorkerAbortWatcher() {
    if (JOB_ABORT_CONTROLLER.standardizationWorkerStopWatcher) {
      window.clearInterval(JOB_ABORT_CONTROLLER.standardizationWorkerStopWatcher);
      JOB_ABORT_CONTROLLER.standardizationWorkerStopWatcher = 0;
    }
    JOB_ABORT_CONTROLLER.standardizationWorkerStopped = false;
    JOB_ABORT_CONTROLLER.standardizationWorkerRequestId = '';
  }

  function startStandardizationWorkerAbortWatcher(requestId) {
    stopStandardizationWorkerAbortWatcher();
    const normalizedRequestId = normalizeText(requestId);
    if (!normalizedRequestId) {
      return;
    }
    JOB_ABORT_CONTROLLER.standardizationWorkerRequestId = normalizedRequestId;
    JOB_ABORT_CONTROLLER.standardizationWorkerStopWatcher = window.setInterval(() => {
      syncStandardizationWorkerStopState(normalizedRequestId).catch(() => undefined);
    }, 250);
  }

  async function ensureStandardizationWorkerNotStopped(requestId) {
    if (JOB_ABORT_CONTROLLER.standardizationWorkerRequestId === normalizeText(requestId) && JOB_ABORT_CONTROLLER.standardizationWorkerStopped) {
      throw new Error('任务已结束');
    }
    if (await syncStandardizationWorkerStopState(requestId)) {
      throw new Error('任务已结束');
    }
  }

  function normalizeTagDisplayName(rawValue) {
    if (rawValue && typeof rawValue === 'object') {
      return normalizeText(
        rawValue.name
        || rawValue.keyword
        || rawValue.label
        || rawValue.rawText
        || rawValue.text
      );
    }
    const text = normalizeText(rawValue);
    if (!text) {
      return '';
    }
    const parts = text.split('|');
    return normalizeText(parts[parts.length - 1] || text);
  }

  function splitTagDetailTokens(rawValue) {
    return String(rawValue || '')
      .split(/[\n|]/)
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  function normalizeTagDetail(value) {
    if (!value) {
      return null;
    }
    let rawText = '';
    let name = '';
    let type = '';
    let id = '';
    let remark = '';

    if (typeof value === 'string') {
      rawText = value;
    } else if (typeof value === 'object') {
      rawText = value.rawText || value.raw_text || value.text || value.label || value.displayText || '';
      name = normalizeText(value.name || value.tagName || value.tag_name || value.keyword);
      type = normalizeText(value.type || value.tagType || value.tag_type);
      id = normalizeText(value.id || value.tagId || value.tag_id || value.optionId || value.option_id);
      remark = normalizeText(value.remark || value.note || value.memo || value.description || value.tagRemark || value.tag_remark);
    } else {
      rawText = String(value);
    }

    const unresolvedTokens = [];
    splitTagDetailTokens(rawText).forEach((token) => {
      const nameMatch = token.match(/^(?:标签名|名称|名字)[:：]\s*(.+)$/i);
      if (nameMatch && nameMatch[1]) {
        name = name || normalizeText(nameMatch[1]);
        return;
      }
      const typeMatch = token.match(/^(?:类型|标签类型|分类)[:：]\s*(.+)$/i);
      if (typeMatch && typeMatch[1]) {
        type = type || normalizeText(typeMatch[1]);
        return;
      }
      const idMatch = token.match(/^(?:标签ID|tag[-_\s]*id|ID|id)[:：#\s]*(.+)$/i);
      if (idMatch && idMatch[1]) {
        id = id || normalizeText(idMatch[1]);
        return;
      }
      const remarkMatch = token.match(/^(?:备注|说明|描述|别名)[:：]\s*(.+)$/i);
      if (remarkMatch && remarkMatch[1]) {
        remark = remark || normalizeText(remarkMatch[1]);
        return;
      }
      unresolvedTokens.push(token);
    });

    if (!name && unresolvedTokens.length) {
      name = normalizeTagDisplayName(unresolvedTokens[unresolvedTokens.length - 1]);
    }
    const remainingTokens = unresolvedTokens.filter((token) => token !== name);
    if (!id) {
      const idIndex = remainingTokens.findIndex((token) => {
        return /^[A-Za-z0-9_-]{4,}$/.test(token) || /^\d{4,}$/.test(token);
      });
      if (idIndex >= 0) {
        id = normalizeText(remainingTokens.splice(idIndex, 1)[0]);
      }
    }
    if (!type && remainingTokens.length) {
      type = normalizeText(remainingTokens.shift());
    }
    if (!remark && remainingTokens.length) {
      remark = normalizeText(remainingTokens.join(' | '));
    }

    const normalizedRawText = normalizeText(rawText) || normalizeText([name, type, id, remark].filter(Boolean).join(' | '));
    if (!name && normalizedRawText) {
      name = normalizeTagDisplayName(normalizedRawText);
    }
    if (!name && !type && !id && !remark && !normalizedRawText) {
      return null;
    }
    return {
      name,
      type,
      id,
      remark,
      rawText: normalizedRawText
    };
  }

  function normalizeTagDetailArray(value) {
    const source = Array.isArray(value)
      ? value
      : (value ? [value] : []);
    const result = [];
    const seen = new Set();
    source.forEach((item) => {
      const detail = normalizeTagDetail(item);
      if (!detail) {
        return;
      }
      const key = [
        detail.name,
        detail.type,
        detail.id,
        detail.remark,
        detail.rawText
      ].map((part) => normalizeText(part)).join('|');
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      result.push(detail);
    });
    return result;
  }

  function formatTagDetailForDisplay(value) {
    const detail = normalizeTagDetail(value);
    if (!detail) {
      return '';
    }
    const label = detail.name || detail.rawText || '未命名标签';
    const meta = [];
    if (detail.type) {
      meta.push(`类型：${detail.type}`);
    }
    if (detail.id) {
      meta.push(`ID：${detail.id}`);
    }
    if (detail.remark) {
      meta.push(`备注：${detail.remark}`);
    }
    return meta.length ? `${label}（${meta.join('，')}）` : label;
  }

  function normalizeTagLookupText(value) {
    const text = normalizeText(value);
    if (!text) {
      return '';
    }
    const normalized = typeof text.normalize === 'function' ? text.normalize('NFKC') : text;
    return normalized
      .toLowerCase()
      .replace(/[\s"'`~!@#$%^&*()\-_=+\[\]{}\\|;:,.<>/?，。！？；：、（）【】《》“”‘’·]+/g, '');
  }

  function normalizeCsvHeaderName(value) {
    return normalizeText(value).replace(/\s+/g, '').toLowerCase();
  }

  function countCsvDelimiter(line, delimiter) {
    let count = 0;
    let inQuotes = false;
    const source = String(line || '');
    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      if (char === '"') {
        if (inQuotes && source[index + 1] === '"') {
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (!inQuotes && char === delimiter) {
        count += 1;
      }
    }
    return count;
  }

  function detectCsvDelimiter(text) {
    const firstLine = String(text || '').split(/\r?\n/, 1)[0] || '';
    const candidates = [',', '\t', ';'];
    let bestDelimiter = ',';
    let bestCount = -1;
    candidates.forEach((delimiter) => {
      const count = countCsvDelimiter(firstLine, delimiter);
      if (count > bestCount) {
        bestCount = count;
        bestDelimiter = delimiter;
      }
    });
    return bestDelimiter;
  }

  function parseCsvRows(text) {
    const source = String(text || '').replace(/^\uFEFF/, '');
    const delimiter = detectCsvDelimiter(source);
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      if (char === '"') {
        if (inQuotes && source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (!inQuotes && char === delimiter) {
        row.push(field);
        field = '';
        continue;
      }
      if (!inQuotes && (char === '\n' || char === '\r')) {
        row.push(field);
        if (row.some((cell) => normalizeText(cell))) {
          rows.push(row);
        }
        row = [];
        field = '';
        if (char === '\r' && source[index + 1] === '\n') {
          index += 1;
        }
        continue;
      }
      field += char;
    }

    row.push(field);
    if (row.some((cell) => normalizeText(cell))) {
      rows.push(row);
    }
    return rows;
  }

  function getCsvHeaderIndex(headers, names, fallbackIndex) {
    const normalizedNames = names.map(normalizeCsvHeaderName);
    const index = headers.findIndex((header) => normalizedNames.includes(normalizeCsvHeaderName(header)));
    return index >= 0 ? index : fallbackIndex;
  }

  function buildTagLibraryFromCsv(csvText) {
    const rows = parseCsvRows(csvText);
    if (!rows.length) {
      throw new Error('标签库为空');
    }
    const headers = rows[0] || [];
    const hasHeader = headers.some((header) => {
      return ['标签名', '标签名称', 'id', '标签id', '类型', '备注'].includes(normalizeCsvHeaderName(header));
    });
    const nameIndex = hasHeader ? getCsvHeaderIndex(headers, ['标签名', '标签名称', '名称', 'name', 'tag_name'], 0) : 0;
    const idIndex = hasHeader ? getCsvHeaderIndex(headers, ['ID', '标签ID', 'tag_id', 'id'], 1) : 1;
    const typeIndex = hasHeader ? getCsvHeaderIndex(headers, ['类型', '标签类型', 'type', 'tag_type'], 2) : 2;
    const remarkIndex = hasHeader ? getCsvHeaderIndex(headers, ['备注', '说明', 'remark', 'memo', 'description'], 3) : 3;
    const sourceRows = hasHeader ? rows.slice(1) : rows;
    const entries = [];
    const seen = new Set();

    sourceRows.forEach((row) => {
      const detail = normalizeTagDetail({
        name: row[nameIndex],
        id: row[idIndex],
        type: row[typeIndex],
        remark: row[remarkIndex]
      });
      if (!detail || !detail.name) {
        return;
      }
      const lookupName = normalizeTagLookupText(detail.name);
      if (!lookupName) {
        return;
      }
      const key = [lookupName, normalizeText(detail.id), normalizeTagLookupText(detail.type), normalizeTagLookupText(detail.remark)].join('|');
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      entries.push({
        name: detail.name,
        id: detail.id,
        type: detail.type,
        remark: detail.remark,
        rawText: detail.rawText,
        lookupName,
        lookupType: normalizeTagLookupText(detail.type),
        lookupRemark: normalizeTagLookupText(detail.remark),
        lookupId: normalizeText(detail.id).toLowerCase()
      });
    });

    if (!entries.length) {
      throw new Error('标签库没有可用标签');
    }

    const exactNameMap = new Map();
    entries.forEach((entry) => {
      const list = exactNameMap.get(entry.lookupName) || [];
      list.push(entry);
      exactNameMap.set(entry.lookupName, list);
    });
    return {
      entries,
      exactNameMap,
      count: entries.length
    };
  }

  function openTagLibraryDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(TAG_LIBRARY_IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(TAG_LIBRARY_IDB_STORE)) {
          db.createObjectStore(TAG_LIBRARY_IDB_STORE, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('标签库缓存打开失败'));
    });
  }

  async function readCachedTagLibraryRecord() {
    const db = await openTagLibraryDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TAG_LIBRARY_IDB_STORE, 'readonly');
      const store = transaction.objectStore(TAG_LIBRARY_IDB_STORE);
      const request = store.get(TAG_LIBRARY_CACHE_KEY);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error || new Error('标签库缓存读取失败'));
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        db.close();
        reject(transaction.error || new Error('标签库缓存读取失败'));
      };
    });
  }

  async function writeCachedTagLibraryCsv(text, fileName, count) {
    const db = await openTagLibraryDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TAG_LIBRARY_IDB_STORE, 'readwrite');
      const store = transaction.objectStore(TAG_LIBRARY_IDB_STORE);
      store.put({
        key: TAG_LIBRARY_CACHE_KEY,
        text,
        fileName: normalizeText(fileName),
        count: Math.max(0, Math.trunc(Number(count) || 0)),
        updatedAt: new Date().toISOString()
      });
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error || new Error('标签库缓存写入失败'));
      };
    });
  }

  async function clearCachedTagLibraryCsv() {
    const db = await openTagLibraryDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TAG_LIBRARY_IDB_STORE, 'readwrite');
      const store = transaction.objectStore(TAG_LIBRARY_IDB_STORE);
      store.clear();
      transaction.oncomplete = () => {
        db.close();
        TAG_LIBRARY_MEMORY_CACHE.library = null;
        TAG_LIBRARY_MEMORY_CACHE.loadingPromise = null;
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error || new Error('标签库缓存清理失败'));
      };
    });
  }

  function readFileAsArrayBuffer(file, errorMessage) {
    const failureMessage = normalizeText(errorMessage) || 'XLSX 文件读取失败';
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error(failureMessage));
      reader.readAsArrayBuffer(file);
    });
  }

  function getXlsxParser() {
    const parser = (typeof XLSX !== 'undefined' ? XLSX : null)
      || (typeof globalThis !== 'undefined' ? globalThis.XLSX : null)
      || window.XLSX
      || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.XLSX : null);
    if (!parser || typeof parser.read !== 'function' || !parser.utils) {
      throw new Error('XLSX 文件读取组件加载失败，请刷新页面后重试');
    }
    return parser;
  }

  function getWorkbookSheet(workbook, index, label, workbookLabel) {
    const sheetName = workbook && workbook.SheetNames ? workbook.SheetNames[index] : '';
    const sheet = sheetName ? workbook.Sheets[sheetName] : null;
    if (!sheet) {
      throw new Error(`${normalizeText(workbookLabel) || 'XLSX'} 缺少${label}`);
    }
    return {
      name: sheetName,
      sheet
    };
  }

  function worksheetToRows(xlsxParser, worksheet) {
    return xlsxParser.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false
    });
  }

  function buildCategoryRulesContentFromRows(rows) {
    if (!Array.isArray(rows) || rows.length < 2) {
      throw new Error('品类规则页至少需要表头和通用规则行');
    }
    const header = rows[0] || [];
    if (normalizeText(header[0]) !== '品类名' || normalizeText(header[1]) !== '规则内容' || normalizeText(header[2]) !== '规则补充') {
      throw new Error('品类规则页首行必须是：品类名、规则内容、规则补充');
    }
    const bodyRows = rows.slice(1);
    if (normalizeText(bodyRows[0] && bodyRows[0][0]) !== '通用') {
      throw new Error('品类规则页第二行第一列必须是：通用');
    }
    const allowedCategories = new Set(['通用', ...CATEGORY_ENTRIES.map((entry) => entry.exportLabel)]);
    const sections = [];
    let ruleCount = 0;
    bodyRows.forEach((row) => {
      const category = normalizeText(row && row[0]);
      if (!category) {
        return;
      }
      if (!allowedCategories.has(category)) {
        throw new Error(`品类规则页存在未支持的品类：${category}`);
      }
      const baseRule = normalizeMultilineText(row[1]);
      const extraRule = normalizeMultilineText(row[2]);
      const rule = normalizeMultilineText([
        baseRule ? `规则内容：\n${baseRule}` : '',
        extraRule ? `规则补充：\n${extraRule}` : ''
      ].filter(Boolean).join('\n\n'));
      if (normalizeText(rule)) {
        ruleCount += 1;
      }
      sections.push(`----${category}----\n${rule}`);
    });
    return {
      content: normalizeMultilineText(sections.join('\n\n')),
      ruleCount
    };
  }

  function readApiKeyFromRows(rows) {
    if (!Array.isArray(rows) || !rows.length) {
      throw new Error('密钥页为空');
    }
    for (const row of rows) {
      const keyName = normalizeText(row && row[0]).replace(/\s+/g, '').toUpperCase();
      if (keyName === 'ARK_API_KEY' || keyName === 'ARKAPIKEY') {
        const apiKey = normalizeText(row && row[1]);
        if (!apiKey) {
          throw new Error('密钥页里的密钥为空');
        }
        return apiKey;
      }
    }
    throw new Error('密钥页必须包含可用密钥');
  }

  async function saveUploadedConfigWorkbookFile(file) {
    if (!(file instanceof File)) {
      throw new Error('请选择核心配置 文件');
    }
    const fileName = normalizeText(file.name);
    if (!fileName.toLowerCase().endsWith('.xlsx')) {
      throw new Error('请上传 .xlsx 配置文件');
    }
    const xlsxParser = getXlsxParser();
    const arrayBuffer = await readFileAsArrayBuffer(file, '核心配置 文件读取失败');
    const workbook = xlsxParser.read(arrayBuffer, { type: 'array' });
    if (!workbook || !Array.isArray(workbook.SheetNames) || workbook.SheetNames.length < 2) {
      throw new Error('核心配置 至少需要 2 个工作表');
    }
    const tagSheet = getWorkbookSheet(workbook, 0, '第 1 页标签库', '核心配置');
    const apiSheet = getWorkbookSheet(workbook, 1, '第 2 页密钥', '核心配置');
    if (normalizeText(apiSheet.name).toUpperCase() !== 'APIKEY') {
      throw new Error('核心配置 第 2 页工作表名称必须是 APIKEY');
    }

    const tagCsvText = xlsxParser.utils.sheet_to_csv(tagSheet.sheet, {
      FS: ',',
      RS: '\n',
      blankrows: false
    });
    if (!normalizeText(tagCsvText)) {
      throw new Error('第 1 页标签库为空');
    }
    const tagLibrary = buildTagLibraryFromCsv(tagCsvText);
    const arkApiKey = readApiKeyFromRows(worksheetToRows(xlsxParser, apiSheet.sheet));

    await writeCachedTagLibraryCsv(tagCsvText, fileName, tagLibrary.count);
    TAG_LIBRARY_MEMORY_CACHE.library = tagLibrary;
    TAG_LIBRARY_MEMORY_CACHE.loadingPromise = null;
    return {
      fileName: fileName || '配置.xlsx',
      uploadedAt: new Date().toISOString(),
      tagLibraryCount: tagLibrary.count,
      arkApiKey
    };
  }

  async function saveUploadedRuleWorkbookFile(file) {
    if (!(file instanceof File)) {
      throw new Error('请选择规则配置 文件');
    }
    const fileName = normalizeText(file.name);
    if (!fileName.toLowerCase().endsWith('.xlsx')) {
      throw new Error('请上传 .xlsx 规则文件');
    }
    const xlsxParser = getXlsxParser();
    const arrayBuffer = await readFileAsArrayBuffer(file, '规则配置 文件读取失败');
    const workbook = xlsxParser.read(arrayBuffer, { type: 'array' });
    if (!workbook || !Array.isArray(workbook.SheetNames) || workbook.SheetNames.length < 1) {
      throw new Error('规则配置 至少需要 1 个工作表');
    }
    const ruleSheet = getWorkbookSheet(workbook, 0, '第 1 页品类规则', '规则配置');
    const ruleMeta = buildCategoryRulesContentFromRows(worksheetToRows(xlsxParser, ruleSheet.sheet));
    return {
      fileName: fileName || '规则.xlsx',
      uploadedAt: new Date().toISOString(),
      categoryRulesContent: ruleMeta.content,
      categoryRuleCount: ruleMeta.ruleCount
    };
  }

  async function loadTagLibrary() {
    if (TAG_LIBRARY_MEMORY_CACHE.library) {
      return TAG_LIBRARY_MEMORY_CACHE.library;
    }
    if (TAG_LIBRARY_MEMORY_CACHE.loadingPromise) {
      return TAG_LIBRARY_MEMORY_CACHE.loadingPromise;
    }
    TAG_LIBRARY_MEMORY_CACHE.loadingPromise = (async () => {
      const record = await readCachedTagLibraryRecord();
      const csvText = record && typeof record.text === 'string' ? record.text : '';
      if (!csvText) {
        throw new Error('请先在设置里上传核心配置文件');
      }
      const library = buildTagLibraryFromCsv(csvText);
      TAG_LIBRARY_MEMORY_CACHE.library = library;
      return library;
    })();
    try {
      return await TAG_LIBRARY_MEMORY_CACHE.loadingPromise;
    } finally {
      TAG_LIBRARY_MEMORY_CACHE.loadingPromise = null;
    }
  }

  function getSelectedTagLookupState(selectedTags) {
    const names = new Set();
    const ids = new Set();
    normalizeTagDetailArray(selectedTags).forEach((tag) => {
      const lookupName = normalizeTagLookupText(tag.name);
      const id = normalizeText(tag.id).toLowerCase();
      if (lookupName) {
        names.add(lookupName);
      }
      if (id) {
        ids.add(id);
      }
    });
    return { names, ids };
  }

  function scoreTagLibraryEntry(entry, keyword, lookupKeyword) {
    if (!entry || !lookupKeyword) {
      return 0;
    }
    const rawKeyword = normalizeText(keyword).toLowerCase();
    if (entry.lookupId && rawKeyword && entry.lookupId === rawKeyword) {
      return 10000;
    }
    let score = 0;
    if (entry.lookupName === lookupKeyword) {
      score = 9500;
    } else if (entry.lookupName.startsWith(lookupKeyword)) {
      score = 8200;
    } else if (entry.lookupName.includes(lookupKeyword)) {
      score = 7600;
    } else if (lookupKeyword.includes(entry.lookupName) && entry.lookupName.length >= 2) {
      score = 6800;
    } else if (entry.lookupRemark.includes(lookupKeyword)) {
      score = 3600;
    } else if (entry.lookupType.includes(lookupKeyword)) {
      score = 2600;
    }
    if (!score) {
      return 0;
    }
    const lengthPenalty = Math.min(entry.lookupName.length, 80);
    const closeLengthBonus = entry.lookupName.length <= lookupKeyword.length + 4 ? 240 : 0;
    return score + closeLengthBonus - lengthPenalty;
  }

  function toPublicTagLibraryEntry(entry) {
    return {
      name: entry.name,
      id: entry.id,
      type: entry.type,
      remark: entry.remark,
      rawText: entry.rawText
    };
  }

  function searchTagLibraryOptions(library, keyword, selectedTags) {
    const lookupKeyword = normalizeTagLookupText(keyword);
    if (!library || !lookupKeyword) {
      return [];
    }
    const selected = getSelectedTagLookupState(selectedTags);
    const scored = [];
    const seen = new Set();
    const pushEntry = (entry, score) => {
      if (!entry || score <= 0) {
        return;
      }
      if (selected.names.has(entry.lookupName) || (entry.lookupId && selected.ids.has(entry.lookupId))) {
        return;
      }
      const key = [entry.lookupName, entry.lookupId, entry.lookupType, entry.lookupRemark].join('|');
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      scored.push({ entry, score });
    };

    (library.exactNameMap.get(lookupKeyword) || []).forEach((entry) => pushEntry(entry, 10000));
    library.entries.forEach((entry) => pushEntry(entry, scoreTagLibraryEntry(entry, keyword, lookupKeyword)));
    return scored
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return left.entry.name.length - right.entry.name.length;
      })
      .slice(0, TAG_LIBRARY_MAX_OPTIONS_PER_KEYWORD)
      .map((item) => toPublicTagLibraryEntry(item.entry));
  }

  function normalizeBooleanFlag(value) {
    if (typeof value === 'boolean') {
      return value;
    }
    const normalized = normalizeText(value).toLowerCase();
    if (!normalized) {
      return false;
    }
    if (['true', '1', 'yes', 'y', '是', '需要', '需要记录'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n', '否', '不需要', '无需', '不需要记录'].includes(normalized)) {
      return false;
    }
    return Boolean(value);
  }

  function uniqueTextList(values) {
    const result = [];
    const seen = new Set();
    for (const value of values || []) {
      const text = normalizeText(value);
      if (!text || seen.has(text)) {
        continue;
      }
      seen.add(text);
      result.push(text);
    }
    return result;
  }

  function formatDurationSeconds(seconds) {
    const normalizedSeconds = Math.max(0, Math.trunc(Number(seconds) || 0));
    if (!normalizedSeconds) {
      return '';
    }
    const hh = Math.floor(normalizedSeconds / 3600);
    const mm = Math.floor((normalizedSeconds % 3600) / 60);
    const ss = normalizedSeconds % 60;
    if (hh > 0) {
      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    }
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }

  function parseDurationText(text) {
    const normalized = normalizeText(text);
    if (!normalized) {
      return 0;
    }
    const compact = normalized.replace(/\s+/g, '');
    const chineseMatched = compact.match(/(?:(\d{1,2})时)?(?:(\d{1,2})分)?(?:(\d{1,2})秒)/);
    if (chineseMatched && (chineseMatched[1] || chineseMatched[2] || chineseMatched[3])) {
      const hh = Number(chineseMatched[1] || 0);
      const mm = Number(chineseMatched[2] || 0);
      const ss = Number(chineseMatched[3] || 0);
      if ([hh, mm, ss].every((part) => Number.isFinite(part))) {
        return (hh * 3600) + (mm * 60) + ss;
      }
    }
    const colonMatches = Array.from(compact.matchAll(/(^|[^\d])(\d{1,2}:\d{2}(?::\d{2})?)(?!\d)/g));
    if (!colonMatches.length) {
      return 0;
    }
    const matched = colonMatches[colonMatches.length - 1][2];
    const parts = matched.split(':').map((part) => Number(part));
    if (parts.some((part) => !Number.isFinite(part))) {
      return 0;
    }
    if (parts.length === 3) {
      return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }
    if (parts.length === 2) {
      return (parts[0] * 60) + parts[1];
    }
    return 0;
  }

  function getCookieValue(name) {
    const normalizedName = normalizeText(name);
    if (!normalizedName) {
      return '';
    }
    const prefix = `${encodeURIComponent(normalizedName)}=`;
    const pairs = String(document.cookie || '').split(';');
    for (const pair of pairs) {
      const trimmed = pair.trim();
      if (trimmed.startsWith(prefix)) {
        return decodeURIComponent(trimmed.slice(prefix.length));
      }
    }
    return '';
  }

  function getStdAdminToken() {
    return normalizeText(getCookieValue('std_admin_token'));
  }

  function getStdVueUserId() {
    const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const app = pageWindow.$vueApp;
    const globals = app && app.config && app.config.globalProperties;
    const userInfo = globals && globals.userInfo;
    return normalizeText(userInfo && userInfo.userID);
  }

  function buildDatePeriodRange(startDateString, endDateString) {
    const startDate = normalizeText(startDateString);
    const endDate = normalizeText(endDateString) || startDate;
    const [startYear, startMonth, startDay] = startDate.split('-').map((part) => Number(part));
    const [endYear, endMonth, endDay] = endDate.split('-').map((part) => Number(part));
    return {
      start: new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0),
      end: new Date(endYear, endMonth - 1, endDay + 1, 0, 0, 0, 0)
    };
  }

  function buildStandardizationListApiUrl(params) {
    const search = new URLSearchParams();
    Object.keys(params || {}).forEach((key) => {
      const value = params[key];
      search.set(key, value === undefined || value === null ? '' : String(value));
    });
    return `${location.origin}/api/api/task/list/std?${search.toString()}`;
  }

  function buildStandardizationListApiParams(range, pageNumber, item) {
    const token = getStdAdminToken();
    const userId = getStdVueUserId();
    if (!token) {
      throw new Error('未读取到标准化系统登录凭证，请重新登录后再开始标准化');
    }
    if (!userId) {
      throw new Error('未读取到标准化系统用户信息，请刷新页面后再开始标准化');
    }
    if (!range || !(range.start instanceof Date) || !(range.end instanceof Date)) {
      throw new Error('标准化日期范围无效');
    }
    const typeId = getStandardizationCategoryTypeId(item);
    return {
      token,
      params: {
        select_type: 2,
        create_time_begin: formatDateTime(range.start),
        create_time_end: formatDateTime(range.end),
        type: typeId,
        category: '',
        limit: 10000,
        allnum_op: 1,
        page: Math.max(1, Math.trunc(Number(pageNumber) || 1)),
        page_size: STANDARDIZATION_LIST_PAGE_SIZE,
        oaname: userId,
        otype: 'json',
        jsonp: 'no',
        rtx: userId
      }
    };
  }

  function normalizeStandardizationListPageResponse(responseText) {
    let parsed = null;
    try {
      parsed = JSON.parse(responseText || '{}');
    } catch (error) {
      throw new Error('标准化列表返回内容格式不对');
    }
    const code = Number(parsed && parsed.code);
    if (Number.isFinite(code) && code !== 0 && code !== 200) {
      throw new Error(normalizeText(parsed.message || parsed.msg) || `标准化列表读取失败：${code}`);
    }
    if (!parsed || !Array.isArray(parsed.data)) {
      throw new Error('标准化列表返回内容不完整');
    }
    const totalRecords = Math.max(0, Math.trunc(Number(parsed.total) || 0));
    const totalPages = Math.trunc(Number(parsed.total_page));
    if (totalRecords > 0 && (!Number.isFinite(totalPages) || totalPages < 1)) {
      throw new Error('标准化列表页数读取失败');
    }
    return {
      records: parsed.data,
      totalRecords,
      totalPages: totalRecords > 0 ? totalPages : 0
    };
  }

  async function requestStandardizationListPage(range, pageNumber, cancelCheck, item) {
    const request = buildStandardizationListApiParams(range, pageNumber, item);
    let response = null;
    try {
      response = await requestByGm({
        method: 'GET',
        url: buildStandardizationListApiUrl(request.params),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'X-Token': request.token
        },
        timeout: QUERY_TIMEOUT,
        withCredentials: true,
        cancelCheck
      });
    } catch (error) {
      if (cancelCheck && cancelCheck()) {
        throw new Error('任务已结束');
      }
      throw error;
    }
    if (!response || response.status >= 400) {
      throw new Error(`标准化列表读取失败：${response ? response.status : '未知状态'}`);
    }
    return {
      pageNumber: Math.max(1, Math.trunc(Number(pageNumber) || 1)),
      ...normalizeStandardizationListPageResponse(response.responseText || '')
    };
  }

  function normalizeStandardizationApiRow(record) {
    if (!record || typeof record !== 'object') {
      return null;
    }
    const taskId = normalizeText(record.vid);
    if (!taskId) {
      return null;
    }
    return {
      taskId,
      standardOperator: normalizeText(record.operator),
      qcOperator: normalizeText(record.checker),
      qcStatus: normalizeText(record.check),
      state: normalizeText(record.state),
      type: normalizeText(record.type),
      fields: record
    };
  }

  function isStandardizationApiRowCandidate(row, item) {
    return row
      && normalizeText(row.type) === normalizeText(item && item.queryLabel)
      && normalizeText(row.state) === '待标准化';
  }

  function extractFirstJsonObject(text) {
    const source = normalizeText(text);
    if (!source) {
      throw new Error('AI 没有返回可用内容');
    }
    const fenceMatch = source.match(/```json\s*([\s\S]*?)```/i) || source.match(/```\s*([\s\S]*?)```/i);
    const raw = fenceMatch ? fenceMatch[1].trim() : source;
    const firstBrace = raw.indexOf('{');
    if (firstBrace < 0) {
      throw new Error('AI 返回内容格式不对');
    }
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = firstBrace; index < raw.length; index += 1) {
      const char = raw[index];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }
      if (char === '"') {
        inString = true;
        continue;
      }
      if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          return raw.slice(firstBrace, index + 1);
        }
      }
    }
    throw new Error('AI 返回内容不完整');
  }

  function buildModelOutputPreview(text) {
    const normalized = normalizeText(text);
    if (!normalized) {
      return '空';
    }
    if (normalized.length <= 320) {
      return normalized;
    }
    return `${normalized.slice(0, 160)} ... ${normalized.slice(-160)}`;
  }

  function readSingleQuotedJsonString(source, startIndex) {
    if (!source || source[startIndex] !== '\'') {
      return null;
    }
    let value = '';
    for (let index = startIndex + 1; index < source.length; index += 1) {
      const char = source[index];
      if (char === '\\') {
        const nextChar = source[index + 1];
        if (typeof nextChar !== 'string') {
          return null;
        }
        if (nextChar === '\'' || nextChar === '\\' || nextChar === '/') {
          value += nextChar;
        } else if (nextChar === 'n') {
          value += '\n';
        } else if (nextChar === 'r') {
          value += '\r';
        } else if (nextChar === 't') {
          value += '\t';
        } else if (nextChar === 'b') {
          value += '\b';
        } else if (nextChar === 'f') {
          value += '\f';
        } else {
          value += nextChar;
        }
        index += 1;
        continue;
      }
      if (char === '\'') {
        return {
          value,
          endIndex: index
        };
      }
      value += char;
    }
    return null;
  }

  function repairModelJsonSingleQuotes(text) {
    const source = String(text || '');
    if (!source.includes('\'')) {
      return source;
    }
    let result = '';
    let inDoubleString = false;
    let escaped = false;
    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      if (inDoubleString) {
        result += char;
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inDoubleString = false;
        }
        continue;
      }
      if (char === '"') {
        inDoubleString = true;
        result += char;
        continue;
      }
      if (char === '\'') {
        const parsedString = readSingleQuotedJsonString(source, index);
        if (!parsedString) {
          result += char;
          continue;
        }
        result += JSON.stringify(parsedString.value);
        index = parsedString.endIndex;
        continue;
      }
      result += char;
    }
    return result;
  }

  function parseModelJsonObject(text, sceneLabel) {
    try {
      const rawJson = extractFirstJsonObject(text);
      try {
        return JSON.parse(rawJson);
      } catch (error) {
        return JSON.parse(repairModelJsonSingleQuotes(rawJson));
      }
    } catch (error) {
      const label = normalizeText(sceneLabel) || '模型';
      throw new Error(`${label}返回内容格式不对`);
    }
  }

  function isModelJsonParseFailureMessage(message) {
    const normalized = normalizeText(message);
    return normalized.includes('返回解析失败') || normalized.includes('返回内容格式不对');
  }

  function extractTextFromResponsesContent(content) {
    if (!Array.isArray(content)) {
      return '';
    }
    return content
      .map((item) => {
        if (!item || item.type !== 'output_text' || typeof item.text !== 'string') {
          return '';
        }
        return item.text;
      })
      .join('');
  }

  function extractTextFromResponsesObject(responseObject) {
    if (!responseObject || typeof responseObject !== 'object') {
      return '';
    }
    if (responseObject.error && responseObject.error.message) {
      throw new Error(responseObject.error.message);
    }
    if (responseObject.status === 'failed' && responseObject.error) {
      throw new Error(responseObject.error.message || responseObject.error.code || 'AI 判断失败');
    }
    if (typeof responseObject.output_text === 'string') {
      return normalizeText(responseObject.output_text);
    }
    if (!Array.isArray(responseObject.output)) {
      return '';
    }
    const content = responseObject.output
      .map((item) => {
        if (!item || item.type !== 'message') {
          return '';
        }
        return extractTextFromResponsesContent(item.content);
      })
      .join('');
    return normalizeText(content);
  }

  function extractTextFromResponsesStream(responseText) {
    const lines = String(responseText || '').split(/\r?\n/);
    let content = '';
    let errorMessage = '';
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) {
        continue;
      }
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') {
        continue;
      }
      let parsed = null;
      try {
        parsed = JSON.parse(payload);
      } catch (error) {
        continue;
      }
      if (parsed.type === 'error') {
        errorMessage = parsed.message || (parsed.error && parsed.error.message) || parsed.code || 'AI 判断失败';
        break;
      }
      if (parsed.type === 'response.failed' && parsed.response && parsed.response.error) {
        errorMessage = parsed.response.error.message || parsed.response.error.code || 'AI 判断失败';
        break;
      }
      if (parsed.error && parsed.error.message) {
        errorMessage = parsed.error.message;
        break;
      }
      if (parsed.type === 'response.output_text.delta' && typeof parsed.delta === 'string') {
        content += parsed.delta;
        continue;
      }
      if (parsed.type === 'response.output_text.done' && !content && typeof parsed.text === 'string') {
        content = parsed.text;
        continue;
      }
      if (
        parsed.type === 'response.content_part.done'
        && !content
        && parsed.part
        && parsed.part.type === 'output_text'
        && typeof parsed.part.text === 'string'
      ) {
        content = parsed.part.text;
        continue;
      }
      if (parsed.type === 'response.completed' && !content && parsed.response) {
        content = extractTextFromResponsesObject(parsed.response);
      }
    }
    if (errorMessage) {
      throw new Error(errorMessage);
    }
    return normalizeText(content);
  }

  function extractTextFromResponsesJson(responseText) {
    const parsed = JSON.parse(responseText);
    return extractTextFromResponsesObject(parsed);
  }

  function requestByGm(options) {
    return new Promise((resolve, reject) => {
      const requestOptions = options || {};
      const { cancelCheck: rawCancelCheck, ...xhrOptions } = requestOptions;
      const cancelCheck = typeof rawCancelCheck === 'function' ? rawCancelCheck : null;
      let settled = false;
      let cancelTimer = 0;
      const finish = (callback, payload) => {
        if (settled) {
          return;
        }
        settled = true;
        if (cancelTimer) {
          window.clearInterval(cancelTimer);
          cancelTimer = 0;
        }
        callback(payload);
      };
      const request = GM_xmlhttpRequest({
        timeout: 60000,
        ...xhrOptions,
        onload: (response) => {
          finish(resolve, response);
        },
        onerror: (error) => {
          finish(reject, new Error(error && error.error ? error.error : '请求失败'));
        },
        ontimeout: () => {
          finish(reject, new Error('请求超时'));
        },
        onabort: () => {
          finish(reject, new Error('请求已取消'));
        }
      });
      if (cancelCheck && request && typeof request.abort === 'function') {
        if (cancelCheck()) {
          request.abort();
          return;
        }
        cancelTimer = window.setInterval(() => {
          if (settled) {
            return;
          }
          let shouldCancel = false;
          try {
            shouldCancel = cancelCheck();
          } catch (error) {
            shouldCancel = false;
          }
          if (shouldCancel) {
            request.abort();
          }
        }, 200);
      }
    });
  }

  function extractModelErrorMessage(responseText) {
    const normalized = normalizeText(responseText);
    if (!normalized) {
      return '';
    }
    try {
      const parsed = JSON.parse(normalized);
      return normalizeText(
        (parsed && parsed.error && parsed.error.message)
        || (parsed && parsed.response && parsed.response.error && parsed.response.error.message)
        || (parsed && parsed.message)
        || (parsed && parsed.error && parsed.error.code)
        || (parsed && parsed.response && parsed.response.error && parsed.response.error.code)
      );
    } catch (error) {
      return normalized;
    }
  }

  async function requestArkResponsesText(apiKey, payload, isStream, cancelCheck) {
    const response = await requestByGm({
      method: 'POST',
      url: ARK_RESPONSES_URL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(payload),
      timeout: ARK_REQUEST_TIMEOUT,
      cancelCheck
    });
    if (!response || response.status >= 400) {
      const detail = extractModelErrorMessage(response && response.responseText);
      throw new Error(detail || `AI 判断失败：${response ? response.status : '未知状态'}`);
    }
    return isStream
      ? extractTextFromResponsesStream(response.responseText || '')
      : extractTextFromResponsesJson(response.responseText || '');
  }

  function buildStandardizationModelPayload(options) {
    const payload = options && typeof options === 'object' ? options : {};
    const reasoningEffort = normalizeStandardizationReasoningEffort(
      payload.reasoningEffort || (payload.reasoning && payload.reasoning.effort)
    );
    const responsePayload = { ...payload };
    delete responsePayload.reasoningEffort;
    delete responsePayload.reasoning;
    return {
      ...responsePayload,
      model: STANDARDIZATION_MODEL,
      thinking: { type: STANDARDIZATION_MODEL_THINKING_TYPE },
      reasoning: { effort: reasoningEffort },
      max_output_tokens: STANDARDIZATION_MODEL_MAX_OUTPUT_TOKENS,
      store: false
    };
  }

  async function requestOmniVideoSummary(apiKey, videoUrl, promptText, categoryRule, detailCategoryContext, reasoningEffort, cancelCheck) {
    const systemPrompt = buildCategoryRuleSystemPrompt(categoryRule, detailCategoryContext);
    const payload = buildStandardizationModelPayload({
      ...(systemPrompt ? { instructions: systemPrompt } : {}),
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_video',
              video_url: videoUrl
            },
            {
              type: 'input_text',
              text: promptText
            }
          ]
        }
      ],
      reasoningEffort,
      stream: true
    });
    return requestArkResponsesText(apiKey, payload, true, cancelCheck);
  }

  async function requestTagJudge(apiKey, promptText, categoryRule, detailCategoryContext, reasoningEffort, cancelCheck) {
    const systemPrompt = buildCategoryRuleSystemPrompt(categoryRule, detailCategoryContext);
    const payload = buildStandardizationModelPayload({
      ...(systemPrompt ? { instructions: systemPrompt } : {}),
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: promptText
            }
          ]
        }
      ],
      reasoningEffort
    });
    return requestArkResponsesText(apiKey, payload, false, cancelCheck);
  }

  function getVisiblePager() {
    return Array.from(document.querySelectorAll('.vxe-pager')).find(isVisible) || null;
  }

  function getPagerGotoInput() {
    const pager = getVisiblePager();
    return pager ? pager.querySelector('.vxe-pager--goto input, .vxe-pager--goto .vxe-input--inner') : null;
  }

  function getPagerCurrentPage() {
    const pager = getVisiblePager();
    if (!pager) {
      return null;
    }
    const activeButton = pager.querySelector('.vxe-pager--num-btn.is--active, .vxe-pager--num-btn.is-active');
    if (activeButton) {
      return Number(normalizeText(activeButton.textContent));
    }
    return null;
  }

  function getPagerPageSize() {
    const pager = getVisiblePager();
    if (!pager) {
      return null;
    }
    const sizeInput = pager.querySelector('.vxe-pager--sizes input, .vxe-pager--sizes .vxe-input--inner');
    const text = normalizeText(sizeInput ? sizeInput.value : pager.textContent);
    const matched = text.match(/(\d+)\s*条\/页/);
    return matched ? Number(matched[1]) : null;
  }

  function getPagerTotalRecords() {
    const pager = getVisiblePager();
    if (!pager) {
      return null;
    }
    const total = pager.querySelector('.vxe-pager--total');
    const matched = normalizeText(total ? total.textContent : pager.textContent).match(/共\s*([\d,]+)\s*条记录/);
    return matched ? Number(matched[1].replace(/,/g, '')) : null;
  }

  function getVisibleTableRoot() {
    return Array.from(document.querySelectorAll('.vxe-table'))
      .find((element) => isVisible(element)) || null;
  }

  function getVisibleTableHeaderElement() {
    const root = getVisibleTableRoot();
    return root ? root.querySelector('.vxe-table--header-wrapper table.vxe-table--header') : null;
  }

  function getVisibleTableBodyElement() {
    const root = getVisibleTableRoot();
    return root ? root.querySelector('.vxe-table--body-wrapper table.vxe-table--body') : null;
  }

  function getListTableHeaderMap() {
    const headerTable = getVisibleTableHeaderElement();
    if (!headerTable) {
      throw new Error('未找到列表表头');
    }
    const map = new Map();
    const headers = headerTable.querySelectorAll('thead th[colid]');
    headers.forEach((header) => {
      const colId = header.getAttribute('colid');
      const title = normalizeText(header.textContent);
      if (colId && title) {
        map.set(colId, title);
      }
    });
    return map;
  }

  function parseCurrentListRows() {
    const bodyTable = getVisibleTableBodyElement();
    if (!bodyTable) {
      return [];
    }
    const headerMap = getListTableHeaderMap();
    return Array.from(bodyTable.querySelectorAll('tbody tr.vxe-body--row')).map((rowElement) => {
      const fields = {};
      rowElement.querySelectorAll('td[colid]').forEach((cell) => {
        const colId = cell.getAttribute('colid');
        const header = headerMap.get(colId);
        if (!header) {
          return;
        }
        fields[header] = normalizeText(cell.textContent);
      });
      const actionButton = Array.from(rowElement.querySelectorAll('button')).find((button) => {
        return normalizeText(button.textContent) === '标准化';
      }) || null;
      return {
        element: rowElement,
        fields,
        actionButton,
        taskId: fields['VID'] || '',
        standardOperator: fields['标准化操作人'] || '',
        qcOperator: fields['质检人'] || '',
        qcStatus: fields['质检状态'] || ''
      };
    });
  }

  async function waitForDetailPageReady(cancelCheck) {
    await waitFor(() => {
      if (!isDetailPage()) {
        throw new Error('任务不存在或已被他人加锁');
      }
      const pageMessage = normalizeText(document.body && document.body.innerText || '');
      if (pageMessage.includes('没有符合条件的任务') || pageMessage.includes('任务不存在或已被人加锁')) {
        throw new Error('任务不存在或已被他人加锁');
      }
      return findButtonByText('退出任务操作')
        && document.querySelector('.main-footer')
        && document.querySelector('.article-header');
    }, DETAIL_PAGE_TIMEOUT, '详情页还在加载，请稍后再试', { cancelCheck });
  }

  function getDetailFormItemByLabel(labelText) {
    return Array.from(document.querySelectorAll('.el-form-item')).find((item) => {
      const label = item.querySelector('.el-form-item__label');
      return label && normalizeText(label.textContent) === labelText;
    }) || null;
  }

  function getDetailPageTaskId() {
    const match = location.pathname.match(/\/stdDetail\/([^/?#]+)/);
    return match ? normalizeText(match[1]) : '';
  }

  function getDetailVideoVidFromPlayer() {
    const candidates = [
      ...Array.from(document.querySelectorAll('video[id^="myvideo"]')),
      ...Array.from(document.querySelectorAll('[id^="vodbox"]'))
    ];
    for (const element of candidates) {
      const id = normalizeText(element && element.id);
      const matched = id.match(/(?:myvideo|vodbox)([a-z0-9]+)/i);
      if (matched && matched[1]) {
        return normalizeText(matched[1]);
      }
    }
    return '';
  }

  function getDetailVideoVid(fallbackVid) {
    const explicitItem = getDetailFormItemByLabel('VID');
    const explicitInput = explicitItem && explicitItem.querySelector('input');
    const explicitContent = explicitItem ? explicitItem.querySelector('.el-form-item__content') : null;
    const explicitValue = normalizeText(
      explicitInput
        ? explicitInput.value
        : (explicitContent ? explicitContent.textContent : '')
    );
    const consoleValue = normalizeText(document.querySelector('[data-role="txp-ui-console-vid"]')?.textContent);
    const playerValue = getDetailVideoVidFromPlayer();
    const taskValue = getDetailPageTaskId();
    return explicitValue || consoleValue || playerValue || normalizeText(fallbackVid) || taskValue || '';
  }

  async function fetchDetailTaskInfo(taskId, cancelCheck) {
    const vid = normalizeText(taskId);
    if (!vid) {
      throw new Error('未提供详情页视频编号');
    }
    const controller = new AbortController();
    let cancelTimer = 0;
    try {
      if (typeof cancelCheck === 'function') {
        if (cancelCheck()) {
          throw new Error('任务已结束');
        }
        cancelTimer = window.setInterval(() => {
          try {
            if (cancelCheck()) {
              controller.abort();
            }
          } catch (error) {
            // ignore cancel check errors
          }
        }, 200);
      }
      const response = await fetch(
        `${location.origin}/api/api/task/info?vid=${encodeURIComponent(vid)}&select_type=2`,
        {
          credentials: 'include',
          signal: controller.signal
        }
      );
      if (!response.ok) {
        throw new Error(`详情页视频信息读取失败：${response.status}`);
      }
      const payload = await response.json();
      if (!payload || Number(payload.code) !== 0 || !payload.data) {
        throw new Error(normalizeText(payload && (payload.msg || payload.message)) || '详情页视频信息返回异常');
      }
      return payload.data;
    } catch (error) {
      if (error && error.name === 'AbortError') {
        throw new Error('任务已结束');
      }
      throw error;
    } finally {
      if (cancelTimer) {
        window.clearInterval(cancelTimer);
      }
    }
  }

  function getDetailCategoryContextFromInfo(detailInfo, primaryCategory) {
    const navItems = Array.isArray(detailInfo && detailInfo.nav)
      ? detailInfo.nav
        .map((item) => normalizeText(item && (item.name || item.val || item.title)))
        .filter(Boolean)
      : [];
    const categoryParts = navItems.length ? navItems : splitCategoryPathText(primaryCategory);
    const primary = normalizeText(primaryCategory) || categoryParts[0] || '';
    const secondary = categoryParts.length > 1 ? categoryParts[1] : '';
    return buildDetailCategoryContext(primary, secondary, categoryParts.join(' / '));
  }

  function getDetailFormValueByLabels(labels) {
    for (const label of labels || []) {
      const item = getDetailFormItemByLabel(label);
      if (!item) {
        continue;
      }
      const input = item.querySelector('input, textarea');
      const content = item.querySelector('.el-form-item__content');
      const value = normalizeText(input ? input.value : (content ? content.textContent : ''));
      if (value) {
        return value;
      }
    }
    return '';
  }

  function getDetailTitleText() {
    const headerTitle = normalizeText(
      document.querySelector('.article-header h1, .article-header .title, .article-header [class*="title"]')?.textContent
    );
    const fieldTitle = getDetailFormValueByLabels(['标题', '稿件标题', '内容标题', '节目标题']);
    return headerTitle || fieldTitle || '';
  }

  function getDetailMediaDurationSeconds() {
    const mediaElements = Array.from(document.querySelectorAll('video, audio'))
      .filter((element) => element instanceof HTMLMediaElement);
    for (const element of mediaElements) {
      const duration = Number(element.duration);
      if (Number.isFinite(duration) && duration > 0) {
        return Math.round(duration);
      }
    }
    return 0;
  }

  function getDurationSecondsFromSelectors(selectors) {
    const normalizedSelectors = Array.isArray(selectors)
      ? selectors.filter(Boolean)
      : [];
    if (!normalizedSelectors.length) {
      return 0;
    }
    const elements = Array.from(document.querySelectorAll(normalizedSelectors.join(', ')));
    const getValues = (candidateElements) => candidateElements
      .map((element) => parseDurationText(element.textContent || ''))
      .filter((value) => value > 0);
    const visibleValues = getValues(elements.filter(isVisible));
    if (visibleValues.length) {
      return Math.max(...visibleValues);
    }
    const fallbackValues = getValues(elements);
    return fallbackValues.length ? Math.max(...fallbackValues) : 0;
  }

  function getDetailDurationFromText() {
    const playerDuration = getDurationSecondsFromSelectors([
      '[data-role="txp-control-duration"]',
      '[data-role="txp-button-duration-time"]',
      '.txp_time_duration',
      '.time-r'
    ]);
    if (playerDuration > 0) {
      return playerDuration;
    }
    const detailDuration = getDurationSecondsFromSelectors([
      '.task-wrap .time',
      '.main-body .time',
      '.article .time'
    ]);
    if (detailDuration > 0) {
      return detailDuration;
    }
    const fieldDuration = parseDurationText(getDetailFormValueByLabels(['时长', '片长', '节目时长']));
    return fieldDuration > 0 ? fieldDuration : 0;
  }

  async function waitForDetailDurationSeconds(cancelCheck) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < 5000) {
      if (cancelCheck && cancelCheck()) {
        throw new Error('任务已结束');
      }
      const mediaDuration = getDetailMediaDurationSeconds();
      if (mediaDuration > 0) {
        return mediaDuration;
      }
      await sleep(250);
    }
    return getDetailDurationFromText();
  }

  function getDetailFinishedTagsField() {
    const item = getDetailFormItemByLabel('成品标签');
    return item ? item.querySelector('.video-label-select, .moveTag, .el-select') : null;
  }

  function extractTagDetailFromElement(element) {
    if (!(element instanceof Element)) {
      return null;
    }
    const fieldValues = {
      name: '',
      type: '',
      id: '',
      remark: ''
    };
    const textCandidates = [];
    const seenText = new Set();
    const pushText = (value) => {
      const raw = String(value || '');
      const normalized = normalizeText(raw);
      if (!normalized || seenText.has(normalized)) {
        return;
      }
      seenText.add(normalized);
      textCandidates.push(raw);
    };
    const assignField = (key, value) => {
      const normalized = normalizeText(value);
      if (!normalized || fieldValues[key]) {
        return;
      }
      fieldValues[key] = normalized;
    };
    const collectNode = (node) => {
      if (!(node instanceof Element)) {
        return;
      }
      Array.from(node.attributes || []).forEach((attribute) => {
        const attrName = String(attribute.name || '').toLowerCase();
        const attrValue = attribute.value;
        if (!normalizeText(attrValue)) {
          return;
        }
        if (attrName === 'title' || attrName === 'aria-label' || attrName === 'data-content' || attrName === 'data-original-title') {
          pushText(attrValue);
        }
        if (attrName === 'data-name' || attrName === 'data-label' || attrName === 'data-tag-name' || attrName === 'data-label-name') {
          assignField('name', attrValue);
        }
        if (attrName === 'data-type' || attrName === 'data-tag-type' || attrName === 'data-label-type') {
          assignField('type', attrValue);
        }
        if (attrName === 'data-id' || attrName === 'data-tag-id' || attrName === 'data-label-id') {
          assignField('id', attrValue);
        }
        if (attrName === 'data-remark' || attrName === 'data-note' || attrName === 'data-memo' || attrName === 'data-description') {
          assignField('remark', attrValue);
        }
      });
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
        pushText(node.value);
      } else {
        pushText(node.textContent);
      }
    };

    collectNode(element);
    Array.from(element.querySelectorAll('*')).forEach(collectNode);
    const detail = normalizeTagDetail({
      ...fieldValues,
      rawText: textCandidates.join(' | ')
    });
    return detail;
  }

  function getDetailSelectedTagElements() {
    const field = getDetailFinishedTagsField();
    if (!field) {
      return [];
    }
    const selectors = [
      '.el-select__tags .el-tag',
      '.moveTag .el-tag',
      '.moveTag [class*="tag-item"]',
      '.moveTag > span',
      '.el-select__tags > span'
    ];
    const candidates = Array.from(field.querySelectorAll(selectors.join(', ')))
      .filter((element) => {
        return isVisible(element)
          && !(element instanceof HTMLInputElement)
          && !(element instanceof HTMLTextAreaElement);
      });
    if (candidates.length) {
      return candidates;
    }
    return Array.from(field.querySelectorAll('.el-select__tags-text'))
      .map((element) => element.parentElement)
      .filter(Boolean);
  }

  async function waitForDetailAnalysisReady(fallbackVid, cancelCheck) {
    await waitFor(() => {
      return getDetailFinishedTagsField() && getDetailVideoVid(fallbackVid);
    }, DETAIL_PAGE_TIMEOUT, '详情页视频信息未准备完成', { cancelCheck });
  }

  function getDetailSelectedTagDetails() {
    return normalizeTagDetailArray(
      getDetailSelectedTagElements().map((element) => extractTagDetailFromElement(element))
    );
  }

  function getDetailFinishedTagsInput() {
    const field = getDetailFinishedTagsField();
    if (!field) {
      return null;
    }
    return field.querySelector('input.el-select__input, input[role="combobox"], input');
  }

  function isDetailFinishedTagSelected(tagDetail) {
    return getDetailSelectedTagDetails().some((selected) => isSameTagDetail(selected, tagDetail));
  }

  function isDropdownOptionMatchedTag(option, tagDetail) {
    const optionText = normalizeText(option && option.textContent);
    const detail = normalizeTagDetail(tagDetail);
    if (!optionText || !detail) {
      return false;
    }
    const id = normalizeText(detail.id);
    if (id && optionText.includes(id)) {
      return true;
    }
    const name = normalizeTagLookupText(detail.name || detail.rawText);
    return Boolean(name && normalizeTagLookupText(optionText).includes(name));
  }

  async function findFinishedTagDropdownOption(tagDetail, cancelCheck) {
    return waitFor(() => {
      const dropdowns = getVisibleSelectDropdowns();
      for (const dropdown of dropdowns) {
        const option = getDropdownOptions(dropdown).find((item) => {
          return !item.classList.contains('is-disabled') && isDropdownOptionMatchedTag(item, tagDetail);
        });
        if (option) {
          return option;
        }
      }
      return null;
    }, 8000, `未找到成品标签选项：${formatTagDetailForDisplay(tagDetail)}`, { cancelCheck });
  }

  async function addDetailFinishedTag(tagDetail, cancelCheck) {
    const detail = normalizeTagDetail(tagDetail);
    if (!detail) {
      return;
    }
    if (isDetailFinishedTagSelected(detail)) {
      return;
    }
    const field = getDetailFinishedTagsField();
    const input = getDetailFinishedTagsInput();
    if (!field || !input) {
      throw new Error('成品标签输入框未准备好');
    }
    const wrapper = field.querySelector('.el-select__wrapper') || field;
    const searchText = normalizeText(detail.name || detail.id || detail.rawText);
    if (!searchText) {
      throw new Error('成品标签缺少可搜索名称');
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (cancelCheck && cancelCheck()) {
        throw new Error('任务已结束');
      }
      triggerMouseClick(wrapper);
      input.focus();
      setNativeInputValue(input, '');
      await sleep(80);
      setNativeInputValue(input, searchText);
      input.dispatchEvent(createKeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }));
      await sleep(300);
      const option = await findFinishedTagDropdownOption(detail, cancelCheck);
      triggerMouseClick(option);
      await waitFor(
        () => isDetailFinishedTagSelected(detail),
        8000,
        `成品标签写入未生效：${formatTagDetailForDisplay(detail)}`,
        { cancelCheck }
      );
      return;
    }
  }

  async function writeDetailFinishedTags(tagDetails, cancelCheck, onProgress) {
    const details = normalizeTagDetailArray(tagDetails);
    if (!details.length) {
      throw new Error('没有可写入的成品标签');
    }
    for (let index = 0; index < details.length; index += 1) {
      const detail = details[index];
      if (typeof onProgress === 'function') {
        await onProgress(detail, index, details.length);
      }
      await addDetailFinishedTag(detail, cancelCheck);
    }
    const missingTags = details.filter((detail) => !isDetailFinishedTagSelected(detail));
    if (missingTags.length) {
      throw new Error(`成品标签校验未通过：${missingTags.map((item) => formatTagDetailForDisplay(item)).join('、')}`);
    }
  }

  async function clickDetailExitButton() {
    const button = findButtonByText('退出任务操作');
    if (!button) {
      throw new Error('未找到退出任务操作按钮');
    }
    triggerMouseClick(button);
    await sleep(600);
  }

  async function clickDetailStandardizationPassButton(cancelCheck) {
    const button = findButtonByText('标准化通过');
    if (!button) {
      throw new Error('未找到标准化通过按钮');
    }
    triggerMouseClick(button);
    await sleep(300);
    const confirmButton = ['确定', '确认'].map((text) => findButtonByText(text)).find(Boolean);
    if (confirmButton) {
      triggerMouseClick(confirmButton);
    }
    await waitFor(() => {
      const successMessage = Array.from(document.querySelectorAll('.el-message, .el-notification, .el-message-box'))
        .map((element) => normalizeText(element.textContent))
        .find((text) => text && /成功|通过/.test(text));
      return successMessage || !document.body.contains(button) || !isVisible(button);
    }, 10000, '标准化通过没有返回成功提示', { cancelCheck });
  }

  function registerCheckpointSkip(checkpoint) {
    if (!checkpoint) {
      return;
    }
    checkpoint.skippedCount = Math.max(0, Math.trunc(Number(checkpoint.skippedCount) || 0)) + 1;
  }

  function normalizeStandardizationDraftRow(row) {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const vid = normalizeText(row.vid);
    const standardTags = normalizeText(row.standardTags);
    const standardOperator = normalizeText(row.standardOperator);
    const itemKey = normalizeText(row.itemKey);
    if (!vid) {
      return null;
    }
    return {
      vid,
      standardTags,
      standardOperator,
      itemKey
    };
  }

  function buildStandardizationItemTargetCounts(itemCount, targetCount) {
    const normalizedItemCount = Math.max(0, Math.trunc(Number(itemCount) || 0));
    const normalizedTargetCount = Math.max(0, Math.trunc(Number(targetCount) || 0));
    if (!normalizedItemCount) {
      return [];
    }
    const baseCount = Math.floor(normalizedTargetCount / normalizedItemCount);
    const remainder = normalizedTargetCount % normalizedItemCount;
    return Array.from({ length: normalizedItemCount }, (_, index) => {
      return baseCount + (index < remainder ? 1 : 0);
    });
  }

  function normalizeStandardizationItemTargetCounts(value, itemCount, targetCount) {
    if (!Array.isArray(value) || value.length !== itemCount) {
      return [];
    }
    const counts = value.map((count) => Math.max(0, Math.trunc(Number(count) || 0)));
    const total = counts.reduce((sum, count) => sum + count, 0);
    return total === targetCount ? counts : [];
  }

  function normalizeStandardizationItemRecordedCounts(value, itemKeys, itemTargetCounts, rows) {
    if (!Array.isArray(value) || value.length !== itemKeys.length) {
      return [];
    }
    const counts = value.map((count) => Math.max(0, Math.trunc(Number(count) || 0)));
    const total = counts.reduce((sum, count) => sum + count, 0);
    if (total !== rows.length) {
      return [];
    }
    for (let index = 0; index < counts.length; index += 1) {
      if (counts[index] > (itemTargetCounts[index] || 0)) {
        return [];
      }
    }
    return counts;
  }

  function normalizeStandardizationInflightEntry(entry, itemKeys) {
    if (!entry || typeof entry !== 'object') {
      return null;
    }
    const taskId = normalizeText(entry.taskId);
    const requestId = normalizeText(entry.requestId);
    const itemKey = normalizeText(entry.itemKey);
    const startedAt = normalizeText(entry.startedAt);
    if (!taskId || !requestId || !itemKey || !startedAt || !itemKeys.includes(itemKey)) {
      return null;
    }
    return {
      taskId,
      requestId,
      itemKey,
      startedAt
    };
  }

  function normalizeStandardizationInflightEntries(value, itemKeys) {
    if (!Array.isArray(value)) {
      return [];
    }
    const result = [];
    const seenTaskIds = new Set();
    const seenRequestIds = new Set();
    value.forEach((entry) => {
      const normalized = normalizeStandardizationInflightEntry(entry, itemKeys);
      if (!normalized || seenTaskIds.has(normalized.taskId) || seenRequestIds.has(normalized.requestId)) {
        return;
      }
      seenTaskIds.add(normalized.taskId);
      seenRequestIds.add(normalized.requestId);
      result.push(normalized);
    });
    return result;
  }

  function normalizeStandardizationSeenTaskIds(value) {
    return uniqueTextList(Array.isArray(value) ? value : []);
  }

  function normalizeStandardizationCheckpoint(checkpoint) {
    if (
      !checkpoint
      || typeof checkpoint !== 'object'
      || checkpoint.version !== 3
      || !normalizeText(checkpoint.startDate)
      || !normalizeText(checkpoint.endDate)
      || !normalizeText(checkpoint.status)
      || !normalizeText(checkpoint.startedAt)
      || !normalizeText(checkpoint.updatedAt)
      || !Number.isInteger(checkpoint.currentItemIndex)
      || !Number.isInteger(checkpoint.targetCount)
    ) {
      return null;
    }
    const startDate = normalizeText(checkpoint.startDate);
    const endDate = normalizeText(checkpoint.endDate);
    const groupIds = normalizeSelectedGroupIds(checkpoint.groupIds);
    const itemKeys = normalizeSelectedKeys(checkpoint.itemKeys);
    const targetCount = checkpoint.targetCount;
    if (!startDate || !endDate || !groupIds.length || !itemKeys.length || targetCount < 1 || targetCount > 999) {
      return null;
    }
    const rows = Array.isArray(checkpoint.rows)
      ? checkpoint.rows.map(normalizeStandardizationDraftRow).filter(Boolean)
      : [];
    if (checkpoint.currentItemIndex < 0 || checkpoint.currentItemIndex > itemKeys.length || rows.length > targetCount) {
      return null;
    }
    const itemTargetCounts = normalizeStandardizationItemTargetCounts(checkpoint.itemTargetCounts, itemKeys.length, targetCount);
    const itemRecordedCounts = normalizeStandardizationItemRecordedCounts(checkpoint.itemRecordedCounts, itemKeys, itemTargetCounts, rows);
    if (!itemTargetCounts.length || !itemRecordedCounts.length) {
      return null;
    }
    if (!['running', 'paused', 'stopped', 'error'].includes(normalizeText(checkpoint.status))) {
      return null;
    }
    const inflightEntries = normalizeStandardizationInflightEntries(checkpoint.inflightEntries, itemKeys);
    return {
      ...checkpoint,
      version: 3,
      startDate,
      endDate,
      groupIds,
      itemKeys,
      currentItemIndex: checkpoint.currentItemIndex,
      targetCount,
      itemTargetCounts,
      itemRecordedCounts,
      inflightEntries,
      processedTaskIds: uniqueTextList(checkpoint.processedTaskIds),
      rows,
      qcOperator: normalizeText(checkpoint.qcOperator),
      categoryRule: normalizeMultilineText(checkpoint.categoryRule),
      reasoningEffort: normalizeStandardizationReasoningEffort(checkpoint.reasoningEffort),
      runMode: normalizeStandardizationRunMode(checkpoint.runMode),
      skippedCount: Math.max(0, Math.trunc(Number(checkpoint.skippedCount) || 0)),
      status: normalizeText(checkpoint.status),
      statusText: normalizeText(checkpoint.statusText),
      logs: Array.isArray(checkpoint.logs) ? checkpoint.logs.slice(0, MAX_LOGS) : [],
      startedAt: checkpoint.startedAt,
      updatedAt: checkpoint.updatedAt
    };
  }

  function normalizeStandardReport(report) {
    if (
      !report
      || typeof report !== 'object'
      || report.version !== 1
      || !normalizeText(report.startDate)
      || !normalizeText(report.endDate)
      || !normalizeText(report.fileName)
      || !normalizeText(report.generatedAt)
      || !Number.isInteger(report.targetCount)
      || !Number.isInteger(report.actualCount)
    ) {
      return null;
    }
    const startDate = normalizeText(report.startDate);
    const endDate = normalizeText(report.endDate);
    const rows = Array.isArray(report.rows)
      ? report.rows
        .map((row) => {
          if (!row || typeof row !== 'object') {
            return null;
          }
          const vid = normalizeText(row.vid);
          if (!vid) {
            return null;
          }
          return {
            vid,
            standardTags: normalizeText(row.standardTags),
            standardOperator: normalizeText(row.standardOperator),
            category: normalizeText(row.category)
          };
        })
        .filter(Boolean)
      : [];
    return {
      version: 1,
      startDate,
      endDate,
      targetCount: report.targetCount,
      actualCount: report.actualCount,
      fileName: normalizeText(report.fileName),
      rows,
      generatedAt: normalizeText(report.generatedAt)
    };
  }

  function formatReportPeriod(report) {
    if (!report) {
      return '';
    }
    const startDate = report.startDate || '';
    const endDate = report.endDate || startDate;
    if (!startDate) {
      return '';
    }
    return startDate === endDate ? startDate : `${startDate} 至 ${endDate}`;
  }

  function createStandardExportRows(records) {
    return (Array.isArray(records) ? records : []).map((row) => ({
      vid: row.vid || '',
      standardTags: row.standardTags || '',
      standardOperator: row.standardOperator || '',
      category: row.category || row.itemKey || ''
    }));
  }

  function exportStandardReport(report) {
    const rows = Array.isArray(report && report.rows) ? report.rows : [];
    const xlsxParser = (typeof XLSX !== 'undefined' ? XLSX : null)
      || (typeof globalThis !== 'undefined' ? globalThis.XLSX : null)
      || window.XLSX
      || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.XLSX : null);
    if (!xlsxParser) {
      throw new Error('XLSX 组件加载失败');
    }
    const header = ['id', '标准化标签', '标准化操作人', '品类'];
    const data = [header, ...rows.map((row) => [row.vid, row.standardTags, row.standardOperator, row.category])];
    const worksheet = xlsxParser.utils.aoa_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 35 },
      { wch: 50 },
      { wch: 16 },
      { wch: 16 }
    ];
    const workbook = xlsxParser.utils.book_new();
    xlsxParser.utils.book_append_sheet(workbook, worksheet, '标准化');
    const fileName = report && report.fileName
      ? report.fileName
      : `标准化 ${formatReportPeriod(report || {}) || formatInputDate(new Date())}`;
    xlsxParser.writeFile(workbook, `${fileName}.xlsx`);
  }

  function normalizeTagArray(value) {
    if (Array.isArray(value)) {
      return uniqueTextList(value.map((item) => normalizeTagDisplayName(item)));
    }
    if (typeof value === 'string') {
      return uniqueTextList(
        value.split(/[，,、\n]/).map((item) => normalizeTagDisplayName(item))
      );
    }
    return [];
  }

  function normalizeTextArray(value) {
    if (Array.isArray(value)) {
      return uniqueTextList(value.map((item) => normalizeText(item)));
    }
    if (typeof value === 'string') {
      return uniqueTextList(
        value.split(/[，,、\n]/).map((item) => normalizeText(item))
      );
    }
    return [];
  }

  function normalizeOmniTimelineEntry(entry) {
    if (!entry || typeof entry !== 'object') {
      return null;
    }
    const time = normalizeText(entry.time);
    const summary = normalizeText(entry.summary || entry.content || entry.description);
    if (!time && !summary) {
      return null;
    }
    return {
      time,
      summary
    };
  }

  function normalizeOmniVideoAnalysis(value) {
    const raw = value && typeof value === 'object' ? value : {};
    return {
      overallTheme: normalizeText(raw.overall_theme || raw.theme || raw.summary),
      timeline: Array.isArray(raw.timeline) ? raw.timeline.map(normalizeOmniTimelineEntry).filter(Boolean) : [],
      repeatedSignals: normalizeTextArray(raw.repeated_signals),
      titleClues: normalizeTextArray(raw.title_clues),
      strongEvidence: normalizeTextArray(raw.strong_evidence),
      uncertainPoints: normalizeTextArray(raw.uncertain_points)
    };
  }

  function formatOmniVideoAnalysisForPrompt(analysis) {
    const normalized = normalizeOmniVideoAnalysis(analysis);
    const timelineText = normalized.timeline.length
      ? normalized.timeline.map((item) => `${item.time || '时间未标注'} ${item.summary || '无描述'}`).join('；')
      : '无';
    return [
      `整体主题：${normalized.overallTheme || '无'}`,
      `标题线索：${normalized.titleClues.join('、') || '无'}`,
      `时间线摘要：${timelineText}`,
      `重复出现的核心信息：${normalized.repeatedSignals.join('、') || '无'}`,
      `强证据：${normalized.strongEvidence.join('、') || '无'}`,
      `不确定点：${normalized.uncertainPoints.join('、') || '无'}`
    ].join('\n');
  }

  function normalizeCandidateDecision(entry) {
    if (!entry || typeof entry !== 'object') {
      return null;
    }
    const keyword = normalizeTagDisplayName(entry.keyword);
    if (!keyword) {
      return null;
    }
    return {
      keyword,
      accepted: normalizeBooleanFlag(entry.accepted),
      reason: normalizeText(entry.reason),
      matchedOption: normalizeTagDetail({
        ...(entry.matched_option && typeof entry.matched_option === 'object' ? entry.matched_option : {}),
        name: entry.matched_option_name || (entry.matched_option && entry.matched_option.name),
        type: entry.matched_option_type || (entry.matched_option && entry.matched_option.type),
        id: entry.matched_option_id || (entry.matched_option && entry.matched_option.id),
        remark: entry.matched_option_remark || (entry.matched_option && entry.matched_option.remark)
      })
    };
  }

  function normalizeCandidateDecisionArray(value) {
    return Array.isArray(value) ? value.map(normalizeCandidateDecision).filter(Boolean) : [];
  }

  function normalizeTagSearchCandidate(entry) {
    if (!entry) {
      return null;
    }
    if (typeof entry === 'string') {
      const keyword = normalizeTagDisplayName(entry);
      return keyword ? { keyword, reason: '' } : null;
    }
    if (typeof entry !== 'object') {
      return null;
    }
    const keyword = normalizeTagDisplayName(entry.keyword || entry.name || entry.label);
    if (!keyword) {
      return null;
    }
    return {
      keyword,
      reason: normalizeText(entry.reason)
    };
  }

  function normalizeTagSearchCandidateArray(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    const result = [];
    const seen = new Set();
    value.map(normalizeTagSearchCandidate).filter(Boolean).forEach((item) => {
      if (seen.has(item.keyword)) {
        return;
      }
      seen.add(item.keyword);
      result.push(item);
    });
    return result;
  }

  function isSameTagDetail(left, right) {
    const leftDetail = normalizeTagDetail(left);
    const rightDetail = normalizeTagDetail(right);
    if (!leftDetail || !rightDetail) {
      return false;
    }
    const leftId = normalizeText(leftDetail.id).toLowerCase();
    const rightId = normalizeText(rightDetail.id).toLowerCase();
    if (leftId && rightId && leftId === rightId) {
      return true;
    }
    const leftName = normalizeTagLookupText(leftDetail.name || leftDetail.rawText);
    const rightName = normalizeTagLookupText(rightDetail.name || rightDetail.rawText);
    return Boolean(leftName && rightName && leftName === rightName);
  }

  function resolveMatchedTagOption(matchedOption, options) {
    const normalizedOptions = normalizeTagDetailArray(options);
    const normalizedMatchedOption = normalizeTagDetail(matchedOption);
    if (!normalizedMatchedOption) {
      return null;
    }
    return normalizedOptions.find((option) => isSameTagDetail(option, normalizedMatchedOption)) || null;
  }

  function getAcceptedMatchedTagDetails(validatedCandidates) {
    return normalizeTagDetailArray(
      (Array.isArray(validatedCandidates) ? validatedCandidates : [])
        .filter((item) => item && item.accepted === true && item.matchedOption)
        .map((item) => item.matchedOption)
    );
  }

  function buildValidatedCandidates(searchResults, candidateDecisions) {
    const decisionMap = new Map(
      normalizeCandidateDecisionArray(candidateDecisions).map((item) => [item.keyword, item])
    );
    return (Array.isArray(searchResults) ? searchResults : []).map((item) => {
      const keyword = normalizeTagDisplayName(item && item.keyword);
      const decision = decisionMap.get(keyword) || null;
      const options = normalizeTagDetailArray(item && item.options);
      const matchedOption = decision ? resolveMatchedTagOption(decision.matchedOption, options) : null;
      const accepted = decision ? Boolean(decision.accepted && matchedOption) : null;
      const reason = decision
        ? normalizeText([
          decision.reason,
          decision.accepted && !matchedOption ? '未匹配到本地标签库结果，已放弃' : ''
        ].filter(Boolean).join('；'))
        : '';
      return {
        keyword,
        searchReason: normalizeText(item && item.reason),
        options,
        accepted,
        reason,
        matchedOption
      };
    }).filter((item) => item.keyword);
  }

  function prefixTaskError(taskId, message) {
    const normalizedTaskId = normalizeText(taskId);
    const normalizedMessage = formatUserVisibleLogText(message);
    const taskPrefix = formatTaskLogPrefix(normalizedTaskId);
    if (!normalizedTaskId) {
      return normalizedMessage;
    }
    if (!normalizedMessage) {
      return taskPrefix || normalizedTaskId;
    }
    if (normalizedMessage.startsWith(`${taskPrefix}：`)) {
      return normalizedMessage;
    }
    if (normalizedMessage.startsWith(`${normalizedTaskId}：`)) {
      return `${taskPrefix}：${normalizeText(normalizedMessage.slice(normalizedTaskId.length + 1))}`;
    }
    return `${taskPrefix}：${normalizedMessage}`;
  }

  async function waitForStorageObjectResponse(options) {
    const config = options && typeof options === 'object' ? options : {};
    const responseKey = normalizeText(config.responseKey);
    const progressKey = normalizeText(config.progressKey);
    const timeoutMs = Math.max(1, Math.trunc(Number(config.timeoutMs) || 0));
    const pollIntervalMs = Math.max(100, Math.trunc(Number(config.pollIntervalMs) || 400));
    const startTimeoutMs = Math.max(0, Math.trunc(Number(config.startTimeoutMs) || 0));
    const stallTimeoutMs = Math.max(0, Math.trunc(Number(config.stallTimeoutMs) || 0));
    const cancelCheck = typeof config.cancelCheck === 'function' ? config.cancelCheck : null;
    const onProgress = typeof config.onProgress === 'function' ? config.onProgress : null;
    const timeoutMessage = normalizeText(config.timeoutMessage) || '等待结果超时';
    const startTimeoutMessage = normalizeText(config.startTimeoutMessage) || timeoutMessage;
    const stallTimeoutMessage = normalizeText(config.stallTimeoutMessage) || timeoutMessage;
    if (!responseKey || !timeoutMs) {
      throw new Error('等待结果配置无效');
    }

    const startedAt = Date.now();
    let lastProgressToken = '';
    let lastActiveAt = startedAt;
    let hasProgress = false;
    while (Date.now() - startedAt < timeoutMs) {
      if (cancelCheck && cancelCheck()) {
        throw new Error('任务已结束');
      }
      const storage = await storageGet(progressKey ? [responseKey, progressKey] : responseKey);
      if (progressKey) {
        const progress = storage[progressKey];
        if (progress && typeof progress === 'object') {
          const progressToken = getResponseProgressToken(progress);
          if (progressToken && progressToken !== lastProgressToken) {
            lastProgressToken = progressToken;
            hasProgress = true;
            lastActiveAt = Date.now();
            if (onProgress) {
              try {
                onProgress(progress);
              } catch (error) {
                // ignore progress callback errors
              }
            }
          }
        }
      }
      const response = storage[responseKey];
      if (response && typeof response === 'object') {
        return response;
      }
      const now = Date.now();
      if (startTimeoutMs && !hasProgress && now - startedAt >= startTimeoutMs) {
        throw new Error(startTimeoutMessage);
      }
      if (stallTimeoutMs && hasProgress && now - lastActiveAt >= stallTimeoutMs) {
        throw new Error(stallTimeoutMessage);
      }
      await sleep(pollIntervalMs);
    }
    throw new Error(timeoutMessage);
  }

  async function waitForStandardizationWorkerResponse(requestId, timeoutMs, onProgress, cancelCheck) {
    return waitForStorageObjectResponse({
      responseKey: buildStandardizationWorkerResponseKey(requestId),
      progressKey: buildStandardizationWorkerProgressKey(requestId),
      timeoutMs,
      pollIntervalMs: 800,
      startTimeoutMs: WORKER_START_TIMEOUT,
      stallTimeoutMs: WORKER_PROGRESS_STALL_TIMEOUT,
      startTimeoutMessage: '详情页未启动，可能被浏览器拦截或新标签页没有打开',
      stallTimeoutMessage: '详情页长时间没有进展，已超时跳过',
      timeoutMessage: '单条视频处理超时',
      onProgress,
      cancelCheck
    });
  }

  async function waitForStandardizationMediaWorkerResponse(requestId, timeoutMs, cancelCheck) {
    return waitForStorageObjectResponse({
      responseKey: buildStandardizationMediaWorkerResponseKey(requestId),
      timeoutMs,
      pollIntervalMs: 400,
      timeoutMessage: '获取视频播放地址超时',
      cancelCheck
    });
  }

  function normalizeMediaSourceUrl(value) {
    const normalized = normalizeText(String(value || '')).replace(/&amp;/gi, '&');
    if (!/^https?:\/\//i.test(normalized)) {
      return '';
    }
    try {
      const parsedUrl = new URL(normalized);
      const hostname = normalizeText(parsedUrl.hostname).toLowerCase();
      const pathname = normalizeText(parsedUrl.pathname).toLowerCase();
      if (
        ['yangshipin.cn', 'www.yangshipin.cn', 'm.yangshipin.cn', 'w.yangshipin.cn'].includes(hostname)
        && pathname === '/video/home'
      ) {
        return '';
      }
      if (/\.(mp4|m3u8|flv)(?:$|\?)/i.test(normalized)) {
        return normalized;
      }
      if (/[?&](vkey|fvkey|ysign|ytime|ytype)=/i.test(normalized)) {
        return normalized;
      }
      return '';
    } catch (error) {
      return '';
    }
  }

  function buildYangshipinVideoUrlFromPlayInfo(responseText, expectedVid) {
    let payload = null;
    try {
      payload = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
    } catch (error) {
      throw new Error('视频播放信息返回内容格式不对');
    }
    const data = payload && payload.data;
    if (!data || typeof data !== 'object') {
      throw new Error('未读取到视频播放信息');
    }
    if (Number(data.code) !== 0) {
      throw new Error(normalizeText(data.message || payload.msg) || '视频播放信息读取失败');
    }
    const videoItem = data.vl && Array.isArray(data.vl.vi) ? data.vl.vi[0] : null;
    if (!videoItem || typeof videoItem !== 'object') {
      throw new Error('未读取到视频文件信息');
    }
    const responseVid = normalizeText(videoItem.vid);
    const normalizedExpectedVid = normalizeText(expectedVid);
    if (normalizedExpectedVid && responseVid && responseVid !== normalizedExpectedVid) {
      throw new Error('读取到的视频编号和当前视频不一致');
    }
    const urlItem = videoItem.ul && Array.isArray(videoItem.ul.ui) ? videoItem.ul.ui[0] : null;
    const baseUrl = normalizeText(urlItem && urlItem.url);
    const fileName = normalizeText(videoItem.fn);
    const fvkey = normalizeText(videoItem.fvkey);
    const extendedParam = normalizeText(data.extended_param);
    if (!baseUrl || !fileName || !fvkey || !extendedParam) {
      throw new Error('视频播放地址信息不完整');
    }
    const pathSeparator = baseUrl.endsWith('/') || fileName.startsWith('/') ? '' : '/';
    const videoUrl = normalizeMediaSourceUrl(`${baseUrl}${pathSeparator}${fileName}?vkey=${encodeURIComponent(fvkey)}${extendedParam}`);
    if (!videoUrl) {
      throw new Error('视频播放地址不可用');
    }
    return videoUrl;
  }

  async function waitForYangshipinVideoInfoUrl(videoVid, cancelCheck) {
    const normalizedVid = normalizeText(videoVid);
    const startedAt = Date.now();
    return new Promise((resolve, reject) => {
      let settled = false;
      let timer = 0;
      const cleanup = () => {
        if (timer) {
          window.clearInterval(timer);
          timer = 0;
        }
        const listenerIndex = yangshipinVideoInfoResponseListeners.indexOf(onCapturedResponse);
        if (listenerIndex >= 0) {
          yangshipinVideoInfoResponseListeners.splice(listenerIndex, 1);
        }
      };
      const rejectOnce = (error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };
      const resolveOnce = (videoUrl) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(videoUrl);
      };
      const handleCapturedResponse = (capturedResponse) => {
        if (settled || !capturedResponse) {
          return;
        }
        try {
          resolveOnce(buildYangshipinVideoUrlFromPlayInfo(capturedResponse.responseText, normalizedVid));
        } catch (error) {
          rejectOnce(error);
        }
      };
      function onCapturedResponse(capturedResponse) {
        handleCapturedResponse(capturedResponse);
      }

      yangshipinVideoInfoResponseListeners.push(onCapturedResponse);
      if (latestYangshipinVideoInfoResponse) {
        handleCapturedResponse(latestYangshipinVideoInfoResponse);
      }
      timer = window.setInterval(() => {
        if (settled) {
          return;
        }
        if (cancelCheck && cancelCheck()) {
          rejectOnce(new Error('视频地址任务已取消'));
          return;
        }
        if (Date.now() - startedAt >= DETAIL_PAGE_TIMEOUT) {
          rejectOnce(new Error('未获取到视频播放信息'));
        }
      }, 250);
    });
  }

  async function fetchYangshipinVideoUrlByWorker(videoVid, cancelCheck) {
    const normalizedVid = normalizeText(videoVid);
    if (!normalizedVid) {
      throw new Error('未提供视频编号');
    }
    const requestId = createRuntimeToken('media');
    const requestKey = buildStandardizationMediaWorkerRequestKey(requestId);
    const responseKey = buildStandardizationMediaWorkerResponseKey(requestId);
    const workerUrl = `${YANGSHIPIN_VIDEO_WORKER_URL}?vid=${encodeURIComponent(normalizedVid)}&ysp_media_request=${encodeURIComponent(requestId)}`;
    try {
      await storageRemove(responseKey);
      await storageSetCached({
        [requestKey]: {
          videoVid: normalizedVid
        }
      });
      openUrlInNewTab(workerUrl);
      const response = await waitForStandardizationMediaWorkerResponse(requestId, MEDIA_WORKER_RESPONSE_TIMEOUT, cancelCheck);
      if (!response || typeof response !== 'object') {
        throw new Error('未收到央视频页面返回结果');
      }
      if (response.status === 'error') {
        throw new Error(normalizeText(response.error) || '央视频页面返回错误');
      }
      const videoUrl = normalizeMediaSourceUrl(response.videoUrl);
      if (!videoUrl) {
        throw new Error('央视频页面未读取到完整视频地址');
      }
      return videoUrl;
    } finally {
      await storageRemove([requestKey, responseKey]);
    }
  }

  function getListBodyScrollElement() {
    const selectors = [
      '.vxe-table--body-wrapper',
      '.vxe-table--body-wrapper.body--wrapper',
      '.vxe-table--main-wrapper .vxe-table--body-wrapper',
      '.vxe-table--body'
    ];
    for (const selector of selectors) {
      const element = Array.from(document.querySelectorAll(selector)).find((node) => {
        return isVisible(node) && node.scrollHeight >= node.clientHeight;
      });
      if (element) {
        return element;
      }
    }
    return null;
  }

  async function waitForListTableSettled(cancelCheck) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < QUERY_TIMEOUT) {
      if (cancelCheck && cancelCheck()) {
        throw new Error('任务已结束');
      }
      if (!getVisibleLoadingMask()) {
        await sleep(250);
        if (!getVisibleLoadingMask()) {
          return;
        }
      }
      await sleep(200);
    }
    throw new Error('列表加载超时');
  }

  async function gotoListPageNumber(pageNumber, cancelCheck) {
    const targetPage = Math.max(1, Number(pageNumber) || 1);
    const input = await waitFor(() => getPagerGotoInput(), 5000, '未找到分页跳转输入框', { cancelCheck });
    if (getPagerCurrentPage() === targetPage) {
      await waitForListTableSettled(cancelCheck);
      return;
    }
    input.focus();
    setNativeInputValue(input, String(targetPage));
    input.dispatchEvent(createKeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }));
    input.dispatchEvent(createKeyboardEvent('keyup', { key: 'Enter', code: 'Enter' }));
    input.dispatchEvent(createKeyboardEvent('keypress', { key: 'Enter', code: 'Enter' }));
    input.blur();
    document.body.dispatchEvent(createMouseEvent('click'));
    await waitFor(() => getPagerCurrentPage() === targetPage, 15000, `跳转到第 ${targetPage} 页失败`, { cancelCheck });
    await waitForListTableSettled(cancelCheck);
  }

  async function scrollListBodyTo(scrollTop) {
    const body = getListBodyScrollElement();
    if (!body) {
      return false;
    }
    body.scrollTop = Math.max(0, scrollTop);
    body.dispatchEvent(new Event('scroll', { bubbles: true }));
    await sleep(450);
    return true;
  }

  function formatStandardizationFixedContext(titleText, detailCategoryContext) {
    const normalizedTitle = normalizeText(titleText);
    const normalizedCategoryContext = normalizeMultilineText(detailCategoryContext);
    return [
      '本次标准化固定上下文：',
      normalizedTitle ? `标题：${normalizedTitle}` : '标题：无',
      normalizedCategoryContext ? `品类信息：\n${normalizedCategoryContext}` : '品类信息：无'
    ].join('\n');
  }

  function buildOmniVideoSummaryPrompt(titleText, detailCategoryContext) {
    return [
      '你是央视频标准化的视频理解助手。',
      '请认真看完整个视频，不要只看开头，也不要凭印象猜测。',
      formatStandardizationFixedContext(titleText, detailCategoryContext),
      '请只返回 JSON，不要输出其他文字。',
      'JSON 里的字段名和字符串值只能使用英文双引号，禁止使用单引号。',
      '必须覆盖：',
      '1. overall_theme：视频整体主题，必须简洁明确。',
      '2. timeline：按时间顺序列出关键片段，最多 5 条，time 用 00:00-00:20 这类格式，summary 尽量控制在 18 个字以内。',
      '3. title_clues：标题里能直接支撑打标的关键词或主题线索。',
      '4. repeated_signals：视频里反复出现、多次提及、或持续围绕展开的核心信息，最多 4 条。',
      '5. strong_evidence：真正能支撑标准化成品标签的强证据，最多 4 条，必须谨慎。',
      '6. uncertain_points：不确定、无法确认、证据不足的信息，最多 3 条。',
      '如果某个信息不确定，必须写入 uncertain_points，不要臆断。',
      '所有数组都尽量短，不要解释，不要补充 JSON 以外的文字。',
      '',
      '输出格式：',
      '{"overall_theme":"","timeline":[{"time":"","summary":""}],"title_clues":[],"repeated_signals":[],"strong_evidence":[],"uncertain_points":[]}'
    ].filter((line) => line !== '').join('\n');
  }

  function buildFirstTagJudgePrompt(titleText, detailCategoryContext, videoSummary) {
    return [
      '你是央视频标准化系统的标准化助手。',
      '这是一条待标准化视频，成品标签栏当前按空处理。你的任务是从零判断应该打哪些成品标签。',
      '请根据“标题”“品类信息”“规则”和“视频理解结果”，判断哪些标签值得去标签库查询验证。',
      '请完整使用“本次标准化固定上下文”，不要丢掉品类、标题或视频理解结果。',
      '规则：',
      '1. search_candidates 只保留真正值得去标签库查询验证的关键词，每个候选都要给 keyword 和 reason。',
      '2. keyword 必须是标签库搜索词，不是标题片段，也不是一句话；优先 2-8 个汉字，最多 12 个字符。',
      '3. 如果一个方向包含多个主题，拆成多条候选；例如不要写“老年人户外锻炼改善心肺功能”，要拆成“老年人”“户外锻炼”“心肺功能”这类短词。',
      '4. 禁止把人物动作、完整事件、长描述当 keyword。',
      '5. 单次擦边出现、弱相关、泛泛概念、可有可无的标签，一律不要给。',
      '6. summary 用一句中文总结判断原因。',
      '7. 只能返回 JSON，不要返回其他文字。',
      '',
      formatStandardizationFixedContext(titleText, detailCategoryContext),
      `视频理解结果：${videoSummary}`,
      '',
      '输出格式：',
      '{"search_candidates":[{"keyword":"","reason":""}],"summary":""}'
    ].join('\n');
  }

  function buildFinalTagJudgePrompt(titleText, detailCategoryContext, videoSummary, firstJudge, searchResults) {
    return [
      '你是央视频标准化系统的最终标准化裁定助手。',
      '这一步决定最终要写入成品标签栏的标签。',
      '你现在拿到了标题、视频理解结果、候选标签判断结果，以及候选标签在本地标签库中的真实检索结果。',
      '请完整使用“本次标准化固定上下文”，不要丢掉品类、标题、视频理解结果、候选判断或标签库结果。',
      '规则：',
      '1. standard_tags_actionable 只保留“本地标签库真实存在”且“确实应该写入成品标签栏”的重要标签。',
      '2. candidate_decisions 必须覆盖每一个已检索的候选标签，每个候选只出现一次，accepted 表示最终是否采纳，reason 必须说明原因。',
      '3. 如果 accepted 为 true，必须在 candidate_decisions 里补充 matched_option_id、matched_option_name、matched_option_type、matched_option_remark，指出你最终采纳的是哪一个检索结果。',
      '4. evidence_summary 要概括真正支持结论的强证据，重点看标题、主题、反复出现的信息、画面与口播共同支持的点。',
      '5. final_reason 用一句中文说明最终判断依据。',
      '6. 单次擦边出现、弱相关、没有反复支撑、不是主题核心的标签，一律不要写入。',
      '7. 只能返回 JSON，不要返回其他文字。',
      '',
      formatStandardizationFixedContext(titleText, detailCategoryContext),
      `视频理解结果：${videoSummary}`,
      `候选标签判断：${JSON.stringify(firstJudge || {})}`,
      `候选标签真实检索结果：${JSON.stringify(searchResults || [])}`,
      '',
      '输出格式：',
      '{"standard_tags_actionable":[],"candidate_decisions":[{"keyword":"","accepted":false,"reason":"","matched_option_id":"","matched_option_name":"","matched_option_type":"","matched_option_remark":""}],"evidence_summary":"","final_reason":""}'
    ].join('\n');
  }

  async function closeCurrentWorkerPage() {
    window.setTimeout(() => {
      try {
        window.close();
      } catch (error) {
        // ignore
      }
      window.setTimeout(() => {
        if (!window.closed) {
          location.replace('about:blank');
        }
      }, 400);
    }, 300);
  }

  async function runStandardizationMediaWorker(requestId) {
    const requestKey = buildStandardizationMediaWorkerRequestKey(requestId);
    const responseKey = buildStandardizationMediaWorkerResponseKey(requestId);
    let responsePayload = null;
    let requestCancelled = false;
    let requestWatcher = 0;
    const stopWatchingRequest = () => {
      if (requestWatcher) {
        window.clearInterval(requestWatcher);
        requestWatcher = 0;
      }
    };
    const syncRequestState = async () => {
      const requestState = await storageGet(requestKey);
      const request = requestState[requestKey];
      requestCancelled = !request || typeof request !== 'object';
      if (requestCancelled) {
        stopWatchingRequest();
      }
      return request;
    };
    const cancelCheck = () => requestCancelled;
    try {
      enforcePageMuted({ pausePlayback: false });
      const request = await syncRequestState();
      if (!request) {
        throw new Error('未找到视频地址任务上下文');
      }
      requestWatcher = window.setInterval(() => {
        syncRequestState().catch(() => undefined);
      }, 250);

      const videoVid = normalizeText(request.videoVid || new URLSearchParams(location.search).get('vid'));
      if (!videoVid) {
        throw new Error('未提供视频编号');
      }

      const videoUrl = await waitForYangshipinVideoInfoUrl(videoVid, cancelCheck);

      responsePayload = {
        status: 'completed',
        videoUrl
      };
    } catch (error) {
      responsePayload = {
        status: 'error',
        error: error && error.message ? error.message : String(error)
      };
    } finally {
      stopWatchingRequest();
      const latestRequestState = await storageGet(requestKey);
      const latestRequest = latestRequestState[requestKey];
      if (!latestRequest || typeof latestRequest !== 'object') {
        await closeCurrentWorkerPage();
        return;
      }
      await storageSetCached({
        [responseKey]: responsePayload
      });
      await storageRemove(requestKey);
      await closeCurrentWorkerPage();
    }
  }

  async function runStandardizationDetailWorker(requestId) {
    const requestKey = buildStandardizationWorkerRequestKey(requestId);
    const responseKey = buildStandardizationWorkerResponseKey(requestId);
    const cancelCheck = () => JOB_ABORT_CONTROLLER.standardizationWorkerStopped;
    const reportProgress = async (text, patch) => {
      const nextPatch = patch && typeof patch === 'object' ? { ...patch } : {};
      const logLines = normalizeProgressLogLines(nextPatch.logLines);
      try {
        await updateStandardizationWorkerProgress(requestId, {
          text,
          logLines
        });
      } catch (error) {
        // ignore progress sync errors
      }
      if (app && typeof app.applyStandardizationWorkerProgress === 'function') {
        app.applyStandardizationWorkerProgress(text, logLines);
      }
    };
    startStandardizationWorkerAbortWatcher(requestId);
    enforcePageMuted({ pausePlayback: true });
    await reportProgress('详情页已打开，正在加载内容', { stageLabel: '加载详情页' });
    let responsePayload = null;
    let keepDetailPageOpen = false;
    try {
      await ensureStandardizationWorkerNotStopped(requestId);
      const requestState = await storageGet(requestKey);
      const request = requestState[requestKey];
      if (!request || typeof request !== 'object') {
        throw new Error('未找到标准化任务上下文');
      }
      const categoryRule = normalizeMultilineText(request.categoryRule);
      const reasoningEffort = normalizeStandardizationReasoningEffort(request.reasoningEffort);
      const runMode = normalizeStandardizationRunMode(request.runMode);
      const listVid = normalizeText(request.taskId || getDetailPageTaskId());

      await waitForDetailPageReady(cancelCheck);
      await waitForDetailAnalysisReady(listVid, cancelCheck);
      await reportProgress('正在读取视频信息', { stageLabel: '读取视频信息' });
      await ensureStandardizationWorkerNotStopped(requestId);

      const titleText = getDetailTitleText();
      const durationSeconds = await waitForDetailDurationSeconds(cancelCheck);
      const videoVid = getDetailVideoVid(listVid);
      const detailTaskInfo = await fetchDetailTaskInfo(listVid, cancelCheck);
      const detailCategoryContext = getDetailCategoryContextFromInfo(detailTaskInfo, request.primaryCategory);
      await reportProgress(
        durationSeconds > 0
          ? `已读取视频信息，时长 ${formatDurationSeconds(durationSeconds)}`
          : '已读取视频信息，未获取到时长，将继续分析',
        {
          stageLabel: '时长判断',
          logLines: [
            titleText ? `标题：${titleText}` : '',
            detailCategoryContext ? `品类信息：${detailCategoryContext.replace(/\n+/g, '；')}` : '',
            `运行模式：${getStandardizationRunModeLabel(runMode)}`,
            `思考深度：${getStandardizationReasoningEffortLabel(reasoningEffort)}`,
            videoVid ? '视频编号已读取' : '',
            durationSeconds > 0 ? `视频时长：${formatDurationSeconds(durationSeconds)}` : '视频时长：未读取到'
          ]
        }
      );

      await reportProgress('视频信息读取完成，准备开始判断', { stageLabel: '时长判断' });

      if (durationSeconds > MAX_STANDARDIZATION_VIDEO_DURATION_SECONDS) {
        const finalReason = `视频时长 ${formatDurationSeconds(durationSeconds)}，超过 ${formatDurationSeconds(MAX_STANDARDIZATION_VIDEO_DURATION_SECONDS)}，按规则跳过`;
        await reportProgress('视频超过 5 分钟，按规则跳过', {
          stageLabel: '时长判断',
          finalReason,
          skipReason: 'long_video',
          evidenceSummary: '当前视频超过 5 分钟，按标准化规则直接跳过，不进入视频理解。',
          missingCandidates: [],
          validatedCandidates: [],
          rejectedCandidates: [],
          logLines: [
            `最终判断：${finalReason}`,
            '证据摘要：当前视频超过 5 分钟，按标准化规则直接跳过，不进入视频理解。'
          ]
        });
        responsePayload = {
          status: 'completed',
          durationSeconds,
          skipped: true,
          skipReason: 'long_video'
        };
        await reportProgress('长视频跳过完成，正在返回结果', { stageLabel: '已完成' });
        return;
      }

      const apiKey = normalizeText(request.apiKey);
      if (!apiKey) {
        throw new Error('配置文件里没有可用密钥');
      }
      if (!videoVid) {
        throw new Error('未读取到视频编号');
      }

      await reportProgress('正在获取视频地址', { stageLabel: '获取视频地址' });
      let videoUrl = '';
      try {
        videoUrl = await fetchYangshipinVideoUrlByWorker(videoVid, cancelCheck);
      } catch (error) {
        const videoUrlMessage = normalizeText(error && error.message ? error.message : String(error)) || '视频地址获取失败';
        const finalReason = `视频地址获取失败，当前条目已跳过：${videoUrlMessage}`;
        await reportProgress('视频地址获取失败，当前条目已跳过', {
          stageLabel: '获取视频地址',
          finalReason,
          skipReason: 'video_url_failed',
          evidenceSummary: finalReason,
          missingCandidates: [],
          validatedCandidates: [],
          rejectedCandidates: [],
          logLines: [
            `最终判断：${finalReason}`
          ]
        });
        responsePayload = {
          status: 'completed',
          skipped: true,
          skipReason: 'video_url_failed',
          error: videoUrlMessage
        };
        await reportProgress('视频地址获取失败，正在返回结果', { stageLabel: '已完成' });
        return;
      }
      await ensureStandardizationWorkerNotStopped(requestId);
      await reportProgress('视频播放地址已获取', { stageLabel: '获取视频地址' });

      await reportProgress('正在理解视频内容', { stageLabel: '视频理解' });
      let videoSummaryRaw = '';
      try {
        videoSummaryRaw = await requestOmniVideoSummary(
          apiKey,
          videoUrl,
          buildOmniVideoSummaryPrompt(titleText, detailCategoryContext),
          categoryRule,
          detailCategoryContext,
          reasoningEffort,
          cancelCheck
        );
      } catch (error) {
        const videoInspectionMessage = normalizeText(error && error.message ? error.message : String(error));
        if (!isModelVideoInspectionErrorMessage(videoInspectionMessage)) {
          throw error;
        }
        const finalReason = '视频内容触发安全拦截，当前条目已跳过';
        const evidenceSummary = 'AI 提示视频内容触发安全拦截';
        await reportProgress('视频内容触发安全拦截，当前条目已跳过', {
          stageLabel: '视频理解',
          finalReason,
          skipReason: 'content_inspection_failed',
          evidenceSummary,
          missingCandidates: [],
          validatedCandidates: [],
          rejectedCandidates: [],
          logLines: [
            `最终判断：${finalReason}`,
            `证据摘要：${evidenceSummary}`
          ]
        });
        responsePayload = {
          status: 'completed',
          skipped: true,
          skipReason: 'content_inspection_failed'
        };
        await reportProgress('内容安全跳过完成，正在返回结果', { stageLabel: '已完成' });
        return;
      }
      const videoAnalysis = normalizeOmniVideoAnalysis(parseModelJsonObject(videoSummaryRaw, '视频理解'));
      const videoSummary = formatOmniVideoAnalysisForPrompt(videoAnalysis);
      const baseEvidenceSummary = [
        videoAnalysis.overallTheme ? `整体主题：${videoAnalysis.overallTheme}` : '',
        videoAnalysis.titleClues.length ? `标题线索：${videoAnalysis.titleClues.join('、')}` : '',
        videoAnalysis.repeatedSignals.length ? `重复信号：${videoAnalysis.repeatedSignals.join('、')}` : '',
        videoAnalysis.strongEvidence.length ? `强证据：${videoAnalysis.strongEvidence.join('、')}` : '',
        videoAnalysis.timeline.length
          ? `时间线：${videoAnalysis.timeline.map((item) => `${item.time || '时间未标注'} ${item.summary || '无描述'}`).join('；')}`
          : '',
        videoAnalysis.uncertainPoints.length ? `不确定点：${videoAnalysis.uncertainPoints.join('、')}` : ''
      ].filter(Boolean).join('\n');
      await ensureStandardizationWorkerNotStopped(requestId);
      await reportProgress('视频理解完成，正在整理证据', {
        stageLabel: '视频理解',
        logLines: [
          videoAnalysis.overallTheme ? `整体主题：${videoAnalysis.overallTheme}` : '',
          videoAnalysis.titleClues.length ? `标题线索：${videoAnalysis.titleClues.join('、')}` : '',
          videoAnalysis.repeatedSignals.length ? `重复信号：${videoAnalysis.repeatedSignals.join('、')}` : '',
          videoAnalysis.strongEvidence.length ? `强证据：${videoAnalysis.strongEvidence.join('、')}` : '',
          videoAnalysis.timeline.length
            ? `时间线：${videoAnalysis.timeline.map((item) => `${item.time || '时间未标注'} ${item.summary || '无描述'}`).join('；')}`
            : '',
          videoAnalysis.uncertainPoints.length ? `不确定点：${videoAnalysis.uncertainPoints.join('、')}` : ''
        ]
      });

      await reportProgress('正在判断候选标签', { stageLabel: '候选标签判断' });
      await reportProgress('正在加载标签库', { stageLabel: '标签库' });
      const tagLibrary = await loadTagLibrary();
      await reportProgress(`标签库已加载：${tagLibrary.count} 条`, { stageLabel: '标签库' });
      const firstJudgeRaw = await requestTagJudge(
        apiKey,
        buildFirstTagJudgePrompt(titleText, detailCategoryContext, videoSummary),
        categoryRule,
        detailCategoryContext,
        reasoningEffort,
        cancelCheck
      );
      const firstJudge = parseModelJsonObject(firstJudgeRaw, '候选标签判断');
      const searchCandidates = normalizeTagSearchCandidateArray(firstJudge.search_candidates);
      const missingCandidates = searchCandidates.map((item) => item.keyword);
      const firstSummary = normalizeText(firstJudge.summary);
      await ensureStandardizationWorkerNotStopped(requestId);

      await reportProgress(
        searchCandidates.length
          ? `正在验证候选标签（1/${searchCandidates.length}）`
          : '当前没有候选标签需要验证',
        {
          stageLabel: '标签库验证',
          logLines: [
            firstSummary ? `候选标签判断：${firstSummary}` : '',
            missingCandidates.length ? `候选关键词：${missingCandidates.join('、')}` : '候选关键词：无',
            `标签库记录：${tagLibrary.count} 条`
          ],
          validatedCandidates: searchCandidates.map((item) => ({
            keyword: item.keyword,
            searchReason: item.reason,
            options: [],
            accepted: null,
            reason: '',
            matchedOption: null
          }))
        }
      );
      const searchResults = [];
      for (let candidateIndex = 0; candidateIndex < searchCandidates.length; candidateIndex += 1) {
        const candidate = searchCandidates[candidateIndex];
        if (!candidate || !candidate.keyword) {
          continue;
        }
        await reportProgress(`正在验证候选标签（${candidateIndex + 1}/${searchCandidates.length}）`);
        await ensureStandardizationWorkerNotStopped(requestId);
        const options = searchTagLibraryOptions(tagLibrary, candidate.keyword, []);
        searchResults.push({
          keyword: candidate.keyword,
          reason: candidate.reason,
          options
        });
        await reportProgress(`候选标签 ${candidate.keyword} 检索完成`, {
          stageLabel: '标签库验证',
          logLines: [
            candidate.reason ? `检索原因：${candidate.reason}` : '',
            `标签库结果：${options.map((option) => formatTagDetailForDisplay(option)).join('；') || '标签库无结果'}`
          ]
        });
      }

      await reportProgress('正在进行最终标签裁定', { stageLabel: '最终标签裁定' });
      const finalJudgeRaw = await requestTagJudge(
        apiKey,
        buildFinalTagJudgePrompt(
          titleText,
          detailCategoryContext,
          videoSummary,
          {
            search_candidates: searchCandidates,
            summary: firstSummary
          },
          searchResults
        ),
        categoryRule,
        detailCategoryContext,
        reasoningEffort,
        cancelCheck
      );
      const finalJudge = parseModelJsonObject(finalJudgeRaw, '最终标签裁定');
      const standardTagsActionable = normalizeTagArray(finalJudge.standard_tags_actionable);
      const candidateDecisions = normalizeCandidateDecisionArray(finalJudge.candidate_decisions);
      const validatedCandidates = buildValidatedCandidates(searchResults, candidateDecisions);
      const acceptedTagDetails = getAcceptedMatchedTagDetails(validatedCandidates);
      const rejectedCandidates = validatedCandidates
        .filter((item) => item.accepted === false)
        .map((item) => ({
          keyword: item.keyword,
          reason: item.reason
        }));
      const evidenceSummary = normalizeText(finalJudge.evidence_summary) || [firstSummary, baseEvidenceSummary].filter(Boolean).join('\n');
      const finalReason = normalizeText(finalJudge.final_reason) || firstSummary;
      await reportProgress('最终标签裁定完成，正在整理结果', {
        stageLabel: '最终标签裁定',
        logLines: [
          evidenceSummary ? `证据摘要：${evidenceSummary.replace(/\n+/g, '；')}` : '',
          validatedCandidates.length
            ? `候选标签裁定：${validatedCandidates.map((item) => {
              const resultLabel = item.accepted === true ? '采纳' : item.accepted === false ? '放弃' : '待定';
              const parts = [`${item.keyword}(${resultLabel})`];
              if (item.reason) {
                parts.push(item.reason);
              }
              if (item.matchedOption) {
                parts.push(`采纳结果 ${formatTagDetailForDisplay(item.matchedOption)}`);
              }
              return parts.join('，');
            }).join('；')}`
            : '候选标签裁定：无',
          rejectedCandidates.length
            ? `放弃候选：${rejectedCandidates.map((item) => `${item.keyword}（${item.reason || '暂无说明'}）`).join('；')}`
            : '放弃候选：无',
          standardTagsActionable.length ? `AI 建议标签：${standardTagsActionable.join('、')}` : 'AI 建议标签：无',
          acceptedTagDetails.length ? `准备写入成品标签：${acceptedTagDetails.map((item) => formatTagDetailForDisplay(item)).join('；')}` : '准备写入成品标签：无',
          finalReason ? `最终判断：${finalReason}` : ''
        ]
      });

      if (!acceptedTagDetails.length) {
        responsePayload = {
          status: 'completed',
          skipped: true,
          skipReason: 'no_available_tag',
          finalReason
        };
        await reportProgress('没有可写入的本地标签库标签，已跳过当前条目', {
          stageLabel: '已跳过',
          logLines: ['跳过原因：没有可写入的本地标签库标签']
        });
        return;
      }

      await reportProgress(`正在写入成品标签（${acceptedTagDetails.length} 个）`, { stageLabel: '写入成品标签' });
      await writeDetailFinishedTags(
        acceptedTagDetails,
        cancelCheck,
        (tagDetail, index, total) => reportProgress(
          `正在写入成品标签（${index + 1}/${total}）`,
          {
            stageLabel: '写入成品标签',
            logLines: [`写入标签：${formatTagDetailForDisplay(tagDetail)}`]
          }
        )
      );
      await reportProgress('成品标签写入并校验完成', {
        stageLabel: '写入成品标签',
        logLines: [`已写入标签：${acceptedTagDetails.map((item) => formatTagDetailForDisplay(item)).join('；')}`]
      });

      if (runMode === 'live') {
        await reportProgress('实操模式：正在点击标准化通过', { stageLabel: '提交标准化' });
        await clickDetailStandardizationPassButton(cancelCheck);
        await reportProgress('标准化通过已提交', { stageLabel: '已完成' });
      } else {
        keepDetailPageOpen = true;
        await reportProgress('演示模式：已写入成品标签，详情页保留给人工查看', { stageLabel: '已完成' });
      }

      responsePayload = {
        status: 'completed',
        standardTagsActionable: acceptedTagDetails,
        runMode,
        submitted: runMode === 'live'
      };
      await reportProgress('处理完成，正在返回结果', { stageLabel: '已完成' });
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      responsePayload = {
        status: 'error',
        error: message
      };
    } finally {
      await storageSetCached({
        [responseKey]: responsePayload
      });
      await storageRemove(requestKey);
      await clearStandardizationWorkerStopSignal(requestId);
      stopStandardizationWorkerAbortWatcher();
      if (keepDetailPageOpen) {
        return;
      }
      try {
        await clickDetailExitButton();
      } catch (error) {
        // ignore
      }
      await closeCurrentWorkerPage();
    }
  }

  function isModelVideoInspectionErrorMessage(message) {
    const normalized = normalizeText(message).toLowerCase();
    if (!normalized) {
      return false;
    }
    return normalized.includes('internalerror.algo.datainspectionfailed')
      || normalized.includes('input video data may contain inappropriate content')
      || normalized.includes('视频数据可能包含不适宜内容')
      || normalized.includes('视频内容可能包含不适宜内容');
  }

  async function applyCategorySelection(item, cancelCheck, onSelected) {
    const primary = getCategoryWrapper(0);
    if (!primary) {
      throw new Error('未找到品类选项');
    }
    await selectOption(primary, item.queryLabel, cancelCheck);
    if (typeof onSelected === 'function') {
      onSelected(item);
    }
  }

  async function applySelectFilter(label, value, cancelCheck) {
    const wrapper = getSelectWrapperByLabel(label, 0);
    if (!wrapper) {
      throw new Error(`未找到筛选条件：${label}`);
    }
    await selectOption(wrapper, value, cancelCheck);
  }

  async function prepareListQueryFilters(item, options) {
    const config = options && typeof options === 'object' ? options : {};
    const cancelCheck = typeof config.cancelCheck === 'function' ? config.cancelCheck : null;
    const dateLabel = normalizeText(config.dateLabel);
    const range = config.range && typeof config.range === 'object' ? config.range : null;
    const filters = Array.isArray(config.filters) ? config.filters : [];
    await clickResetButton();
    await applyCategorySelection(item, cancelCheck, config.onCategorySelected);
    if (dateLabel && range && range.start instanceof Date && range.end instanceof Date) {
      await setDateRange(dateLabel, range.start, range.end, cancelCheck);
    }
    for (const filter of filters) {
      if (!filter || !normalizeText(filter.label) || !normalizeText(filter.value)) {
        continue;
      }
      await applySelectFilter(filter.label, filter.value, cancelCheck);
    }
  }

  class YspStandardizationApp {
    constructor() {
      this.panel = null;
      this.handleOutsideInteraction = null;
      this.handleViewportChange = null;
      this.pageGuardEvents = ['pointerdown', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'touchstart', 'touchmove', 'wheel'];
      this.settingsModalOpen = false;
      this.settingsDraft = createDefaultWorkbenchSettings();
      this.settings = createDefaultWorkbenchSettings();
      this.runtime = { minimized: false, running: false, openGroupMenu: '', jobType: '', listJobAbortToken: 0, stopping: false, pauseRequested: false, settingsSaving: false, settingsSavingText: '', statusText: '等待开始', logs: [], checkpoint: null, seenTaskIds: [], seenTaskIdSet: new Set() };
      this.refs = {};
    }

    async init() { if (!isSupportedPage()) return; injectPanelStyle(); await this.clearExpiredCache(); await this.loadState(); this.mountPanel(); if (isListPage()) { await this.tryResume(); await this.tryStartPendingStandardizationJob(); } }
    async clearExpiredCache() { const state = await storageGet(STORAGE_KEYS.checkpoint); const checkpoint = state[STORAGE_KEYS.checkpoint]; const cutoffDate = getQuarterCutoffDateString(new Date()); const dateValue = checkpoint && normalizeText(checkpoint.updatedAt || checkpoint.startedAt).slice(0, 10); if (dateValue && isDateExpiredByQuarter(dateValue, cutoffDate)) await storageRemove(STORAGE_KEYS.checkpoint); }
    async loadState() { const state = await storageGet([STORAGE_KEYS.settings, STORAGE_KEYS.report, STORAGE_KEYS.checkpoint, STORAGE_KEYS.seenTaskIds]); this.settings = normalizeWorkbenchSettings(state[STORAGE_KEYS.settings]); this.settingsDraft = cloneWorkbenchSettings(this.settings); this.runtime.minimized = Boolean(this.settings.ui.panelMinimized); this.runtime.report = normalizeStandardReport(state[STORAGE_KEYS.report]); this.runtime.checkpoint = normalizeStandardizationCheckpoint(state[STORAGE_KEYS.checkpoint]); this.runtime.seenTaskIds = normalizeStandardizationSeenTaskIds(state[STORAGE_KEYS.seenTaskIds]); this.runtime.seenTaskIdSet = new Set(this.runtime.seenTaskIds); this.runtime.logs = []; this.runtime.statusText = '等待开始'; this.runtime.running = false; this.runtime.jobType = ''; this.runtime.listJobAbortToken = 0; this.runtime.stopping = false; this.runtime.pauseRequested = false; if (this.runtime.checkpoint && this.runtime.checkpoint.status === 'running') { this.runtime.running = true; this.runtime.jobType = 'standardization'; this.runtime.listJobAbortToken = beginListJobAbortSession(); this.runtime.logs = Array.isArray(this.runtime.checkpoint.logs) ? this.runtime.checkpoint.logs.slice(0, MAX_LOGS).map((log) => formatUserVisibleLogText(log)).filter(Boolean) : []; this.runtime.statusText = formatUserVisibleLogText(this.runtime.checkpoint.statusText || '检测到未完成标准化，正在准备继续'); return; } if (this.runtime.checkpoint && this.runtime.checkpoint.status === 'paused') { this.runtime.statusText = formatUserVisibleLogText(this.runtime.checkpoint.statusText || '存在已暂停标准化，可点击继续任务'); this.runtime.logs = Array.isArray(this.runtime.checkpoint.logs) ? this.runtime.checkpoint.logs.slice(0, MAX_LOGS).map((log) => formatUserVisibleLogText(log)).filter(Boolean) : []; return; } if (this.runtime.checkpoint && this.runtime.checkpoint.statusText) { this.runtime.statusText = formatUserVisibleLogText(this.runtime.checkpoint.statusText); this.runtime.logs = Array.isArray(this.runtime.checkpoint.logs) ? this.runtime.checkpoint.logs.slice(0, MAX_LOGS).map((log) => formatUserVisibleLogText(log)).filter(Boolean) : []; } }

    mountPanel() {
      const existing = document.getElementById('ysp-standardization-panel-root');
      if (existing) existing.remove();
      const root = document.createElement('div');
      root.id = 'ysp-standardization-panel-root';
      root.innerHTML = `
        <div class="ysp-std-panel__backdrop"></div>
        <div class="ysp-std-panel__popup-layer" data-role="popup-layer"></div>
        <div class="ysp-std-panel">
          <div class="ysp-std-panel__header">
            <div class="ysp-std-panel__header-top">
              <div><div class="ysp-std-panel__title">央视频标准化助手</div></div>
              <div class="ysp-std-panel__header-actions">
                <button type="button" class="ysp-std-panel__header-chip" data-role="open-settings">设置</button>
                <div class="ysp-std-panel__header-chip">v${SCRIPT_VERSION}</div>
                <button type="button" class="ysp-std-panel__header-chip" data-role="minimize">收起</button>
              </div>
            </div>
          </div>
          <div class="ysp-std-panel__body">
            <div class="ysp-std-panel__main">
              <section class="ysp-std-panel__module">
                <div class="ysp-std-panel__module-body">
                  <div class="ysp-std-panel__field-grid">
                    <label class="ysp-std-panel__date-field" for="ysp-standardization-start-date">
                      <span class="ysp-std-panel__date-caption">开始日期</span>
                      <input id="ysp-standardization-start-date" class="ysp-std-panel__date" type="date" />
                    </label>
                    <label class="ysp-std-panel__date-field" for="ysp-standardization-end-date">
                      <span class="ysp-std-panel__date-caption">结束日期</span>
                      <input id="ysp-standardization-end-date" class="ysp-std-panel__date" type="date" />
                    </label>
                    <label class="ysp-std-panel__date-field" for="ysp-standardization-target-count">
                      <span class="ysp-std-panel__date-caption">目标条数</span>
                      <input id="ysp-standardization-target-count" class="ysp-std-panel__input" type="number" min="1" max="999" step="1" />
                    </label>
                    <label class="ysp-std-panel__date-field" for="ysp-standardization-run-mode">
                      <span class="ysp-std-panel__date-caption">运行模式</span>
                      <select id="ysp-standardization-run-mode" class="ysp-std-panel__input">
                        <option value="demo">演示模式</option>
                        <option value="live">实操模式</option>
                      </select>
                    </label>
                  </div>
                  <div class="ysp-std-panel__field">
                    <span class="ysp-std-panel__label">标准化品类</span>
                    <div data-role="standardization-groups"></div>
                  </div>
                  <div class="ysp-std-panel__range-card">
                    <div class="ysp-std-panel__range-head">
                      <span class="ysp-std-panel__label">思考深度</span>
                      <span class="ysp-std-panel__range-value" data-role="reasoning-effort-label">思考深度：中</span>
                    </div>
                    <input id="ysp-standardization-reasoning-effort" class="ysp-std-panel__range" type="range" min="0" max="3" step="1" value="2" aria-label="思考深度" />
                    <div class="ysp-std-panel__range-labels" aria-hidden="true">
                      <span>极少</span>
                      <span>低</span>
                      <span>中</span>
                      <span>高</span>
                    </div>
                  </div>
                  <div class="ysp-std-panel__actions">
                    <button type="button" class="ysp-std-panel__button ysp-std-panel__button--primary" data-role="start-standardization">开始标准化</button>
                  </div>
                </div>
              </section>
            </div>
            <div class="ysp-std-panel__side">
              <div class="ysp-std-panel__status" data-role="status"></div>
              <div class="ysp-std-panel__download-card" data-role="downloads-card" hidden>
                <div class="ysp-std-panel__toolbar"><span class="ysp-std-panel__label">下载结果</span></div>
                <div class="ysp-std-panel__download-list" data-role="downloads"></div>
              </div>
              <div class="ysp-std-panel__log-card">
                <div class="ysp-std-panel__toolbar"><span class="ysp-std-panel__label">运行日志</span></div>
                <div class="ysp-std-panel__log-list" data-role="logs"></div>
              </div>
              <div class="ysp-std-panel__actions">
                <button type="button" class="ysp-std-panel__button" data-role="pause-resume">暂停任务</button>
                <button type="button" class="ysp-std-panel__button" data-role="stop">结束任务</button>
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="ysp-std-panel__dock" data-role="dock" aria-label="展开央视频标准化助手" title="展开央视频标准化助手">标准化助手</button>
        <div class="ysp-std-panel__modal-mask" data-role="settings-mask">
          <div class="ysp-std-panel__modal">
            <div class="ysp-std-panel__toolbar"><span class="ysp-std-panel__label">设置</span></div>
            <label class="ysp-std-panel__date-field" for="ysp-settings-config-workbook-file">
              <span class="ysp-std-panel__date-caption">上传 核心配置.xlsx</span>
              <input id="ysp-settings-config-workbook-file" class="ysp-std-panel__input" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
            </label>
            <div class="ysp-std-panel__status-subtext" data-role="config-workbook-file-status"></div>
            <label class="ysp-std-panel__date-field" for="ysp-settings-rule-workbook-file">
              <span class="ysp-std-panel__date-caption">上传 规则配置.xlsx</span>
              <input id="ysp-settings-rule-workbook-file" class="ysp-std-panel__input" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
            </label>
            <div class="ysp-std-panel__status-subtext" data-role="rule-workbook-file-status"></div>
            <div class="ysp-std-panel__actions">
              <button type="button" class="ysp-std-panel__button ysp-std-panel__button--danger" data-role="clear-config">清理配置</button>
              <button type="button" class="ysp-std-panel__button ysp-std-panel__button--danger" data-role="clear-tag-cache">清理缓存</button>
            </div>
            <div class="ysp-std-panel__actions">
              <button type="button" class="ysp-std-panel__button ysp-std-panel__button--primary" data-role="save-settings">保存设置</button>
              <button type="button" class="ysp-std-panel__button" data-role="close-settings">关闭</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(root);
      this.panel = root;
      this.refs = {
        backdrop: root.querySelector('.ysp-std-panel__backdrop'),
        popupLayer: root.querySelector('[data-role="popup-layer"]'),
        surface: root.querySelector('.ysp-std-panel'),
        dock: root.querySelector('[data-role="dock"]'),
        minimize: root.querySelector('[data-role="minimize"]'),
        openSettings: root.querySelector('[data-role="open-settings"]'),
        settingsMask: root.querySelector('[data-role="settings-mask"]'),
        configWorkbookFileInput: root.querySelector('#ysp-settings-config-workbook-file'),
        configWorkbookFileStatus: root.querySelector('[data-role="config-workbook-file-status"]'),
        ruleWorkbookFileInput: root.querySelector('#ysp-settings-rule-workbook-file'),
        ruleWorkbookFileStatus: root.querySelector('[data-role="rule-workbook-file-status"]'),
        saveSettings: root.querySelector('[data-role="save-settings"]'),
        closeSettings: root.querySelector('[data-role="close-settings"]'),
        standardizationStartDate: root.querySelector('#ysp-standardization-start-date'),
        standardizationEndDate: root.querySelector('#ysp-standardization-end-date'),
        standardizationTargetCount: root.querySelector('#ysp-standardization-target-count'),
        standardizationRunMode: root.querySelector('#ysp-standardization-run-mode'),
        standardizationReasoningEffort: root.querySelector('#ysp-standardization-reasoning-effort'),
        standardizationReasoningEffortLabel: root.querySelector('[data-role="reasoning-effort-label"]'),
        standardizationGroups: root.querySelector('[data-role="standardization-groups"]'),
        startStandardization: root.querySelector('[data-role="start-standardization"]'),
        pauseResume: root.querySelector('[data-role="pause-resume"]'),
        stop: root.querySelector('[data-role="stop"]'),
        clearConfig: root.querySelector('[data-role="clear-config"]'),
        clearTagCache: root.querySelector('[data-role="clear-tag-cache"]'),
        status: root.querySelector('[data-role="status"]'),
        downloadsCard: root.querySelector('[data-role="downloads-card"]'),
        downloads: root.querySelector('[data-role="downloads"]'),
        logs: root.querySelector('[data-role="logs"]')
      };
      this.bindPanelEvents();
      this.syncSettingsToInputs();
      this.render();
    }

    destroy() { if (this.handleOutsideInteraction) { this.pageGuardEvents.forEach((eventName) => document.removeEventListener(eventName, this.handleOutsideInteraction, true)); this.handleOutsideInteraction = null; } if (this.handleViewportChange) { window.removeEventListener('resize', this.handleViewportChange); this.handleViewportChange = null; } releasePageMuted(); if (this.panel && this.panel.isConnected) this.panel.remove(); this.panel = null; this.refs = {}; }
    persistActiveCheckpoint() { const checkpoint = this.getActiveCheckpoint(); return checkpoint && this.runtime.jobType ? this.saveCheckpoint() : Promise.resolve(); }
    getActiveCheckpoint() { return this.runtime.jobType === 'standardization' ? this.runtime.checkpoint : null; }
    getListAbortCheck() { const abortToken = this.runtime.listJobAbortToken; return () => isListJobAbortRequested(abortToken); }
    getPausedTaskMeta() { return this.runtime.checkpoint && this.runtime.checkpoint.status === 'paused' ? { jobType: 'standardization', label: '标准化', checkpoint: this.runtime.checkpoint, updatedAt: this.runtime.checkpoint.updatedAt || this.runtime.checkpoint.startedAt || '' } : null; }
    getSelectedEntries() { const categoryKey = normalizeText(this.settings.categoryKey); return categoryKey ? getEntriesByKeys([categoryKey]) : []; }
    getCheckpointItems(checkpoint) { return getEntriesByKeys(checkpoint && checkpoint.itemKeys); }
    getGroupPickerSummary() { const entry = getCategoryEntry(this.settings.categoryKey); return entry ? `${entry.groupLabel} / ${entry.exportLabel}` : '请选择标准化品类'; }
    getGroupTriggerElement() { return this.refs.standardizationGroups ? this.refs.standardizationGroups.querySelector('[data-role="group-trigger"]') : null; }
    getGroupMenuLayout() { const trigger = this.getGroupTriggerElement(); if (!trigger) return null; const rect = trigger.getBoundingClientRect(); const viewportPadding = 12; const gap = 8; const width = Math.min(Math.max(Math.round(rect.width), 360), Math.max(320, window.innerWidth - viewportPadding * 2)); const left = Math.min(Math.max(viewportPadding, Math.round(rect.left)), Math.max(viewportPadding, window.innerWidth - width - viewportPadding)); const preferredHeight = 360; const belowSpace = Math.max(160, Math.floor(window.innerHeight - rect.bottom - gap - viewportPadding)); const aboveSpace = Math.max(160, Math.floor(rect.top - gap - viewportPadding)); const openUpward = belowSpace < 220 && aboveSpace > belowSpace; return { left, width, maxHeight: Math.min(preferredHeight, openUpward ? aboveSpace : belowSpace), top: openUpward ? null : Math.round(rect.bottom + gap), bottom: openUpward ? Math.round(window.innerHeight - rect.top + gap) : null }; }
    renderFloatingGroupMenu() {
      if (!this.refs.popupLayer) return;
      if (!this.runtime.openGroupMenu || this.runtime.running || this.runtime.minimized) {
        this.refs.popupLayer.innerHTML = '';
        return;
      }
      const layout = this.getGroupMenuLayout();
      if (!layout) {
        this.refs.popupLayer.innerHTML = '';
        return;
      }
      const styleTokens = [
        `--menu-left:${layout.left}px`,
        `--menu-width:${layout.width}px`,
        `--menu-max-height:${layout.maxHeight}px`,
        layout.top === null ? 'top:auto' : `top:${layout.top}px`,
        layout.bottom === null ? 'bottom:auto' : `bottom:${layout.bottom}px`
      ];
      const selectedKey = normalizeText(this.settings.categoryKey);
      const optionsHtml = CATEGORY_ENTRIES.map((entry) => {
        const selected = selectedKey === entry.key;
        const selectedClass = selected ? ' is-selected' : '';
        return `
          <button
            type="button"
            class="ysp-std-panel__group-option${selectedClass}"
            data-theme="${escapeXml(entry.theme)}"
            data-role="category-option"
            data-category-key="${escapeXml(entry.key)}"
            ${this.runtime.running ? 'disabled' : ''}
          >
            <span class="ysp-std-panel__group-option-copy">
              <span class="ysp-std-panel__group-option-meta">${escapeXml(entry.groupLabel)}</span>
              <span class="ysp-std-panel__group-option-label">${escapeXml(entry.exportLabel)}</span>
            </span>
            <span class="ysp-std-panel__group-option-check">${selected ? '已选' : '选择'}</span>
          </button>
        `;
      }).join('');
      this.refs.popupLayer.innerHTML = `
        <div
          class="ysp-std-panel__group-menu"
          data-role="group-menu"
          role="listbox"
          aria-label="标准化品类选项"
          style="${styleTokens.join(';')}"
        >${optionsHtml}</div>
      `;
    }
    async persistSettings() { await storageSetCached({ [STORAGE_KEYS.settings]: cloneWorkbenchSettings(this.settings) }); }
    syncSettingsToInputs() {
      const maxDate = getTodayDateString();
      this.refs.standardizationStartDate.max = maxDate;
      this.refs.standardizationEndDate.max = maxDate;
      this.refs.standardizationEndDate.min = this.settings.startDate || '';
      this.refs.standardizationStartDate.value = this.settings.startDate || '';
      this.refs.standardizationEndDate.value = this.settings.endDate || '';
      this.refs.standardizationTargetCount.value = String(this.settings.targetCount || 10);
      if (this.refs.standardizationRunMode) {
        this.refs.standardizationRunMode.value = normalizeStandardizationRunMode(this.settings.runMode);
      }
      const reasoningEffort = normalizeStandardizationReasoningEffort(this.settings.reasoningEffort);
      if (this.refs.standardizationReasoningEffort) {
        this.refs.standardizationReasoningEffort.value = String(getStandardizationReasoningEffortIndex(reasoningEffort));
      }
      if (this.refs.standardizationReasoningEffortLabel) {
        this.refs.standardizationReasoningEffortLabel.textContent = `思考深度：${getStandardizationReasoningEffortLabel(reasoningEffort)}`;
      }
      if (this.refs.configWorkbookFileInput) this.refs.configWorkbookFileInput.value = '';
      if (this.refs.ruleWorkbookFileInput) this.refs.ruleWorkbookFileInput.value = '';
      if (this.refs.configWorkbookFileStatus) {
        const savingText = normalizeText(this.runtime.settingsSavingText);
        const fileName = normalizeText(this.settingsDraft.configWorkbookFileName);
        const tagCount = Math.max(0, Math.trunc(Number(this.settingsDraft.tagLibraryCount) || 0));
        const apiKeyReady = normalizeText(this.settingsDraft.secrets && this.settingsDraft.secrets.arkApiKey) ? '密钥已读取' : '密钥未读取';
        this.refs.configWorkbookFileStatus.textContent = savingText || (fileName
          ? `已上传：${fileName}${tagCount ? `，标签 ${tagCount} 条` : ''}，${apiKeyReady}`
          : '未上传核心配置');
      }
      if (this.refs.ruleWorkbookFileStatus) {
        const savingText = normalizeText(this.runtime.settingsSavingText);
        const fileName = normalizeText(this.settingsDraft.ruleWorkbookFileName);
        const ruleCount = Math.max(0, Math.trunc(Number(this.settingsDraft.ruleWorkbookRuleCount) || 0));
        this.refs.ruleWorkbookFileStatus.textContent = savingText || (fileName
          ? `已上传：${fileName}${ruleCount ? `，规则 ${ruleCount} 条` : ''}`
          : '未上传规则配置');
      }
    }
    bindDateInput(input, handler) { input.setAttribute('inputmode', 'none'); input.addEventListener('click', () => this.openDatePicker(input)); input.addEventListener('focus', () => window.setTimeout(() => this.openDatePicker(input), 0)); input.addEventListener('keydown', (event) => { if (event.key === 'Tab') return; event.preventDefault(); if (event.key === 'Enter' || event.key === ' ') this.openDatePicker(input); }); input.addEventListener('beforeinput', (event) => event.preventDefault()); input.addEventListener('paste', (event) => event.preventDefault()); input.addEventListener('drop', (event) => event.preventDefault()); input.addEventListener('wheel', (event) => event.preventDefault(), { passive: false }); input.addEventListener('change', handler); }
    isPanelEventTarget(target) {
      if (!(target instanceof Node)) {
        return false;
      }
      return Boolean(
        (this.refs.surface && this.refs.surface.contains(target))
        || (this.refs.popupLayer && this.refs.popupLayer.contains(target))
        || (this.refs.settingsMask && this.refs.settingsMask.contains(target))
        || (this.refs.dock && this.refs.dock.contains(target))
      );
    }
    bindPanelEvents() {
      if (this.handleOutsideInteraction) {
        this.pageGuardEvents.forEach((eventName) => document.removeEventListener(eventName, this.handleOutsideInteraction, true));
      }
      this.handleOutsideInteraction = (event) => {
        if (event.isTrusted === false) return;
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (this.isPanelEventTarget(target)) return;
        if (this.runtime.running) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
          return;
        }
        if (this.runtime.minimized) return;
        this.setMinimized(true);
      };
      this.pageGuardEvents.forEach((eventName) => document.addEventListener(eventName, this.handleOutsideInteraction, { capture: true, passive: false }));
      this.refs.backdrop.addEventListener('click', () => { if (!this.runtime.running) this.setMinimized(true); });
      this.refs.minimize.addEventListener('click', () => { if (!this.runtime.running) this.setMinimized(true); });
      this.refs.dock.addEventListener('click', () => this.setMinimized(false));
      this.refs.openSettings.addEventListener('click', () => this.openSettingsModal());
      this.refs.closeSettings.addEventListener('click', () => this.closeSettingsModal());
      this.refs.settingsMask.addEventListener('click', (event) => { if (event.target === this.refs.settingsMask) this.closeSettingsModal(); });
      this.refs.saveSettings.addEventListener('click', () => this.saveSettingsModal().catch((error) => this.failJob(error)));
      this.bindDateInput(this.refs.standardizationStartDate, () => this.updateDate('startDate', this.refs.standardizationStartDate.value));
      this.bindDateInput(this.refs.standardizationEndDate, () => this.updateDate('endDate', this.refs.standardizationEndDate.value));
      this.refs.standardizationTargetCount.addEventListener('change', () => {
        this.settings.targetCount = normalizePositiveInteger(this.refs.standardizationTargetCount.value, this.settings.targetCount || 10, 1, 999);
        this.persistSettings().catch(() => undefined);
        this.render();
      });
      this.refs.standardizationRunMode.addEventListener('change', () => {
        this.settings.runMode = normalizeStandardizationRunMode(this.refs.standardizationRunMode.value);
        this.persistSettings().catch(() => undefined);
        this.render();
      });
      this.refs.standardizationReasoningEffort.addEventListener('input', () => this.updateReasoningEffort());
      this.refs.standardizationReasoningEffort.addEventListener('change', () => this.updateReasoningEffort());
      this.refs.standardizationGroups.addEventListener('click', (event) => this.handleGroupSelection(event));
      this.refs.popupLayer.addEventListener('click', (event) => this.handleGroupSelection(event));
      this.refs.surface.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement) || target.closest('[data-role="group-picker"]')) return;
        if (this.runtime.openGroupMenu) {
          this.runtime.openGroupMenu = '';
          this.render();
        }
      });
      this.refs.surface.addEventListener('scroll', () => { if (this.runtime.openGroupMenu) this.render(); }, true);
      if (this.handleViewportChange) window.removeEventListener('resize', this.handleViewportChange);
      this.handleViewportChange = () => { if (this.runtime.openGroupMenu) this.render(); };
      window.addEventListener('resize', this.handleViewportChange);
      this.refs.startStandardization.addEventListener('click', () => this.startStandardizationJob().catch((error) => this.failJob(error)));
      this.refs.pauseResume.addEventListener('click', () => this.handlePauseResumeAction().catch((error) => this.failJob(error)));
      this.refs.stop.addEventListener('click', () => this.stopCurrentJob().catch((error) => this.failJob(error)));
      this.refs.downloads.addEventListener('click', (event) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest('[data-download-role="standardization"]')) this.exportStandardResult();
      });
      this.refs.clearConfig.addEventListener('click', () => this.clearConfigWorkbookData().catch((error) => this.failJob(error)));
      this.refs.clearTagCache.addEventListener('click', () => this.clearNonConfigCacheData().catch((error) => this.failJob(error)));
    }
    updateReasoningEffort() {
      if (this.runtime.running || !this.refs.standardizationReasoningEffort) return;
      const option = getStandardizationReasoningEffortOptionByIndex(this.refs.standardizationReasoningEffort.value);
      this.settings.reasoningEffort = option.value;
      this.persistSettings().catch(() => undefined);
      this.render();
    }
    handleGroupSelection(event) { const target = event.target; if (!(target instanceof HTMLElement)) return; const trigger = target.closest('[data-role="group-trigger"]'); if (trigger) { if (this.runtime.running) return; this.runtime.openGroupMenu = this.runtime.openGroupMenu ? '' : 'standardization'; this.render(); return; } if (this.runtime.running) return; const categoryOption = target.closest('[data-role="category-option"]'); if (!categoryOption) return; const categoryKey = normalizeText(categoryOption.getAttribute('data-category-key')); if (!categoryKey) return; this.settings.categoryKey = this.settings.categoryKey === categoryKey ? '' : categoryKey; this.runtime.openGroupMenu = ''; this.persistSettings().catch(() => undefined); this.render(); }
    openDatePicker(input) { if (!input || input.disabled) return; if (typeof input.showPicker === 'function') { try { input.showPicker(); return; } catch (error) { } } input.focus(); }
    updateDate(key, value) { const maxDate = getTodayDateString(); const normalizedValue = normalizeDateInputValue(value, maxDate); if (key === 'startDate') { this.settings.startDate = normalizedValue; if (this.settings.endDate && this.settings.startDate && this.settings.endDate < this.settings.startDate) this.settings.endDate = ''; } else { this.settings.endDate = normalizedValue; if (this.settings.endDate && this.settings.startDate && this.settings.endDate < this.settings.startDate) this.settings.endDate = ''; } this.persistSettings().catch(() => undefined); this.render(); }
    setMinimized(nextValue) { if (this.runtime.running && nextValue) return; this.runtime.minimized = Boolean(nextValue); this.settings.ui.panelMinimized = this.runtime.minimized; if (this.runtime.minimized) this.runtime.openGroupMenu = ''; this.persistSettings().catch(() => undefined); this.render(); }
    openSettingsModal() { this.settingsDraft = cloneWorkbenchSettings(this.settings); this.settingsModalOpen = true; this.runtime.openGroupMenu = ''; this.syncSettingsToInputs(); this.render(); if (this.refs.configWorkbookFileInput) this.refs.configWorkbookFileInput.focus(); }
    closeSettingsModal() { this.settingsModalOpen = false; this.render(); }
    async saveSettingsModal() {
      if (this.runtime.settingsSaving) return;
      const configWorkbookFile = this.refs.configWorkbookFileInput && this.refs.configWorkbookFileInput.files && this.refs.configWorkbookFileInput.files.length ? this.refs.configWorkbookFileInput.files[0] : null;
      const ruleWorkbookFile = this.refs.ruleWorkbookFileInput && this.refs.ruleWorkbookFileInput.files && this.refs.ruleWorkbookFileInput.files.length ? this.refs.ruleWorkbookFileInput.files[0] : null;
      this.runtime.settingsSaving = true;
      this.runtime.settingsSavingText = configWorkbookFile || ruleWorkbookFile
        ? '正在读取 XLSX 文件，请稍候。加载较慢，如果浏览器提示未响应，请选择等待选项。'
        : '正在保存设置，请稍候。加载较慢，如果浏览器提示未响应，请选择等待选项。';
      this.render();
      await sleep(60);
      try {
        if (configWorkbookFile) {
          const workbookMeta = await saveUploadedConfigWorkbookFile(configWorkbookFile);
          this.settings.configWorkbookFileName = workbookMeta.fileName;
          this.settings.configWorkbookUploadedAt = workbookMeta.uploadedAt;
          this.settings.tagLibraryFileName = workbookMeta.fileName;
          this.settings.tagLibraryUploadedAt = workbookMeta.uploadedAt;
          this.settings.tagLibraryCount = workbookMeta.tagLibraryCount;
          this.settings.secrets.arkApiKey = workbookMeta.arkApiKey;
        }
        if (ruleWorkbookFile) {
          const ruleWorkbookMeta = await saveUploadedRuleWorkbookFile(ruleWorkbookFile);
          this.settings.ruleWorkbookFileName = ruleWorkbookMeta.fileName;
          this.settings.ruleWorkbookUploadedAt = ruleWorkbookMeta.uploadedAt;
          this.settings.ruleWorkbookRuleCount = ruleWorkbookMeta.categoryRuleCount;
          this.settings.categoryRulesContent = ruleWorkbookMeta.categoryRulesContent;
        }
        await this.persistSettings();
        this.settingsDraft = cloneWorkbenchSettings(this.settings);
        this.settingsModalOpen = false;
        this.pushLog('设置已保存');
      } finally {
        this.runtime.settingsSaving = false;
        this.runtime.settingsSavingText = '';
        this.render();
      }
    }
    async clearConfigWorkbookData() {
      if (this.runtime.running) return;
      const confirmed = window.confirm('这会清除核心配置、规则配置、品类规则和密钥，不会清理任务缓存和标签库缓存。确认清理吗？');
      if (!confirmed) return;
      this.settings.configWorkbookFileName = '';
      this.settings.configWorkbookUploadedAt = '';
      this.settings.ruleWorkbookFileName = '';
      this.settings.ruleWorkbookUploadedAt = '';
      this.settings.ruleWorkbookRuleCount = 0;
      this.settings.categoryRulesContent = '';
      this.settings.tagLibraryFileName = '';
      this.settings.tagLibraryUploadedAt = '';
      this.settings.tagLibraryCount = 0;
      this.settings.secrets.arkApiKey = '';
      await this.persistSettings();
      this.settingsDraft = cloneWorkbenchSettings(this.settings);
      this.syncSettingsToInputs();
      this.render();
      this.pushLog('已清理配置和规则');
    }
    async clearNonConfigCacheData() {
      if (this.runtime.running) return;
      const confirmed = window.confirm('这会清除任务进度、临时记录、历史已看过视频记录和当前日志，不会清理核心配置、规则配置、标签库、品类规则和密钥。确认清理吗？');
      if (!confirmed) return;
      await clearNonConfigCacheStorage();
      this.runtime.checkpoint = null;
      this.runtime.seenTaskIds = [];
      this.runtime.seenTaskIdSet = new Set();
      this.runtime.logs = [];
      this.runtime.statusText = '缓存已清理';
      this.runtime.jobType = '';
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.settingsDraft = cloneWorkbenchSettings(this.settings);
      this.syncSettingsToInputs();
      this.render();
      this.pushLog('已清理缓存');
    }
    renderGroupSelector() { const open = !this.runtime.running && this.runtime.openGroupMenu === 'standardization'; const triggerSummary = this.getGroupPickerSummary(); this.refs.standardizationGroups.innerHTML = `<div class="ysp-std-panel__group-picker${open ? ' is-open' : ''}" data-role="group-picker"><button type="button" class="ysp-std-panel__group-trigger" data-role="group-trigger" aria-expanded="${open ? 'true' : 'false'}" title="${escapeXml(triggerSummary)}" ${this.runtime.running ? 'disabled' : ''}><span class="ysp-std-panel__group-trigger-text">${escapeXml(triggerSummary)}</span><span class="ysp-std-panel__group-trigger-icon">${open ? '▲' : '▼'}</span></button></div>`; }
    renderStatus() { const pageText = isListPage() ? '当前页面：列表页，可开始或继续标准化' : isDetailPage() ? '当前页面：详情页，点击开始会自动回到列表页' : '当前页面：其他页面，请回标准化列表页操作'; const runMode = getStandardizationRunModeLabel(this.settings.runMode); this.refs.status.innerHTML = `<div class="ysp-std-panel__status-head"><span class="ysp-std-panel__label">当前状态</span></div><div class="ysp-std-panel__status-value">${escapeXml(this.runtime.statusText || '等待开始')}</div><div class="ysp-std-panel__status-subtext">任务类型：标准化</div><div class="ysp-std-panel__status-subtext">运行模式：${escapeXml(runMode)}</div><div class="ysp-std-panel__status-subtext">${escapeXml(pageText)}</div>`; }
    renderLogs() { if (!this.runtime.logs.length) { this.refs.logs.innerHTML = '<div class="ysp-std-panel__report-empty">暂无日志</div>'; return; } this.refs.logs.innerHTML = this.runtime.logs.map((log) => `<div class="ysp-std-panel__log-entry">${escapeXml(formatUserVisibleLogText(log))}</div>`).join(''); this.refs.logs.scrollTop = this.refs.logs.scrollHeight; }
    renderDownloads() {
      const cards = [];
      if (this.runtime.report) {
        cards.push(`
          <div class="ysp-std-panel__download-card">
            <div class="ysp-std-panel__download-title">标准化结果</div>
            <div class="ysp-std-panel__download-meta">${escapeXml(formatReportPeriod(this.runtime.report))}</div>
            <div class="ysp-std-panel__download-count">
              目标 ${this.runtime.report.targetCount} 条，实际 ${this.runtime.report.actualCount} 条
            </div>
            <div class="ysp-std-panel__actions ysp-std-panel__download-actions">
              <button
                type="button"
                class="ysp-std-panel__button ysp-std-panel__button--primary"
                data-download-role="standardization"
              >下载标准化表</button>
            </div>
          </div>
        `);
      }
      this.refs.downloadsCard.hidden = !cards.length;
      this.refs.downloads.innerHTML = cards.join('');
    }
    exportStandardResult() { if (!this.runtime.report) { this.pushLog('当前没有可下载的标准化结果'); return; } exportStandardReport(this.runtime.report); this.pushLog(`已导出标准化结果：目标 ${this.runtime.report.targetCount} 条，实际 ${this.runtime.report.actualCount} 条`); }
    render() {
      if (!this.panel) return;
      if (this.runtime.running && this.runtime.openGroupMenu) this.runtime.openGroupMenu = '';
      if (this.runtime.running && this.runtime.minimized) this.runtime.minimized = false;
      const listPageActive = isListPage();
      if (this.runtime.running) enforcePageMuted({ pausePlayback: isDetailPage() });
      else releasePageMuted();
      this.panel.classList.toggle('is-minimized', this.runtime.minimized);
      this.panel.classList.toggle('is-input-locked', this.runtime.running);
      this.panel.classList.toggle('is-settings-open', this.settingsModalOpen);
      this.syncSettingsToInputs();
      this.renderGroupSelector();
      this.renderFloatingGroupMenu();
      const disabled = this.runtime.running;
      const settingsBusy = Boolean(this.runtime.settingsSaving);
      this.refs.standardizationStartDate.disabled = disabled;
      this.refs.standardizationEndDate.disabled = disabled;
      this.refs.standardizationTargetCount.disabled = disabled;
      this.refs.standardizationRunMode.disabled = disabled;
      this.refs.standardizationReasoningEffort.disabled = disabled;
      this.refs.startStandardization.disabled = disabled;
      if (this.refs.minimize) this.refs.minimize.disabled = disabled;
      this.refs.clearConfig.disabled = disabled || settingsBusy;
      this.refs.clearTagCache.disabled = disabled || settingsBusy;
      this.refs.stop.disabled = !disabled;
      if (this.refs.configWorkbookFileInput) this.refs.configWorkbookFileInput.disabled = disabled || settingsBusy;
      if (this.refs.ruleWorkbookFileInput) this.refs.ruleWorkbookFileInput.disabled = disabled || settingsBusy;
      if (this.refs.saveSettings) {
        this.refs.saveSettings.disabled = disabled || settingsBusy;
        const hasConfig = Boolean(normalizeText(this.settingsDraft.configWorkbookFileName));
        const hasRule = Boolean(normalizeText(this.settingsDraft.ruleWorkbookFileName));
        const defaultLabel = (hasConfig && hasRule) ? '更新设置' : '保存设置';
        this.refs.saveSettings.textContent = settingsBusy ? '保存中...' : defaultLabel;
        this.refs.saveSettings.classList.toggle('is-loading', settingsBusy);
      }
      if (this.refs.closeSettings) this.refs.closeSettings.disabled = settingsBusy;
      const pausedTask = this.getPausedTaskMeta();
      this.refs.pauseResume.disabled = !disabled && (!pausedTask || !listPageActive);
      this.refs.pauseResume.textContent = disabled ? '暂停任务' : pausedTask ? '继续标准化' : '继续任务';
      this.refs.pauseResume.classList.toggle('ysp-std-panel__button--primary', !disabled && Boolean(pausedTask));
      this.refs.startStandardization.textContent = disabled ? '标准化运行中' : '开始标准化';
      this.renderDownloads();
      this.renderStatus();
      this.renderLogs();
    }
    applyStandardizationWorkerProgress(text, progressLogLines) { const progressText = formatUserVisibleLogText(text); const logLines = normalizeProgressLogLines(progressLogLines); const mergedLines = [progressText, ...logLines].filter(Boolean).filter((line, index, array) => array.indexOf(line) === index); if (!progressText && !mergedLines.length) return; this.runtime.running = true; this.runtime.jobType = 'standardization'; if (progressText) this.runtime.statusText = progressText; this.runtime.logs = mergeLogEntries(this.runtime.logs, mergedLines); this.render(); }
    pushLog(message) { this.runtime.logs = mergeLogEntries(this.runtime.logs, [message]); const checkpoint = this.getActiveCheckpoint(); if (checkpoint) checkpoint.logs = this.runtime.logs.slice(); this.renderLogs(); void this.persistActiveCheckpoint().catch(() => {}); }
    updateCheckpointStatus(text) { const checkpoint = this.getActiveCheckpoint(); const statusText = formatUserVisibleLogText(text); this.runtime.statusText = statusText; if (checkpoint) checkpoint.statusText = statusText; this.renderStatus(); void this.persistActiveCheckpoint().catch(() => {}); }
    async saveCheckpoint() { if (!this.runtime.checkpoint) return; this.runtime.checkpoint.updatedAt = new Date().toISOString(); await storageSetCached({ [STORAGE_KEYS.checkpoint]: this.runtime.checkpoint }); }
    async clearCheckpoint() { await storageRemove(STORAGE_KEYS.checkpoint); this.runtime.checkpoint = null; }
    async stopCurrentJob() { if (!this.runtime.running) return; const checkpoint = this.getActiveCheckpoint(); let stoppedStatusText = '任务已结束，可以重新开始'; requestListJobAbort(this.runtime.listJobAbortToken); this.runtime.stopping = true; this.runtime.pauseRequested = false; this.runtime.statusText = stoppedStatusText; this.pushLog('任务已结束'); if (checkpoint) { checkpoint.status = 'stopped'; checkpoint.statusText = stoppedStatusText; const requestIds = uniqueTextList(this.getStandardizationInflightEntries(checkpoint).map((entry) => entry.requestId)); checkpoint.inflightEntries = []; await this.saveCheckpoint(); if (requestIds.length) await this.stopStandardizationRequests(requestIds); if (checkpoint.rows.length > 0) { const collectedRows = checkpoint.rows; const partialReport = { version: 1, startDate: checkpoint.startDate, endDate: checkpoint.endDate || checkpoint.startDate, targetCount: checkpoint.targetCount, actualCount: collectedRows.length, fileName: `标准化 ${checkpoint.startDate === checkpoint.endDate ? checkpoint.startDate : `${checkpoint.startDate}-${checkpoint.endDate}`}`, rows: createStandardExportRows(collectedRows), generatedAt: new Date().toISOString() }; this.runtime.report = partialReport; await storageSetCached({ [STORAGE_KEYS.report]: partialReport }); await this.clearCheckpoint(); stoppedStatusText = `任务已结束，已收集 ${collectedRows.length} 条标准化结果，可下载`; this.runtime.statusText = stoppedStatusText; this.pushLog(`已生成标准化结果，共 ${collectedRows.length} 条，可下载`); } } this.runtime.running = false; this.runtime.jobType = ''; this.runtime.stopping = false; this.runtime.pauseRequested = false; this.render(); }
    pauseCurrentJob() { if (!this.runtime.running) return; const inflightCount = this.getStandardizationInflightEntries(this.runtime.checkpoint).length; this.runtime.pauseRequested = true; this.runtime.stopping = false; this.runtime.statusText = inflightCount ? `正在暂停当前任务，等待 ${inflightCount} 个进行中视频完成` : '正在暂停当前任务'; this.pushLog(this.runtime.statusText); this.render(); }
    async handlePauseResumeAction() { if (this.runtime.running) { this.pauseCurrentJob(); return; } await this.resumePausedJob(); }
    async resumePausedJob() { if (this.runtime.running) return; if (!isListPage()) throw new Error('继续任务请回到标准化列表页'); const pausedTask = this.getPausedTaskMeta(); if (!pausedTask) throw new Error('当前没有可继续的暂停任务'); await requestCloseOtherStandardizationTabs(); this.runtime.listJobAbortToken = beginListJobAbortSession(); this.runtime.running = true; this.runtime.jobType = 'standardization'; this.runtime.stopping = false; this.runtime.pauseRequested = false; this.runtime.minimized = false; this.runtime.logs = Array.isArray(pausedTask.checkpoint.logs) ? pausedTask.checkpoint.logs.slice(0, MAX_LOGS).map((log) => formatUserVisibleLogText(log)).filter(Boolean) : []; pausedTask.checkpoint.status = 'running'; pausedTask.checkpoint.statusText = '正在继续标准化'; this.runtime.statusText = pausedTask.checkpoint.statusText; await this.saveCheckpoint(); this.pushLog('继续标准化'); this.render(); await this.runStandardizationFromCheckpoint(); }
    async tryResume() { if (!this.runtime.running) { this.render(); return; } if (this.runtime.jobType === 'standardization' && this.runtime.checkpoint && this.runtime.checkpoint.status === 'running') { this.pushLog('检测到未完成标准化，正在继续'); await this.runStandardizationFromCheckpoint(); return; } this.runtime.running = false; this.runtime.jobType = ''; this.render(); }
    async startStandardizationAfterListPageReady() {
      this.settings.ui.panelMinimized = false;
      await this.persistSettings();
      await markPendingStandardizationStart();
      await requestCloseOtherStandardizationTabs();
      this.runtime.minimized = false;
      this.runtime.statusText = '正在回到列表页准备开始标准化';
      this.render();
      location.assign(getStandardizationListPageUrl());
    }
    async tryStartPendingStandardizationJob() {
      if (!isListPage() || this.runtime.running) {
        return;
      }
      const pendingStart = await consumePendingStandardizationStart();
      if (!pendingStart) {
        return;
      }
      this.runtime.minimized = false;
      this.runtime.statusText = '已回到列表页，正在开始标准化';
      this.render();
      await this.startStandardizationJob({ fromAutoList: true });
    }
    describeItem(item) { return item.exportLabel; }
    isCurrentJobStopRequested() { return isListJobAbortRequested(this.runtime.listJobAbortToken) || this.runtime.stopping; }
    getStandardizationInflightEntries(checkpoint) {
      return Array.isArray(checkpoint && checkpoint.inflightEntries) ? checkpoint.inflightEntries : [];
    }

    isStandardizationTaskSeen(taskId) {
      const normalizedTaskId = normalizeText(taskId);
      return Boolean(normalizedTaskId && this.runtime.seenTaskIdSet && this.runtime.seenTaskIdSet.has(normalizedTaskId));
    }

    async rememberStandardizationTaskSeen(taskId) {
      const normalizedTaskId = normalizeText(taskId);
      if (!normalizedTaskId) {
        return;
      }
      if (!this.runtime.seenTaskIdSet) {
        this.runtime.seenTaskIds = normalizeStandardizationSeenTaskIds(this.runtime.seenTaskIds);
        this.runtime.seenTaskIdSet = new Set(this.runtime.seenTaskIds);
      }
      if (this.runtime.seenTaskIdSet.has(normalizedTaskId)) {
        return;
      }
      this.runtime.seenTaskIdSet.add(normalizedTaskId);
      this.runtime.seenTaskIds = this.runtime.seenTaskIds.concat(normalizedTaskId);
      await storageSetCached({
        [STORAGE_KEYS.seenTaskIds]: this.runtime.seenTaskIds
      });
    }

    isStandardizationTargetReached(itemIndex, checkpoint) {
      const activeCheckpoint = checkpoint || this.runtime.checkpoint;
      if (!activeCheckpoint) {
        return false;
      }
      if (activeCheckpoint.rows.length >= activeCheckpoint.targetCount) {
        return true;
      }
      if (!Number.isInteger(itemIndex) || itemIndex < 0) {
        return false;
      }
      return (activeCheckpoint.itemRecordedCounts[itemIndex] || 0) >= (activeCheckpoint.itemTargetCounts[itemIndex] || 0);
    }

    isStandardizationTaskReserved(taskId, checkpoint) {
      const activeCheckpoint = checkpoint || this.runtime.checkpoint;
      const normalizedTaskId = normalizeText(taskId);
      if (!activeCheckpoint || !normalizedTaskId) {
        return false;
      }
      return activeCheckpoint.processedTaskIds.includes(normalizedTaskId)
        || this.getStandardizationInflightEntries(activeCheckpoint).some((entry) => entry.taskId === normalizedTaskId);
    }

    updateStandardizationItemProgress(item) {
      const checkpoint = this.runtime.checkpoint;
      if (!checkpoint || !item) {
        return;
      }
      this.updateCheckpointStatus(
        `正在标准化 ${item.exportLabel}`
      );
    }

    buildStandardizationWorkerStorageKeys(requestIds) {
      const keys = [];
      uniqueTextList(requestIds || []).forEach((requestId) => {
        keys.push(
          buildStandardizationWorkerRequestKey(requestId),
          buildStandardizationWorkerResponseKey(requestId),
          buildStandardizationWorkerProgressKey(requestId),
          buildStandardizationWorkerStopKey(requestId)
        );
      });
      return keys;
    }

    async stopStandardizationRequests(requestIds) {
      const normalizedRequestIds = uniqueTextList(requestIds || []);
      for (const requestId of normalizedRequestIds) {
        await requestStandardizationWorkerStop(requestId);
      }
    }

    async recoverStandardizationInflightState() {
      const checkpoint = this.runtime.checkpoint;
      const requestIds = uniqueTextList(
        this.getStandardizationInflightEntries(checkpoint).map((entry) => entry.requestId)
      );
      if (!requestIds.length) {
        return;
      }
      this.pushLog('检测到遗留中的详情页任务，已停止并准备重新派发');
      await this.stopStandardizationRequests(requestIds);
      if (checkpoint) {
        checkpoint.inflightEntries = [];
        await this.saveCheckpoint();
      }
    }

    async launchStandardizationRowTask(item, itemIndex, row, pageNumber, totalPages, cancelCheck) {
      const checkpoint = this.runtime.checkpoint;
      const activeCancelCheck = typeof cancelCheck === 'function' ? cancelCheck : this.getListAbortCheck();
      const apiKey = normalizeText(this.settings.secrets.arkApiKey);
      const reasoningEffort = normalizeStandardizationReasoningEffort(checkpoint.reasoningEffort);
      const runMode = normalizeStandardizationRunMode(checkpoint.runMode);
      const requestId = createRuntimeToken('std');
      const requestKey = buildStandardizationWorkerRequestKey(requestId);
      const responseKey = buildStandardizationWorkerResponseKey(requestId);
      const progressKey = buildStandardizationWorkerProgressKey(requestId);
      const detailUrl = `${location.origin}/stdDetail/${encodeURIComponent(row.taskId)}?select_type=2&ysp_standardization_request=${encodeURIComponent(requestId)}`;
      const descriptor = {
        requestId,
        taskId: row.taskId,
        itemKey: item.key,
        itemIndex,
        row,
        pageNumber,
        totalPages,
        promise: null,
        stopRequested: false
      };
      const taskCancelCheck = () => descriptor.stopRequested || activeCancelCheck();

      await storageRemove([responseKey, progressKey]);
      await storageSetCached({
        [requestKey]: {
          apiKey,
          taskId: row.taskId,
          itemKey: item.key,
          primaryCategory: item.exportLabel,
          standardOperator: row.standardOperator,
          qcOperator: row.qcOperator,
          categoryRule: normalizeMultilineText(checkpoint.categoryRule),
          reasoningEffort,
          runMode
        }
      });
      checkpoint.inflightEntries = this.getStandardizationInflightEntries(checkpoint).concat({
        taskId: row.taskId,
        requestId,
        itemKey: item.key,
        startedAt: new Date().toISOString()
      });
      await this.saveCheckpoint();

      this.pushLog(`${this.describeItem(item)}：第 ${pageNumber}/${totalPages} 页开始处理 ${formatTaskLogPrefix(row.taskId)}`);
      openUrlInNewTab(detailUrl);

      descriptor.promise = (async () => {
        let response = null;
        try {
          let lastProgressText = '';
          response = await waitForStandardizationWorkerResponse(
            requestId,
            WORKER_RESPONSE_TIMEOUT,
            (progress) => {
              if (descriptor.stopRequested || this.isCurrentJobStopRequested()) {
                return;
              }
              const progressText = normalizeText(progress && progress.text);
              const progressLogLines = normalizeProgressLogLines(progress && progress.logLines);
              const signature = JSON.stringify([progressText, progressLogLines]);
              if (!progressText && !progressLogLines.length) {
                return;
              }
              if (signature === lastProgressText) {
                return;
              }
              lastProgressText = signature;
              const lines = [progressText, ...progressLogLines].filter(Boolean);
              const uniqueLines = lines.filter((line, index) => lines.indexOf(line) === index);
              uniqueLines.forEach((line) => {
                this.pushLog(`${formatTaskLogPrefix(row.taskId)}：${line}`);
              });
            },
            taskCancelCheck
          );
        } catch (error) {
          const message = error && error.message ? error.message : String(error);
          if (message === '任务已结束') {
            throw error;
          }
          throw new Error(prefixTaskError(row.taskId, message));
        } finally {
          await storageRemove([requestKey, responseKey, progressKey]);
        }

        if (!response) {
          throw new Error(prefixTaskError(row.taskId, '未收到详情页结果'));
        }
        return { response };
      })().then(
        (result) => ({ descriptor, status: 'fulfilled', result }),
        (error) => ({ descriptor, status: 'rejected', error })
      );

      return descriptor;
    }

    async applyStandardizationTaskResponse(descriptor, response) {
      const checkpoint = this.runtime.checkpoint;
      const row = descriptor.row;
      const itemIndex = descriptor.itemIndex;
      if (!response) {
        throw new Error(prefixTaskError(row.taskId, '未收到详情页结果'));
      }
      if (response.status === 'error') {
        const responseError = normalizeText(response.error);
        if (isModelJsonParseFailureMessage(responseError)) {
          this.pushLog(`${formatTaskLogPrefix(row.taskId)}：AI 返回内容格式不对，已跳过当前条目`);
          registerCheckpointSkip(checkpoint);
          return;
        }
        throw new Error(prefixTaskError(row.taskId, responseError || '详情页处理失败'));
      }

      if (response.skipped && response.skipReason === 'long_video') {
        registerCheckpointSkip(checkpoint);
        this.pushLog(
          `${formatTaskLogPrefix(row.taskId)}：长视频跳过${response.durationSeconds ? `（${formatDurationSeconds(response.durationSeconds)}）` : ''}`
        );
        return;
      }
      if (response.skipped && response.skipReason === 'content_inspection_failed') {
        registerCheckpointSkip(checkpoint);
        this.pushLog(`${formatTaskLogPrefix(row.taskId)}：视频内容触发安全拦截，已跳过`);
        return;
      }
      if (response.skipped && response.skipReason === 'video_url_failed') {
        registerCheckpointSkip(checkpoint);
        const errorText = normalizeText(response.error);
        this.pushLog(`${formatTaskLogPrefix(row.taskId)}：视频地址获取失败，已跳过${errorText ? `（${formatUserVisibleLogText(errorText)}）` : ''}`);
        return;
      }
      if (response.skipped && response.skipReason === 'no_available_tag') {
        registerCheckpointSkip(checkpoint);
        const finalReason = normalizeText(response.finalReason);
        this.pushLog(`${formatTaskLogPrefix(row.taskId)}：没有可写入的本地标签库标签，已跳过${finalReason ? `（${finalReason}）` : ''}`);
        return;
      }

      const standardTagsActionable = normalizeTagDetailArray(response.standardTagsActionable);
      if (!standardTagsActionable.length) {
        registerCheckpointSkip(checkpoint);
        this.pushLog(`${formatTaskLogPrefix(row.taskId)}：没有可写入的成品标签，已跳过`);
        return;
      }
      const standardTagsText = standardTagsActionable.map((item) => formatTagDetailForDisplay(item)).join('；');

      const itemTargetCount = checkpoint.itemTargetCounts[itemIndex] || 0;
      const itemRecordedCount = checkpoint.itemRecordedCounts[itemIndex] || 0;
      if (checkpoint.rows.length >= checkpoint.targetCount || itemRecordedCount >= itemTargetCount) {
        this.pushLog(`${formatTaskLogPrefix(row.taskId)}：结果已返回，但当前目标已满，未再记录`);
        return;
      }

      checkpoint.rows.push({
        vid: row.taskId,
        standardTags: standardTagsText,
        standardOperator: row.standardOperator,
        itemKey: descriptor.itemKey
      });
      checkpoint.itemRecordedCounts[itemIndex] = itemRecordedCount + 1;
      this.pushLog(
        `${formatTaskLogPrefix(row.taskId)}：已标准化 ${standardTagsText}（${checkpoint.itemRecordedCounts[itemIndex]}/${itemTargetCount}）`
      );
    }

    async handleSettledStandardizationTask(settled) {
      const checkpoint = this.runtime.checkpoint;
      const descriptor = settled && settled.descriptor ? settled.descriptor : null;
      const requestId = descriptor ? descriptor.requestId : '';
      const taskId = descriptor ? descriptor.taskId : '';
      if (checkpoint && requestId) {
        checkpoint.inflightEntries = this.getStandardizationInflightEntries(checkpoint)
          .filter((entry) => entry.requestId !== requestId);
      }
      if (!descriptor) {
        await this.saveCheckpoint();
        return;
      }
      if (!settled || settled.status === 'rejected') {
        const message = normalizeText(
          settled && settled.error && settled.error.message
            ? settled.error.message
            : settled && settled.error
              ? String(settled.error)
              : '详情页处理失败'
        );
        if (message && message !== '任务已结束') {
          registerCheckpointSkip(checkpoint);
          this.pushLog(`${prefixTaskError(taskId, message)}，已跳过当前条目`);
        }
        if (taskId) {
          await this.rememberStandardizationTaskSeen(taskId);
        }
        await this.saveCheckpoint();
        return;
      }

      try {
        await this.applyStandardizationTaskResponse(descriptor, settled.result && settled.result.response);
      } catch (error) {
        const message = normalizeText(error && error.message ? error.message : String(error)) || '详情页处理失败';
        registerCheckpointSkip(checkpoint);
        this.pushLog(`${prefixTaskError(taskId, message)}，已跳过当前条目`);
        if (taskId) {
          await this.rememberStandardizationTaskSeen(taskId);
        }
        await this.saveCheckpoint();
        return;
      }
      if (checkpoint && !checkpoint.processedTaskIds.includes(taskId)) {
        checkpoint.processedTaskIds.push(taskId);
      }
      await this.rememberStandardizationTaskSeen(taskId);
      await this.saveCheckpoint();
    }

    async runStandardizationRowTask(item, itemIndex, row, pageNumber, totalPages, cancelCheck) {
      const descriptor = await this.launchStandardizationRowTask(item, itemIndex, row, pageNumber, totalPages, cancelCheck);
      this.updateStandardizationItemProgress(item);
      const settled = await descriptor.promise;
      if (this.isCurrentJobStopRequested()) {
        const checkpoint = this.runtime.checkpoint;
        if (checkpoint) {
          checkpoint.inflightEntries = this.getStandardizationInflightEntries(checkpoint)
            .filter((entry) => entry.requestId !== descriptor.requestId);
          await this.saveCheckpoint();
        }
        throw new Error('任务已结束');
      }
      await this.handleSettledStandardizationTask(settled);
      this.updateStandardizationItemProgress(item);
      return this.runtime.pauseRequested ? 'paused' : 'done';
    }

    async startStandardizationJob(options) {
      const config = options && typeof options === 'object' ? options : {};
      if (this.runtime.running) {
        return;
      }
      if (!isListPage()) {
        if (config.fromAutoList) {
          throw new Error('列表页还没有准备好，请稍后重试');
        }
        await this.startStandardizationAfterListPageReady();
        return;
      }
      this.runtime.listJobAbortToken = beginListJobAbortSession();
      const startDate = normalizeText(this.settings.startDate);
      const endDate = normalizeText(this.settings.endDate);
      const requestedTargetCount = normalizePositiveInteger(this.settings.targetCount, 10, 1, 999);
      const runMode = normalizeStandardizationRunMode(this.settings.runMode);
      const targetCount = runMode === 'demo' ? 1 : requestedTargetCount;
      const reasoningEffort = normalizeStandardizationReasoningEffort(this.settings.reasoningEffort);
      const maxDate = getTodayDateString();
      const categoryKey = normalizeText(this.settings.categoryKey);
      const items = this.getSelectedEntries('standardization');
      const apiKey = normalizeText(this.settings.secrets.arkApiKey);
      if (!startDate) {
        throw new Error('请先选择标准化开始日期');
      }
      if (!endDate) {
        throw new Error('请先选择标准化结束日期');
      }
      if (startDate > maxDate || endDate > maxDate) {
        throw new Error('标准化日期只能选择今天及以前');
      }
      if (endDate < startDate) {
        throw new Error('结束日期不能早于开始日期');
      }
      if (!categoryKey || !items.length) {
        throw new Error('请先选择一个标准化品类');
      }
      if (!normalizeText(this.settings.configWorkbookFileName)) {
        throw new Error('请先在设置里上传核心配置文件');
      }
      if (!apiKey) {
        throw new Error('核心配置 的密钥页缺少可用密钥');
      }
      if (!normalizeText(this.settings.ruleWorkbookFileName)) {
        throw new Error('请先在设置里上传规则配置文件');
      }
      const categoryRule = getCategoryRuleForCategory(this.settings.categoryRulesContent, items[0].exportLabel);
      this.settings.reasoningEffort = reasoningEffort;
      this.settings.runMode = runMode;
      await this.persistSettings();
      await requestCloseOtherStandardizationTabs();
      await sleep(200);

      this.runtime.running = true;
      this.runtime.jobType = 'standardization';
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.runtime.minimized = false;
      this.runtime.logs = [];
      this.runtime.statusText = '正在准备标准化';
      this.runtime.checkpoint = {
        version: 3,
        status: 'running',
        startDate,
        endDate,
        groupIds: uniqueTextList(items.map((item) => item.subgroupId)),
        itemKeys: items.map((item) => item.key),
        targetCount,
        itemTargetCounts: buildStandardizationItemTargetCounts(items.length, targetCount),
        itemRecordedCounts: new Array(items.length).fill(0),
        currentItemIndex: 0,
        inflightEntries: [],
        processedTaskIds: [],
        rows: [],
        skippedCount: 0,
        categoryRule,
        reasoningEffort,
        runMode,
        logs: [],
        startedAt: new Date().toISOString(),
        statusText: '正在准备标准化'
      };
      this.render();
      this.pushLog('正在加载标签库');
      const tagLibrary = await loadTagLibrary();
      this.pushLog(`标签库已加载：${tagLibrary.count} 条`);
      if (normalizeText(categoryRule)) {
        this.pushLog(`规则文件已加载：${items[0].exportLabel}`);
      } else if (normalizeText(this.settings.categoryRulesContent)) {
        this.pushLog(`规则文件当前品类规则为空：${items[0].exportLabel}`);
      }
      await this.saveCheckpoint();
      this.pushLog(
        `开始标准化：${startDate === endDate ? startDate : `${startDate} 至 ${endDate}`}，品类 ${items[0].exportLabel}，运行模式 ${getStandardizationRunModeLabel(runMode)}，目标 ${targetCount} 条，思考深度 ${getStandardizationReasoningEffortLabel(reasoningEffort)}`
      );
      await this.runStandardizationFromCheckpoint();
    }

    async runStandardizationFromCheckpoint(cancelCheck) {
      const activeCancelCheck = typeof cancelCheck === 'function' ? cancelCheck : this.getListAbortCheck();
      await waitForStandardizationListApiReady(activeCancelCheck);
      const checkpoint = this.runtime.checkpoint;
      if (!checkpoint || checkpoint.status !== 'running') {
        this.runtime.running = false;
        this.runtime.jobType = '';
        this.render();
        return;
      }
      const items = this.getCheckpointItems(checkpoint);
      if (!items.length) {
        throw new Error('当前标准化任务没有可处理的品类');
      }
      checkpoint.itemTargetCounts = normalizeStandardizationItemTargetCounts(checkpoint.itemTargetCounts, items.length, checkpoint.targetCount);
      checkpoint.itemRecordedCounts = normalizeStandardizationItemRecordedCounts(checkpoint.itemRecordedCounts, checkpoint.itemKeys, checkpoint.itemTargetCounts, checkpoint.rows);
      if (!checkpoint.itemTargetCounts.length || !checkpoint.itemRecordedCounts.length) {
        throw new Error('标准化任务进度数据无效，请重新开始');
      }
      await this.recoverStandardizationInflightState();

      while (checkpoint.currentItemIndex < items.length) {
        if (this.isCurrentJobStopRequested()) {
          throw new Error('任务已结束');
        }
        if (this.runtime.pauseRequested) {
          throw new Error('任务已暂停');
        }
        if (checkpoint.rows.length >= checkpoint.targetCount) {
          break;
        }
        const itemIndex = checkpoint.currentItemIndex;
        const item = items[itemIndex];
        const itemTargetCount = checkpoint.itemTargetCounts[itemIndex] || 0;
        const itemRecordedCount = checkpoint.itemRecordedCounts[itemIndex] || 0;
        if (!itemTargetCount) {
          this.pushLog(`${this.describeItem(item)}：本品类无需处理，已跳过`);
          checkpoint.currentItemIndex += 1;
          await this.saveCheckpoint();
          continue;
        }
        if (itemRecordedCount >= itemTargetCount) {
          checkpoint.currentItemIndex += 1;
          await this.saveCheckpoint();
          continue;
        }
        this.updateStandardizationItemProgress(item);
        await this.saveCheckpoint();
        const itemStatus = await this.processStandardizationItem(item, itemIndex, activeCancelCheck);
        if (checkpoint.rows.length >= checkpoint.targetCount) {
          break;
        }
        if (itemStatus === 'paused') {
          await this.saveCheckpoint();
          throw new Error('任务已暂停');
        }
        checkpoint.currentItemIndex += 1;
        await this.saveCheckpoint();
      }

      await this.completeStandardizationJob();
    }

    async processStandardizationItem(item, itemIndex, cancelCheck) {
      const checkpoint = this.runtime.checkpoint;
      const activeCancelCheck = typeof cancelCheck === 'function' ? cancelCheck : this.getListAbortCheck();
      const range = buildDatePeriodRange(checkpoint.startDate, checkpoint.endDate || checkpoint.startDate);
      const itemTargetCount = checkpoint.itemTargetCounts[itemIndex] || 0;
      const itemRecordedCount = checkpoint.itemRecordedCounts[itemIndex] || 0;
      if (!itemTargetCount || itemRecordedCount >= itemTargetCount) {
        return 'done';
      }
      if (this.runtime.pauseRequested) {
        return 'paused';
      }

      this.pushLog(`${this.describeItem(item)}：正在读取标准化列表`);
      const firstPage = await requestStandardizationListPage(range, 1, activeCancelCheck, item);
      if (!firstPage.totalRecords) {
        this.pushLog(`${this.describeItem(item)}：标准化列表当前筛选下没有数据`);
        return 'done';
      }

      const totalPages = firstPage.totalPages;
      let matchedCandidateCount = 0;
      let historicalSeenCount = 0;
      this.pushLog(`${this.describeItem(item)}：标准化列表共有 ${firstPage.totalRecords} 条，本品类目标 ${itemTargetCount} 条，共 ${totalPages} 页，将从最新视频开始筛选`);

      for (let pageNumber = totalPages; pageNumber >= 1; pageNumber -= 1) {
        if (this.isCurrentJobStopRequested()) {
          throw new Error('任务已结束');
        }
        if ((checkpoint.itemRecordedCounts[itemIndex] || 0) >= itemTargetCount || checkpoint.rows.length >= checkpoint.targetCount) {
          break;
        }
        if (this.runtime.pauseRequested) {
          break;
        }
        this.pushLog(`${this.describeItem(item)}：正在读取列表第 ${pageNumber}/${totalPages} 页`);
        const pageResult = pageNumber === 1
          ? firstPage
          : await requestStandardizationListPage(range, pageNumber, activeCancelCheck, item);
        const pageStatus = await this.processStandardizationApiPage(
          item,
          itemIndex,
          pageResult.records,
          pageNumber,
          totalPages,
          activeCancelCheck
        );
        matchedCandidateCount += pageStatus.candidateCount;
        historicalSeenCount += pageStatus.historicalSeenCount || 0;
        if (pageStatus.status === 'paused') {
          break;
        }
      }

      if (!matchedCandidateCount) {
        this.pushLog(`${this.describeItem(item)}：标准化列表里没有符合当前品类和状态的视频`);
      }
      if (historicalSeenCount) {
        this.pushLog(`${this.describeItem(item)}：已跳过历史看过视频 ${historicalSeenCount} 条`);
      }
      if (
        this.runtime.pauseRequested
        && checkpoint.rows.length < checkpoint.targetCount
        && (checkpoint.itemRecordedCounts[itemIndex] || 0) < itemTargetCount
      ) {
        return 'paused';
      }
      return 'done';
    }

    async processStandardizationApiPage(item, itemIndex, records, pageNumber, totalPages, cancelCheck) {
      const checkpoint = this.runtime.checkpoint;
      const pageSeen = new Set();
      let candidateCount = 0;
      const rows = (Array.isArray(records) ? records : [])
        .map((record) => normalizeStandardizationApiRow(record))
        .filter(Boolean);
      let historicalSeenCount = 0;
      for (let index = rows.length - 1; index >= 0; index -= 1) {
        if (this.isCurrentJobStopRequested()) {
          throw new Error('任务已结束');
        }
        if (this.runtime.pauseRequested) {
          break;
        }
        if (
          checkpoint.rows.length >= checkpoint.targetCount
          || (checkpoint.itemRecordedCounts[itemIndex] || 0) >= (checkpoint.itemTargetCounts[itemIndex] || 0)
        ) {
          return { status: 'done', candidateCount, historicalSeenCount };
        }
        const row = rows[index];
        if (!isStandardizationApiRowCandidate(row, item)) {
          continue;
        }
        candidateCount += 1;
        if (pageSeen.has(row.taskId)) {
          continue;
        }
        if (this.isStandardizationTaskSeen(row.taskId)) {
          historicalSeenCount += 1;
          pageSeen.add(row.taskId);
          continue;
        }
        if (this.isStandardizationTaskReserved(row.taskId, checkpoint)) {
          continue;
        }
        pageSeen.add(row.taskId);
        const taskStatus = await this.runStandardizationRowTask(item, itemIndex, row, pageNumber, totalPages, cancelCheck);
        if (taskStatus === 'paused') {
          return { status: 'paused', candidateCount, historicalSeenCount };
        }
        if (this.isStandardizationTargetReached(itemIndex, checkpoint)) {
          return { status: 'done', candidateCount, historicalSeenCount };
        }
      }
      return { status: this.runtime.pauseRequested ? 'paused' : 'continue', candidateCount, historicalSeenCount };
    }

    async completeStandardizationJob() {
      const checkpoint = this.runtime.checkpoint;
      const rows = checkpoint.rows.slice(0, checkpoint.targetCount);
      const skippedCount = Math.max(0, Math.trunc(Number(checkpoint.skippedCount) || 0));
      const report = {
        version: 1,
        startDate: checkpoint.startDate,
        endDate: checkpoint.endDate || checkpoint.startDate,
        targetCount: checkpoint.targetCount,
        actualCount: rows.length,
        fileName: `标准化 ${checkpoint.startDate === checkpoint.endDate ? checkpoint.startDate : `${checkpoint.startDate}-${checkpoint.endDate}`}`,
        rows: createStandardExportRows(rows),
        generatedAt: new Date().toISOString()
      };
      this.runtime.report = report;
      await storageSetCached({
        [STORAGE_KEYS.report]: report
      });
      await this.clearCheckpoint();
      this.runtime.running = false;
      this.runtime.jobType = '';
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.runtime.statusText = `标准化完成，已标准化 ${rows.length} 条，跳过 ${skippedCount} 条`;
      this.pushLog(`标准化完成，已标准化 ${rows.length} 条，跳过 ${skippedCount} 条`);
      this.render();
    }

    async failJob(error) {
      const message = error && error.message ? error.message : String(error);
      const visibleMessage = formatUserVisibleLogText(message) || '任务处理失败';
      const paused = message === '任务已暂停';
      const stopped = message === '任务已结束';
      if (stopped && !this.runtime.running && !this.runtime.jobType) {
        return;
      }
      const checkpoint = this.getActiveCheckpoint();
      if (checkpoint) {
        checkpoint.status = paused ? 'paused' : stopped ? 'stopped' : 'error';
        checkpoint.statusText = paused
          ? '任务已暂停，可点击继续任务'
          : stopped
            ? '任务已结束，可以重新开始'
            : `任务遇到问题：${visibleMessage}`;
        await this.saveCheckpoint();
      }
      this.runtime.running = false;
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.runtime.statusText = paused
        ? '任务已暂停，可点击继续任务'
        : stopped
          ? '任务已结束，可以重新开始'
          : `任务遇到问题：${visibleMessage}`;
      this.pushLog(
        paused
          ? '任务已暂停'
          : stopped
            ? '任务已结束'
            : `任务遇到问题：${visibleMessage}`
      );
      this.runtime.jobType = '';
      this.render();
    }
  }

  let app = null;
  let booting = false;
  let lastPageKind = '';
  let activeWorkerRequestId = '';
  let activeMediaWorkerRequestId = '';

  async function ensureStandardizationMounted() {
    if (!isSupportedPage()) {
      if (app) {
        app.destroy();
        app = null;
      }
      return 'destroyed';
    }
    await waitForBodyReady();
    if (!app) {
      app = new YspStandardizationApp();
      await app.init();
      return 'created';
    }
    if (!document.getElementById('ysp-standardization-panel-root')) {
      app.mountPanel();
      if (isListPage()) await app.tryResume();
      else app.render();
      return 'remounted';
    }
    return 'noop';
  }

  async function ensureDetailWorkerHandled() {
    if (!isDetailPage()) {
      activeWorkerRequestId = '';
      return;
    }
    const requestId = getStandardizationWorkerRequestIdFromLocation();
    if (!requestId || requestId === activeWorkerRequestId) return;
    activeWorkerRequestId = requestId;
    await runStandardizationDetailWorker(requestId);
  }

  async function ensureYangshipinMediaWorkerHandled() {
    if (!isYangshipinMediaWorkerPage()) {
      activeMediaWorkerRequestId = '';
      return;
    }
    const requestId = getStandardizationMediaWorkerRequestIdFromLocation();
    if (!requestId || requestId === activeMediaWorkerRequestId) return;
    activeMediaWorkerRequestId = requestId;
    await runStandardizationMediaWorker(requestId);
  }

  async function runBootstrap() {
    if (booting) return;
    booting = true;
    try {
      if (isYangshipinMediaWorkerPage()) { lastPageKind = 'media'; await ensureYangshipinMediaWorkerHandled(); return; }
      if (!isSupportedPage()) { lastPageKind = 'unsupported'; if (app) { app.destroy(); app = null; } return; }
      const currentPageKind = isDetailPage() ? 'detail' : 'list';
      const mountState = await ensureStandardizationMounted();
      if (isDetailPage()) { lastPageKind = currentPageKind; await ensureDetailWorkerHandled(); return; }
      if (currentPageKind === 'list' && lastPageKind !== 'list' && mountState === 'noop' && app) { await app.tryResume(); await app.tryStartPendingStandardizationJob(); }
      lastPageKind = currentPageKind;
    } catch (error) {
      logger.error(error);
    } finally {
      booting = false;
    }
  }

  function createRouteWatcher(config) {
    const eventName = config.eventName;
    const panelId = config.panelId;
    const isActive = config.isActive;
    const onChange = config.onChange;
    let lastHref = location.href;
    let timer = 0;
    const methods = ['pushState', 'replaceState'];

    const schedule = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = 0;
        onChange();
      }, 60);
    };

    const onLocationChange = () => {
      const panelExists = document.getElementById(panelId);
      if (location.href === lastHref && panelExists) return;
      lastHref = location.href;
      schedule();
    };

    return {
      start() {
        for (const method of methods) {
          const original = history[method];
          history[method] = function wrappedHistoryMethod(...args) {
            const result = original.apply(this, args);
            window.dispatchEvent(new Event(eventName));
            return result;
          };
        }
        window.addEventListener('popstate', onLocationChange);
        window.addEventListener('hashchange', onLocationChange);
        window.addEventListener(eventName, onLocationChange);
        const observer = new MutationObserver(() => {
          if (typeof isActive === 'function' && !isActive()) return;
          if (!document.getElementById(panelId)) schedule();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
      }
    };
  }

  startCloseTabsSignalWatcher();
  createRouteWatcher({
    eventName: 'ysp:standardization-location-change',
    panelId: 'ysp-standardization-panel-root',
    isActive: isSupportedPage,
    onChange: runBootstrap
  }).start();
  runBootstrap();
})();
