// ==UserScript==
// @name         央视频标准化工作台
// @namespace    https://github.com/Noah-Wu66/CPEC-EXT
// @version      2.1.37
// @description  在标准化系统页面执行日报采集与二次质检，并保存结果
// @author       Noah
// @match        http://std.video.cloud.cctv.com/*
// @match        https://std.video.cloud.cctv.com/*
// @match        https://yangshipin.cn/*
// @match        https://www.yangshipin.cn/*
// @match        https://m.yangshipin.cn/*
// @match        https://w.yangshipin.cn/*
// @updateURL    https://gh-proxy.com/https://raw.githubusercontent.com/Noah-Wu66/CPEC-EXT/main/ysp-dev/ysp-daily-report.user.js
// @downloadURL  https://gh-proxy.com/https://raw.githubusercontent.com/Noah-Wu66/CPEC-EXT/main/ysp-dev/ysp-daily-report.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_info
// @grant        GM_xmlhttpRequest
// @connect      dashscope.aliyuncs.com
// @connect      s.yangshipin.cn
// @connect      playvv.yangshipin.cn
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  if (window.__YSP_WORKBENCH__) {
    return;
  }
  window.__YSP_WORKBENCH__ = true;

  const SCRIPT_VERSION = GM_info.script.version;

  const PANEL_STYLE = `
#ysp-daily-panel-root {
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

#ysp-daily-panel-root.is-settings-open {
  pointer-events: auto;
}

.ysp-daily-panel__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(8, 24, 40, 0.16);
  transition: background 0.22s ease;
}

#ysp-daily-panel-root.is-focused .ysp-daily-panel__backdrop {
  background: rgba(8, 24, 40, 0.28);
}

.ysp-daily-panel {
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

#ysp-daily-panel-root.is-minimized {
  justify-content: flex-end;
}

#ysp-daily-panel-root.is-minimized .ysp-daily-panel__backdrop {
  opacity: 0;
  pointer-events: none;
}

#ysp-daily-panel-root.is-minimized .ysp-daily-panel {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateX(32px) scale(0.98);
}

.ysp-daily-panel::before,
.ysp-daily-panel::after {
  content: "";
  position: absolute;
  pointer-events: none;
  border-radius: 999px;
  filter: blur(4px);
}

.ysp-daily-panel::before {
  top: -84px;
  right: -42px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(254, 202, 137, 0.34), rgba(254, 202, 137, 0));
}

.ysp-daily-panel::after {
  bottom: -96px;
  left: -54px;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(121, 166, 215, 0.28), rgba(121, 166, 215, 0));
}

.ysp-daily-panel__header {
  position: relative;
  z-index: 2;
  padding: 20px 22px 16px;
  color: #f9fbff;
  background:
    linear-gradient(135deg, rgba(15, 41, 66, 0.98), rgba(27, 82, 122, 0.94)),
    #17314b;
}

.ysp-daily-panel__header::after {
  content: "";
  position: absolute;
  inset: auto 22px 0 22px;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0));
}

.ysp-daily-panel__header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.ysp-daily-panel__header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.ysp-daily-panel__title {
  margin: 0;
  font-family: "STZhongsong", "Songti SC", "Noto Serif SC", serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.15;
}

.ysp-daily-panel__header-chip {
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

button.ysp-daily-panel__header-chip {
  cursor: pointer;
}

button.ysp-daily-panel__header-chip:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.18);
}

.ysp-daily-panel__body {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.78fr);
  gap: 16px;
  padding: 18px 18px 20px;
  overflow: hidden;
  flex: 1 1 auto;
  min-height: 0;
}

.ysp-daily-panel__main,
.ysp-daily-panel__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.ysp-daily-panel__main {
  overflow-y: auto;
  padding-right: 4px;
}

.ysp-daily-panel__side {
  overflow: hidden;
}

.ysp-daily-panel__section {
  position: relative;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(25, 56, 84, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.ysp-daily-panel__section--compact {
  padding: 14px 16px;
}

.ysp-daily-panel__section--fill {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ysp-daily-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.ysp-daily-panel__label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #18344c;
}

.ysp-daily-panel__toolbar .ysp-daily-panel__label {
  margin-bottom: 0;
}

.ysp-daily-panel__toolbar-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #37617f;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.ysp-daily-panel__toolbar-button:hover {
  color: #17344d;
}

.ysp-daily-panel__date {
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

.ysp-daily-panel__date-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ysp-daily-panel__date-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ysp-daily-panel__date-caption {
  font-size: 12px;
  font-weight: 700;
  color: #49657c;
}

.ysp-daily-panel__badge {
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

.ysp-daily-panel__catalog {
  display: grid;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
  padding-right: 4px;
  overflow-y: auto;
}

.ysp-daily-panel__group {
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

.ysp-daily-panel__group:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(23, 56, 84, 0.08);
}

.ysp-daily-panel__group.is-selected {
  border-color: color-mix(in srgb, var(--accent) 28%, white);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 82%, white), rgba(255, 255, 255, 0.94)),
    #ffffff;
  box-shadow: 0 16px 28px rgba(23, 56, 84, 0.1);
  transform: translateY(-1px);
}

.ysp-daily-panel__group[data-theme="knowledge"] {
  --accent: #cf7d2e;
  --accent-soft: rgba(207, 125, 46, 0.12);
  --accent-border: rgba(207, 125, 46, 0.16);
  --accent-ink: #7d4b1f;
}

.ysp-daily-panel__group[data-theme="information"] {
  --accent: #4b7fab;
  --accent-soft: rgba(75, 127, 171, 0.12);
  --accent-border: rgba(75, 127, 171, 0.16);
  --accent-ink: #274766;
}

.ysp-daily-panel__group[data-theme="culture"] {
  --accent: #be6b58;
  --accent-soft: rgba(190, 107, 88, 0.12);
  --accent-border: rgba(190, 107, 88, 0.16);
  --accent-ink: #733d31;
}

.ysp-daily-panel__group-header {
  display: block;
}

.ysp-daily-panel__group-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.45;
  color: var(--accent-ink);
}

.ysp-daily-panel__actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.ysp-daily-panel__side > .ysp-daily-panel__actions {
  flex: 0 0 auto;
  margin-top: auto;
}

.ysp-daily-panel__button {
  min-height: 48px;
  padding: 10px 12px;
  border: 0;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
}

.ysp-daily-panel__button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.ysp-daily-panel__button:disabled {
  opacity: 0.5;
  cursor: default;
  transform: none;
  box-shadow: none;
}

.ysp-daily-panel__button--primary {
  background: linear-gradient(135deg, #0f7d94, #1f5f86);
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(31, 95, 134, 0.2);
}

.ysp-daily-panel__button--danger {
  background: linear-gradient(135deg, rgba(255, 245, 241, 0.96), rgba(255, 236, 231, 0.96));
  color: #b3472f;
  border: 1px solid rgba(194, 92, 64, 0.18);
  box-shadow: 0 10px 20px rgba(194, 92, 64, 0.12);
}

.ysp-daily-panel__status {
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

.ysp-daily-panel__status-head {
  display: flex;
  align-items: center;
}

.ysp-daily-panel__status-head .ysp-daily-panel__label {
  margin-bottom: 0;
}

.ysp-daily-panel__status-value {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.6;
  color: #17324f;
  word-break: break-word;
}

.ysp-daily-panel__status-subtext {
  padding-top: 8px;
  border-top: 1px solid rgba(22, 51, 78, 0.08);
  font-size: 12px;
  color: #6b7a90;
}

.ysp-daily-panel__result-card {
  flex: 0 0 auto;
}

.ysp-daily-panel__download-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
}

.ysp-daily-panel__log-card {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.ysp-daily-panel__log-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.ysp-daily-panel__log-entry {
  padding: 8px 0;
  border-bottom: 1px dashed #d8e2ee;
  color: #40556f;
  font-size: 12px;
  line-height: 1.65;
  word-break: break-all;
}

.ysp-daily-panel__report {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(252, 244, 234, 0.9), rgba(238, 246, 255, 0.9));
  border: 1px solid rgba(25, 56, 84, 0.08);
}

.ysp-daily-panel__report-empty {
  font-size: 12px;
  line-height: 1.6;
  color: #5d7690;
}

.ysp-daily-panel__report-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.ysp-daily-panel__report-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #18344c;
}

.ysp-daily-panel__report-meta {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.55;
  color: #54708a;
}

.ysp-daily-panel__download {
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

.ysp-daily-panel__download:disabled {
  opacity: 0.5;
  cursor: default;
  box-shadow: none;
}

.ysp-daily-panel__report-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ysp-daily-panel__dock {
  position: absolute;
  top: 50%;
  right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 76px;
  border: 0;
  border-radius: 18px 0 0 18px;
  background: linear-gradient(180deg, rgba(15, 41, 66, 0.98), rgba(27, 82, 122, 0.94));
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 16px 30px rgba(19, 45, 71, 0.22);
  transform: translateY(-50%) translateX(12px);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
}

#ysp-daily-panel-root.is-minimized .ysp-daily-panel__dock {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(-50%) translateX(0);
}

@media (max-width: 1366px) {
  #ysp-daily-panel-root {
    padding: 16px;
  }

  .ysp-daily-panel {
    width: min(900px, calc(100vw - 24px));
  }
}

@media (max-width: 920px) {
  .ysp-daily-panel {
    width: min(480px, calc(100vw - 24px));
  }

  .ysp-daily-panel__body {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .ysp-daily-panel__main,
  .ysp-daily-panel__side {
    overflow: visible;
    padding-right: 0;
  }

  .ysp-daily-panel__download-list,
  .ysp-daily-panel__log-list {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }

  .ysp-daily-panel__log-card {
    min-height: auto;
  }

  .ysp-daily-panel__date-grid {
    grid-template-columns: 1fr;
  }
}

.ysp-daily-panel__module-switcher {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ysp-daily-panel__module-tab {
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

.ysp-daily-panel__module-tab.is-active {
  border-color: rgba(31, 94, 139, 0.2);
  background: linear-gradient(135deg, rgba(27, 82, 122, 0.96), rgba(16, 50, 78, 0.98));
  color: #f9fbff;
  box-shadow: 0 10px 24px rgba(19, 57, 88, 0.18);
}

.ysp-daily-panel__module {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ysp-daily-panel__module-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ysp-daily-panel__module[hidden] {
  display: none;
}

.ysp-daily-panel__subheader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ysp-daily-panel__subheader-title {
  font-size: 13px;
  font-weight: 700;
  color: #18344c;
}

.ysp-daily-panel__help {
  font-size: 12px;
  color: #617688;
}

.ysp-daily-panel__field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ysp-daily-panel__field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: visible;
}

.ysp-daily-panel__input {
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

.ysp-daily-panel__input:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ysp-daily-panel__group-picker {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ysp-daily-panel__group-trigger {
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

.ysp-daily-panel__group-trigger:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ysp-daily-panel__group-picker.is-open .ysp-daily-panel__group-trigger {
  border-color: rgba(31, 94, 139, 0.32);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 0 0 3px rgba(46, 110, 158, 0.1), inset 0 1px 2px rgba(17, 41, 66, 0.04);
}

.ysp-daily-panel__group-trigger-text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-align: left;
  text-overflow: ellipsis;
}

.ysp-daily-panel__group-trigger-icon {
  flex: 0 0 auto;
  color: #60778d;
  font-size: 12px;
}

.ysp-daily-panel__group-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 20;
  display: grid;
  gap: 8px;
  max-height: 280px;
  padding: 10px;
  overflow-y: auto;
  border: 1px solid rgba(24, 52, 76, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 36px rgba(23, 56, 84, 0.16);
  backdrop-filter: blur(16px);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(-6px);
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
}

.ysp-daily-panel__group-picker.is-open .ysp-daily-panel__group-menu {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
}

.ysp-daily-panel__group-option {
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

.ysp-daily-panel__group-option:hover {
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 44%, white), rgba(255, 255, 255, 0.94));
}

.ysp-daily-panel__group-option.is-selected {
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 78%, white), rgba(255, 255, 255, 0.96));
  border-color: color-mix(in srgb, var(--accent) 26%, white);
}

.ysp-daily-panel__group-option:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ysp-daily-panel__group-option[data-theme="knowledge"] {
  --accent: #cf7d2e;
  --accent-soft: rgba(207, 125, 46, 0.12);
  --accent-border: rgba(207, 125, 46, 0.16);
  --accent-ink: #7d4b1f;
}

.ysp-daily-panel__group-option[data-theme="information"] {
  --accent: #4b7fab;
  --accent-soft: rgba(75, 127, 171, 0.12);
  --accent-border: rgba(75, 127, 171, 0.16);
  --accent-ink: #274766;
}

.ysp-daily-panel__group-option[data-theme="culture"] {
  --accent: #be6b58;
  --accent-soft: rgba(190, 107, 88, 0.12);
  --accent-border: rgba(190, 107, 88, 0.16);
  --accent-ink: #733d31;
}

.ysp-daily-panel__group-option-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.ysp-daily-panel__group-option-meta {
  font-size: 11px;
  font-weight: 700;
  color: #6a7f91;
}

.ysp-daily-panel__group-option-label {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  color: inherit;
}

.ysp-daily-panel__group-option-check {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 700;
  color: color-mix(in srgb, var(--accent) 82%, #18344c);
  white-space: nowrap;
}

.ysp-daily-panel__input--secret {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.ysp-daily-panel__hint {
  font-size: 12px;
  line-height: 1.6;
  color: #5f7284;
}

.ysp-daily-panel__group-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ysp-daily-panel__group-note {
  font-size: 12px;
  color: #5d7183;
}

.ysp-daily-panel__button-row {
  display: flex;
  gap: 12px;
}

.ysp-daily-panel__button-row > * {
  flex: 1 1 0;
}

.ysp-daily-panel__stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ysp-daily-panel__status-card,
.ysp-daily-panel__result-card,
.ysp-daily-panel__log-card {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(25, 56, 84, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.ysp-daily-panel__status-title,
.ysp-daily-panel__log-title,
.ysp-daily-panel__result-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: #18344c;
}

.ysp-daily-panel__status-text {
  font-size: 13px;
  line-height: 1.7;
  color: #28445a;
  white-space: pre-wrap;
}

.ysp-daily-panel__result-empty,
.ysp-daily-panel__log-empty {
  font-size: 12px;
  color: #6d7e8d;
}

.ysp-daily-panel__result-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ysp-daily-panel__result-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(247, 250, 253, 0.92);
  border: 1px solid rgba(25, 56, 84, 0.08);
}

.ysp-daily-panel__result-head {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 700;
  color: #1e4260;
}

.ysp-daily-panel__result-meta {
  font-size: 12px;
  line-height: 1.6;
  color: #5d7082;
}

.ysp-daily-panel__link-button {
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

.ysp-daily-panel__log-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.ysp-daily-panel__log-item {
  font-size: 12px;
  line-height: 1.6;
  color: #28445a;
  word-break: break-all;
}

.ysp-daily-panel__settings-trigger {
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

.ysp-daily-panel__modal-mask {
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

#ysp-daily-panel-root.is-settings-open .ysp-daily-panel__modal-mask {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.ysp-daily-panel__modal {
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

.ysp-daily-panel__modal-title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: #18344c;
}

.ysp-daily-panel__modal-text {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.7;
  color: #5d7082;
}

.ysp-daily-panel__modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.ysp-daily-panel__modal-actions button {
  min-width: 92px;
}

.ysp-daily-worker-badge {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 2147483647;
  width: min(420px, calc(100vw - 24px));
  max-height: calc(100vh - 36px);
  overflow: hidden;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(13, 31, 49, 0.98), rgba(18, 45, 70, 0.96));
  color: #f7fbff;
  border: 1px solid rgba(153, 198, 240, 0.22);
  box-shadow: 0 22px 50px rgba(8, 20, 32, 0.34);
  backdrop-filter: blur(16px);
}

.ysp-daily-worker-badge__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(197, 220, 244, 0.14);
}

.ysp-daily-worker-badge__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}

.ysp-daily-worker-badge__subtitle {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(227, 240, 252, 0.78);
}

.ysp-daily-worker-badge__stage {
  flex-shrink: 0;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(120, 185, 255, 0.16);
  border: 1px solid rgba(153, 205, 255, 0.18);
  font-size: 11px;
  font-weight: 700;
  color: #d8eeff;
}

.ysp-daily-worker-badge__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px 14px;
  overflow-y: auto;
  max-height: calc(100vh - 110px);
}

.ysp-daily-worker-badge__section {
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(194, 222, 246, 0.12);
}

.ysp-daily-worker-badge__section-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: #d9ecff;
}

.ysp-daily-worker-badge__meta {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 8px 10px;
  font-size: 12px;
  line-height: 1.55;
}

.ysp-daily-worker-badge__meta dt {
  margin: 0;
  color: rgba(215, 232, 247, 0.66);
}

.ysp-daily-worker-badge__meta dd {
  margin: 0;
  color: #f7fbff;
  word-break: break-word;
}

.ysp-daily-worker-badge__text {
  font-size: 12px;
  line-height: 1.7;
  color: #f4f9ff;
  white-space: pre-wrap;
  word-break: break-word;
}

.ysp-daily-worker-badge__empty {
  font-size: 12px;
  line-height: 1.6;
  color: rgba(219, 236, 251, 0.56);
}

.ysp-daily-worker-badge__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ysp-daily-worker-badge__item {
  padding: 9px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(198, 226, 248, 0.1);
  font-size: 12px;
  line-height: 1.6;
  color: #f7fbff;
  word-break: break-word;
}

.ysp-daily-worker-badge__item-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 3px;
}

.ysp-daily-worker-badge__item-label {
  font-weight: 700;
}

.ysp-daily-worker-badge__item-badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.ysp-daily-worker-badge__item-badge.is-accepted {
  background: rgba(78, 201, 134, 0.18);
  color: #9af0b8;
}

.ysp-daily-worker-badge__item-badge.is-rejected {
  background: rgba(255, 167, 38, 0.18);
  color: #ffd79c;
}

.ysp-daily-worker-badge__item-subtext {
  margin-top: 4px;
  color: rgba(226, 239, 252, 0.72);
}

.ysp-daily-worker-badge__timeline {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ysp-daily-worker-badge__timeline-entry {
  padding-left: 11px;
  border-left: 2px solid rgba(118, 183, 250, 0.32);
  font-size: 12px;
  line-height: 1.55;
  color: rgba(239, 247, 255, 0.86);
}

.ysp-daily-worker-badge__final {
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(111, 183, 255, 0.1);
  border: 1px solid rgba(158, 208, 255, 0.16);
}

.ysp-daily-worker-badge__final-label {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #d8eeff;
}

.ysp-daily-worker-badge__final-value {
  font-size: 13px;
  line-height: 1.7;
  color: #ffffff;
}

@media (max-width: 920px) {
  .ysp-daily-panel__field-grid,
  .ysp-daily-panel__group-grid {
    grid-template-columns: 1fr;
  }

  .ysp-daily-panel__button-row {
    flex-direction: column;
  }

  .ysp-daily-worker-badge {
    top: 10px;
    right: 10px;
    width: calc(100vw - 20px);
    max-height: calc(100vh - 20px);
  }

  .ysp-daily-worker-badge__body {
    max-height: calc(100vh - 94px);
  }
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
    settings: 'yspWorkbenchSettingsV2',
    report: 'yspWorkbenchDailyReportV2',
    resultCache: 'yspWorkbenchDailyResultCacheV2',
    secondaryQcReport: 'yspWorkbenchSecondaryQcReportV2',
    dailyCheckpoint: 'yspWorkbenchDailyCheckpointV2',
    secondaryQcCheckpoint: 'yspWorkbenchSecondaryQcCheckpointV2',
    secondaryQcWorkerActiveRequest: 'yspWorkbenchSecondaryQcWorkerActiveRequestV2',
    secondaryQcWorkerRequestPrefix: 'yspWorkbenchSecondaryQcWorkerRequestV2:',
    secondaryQcWorkerResponsePrefix: 'yspWorkbenchSecondaryQcWorkerResponseV2:',
    secondaryQcWorkerProgressPrefix: 'yspWorkbenchSecondaryQcWorkerProgressV2:',
    secondaryQcWorkerStopPrefix: 'yspWorkbenchSecondaryQcWorkerStopV2:',
    secondaryQcMediaWorkerRequestPrefix: 'yspWorkbenchSecondaryQcMediaWorkerRequestV2:',
    secondaryQcMediaWorkerResponsePrefix: 'yspWorkbenchSecondaryQcMediaWorkerResponseV2:'
  };
  const MAX_LOGS = 50;
  const QUERY_TIMEOUT = 90000;
  const PAGE_READY_TIMEOUT = 60000;
  const DETAIL_PAGE_TIMEOUT = 60000;
  const DASHSCOPE_REQUEST_TIMEOUT = 90 * 1000;
  const WORKER_START_TIMEOUT = 15000;
  const WORKER_PROGRESS_STALL_TIMEOUT = 90 * 1000;
  const WORKER_RESPONSE_TIMEOUT = 8 * 60 * 1000;
  const MEDIA_WORKER_RESPONSE_TIMEOUT = 90 * 1000;
  const MAX_SECONDARY_QC_VIDEO_DURATION_SECONDS = 5 * 60;
  const SECONDARY_QC_VIDEO_ANALYSIS_FPS = 3;
  const SECONDARY_QC_VIDEO_ANALYSIS_MAX_PIXELS = 2073600;
  const DASHSCOPE_CHAT_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
  const YANGSHIPIN_PLAYER_BUNDLE_URL = 'https://s.yangshipin.cn/wc/ysplayer.modern.js';
  const YANGSHIPIN_VIDEO_INFO_URL = 'https://playvv.yangshipin.cn/playvinfo';
  const YANGSHIPIN_PLAYER_APP_VERSION = '1.2.3';
  const YANGSHIPIN_PLAYER_PLATFORM = 4330701;
  const YANGSHIPIN_VIDEO_WORKER_URL = 'https://yangshipin.cn/video/home';
  let yangshipinCKeyGeneratorPromise = null;
  let yangshipinGuidCache = '';

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
    secondaryQcWorkerStopped: false,
    secondaryQcWorkerRequestId: '',
    secondaryQcWorkerStopWatcher: 0
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
    return String(value || '').replace(/\s+/g, ' ').trim();
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

  function normalizeStoredReport(report) {
    if (
      !report
      || typeof report !== 'object'
      || report.version !== 1
      || !normalizeText(report.startDate)
      || !normalizeText(report.endDate)
      || !normalizeText(report.generatedAt)
      || !Array.isArray(report.itemKeys)
      || !Array.isArray(report.columns)
      || !Array.isArray(report.rows)
    ) {
      return null;
    }

    const sourceKeys = normalizeSelectedKeys(report.itemKeys);
    if (!sourceKeys.length || sourceKeys.length !== report.itemKeys.length) {
      return null;
    }
    const columns = buildReportColumns(getEntriesByKeys(sourceKeys));
    const normalizedRows = [];

    for (const rawRow of report.rows) {
      if (!rawRow || typeof rawRow !== 'object' || !rawRow.date || !Array.isArray(rawRow.results)) {
        continue;
      }
      const rowMap = new Map();
      for (const result of rawRow.results) {
        const normalized = normalizeStoredResultRow(result);
        if (normalized) {
          rowMap.set(normalized.key, normalized);
        }
      }
      normalizedRows.push({
        date: rawRow.date,
        results: columns.map((column) => rowMap.get(column.key) || createEmptyResult(column.key))
      });
    }

    if (!normalizedRows.length) {
      return null;
    }

    return {
      version: 1,
      startDate: report.startDate,
      endDate: report.endDate,
      itemKeys: sourceKeys,
      columns,
      rows: normalizedRows,
      generatedAt: report.generatedAt
    };
  }

  function normalizeStoredCheckpoint(checkpoint) {
    if (
      !checkpoint
      || typeof checkpoint !== 'object'
      || checkpoint.version !== 4
      || !normalizeText(checkpoint.startDate)
      || !normalizeText(checkpoint.endDate)
      || !normalizeText(checkpoint.status)
      || !normalizeText(checkpoint.phase)
      || !normalizeText(checkpoint.startedAt)
      || !normalizeText(checkpoint.updatedAt)
    ) {
      return null;
    }
    const groupIds = normalizeSelectedGroupIds(checkpoint.groupIds);
    const itemKeys = normalizeSelectedKeys(checkpoint.itemKeys);
    const startDate = checkpoint.startDate || '';
    const endDate = checkpoint.endDate || '';
    const dateList = Array.isArray(checkpoint.dateList) ? checkpoint.dateList.filter(Boolean) : [];
    if (!startDate || !endDate || !groupIds.length || !itemKeys.length || !dateList.length) {
      return null;
    }
    if (!Number.isInteger(checkpoint.currentDateIndex) || !Number.isInteger(checkpoint.currentItemIndex)) {
      return null;
    }
    if (checkpoint.currentDateIndex < 0 || checkpoint.currentDateIndex > dateList.length || checkpoint.currentItemIndex < 0 || checkpoint.currentItemIndex > itemKeys.length) {
      return null;
    }
    if (!['running', 'paused', 'stopped', 'error'].includes(normalizeText(checkpoint.status))) {
      return null;
    }
    if (!['std', 'resume-qc'].includes(normalizeText(checkpoint.phase))) {
      return null;
    }
    const normalizedResults = {};
    if (checkpoint.results && typeof checkpoint.results === 'object') {
      for (const [date, dayResults] of Object.entries(checkpoint.results)) {
        if (!dayResults || typeof dayResults !== 'object') {
          continue;
        }
        const normalizedDayResults = {};
        for (const rowValue of Object.values(dayResults)) {
          const normalizedRow = normalizeStoredResultRow(rowValue);
          if (!normalizedRow) {
            continue;
          }
          normalizedDayResults[normalizedRow.key] = normalizedRow;
        }
        if (Object.keys(normalizedDayResults).length) {
          normalizedResults[date] = normalizedDayResults;
        }
      }
    }
    return {
      ...checkpoint,
      version: 4,
      startDate,
      endDate,
      dateList,
      groupIds,
      itemKeys,
      currentDateIndex: checkpoint.currentDateIndex,
      currentItemIndex: checkpoint.currentItemIndex,
      results: normalizedResults
    };
  }

  function normalizeStoredResultCache(cache) {
    if (!cache || typeof cache !== 'object') {
      return {};
    }
    const normalizedCache = {};
    for (const [date, dayResults] of Object.entries(cache)) {
      if (!dayResults || typeof dayResults !== 'object') {
        continue;
      }
      const normalizedDayResults = {};
      for (const rowValue of Object.values(dayResults)) {
        const normalizedRow = normalizeStoredResultRow(rowValue);
        if (!normalizedRow || !normalizedRow.collectionCompleted) {
          continue;
        }
        normalizedDayResults[normalizedRow.key] = normalizedRow;
      }
      if (Object.keys(normalizedDayResults).length) {
        normalizedCache[date] = normalizedDayResults;
      }
    }
    return normalizedCache;
  }

  function trimResultCacheByCutoff(cache, cutoffDateString) {
    const trimmedCache = {};
    for (const [date, dayResults] of Object.entries(cache || {})) {
      if (isDateExpiredByQuarter(date, cutoffDateString)) {
        continue;
      }
      trimmedCache[date] = dayResults;
    }
    return trimmedCache;
  }

  function trimReportByCutoff(report, cutoffDateString) {
    const normalizedReport = normalizeStoredReport(report);
    if (!normalizedReport) {
      return null;
    }
    const rows = normalizedReport.rows.filter((row) => !isDateExpiredByQuarter(row.date, cutoffDateString));
    if (!rows.length) {
      return null;
    }
    return {
      ...normalizedReport,
      startDate: rows[0].date,
      endDate: rows[rows.length - 1].date,
      rows
    };
  }

  function buildReportColumns(entries) {
    const totalByLabel = new Map();
    const usedByLabel = new Map();
    for (const entry of entries) {
      totalByLabel.set(entry.exportLabel, (totalByLabel.get(entry.exportLabel) || 0) + 1);
    }
    return entries.map((entry) => {
      const total = totalByLabel.get(entry.exportLabel) || 0;
      const used = (usedByLabel.get(entry.exportLabel) || 0) + 1;
      usedByLabel.set(entry.exportLabel, used);
      return {
        key: entry.key,
        label: total > 1 ? `${entry.exportLabel}·${used}` : entry.exportLabel,
        exportLabel: entry.exportLabel,
        groupLabel: entry.groupLabel,
        subgroupLabel: entry.subgroupLabel,
        queryLabel: entry.queryLabel,
        theme: entry.theme
      };
    });
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
      && Boolean(getSecondaryQcMediaWorkerRequestIdFromLocation());
  }

  function isListPage() {
    return location.pathname.startsWith('/stdList');
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

  function triggerMouseClick(element) {
    element.scrollIntoView({ block: 'center', inline: 'center' });
    const events = ['mouseover', 'mousedown', 'mouseup', 'click'];
    for (const type of events) {
      element.dispatchEvent(createMouseEvent(type));
    }
  }

  async function waitFor(checker, timeoutMs, message, options) {
    const cancelCheck = options && typeof options.cancelCheck === 'function' ? options.cancelCheck : null;
    const cancelMessage = normalizeText(options && options.cancelMessage) || '采集已结束';
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
        throw new Error('采集已结束');
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

  function buildOrderedResults(items, results) {
    return items.map((item) => {
      const result = results[item.key] || createEmptyResult(item);
      return {
        key: item.key,
        category: item.exportLabel,
        label: item.exportLabel,
        groupLabel: item.groupLabel,
        subgroupLabel: item.subgroupLabel,
        theme: item.theme,
        inboundCount: result.inboundCount || 0,
        stdTotalCount: result.stdTotalCount || 0,
        stdPassCount: result.stdPassCount || 0,
        stdRejectCount: result.stdRejectCount || 0,
        stdRejectRate: result.stdRejectRate || 0,
        qcTotalCount: result.qcTotalCount || 0,
        qcPassCount: result.qcPassCount || 0,
        qcRejectCount: result.qcRejectCount || 0,
        qcRejectRate: result.qcRejectRate || 0
      };
    });
  }

  function buildDailyReportRows(dateList, items, resultsByDate) {
    return dateList.map((date) => {
      return {
        date,
        results: buildOrderedResults(items, resultsByDate && resultsByDate[date] ? resultsByDate[date] : {})
      };
    });
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

  function formatShortDateToken(dateString) {
    const [year, month, day] = String(dateString || '').split('-').map((part) => Number(part));
    if (!year || !month || !day) {
      return '';
    }
    return `${month}.${day}`;
  }

  function sanitizeFilenamePart(value) {
    return normalizeText(value).replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function getReportFileToken(report) {
    const startDate = report.startDate || '';
    const endDate = report.endDate || startDate;
    const entries = getEntriesByKeys(report.itemKeys);
    const labels = entries.length
      ? entries.map((entry) => entry.label)
      : (Array.isArray(report && report.columns) ? report.columns.map((column) => sanitizeFilenamePart(column.label || column.exportLabel || '')) : []).filter(Boolean);
    const categoryToken = sanitizeFilenamePart(labels.join('、')) || '日报';
    const dateToken = startDate
      ? (startDate === endDate ? formatShortDateToken(startDate) : `${formatShortDateToken(startDate)}-${formatShortDateToken(endDate)}`)
      : formatShortDateToken(formatInputDate(new Date()));
    return sanitizeFilenamePart(`${categoryToken} ${dateToken}`) || `日报 ${dateToken}`;
  }

  function makeCellRef(column, row) {
    let index = column;
    let label = '';
    while (index > 0) {
      const remainder = (index - 1) % 26;
      label = String.fromCharCode(65 + remainder) + label;
      index = Math.floor((index - 1) / 26);
    }
    return `${label}${row}`;
  }

  function inlineCell(ref, value, styleId) {
    return `<c r="${ref}" s="${styleId}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
  }

  function numberCell(ref, value, styleId) {
    return `<c r="${ref}" s="${styleId}"><v>${value}</v></c>`;
  }

  function buildColumnsXml(columns) {
    const parts = ['<cols>'];
    const totalColumns = 1 + columns.length * METRIC_HEADERS.length;
    for (let index = 1; index <= totalColumns; index += 1) {
      const width = index === 1 ? 12 : (index - 2) % METRIC_HEADERS.length >= 4 ? 13 : 11;
      parts.push(`<col min="${index}" max="${index}" width="${width}" customWidth="1"/>`);
    }
    parts.push('</cols>');
    return parts.join('');
  }

  function getColumnStyleIds(theme) {
    if (theme === 'knowledge') {
      return { top: 2, sub: 3 };
    }
    if (theme === 'culture') {
      return { top: 6, sub: 7 };
    }
    return { top: 4, sub: 5 };
  }

  function buildWorksheetXml(report) {
    const columns = Array.isArray(report.columns) ? report.columns : [];
    const dateRows = Array.isArray(report.rows) ? report.rows : [];
    const rows = [];
    const merges = ['A1:A2'];

    const topRow = [inlineCell('A1', '时间', 1)];
    let column = 2;
    for (const item of columns) {
      const styleIds = getColumnStyleIds(item.theme);
      topRow.push(inlineCell(makeCellRef(column, 1), item.label, styleIds.top));
      merges.push(`${makeCellRef(column, 1)}:${makeCellRef(column + METRIC_HEADERS.length - 1, 1)}`);
      column += METRIC_HEADERS.length;
    }
    rows.push(`<row r="1" ht="24" customHeight="1">${topRow.join('')}</row>`);

    const secondRowCells = [inlineCell('A2', '', 1)];
    for (const item of columns) {
      const styleIds = getColumnStyleIds(item.theme);
      for (let index = 0; index < METRIC_HEADERS.length; index += 1) {
        const ref = makeCellRef(secondRowCells.length + 1, 2);
        secondRowCells.push(inlineCell(ref, METRIC_HEADERS[index], styleIds.sub));
      }
    }
    rows.push(`<row r="2" ht="22" customHeight="1">${secondRowCells.join('')}</row>`);

    dateRows.forEach((reportRow, rowIndex) => {
      const dataValues = [formatDisplayDate(reportRow.date)];
      for (const result of reportRow.results) {
        dataValues.push(
          result.inboundCount || 0,
          result.stdTotalCount || 0,
          result.stdPassCount || 0,
          result.stdRejectCount || 0,
          result.stdRejectRate || 0,
          result.qcTotalCount || 0,
          result.qcPassCount || 0,
          result.qcRejectCount || 0,
          result.qcRejectRate || 0
        );
      }
      const worksheetRowNumber = rowIndex + 3;
      const dataCells = dataValues.map((value, cellIndex) => {
        const ref = makeCellRef(cellIndex + 1, worksheetRowNumber);
        if (cellIndex === 0) {
          return inlineCell(ref, value, 8);
        }
        const metricIndex = (cellIndex - 1) % METRIC_HEADERS.length;
        if (metricIndex === 4 || metricIndex === 8) {
          return numberCell(ref, Number(value || 0), 10);
        }
        return numberCell(ref, Number(value || 0), 9);
      });
      rows.push(`<row r="${worksheetRowNumber}" ht="22" customHeight="1">${dataCells.join('')}</row>`);
    });

    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>',
      '<sheetFormatPr defaultRowHeight="20"/>',
      buildColumnsXml(columns),
      `<sheetData>${rows.join('')}</sheetData>`,
      `<mergeCells count="${merges.length}">${merges.map((ref) => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells>`,
      '</worksheet>'
    ].join('');
  }

  function buildWorkbookXml() {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
      '<sheets><sheet name="日报数据" sheetId="1" r:id="rId1"/></sheets>',
      '</workbook>'
    ].join('');
  }

  function buildWorkbookRelsXml() {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>',
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
      '</Relationships>'
    ].join('');
  }

  function buildRootRelsXml() {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
      '</Relationships>'
    ].join('');
  }

  function buildContentTypesXml() {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
      '<Default Extension="xml" ContentType="application/xml"/>',
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>',
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
      '</Types>'
    ].join('');
  }

  function buildStylesXml() {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
      '<fonts count="2">',
      '<font><sz val="11"/><color rgb="FF17212B"/><name val="Microsoft YaHei"/></font>',
      '<font><b/><sz val="11"/><color rgb="FF17212B"/><name val="Microsoft YaHei"/></font>',
      '</fonts>',
      '<fills count="8">',
      '<fill><patternFill patternType="none"/></fill>',
      '<fill><patternFill patternType="gray125"/></fill>',
      '<fill><patternFill patternType="solid"><fgColor rgb="FFF1E0"/><bgColor indexed="64"/></patternFill></fill>',
      '<fill><patternFill patternType="solid"><fgColor rgb="FFF8E9"/><bgColor indexed="64"/></patternFill></fill>',
      '<fill><patternFill patternType="solid"><fgColor rgb="FFDCEAF8"/><bgColor indexed="64"/></patternFill></fill>',
      '<fill><patternFill patternType="solid"><fgColor rgb="FFEEF5FC"/><bgColor indexed="64"/></patternFill></fill>',
      '<fill><patternFill patternType="solid"><fgColor rgb="FFF4DFD8"/><bgColor indexed="64"/></patternFill></fill>',
      '<fill><patternFill patternType="solid"><fgColor rgb="FFFBECE6"/><bgColor indexed="64"/></patternFill></fill>',
      '</fills>',
      '<borders count="2">',
      '<border><left/><right/><top/><bottom/><diagonal/></border>',
      '<border><left style="thin"><color rgb="FFD7E1EA"/></left><right style="thin"><color rgb="FFD7E1EA"/></right><top style="thin"><color rgb="FFD7E1EA"/></top><bottom style="thin"><color rgb="FFD7E1EA"/></bottom><diagonal/></border>',
      '</borders>',
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
      '<cellXfs count="11">',
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
      '<xf numFmtId="0" fontId="1" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
      '<xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>',
      '<xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
      '<xf numFmtId="0" fontId="1" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>',
      '<xf numFmtId="0" fontId="1" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
      '<xf numFmtId="0" fontId="1" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>',
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
      '<xf numFmtId="10" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
      '</cellXfs>',
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>',
      '</styleSheet>'
    ].join('');
  }

  function createCrc32Table() {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) {
        if ((value & 1) === 1) {
          value = 0xEDB88320 ^ (value >>> 1);
        } else {
          value >>>= 1;
        }
      }
      table[index] = value >>> 0;
    }
    return table;
  }

  const CRC32_TABLE = createCrc32Table();

  function crc32(bytes) {
    let value = 0xFFFFFFFF;
    for (let index = 0; index < bytes.length; index += 1) {
      value = CRC32_TABLE[(value ^ bytes[index]) & 0xFF] ^ (value >>> 8);
    }
    return (value ^ 0xFFFFFFFF) >>> 0;
  }

  function concatUint8Arrays(chunks) {
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  function writeUint16(view, offset, value) {
    view.setUint16(offset, value, true);
  }

  function writeUint32(view, offset, value) {
    view.setUint32(offset, value >>> 0, true);
  }

  function getDosTime(date) {
    return ((date.getHours() & 0x1F) << 11) | ((date.getMinutes() & 0x3F) << 5) | Math.floor(date.getSeconds() / 2);
  }

  function getDosDate(date) {
    return (((date.getFullYear() - 1980) & 0x7F) << 9) | (((date.getMonth() + 1) & 0x0F) << 5) | (date.getDate() & 0x1F);
  }

  class ZipBuilder {
    constructor() {
      this.encoder = new TextEncoder();
      this.files = [];
    }

    addText(path, content) {
      this.addBinary(path, this.encoder.encode(content));
    }

    addBinary(path, content) {
      this.files.push({
        path,
        data: content instanceof Uint8Array ? content : new Uint8Array(content),
        modifiedAt: new Date()
      });
    }

    build() {
      const localChunks = [];
      const centralChunks = [];
      let offset = 0;

      for (const file of this.files) {
        const nameBytes = this.encoder.encode(file.path);
        const localHeader = new Uint8Array(30);
        const localView = new DataView(localHeader.buffer);
        const checksum = crc32(file.data);
        const dosTime = getDosTime(file.modifiedAt);
        const dosDate = getDosDate(file.modifiedAt);

        writeUint32(localView, 0, 0x04034b50);
        writeUint16(localView, 4, 20);
        writeUint16(localView, 6, 0);
        writeUint16(localView, 8, 0);
        writeUint16(localView, 10, dosTime);
        writeUint16(localView, 12, dosDate);
        writeUint32(localView, 14, checksum);
        writeUint32(localView, 18, file.data.length);
        writeUint32(localView, 22, file.data.length);
        writeUint16(localView, 26, nameBytes.length);
        writeUint16(localView, 28, 0);

        localChunks.push(localHeader, nameBytes, file.data);

        const centralHeader = new Uint8Array(46);
        const centralView = new DataView(centralHeader.buffer);
        writeUint32(centralView, 0, 0x02014b50);
        writeUint16(centralView, 4, 20);
        writeUint16(centralView, 6, 20);
        writeUint16(centralView, 8, 0);
        writeUint16(centralView, 10, 0);
        writeUint16(centralView, 12, dosTime);
        writeUint16(centralView, 14, dosDate);
        writeUint32(centralView, 16, checksum);
        writeUint32(centralView, 20, file.data.length);
        writeUint32(centralView, 24, file.data.length);
        writeUint16(centralView, 28, nameBytes.length);
        writeUint16(centralView, 30, 0);
        writeUint16(centralView, 32, 0);
        writeUint16(centralView, 34, 0);
        writeUint16(centralView, 36, 0);
        writeUint32(centralView, 38, 0);
        writeUint32(centralView, 42, offset);

        centralChunks.push(centralHeader, nameBytes);
        offset += localHeader.length + nameBytes.length + file.data.length;
      }

      const centralDirectory = concatUint8Arrays(centralChunks);
      const localDirectory = concatUint8Arrays(localChunks);

      const endHeader = new Uint8Array(22);
      const endView = new DataView(endHeader.buffer);
      writeUint32(endView, 0, 0x06054b50);
      writeUint16(endView, 4, 0);
      writeUint16(endView, 6, 0);
      writeUint16(endView, 8, this.files.length);
      writeUint16(endView, 10, this.files.length);
      writeUint32(endView, 12, centralDirectory.length);
      writeUint32(endView, 16, localDirectory.length);
      writeUint16(endView, 20, 0);

      return new Blob([localDirectory, centralDirectory, endHeader], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    }
  }

  function buildXlsxBlob(report) {
    const zip = new ZipBuilder();
    zip.addText('[Content_Types].xml', buildContentTypesXml());
    zip.addText('_rels/.rels', buildRootRelsXml());
    zip.addText('xl/workbook.xml', buildWorkbookXml());
    zip.addText('xl/_rels/workbook.xml.rels', buildWorkbookRelsXml());
    zip.addText('xl/styles.xml', buildStylesXml());
    zip.addText('xl/worksheets/sheet1.xml', buildWorksheetXml(report));
    return zip.build();
  }

  function downloadReport(report) {
    const blob = buildXlsxBlob(report);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${getReportFileToken(report)}.xlsx`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function createDefaultWorkbenchSettings() {
    const yesterday = getYesterdayDateString();
    return {
      version: 1,
      ui: {
        panelMinimized: true,
        activeModule: 'secondaryQc'
      },
      daily: {
        startDate: yesterday,
        endDate: '',
        groupIds: []
      },
      secondaryQc: {
        startDate: '',
        endDate: '',
        groupIds: [],
        targetCount: 10
      },
      secrets: {
        dashscopeApiKey: ''
      }
    };
  }

  function normalizeDateInputValue(value, maxDateString) {
    const maxDate = normalizeText(maxDateString) || getYesterdayDateString();
    const date = normalizeText(value);
    if (!date) {
      return '';
    }
    return date > maxDate ? maxDate : date;
  }

  function normalizePositiveInteger(value, fallbackValue, minValue, maxValue) {
    const numberValue = Math.trunc(Number(value));
    if (!Number.isFinite(numberValue) || numberValue < (minValue || 1)) {
      return fallbackValue;
    }
    if (maxValue && numberValue > maxValue) {
      return maxValue;
    }
    return numberValue;
  }

  function normalizeActiveModule(value) {
    return value === 'daily' ? 'daily' : 'secondaryQc';
  }

  function normalizeWorkbenchSettings(rawSettings) {
    const defaults = createDefaultWorkbenchSettings();
    if (!rawSettings || typeof rawSettings !== 'object' || rawSettings.version !== defaults.version) {
      return defaults;
    }
    if (
      !rawSettings.ui
      || typeof rawSettings.ui !== 'object'
      || !rawSettings.daily
      || typeof rawSettings.daily !== 'object'
      || !rawSettings.secondaryQc
      || typeof rawSettings.secondaryQc !== 'object'
      || !rawSettings.secrets
      || typeof rawSettings.secrets !== 'object'
    ) {
      return defaults;
    }
    const source = rawSettings;
    const dailyMaxDate = getYesterdayDateString();
    const secondaryQcMaxDate = getTodayDateString();

    const dailyStartDate = normalizeDateInputValue(source.daily && source.daily.startDate, dailyMaxDate) || defaults.daily.startDate;
    let dailyEndDate = normalizeDateInputValue(source.daily && source.daily.endDate, dailyMaxDate);
    if (dailyEndDate && dailyEndDate < dailyStartDate) {
      dailyEndDate = '';
    }

    const qcStartDate = normalizeDateInputValue(source.secondaryQc && source.secondaryQc.startDate, secondaryQcMaxDate) || defaults.secondaryQc.startDate;
    let qcEndDate = normalizeDateInputValue(source.secondaryQc && source.secondaryQc.endDate, secondaryQcMaxDate);
    if (qcEndDate && qcEndDate < qcStartDate) {
      qcEndDate = '';
    }

    return {
      version: defaults.version,
      ui: {
        panelMinimized: source.ui && source.ui.panelMinimized !== undefined
          ? Boolean(source.ui.panelMinimized)
          : defaults.ui.panelMinimized,
        activeModule: normalizeActiveModule(source.ui && source.ui.activeModule)
      },
      daily: {
        startDate: dailyStartDate,
        endDate: dailyEndDate,
        groupIds: normalizeSelectedGroupIds(source.daily && source.daily.groupIds)
      },
      secondaryQc: {
        startDate: qcStartDate,
        endDate: qcEndDate,
        groupIds: normalizeSelectedGroupIds(source.secondaryQc && source.secondaryQc.groupIds),
        targetCount: normalizePositiveInteger(
          source.secondaryQc && source.secondaryQc.targetCount,
          defaults.secondaryQc.targetCount,
          1,
          999
        )
      },
      secrets: {
        dashscopeApiKey: normalizeText(source.secrets && source.secrets.dashscopeApiKey)
      }
    };
  }

  function cloneWorkbenchSettings(settings) {
    return normalizeWorkbenchSettings(JSON.parse(JSON.stringify(settings || createDefaultWorkbenchSettings())));
  }

  function buildWorkbookXmlNamed(sheetName) {
    const safeSheetName = normalizeText(sheetName).slice(0, 31) || 'Sheet1';
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
      `<sheets><sheet name="${escapeXml(safeSheetName)}" sheetId="1" r:id="rId1"/></sheets>`,
      '</workbook>'
    ].join('');
  }

  function buildFlatTableStylesXml() {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
      '<fonts count="2">',
      '<font><sz val="11"/><color rgb="FF1E293B"/><name val="Microsoft YaHei"/></font>',
      '<font><b/><sz val="11"/><color rgb="FF102A43"/><name val="Microsoft YaHei"/></font>',
      '</fonts>',
      '<fills count="3">',
      '<fill><patternFill patternType="none"/></fill>',
      '<fill><patternFill patternType="gray125"/></fill>',
      '<fill><patternFill patternType="solid"><fgColor rgb="FFE7EEF6"/><bgColor indexed="64"/></patternFill></fill>',
      '</fills>',
      '<borders count="2">',
      '<border><left/><right/><top/><bottom/><diagonal/></border>',
      '<border>',
      '<left style="thin"><color rgb="FFD4DEE8"/></left>',
      '<right style="thin"><color rgb="FFD4DEE8"/></right>',
      '<top style="thin"><color rgb="FFD4DEE8"/></top>',
      '<bottom style="thin"><color rgb="FFD4DEE8"/></bottom>',
      '<diagonal/>',
      '</border>',
      '</borders>',
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
      '<cellXfs count="3">',
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>',
      '</cellXfs>',
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>',
      '</styleSheet>'
    ].join('');
  }

  function buildFlatTableWorksheetXml(definition) {
    const columns = Array.isArray(definition && definition.columns) ? definition.columns : [];
    const rows = Array.isArray(definition && definition.rows) ? definition.rows : [];
    const columnXml = ['<cols>'];
    columns.forEach((column, index) => {
      const width = Number(column && column.width) || 18;
      columnXml.push(`<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`);
    });
    columnXml.push('</cols>');

    const rowXml = [];
    const headerCells = columns.map((column, index) => {
      return inlineCell(makeCellRef(index + 1, 1), column.label || column.key || '', 1);
    });
    rowXml.push(`<row r="1" ht="24" customHeight="1">${headerCells.join('')}</row>`);

    rows.forEach((record, rowIndex) => {
      const cellXml = columns.map((column, columnIndex) => {
        const rawValue = record && Object.prototype.hasOwnProperty.call(record, column.key)
          ? record[column.key]
          : '';
        return inlineCell(makeCellRef(columnIndex + 1, rowIndex + 2), rawValue === null || rawValue === undefined ? '' : String(rawValue), 2);
      });
      rowXml.push(`<row r="${rowIndex + 2}" ht="22" customHeight="1">${cellXml.join('')}</row>`);
    });

    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>',
      '<sheetFormatPr defaultRowHeight="20"/>',
      columnXml.join(''),
      `<sheetData>${rowXml.join('')}</sheetData>`,
      '</worksheet>'
    ].join('');
  }

  function buildFlatTableXlsxBlob(definition) {
    const zip = new ZipBuilder();
    zip.addText('[Content_Types].xml', buildContentTypesXml());
    zip.addText('_rels/.rels', buildRootRelsXml());
    zip.addText('xl/workbook.xml', buildWorkbookXmlNamed(definition && definition.sheetName ? definition.sheetName : 'Sheet1'));
    zip.addText('xl/_rels/workbook.xml.rels', buildWorkbookRelsXml());
    zip.addText('xl/styles.xml', buildFlatTableStylesXml());
    zip.addText('xl/worksheets/sheet1.xml', buildFlatTableWorksheetXml(definition));
    return zip.build();
  }

  function downloadFlatTableReport(definition, filename) {
    const blob = buildFlatTableXlsxBlob(definition);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${sanitizeFilenamePart(filename || '结果') || '结果'}.xlsx`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function createRuntimeToken(prefix) {
    return `${prefix || 'ysp'}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  function buildSecondaryQcWorkerRequestKey(requestId) {
    return `${STORAGE_KEYS.secondaryQcWorkerRequestPrefix}${requestId}`;
  }

  function buildSecondaryQcWorkerResponseKey(requestId) {
    return `${STORAGE_KEYS.secondaryQcWorkerResponsePrefix}${requestId}`;
  }

  function buildSecondaryQcWorkerProgressKey(requestId) {
    return `${STORAGE_KEYS.secondaryQcWorkerProgressPrefix}${requestId}`;
  }

  function buildSecondaryQcWorkerStopKey(requestId) {
    return `${STORAGE_KEYS.secondaryQcWorkerStopPrefix}${requestId}`;
  }

  function buildSecondaryQcMediaWorkerRequestKey(requestId) {
    return `${STORAGE_KEYS.secondaryQcMediaWorkerRequestPrefix}${requestId}`;
  }

  function buildSecondaryQcMediaWorkerResponseKey(requestId) {
    return `${STORAGE_KEYS.secondaryQcMediaWorkerResponsePrefix}${requestId}`;
  }

  function getSecondaryQcWorkerRequestIdFromLocation() {
    const params = new URLSearchParams(location.search);
    return normalizeText(params.get('ysp_qc_request'));
  }

  function getSecondaryQcMediaWorkerRequestIdFromLocation() {
    const params = new URLSearchParams(location.search);
    return normalizeText(params.get('ysp_media_request'));
  }

  async function updateSecondaryQcWorkerProgress(requestId, text) {
    const normalizedRequestId = normalizeText(requestId);
    const normalizedText = normalizeText(text);
    if (!normalizedRequestId || !normalizedText) {
      return;
    }
    await storageSetCached({
      [buildSecondaryQcWorkerProgressKey(normalizedRequestId)]: {
        requestId: normalizedRequestId,
        text: normalizedText,
        updatedAt: new Date().toISOString()
      }
    });
  }

  async function clearSecondaryQcWorkerActiveRequest(requestId) {
    const normalizedRequestId = normalizeText(requestId);
    if (!normalizedRequestId) {
      return;
    }
    const state = await storageGet(STORAGE_KEYS.secondaryQcWorkerActiveRequest);
    const activeRequestId = normalizeText(state[STORAGE_KEYS.secondaryQcWorkerActiveRequest]);
    if (!activeRequestId || activeRequestId !== normalizedRequestId) {
      return;
    }
    await storageRemove(STORAGE_KEYS.secondaryQcWorkerActiveRequest);
  }

  async function requestSecondaryQcWorkerStop(requestId) {
    const normalizedRequestId = normalizeText(requestId);
    if (!normalizedRequestId) {
      return;
    }
    await storageSetCached({
      [buildSecondaryQcWorkerStopKey(normalizedRequestId)]: {
        requestId: normalizedRequestId,
        stoppedAt: new Date().toISOString()
      }
    });
  }

  async function clearSecondaryQcWorkerStopSignal(requestId) {
    const normalizedRequestId = normalizeText(requestId);
    if (!normalizedRequestId) {
      return;
    }
    await storageRemove(buildSecondaryQcWorkerStopKey(normalizedRequestId));
  }

  async function syncSecondaryQcWorkerStopState(requestId) {
    const normalizedRequestId = normalizeText(requestId);
    if (!normalizedRequestId) {
      return false;
    }
    const state = await storageGet(buildSecondaryQcWorkerStopKey(normalizedRequestId));
    const stopSignal = state[buildSecondaryQcWorkerStopKey(normalizedRequestId)];
    const stopped = Boolean(stopSignal && typeof stopSignal === 'object');
    JOB_ABORT_CONTROLLER.secondaryQcWorkerStopped = stopped;
    return stopped;
  }

  function stopSecondaryQcWorkerAbortWatcher() {
    if (JOB_ABORT_CONTROLLER.secondaryQcWorkerStopWatcher) {
      window.clearInterval(JOB_ABORT_CONTROLLER.secondaryQcWorkerStopWatcher);
      JOB_ABORT_CONTROLLER.secondaryQcWorkerStopWatcher = 0;
    }
    JOB_ABORT_CONTROLLER.secondaryQcWorkerStopped = false;
    JOB_ABORT_CONTROLLER.secondaryQcWorkerRequestId = '';
  }

  function startSecondaryQcWorkerAbortWatcher(requestId) {
    stopSecondaryQcWorkerAbortWatcher();
    const normalizedRequestId = normalizeText(requestId);
    if (!normalizedRequestId) {
      return;
    }
    JOB_ABORT_CONTROLLER.secondaryQcWorkerRequestId = normalizedRequestId;
    JOB_ABORT_CONTROLLER.secondaryQcWorkerStopWatcher = window.setInterval(() => {
      syncSecondaryQcWorkerStopState(normalizedRequestId).catch(() => undefined);
    }, 250);
  }

  async function ensureSecondaryQcWorkerNotStopped(requestId) {
    if (JOB_ABORT_CONTROLLER.secondaryQcWorkerRequestId === normalizeText(requestId) && JOB_ABORT_CONTROLLER.secondaryQcWorkerStopped) {
      throw new Error('采集已结束');
    }
    if (await syncSecondaryQcWorkerStopState(requestId)) {
      throw new Error('采集已结束');
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

  function formatProblemText(missingTags, wrongTags) {
    const parts = [];
    const missing = uniqueTextList(missingTags).map(normalizeTagDisplayName);
    const wrong = uniqueTextList(wrongTags).map(normalizeTagDisplayName);
    if (missing.length) {
      parts.push(`补打${missing.join('、')}`);
    }
    if (wrong.length) {
      parts.push(`错打${wrong.join('、')}`);
    }
    return parts.join(' ');
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

  function parseUserBadgeName(text) {
    return normalizeText(String(text || '').replace(/，?\s*退出.*/, ''));
  }

  function getCurrentLoginName() {
    const container = document.querySelector('.user-info, .right-menu .user-info, .right-menu-item');
    return parseUserBadgeName(container ? container.textContent : '');
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

  function createSecondaryQcExportRows(records) {
    const rows = Array.isArray(records) ? records.slice() : [];
    const totalMinutes = (17 * 60 + 30) - (9 * 60 + 30);
    const generatedMinutes = [];
    while (generatedMinutes.length < rows.length) {
      const candidate = 9 * 60 + 30 + Math.floor(Math.random() * (totalMinutes + 1));
      generatedMinutes.push(candidate);
    }
    generatedMinutes.sort((left, right) => left - right);
    return rows.map((row, index) => {
      const minutes = generatedMinutes[index];
      const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
      const mm = String(minutes % 60).padStart(2, '0');
      return {
        vid: row.vid || '',
        time: `${hh}:${mm}`,
        problem: row.problem || '',
        standardOperator: row.standardOperator || '',
        qcOperator: row.qcOperator || ''
      };
    });
  }

  function exportSecondaryQcReport(report) {
    const rows = Array.isArray(report && report.rows) ? report.rows : [];
    downloadFlatTableReport(
      {
        sheetName: '二次质检',
        columns: [
          { key: 'vid', label: 'vid', width: 16 },
          { key: 'time', label: '时间', width: 12 },
          { key: 'problem', label: '问题', width: 34 },
          { key: 'standardOperator', label: '标准化操作人', width: 18 },
          { key: 'qcOperator', label: '质检人', width: 16 }
        ],
        rows
      },
      report && report.fileName
        ? report.fileName
        : `二次质检 ${formatReportPeriod(report || {}) || formatInputDate(new Date())}`
    );
  }

  function extractFirstJsonObject(text) {
    const source = normalizeText(text);
    if (!source) {
      throw new Error('模型未返回内容');
    }
    const fenceMatch = source.match(/```json\s*([\s\S]*?)```/i) || source.match(/```\s*([\s\S]*?)```/i);
    const raw = fenceMatch ? fenceMatch[1].trim() : source;
    const firstBrace = raw.indexOf('{');
    if (firstBrace < 0) {
      throw new Error('模型返回中没有 JSON');
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
    throw new Error('模型 JSON 不完整');
  }

  function extractMessageTextFromOpenAIContent(content) {
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (!item) {
            return '';
          }
          if (typeof item === 'string') {
            return item;
          }
          if (typeof item.text === 'string') {
            return item.text;
          }
          return '';
        })
        .join('');
    }
    return '';
  }

  function extractTextFromDashscopeStream(responseText) {
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
      if (parsed.error && parsed.error.message) {
        errorMessage = parsed.error.message;
        break;
      }
      const choice = Array.isArray(parsed.choices) && parsed.choices.length ? parsed.choices[0] : null;
      if (!choice || !choice.delta) {
        continue;
      }
      const deltaContent = choice.delta.content;
      if (typeof deltaContent === 'string') {
        content += deltaContent;
        continue;
      }
      if (Array.isArray(deltaContent)) {
        content += deltaContent
          .map((item) => (item && typeof item.text === 'string' ? item.text : ''))
          .join('');
      }
    }
    if (errorMessage) {
      throw new Error(errorMessage);
    }
    return normalizeText(content);
  }

  function extractTextFromDashscopeJson(responseText) {
    const parsed = JSON.parse(responseText);
    if (parsed.error && parsed.error.message) {
      throw new Error(parsed.error.message);
    }
    const choice = Array.isArray(parsed.choices) && parsed.choices.length ? parsed.choices[0] : null;
    const message = choice && choice.message ? choice.message : null;
    const content = extractMessageTextFromOpenAIContent(message && message.content);
    return normalizeText(content);
  }

  function gmXmlhttpRequestPromise(options) {
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

  async function requestDashscopeText(apiKey, payload, isStream, cancelCheck) {
    const response = await gmXmlhttpRequestPromise({
      method: 'POST',
      url: DASHSCOPE_CHAT_URL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(payload),
      timeout: DASHSCOPE_REQUEST_TIMEOUT,
      cancelCheck
    });
    if (!response || response.status >= 400) {
      throw new Error(`模型请求失败：${response ? response.status : '未知状态'}`);
    }
    return isStream
      ? extractTextFromDashscopeStream(response.responseText || '')
      : extractTextFromDashscopeJson(response.responseText || '');
  }

  async function requestOmniVideoSummary(apiKey, videoUrl, promptText, cancelCheck) {
    const payload = {
      model: 'qwen3.5-omni-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'video_url',
              video_url: {
                url: videoUrl,
                fps: SECONDARY_QC_VIDEO_ANALYSIS_FPS,
                max_pixels: SECONDARY_QC_VIDEO_ANALYSIS_MAX_PIXELS
              }
            },
            {
              type: 'text',
              text: promptText
            }
          ]
        }
      ],
      stream: true,
      stream_options: {
        include_usage: true
      },
      modalities: ['text']
    };
    return requestDashscopeText(apiKey, payload, true, cancelCheck);
  }

  async function requestTagJudge(apiKey, promptText, cancelCheck) {
    const payload = {
      model: 'qwen3.6-plus',
      messages: [
        {
          role: 'user',
          content: promptText
        }
      ]
    };
    return requestDashscopeText(apiKey, payload, false, cancelCheck);
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
        qcStatus: fields['质检状态'] || ''
      };
    });
  }

  async function waitForDetailPageReady(cancelCheck) {
    await waitFor(() => {
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
        throw new Error('采集已结束');
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

  function getDetailTagSearchInput() {
    const field = getDetailFinishedTagsField();
    return field ? field.querySelector('.el-select__input') : null;
  }

  function getVisibleTagDropdown() {
    return Array.from(document.querySelectorAll('.el-select-dropdown, .el-popper'))
      .find((dropdown) => {
        return isVisible(dropdown) && dropdown.querySelector('.el-select-dropdown__item');
      }) || null;
  }

  async function searchAvailableTagOptions(keyword, cancelCheck) {
    const input = getDetailTagSearchInput();
    if (!input) {
      throw new Error('未找到成品标签输入框');
    }
    input.focus();
    setNativeInputValue(input, keyword);
    await sleep(250);
    const dropdown = await waitFor(() => getVisibleTagDropdown(), 3000, `未收到标签检索结果：${keyword}`, { cancelCheck });
    const options = normalizeTagDetailArray(
      Array.from(dropdown.querySelectorAll('.el-select-dropdown__item'))
        .filter(isVisible)
        .map((item) => extractTagDetailFromElement(item))
    );
    setNativeInputValue(input, '');
    input.blur();
    document.body.dispatchEvent(createMouseEvent('click'));
    return options;
  }

  async function clickDetailExitButton() {
    const button = findButtonByText('退出任务操作');
    if (!button) {
      throw new Error('未找到退出任务操作按钮');
    }
    triggerMouseClick(button);
    await sleep(600);
  }

  function createWorkerBadgeState() {
    return {
      stageLabel: '准备中',
      statusText: '',
      taskId: '',
      videoVid: '',
      titleText: '',
      durationSeconds: 0,
      evidenceSummary: '',
      videoSummary: '',
      missingCandidates: [],
      validatedCandidates: [],
      rejectedCandidates: [],
      wrongTags: [],
      finalReason: '',
      problemText: '',
      skipReason: '',
      timeline: []
    };
  }

  function mergeWorkerBadgeState(state, patch) {
    const target = state || createWorkerBadgeState();
    if (!patch || typeof patch !== 'object') {
      return target;
    }
    const keys = [
      'stageLabel',
      'statusText',
      'taskId',
      'videoVid',
      'titleText',
      'durationSeconds',
      'evidenceSummary',
      'videoSummary',
      'finalReason',
      'problemText',
      'skipReason'
    ];
    keys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(patch, key)) {
        target[key] = patch[key];
      }
    });
    if (Object.prototype.hasOwnProperty.call(patch, 'missingCandidates')) {
      target.missingCandidates = normalizeTagArray(patch.missingCandidates);
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'validatedCandidates')) {
      target.validatedCandidates = Array.isArray(patch.validatedCandidates) ? patch.validatedCandidates : [];
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'rejectedCandidates')) {
      target.rejectedCandidates = Array.isArray(patch.rejectedCandidates) ? patch.rejectedCandidates : [];
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'wrongTags')) {
      target.wrongTags = normalizeTagArray(patch.wrongTags);
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'timeline')) {
      target.timeline = Array.isArray(patch.timeline) ? patch.timeline.slice(0, 8) : [];
    }
    return target;
  }

  function pushWorkerBadgeTimeline(state, text) {
    const entry = normalizeText(text);
    if (!entry) {
      return;
    }
    if (state.timeline[0] === entry) {
      return;
    }
    state.timeline.unshift(entry);
    state.timeline = state.timeline.slice(0, 8);
  }

  function renderWorkerBadgeCandidateList(items, emptyText) {
    if (!Array.isArray(items) || !items.length) {
      return `<div class="ysp-daily-worker-badge__empty">${escapeXml(emptyText)}</div>`;
    }
    return `
      <div class="ysp-daily-worker-badge__list">
        ${items.map((item) => {
          const options = normalizeTagDetailArray(item && item.options).map((option) => formatTagDetailForDisplay(option));
          const accepted = item && item.accepted === true;
          const rejected = item && item.accepted === false;
          const badgeClass = accepted ? 'is-accepted' : rejected ? 'is-rejected' : '';
          const badgeText = accepted ? '采纳' : rejected ? '放弃' : '待判定';
          const reason = normalizeText(item && item.reason);
          const searchReason = normalizeText(item && item.searchReason);
          const matchedOption = formatTagDetailForDisplay(item && item.matchedOption);
          return `
            <div class="ysp-daily-worker-badge__item">
              <div class="ysp-daily-worker-badge__item-title">
                <span class="ysp-daily-worker-badge__item-label">${escapeXml(normalizeText(item && item.keyword) || '未命名候选')}</span>
                <span class="ysp-daily-worker-badge__item-badge ${badgeClass}">${badgeText}</span>
              </div>
              <div>${escapeXml(reason || '暂无说明')}</div>
              ${searchReason ? `<div class="ysp-daily-worker-badge__item-subtext">发起搜索：${escapeXml(searchReason)}</div>` : ''}
              <div class="ysp-daily-worker-badge__item-subtext">搜索结果：${escapeXml(options.join('；') || '页面无结果')}</div>
              ${matchedOption ? `<div class="ysp-daily-worker-badge__item-subtext">采纳结果：${escapeXml(matchedOption)}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderWorkerBadgeReasonList(items, emptyText) {
    if (!Array.isArray(items) || !items.length) {
      return `<div class="ysp-daily-worker-badge__empty">${escapeXml(emptyText)}</div>`;
    }
    return `
      <div class="ysp-daily-worker-badge__list">
        ${items.map((item) => `
          <div class="ysp-daily-worker-badge__item">
            <div class="ysp-daily-worker-badge__item-label">${escapeXml(normalizeText(item && item.keyword) || '未命名候选')}</div>
            <div class="ysp-daily-worker-badge__item-subtext">${escapeXml(normalizeText(item && item.reason) || '暂无说明')}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function mountWorkerBadge(stateOrText) {
    let badge = document.getElementById('ysp-daily-worker-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'ysp-daily-worker-badge';
      badge.className = 'ysp-daily-worker-badge';
      document.body.appendChild(badge);
    }
    const state = typeof stateOrText === 'string'
      ? mergeWorkerBadgeState(createWorkerBadgeState(), { statusText: stateOrText })
      : (stateOrText && typeof stateOrText === 'object' ? stateOrText : createWorkerBadgeState());
    const subtitleParts = [];
    if (state.taskId) {
      subtitleParts.push(`任务 ${state.taskId}`);
    }
    if (state.durationSeconds > 0) {
      subtitleParts.push(`时长 ${formatDurationSeconds(state.durationSeconds)}`);
    }
    badge.innerHTML = `
      <div class="ysp-daily-worker-badge__header">
        <div>
          <div class="ysp-daily-worker-badge__title">二次质检决策过程</div>
          <div class="ysp-daily-worker-badge__subtitle">${escapeXml(subtitleParts.join(' · ') || (state.statusText || '处理中'))}</div>
        </div>
        <div class="ysp-daily-worker-badge__stage">${escapeXml(state.stageLabel || '处理中')}</div>
      </div>
      <div class="ysp-daily-worker-badge__body">
        <section class="ysp-daily-worker-badge__section">
          <h3 class="ysp-daily-worker-badge__section-title">视频信息</h3>
          <dl class="ysp-daily-worker-badge__meta">
            <dt>任务 VID</dt>
            <dd>${escapeXml(state.taskId || '未识别')}</dd>
            <dt>顶部 VID</dt>
            <dd>${escapeXml(state.videoVid || '未识别')}</dd>
            <dt>标题</dt>
            <dd>${escapeXml(state.titleText || '未读取到标题')}</dd>
            <dt>时长</dt>
            <dd>${escapeXml(formatDurationSeconds(state.durationSeconds) || '未读取到')}</dd>
          </dl>
        </section>
        <section class="ysp-daily-worker-badge__section">
          <h3 class="ysp-daily-worker-badge__section-title">过程</h3>
          <div class="ysp-daily-worker-badge__timeline">
            ${(state.timeline.length ? state.timeline : [state.statusText || '处理中']).map((entry) => `
              <div class="ysp-daily-worker-badge__timeline-entry">${escapeXml(entry)}</div>
            `).join('')}
          </div>
        </section>
        <section class="ysp-daily-worker-badge__section">
          <h3 class="ysp-daily-worker-badge__section-title">证据摘要</h3>
          <div class="ysp-daily-worker-badge__text">${escapeXml(state.evidenceSummary || state.videoSummary || '模型证据尚未生成')}</div>
        </section>
        <section class="ysp-daily-worker-badge__section">
          <h3 class="ysp-daily-worker-badge__section-title">候选补打标签</h3>
          <div class="ysp-daily-worker-badge__text">${escapeXml(state.missingCandidates.join('、') || '当前没有候选补打标签')}</div>
        </section>
        <section class="ysp-daily-worker-badge__section">
          <h3 class="ysp-daily-worker-badge__section-title">搜索验证</h3>
          ${renderWorkerBadgeCandidateList(state.validatedCandidates, '候选标签尚未进入搜索验证')}
        </section>
        <section class="ysp-daily-worker-badge__section">
          <h3 class="ysp-daily-worker-badge__section-title">放弃候选</h3>
          ${renderWorkerBadgeReasonList(state.rejectedCandidates, '当前没有被放弃的候选')}
        </section>
        <section class="ysp-daily-worker-badge__section">
          <h3 class="ysp-daily-worker-badge__section-title">最终结论</h3>
          <div class="ysp-daily-worker-badge__final">
            <div class="ysp-daily-worker-badge__final-label">结论</div>
            <div class="ysp-daily-worker-badge__final-value">${escapeXml(
              state.skipReason === 'long_video'
                ? `长视频跳过（超过 ${formatDurationSeconds(MAX_SECONDARY_QC_VIDEO_DURATION_SECONDS)}）`
                : state.problemText || state.finalReason || '当前不需要落表'
            )}</div>
          </div>
          <div class="ysp-daily-worker-badge__text" style="margin-top: 10px;">${escapeXml(state.finalReason || '暂无最终说明')}</div>
          <div class="ysp-daily-worker-badge__text" style="margin-top: 8px;">错打标签：${escapeXml(state.wrongTags.join('、') || '无')}</div>
        </section>
      </div>
    `;
    return badge;
  }

  function unmountWorkerBadge() {
    const badge = document.getElementById('ysp-daily-worker-badge');
    if (badge) {
      badge.remove();
    }
  }

  function normalizeSecondaryQcDraftRow(row) {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const vid = normalizeText(row.vid);
    const problem = normalizeText(row.problem);
    const standardOperator = normalizeText(row.standardOperator);
    const qcOperator = normalizeText(row.qcOperator);
    const itemKey = normalizeText(row.itemKey);
    if (!vid) {
      return null;
    }
    return {
      vid,
      problem,
      standardOperator,
      qcOperator,
      itemKey
    };
  }

  function buildSecondaryQcItemTargetCounts(itemCount, targetCount) {
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

  function normalizeSecondaryQcItemTargetCounts(value, itemCount, targetCount) {
    if (!Array.isArray(value) || value.length !== itemCount) {
      return [];
    }
    const counts = value.map((count) => Math.max(0, Math.trunc(Number(count) || 0)));
    const total = counts.reduce((sum, count) => sum + count, 0);
    return total === targetCount ? counts : [];
  }

  function normalizeSecondaryQcItemRecordedCounts(value, itemKeys, itemTargetCounts, rows) {
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

  function normalizeSecondaryQcReport(report) {
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
            time: normalizeText(row.time),
            problem: normalizeText(row.problem),
            standardOperator: normalizeText(row.standardOperator),
            qcOperator: normalizeText(row.qcOperator)
          };
        })
        .filter(Boolean)
      : [];
    if (!startDate || !endDate || report.actualCount !== rows.length) {
      return null;
    }
    if (report.targetCount < report.actualCount) {
      return null;
    }
    return {
      ...report,
      version: 1,
      startDate,
      endDate,
      targetCount: report.targetCount,
      actualCount: report.actualCount,
      fileName: normalizeText(report.fileName),
      rows,
      generatedAt: report.generatedAt
    };
  }

  function normalizeSecondaryQcCheckpoint(checkpoint) {
    if (
      !checkpoint
      || typeof checkpoint !== 'object'
      || checkpoint.version !== 2
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
      ? checkpoint.rows.map(normalizeSecondaryQcDraftRow).filter(Boolean)
      : [];
    if (checkpoint.currentItemIndex < 0 || checkpoint.currentItemIndex > itemKeys.length || rows.length > targetCount) {
      return null;
    }
    const itemTargetCounts = normalizeSecondaryQcItemTargetCounts(checkpoint.itemTargetCounts, itemKeys.length, targetCount);
    const itemRecordedCounts = normalizeSecondaryQcItemRecordedCounts(checkpoint.itemRecordedCounts, itemKeys, itemTargetCounts, rows);
    if (!itemTargetCounts.length || !itemRecordedCounts.length) {
      return null;
    }
    if (!['running', 'paused', 'stopped', 'error'].includes(normalizeText(checkpoint.status))) {
      return null;
    }
    return {
      ...checkpoint,
      version: 2,
      startDate,
      endDate,
      groupIds,
      itemKeys,
      currentItemIndex: checkpoint.currentItemIndex,
      targetCount,
      itemTargetCounts,
      itemRecordedCounts,
      processedTaskIds: uniqueTextList(checkpoint.processedTaskIds),
      rows,
      qcOperator: normalizeText(checkpoint.qcOperator),
      status: normalizeText(checkpoint.status),
      statusText: normalizeText(checkpoint.statusText),
      summaryText: normalizeText(checkpoint.summaryText),
      logs: Array.isArray(checkpoint.logs) ? checkpoint.logs.slice(0, MAX_LOGS) : [],
      startedAt: checkpoint.startedAt,
      updatedAt: checkpoint.updatedAt
    };
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

  function buildValidatedCandidates(searchResults, candidateDecisions) {
    const decisionMap = new Map(
      normalizeCandidateDecisionArray(candidateDecisions).map((item) => [item.keyword, item])
    );
    return (Array.isArray(searchResults) ? searchResults : []).map((item) => {
      const keyword = normalizeTagDisplayName(item && item.keyword);
      const decision = decisionMap.get(keyword) || null;
      return {
        keyword,
        searchReason: normalizeText(item && item.reason),
        options: normalizeTagDetailArray(item && item.options),
        accepted: decision ? decision.accepted : null,
        reason: decision ? normalizeText(decision.reason) : '',
        matchedOption: decision ? normalizeTagDetail(decision.matchedOption) : null
      };
    }).filter((item) => item.keyword);
  }

  function prefixTaskError(taskId, message) {
    const normalizedTaskId = normalizeText(taskId);
    const normalizedMessage = normalizeText(message);
    if (!normalizedTaskId) {
      return normalizedMessage;
    }
    if (!normalizedMessage) {
      return normalizedTaskId;
    }
    return normalizedMessage.startsWith(`${normalizedTaskId}：`)
      ? normalizedMessage
      : `${normalizedTaskId}：${normalizedMessage}`;
  }

  async function waitForSecondaryQcWorkerResponse(requestId, timeoutMs, onProgress, cancelCheck) {
    const responseKey = buildSecondaryQcWorkerResponseKey(requestId);
    const progressKey = buildSecondaryQcWorkerProgressKey(requestId);
    const startedAt = Date.now();
    let lastProgressToken = '';
    let lastActiveAt = startedAt;
    let hasProgress = false;
    while (Date.now() - startedAt < timeoutMs) {
      if (cancelCheck && cancelCheck()) {
        throw new Error('采集已结束');
      }
      const storage = await storageGet([responseKey, progressKey]);
      const progress = storage[progressKey];
      if (progress && typeof progress === 'object') {
        const progressToken = normalizeText(progress.updatedAt) || normalizeText(progress.text);
        if (progressToken && progressToken !== lastProgressToken) {
          lastProgressToken = progressToken;
          hasProgress = true;
          lastActiveAt = Date.now();
          if (typeof onProgress === 'function') {
            try {
              onProgress(progress);
            } catch (error) {
              // ignore progress callback errors
            }
          }
        }
      }
      const response = storage[responseKey];
      if (response && typeof response === 'object') {
        return response;
      }
      const now = Date.now();
      if (!hasProgress && now - startedAt >= WORKER_START_TIMEOUT) {
        throw new Error('详情页未启动，可能被浏览器拦截或新标签页没有打开');
      }
      if (hasProgress && now - lastActiveAt >= WORKER_PROGRESS_STALL_TIMEOUT) {
        throw new Error('详情页处理卡住，已超时跳过');
      }
      await sleep(800);
    }
    throw new Error('等待详情页结果超时');
  }

  async function waitForSecondaryQcMediaWorkerResponse(requestId, timeoutMs, cancelCheck) {
    const responseKey = buildSecondaryQcMediaWorkerResponseKey(requestId);
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (cancelCheck && cancelCheck()) {
        throw new Error('采集已结束');
      }
      const storage = await storageGet(responseKey);
      const response = storage[responseKey];
      if (response && typeof response === 'object') {
        return response;
      }
      await sleep(400);
    }
    throw new Error('等待视频地址结果超时');
  }

  function createYangshipinGuid() {
    return `${Date.now().toString(36)}_${Math.random().toString(36).replace(/^0\./, '')}`;
  }

  function getYangshipinGuid() {
    if (yangshipinGuidCache) {
      return yangshipinGuidCache;
    }
    yangshipinGuidCache = createYangshipinGuid();
    return yangshipinGuidCache;
  }

  function createYangshipinCKeyRuntime() {
    const href = 'https://www.yangshipin.cn/#/video/home';
    const locationObject = {
      href,
      host: 'www.yangshipin.cn',
      hostname: 'www.yangshipin.cn',
      protocol: 'https:',
      pathname: '/',
      hash: '#/video/home',
      search: '',
      port: ''
    };
    const navigatorObject = {
      appName: 'Netscape',
      appCodeName: 'Mozilla',
      platform: 'Win32',
      userAgent: navigator.userAgent
    };
    const documentObject = {
      URL: href,
      referrer: '',
      currentScript: {
        src: 'https://www.yangshipin.cn/js/app.4160532d.js'
      },
      createElement() {
        return {
          setAttribute() {},
          pathname: '/',
          href,
          hostname: 'www.yangshipin.cn',
          hash: '#/video/home',
          host: 'www.yangshipin.cn',
          search: '',
          port: '',
          protocol: 'https:'
        };
      }
    };
    const windowObject = {
      location: locationObject,
      navigator: navigatorObject,
      document: documentObject,
      yspLogin: {
        default: {}
      }
    };
    return {
      windowObject,
      documentObject,
      navigatorObject,
      locationObject
    };
  }

  function getYangshipinSdtfrom() {
    const ua = navigator.userAgent.toLowerCase();
    if (/ipad/i.test(ua)) {
      return 213;
    }
    if (/ios|iphone/i.test(ua)) {
      return 113;
    }
    if (/android/i.test(ua)) {
      return 313;
    }
    return YANGSHIPIN_PLAYER_PLATFORM;
  }

  function parseYangshipinJsonpResponse(responseText) {
    const normalized = normalizeText(responseText);
    if (!normalized) {
      throw new Error('央视频接口返回为空');
    }
    const wrappedJsonMatch = normalized.match(/^\(([\s\S]+)\)$/);
    const directJson = wrappedJsonMatch ? wrappedJsonMatch[1] : normalized.replace(/;$/, '');
    return JSON.parse(directJson);
  }

  async function loadYangshipinCKeyGenerator(cancelCheck) {
    if (yangshipinCKeyGeneratorPromise) {
      return yangshipinCKeyGeneratorPromise;
    }
    yangshipinCKeyGeneratorPromise = (async () => {
      const response = await gmXmlhttpRequestPromise({
        method: 'GET',
        url: YANGSHIPIN_PLAYER_BUNDLE_URL,
        cancelCheck
      });
      const scriptText = String((response && response.responseText) || '');
      const startToken = 'UHXV:function(e,t){';
      const endToken = '},\"UN+X\":function';
      const startIndex = scriptText.indexOf(startToken);
      const endIndex = startIndex >= 0 ? scriptText.indexOf(endToken, startIndex) : -1;
      if (startIndex < 0 || endIndex < 0) {
        throw new Error('未找到央视频 cKey 生成器');
      }
      const moduleBody = scriptText.slice(startIndex + startToken.length, endIndex);
      const module = { exports: null };
      const runtime = createYangshipinCKeyRuntime();
      const factory = new Function(
        'e',
        't',
        'window',
        'document',
        'navigator',
        'location',
        'opener',
        moduleBody
      );
      factory(
        module,
        module.exports,
        runtime.windowObject,
        runtime.documentObject,
        runtime.navigatorObject,
        runtime.locationObject,
        null
      );
      if (typeof module.exports !== 'function') {
        throw new Error('央视频 cKey 生成器不可用');
      }
      return module.exports;
    })().catch((error) => {
      yangshipinCKeyGeneratorPromise = null;
      throw error;
    });
    return yangshipinCKeyGeneratorPromise;
  }

  async function buildYangshipinVideoInfoParams(videoVid, svrtick, cancelCheck) {
    const guid = getYangshipinGuid();
    const cKeyGenerator = await loadYangshipinCKeyGenerator(cancelCheck);
    const resolvedSvrtick = normalizeText(svrtick) || String(Math.floor(Date.now() / 1000));
    return {
      guid,
      platform: YANGSHIPIN_PLAYER_PLATFORM,
      vid: videoVid,
      charge: 0,
      defaultfmt: 'auto',
      otype: 'json',
      defnpayver: 1,
      appVer: YANGSHIPIN_PLAYER_APP_VERSION,
      sphttps: 1,
      sphls: 1,
      spwm: 4,
      dtype: 3,
      defsrc: 2,
      encryptVer: 8.1,
      sdtfrom: getYangshipinSdtfrom(),
      cKey: cKeyGenerator(videoVid, resolvedSvrtick, YANGSHIPIN_PLAYER_APP_VERSION, guid, YANGSHIPIN_PLAYER_PLATFORM)
    };
  }

  async function requestYangshipinVideoInfo(videoVid, svrtick, cancelCheck) {
    const params = await buildYangshipinVideoInfoParams(videoVid, svrtick, cancelCheck);
    const url = `${YANGSHIPIN_VIDEO_INFO_URL}?${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]))}`;
    const response = await gmXmlhttpRequestPromise({
      method: 'GET',
      url,
      cancelCheck
    });
    return parseYangshipinJsonpResponse(response && response.responseText);
  }

  function collectYangshipinMediaUrls(value, results, seen) {
    if (!value) {
      return;
    }
    if (typeof value === 'string') {
      const normalized = normalizeMediaSourceUrl(value);
      if (normalized && !seen.has(normalized) && (/\.(mp4|m3u8|flv)(\?|$)/i.test(normalized) || /[?&](vkey|ysign|ytime|ytype)=/i.test(normalized))) {
        seen.add(normalized);
        results.push(normalized);
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => collectYangshipinMediaUrls(item, results, seen));
      return;
    }
    if (typeof value === 'object') {
      Object.values(value).forEach((item) => collectYangshipinMediaUrls(item, results, seen));
    }
  }

  function buildYangshipinFallbackMediaUrl(data, videoVid) {
    const videoInfo = data && data.vl && Array.isArray(data.vl.vi) ? data.vl.vi[0] : null;
    if (!videoInfo || !videoInfo.ul || !Array.isArray(videoInfo.ul.ui) || !videoInfo.ul.ui.length) {
      return '';
    }
    const firstUi = videoInfo.ul.ui.find((item) => normalizeMediaSourceUrl(item && item.url)) || null;
    if (!firstUi) {
      return '';
    }
    const baseUrl = normalizeMediaSourceUrl(firstUi.url);
    if (!baseUrl) {
      return '';
    }
    if (firstUi.hls && normalizeText(firstUi.hls.pt)) {
      return `${baseUrl}${normalizeText(firstUi.hls.pt)}`;
    }
    let resolvedUrl = baseUrl;
    const linkId = normalizeText(videoInfo.lnk || videoVid);
    const fileName = normalizeText(videoInfo.fn);
    if (fileName && linkId && !new RegExp(`${linkId}\\.(?:mp4|flv)(?:\\?|$)`, 'i').test(resolvedUrl)) {
      const dotIndex = fileName.indexOf('.');
      if (dotIndex >= 0) {
        resolvedUrl += fileName.slice(dotIndex);
      }
    }
    const separator = resolvedUrl.includes('?') ? '&' : '?';
    if (!/[?&]sdtfrom=/i.test(resolvedUrl)) {
      resolvedUrl += `${separator}sdtfrom=${encodeURIComponent(String(getYangshipinSdtfrom()))}`;
    }
    if (!/[?&]guid=/i.test(resolvedUrl)) {
      resolvedUrl += `${resolvedUrl.includes('?') ? '&' : '?'}guid=${encodeURIComponent(getYangshipinGuid())}`;
    }
    if (!/[?&]vkey=/i.test(resolvedUrl) && normalizeText(videoInfo.fvkey)) {
      resolvedUrl += `${resolvedUrl.includes('?') ? '&' : '?'}vkey=${encodeURIComponent(normalizeText(videoInfo.fvkey))}`;
    }
    return resolvedUrl;
  }

  function extractYangshipinVideoUrlFromInfo(data, videoVid) {
    const candidates = [];
    const seen = new Set();
    collectYangshipinMediaUrls(data, candidates, seen);
    if (candidates.length) {
      return candidates[0];
    }
    return buildYangshipinFallbackMediaUrl(data, videoVid);
  }

  async function fetchYangshipinVideoUrlDirectly(videoVid, cancelCheck) {
    let currentSvrtick = '';
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await requestYangshipinVideoInfo(videoVid, currentSvrtick, cancelCheck);
      if (response && Number(response.em) === 85 && Number(response.type) === -3 && normalizeText(response.curTime)) {
        currentSvrtick = normalizeText(response.curTime);
        lastError = new Error('央视频 cKey 已刷新，准备重试');
        continue;
      }
      const videoUrl = extractYangshipinVideoUrlFromInfo(response, videoVid);
      if (videoUrl) {
        return videoUrl;
      }
      lastError = new Error(`央视频未返回完整视频地址（em=${normalizeText(response && response.em) || 'unknown'}）`);
      break;
    }
    throw lastError || new Error('央视频未返回完整视频地址');
  }

  function normalizeMediaSourceUrl(value) {
    const normalized = normalizeText(String(value || '')).replace(/&amp;/gi, '&');
    return /^https?:\/\//i.test(normalized) ? normalized : '';
  }

  function getMediaSourceUrl(element) {
    if (!(element instanceof HTMLMediaElement)) {
      return '';
    }
    const sourceElement = element.querySelector('source[src]');
    const candidates = [
      element.currentSrc,
      element.src,
      element.getAttribute('src'),
      sourceElement ? sourceElement.getAttribute('src') : ''
    ];
    for (const candidate of candidates) {
      const mediaUrl = normalizeMediaSourceUrl(candidate);
      if (mediaUrl) {
        return mediaUrl;
      }
    }
    return '';
  }

  function getYangshipinVideoElements(videoVid) {
    const normalizedVid = normalizeText(videoVid);
    const candidates = [];
    if (normalizedVid) {
      const explicitVideo = document.getElementById(`myvideo${normalizedVid}`);
      if (explicitVideo instanceof HTMLMediaElement) {
        candidates.push(explicitVideo);
      }
      const explicitContainer = document.getElementById(`vodbox${normalizedVid}`);
      if (explicitContainer instanceof Element) {
        candidates.push(...Array.from(explicitContainer.querySelectorAll('video')));
      }
    }
    candidates.push(...Array.from(document.querySelectorAll('video[id^="myvideo"]')));
    candidates.push(...Array.from(document.querySelectorAll('[id^="vodbox"] video')));
    candidates.push(...Array.from(document.querySelectorAll('video')));
    return candidates.filter((element, index, array) => {
      return element instanceof HTMLMediaElement && array.indexOf(element) === index;
    });
  }

  function getYangshipinDirectVideoUrl(videoVid) {
    const mediaElements = getYangshipinVideoElements(videoVid);
    const visibleElement = mediaElements.find((element) => {
      return isVisible(element) && getMediaSourceUrl(element);
    });
    if (visibleElement) {
      return getMediaSourceUrl(visibleElement);
    }
    const anyElement = mediaElements.find((element) => getMediaSourceUrl(element));
    return anyElement ? getMediaSourceUrl(anyElement) : '';
  }

  async function waitForYangshipinDirectVideoUrl(videoVid, cancelCheck) {
    return waitFor(() => {
      const mediaUrl = getYangshipinDirectVideoUrl(videoVid);
      return mediaUrl || '';
    }, DETAIL_PAGE_TIMEOUT, '未获取到视频地址', { cancelCheck });
  }

  async function fetchYangshipinVideoUrlByWorker(videoVid, cancelCheck) {
    const normalizedVid = normalizeText(videoVid);
    if (!normalizedVid) {
      throw new Error('未提供视频 VID');
    }
    const requestId = createRuntimeToken('media');
    const requestKey = buildSecondaryQcMediaWorkerRequestKey(requestId);
    const responseKey = buildSecondaryQcMediaWorkerResponseKey(requestId);
    const workerUrl = `${YANGSHIPIN_VIDEO_WORKER_URL}?vid=${encodeURIComponent(normalizedVid)}&ysp_media_request=${encodeURIComponent(requestId)}`;
    try {
      await storageRemove(responseKey);
      await storageSetCached({
        [requestKey]: {
          requestId,
          videoVid: normalizedVid,
          createdAt: new Date().toISOString()
        }
      });
      const openedWindow = window.open(workerUrl, '_blank');
      if (!openedWindow) {
        const anchor = document.createElement('a');
        anchor.href = workerUrl;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.click();
      }
      const response = await waitForSecondaryQcMediaWorkerResponse(requestId, MEDIA_WORKER_RESPONSE_TIMEOUT, cancelCheck);
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
        throw new Error('采集已结束');
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

  function buildOmniVideoSummaryPrompt(titleText) {
    const normalizedTitle = normalizeText(titleText);
    return [
      '你是央视频二次质检的视频理解助手。',
      '这是最后一道查缺补漏，请认真看完整个视频，不要只看开头，也不要凭印象猜测。',
      normalizedTitle ? `参考标题：${normalizedTitle}` : '参考标题：无',
      '请只返回 JSON，不要输出其他文字。',
      '必须覆盖：',
      '1. overall_theme：视频整体主题，必须简洁明确。',
      '2. timeline：按时间顺序列出关键片段，time 用 00:00-00:20 这类格式，summary 写该片段发生了什么。',
      '3. title_clues：标题里能直接支撑打标的关键词或主题线索。',
      '4. repeated_signals：视频里反复出现、多次提及、或持续围绕展开的核心信息。',
      '5. strong_evidence：真正能支撑补打重要标签的强证据，必须谨慎。',
      '6. uncertain_points：不确定、无法确认、证据不足的信息。',
      '如果某个信息不确定，必须写入 uncertain_points，不要臆断。',
      '',
      '输出格式：',
      '{"overall_theme":"","timeline":[{"time":"","summary":""}],"title_clues":[],"repeated_signals":[],"strong_evidence":[],"uncertain_points":[]}'
    ].join('\n');
  }

  function buildFirstTagJudgePrompt(titleText, videoSummary, selectedTags) {
    return [
      '你是央视频标准化系统的二次质检助手。',
      '这是一条已经过多次校对后的最终查缺补漏任务，你的主要目标是补打真正重要且缺失的标签，不要为了凑结果而补。',
      '请根据“标题”“视频理解结果”和“当前已选成品标签完整信息”，判断现有成品标签是否明显错打，以及哪些标签值得真的去系统搜索框里输入验证。',
      '规则：',
      '1. wrong_tags 默认从严，只有现有标签和视频核心事实明显冲突时才允许输出；大多数情况下应为空。',
      '2. search_candidates 只保留真正值得去系统搜索框输入验证的关键词，每个候选都要给 keyword 和 reason。',
      '3. search_candidates 里的 keyword 必须简短、可直接搜索，不要写成长句。',
      '4. 单次擦边出现、弱相关、泛泛概念、可有可无的标签，一律不要给。',
      '5. 不要推荐已经在当前已选成品标签里的同名标签。',
      '6. summary 用一句中文总结判断原因。',
      '7. 只能返回 JSON，不要返回其他文字。',
      '',
      `标题：${normalizeText(titleText) || '无'}`,
      `当前已选成品标签完整信息：${JSON.stringify(normalizeTagDetailArray(selectedTags || []))}`,
      `视频理解结果：${videoSummary}`,
      '',
      '输出格式：',
      '{"wrong_tags":[],"search_candidates":[{"keyword":"","reason":""}],"summary":""}'
    ].join('\n');
  }

  function buildFinalTagJudgePrompt(titleText, videoSummary, selectedTags, firstJudge, searchResults) {
    return [
      '你是央视频标准化系统的最终二次质检裁定助手。',
      '这一步是最后落表结论，请严格执行“补打优先、错打极严”的标准。',
      '你现在拿到了标题、视频理解结果、当前已选成品标签完整信息、第一轮搜索计划，以及候选标签在系统中的真实搜索结果。',
      '规则：',
      '1. need_record 必须由你独立判断。只有真正需要落到二次质检表里时才返回 true，否则 false。',
      '2. missing_tags_actionable 只保留“页面真实搜得到”且“确实应该补打”的重要标签。',
      '3. wrong_tags 只保留证据非常强、与视频核心事实明显冲突的错打标签；大多数情况应为空。',
      '4. candidate_decisions 必须覆盖每一个已搜索的候选标签，每个候选只出现一次，accepted 表示最终是否采纳，reason 必须说明原因。',
      '5. 如果 accepted 为 true，请尽量在 candidate_decisions 里补充 matched_option_id、matched_option_name、matched_option_type、matched_option_remark，指出你最终采纳的是哪一个搜索结果。',
      '6. evidence_summary 要概括真正支持结论的强证据，重点看标题、主题、反复出现的信息、画面与口播共同支持的点。',
      '7. final_reason 用一句中文说明为什么最终落到这个结论。',
      '8. problem_text 只有在 need_record 为 true 时才输出；默认只输出“补打XX、YY”，只有 wrong_tags 非空时才追加“错打AA、BB”；如果不需要记录，返回空字符串。',
      '9. 单次擦边出现、弱相关、没有反复支撑、不是主题核心的标签，一律不要补。',
      '10. 只能返回 JSON，不要返回其他文字。',
      '',
      `标题：${normalizeText(titleText) || '无'}`,
      `视频理解结果：${videoSummary}`,
      `当前已选成品标签完整信息：${JSON.stringify(normalizeTagDetailArray(selectedTags || []))}`,
      `第一轮判断：${JSON.stringify(firstJudge || {})}`,
      `候选标签真实搜索结果：${JSON.stringify(searchResults || [])}`,
      '',
      '输出格式：',
      '{"need_record":false,"missing_tags_actionable":[],"wrong_tags":[],"candidate_decisions":[{"keyword":"","accepted":false,"reason":"","matched_option_id":"","matched_option_name":"","matched_option_type":"","matched_option_remark":""}],"evidence_summary":"","final_reason":"","problem_text":""}'
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

  async function runSecondaryQcMediaWorker(requestId) {
    const requestKey = buildSecondaryQcMediaWorkerRequestKey(requestId);
    const responseKey = buildSecondaryQcMediaWorkerResponseKey(requestId);
    let responsePayload = null;
    try {
      enforcePageMuted({ pausePlayback: false });
      const requestState = await storageGet(requestKey);
      const request = requestState[requestKey];
      if (!request || typeof request !== 'object') {
        throw new Error('未找到视频地址任务上下文');
      }

      const videoVid = normalizeText(request.videoVid || new URLSearchParams(location.search).get('vid'));
      if (!videoVid) {
        throw new Error('未提供视频 VID');
      }

      const videoUrl = await waitForYangshipinDirectVideoUrl(videoVid);

      responsePayload = {
        status: 'completed',
        requestId,
        videoVid,
        videoUrl,
        completedAt: new Date().toISOString()
      };
    } catch (error) {
      responsePayload = {
        status: 'error',
        requestId,
        error: error && error.message ? error.message : String(error),
        completedAt: new Date().toISOString()
      };
    } finally {
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

  async function runSecondaryQcDetailWorker(requestId) {
    const requestKey = buildSecondaryQcWorkerRequestKey(requestId);
    const responseKey = buildSecondaryQcWorkerResponseKey(requestId);
    const cancelCheck = () => JOB_ABORT_CONTROLLER.secondaryQcWorkerStopped;
    const badgeState = createWorkerBadgeState();
    const applyBadgeState = (patch) => {
      mergeWorkerBadgeState(badgeState, patch);
      mountWorkerBadge(badgeState);
    };
    const reportProgress = async (text, patch) => {
      applyBadgeState({
        statusText: text,
        ...(patch || {})
      });
      pushWorkerBadgeTimeline(badgeState, text);
      mountWorkerBadge(badgeState);
      try {
        await updateSecondaryQcWorkerProgress(requestId, text);
      } catch (error) {
        // ignore progress sync errors
      }
    };
    startSecondaryQcWorkerAbortWatcher(requestId);
    enforcePageMuted({ pausePlayback: true });
    await reportProgress('详情页已打开，正在加载内容', { stageLabel: '加载详情页' });
    let responsePayload = null;
    try {
      await ensureSecondaryQcWorkerNotStopped(requestId);
      const requestState = await storageGet(requestKey);
      const request = requestState[requestKey];
      if (!request || typeof request !== 'object') {
        throw new Error('未找到二次质检任务上下文');
      }

      const listVid = normalizeText(request.taskId || getDetailPageTaskId());
      applyBadgeState({ taskId: listVid });

      await waitForDetailPageReady(cancelCheck);
      await waitForDetailAnalysisReady(listVid, cancelCheck);
      await reportProgress('正在读取视频信息', { stageLabel: '读取元数据' });
      await ensureSecondaryQcWorkerNotStopped(requestId);

      const titleText = getDetailTitleText();
      const durationSeconds = await waitForDetailDurationSeconds(cancelCheck);
      const videoVid = getDetailVideoVid(listVid);
      const selectedTags = getDetailSelectedTagDetails();
      applyBadgeState({
        taskId: listVid,
        videoVid,
        titleText,
        durationSeconds
      });
      await reportProgress(
        durationSeconds > 0
          ? `已读取视频信息，时长 ${formatDurationSeconds(durationSeconds)}`
          : '已读取视频信息，未获取到时长，将继续分析',
        { stageLabel: '时长判断' }
      );

      if (durationSeconds > MAX_SECONDARY_QC_VIDEO_DURATION_SECONDS) {
        const finalReason = `视频时长 ${formatDurationSeconds(durationSeconds)}，超过 ${formatDurationSeconds(MAX_SECONDARY_QC_VIDEO_DURATION_SECONDS)}，按规则跳过`;
        await reportProgress('视频超过 5 分钟，按规则跳过', {
          stageLabel: '时长判断',
          finalReason,
          skipReason: 'long_video',
          evidenceSummary: '当前视频超过 5 分钟，按质检规则直接跳过，不进入视频理解模型。',
          problemText: '',
          wrongTags: [],
          missingCandidates: [],
          validatedCandidates: [],
          rejectedCandidates: []
        });
        responsePayload = {
          status: 'completed',
          requestId,
          taskId: listVid,
          videoVid,
          videoUrl: '',
          needRecord: false,
          problemText: '',
          missingTagsActionable: [],
          wrongTags: [],
          selectedTags,
          searchResults: [],
          summary: '',
          durationSeconds,
          titleText,
          videoSummary: '',
          evidenceSummary: '当前视频超过 5 分钟，按质检规则直接跳过，不进入视频理解模型。',
          validatedCandidates: [],
          rejectedCandidates: [],
          finalReason,
          skipped: true,
          skipReason: 'long_video',
          completedAt: new Date().toISOString()
        };
        await reportProgress('长视频跳过完成，正在返回结果', { stageLabel: '已完成' });
        return;
      }

      const apiKey = normalizeText(request.apiKey);
      if (!apiKey) {
        throw new Error('未配置 DASHSCOPE_API_KEY');
      }
      if (!videoVid) {
        throw new Error('未读取到顶部 VID');
      }

      await reportProgress('正在获取视频地址', { stageLabel: '获取视频地址' });
      const videoUrl = await fetchYangshipinVideoUrlByWorker(videoVid, cancelCheck);
      await ensureSecondaryQcWorkerNotStopped(requestId);

      await reportProgress('正在理解视频内容', { stageLabel: '视频理解' });
      const videoSummaryRaw = await requestOmniVideoSummary(apiKey, videoUrl, buildOmniVideoSummaryPrompt(titleText), cancelCheck);
      const videoAnalysis = normalizeOmniVideoAnalysis(JSON.parse(extractFirstJsonObject(videoSummaryRaw)));
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
      applyBadgeState({
        videoSummary,
        evidenceSummary: baseEvidenceSummary || videoSummary
      });
      await ensureSecondaryQcWorkerNotStopped(requestId);

      await reportProgress('正在分析成品标签', { stageLabel: '候选分析' });
      const firstJudgeRaw = await requestTagJudge(apiKey, buildFirstTagJudgePrompt(titleText, videoSummary, selectedTags), cancelCheck);
      const firstJudge = JSON.parse(extractFirstJsonObject(firstJudgeRaw));
      const wrongTags = normalizeTagArray(firstJudge.wrong_tags);
      const searchCandidates = normalizeTagSearchCandidateArray(firstJudge.search_candidates);
      const missingCandidates = searchCandidates.map((item) => item.keyword);
      const firstSummary = normalizeText(firstJudge.summary);
      applyBadgeState({
        missingCandidates,
        wrongTags,
        evidenceSummary: [firstSummary ? `候选判断：${firstSummary}` : '', baseEvidenceSummary].filter(Boolean).join('\n')
      });
      await ensureSecondaryQcWorkerNotStopped(requestId);

      await reportProgress(
        searchCandidates.length
          ? `正在验证候选标签（1/${searchCandidates.length}）`
          : '当前没有候选标签需要验证',
        {
          stageLabel: '搜索验证',
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
        await ensureSecondaryQcWorkerNotStopped(requestId);
        const options = await searchAvailableTagOptions(candidate.keyword, cancelCheck);
        searchResults.push({
          keyword: candidate.keyword,
          reason: candidate.reason,
          options
        });
        applyBadgeState({
          stageLabel: '搜索验证',
          validatedCandidates: searchResults.map((item) => ({
            keyword: item.keyword,
            searchReason: item.reason,
            options: item.options,
            accepted: null,
            reason: '',
            matchedOption: null
          }))
        });
      }

      await reportProgress('正在生成最终结论', { stageLabel: '生成结论' });
      const finalJudgeRaw = await requestTagJudge(
        apiKey,
        buildFinalTagJudgePrompt(
          titleText,
          videoSummary,
          selectedTags,
          {
            wrong_tags: wrongTags,
            search_candidates: searchCandidates,
            summary: firstSummary
          },
          searchResults
        ),
        cancelCheck
      );
      const finalJudge = JSON.parse(extractFirstJsonObject(finalJudgeRaw));
      const needRecord = normalizeBooleanFlag(finalJudge.need_record);
      const missingTagsActionable = normalizeTagArray(finalJudge.missing_tags_actionable);
      const finalWrongTags = normalizeTagArray(finalJudge.wrong_tags);
      const candidateDecisions = normalizeCandidateDecisionArray(finalJudge.candidate_decisions);
      const validatedCandidates = buildValidatedCandidates(searchResults, candidateDecisions);
      const rejectedCandidates = validatedCandidates
        .filter((item) => item.accepted === false)
        .map((item) => ({
          keyword: item.keyword,
          reason: item.reason
        }));
      const evidenceSummary = normalizeText(finalJudge.evidence_summary) || [firstSummary, baseEvidenceSummary].filter(Boolean).join('\n');
      const finalReason = normalizeText(finalJudge.final_reason) || firstSummary;
      const problemText = normalizeText(finalJudge.problem_text);
      applyBadgeState({
        validatedCandidates,
        rejectedCandidates,
        wrongTags: finalWrongTags,
        evidenceSummary,
        finalReason,
        problemText,
        stageLabel: '已完成'
      });

      responsePayload = {
        status: 'completed',
        requestId,
        taskId: listVid,
        videoVid,
        videoUrl,
        needRecord,
        problemText,
        missingTagsActionable,
        wrongTags: finalWrongTags,
        selectedTags,
        searchResults,
        summary: firstSummary,
        durationSeconds,
        titleText,
        videoSummary,
        evidenceSummary,
        validatedCandidates,
        rejectedCandidates,
        finalReason,
        skipped: false,
        skipReason: '',
        completedAt: new Date().toISOString()
      };
      await reportProgress('处理完成，正在返回结果', { stageLabel: '已完成' });
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      responsePayload = {
        status: 'error',
        requestId,
        error: message,
        completedAt: new Date().toISOString()
      };
    } finally {
      await storageSetCached({
        [responseKey]: responsePayload
      });
      await storageRemove(requestKey);
      await clearSecondaryQcWorkerActiveRequest(requestId);
      await clearSecondaryQcWorkerStopSignal(requestId);
      stopSecondaryQcWorkerAbortWatcher();
      try {
        await clickDetailExitButton();
      } catch (error) {
        // ignore
      }
      unmountWorkerBadge();
      await closeCurrentWorkerPage();
    }
  }

  class YspWorkbenchApp {
    constructor() {
      this.panel = null;
      this.handleOutsideInteraction = null;
      this.settingsModalOpen = false;
      this.settingsDraft = createDefaultWorkbenchSettings();
      this.settings = createDefaultWorkbenchSettings();
      this.runtime = {
        minimized: false,
        running: false,
        openGroupMenu: '',
        jobType: '',
        listJobAbortToken: 0,
        stopping: false,
        pauseRequested: false,
        statusText: '等待开始',
        logs: [],
        daily: {
          checkpoint: null,
          report: null,
          resultCache: {}
        },
        secondaryQc: {
          checkpoint: null,
          report: null
        }
      };
      this.refs = {};
    }

    async init() {
      if (!isSupportedPage()) {
        return;
      }
      injectPanelStyle();
      await this.clearExpiredCache();
      await this.loadState();
      this.mountPanel();
      if (isListPage()) {
        await this.tryResume();
      }
    }

    async clearExpiredCache() {
      const state = await storageGet([
        STORAGE_KEYS.report,
        STORAGE_KEYS.resultCache,
        STORAGE_KEYS.dailyCheckpoint,
        STORAGE_KEYS.secondaryQcCheckpoint
      ]);
      const cutoffDate = getQuarterCutoffDateString(new Date());

      const nextReport = trimReportByCutoff(state[STORAGE_KEYS.report], cutoffDate);
      if (nextReport) {
        await storageSetCached({ [STORAGE_KEYS.report]: nextReport });
      } else {
        await storageRemove(STORAGE_KEYS.report);
      }

      const nextResultCache = trimResultCacheByCutoff(
        normalizeStoredResultCache(state[STORAGE_KEYS.resultCache]),
        cutoffDate
      );
      if (Object.keys(nextResultCache).length) {
        await storageSetCached({ [STORAGE_KEYS.resultCache]: nextResultCache });
      } else {
        await storageRemove(STORAGE_KEYS.resultCache);
      }

      const checkpoints = [
        [STORAGE_KEYS.dailyCheckpoint, state[STORAGE_KEYS.dailyCheckpoint]],
        [STORAGE_KEYS.secondaryQcCheckpoint, state[STORAGE_KEYS.secondaryQcCheckpoint]]
      ];
      for (const [key, checkpoint] of checkpoints) {
        const dateValue = checkpoint && normalizeText(checkpoint.updatedAt || checkpoint.startedAt).slice(0, 10);
        if (dateValue && isDateExpiredByQuarter(dateValue, cutoffDate)) {
          await storageRemove(key);
        }
      }
    }

    async loadState() {
      const state = await storageGet([
        STORAGE_KEYS.settings,
        STORAGE_KEYS.report,
        STORAGE_KEYS.resultCache,
        STORAGE_KEYS.dailyCheckpoint,
        STORAGE_KEYS.secondaryQcReport,
        STORAGE_KEYS.secondaryQcCheckpoint
      ]);
      this.settings = normalizeWorkbenchSettings(state[STORAGE_KEYS.settings]);
      this.settingsDraft = cloneWorkbenchSettings(this.settings);
      this.runtime.minimized = Boolean(this.settings.ui.panelMinimized);
      this.runtime.daily.report = normalizeStoredReport(state[STORAGE_KEYS.report]);
      this.runtime.daily.resultCache = normalizeStoredResultCache(state[STORAGE_KEYS.resultCache]);
      this.runtime.daily.checkpoint = normalizeStoredCheckpoint(state[STORAGE_KEYS.dailyCheckpoint]);
      this.runtime.secondaryQc.report = normalizeSecondaryQcReport(state[STORAGE_KEYS.secondaryQcReport]);
      this.runtime.secondaryQc.checkpoint = normalizeSecondaryQcCheckpoint(state[STORAGE_KEYS.secondaryQcCheckpoint]);
      this.runtime.logs = [];
      this.runtime.statusText = '等待开始';
      this.runtime.running = false;
      this.runtime.jobType = '';
      this.runtime.listJobAbortToken = 0;
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;

      const candidates = [];
      if (this.runtime.daily.checkpoint && this.runtime.daily.checkpoint.status === 'running') {
        candidates.push({
          jobType: 'daily',
          updatedAt: this.runtime.daily.checkpoint.updatedAt || this.runtime.daily.checkpoint.startedAt || '',
          checkpoint: this.runtime.daily.checkpoint
        });
      }
      if (this.runtime.secondaryQc.checkpoint && this.runtime.secondaryQc.checkpoint.status === 'running') {
        candidates.push({
          jobType: 'secondaryQc',
          updatedAt: this.runtime.secondaryQc.checkpoint.updatedAt || this.runtime.secondaryQc.checkpoint.startedAt || '',
          checkpoint: this.runtime.secondaryQc.checkpoint
        });
      }

      if (candidates.length) {
        candidates.sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
        const active = candidates[0];
        this.runtime.running = true;
        this.runtime.jobType = active.jobType;
        this.runtime.listJobAbortToken = beginListJobAbortSession();
        this.runtime.logs = Array.isArray(active.checkpoint.logs) ? active.checkpoint.logs.slice(0, MAX_LOGS) : [];
        this.runtime.statusText = active.checkpoint.statusText || '检测到未完成任务，正在准备继续';
        return;
      }

      const pausedTask = this.getPausedTaskMeta();
      if (pausedTask) {
        this.runtime.statusText = pausedTask.checkpoint.statusText || `存在已暂停${pausedTask.label}，可点击继续任务`;
        this.runtime.logs = Array.isArray(pausedTask.checkpoint.logs) ? pausedTask.checkpoint.logs.slice(0, MAX_LOGS) : [];
        return;
      }

      const stoppedCheckpoint = this.runtime.secondaryQc.checkpoint || this.runtime.daily.checkpoint;
      if (stoppedCheckpoint && stoppedCheckpoint.statusText) {
        this.runtime.statusText = stoppedCheckpoint.statusText;
        this.runtime.logs = Array.isArray(stoppedCheckpoint.logs) ? stoppedCheckpoint.logs.slice(0, MAX_LOGS) : [];
      }
    }

    mountPanel() {
      const existing = document.getElementById('ysp-daily-panel-root');
      if (existing) {
        existing.remove();
      }

      const root = document.createElement('div');
      root.id = 'ysp-daily-panel-root';
      root.innerHTML = `
        <div class="ysp-daily-panel__backdrop"></div>
        <div class="ysp-daily-panel">
          <div class="ysp-daily-panel__header">
            <div class="ysp-daily-panel__header-top">
              <div>
                <div class="ysp-daily-panel__title">央视频标准化工作台</div>
              </div>
              <div class="ysp-daily-panel__header-actions">
                <button type="button" class="ysp-daily-panel__header-chip" data-role="open-settings">设置</button>
                <div class="ysp-daily-panel__header-chip">v${SCRIPT_VERSION}</div>
                <button type="button" class="ysp-daily-panel__header-chip" data-role="minimize">收起</button>
              </div>
            </div>
          </div>
          <div class="ysp-daily-panel__body">
            <div class="ysp-daily-panel__main">
              <div class="ysp-daily-panel__module-switcher" role="tablist" aria-label="模块切换">
                <button type="button" class="ysp-daily-panel__module-tab" data-role="show-daily" aria-selected="false">日报模块</button>
                <button type="button" class="ysp-daily-panel__module-tab" data-role="show-secondary-qc" aria-selected="true">质检模块</button>
              </div>
              <section class="ysp-daily-panel__module" data-role="daily-module">
                <div class="ysp-daily-panel__module-body">
                  <div class="ysp-daily-panel__field-grid">
                    <label class="ysp-daily-panel__date-field" for="ysp-daily-start-date">
                      <span class="ysp-daily-panel__date-caption">开始日期</span>
                      <input id="ysp-daily-start-date" class="ysp-daily-panel__date" type="date" />
                    </label>
                    <label class="ysp-daily-panel__date-field" for="ysp-daily-end-date">
                      <span class="ysp-daily-panel__date-caption">结束日期</span>
                      <input id="ysp-daily-end-date" class="ysp-daily-panel__date" type="date" />
                    </label>
                  </div>
                  <div class="ysp-daily-panel__field">
                    <span class="ysp-daily-panel__label">品类编组</span>
                    <div data-role="daily-groups"></div>
                  </div>
                  <div class="ysp-daily-panel__actions">
                    <button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--primary" data-role="start-daily">开始日报</button>
                  </div>
                </div>
              </section>

              <section class="ysp-daily-panel__module" data-role="secondary-qc-module">
                <div class="ysp-daily-panel__module-body">
                  <div class="ysp-daily-panel__field-grid">
                    <label class="ysp-daily-panel__date-field" for="ysp-secondary-qc-start-date">
                      <span class="ysp-daily-panel__date-caption">开始周期</span>
                      <input id="ysp-secondary-qc-start-date" class="ysp-daily-panel__date" type="date" />
                    </label>
                    <label class="ysp-daily-panel__date-field" for="ysp-secondary-qc-end-date">
                      <span class="ysp-daily-panel__date-caption">结束周期</span>
                      <input id="ysp-secondary-qc-end-date" class="ysp-daily-panel__date" type="date" />
                    </label>
                    <label class="ysp-daily-panel__date-field" for="ysp-secondary-qc-target-count">
                      <span class="ysp-daily-panel__date-caption">质检条数</span>
                      <input id="ysp-secondary-qc-target-count" class="ysp-daily-panel__input" type="number" min="1" max="999" step="1" />
                    </label>
                  </div>
                  <div class="ysp-daily-panel__field">
                    <span class="ysp-daily-panel__label">品类编组</span>
                    <div data-role="secondary-qc-groups"></div>
                  </div>
                  <div class="ysp-daily-panel__actions">
                    <button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--primary" data-role="start-secondary-qc">开始质检</button>
                  </div>
                </div>
              </section>
            </div>
            <div class="ysp-daily-panel__side">
              <div class="ysp-daily-panel__status" data-role="status"></div>
              <div class="ysp-daily-panel__result-card">
                <div class="ysp-daily-panel__toolbar">
                  <span class="ysp-daily-panel__label">下载中心</span>
                </div>
                <div class="ysp-daily-panel__download-list" data-role="downloads"></div>
              </div>
              <div class="ysp-daily-panel__log-card">
                <div class="ysp-daily-panel__toolbar">
                  <span class="ysp-daily-panel__label">运行日志</span>
                </div>
                <div class="ysp-daily-panel__log-list" data-role="logs"></div>
              </div>
              <div class="ysp-daily-panel__actions">
                <button type="button" class="ysp-daily-panel__button" data-role="pause-resume">暂停任务</button>
                <button type="button" class="ysp-daily-panel__button" data-role="stop">结束任务</button>
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="ysp-daily-panel__dock" data-role="dock"><</button>
        <div class="ysp-daily-panel__modal-mask" data-role="settings-mask">
          <div class="ysp-daily-panel__modal">
            <div class="ysp-daily-panel__toolbar">
              <span class="ysp-daily-panel__label">设置</span>
            </div>
            <label class="ysp-daily-panel__date-field" for="ysp-settings-dashscope-api-key">
              <span class="ysp-daily-panel__date-caption">DASHSCOPE_API_KEY（本地保存）</span>
              <input id="ysp-settings-dashscope-api-key" class="ysp-daily-panel__input" type="password" placeholder="请输入阿里云模型 Key" />
            </label>
            <div class="ysp-daily-panel__actions">
              <button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--danger" data-role="clear-data">清理缓存</button>
            </div>
            <div class="ysp-daily-panel__actions">
              <button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--primary" data-role="save-settings">保存设置</button>
              <button type="button" class="ysp-daily-panel__button" data-role="close-settings">关闭</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(root);
      this.panel = root;
      this.refs = {
        backdrop: root.querySelector('.ysp-daily-panel__backdrop'),
        surface: root.querySelector('.ysp-daily-panel'),
        dock: root.querySelector('[data-role="dock"]'),
        minimize: root.querySelector('[data-role="minimize"]'),
        openSettings: root.querySelector('[data-role="open-settings"]'),
        settingsMask: root.querySelector('[data-role="settings-mask"]'),
        settingsInput: root.querySelector('#ysp-settings-dashscope-api-key'),
        saveSettings: root.querySelector('[data-role="save-settings"]'),
        closeSettings: root.querySelector('[data-role="close-settings"]'),
        dailyModule: root.querySelector('[data-role="daily-module"]'),
        dailyTab: root.querySelector('[data-role="show-daily"]'),
        dailyStartDate: root.querySelector('#ysp-daily-start-date'),
        dailyEndDate: root.querySelector('#ysp-daily-end-date'),
        dailyGroups: root.querySelector('[data-role="daily-groups"]'),
        startDaily: root.querySelector('[data-role="start-daily"]'),
        secondaryQcModule: root.querySelector('[data-role="secondary-qc-module"]'),
        secondaryQcTab: root.querySelector('[data-role="show-secondary-qc"]'),
        secondaryQcStartDate: root.querySelector('#ysp-secondary-qc-start-date'),
        secondaryQcEndDate: root.querySelector('#ysp-secondary-qc-end-date'),
        secondaryQcTargetCount: root.querySelector('#ysp-secondary-qc-target-count'),
        secondaryQcGroups: root.querySelector('[data-role="secondary-qc-groups"]'),
        startSecondaryQc: root.querySelector('[data-role="start-secondary-qc"]'),
        pauseResume: root.querySelector('[data-role="pause-resume"]'),
        stop: root.querySelector('[data-role="stop"]'),
        clearData: root.querySelector('[data-role="clear-data"]'),
        status: root.querySelector('[data-role="status"]'),
        downloads: root.querySelector('[data-role="downloads"]'),
        logs: root.querySelector('[data-role="logs"]')
      };

      this.bindPanelEvents();
      this.syncSettingsToInputs();
      this.render();
    }

    destroy() {
      if (this.handleOutsideInteraction) {
        document.removeEventListener('pointerdown', this.handleOutsideInteraction, true);
        document.removeEventListener('mousedown', this.handleOutsideInteraction, true);
        document.removeEventListener('touchstart', this.handleOutsideInteraction, true);
        this.handleOutsideInteraction = null;
      }
      releasePageMuted();
      if (this.panel && this.panel.isConnected) {
        this.panel.remove();
      }
      this.panel = null;
      this.refs = {};
    }

    getActiveCheckpoint() {
      if (this.runtime.jobType === 'daily') {
        return this.runtime.daily.checkpoint;
      }
      if (this.runtime.jobType === 'secondaryQc') {
        return this.runtime.secondaryQc.checkpoint;
      }
      return null;
    }

    getListAbortCheck() {
      const abortToken = this.runtime.listJobAbortToken;
      return () => isListJobAbortRequested(abortToken);
    }

    getPausedTaskMeta() {
      const candidates = [];
      if (this.runtime.daily.checkpoint && this.runtime.daily.checkpoint.status === 'paused') {
        candidates.push({
          jobType: 'daily',
          label: '日报',
          checkpoint: this.runtime.daily.checkpoint,
          updatedAt: this.runtime.daily.checkpoint.updatedAt || this.runtime.daily.checkpoint.startedAt || ''
        });
      }
      if (this.runtime.secondaryQc.checkpoint && this.runtime.secondaryQc.checkpoint.status === 'paused') {
        candidates.push({
          jobType: 'secondaryQc',
          label: '质检模块',
          checkpoint: this.runtime.secondaryQc.checkpoint,
          updatedAt: this.runtime.secondaryQc.checkpoint.updatedAt || this.runtime.secondaryQc.checkpoint.startedAt || ''
        });
      }
      if (!candidates.length) {
        return null;
      }
      candidates.sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
      return candidates[0];
    }

    getCheckpointStorageKey(jobType) {
      return jobType === 'secondaryQc' ? STORAGE_KEYS.secondaryQcCheckpoint : STORAGE_KEYS.dailyCheckpoint;
    }

    getModuleSettings(moduleType) {
      return moduleType === 'secondaryQc' ? this.settings.secondaryQc : this.settings.daily;
    }

    getSelectedGroupEntries(moduleType) {
      return getSubgroupEntriesByIds(this.getModuleSettings(moduleType).groupIds);
    }

    getSelectedEntries(moduleType) {
      return getEntriesByGroupIds(this.getModuleSettings(moduleType).groupIds);
    }

    getCheckpointItems(checkpoint) {
      return getEntriesByKeys(checkpoint && checkpoint.itemKeys);
    }

    formatGroupEntryLabel(entry) {
      if (!entry) {
        return '';
      }
      return `${entry.groupLabel} / ${entry.label}`;
    }

    getGroupPickerSummary(moduleType) {
      const entries = this.getSelectedGroupEntries(moduleType);
      if (!entries.length) {
        return '请选择品类编组';
      }
      if (entries.length === 1) {
        return this.formatGroupEntryLabel(entries[0]);
      }
      return `已选 ${entries.length} 个编组`;
    }

    async persistSettings() {
      await storageSetCached({
        [STORAGE_KEYS.settings]: cloneWorkbenchSettings(this.settings)
      });
    }

    syncSettingsToInputs() {
      const dailyMaxDate = getYesterdayDateString();
      const secondaryQcMaxDate = getTodayDateString();
      const daily = this.settings.daily;
      const secondaryQc = this.settings.secondaryQc;

      this.refs.dailyStartDate.max = dailyMaxDate;
      this.refs.dailyEndDate.max = dailyMaxDate;
      this.refs.dailyEndDate.min = daily.startDate || '';
      this.refs.dailyStartDate.value = daily.startDate || '';
      this.refs.dailyEndDate.value = daily.endDate || '';

      this.refs.secondaryQcStartDate.max = secondaryQcMaxDate;
      this.refs.secondaryQcEndDate.max = secondaryQcMaxDate;
      this.refs.secondaryQcEndDate.min = secondaryQc.startDate || '';
      this.refs.secondaryQcStartDate.value = secondaryQc.startDate || '';
      this.refs.secondaryQcEndDate.value = secondaryQc.endDate || '';
      this.refs.secondaryQcTargetCount.value = String(secondaryQc.targetCount || 10);
      this.refs.settingsInput.value = this.settingsDraft.secrets.dashscopeApiKey || '';
    }

    bindDateInput(input, handler) {
      input.setAttribute('inputmode', 'none');
      input.addEventListener('click', () => this.openDatePicker(input));
      input.addEventListener('focus', () => {
        window.setTimeout(() => this.openDatePicker(input), 0);
      });
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
          return;
        }
        event.preventDefault();
        if (event.key === 'Enter' || event.key === ' ') {
          this.openDatePicker(input);
        }
      });
      input.addEventListener('beforeinput', (event) => event.preventDefault());
      input.addEventListener('paste', (event) => event.preventDefault());
      input.addEventListener('drop', (event) => event.preventDefault());
      input.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });
      input.addEventListener('change', handler);
    }

    bindPanelEvents() {
      if (this.handleOutsideInteraction) {
        document.removeEventListener('pointerdown', this.handleOutsideInteraction, true);
        document.removeEventListener('mousedown', this.handleOutsideInteraction, true);
        document.removeEventListener('touchstart', this.handleOutsideInteraction, true);
      }

      this.handleOutsideInteraction = (event) => {
        if (this.runtime.minimized || event.isTrusted === false) {
          return;
        }
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }
        if (this.refs.surface && this.refs.surface.contains(target)) {
          return;
        }
        if (this.refs.settingsMask && this.refs.settingsMask.contains(target)) {
          return;
        }
        this.setMinimized(true);
      };
      document.addEventListener('pointerdown', this.handleOutsideInteraction, true);
      document.addEventListener('mousedown', this.handleOutsideInteraction, true);
      document.addEventListener('touchstart', this.handleOutsideInteraction, true);

      this.refs.backdrop.addEventListener('click', () => this.setMinimized(true));
      this.refs.minimize.addEventListener('click', () => this.setMinimized(true));
      this.refs.dock.addEventListener('click', () => this.setMinimized(false));

      this.refs.openSettings.addEventListener('click', () => this.openSettingsModal());
      this.refs.closeSettings.addEventListener('click', () => this.closeSettingsModal());
      this.refs.settingsMask.addEventListener('click', (event) => {
        if (event.target === this.refs.settingsMask) {
          this.closeSettingsModal();
        }
      });
      this.refs.saveSettings.addEventListener('click', () => {
        this.saveSettingsModal().catch((error) => this.failJob(error));
      });

      this.bindDateInput(this.refs.dailyStartDate, () => {
        this.updateModuleDate('daily', 'startDate', this.refs.dailyStartDate.value);
      });
      this.bindDateInput(this.refs.dailyEndDate, () => {
        this.updateModuleDate('daily', 'endDate', this.refs.dailyEndDate.value);
      });
      this.bindDateInput(this.refs.secondaryQcStartDate, () => {
        this.updateModuleDate('secondaryQc', 'startDate', this.refs.secondaryQcStartDate.value);
      });
      this.bindDateInput(this.refs.secondaryQcEndDate, () => {
        this.updateModuleDate('secondaryQc', 'endDate', this.refs.secondaryQcEndDate.value);
      });

      this.refs.secondaryQcTargetCount.addEventListener('change', () => {
        this.settings.secondaryQc.targetCount = normalizePositiveInteger(
          this.refs.secondaryQcTargetCount.value,
          this.settings.secondaryQc.targetCount || 10,
          1,
          999
        );
        this.persistSettings().catch(() => undefined);
        this.render();
      });

      this.refs.dailyTab.addEventListener('click', () => this.setActiveModule('daily'));
      this.refs.secondaryQcTab.addEventListener('click', () => this.setActiveModule('secondaryQc'));

      this.refs.dailyGroups.addEventListener('click', (event) => this.handleGroupSelection(event, 'daily'));
      this.refs.secondaryQcGroups.addEventListener('click', (event) => this.handleGroupSelection(event, 'secondaryQc'));
      this.refs.surface.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        if (target.closest('[data-role="group-picker"]')) {
          return;
        }
        if (this.runtime.openGroupMenu) {
          this.runtime.openGroupMenu = '';
          this.render();
        }
      });

      this.refs.startDaily.addEventListener('click', () => {
        this.startDailyJob().catch((error) => this.failJob(error));
      });
      this.refs.startSecondaryQc.addEventListener('click', () => {
        this.startSecondaryQcJob().catch((error) => this.failJob(error));
      });
      this.refs.pauseResume.addEventListener('click', () => {
        this.handlePauseResumeAction().catch((error) => this.failJob(error));
      });
      this.refs.stop.addEventListener('click', () => {
        this.stopCurrentJob().catch((error) => this.failJob(error));
      });
      this.refs.clearData.addEventListener('click', () => {
        this.clearAllCachedData().catch((error) => this.failJob(error));
      });
      this.refs.downloads.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const role = target.closest('[data-download-role]')?.getAttribute('data-download-role');
        if (role === 'daily') {
          this.exportDailyReport();
        }
        if (role === 'secondaryQc') {
          this.exportSecondaryQcResult();
        }
      });
    }

    handleGroupSelection(event, moduleType) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const trigger = target.closest('[data-role="group-trigger"]');
      if (trigger) {
        if (this.runtime.running) {
          return;
        }
        this.runtime.openGroupMenu = this.runtime.openGroupMenu === moduleType ? '' : moduleType;
        this.render();
        return;
      }
      if (this.runtime.running) {
        return;
      }
      const groupOption = target.closest('[data-role="group-option"]');
      if (!groupOption) {
        return;
      }
      const groupId = groupOption.getAttribute('data-group-id');
      if (!groupId) {
        return;
      }
      const groupIds = new Set(this.getModuleSettings(moduleType).groupIds);
      if (groupIds.has(groupId)) {
        groupIds.delete(groupId);
      } else {
        groupIds.add(groupId);
      }
      this.getModuleSettings(moduleType).groupIds = Array.from(groupIds);
      this.persistSettings().catch(() => undefined);
      this.render();
    }

    openDatePicker(input) {
      if (!input || input.disabled) {
        return;
      }
      if (typeof input.showPicker === 'function') {
        try {
          input.showPicker();
          return;
        } catch (error) {
          // ignore
        }
      }
      input.focus();
    }

    updateModuleDate(moduleType, key, value) {
      const moduleSettings = this.getModuleSettings(moduleType);
      const maxDate = moduleType === 'secondaryQc' ? getTodayDateString() : getYesterdayDateString();
      const normalizedValue = normalizeDateInputValue(value, maxDate);
      if (key === 'startDate') {
        moduleSettings.startDate = moduleType === 'secondaryQc' ? normalizedValue : (normalizedValue || maxDate);
        if (moduleSettings.endDate && moduleSettings.startDate && moduleSettings.endDate < moduleSettings.startDate) {
          moduleSettings.endDate = '';
        }
      } else {
        moduleSettings.endDate = normalizedValue;
        if (moduleSettings.endDate && moduleSettings.startDate && moduleSettings.endDate < moduleSettings.startDate) {
          moduleSettings.endDate = '';
        }
      }
      this.persistSettings().catch(() => undefined);
      this.render();
    }

    setMinimized(nextValue) {
      this.runtime.minimized = Boolean(nextValue);
      this.settings.ui.panelMinimized = this.runtime.minimized;
      if (this.runtime.minimized) {
        this.runtime.openGroupMenu = '';
      }
      this.persistSettings().catch(() => undefined);
      this.render();
    }

    setActiveModule(moduleType) {
      const nextModule = normalizeActiveModule(moduleType);
      if (this.settings.ui.activeModule === nextModule) {
        return;
      }
      this.settings.ui.activeModule = nextModule;
      this.runtime.openGroupMenu = '';
      this.persistSettings().catch(() => undefined);
      this.render();
    }

    openSettingsModal() {
      this.settingsDraft = cloneWorkbenchSettings(this.settings);
      this.settingsModalOpen = true;
      this.runtime.openGroupMenu = '';
      this.syncSettingsToInputs();
      this.render();
      this.refs.settingsInput.focus();
    }

    closeSettingsModal() {
      this.settingsModalOpen = false;
      this.render();
    }

    async saveSettingsModal() {
      this.settings.secrets.dashscopeApiKey = normalizeText(this.refs.settingsInput.value);
      this.settingsDraft = cloneWorkbenchSettings(this.settings);
      this.settingsModalOpen = false;
      this.render();
      await this.persistSettings();
      this.pushLog('设置已保存');
    }

    renderGroupSelector(container, moduleType) {
      const selected = new Set(this.getModuleSettings(moduleType).groupIds);
      const open = !this.runtime.running && this.runtime.openGroupMenu === moduleType;
      const triggerSummary = this.getGroupPickerSummary(moduleType);

      container.innerHTML = `
        <div class="ysp-daily-panel__group-picker${open ? ' is-open' : ''}" data-role="group-picker">
          <button type="button" class="ysp-daily-panel__group-trigger" data-role="group-trigger" aria-expanded="${open ? 'true' : 'false'}" title="${escapeXml(triggerSummary)}" ${this.runtime.running ? 'disabled' : ''}>
            <span class="ysp-daily-panel__group-trigger-text">${escapeXml(triggerSummary)}</span>
            <span class="ysp-daily-panel__group-trigger-icon">${open ? '▲' : '▼'}</span>
          </button>
          <div class="ysp-daily-panel__group-menu" role="listbox" aria-label="品类编组选项">
            ${SUBGROUP_ENTRIES.map((subgroup) => {
              const selectedClass = selected.has(subgroup.id) ? ' is-selected' : '';
              return `
                <button
                  type="button"
                  class="ysp-daily-panel__group-option${selectedClass}"
                  data-theme="${escapeXml(subgroup.theme)}"
                  data-role="group-option"
                  data-group-id="${escapeXml(subgroup.id)}"
                  ${this.runtime.running ? 'disabled' : ''}
                >
                  <span class="ysp-daily-panel__group-option-copy">
                    <span class="ysp-daily-panel__group-option-meta">${escapeXml(subgroup.groupLabel)}</span>
                    <span class="ysp-daily-panel__group-option-label">${escapeXml(subgroup.label)}</span>
                  </span>
                  <span class="ysp-daily-panel__group-option-check">${selected.has(subgroup.id) ? '已选' : '选择'}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    renderStatus() {
      const jobLabel = this.runtime.jobType === 'secondaryQc'
        ? '质检模块'
        : this.runtime.jobType === 'daily'
          ? '日报'
          : '空闲';
      const pageText = isListPage()
        ? '当前页面：列表页'
        : isDetailPage()
          ? '当前页面：详情页，只保留工作台显示；开始或继续任务请回列表页'
          : '当前页面：其他页面';
      this.refs.status.innerHTML = `
        <div class="ysp-daily-panel__status-head">
          <span class="ysp-daily-panel__label">当前状态</span>
        </div>
        <div class="ysp-daily-panel__status-value">${escapeXml(this.runtime.statusText || '等待开始')}</div>
        <div class="ysp-daily-panel__status-subtext">任务类型：${escapeXml(jobLabel)}</div>
        <div class="ysp-daily-panel__status-subtext">${escapeXml(pageText)}</div>
      `;
    }

    renderDownloads() {
      const cards = [];
      if (this.runtime.daily.report) {
        cards.push(`
          <div style="padding: 12px; border: 1px solid #d8e2ee; border-radius: 12px; background: #fff;">
            <div style="font-weight: 700; color: #17324f;">日报结果</div>
            <div style="margin-top: 6px; color: #6b7a90;">${escapeXml(formatReportPeriod(this.runtime.daily.report))}</div>
            <div class="ysp-daily-panel__actions" style="margin-top: 10px;">
              <button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--primary" data-download-role="daily">下载日报</button>
            </div>
          </div>
        `);
      }
      if (this.runtime.secondaryQc.report) {
        cards.push(`
          <div style="padding: 12px; border: 1px solid #d8e2ee; border-radius: 12px; background: #fff;">
            <div style="font-weight: 700; color: #17324f;">二次质检结果</div>
            <div style="margin-top: 6px; color: #6b7a90;">${escapeXml(formatReportPeriod(this.runtime.secondaryQc.report))}</div>
            <div style="margin-top: 4px; color: #6b7a90;">目标 ${this.runtime.secondaryQc.report.targetCount} 条，实际 ${this.runtime.secondaryQc.report.actualCount} 条</div>
            <div class="ysp-daily-panel__actions" style="margin-top: 10px;">
              <button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--primary" data-download-role="secondaryQc">下载质检表</button>
            </div>
          </div>
        `);
      }
      this.refs.downloads.innerHTML = cards.length ? cards.join('') : '<div class="ysp-daily-panel__report-empty">暂无结果</div>';
    }

    renderLogs() {
      if (!this.runtime.logs.length) {
        this.refs.logs.innerHTML = '<div class="ysp-daily-panel__report-empty">暂无日志</div>';
        return;
      }
      this.refs.logs.innerHTML = this.runtime.logs
        .map((log) => `<div class="ysp-daily-panel__log-entry">${escapeXml(log)}</div>`)
        .join('');
    }

    render() {
      if (!this.panel) {
        return;
      }
      if (this.runtime.running && this.runtime.openGroupMenu) {
        this.runtime.openGroupMenu = '';
      }
      const listPageActive = isListPage();
      if (this.runtime.running) {
        enforcePageMuted({ pausePlayback: isDetailPage() });
      } else {
        releasePageMuted();
      }
      this.panel.classList.toggle('is-minimized', this.runtime.minimized);
      this.panel.classList.toggle('is-settings-open', this.settingsModalOpen);
      this.syncSettingsToInputs();
      this.renderGroupSelector(this.refs.dailyGroups, 'daily');
      this.renderGroupSelector(this.refs.secondaryQcGroups, 'secondaryQc');

      const activeModule = normalizeActiveModule(this.settings.ui.activeModule);
      this.refs.dailyModule.hidden = activeModule !== 'daily';
      this.refs.secondaryQcModule.hidden = activeModule !== 'secondaryQc';
      this.refs.dailyTab.classList.toggle('is-active', activeModule === 'daily');
      this.refs.dailyTab.setAttribute('aria-selected', activeModule === 'daily' ? 'true' : 'false');
      this.refs.secondaryQcTab.classList.toggle('is-active', activeModule === 'secondaryQc');
      this.refs.secondaryQcTab.setAttribute('aria-selected', activeModule === 'secondaryQc' ? 'true' : 'false');

      const disabled = this.runtime.running;
      this.refs.dailyStartDate.disabled = disabled;
      this.refs.dailyEndDate.disabled = disabled;
      this.refs.secondaryQcStartDate.disabled = disabled;
      this.refs.secondaryQcEndDate.disabled = disabled;
      this.refs.secondaryQcTargetCount.disabled = disabled;
      this.refs.startDaily.disabled = disabled || !listPageActive;
      this.refs.startSecondaryQc.disabled = disabled || !listPageActive;
      this.refs.clearData.disabled = disabled;
      this.refs.stop.disabled = !disabled;
      const pausedTask = this.getPausedTaskMeta();
      this.refs.pauseResume.disabled = !disabled && (!pausedTask || !listPageActive);
      this.refs.pauseResume.textContent = disabled ? '暂停任务' : pausedTask ? `继续${pausedTask.label}` : '继续任务';
      this.refs.pauseResume.classList.toggle('ysp-daily-panel__button--primary', !disabled && Boolean(pausedTask));
      this.refs.startDaily.textContent = disabled && this.runtime.jobType === 'daily' ? '日报运行中' : '开始日报';
      this.refs.startSecondaryQc.textContent = disabled && this.runtime.jobType === 'secondaryQc' ? '质检运行中' : '开始质检';

      this.renderStatus();
      this.renderDownloads();
      this.renderLogs();
    }

    pushLog(message) {
      const entry = `[${formatClock()}] ${message}`;
      this.runtime.logs.unshift(entry);
      this.runtime.logs = this.runtime.logs.slice(0, MAX_LOGS);
      const checkpoint = this.getActiveCheckpoint();
      if (checkpoint) {
        checkpoint.logs = this.runtime.logs.slice();
      }
      this.renderLogs();
    }

    ensureNotStopped() {
      if (isListJobAbortRequested(this.runtime.listJobAbortToken)) {
        throw new Error('采集已结束');
      }
      if (this.runtime.stopping) {
        throw new Error('采集已结束');
      }
      if (this.runtime.pauseRequested) {
        throw new Error('采集已暂停');
      }
    }

    updateCheckpointStatus(text, summaryText) {
      const checkpoint = this.getActiveCheckpoint();
      this.runtime.statusText = text;
      if (checkpoint) {
        checkpoint.statusText = text;
        checkpoint.summaryText = summaryText || checkpoint.summaryText || '';
      }
      this.renderStatus();
    }

    async saveCheckpoint(jobType) {
      const checkpoint = jobType === 'secondaryQc' ? this.runtime.secondaryQc.checkpoint : this.runtime.daily.checkpoint;
      if (!checkpoint) {
        return;
      }
      checkpoint.updatedAt = new Date().toISOString();
      await storageSetCached({
        [this.getCheckpointStorageKey(jobType)]: checkpoint
      });
    }

    async clearCheckpoint(jobType) {
      await storageRemove(this.getCheckpointStorageKey(jobType));
      if (jobType === 'secondaryQc') {
        this.runtime.secondaryQc.checkpoint = null;
      } else {
        this.runtime.daily.checkpoint = null;
      }
    }

    async clearAllCachedData() {
      if (this.runtime.running) {
        return;
      }
      const activeRequestState = await storageGet(STORAGE_KEYS.secondaryQcWorkerActiveRequest);
      const activeRequestId = normalizeText(activeRequestState[STORAGE_KEYS.secondaryQcWorkerActiveRequest]);
      const clearKeys = [
        STORAGE_KEYS.report,
        STORAGE_KEYS.resultCache,
        STORAGE_KEYS.dailyCheckpoint,
        STORAGE_KEYS.secondaryQcReport,
        STORAGE_KEYS.secondaryQcCheckpoint,
        STORAGE_KEYS.secondaryQcWorkerActiveRequest
      ];
      if (activeRequestId) {
        clearKeys.push(
          buildSecondaryQcWorkerRequestKey(activeRequestId),
          buildSecondaryQcWorkerResponseKey(activeRequestId),
          buildSecondaryQcWorkerProgressKey(activeRequestId),
          buildSecondaryQcWorkerStopKey(activeRequestId)
        );
      }
      const confirmed = window.confirm('这只会清除工作台本地缓存、结果和任务进度，不会清空已保存的日期和 API Key。确认清除吗？');
      if (!confirmed) {
        return;
      }
      await storageRemove(clearKeys);
      this.settingsDraft = cloneWorkbenchSettings(this.settings);
      this.runtime.running = false;
      this.runtime.jobType = '';
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.runtime.statusText = '已清除本地缓存';
      this.runtime.logs = [];
      this.runtime.daily = {
        checkpoint: null,
        report: null,
        resultCache: {}
      };
      this.runtime.secondaryQc = {
        checkpoint: null,
        report: null
      };
      this.syncSettingsToInputs();
      this.render();
    }

    async stopCurrentJob() {
      if (!this.runtime.running) {
        return;
      }
      const jobType = this.runtime.jobType;
      const checkpoint = this.getActiveCheckpoint();
      const stoppedStatusText = '采集已结束，可以重新开始';
      requestListJobAbort(this.runtime.listJobAbortToken);
      this.runtime.stopping = true;
      this.runtime.pauseRequested = false;
      this.runtime.statusText = stoppedStatusText;
      this.pushLog('采集已结束');
      if (checkpoint) {
        checkpoint.status = 'stopped';
        checkpoint.statusText = stoppedStatusText;
        await this.saveCheckpoint(jobType);
      }
      if (jobType === 'secondaryQc') {
        const activeRequestState = await storageGet(STORAGE_KEYS.secondaryQcWorkerActiveRequest);
        const activeRequestId = normalizeText(activeRequestState[STORAGE_KEYS.secondaryQcWorkerActiveRequest]);
        if (activeRequestId) {
          await requestSecondaryQcWorkerStop(activeRequestId);
        }
      }
      this.runtime.running = false;
      this.runtime.jobType = '';
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.render();
    }

    pauseCurrentJob() {
      if (!this.runtime.running) {
        return;
      }
      this.runtime.pauseRequested = true;
      this.runtime.stopping = false;
      this.runtime.statusText = '正在暂停当前任务';
      this.pushLog('正在暂停当前任务');
      this.render();
    }

    async handlePauseResumeAction() {
      if (this.runtime.running) {
        this.pauseCurrentJob();
        return;
      }
      await this.resumePausedJob();
    }

    async resumePausedJob() {
      if (this.runtime.running) {
        return;
      }
      if (!isListPage()) {
        throw new Error('继续任务请回到标准化列表页');
      }
      this.runtime.listJobAbortToken = beginListJobAbortSession();
      const pausedTask = this.getPausedTaskMeta();
      if (!pausedTask) {
        throw new Error('当前没有可继续的暂停任务');
      }
      this.runtime.running = true;
      this.runtime.jobType = pausedTask.jobType;
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.runtime.logs = Array.isArray(pausedTask.checkpoint.logs) ? pausedTask.checkpoint.logs.slice(0, MAX_LOGS) : [];
      pausedTask.checkpoint.status = 'running';
      pausedTask.checkpoint.statusText = `正在继续${pausedTask.label}`;
      this.runtime.statusText = pausedTask.checkpoint.statusText;
      await this.saveCheckpoint(pausedTask.jobType);
      this.pushLog(`继续${pausedTask.label}`);
      this.render();
      if (pausedTask.jobType === 'daily') {
        await this.runDailyFromCheckpoint();
        return;
      }
      await this.runSecondaryQcFromCheckpoint();
    }

    async tryResume() {
      if (!this.runtime.running) {
        this.render();
        return;
      }
      if (this.runtime.jobType === 'daily' && this.runtime.daily.checkpoint && this.runtime.daily.checkpoint.status === 'running') {
        this.pushLog('检测到未完成日报，正在继续');
        await this.runDailyFromCheckpoint();
        return;
      }
      if (this.runtime.jobType === 'secondaryQc' && this.runtime.secondaryQc.checkpoint && this.runtime.secondaryQc.checkpoint.status === 'running') {
        this.pushLog('检测到未完成二次质检，正在继续');
        await this.runSecondaryQcFromCheckpoint();
        return;
      }
      this.runtime.running = false;
      this.runtime.jobType = '';
      this.render();
    }

    describeItem(item) {
      return item.exportLabel;
    }

    getCachedDailyResult(date, item) {
      const dayResults = this.runtime.daily.resultCache && this.runtime.daily.resultCache[date];
      if (!dayResults || !dayResults[item.key]) {
        return null;
      }
      const normalized = normalizeStoredResultRow({
        ...dayResults[item.key],
        key: item.key
      });
      return isReusableCachedResult(normalized) ? normalized : null;
    }

    async cacheDailyResult(date, item, result) {
      if (!this.runtime.daily.resultCache[date]) {
        this.runtime.daily.resultCache[date] = {};
      }
      this.runtime.daily.resultCache[date][item.key] = normalizeStoredResultRow({
        ...result,
        key: item.key
      });
      await storageSetCached({
        [STORAGE_KEYS.resultCache]: this.runtime.daily.resultCache
      });
    }

    async startDailyJob() {
      if (this.runtime.running) {
        return;
      }
      if (!isListPage()) {
        throw new Error('日报只能在标准化列表页启动');
      }
      this.runtime.listJobAbortToken = beginListJobAbortSession();
      const startDate = this.settings.daily.startDate;
      const endDate = this.settings.daily.endDate || startDate;
      const maxDate = getYesterdayDateString();
      const groupIds = this.settings.daily.groupIds.slice();
      const groups = this.getSelectedGroupEntries('daily');
      const items = this.getSelectedEntries('daily');
      if (!startDate) {
        throw new Error('请先选择日报开始日期');
      }
      if (startDate > maxDate || endDate > maxDate) {
        throw new Error('日期只能选择昨天及以前');
      }
      if (endDate < startDate) {
        throw new Error('结束日期不能早于开始日期');
      }
      if (!groups.length) {
        throw new Error('请至少选择一个日报编组');
      }
      const dateList = buildDateList(startDate, endDate);
      if (!dateList.length) {
        throw new Error('日报日期范围无效');
      }

      this.runtime.running = true;
      this.runtime.jobType = 'daily';
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.runtime.logs = [];
      this.runtime.statusText = '正在准备日报';
      this.runtime.daily.report = null;
      this.runtime.daily.checkpoint = {
        version: 4,
        status: 'running',
        startDate,
        endDate,
        dateList,
        groupIds,
        itemKeys: items.map((item) => item.key),
        currentDateIndex: 0,
        currentItemIndex: 0,
        phase: 'std',
        results: {},
        logs: [],
        startedAt: new Date().toISOString(),
        statusText: '正在准备日报',
        summaryText: ''
      };
      this.render();
      await this.saveCheckpoint('daily');
      this.pushLog(`开始日报：${startDate === endDate ? startDate : `${startDate} 至 ${endDate}`}，覆盖 ${items.length} 个子品类`);
      await this.runDailyFromCheckpoint();
    }

    async runDailyFromCheckpoint(cancelCheck) {
      const activeCancelCheck = typeof cancelCheck === 'function' ? cancelCheck : this.getListAbortCheck();
      await waitForPageReady(activeCancelCheck);
      const checkpoint = this.runtime.daily.checkpoint;
      if (!checkpoint || checkpoint.status !== 'running') {
        this.runtime.running = false;
        this.runtime.jobType = '';
        this.render();
        return;
      }
      const dateList = Array.isArray(checkpoint.dateList) && checkpoint.dateList.length
        ? checkpoint.dateList
        : buildDateList(checkpoint.startDate, checkpoint.endDate || checkpoint.startDate);
      checkpoint.dateList = dateList;
      const items = this.getCheckpointItems(checkpoint);
      if (!items.length || !dateList.length) {
        throw new Error('当前日报任务没有可采集内容');
      }

      if (checkpoint.phase === 'resume-qc') {
        const currentDate = dateList[checkpoint.currentDateIndex];
        const item = items[checkpoint.currentItemIndex];
        if (currentDate && item) {
          const cachedResult = this.getCachedDailyResult(currentDate, item);
          if (cachedResult) {
            checkpoint.results[currentDate] = checkpoint.results[currentDate] || {};
            checkpoint.results[currentDate][item.key] = cachedResult;
            this.pushLog(`${currentDate} ${this.describeItem(item)}：已使用已保存结果`);
            checkpoint.currentItemIndex += 1;
            if (checkpoint.currentItemIndex >= items.length) {
              checkpoint.currentDateIndex += 1;
              checkpoint.currentItemIndex = 0;
            }
            checkpoint.phase = 'std';
            await this.saveCheckpoint('daily');
            return this.runDailyFromCheckpoint(activeCancelCheck);
          }
          this.updateCheckpointStatus(
            `正在继续 ${item.exportLabel}`,
            `${checkpoint.currentDateIndex + 1}/${dateList.length} · ${checkpoint.currentItemIndex + 1}/${items.length} · 质检`
          );
          await this.runDailyQualityCheckForItem(currentDate, item, activeCancelCheck);
          checkpoint.currentItemIndex += 1;
          if (checkpoint.currentItemIndex >= items.length) {
            checkpoint.currentDateIndex += 1;
            checkpoint.currentItemIndex = 0;
          }
          checkpoint.phase = 'std';
          await this.saveCheckpoint('daily');
        }
      }

      while (checkpoint.currentDateIndex < dateList.length) {
        this.ensureNotStopped();
        if (checkpoint.currentItemIndex >= items.length) {
          checkpoint.currentDateIndex += 1;
          checkpoint.currentItemIndex = 0;
          continue;
        }
        const currentDate = dateList[checkpoint.currentDateIndex];
        const item = items[checkpoint.currentItemIndex];
        checkpoint.results[currentDate] = checkpoint.results[currentDate] || {};
        checkpoint.results[currentDate][item.key] = checkpoint.results[currentDate][item.key] || createEmptyResult(item);

        const cachedResult = this.getCachedDailyResult(currentDate, item);
        if (cachedResult) {
          checkpoint.results[currentDate][item.key] = cachedResult;
          this.pushLog(`${currentDate} ${this.describeItem(item)}：已使用已保存结果`);
          checkpoint.currentItemIndex += 1;
          if (checkpoint.currentItemIndex >= items.length) {
            checkpoint.currentDateIndex += 1;
            checkpoint.currentItemIndex = 0;
          }
          checkpoint.phase = 'std';
          await this.saveCheckpoint('daily');
          continue;
        }

        checkpoint.phase = 'std';
        this.updateCheckpointStatus(
          `正在采集 ${item.exportLabel}`,
          `${checkpoint.currentDateIndex + 1}/${dateList.length} · ${checkpoint.currentItemIndex + 1}/${items.length} · 标准化`
        );
        await this.saveCheckpoint('daily');
        await this.runDailyStandardizationForItem(currentDate, item, activeCancelCheck);

        checkpoint.phase = 'resume-qc';
        this.updateCheckpointStatus(
          `正在继续 ${item.exportLabel}`,
          `${checkpoint.currentDateIndex + 1}/${dateList.length} · ${checkpoint.currentItemIndex + 1}/${items.length} · 下一步`
        );
        await this.saveCheckpoint('daily');
        this.pushLog(`${currentDate} ${this.describeItem(item)}：标准化已完成，正在继续质检`);
        window.location.reload();
        return;
      }

      await this.completeDailyJob();
    }

    async runDailyStandardizationForItem(date, item, cancelCheck) {
      this.ensureNotStopped();
      const activeCancelCheck = typeof cancelCheck === 'function' ? cancelCheck : this.getListAbortCheck();
      const checkpoint = this.runtime.daily.checkpoint;
      const result = checkpoint.results[date][item.key] || createEmptyResult(item);
      const range = buildDateRange(date);

      await clickResetButton();
      await this.applyCategory(item, activeCancelCheck);
      await setDateRange('创建时间', range.start, range.end, activeCancelCheck);

      this.pushLog(`${date} ${this.describeItem(item)}：读取入库量`);
      result.inboundCount = await clickQueryAndReadCount(activeCancelCheck);
      this.pushLog(`${date} ${this.describeItem(item)}：入库量 ${result.inboundCount}`);

      await this.applySelectByLabel('标准化状态', '标准化通过', activeCancelCheck);
      result.stdPassCount = await clickQueryAndReadCount(activeCancelCheck);
      this.pushLog(`${date} ${this.describeItem(item)}：标准化通过 ${result.stdPassCount}`);

      await this.applySelectByLabel('标准化状态', '标准化拒绝', activeCancelCheck);
      result.stdRejectCount = await clickQueryAndReadCount(activeCancelCheck);
      result.stdTotalCount = result.stdPassCount + result.stdRejectCount;
      result.stdRejectRate = calculateRatio(result.stdRejectCount, result.stdTotalCount);
      this.pushLog(`${date} ${this.describeItem(item)}：标准化拒绝 ${result.stdRejectCount}`);

      checkpoint.results[date][item.key] = {
        ...result,
        key: item.key,
        category: item.exportLabel,
        label: item.exportLabel,
        groupLabel: item.groupLabel,
        subgroupLabel: item.subgroupLabel,
        theme: item.theme,
        collectionCompleted: false
      };
      await this.saveCheckpoint('daily');
    }

    async runDailyQualityCheckForItem(date, item, cancelCheck) {
      this.ensureNotStopped();
      const activeCancelCheck = typeof cancelCheck === 'function' ? cancelCheck : this.getListAbortCheck();
      const checkpoint = this.runtime.daily.checkpoint;
      const result = checkpoint.results[date][item.key] || createEmptyResult(item);
      const range = buildDateRange(date);

      await clickResetButton();
      await this.applyCategory(item, activeCancelCheck);
      await setDateRange('修改时间', range.start, range.end, activeCancelCheck);

      await this.applySelectByLabel('质检状态', '质检通过', activeCancelCheck);
      result.qcPassCount = await clickQueryAndReadCount(activeCancelCheck);
      this.pushLog(`${date} ${this.describeItem(item)}：质检通过 ${result.qcPassCount}`);

      await this.applySelectByLabel('质检状态', '质检拒绝', activeCancelCheck);
      result.qcRejectCount = await clickQueryAndReadCount(activeCancelCheck);
      result.qcTotalCount = result.qcPassCount + result.qcRejectCount;
      result.qcRejectRate = calculateRatio(result.qcRejectCount, result.qcTotalCount);
      this.pushLog(`${date} ${this.describeItem(item)}：质检拒绝 ${result.qcRejectCount}`);

      checkpoint.results[date][item.key] = {
        ...result,
        key: item.key,
        category: item.exportLabel,
        label: item.exportLabel,
        groupLabel: item.groupLabel,
        subgroupLabel: item.subgroupLabel,
        theme: item.theme,
        collectionCompleted: true
      };
      await this.cacheDailyResult(date, item, checkpoint.results[date][item.key]);
      await this.saveCheckpoint('daily');
    }

    async completeDailyJob() {
      const checkpoint = this.runtime.daily.checkpoint;
      const items = this.getCheckpointItems(checkpoint);
      const dateList = Array.isArray(checkpoint.dateList) && checkpoint.dateList.length
        ? checkpoint.dateList
        : buildDateList(checkpoint.startDate, checkpoint.endDate || checkpoint.startDate);
      const report = {
        version: 1,
        date: checkpoint.startDate,
        startDate: checkpoint.startDate,
        endDate: checkpoint.endDate || checkpoint.startDate,
        itemKeys: items.map((item) => item.key),
        columns: buildReportColumns(items),
        rows: buildDailyReportRows(dateList, items, checkpoint.results),
        generatedAt: new Date().toISOString()
      };

      this.runtime.daily.report = report;
      await storageSetCached({ [STORAGE_KEYS.report]: report });
      await this.clearCheckpoint('daily');
      this.runtime.running = false;
      this.runtime.jobType = '';
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.runtime.statusText = '日报采集完成，可以下载结果了';
      this.pushLog(`日报采集完成，已生成 ${dateList.length} 天结果`);
      this.render();
    }

    async startSecondaryQcJob() {
      if (this.runtime.running) {
        return;
      }
      this.runtime.listJobAbortToken = beginListJobAbortSession();
      if (!isListPage()) {
        throw new Error('二次质检只能在标准化列表页启动');
      }
      const startDate = normalizeText(this.settings.secondaryQc.startDate);
      const endDate = normalizeText(this.settings.secondaryQc.endDate);
      const targetCount = normalizePositiveInteger(this.settings.secondaryQc.targetCount, 10, 1, 999);
      const maxDate = getTodayDateString();
      const groupIds = this.settings.secondaryQc.groupIds.slice();
      const groups = this.getSelectedGroupEntries('secondaryQc');
      const items = this.getSelectedEntries('secondaryQc');
      const apiKey = normalizeText(this.settings.secrets.dashscopeApiKey);
      if (!startDate) {
        throw new Error('请先选择二次质检开始周期');
      }
      if (!endDate) {
        throw new Error('请先选择二次质检结束周期');
      }
      if (startDate > maxDate || endDate > maxDate) {
        throw new Error('二次质检周期只能选择今天及以前');
      }
      if (endDate < startDate) {
        throw new Error('结束周期不能早于开始周期');
      }
      if (!groups.length) {
        throw new Error('请至少选择一个二次质检编组');
      }
      if (!apiKey) {
        throw new Error('请先在设置里填写 DASHSCOPE_API_KEY');
      }

      this.runtime.running = true;
      this.runtime.jobType = 'secondaryQc';
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.runtime.logs = [];
      this.runtime.secondaryQc.report = null;
      this.runtime.statusText = '正在准备二次质检';
      this.runtime.secondaryQc.checkpoint = {
        version: 2,
        status: 'running',
        startDate,
        endDate,
        groupIds,
        itemKeys: items.map((item) => item.key),
        targetCount,
        itemTargetCounts: buildSecondaryQcItemTargetCounts(items.length, targetCount),
        itemRecordedCounts: new Array(items.length).fill(0),
        currentItemIndex: 0,
        processedTaskIds: [],
        rows: [],
        qcOperator: getCurrentLoginName(),
        logs: [],
        startedAt: new Date().toISOString(),
        statusText: '正在准备二次质检',
        summaryText: ''
      };
      this.render();
      await this.saveCheckpoint('secondaryQc');
      this.pushLog(
        `开始二次质检：${startDate === endDate ? startDate : `${startDate} 至 ${endDate}`}，目标 ${targetCount} 条，${items.length} 个品类按顺序分配 ${this.runtime.secondaryQc.checkpoint.itemTargetCounts.join(' / ')} 条`
      );
      await this.runSecondaryQcFromCheckpoint();
    }

    async runSecondaryQcFromCheckpoint(cancelCheck) {
      const activeCancelCheck = typeof cancelCheck === 'function' ? cancelCheck : this.getListAbortCheck();
      await waitForPageReady(activeCancelCheck);
      const checkpoint = this.runtime.secondaryQc.checkpoint;
      if (!checkpoint || checkpoint.status !== 'running') {
        this.runtime.running = false;
        this.runtime.jobType = '';
        this.render();
        return;
      }
      const items = this.getCheckpointItems(checkpoint);
      if (!items.length) {
        throw new Error('当前二次质检任务没有可处理的品类');
      }
      checkpoint.itemTargetCounts = normalizeSecondaryQcItemTargetCounts(checkpoint.itemTargetCounts, items.length, checkpoint.targetCount);
      checkpoint.itemRecordedCounts = normalizeSecondaryQcItemRecordedCounts(checkpoint.itemRecordedCounts, checkpoint.itemKeys, checkpoint.itemTargetCounts, checkpoint.rows);
      if (!checkpoint.itemTargetCounts.length || !checkpoint.itemRecordedCounts.length) {
        throw new Error('二次质检任务进度数据无效，请重新开始');
      }

      while (checkpoint.currentItemIndex < items.length) {
        this.ensureNotStopped();
        const itemIndex = checkpoint.currentItemIndex;
        const item = items[itemIndex];
        const itemTargetCount = checkpoint.itemTargetCounts[itemIndex] || 0;
        const itemRecordedCount = checkpoint.itemRecordedCounts[itemIndex] || 0;
        if (!itemTargetCount) {
          this.pushLog(`${this.describeItem(item)}：分配 0 条，跳过`);
          checkpoint.currentItemIndex += 1;
          await this.saveCheckpoint('secondaryQc');
          continue;
        }
        if (itemRecordedCount >= itemTargetCount) {
          checkpoint.currentItemIndex += 1;
          await this.saveCheckpoint('secondaryQc');
          continue;
        }
        this.updateCheckpointStatus(
          `正在质检 ${item.exportLabel}`,
          `${itemIndex + 1}/${items.length} · 本品类 ${itemRecordedCount}/${itemTargetCount} · 总计 ${checkpoint.rows.length}/${checkpoint.targetCount}`
        );
        await this.saveCheckpoint('secondaryQc');
        await this.processSecondaryQcItem(item, itemIndex, activeCancelCheck);
        checkpoint.currentItemIndex += 1;
        await this.saveCheckpoint('secondaryQc');
      }

      await this.completeSecondaryQcJob();
    }

    async processSecondaryQcItem(item, itemIndex, cancelCheck) {
      const checkpoint = this.runtime.secondaryQc.checkpoint;
      const activeCancelCheck = typeof cancelCheck === 'function' ? cancelCheck : this.getListAbortCheck();
      const range = buildDatePeriodRange(checkpoint.startDate, checkpoint.endDate || checkpoint.startDate);
      const itemTargetCount = checkpoint.itemTargetCounts[itemIndex] || 0;
      const itemRecordedCount = checkpoint.itemRecordedCounts[itemIndex] || 0;
      if (!itemTargetCount || itemRecordedCount >= itemTargetCount) {
        return;
      }

      await clickResetButton();
      await this.applyCategory(item, activeCancelCheck);
      await setDateRange('创建时间', range.start, range.end, activeCancelCheck);
      await this.applySelectByLabel('标准化状态', '标准化通过', activeCancelCheck);

      const queryCount = await clickQueryAndReadCount(activeCancelCheck);
      if (!queryCount) {
        this.pushLog(`${this.describeItem(item)}：当前筛选下没有数据`);
        return;
      }

      const pageSize = getPagerPageSize() || 50;
      const totalRecords = getPagerTotalRecords() || queryCount;
      const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
      this.pushLog(`${this.describeItem(item)}：命中 ${totalRecords} 条，本品类目标 ${itemTargetCount} 条，共 ${totalPages} 页，开始从最后一页倒序扫描`);

      await gotoListPageNumber(totalPages, activeCancelCheck);

      for (let pageNumber = totalPages; pageNumber >= 1; pageNumber -= 1) {
        if ((checkpoint.itemRecordedCounts[itemIndex] || 0) >= itemTargetCount || checkpoint.rows.length >= checkpoint.targetCount) {
          return;
        }
        if (getPagerCurrentPage() !== pageNumber) {
          await gotoListPageNumber(pageNumber, activeCancelCheck);
        }
        await this.scanCurrentSecondaryQcPage(item, itemIndex, pageNumber, totalPages, activeCancelCheck);
      }
    }

    async scanCurrentSecondaryQcPage(item, itemIndex, pageNumber, totalPages, cancelCheck) {
      const checkpoint = this.runtime.secondaryQc.checkpoint;
      const itemTargetCount = checkpoint.itemTargetCounts[itemIndex] || 0;
      const localSeen = new Set();
      const body = getListBodyScrollElement();
      if (body) {
        await scrollListBodyTo(body.scrollHeight);
      }

      let reachedTop = false;
      while (!reachedTop && checkpoint.rows.length < checkpoint.targetCount && (checkpoint.itemRecordedCounts[itemIndex] || 0) < itemTargetCount) {
        this.ensureNotStopped();
        const rows = parseCurrentListRows().filter((row) => row && row.taskId);
        for (let index = rows.length - 1; index >= 0; index -= 1) {
          this.ensureNotStopped();
          if (checkpoint.rows.length >= checkpoint.targetCount || (checkpoint.itemRecordedCounts[itemIndex] || 0) >= itemTargetCount) {
            return;
          }
          const row = rows[index];
          if (!row.taskId || localSeen.has(row.taskId) || checkpoint.processedTaskIds.includes(row.taskId)) {
            continue;
          }
          localSeen.add(row.taskId);
          await this.handleSecondaryQcRow(item, itemIndex, row, pageNumber, totalPages, cancelCheck);
          checkpoint.processedTaskIds.push(row.taskId);
          await this.saveCheckpoint('secondaryQc');
        }

        if (!body) {
          break;
        }
        if (body.scrollTop <= 0) {
          reachedTop = true;
          break;
        }
        const nextTop = Math.max(0, body.scrollTop - Math.max(200, Math.floor(body.clientHeight * 0.8)));
        reachedTop = nextTop === body.scrollTop || nextTop === 0;
        await scrollListBodyTo(nextTop);
      }
    }

    async handleSecondaryQcRow(item, itemIndex, row, pageNumber, totalPages, cancelCheck) {
      const checkpoint = this.runtime.secondaryQc.checkpoint;
      const activeCancelCheck = typeof cancelCheck === 'function' ? cancelCheck : this.getListAbortCheck();
      const apiKey = normalizeText(this.settings.secrets.dashscopeApiKey);
      const requestId = createRuntimeToken('qc');
      const requestKey = buildSecondaryQcWorkerRequestKey(requestId);
      const responseKey = buildSecondaryQcWorkerResponseKey(requestId);
      const progressKey = buildSecondaryQcWorkerProgressKey(requestId);
      const detailUrl = `${location.origin}/stdDetail/${encodeURIComponent(row.taskId)}?select_type=2&ysp_qc_request=${encodeURIComponent(requestId)}`;

      let response = null;
      try {
        await storageRemove([responseKey, progressKey]);
        await storageSetCached({
          [requestKey]: {
            requestId,
            apiKey,
            taskId: row.taskId,
            standardOperator: row.standardOperator,
            qcOperator: checkpoint.qcOperator,
            createdAt: new Date().toISOString()
          },
          [STORAGE_KEYS.secondaryQcWorkerActiveRequest]: requestId
        });

        this.ensureNotStopped();
        this.pushLog(`${this.describeItem(item)}：第 ${pageNumber}/${totalPages} 页处理 ${row.taskId}`);
        const openedWindow = window.open(detailUrl, '_blank');
        if (!openedWindow) {
          const anchor = document.createElement('a');
          anchor.href = detailUrl;
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
          anchor.click();
        }

        let lastProgressText = '';
        response = await waitForSecondaryQcWorkerResponse(
          requestId,
          WORKER_RESPONSE_TIMEOUT,
          (progress) => {
            const progressText = normalizeText(progress && progress.text);
            if (!progressText || progressText === lastProgressText) {
              return;
            }
            lastProgressText = progressText;
            this.pushLog(`${row.taskId}：${progressText}`);
          },
          activeCancelCheck
        );
      } catch (error) {
        const message = error && error.message ? error.message : String(error);
        if (message === '采集已结束') {
          throw error;
        }
        throw new Error(prefixTaskError(row.taskId, message));
      } finally {
        await storageRemove([requestKey, responseKey, progressKey]);
        await clearSecondaryQcWorkerActiveRequest(requestId);
      }

      if (!response) {
        throw new Error(prefixTaskError(row.taskId, '未收到详情页结果'));
      }
      if (response.status === 'error') {
        throw new Error(prefixTaskError(row.taskId, response.error));
      }

      if (response.skipped && response.skipReason === 'long_video') {
        this.pushLog(
          `${row.taskId}：长视频跳过${response.durationSeconds ? `（${formatDurationSeconds(response.durationSeconds)}）` : ''}`
        );
        return;
      }

      const needRecord = normalizeBooleanFlag(response.needRecord);
      const problemText = normalizeText(response.problemText);
      if (!needRecord) {
        this.pushLog(`${row.taskId}：未发现问题`);
        return;
      }
      if (!problemText) {
        throw new Error(prefixTaskError(row.taskId, '模型判定需要记录，但未返回问题文本'));
      }

      checkpoint.rows.push({
        vid: row.taskId,
        problem: problemText,
        standardOperator: row.standardOperator,
        qcOperator: checkpoint.qcOperator,
        itemKey: item.key
      });
      checkpoint.itemRecordedCounts[itemIndex] = (checkpoint.itemRecordedCounts[itemIndex] || 0) + 1;
      await this.saveCheckpoint('secondaryQc');
      this.pushLog(
        `${row.taskId}：已记录问题 ${problemText}（${checkpoint.itemRecordedCounts[itemIndex]}/${checkpoint.itemTargetCounts[itemIndex] || 0}）`
      );
    }

    async completeSecondaryQcJob() {
      const checkpoint = this.runtime.secondaryQc.checkpoint;
      const rows = checkpoint.rows.slice(0, checkpoint.targetCount);
      const report = {
        version: 1,
        startDate: checkpoint.startDate,
        endDate: checkpoint.endDate || checkpoint.startDate,
        targetCount: checkpoint.targetCount,
        actualCount: rows.length,
        fileName: `二次质检 ${checkpoint.startDate === checkpoint.endDate ? checkpoint.startDate : `${checkpoint.startDate}-${checkpoint.endDate}`}`,
        rows: createSecondaryQcExportRows(rows),
        generatedAt: new Date().toISOString()
      };
      this.runtime.secondaryQc.report = report;
      await storageSetCached({
        [STORAGE_KEYS.secondaryQcReport]: report
      });
      await this.clearCheckpoint('secondaryQc');
      this.runtime.running = false;
      this.runtime.jobType = '';
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.runtime.statusText = `二次质检完成，目标 ${checkpoint.targetCount} 条，实际 ${rows.length} 条`;
      this.pushLog(`二次质检完成，目标 ${checkpoint.targetCount} 条，实际 ${rows.length} 条`);
      this.render();
    }

    async applyCategory(item, cancelCheck) {
      const activeCancelCheck = typeof cancelCheck === 'function' ? cancelCheck : this.getListAbortCheck();
      const primary = getCategoryWrapper(0);
      if (!primary) {
        throw new Error('未找到品类选项');
      }
      await selectOption(primary, item.queryLabel, activeCancelCheck);
      this.pushLog(`已选择品类：${this.describeItem(item)}`);
    }

    async applySelectByLabel(label, value, cancelCheck) {
      const activeCancelCheck = typeof cancelCheck === 'function' ? cancelCheck : this.getListAbortCheck();
      const wrapper = getSelectWrapperByLabel(label, 0);
      if (!wrapper) {
        throw new Error(`未找到筛选条件：${label}`);
      }
      await selectOption(wrapper, value, activeCancelCheck);
    }

    async failJob(error) {
      const message = error && error.message ? error.message : String(error);
      const paused = message === '采集已暂停';
      const stopped = message === '采集已结束';
      if (stopped && !this.runtime.running && !this.runtime.jobType) {
        return;
      }
      const checkpoint = this.getActiveCheckpoint();
      if (checkpoint) {
        checkpoint.status = paused ? 'paused' : stopped ? 'stopped' : 'error';
        checkpoint.statusText = paused
          ? '任务已暂停，可点击继续任务'
          : stopped
            ? '采集已结束，可以重新开始'
            : `任务遇到问题：${message}`;
        await this.saveCheckpoint(this.runtime.jobType || 'daily');
      }
      this.runtime.running = false;
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.runtime.statusText = paused
        ? '任务已暂停，可点击继续任务'
        : stopped
          ? '采集已结束，可以重新开始'
          : `任务遇到问题：${message}`;
      this.pushLog(
        paused
          ? '任务已暂停'
          : stopped
            ? '采集已结束'
            : `任务遇到问题：${message}`
      );
      this.runtime.jobType = '';
      this.render();
    }

    exportDailyReport() {
      if (!this.runtime.daily.report) {
        this.pushLog('当前没有可下载的日报');
        return;
      }
      downloadReport(this.runtime.daily.report);
      this.pushLog(`已导出日报：${formatReportPeriod(this.runtime.daily.report)}`);
    }

    exportSecondaryQcResult() {
      if (!this.runtime.secondaryQc.report) {
        this.pushLog('当前没有可下载的二次质检结果');
        return;
      }
      exportSecondaryQcReport(this.runtime.secondaryQc.report);
      this.pushLog(`已导出二次质检结果：目标 ${this.runtime.secondaryQc.report.targetCount} 条，实际 ${this.runtime.secondaryQc.report.actualCount} 条`);
    }
  }

  let app = null;
  let booting = false;
  let lastHref = location.href;
  let lastPageKind = '';
  let activeWorkerRequestId = '';
  let activeMediaWorkerRequestId = '';

  async function ensureWorkbenchMounted() {
    if (!isSupportedPage()) {
      if (app) {
        app.destroy();
        app = null;
      }
      return 'destroyed';
    }
    await waitForBodyReady();
    if (!app) {
      app = new YspWorkbenchApp();
      await app.init();
      return 'created';
    }
    if (!document.getElementById('ysp-daily-panel-root')) {
      app.mountPanel();
      if (isListPage()) {
        await app.tryResume();
      } else {
        app.render();
      }
      return 'remounted';
    }
    return 'noop';
  }

  async function ensureDetailWorkerHandled() {
    if (!isDetailPage()) {
      activeWorkerRequestId = '';
      return;
    }
    const requestId = getSecondaryQcWorkerRequestIdFromLocation();
    if (!requestId || requestId === activeWorkerRequestId) {
      return;
    }
    activeWorkerRequestId = requestId;
    await runSecondaryQcDetailWorker(requestId);
  }

  async function ensureYangshipinMediaWorkerHandled() {
    if (!isYangshipinMediaWorkerPage()) {
      activeMediaWorkerRequestId = '';
      return;
    }
    const requestId = getSecondaryQcMediaWorkerRequestIdFromLocation();
    if (!requestId || requestId === activeMediaWorkerRequestId) {
      return;
    }
    activeMediaWorkerRequestId = requestId;
    await runSecondaryQcMediaWorker(requestId);
  }

  async function runBootstrap() {
    if (booting) {
      return;
    }
    booting = true;
    try {
      if (isYangshipinMediaWorkerPage()) {
        lastPageKind = 'media';
        await ensureYangshipinMediaWorkerHandled();
        return;
      }
      if (!isSupportedPage()) {
        lastPageKind = 'unsupported';
        if (app) {
          app.destroy();
          app = null;
        }
        return;
      }
      const currentPageKind = isDetailPage() ? 'detail' : 'list';
      const mountState = await ensureWorkbenchMounted();
      if (isDetailPage()) {
        lastPageKind = currentPageKind;
        await ensureDetailWorkerHandled();
        return;
      }
      if (currentPageKind === 'list' && lastPageKind !== 'list' && mountState === 'noop' && app) {
        await app.tryResume();
      }
      lastPageKind = currentPageKind;
    } catch (error) {
      console.error('[央视频标准化工作台]', error);
    } finally {
      booting = false;
    }
  }

  function queueBootstrap() {
    window.setTimeout(() => {
      runBootstrap();
    }, 60);
  }

  function installRouteHooks() {
    const methods = ['pushState', 'replaceState'];
    for (const method of methods) {
      const original = history[method];
      history[method] = function wrappedHistoryMethod(...args) {
        const result = original.apply(this, args);
        window.dispatchEvent(new Event('ysp:location-change'));
        return result;
      };
    }

    const onLocationChange = () => {
      if (location.href === lastHref && document.getElementById('ysp-daily-panel-root')) {
        return;
      }
      lastHref = location.href;
      queueBootstrap();
    };

    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    window.addEventListener('ysp:location-change', onLocationChange);

    const observer = new MutationObserver(() => {
      if (!isSupportedPage()) {
        return;
      }
      if (!document.getElementById('ysp-daily-panel-root')) {
        queueBootstrap();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  installRouteHooks();
  runBootstrap();
})();
