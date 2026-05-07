// ==UserScript==
// @name         央视频日报采集器
// @namespace    https://github.com/Noah-Wu66/CPEC-EXT
// @version      2.3.1
// @description  在标准化系统页面采集日报数据，并保存结果
// @author       Noah
// @match        http://std.video.cloud.cctv.com/*
// @match        https://std.video.cloud.cctv.com/*
// @updateURL    https://gh-proxy.com/https://raw.githubusercontent.com/Noah-Wu66/CPEC-EXT/main/ysp/daily.user.js
// @downloadURL  https://gh-proxy.com/https://raw.githubusercontent.com/Noah-Wu66/CPEC-EXT/main/ysp/daily.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_info
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  if (window.__YSP_DAILY_REPORT__) {
    return;
  }
  window.__YSP_DAILY_REPORT__ = true;

  const SCRIPT_VERSION = GM_info.script.version;
  const PANEL_STYLE = `
#ysp-daily-report-panel-root {
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

#ysp-daily-report-panel-root.is-settings-open {
  pointer-events: auto;
}

.ysp-daily-panel__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(8, 24, 40, 0.16);
  transition: background 0.22s ease;
}

#ysp-daily-report-panel-root.is-focused .ysp-daily-panel__backdrop {
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

#ysp-daily-report-panel-root.is-minimized {
  justify-content: flex-end;
}

#ysp-daily-report-panel-root.is-minimized .ysp-daily-panel__backdrop {
  opacity: 0;
  pointer-events: none;
}

#ysp-daily-report-panel-root.is-minimized .ysp-daily-panel {
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
  grid-template-columns: 1fr;
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

#ysp-daily-report-panel-root.is-minimized .ysp-daily-panel__dock {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(-50%) translateX(0);
}

@media (max-width: 1366px) {
  #ysp-daily-report-panel-root {
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

.ysp-daily-panel__popup-layer {
  position: fixed;
  inset: 0;
  z-index: 12;
  pointer-events: none;
}

.ysp-daily-panel__popup-layer > * {
  pointer-events: auto;
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
  animation: ysp-daily-panel__group-menu-in 0.18s ease;
}

@keyframes ysp-daily-panel__group-menu-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

#ysp-daily-report-panel-root.is-settings-open .ysp-daily-panel__modal-mask {
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

@media (max-width: 920px) {
  .ysp-daily-panel__field-grid,
  .ysp-daily-panel__group-grid {
    grid-template-columns: 1fr;
  }

  .ysp-daily-panel__button-row {
    flex-direction: column;
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
    settings: 'yspDailyReportSettingsV1',
    report: 'yspDailyReportReportV1',
    resultCache: 'yspDailyReportApiResultCacheV1',
    checkpoint: 'yspDailyReportApiCheckpointV1'
  };
  const MAX_LOGS = 200;
  const API_ENDPOINTS = {
    categoryList: '/api/category/category/list',
    taskList: '/api/api/task/list/std'
  };

  function createDefaultWorkbenchSettings() {
    return {
      version: 1,
      ui: { panelMinimized: true },
      startDate: getYesterdayDateString(),
      endDate: '',
      groupIds: []
    };
  }

  function normalizeDateInputValue(value, maxDateString) {
    const maxDate = normalizeText(maxDateString) || getYesterdayDateString();
    const date = normalizeText(value);
    if (!date) return '';
    return date > maxDate ? maxDate : date;
  }

  function normalizeWorkbenchSettings(rawSettings) {
    const defaults = createDefaultWorkbenchSettings();
    if (!rawSettings || typeof rawSettings !== 'object' || rawSettings.version !== defaults.version) return defaults;
    const startDate = normalizeDateInputValue(rawSettings.startDate, getYesterdayDateString()) || defaults.startDate;
    let endDate = normalizeDateInputValue(rawSettings.endDate, getYesterdayDateString());
    if (endDate && endDate < startDate) endDate = '';
    return {
      version: defaults.version,
      ui: {
        panelMinimized: rawSettings.ui && rawSettings.ui.panelMinimized !== undefined
          ? Boolean(rawSettings.ui.panelMinimized)
          : defaults.ui.panelMinimized
      },
      startDate,
      endDate,
      groupIds: normalizeSelectedGroupIds(rawSettings.groupIds)
    };
  }

  function cloneWorkbenchSettings(settings) {
    return normalizeWorkbenchSettings(JSON.parse(JSON.stringify(settings || createDefaultWorkbenchSettings())));
  }
  function injectPanelStyle() {
    GM_addStyle(PANEL_STYLE);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const JOB_ABORT_CONTROLLER = {
    listJobGeneration: 0,
    listJobStoppedGeneration: 0
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
      || checkpoint.version !== 5
      || !normalizeText(checkpoint.startDate)
      || !normalizeText(checkpoint.endDate)
      || !normalizeText(checkpoint.status)
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
      version: 5,
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
    return location.hostname === 'std.video.cloud.cctv.com' && isListPage();
  }

  function isListPage() {
    return location.pathname.startsWith('/stdList');
  }

  async function waitForBodyReady(timeoutMs) {
    return waitFor(() => document.body, timeoutMs || 15000, '页面主体未准备完成');
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

  function getCookieValue(name) {
    const target = `${encodeURIComponent(name)}=`;
    const cookies = String(document.cookie || '').split(';');
    for (const cookie of cookies) {
      const text = cookie.trim();
      if (text.startsWith(target)) {
        return decodeURIComponent(text.slice(target.length));
      }
    }
    return '';
  }

  function buildApiUrl(endpoint, params) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params || {})) {
      if (value === undefined || value === null) {
        continue;
      }
      query.set(key, String(value));
    }
    const queryText = query.toString();
    return queryText ? `${endpoint}?${queryText}` : endpoint;
  }

  function getApiErrorMessage(payload) {
    const message = normalizeText(payload && payload.msg);
    return message || '登录已失效或接口无权限，请重新登录后再试';
  }

  async function fetchApiJson(endpoint, params, options) {
    const token = getCookieValue('std_admin_token');
    if (!token) {
      throw new Error('登录已失效或接口无权限，请重新登录后再试');
    }
    const response = await fetch(buildApiUrl(endpoint, params), {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'X-Token': token
      },
      signal: options && options.signal
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error('登录已失效或接口无权限，请重新登录后再试');
    }
    if (!response.ok) {
      throw new Error(`接口请求失败：${response.status}`);
    }
    let payload = null;
    try {
      payload = JSON.parse(await response.text());
    } catch (error) {
      throw new Error('接口返回内容不是有效数据');
    }
    if (!payload || Number(payload.code) !== 0) {
      throw new Error(getApiErrorMessage(payload));
    }
    return payload;
  }

  function getApiList(payload) {
    if (payload && payload.data && Array.isArray(payload.data.list)) {
      return payload.data.list;
    }
    return [];
  }

  function readTaskTotal(payload) {
    const total = Number(payload && payload.total);
    if (!Number.isFinite(total)) {
      throw new Error('接口返回缺少数量 total');
    }
    return total;
  }

  function buildTaskDateParams(dateString, field) {
    const range = buildDateRange(dateString);
    const params = {
      create_time_begin: '',
      create_time_end: '',
      modify_time_begin: '',
      modify_time_end: ''
    };
    if (field === 'create') {
      params.create_time_begin = formatDateTime(range.start);
      params.create_time_end = formatDateTime(range.end);
    } else {
      params.modify_time_begin = formatDateTime(range.start);
      params.modify_time_end = formatDateTime(range.end);
    }
    return params;
  }

  function buildTaskListParams(categoryId, dateString, field, extraParams) {
    return {
      select_type: 2,
      ...buildTaskDateParams(dateString, field),
      type: categoryId,
      category: '',
      limit: 10000,
      allnum_op: 1,
      page: 1,
      page_size: 50,
      otype: 'json',
      jsonp: 'no',
      ...(extraParams || {})
    };
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

  function formulaCell(ref, formula, value, styleId) {
    const cachedValue = Number(value || 0);
    return `<c r="${ref}" s="${styleId}"><f>${escapeXml(formula)}</f><v>${Number.isFinite(cachedValue) ? cachedValue : 0}</v></c>`;
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
      const worksheetRowNumber = rowIndex + 3;
      const dataCells = [inlineCell(makeCellRef(1, worksheetRowNumber), formatDisplayDate(reportRow.date), 8)];

      reportRow.results.forEach((result, resultIndex) => {
        const baseColumn = 2 + resultIndex * METRIC_HEADERS.length;
        const inboundRef = makeCellRef(baseColumn, worksheetRowNumber);
        const stdTotalRef = makeCellRef(baseColumn + 1, worksheetRowNumber);
        const stdPassRef = makeCellRef(baseColumn + 2, worksheetRowNumber);
        const stdRejectRef = makeCellRef(baseColumn + 3, worksheetRowNumber);
        const stdRejectRateRef = makeCellRef(baseColumn + 4, worksheetRowNumber);
        const qcTotalRef = makeCellRef(baseColumn + 5, worksheetRowNumber);
        const qcPassRef = makeCellRef(baseColumn + 6, worksheetRowNumber);
        const qcRejectRef = makeCellRef(baseColumn + 7, worksheetRowNumber);
        const qcRejectRateRef = makeCellRef(baseColumn + 8, worksheetRowNumber);

        dataCells.push(
          numberCell(inboundRef, Number(result.inboundCount || 0), 9),
          formulaCell(stdTotalRef, `${stdPassRef}+${stdRejectRef}`, result.stdTotalCount || 0, 9),
          numberCell(stdPassRef, Number(result.stdPassCount || 0), 9),
          numberCell(stdRejectRef, Number(result.stdRejectCount || 0), 9),
          formulaCell(stdRejectRateRef, `IF(${stdTotalRef}=0,0,${stdRejectRef}/${stdTotalRef})`, result.stdRejectRate || 0, 10),
          formulaCell(qcTotalRef, `${qcPassRef}+${qcRejectRef}`, result.qcTotalCount || 0, 9),
          numberCell(qcPassRef, Number(result.qcPassCount || 0), 9),
          numberCell(qcRejectRef, Number(result.qcRejectCount || 0), 9),
          formulaCell(qcRejectRateRef, `IF(${qcTotalRef}=0,0,${qcRejectRef}/${qcTotalRef})`, result.qcRejectRate || 0, 10)
        );
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

  function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadReport(report) {
    triggerBlobDownload(buildXlsxBlob(report), `${getReportFileToken(report)}.xlsx`);
  }

  function advanceDailyCheckpointCursor(checkpoint, itemCount) {
    if (!checkpoint) {
      return;
    }
    checkpoint.currentItemIndex += 1;
    if (checkpoint.currentItemIndex >= itemCount) {
      checkpoint.currentDateIndex += 1;
      checkpoint.currentItemIndex = 0;
    }
  }

  class YspDailyReportApp {
    constructor() {
      this.panel = null;
      this.handleOutsideInteraction = null;
      this.handleViewportChange = null;
      this.settings = createDefaultWorkbenchSettings();
      this.runtime = { minimized: false, running: false, openGroupMenu: '', jobType: '', listJobAbortToken: 0, activeAbortController: null, stopping: false, pauseRequested: false, statusText: '等待开始', logs: [], checkpoint: null, report: null, resultCache: {} };
      this.refs = {};
    }

    async init() {
      if (!isSupportedPage()) return;
      injectPanelStyle();
      await this.clearExpiredCache();
      await this.loadState();
      this.mountPanel();
      if (isListPage()) await this.tryResume();
    }

    async clearExpiredCache() {
      const state = await storageGet([STORAGE_KEYS.report, STORAGE_KEYS.resultCache, STORAGE_KEYS.checkpoint]);
      const cutoffDate = getQuarterCutoffDateString(new Date());
      const nextReport = trimReportByCutoff(state[STORAGE_KEYS.report], cutoffDate);
      if (nextReport) await storageSetCached({ [STORAGE_KEYS.report]: nextReport }); else await storageRemove(STORAGE_KEYS.report);
      const nextResultCache = trimResultCacheByCutoff(normalizeStoredResultCache(state[STORAGE_KEYS.resultCache]), cutoffDate);
      if (Object.keys(nextResultCache).length) await storageSetCached({ [STORAGE_KEYS.resultCache]: nextResultCache }); else await storageRemove(STORAGE_KEYS.resultCache);
      const checkpoint = state[STORAGE_KEYS.checkpoint];
      const dateValue = checkpoint && normalizeText(checkpoint.updatedAt || checkpoint.startedAt).slice(0, 10);
      if (dateValue && isDateExpiredByQuarter(dateValue, cutoffDate)) await storageRemove(STORAGE_KEYS.checkpoint);
    }

    async loadState() {
      const state = await storageGet([STORAGE_KEYS.settings, STORAGE_KEYS.report, STORAGE_KEYS.resultCache, STORAGE_KEYS.checkpoint]);
      this.settings = normalizeWorkbenchSettings(state[STORAGE_KEYS.settings]);
      this.runtime.minimized = Boolean(this.settings.ui.panelMinimized);
      this.runtime.report = normalizeStoredReport(state[STORAGE_KEYS.report]);
      this.runtime.resultCache = normalizeStoredResultCache(state[STORAGE_KEYS.resultCache]);
      this.runtime.checkpoint = normalizeStoredCheckpoint(state[STORAGE_KEYS.checkpoint]);
      this.runtime.logs = [];
      this.runtime.statusText = '等待开始';
      this.runtime.running = false;
      this.runtime.jobType = '';
      this.runtime.listJobAbortToken = 0;
      this.runtime.activeAbortController = null;
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      if (this.runtime.checkpoint && this.runtime.checkpoint.status === 'running') {
        this.runtime.running = true;
        this.runtime.jobType = 'daily';
        this.runtime.listJobAbortToken = beginListJobAbortSession();
        this.runtime.logs = Array.isArray(this.runtime.checkpoint.logs) ? this.runtime.checkpoint.logs.slice(0, MAX_LOGS) : [];
        this.runtime.statusText = this.runtime.checkpoint.statusText || '检测到未完成日报，正在准备继续';
        return;
      }
      if (this.runtime.checkpoint && this.runtime.checkpoint.status === 'paused') {
        this.runtime.statusText = this.runtime.checkpoint.statusText || '存在已暂停日报，可点击继续任务';
        this.runtime.logs = Array.isArray(this.runtime.checkpoint.logs) ? this.runtime.checkpoint.logs.slice(0, MAX_LOGS) : [];
        return;
      }
      if (this.runtime.checkpoint && this.runtime.checkpoint.statusText) {
        this.runtime.statusText = this.runtime.checkpoint.statusText;
        this.runtime.logs = Array.isArray(this.runtime.checkpoint.logs) ? this.runtime.checkpoint.logs.slice(0, MAX_LOGS) : [];
      }
    }

    mountPanel() {
      const existing = document.getElementById('ysp-daily-report-panel-root');
      if (existing) existing.remove();
      const root = document.createElement('div');
      root.id = 'ysp-daily-report-panel-root';
      root.innerHTML = `
        <div class="ysp-daily-panel__backdrop"></div>
        <div class="ysp-daily-panel__popup-layer" data-role="popup-layer"></div>
        <div class="ysp-daily-panel">
          <div class="ysp-daily-panel__header"><div class="ysp-daily-panel__header-top"><div><div class="ysp-daily-panel__title">央视频日报采集器</div></div><div class="ysp-daily-panel__header-actions"><div class="ysp-daily-panel__header-chip">v${SCRIPT_VERSION}</div><button type="button" class="ysp-daily-panel__header-chip" data-role="minimize">收起</button></div></div></div>
          <div class="ysp-daily-panel__body">
            <div class="ysp-daily-panel__main"><section class="ysp-daily-panel__module"><div class="ysp-daily-panel__module-body"><div class="ysp-daily-panel__field-grid"><label class="ysp-daily-panel__date-field" for="ysp-daily-start-date"><span class="ysp-daily-panel__date-caption">开始日期</span><input id="ysp-daily-start-date" class="ysp-daily-panel__date" type="date" /></label><label class="ysp-daily-panel__date-field" for="ysp-daily-end-date"><span class="ysp-daily-panel__date-caption">结束日期</span><input id="ysp-daily-end-date" class="ysp-daily-panel__date" type="date" /></label></div><div class="ysp-daily-panel__field"><span class="ysp-daily-panel__label">品类编组</span><div data-role="daily-groups"></div></div><div class="ysp-daily-panel__actions"><button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--primary" data-role="start-daily">开始日报</button></div></div></section></div>
            <div class="ysp-daily-panel__side"><div class="ysp-daily-panel__status" data-role="status"></div><div class="ysp-daily-panel__log-card"><div class="ysp-daily-panel__toolbar"><span class="ysp-daily-panel__label">运行日志</span></div><div class="ysp-daily-panel__log-list" data-role="logs"></div></div><div class="ysp-daily-panel__result-card" data-role="downloads-card" hidden><div class="ysp-daily-panel__toolbar"><span class="ysp-daily-panel__label">下载中心</span></div><div class="ysp-daily-panel__download-list" data-role="downloads"></div></div><div class="ysp-daily-panel__actions"><button type="button" class="ysp-daily-panel__button" data-role="pause-resume">暂停任务</button><button type="button" class="ysp-daily-panel__button" data-role="stop">结束任务</button><button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--danger" data-role="clear-data">清理缓存</button></div></div>
          </div>
        </div>
        <button type="button" class="ysp-daily-panel__dock" data-role="dock"><</button>`;
      document.body.appendChild(root);
      this.panel = root;
      this.refs = { backdrop: root.querySelector('.ysp-daily-panel__backdrop'), popupLayer: root.querySelector('[data-role="popup-layer"]'), surface: root.querySelector('.ysp-daily-panel'), dock: root.querySelector('[data-role="dock"]'), minimize: root.querySelector('[data-role="minimize"]'), dailyStartDate: root.querySelector('#ysp-daily-start-date'), dailyEndDate: root.querySelector('#ysp-daily-end-date'), dailyGroups: root.querySelector('[data-role="daily-groups"]'), startDaily: root.querySelector('[data-role="start-daily"]'), pauseResume: root.querySelector('[data-role="pause-resume"]'), stop: root.querySelector('[data-role="stop"]'), clearData: root.querySelector('[data-role="clear-data"]'), status: root.querySelector('[data-role="status"]'), downloadsCard: root.querySelector('[data-role="downloads-card"]'), downloads: root.querySelector('[data-role="downloads"]'), logs: root.querySelector('[data-role="logs"]') };
      this.bindPanelEvents();
      this.syncSettingsToInputs();
      this.render();
    }

    destroy() {
      if (this.handleOutsideInteraction) { document.removeEventListener('pointerdown', this.handleOutsideInteraction, true); document.removeEventListener('mousedown', this.handleOutsideInteraction, true); document.removeEventListener('touchstart', this.handleOutsideInteraction, true); this.handleOutsideInteraction = null; }
      if (this.handleViewportChange) { window.removeEventListener('resize', this.handleViewportChange); this.handleViewportChange = null; }
      if (this.panel && this.panel.isConnected) this.panel.remove();
      this.panel = null;
      this.refs = {};
    }

    persistActiveCheckpoint() { const checkpoint = this.getActiveCheckpoint(); return checkpoint && this.runtime.jobType ? this.saveCheckpoint() : Promise.resolve(); }
    getActiveCheckpoint() { return this.runtime.jobType === 'daily' ? this.runtime.checkpoint : null; }
    getListAbortCheck() { const abortToken = this.runtime.listJobAbortToken; return () => isListJobAbortRequested(abortToken); }
    getPausedTaskMeta() { return this.runtime.checkpoint && this.runtime.checkpoint.status === 'paused' ? { jobType: 'daily', label: '日报', checkpoint: this.runtime.checkpoint, updatedAt: this.runtime.checkpoint.updatedAt || this.runtime.checkpoint.startedAt || '' } : null; }
    getSelectedGroupEntries() { return getSubgroupEntriesByIds(this.settings.groupIds); }
    getSelectedEntries() { return getEntriesByGroupIds(this.settings.groupIds); }
    getCheckpointItems(checkpoint) { return getEntriesByKeys(checkpoint && checkpoint.itemKeys); }
    formatGroupEntryLabel(entry) { return entry ? `${entry.groupLabel} / ${entry.label}` : ''; }
    getGroupPickerSummary() { const entries = this.getSelectedGroupEntries(); if (!entries.length) return '请选择品类编组'; return entries.length === 1 ? this.formatGroupEntryLabel(entries[0]) : `已选 ${entries.length} 个编组`; }
    getGroupTriggerElement() { return this.refs.dailyGroups ? this.refs.dailyGroups.querySelector('[data-role="group-trigger"]') : null; }

    getGroupMenuLayout() {
      const trigger = this.getGroupTriggerElement();
      if (!trigger) return null;
      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 12;
      const gap = 8;
      const width = Math.min(Math.max(Math.round(rect.width), 360), Math.max(320, window.innerWidth - viewportPadding * 2));
      const left = Math.min(Math.max(viewportPadding, Math.round(rect.left)), Math.max(viewportPadding, window.innerWidth - width - viewportPadding));
      const preferredHeight = 360;
      const belowSpace = Math.max(160, Math.floor(window.innerHeight - rect.bottom - gap - viewportPadding));
      const aboveSpace = Math.max(160, Math.floor(rect.top - gap - viewportPadding));
      const openUpward = belowSpace < 220 && aboveSpace > belowSpace;
      return { left, width, maxHeight: Math.min(preferredHeight, openUpward ? aboveSpace : belowSpace), top: openUpward ? null : Math.round(rect.bottom + gap), bottom: openUpward ? Math.round(window.innerHeight - rect.top + gap) : null };
    }

    renderFloatingGroupMenu() {
      if (!this.refs.popupLayer) return;
      if (!this.runtime.openGroupMenu || this.runtime.running || this.runtime.minimized) { this.refs.popupLayer.innerHTML = ''; return; }
      const layout = this.getGroupMenuLayout();
      if (!layout) { this.refs.popupLayer.innerHTML = ''; return; }
      const styleTokens = [`--menu-left:${layout.left}px`, `--menu-width:${layout.width}px`, `--menu-max-height:${layout.maxHeight}px`, layout.top === null ? 'top:auto' : `top:${layout.top}px`, layout.bottom === null ? 'bottom:auto' : `bottom:${layout.bottom}px`];
      const selected = new Set(this.settings.groupIds);
      this.refs.popupLayer.innerHTML = `<div class="ysp-daily-panel__group-menu" data-role="group-menu" role="listbox" aria-label="品类编组选项" style="${styleTokens.join(';')}">${SUBGROUP_ENTRIES.map((subgroup) => { const selectedClass = selected.has(subgroup.id) ? ' is-selected' : ''; return `<button type="button" class="ysp-daily-panel__group-option${selectedClass}" data-theme="${escapeXml(subgroup.theme)}" data-role="group-option" data-group-id="${escapeXml(subgroup.id)}" ${this.runtime.running ? 'disabled' : ''}><span class="ysp-daily-panel__group-option-copy"><span class="ysp-daily-panel__group-option-meta">${escapeXml(subgroup.groupLabel)}</span><span class="ysp-daily-panel__group-option-label">${escapeXml(subgroup.label)}</span></span><span class="ysp-daily-panel__group-option-check">${selected.has(subgroup.id) ? '已选' : '选择'}</span></button>`; }).join('')}</div>`;
    }

    async persistSettings() { await storageSetCached({ [STORAGE_KEYS.settings]: cloneWorkbenchSettings(this.settings) }); }
    syncSettingsToInputs() { const maxDate = getYesterdayDateString(); this.refs.dailyStartDate.max = maxDate; this.refs.dailyEndDate.max = maxDate; this.refs.dailyEndDate.min = this.settings.startDate || ''; this.refs.dailyStartDate.value = this.settings.startDate || ''; this.refs.dailyEndDate.value = this.settings.endDate || ''; }

    bindDateInput(input, handler) {
      input.setAttribute('inputmode', 'none');
      input.addEventListener('click', () => this.openDatePicker(input));
      input.addEventListener('focus', () => window.setTimeout(() => this.openDatePicker(input), 0));
      input.addEventListener('keydown', (event) => { if (event.key === 'Tab') return; event.preventDefault(); if (event.key === 'Enter' || event.key === ' ') this.openDatePicker(input); });
      input.addEventListener('beforeinput', (event) => event.preventDefault());
      input.addEventListener('paste', (event) => event.preventDefault());
      input.addEventListener('drop', (event) => event.preventDefault());
      input.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });
      input.addEventListener('change', handler);
    }

    bindPanelEvents() {
      if (this.handleOutsideInteraction) { document.removeEventListener('pointerdown', this.handleOutsideInteraction, true); document.removeEventListener('mousedown', this.handleOutsideInteraction, true); document.removeEventListener('touchstart', this.handleOutsideInteraction, true); }
      this.handleOutsideInteraction = (event) => { if (this.runtime.minimized || event.isTrusted === false) return; const target = event.target; if (!(target instanceof Node)) return; if (this.refs.surface && this.refs.surface.contains(target)) return; if (this.refs.popupLayer && this.refs.popupLayer.contains(target)) return; this.setMinimized(true); };
      document.addEventListener('pointerdown', this.handleOutsideInteraction, true);
      document.addEventListener('mousedown', this.handleOutsideInteraction, true);
      document.addEventListener('touchstart', this.handleOutsideInteraction, true);
      this.refs.backdrop.addEventListener('click', () => this.setMinimized(true));
      this.refs.minimize.addEventListener('click', () => this.setMinimized(true));
      this.refs.dock.addEventListener('click', () => this.setMinimized(false));
      this.bindDateInput(this.refs.dailyStartDate, () => this.updateDate('startDate', this.refs.dailyStartDate.value));
      this.bindDateInput(this.refs.dailyEndDate, () => this.updateDate('endDate', this.refs.dailyEndDate.value));
      this.refs.dailyGroups.addEventListener('click', (event) => this.handleGroupSelection(event));
      this.refs.popupLayer.addEventListener('click', (event) => this.handleGroupSelection(event));
      this.refs.surface.addEventListener('click', (event) => { const target = event.target; if (!(target instanceof HTMLElement) || target.closest('[data-role="group-picker"]')) return; if (this.runtime.openGroupMenu) { this.runtime.openGroupMenu = ''; this.render(); } });
      this.refs.surface.addEventListener('scroll', () => { if (this.runtime.openGroupMenu) this.render(); }, true);
      if (this.handleViewportChange) window.removeEventListener('resize', this.handleViewportChange);
      this.handleViewportChange = () => { if (this.runtime.openGroupMenu) this.render(); };
      window.addEventListener('resize', this.handleViewportChange);
      this.refs.startDaily.addEventListener('click', () => this.startDailyJob().catch((error) => this.failJob(error)));
      this.refs.pauseResume.addEventListener('click', () => this.handlePauseResumeAction().catch((error) => this.failJob(error)));
      this.refs.stop.addEventListener('click', () => this.stopCurrentJob().catch((error) => this.failJob(error)));
      this.refs.clearData.addEventListener('click', () => this.clearAllCachedData().catch((error) => this.failJob(error)));
      this.refs.downloads.addEventListener('click', (event) => { const target = event.target; if (target instanceof HTMLElement && target.closest('[data-download-role="daily"]')) this.exportDailyReport(); });
    }

    handleGroupSelection(event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const trigger = target.closest('[data-role="group-trigger"]');
      if (trigger) { if (this.runtime.running) return; this.runtime.openGroupMenu = this.runtime.openGroupMenu ? '' : 'daily'; this.render(); return; }
      if (this.runtime.running) return;
      const groupOption = target.closest('[data-role="group-option"]');
      if (!groupOption) return;
      const groupId = groupOption.getAttribute('data-group-id');
      if (!groupId) return;
      const groupIds = new Set(this.settings.groupIds);
      if (groupIds.has(groupId)) groupIds.delete(groupId); else groupIds.add(groupId);
      this.settings.groupIds = Array.from(groupIds);
      this.persistSettings().catch(() => undefined);
      this.render();
    }

    openDatePicker(input) { if (!input || input.disabled) return; if (typeof input.showPicker === 'function') { try { input.showPicker(); return; } catch (error) { } } input.focus(); }
    updateDate(key, value) { const maxDate = getYesterdayDateString(); const normalizedValue = normalizeDateInputValue(value, maxDate); if (key === 'startDate') { this.settings.startDate = normalizedValue || maxDate; if (this.settings.endDate && this.settings.startDate && this.settings.endDate < this.settings.startDate) this.settings.endDate = ''; } else { this.settings.endDate = normalizedValue; if (this.settings.endDate && this.settings.startDate && this.settings.endDate < this.settings.startDate) this.settings.endDate = ''; } this.persistSettings().catch(() => undefined); this.render(); }
    setMinimized(nextValue) { this.runtime.minimized = Boolean(nextValue); this.settings.ui.panelMinimized = this.runtime.minimized; if (this.runtime.minimized) this.runtime.openGroupMenu = ''; this.persistSettings().catch(() => undefined); this.render(); }
    renderGroupSelector() { const open = !this.runtime.running && this.runtime.openGroupMenu === 'daily'; const triggerSummary = this.getGroupPickerSummary(); this.refs.dailyGroups.innerHTML = `<div class="ysp-daily-panel__group-picker${open ? ' is-open' : ''}" data-role="group-picker"><button type="button" class="ysp-daily-panel__group-trigger" data-role="group-trigger" aria-expanded="${open ? 'true' : 'false'}" title="${escapeXml(triggerSummary)}" ${this.runtime.running ? 'disabled' : ''}><span class="ysp-daily-panel__group-trigger-text">${escapeXml(triggerSummary)}</span><span class="ysp-daily-panel__group-trigger-icon">${open ? '▲' : '▼'}</span></button></div>`; }
    renderStatus() { const pageText = isListPage() ? '当前页面：列表页' : '当前页面：其他页面'; this.refs.status.innerHTML = `<div class="ysp-daily-panel__status-head"><span class="ysp-daily-panel__label">当前状态</span></div><div class="ysp-daily-panel__status-value">${escapeXml(this.runtime.statusText || '等待开始')}</div><div class="ysp-daily-panel__status-subtext">任务类型：日报</div><div class="ysp-daily-panel__status-subtext">${escapeXml(pageText)}</div>`; }
    renderDownloads() { const cards = []; if (this.runtime.report) cards.push(`<div style="padding: 12px; border: 1px solid #d8e2ee; border-radius: 12px; background: #fff;"><div style="font-weight: 700; color: #17324f;">日报结果</div><div style="margin-top: 6px; color: #6b7a90;">${escapeXml(formatReportPeriod(this.runtime.report))}</div><div class="ysp-daily-panel__actions" style="margin-top: 10px;"><button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--primary" data-download-role="daily">下载日报</button></div></div>`); this.refs.downloadsCard.hidden = !cards.length; this.refs.downloads.innerHTML = cards.join(''); }
    renderLogs() { if (!this.runtime.logs.length) { this.refs.logs.innerHTML = '<div class="ysp-daily-panel__report-empty">暂无日志</div>'; return; } this.refs.logs.innerHTML = this.runtime.logs.map((log) => `<div class="ysp-daily-panel__log-entry">${escapeXml(log)}</div>`).join(''); this.refs.logs.scrollTop = this.refs.logs.scrollHeight; }
    render() { if (!this.panel) return; if (this.runtime.running && this.runtime.openGroupMenu) this.runtime.openGroupMenu = ''; const listPageActive = isListPage(); this.panel.classList.toggle('is-minimized', this.runtime.minimized); this.syncSettingsToInputs(); this.renderGroupSelector(); this.renderFloatingGroupMenu(); const disabled = this.runtime.running; this.refs.dailyStartDate.disabled = disabled; this.refs.dailyEndDate.disabled = disabled; this.refs.startDaily.disabled = disabled || !listPageActive; this.refs.clearData.disabled = disabled; this.refs.stop.disabled = !disabled; const pausedTask = this.getPausedTaskMeta(); this.refs.pauseResume.disabled = !disabled && (!pausedTask || !listPageActive); this.refs.pauseResume.textContent = disabled ? '暂停任务' : pausedTask ? '继续日报' : '继续任务'; this.refs.pauseResume.classList.toggle('ysp-daily-panel__button--primary', !disabled && Boolean(pausedTask)); this.refs.startDaily.textContent = disabled ? '日报运行中' : '开始日报'; this.renderStatus(); this.renderDownloads(); this.renderLogs(); }
    pushLog(message) { this.runtime.logs = mergeLogEntries(this.runtime.logs, [message]); const checkpoint = this.getActiveCheckpoint(); if (checkpoint) checkpoint.logs = this.runtime.logs.slice(); this.renderLogs(); void this.persistActiveCheckpoint().catch(() => {}); }
    ensureNotStopped() { if (this.isCurrentJobStopRequested()) throw new Error('采集已结束'); if (this.runtime.pauseRequested) throw new Error('采集已暂停'); }
    updateCheckpointStatus(text) { const checkpoint = this.getActiveCheckpoint(); this.runtime.statusText = text; if (checkpoint) checkpoint.statusText = text; this.renderStatus(); void this.persistActiveCheckpoint().catch(() => {}); }
    async saveCheckpoint() { if (!this.runtime.checkpoint) return; this.runtime.checkpoint.updatedAt = new Date().toISOString(); await storageSetCached({ [STORAGE_KEYS.checkpoint]: this.runtime.checkpoint }); }
    async clearCheckpoint() { await storageRemove(STORAGE_KEYS.checkpoint); this.runtime.checkpoint = null; }
    async clearAllCachedData() {
      if (this.runtime.running) return;
      const confirmed = window.confirm('这只会清除日报本地缓存、结果和任务进度，不会清空已保存的日期。确认清除吗？');
      if (!confirmed) return;
      await storageRemove([STORAGE_KEYS.report, STORAGE_KEYS.resultCache, STORAGE_KEYS.checkpoint]);
      this.runtime.running = false;
      this.runtime.jobType = '';
      this.runtime.activeAbortController = null;
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.runtime.statusText = '已清除本地缓存';
      this.runtime.logs = [];
      this.runtime.checkpoint = null;
      this.runtime.report = null;
      this.runtime.resultCache = {};
      this.syncSettingsToInputs();
      this.render();
    }

    async stopCurrentJob() {
      if (!this.runtime.running) return;
      const checkpoint = this.getActiveCheckpoint();
      const stoppedStatusText = '采集已结束，可以重新开始';
      requestListJobAbort(this.runtime.listJobAbortToken);
      this.runtime.stopping = true;
      this.runtime.pauseRequested = false;
      this.runtime.statusText = stoppedStatusText;
      this.abortActiveApiRequest();
      this.pushLog('采集已结束');
      if (checkpoint) {
        checkpoint.status = 'stopped';
        checkpoint.statusText = stoppedStatusText;
        await this.saveCheckpoint();
      }
      this.runtime.running = false;
      this.runtime.jobType = '';
      this.runtime.activeAbortController = null;
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.render();
    }

    pauseCurrentJob() {
      if (!this.runtime.running) return;
      this.runtime.pauseRequested = true;
      this.runtime.stopping = false;
      this.runtime.statusText = '正在暂停当前任务';
      this.abortActiveApiRequest();
      this.pushLog('正在暂停当前任务');
      this.render();
    }
    async handlePauseResumeAction() { if (this.runtime.running) { this.pauseCurrentJob(); return; } await this.resumePausedJob(); }
    async resumePausedJob() { if (this.runtime.running) return; if (!isListPage()) throw new Error('继续任务请回到标准化列表页'); const pausedTask = this.getPausedTaskMeta(); if (!pausedTask) throw new Error('当前没有可继续的暂停任务'); this.runtime.listJobAbortToken = beginListJobAbortSession(); this.runtime.running = true; this.runtime.jobType = 'daily'; this.runtime.activeAbortController = null; this.runtime.stopping = false; this.runtime.pauseRequested = false; this.runtime.logs = Array.isArray(pausedTask.checkpoint.logs) ? pausedTask.checkpoint.logs.slice(0, MAX_LOGS) : []; pausedTask.checkpoint.status = 'running'; pausedTask.checkpoint.statusText = '正在继续日报'; this.runtime.statusText = pausedTask.checkpoint.statusText; await this.saveCheckpoint(); this.pushLog('继续日报'); this.render(); await this.runDailyFromCheckpoint(); }
    async tryResume() { if (!this.runtime.running) { this.render(); return; } if (this.runtime.jobType === 'daily' && this.runtime.checkpoint && this.runtime.checkpoint.status === 'running') { this.pushLog('检测到未完成日报，正在继续'); await this.runDailyFromCheckpoint(); return; } this.runtime.running = false; this.runtime.jobType = ''; this.render(); }
    describeItem(item) { return item.exportLabel; }
    isCurrentJobStopRequested() { return isListJobAbortRequested(this.runtime.listJobAbortToken) || this.runtime.stopping; }
    abortActiveApiRequest() { if (this.runtime.activeAbortController) this.runtime.activeAbortController.abort(); }
    beginApiRequest() { this.ensureNotStopped(); const controller = new AbortController(); this.runtime.activeAbortController = controller; return controller; }
    finishApiRequest(controller) { if (this.runtime.activeAbortController === controller) this.runtime.activeAbortController = null; }

    async requestApiJson(endpoint, params) {
      const controller = this.beginApiRequest();
      try {
        const payload = await fetchApiJson(endpoint, params, { signal: controller.signal });
        this.ensureNotStopped();
        return payload;
      } catch (error) {
        if (controller.signal.aborted) {
          this.ensureNotStopped();
        }
        throw error;
      } finally {
        this.finishApiRequest(controller);
      }
    }

    async requestTaskTotal(params) {
      const payload = await this.requestApiJson(API_ENDPOINTS.taskList, params);
      return readTaskTotal(payload);
    }

    async fetchCategoryIdMap(items) {
      this.updateCheckpointStatus('正在读取品类信息');
      const payload = await this.requestApiJson(API_ENDPOINTS.categoryList, {
        page: 1,
        page_size: 100,
        level: 0
      });
      const idByName = new Map();
      for (const row of getApiList(payload)) {
        const name = normalizeText(row && row.category_name);
        const id = row && row.category_id;
        if (name && id !== undefined && id !== null && normalizeText(id)) {
          idByName.set(name, id);
        }
      }
      const result = new Map();
      for (const item of items) {
        const queryLabel = normalizeText(item.queryLabel);
        if (!idByName.has(queryLabel)) {
          throw new Error(`接口没有找到品类：${queryLabel}`);
        }
        result.set(item.key, idByName.get(queryLabel));
      }
      this.pushLog(`品类信息读取完成：${items.length} 个品类`);
      return result;
    }

    getCachedDailyResult(date, item) {
      const dayResults = this.runtime.resultCache && this.runtime.resultCache[date];
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
      if (!this.runtime.resultCache[date]) {
        this.runtime.resultCache[date] = {};
      }
      this.runtime.resultCache[date][item.key] = normalizeStoredResultRow({
        ...result,
        key: item.key
      });
      await storageSetCached({
        [STORAGE_KEYS.resultCache]: this.runtime.resultCache
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
      const startDate = this.settings.startDate;
      const endDate = this.settings.endDate || startDate;
      const maxDate = getYesterdayDateString();
      const groupIds = this.settings.groupIds.slice();
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
      this.runtime.activeAbortController = null;
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.runtime.logs = [];
      this.runtime.statusText = '正在准备日报';
      this.runtime.report = null;
      this.runtime.checkpoint = {
        version: 5,
        status: 'running',
        startDate,
        endDate,
        dateList,
        groupIds,
        itemKeys: items.map((item) => item.key),
        currentDateIndex: 0,
        currentItemIndex: 0,
        results: {},
        logs: [],
        startedAt: new Date().toISOString(),
        statusText: '正在准备日报'
      };
      this.render();
      await this.saveCheckpoint();
      this.pushLog(`开始日报：${startDate === endDate ? startDate : `${startDate} 至 ${endDate}`}，覆盖 ${items.length} 个子品类`);
      await this.runDailyFromCheckpoint();
    }

    async runDailyFromCheckpoint() {
      const checkpoint = this.runtime.checkpoint;
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
      const categoryIdMap = await this.fetchCategoryIdMap(items);

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
          advanceDailyCheckpointCursor(checkpoint, items.length);
          await this.saveCheckpoint();
          continue;
        }

        this.updateCheckpointStatus(`正在采集 ${item.exportLabel}`);
        await this.saveCheckpoint();
        const result = await this.runDailyApiForItem(currentDate, item, categoryIdMap.get(item.key));
        checkpoint.results[currentDate][item.key] = result;
        await this.cacheDailyResult(currentDate, item, result);
        advanceDailyCheckpointCursor(checkpoint, items.length);
        await this.saveCheckpoint();
      }

      await this.completeDailyJob();
    }

    async runDailyApiForItem(date, item, categoryId) {
      this.ensureNotStopped();
      const result = createEmptyResult(item);
      this.pushLog(`${date} ${this.describeItem(item)}：接口读取中`);
      result.inboundCount = await this.requestTaskTotal(buildTaskListParams(categoryId, date, 'create'));
      this.pushLog(`${date} ${this.describeItem(item)}：入库量 ${result.inboundCount}`);

      result.stdPassCount = await this.requestTaskTotal(buildTaskListParams(categoryId, date, 'create', { state: 87 }));
      this.pushLog(`${date} ${this.describeItem(item)}：标准化通过 ${result.stdPassCount}`);

      result.stdRejectCount = await this.requestTaskTotal(buildTaskListParams(categoryId, date, 'create', { state: 88 }));
      result.stdTotalCount = result.stdPassCount + result.stdRejectCount;
      result.stdRejectRate = calculateRatio(result.stdRejectCount, result.stdTotalCount);
      this.pushLog(`${date} ${this.describeItem(item)}：标准化拒绝 ${result.stdRejectCount}`);

      result.qcPassCount = await this.requestTaskTotal(buildTaskListParams(categoryId, date, 'modify', { check: 2 }));
      this.pushLog(`${date} ${this.describeItem(item)}：质检通过 ${result.qcPassCount}`);

      result.qcRejectCount = await this.requestTaskTotal(buildTaskListParams(categoryId, date, 'modify', { check: 3 }));
      result.qcTotalCount = result.qcPassCount + result.qcRejectCount;
      result.qcRejectRate = calculateRatio(result.qcRejectCount, result.qcTotalCount);
      this.pushLog(`${date} ${this.describeItem(item)}：质检拒绝 ${result.qcRejectCount}`);

      return {
        ...result,
        key: item.key,
        category: item.exportLabel,
        label: item.exportLabel,
        groupLabel: item.groupLabel,
        subgroupLabel: item.subgroupLabel,
        theme: item.theme,
        collectionCompleted: true
      };
    }

    async completeDailyJob() {
      const checkpoint = this.runtime.checkpoint;
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

      this.runtime.report = report;
      await storageSetCached({ [STORAGE_KEYS.report]: report });
      await this.clearCheckpoint();
      this.runtime.running = false;
      this.runtime.jobType = '';
      this.runtime.activeAbortController = null;
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.runtime.statusText = '日报采集完成，可以下载结果了';
      this.pushLog(`日报采集完成，已生成 ${dateList.length} 天结果`);
      this.render();
    }

    async failJob(error) {
      const message = error && error.message ? error.message : String(error);
      const paused = message === '采集已暂停';
      const stopped = message === '采集已结束';
      if (stopped && !this.runtime.running && !this.runtime.jobType) return;
      const checkpoint = this.getActiveCheckpoint();
      if (checkpoint) {
        checkpoint.status = paused ? 'paused' : stopped ? 'stopped' : 'error';
        checkpoint.statusText = paused ? '任务已暂停，可点击继续任务' : stopped ? '采集已结束，可以重新开始' : `任务遇到问题：${message}`;
        await this.saveCheckpoint();
      }
      this.runtime.running = false;
      this.runtime.activeAbortController = null;
      this.runtime.stopping = false;
      this.runtime.pauseRequested = false;
      this.runtime.statusText = paused ? '任务已暂停，可点击继续任务' : stopped ? '采集已结束，可以重新开始' : `任务遇到问题：${message}`;
      this.pushLog(paused ? '任务已暂停' : stopped ? '采集已结束' : `任务遇到问题：${message}`);
      this.runtime.jobType = '';
      this.render();
    }

    exportDailyReport() {
      if (!this.runtime.report) { this.pushLog('当前没有可下载的日报'); return; }
      downloadReport(this.runtime.report);
      this.pushLog(`已导出日报：${formatReportPeriod(this.runtime.report)}`);
    }
  }

  let app = null;
  let booting = false;
  let lastHref = location.href;

  async function ensureDailyReportMounted() {
    if (!isSupportedPage()) { if (app) { app.destroy(); app = null; } return 'destroyed'; }
    await waitForBodyReady();
    if (!app) { app = new YspDailyReportApp(); await app.init(); return 'created'; }
    if (!document.getElementById('ysp-daily-report-panel-root')) { app.mountPanel(); if (isListPage()) await app.tryResume(); else app.render(); return 'remounted'; }
    return 'noop';
  }

  async function runBootstrap() {
    if (booting) return;
    booting = true;
    try {
      if (!isSupportedPage()) { if (app) { app.destroy(); app = null; } return; }
      await ensureDailyReportMounted();
    } catch (error) {
      console.error('[央视频日报采集器]', error);
    } finally {
      booting = false;
    }
  }

  function queueBootstrap() { window.setTimeout(() => runBootstrap(), 60); }

  function installRouteHooks() {
    const methods = ['pushState', 'replaceState'];
    for (const method of methods) { const original = history[method]; history[method] = function wrappedHistoryMethod(...args) { const result = original.apply(this, args); window.dispatchEvent(new Event('ysp:daily-location-change')); return result; }; }
    const onLocationChange = () => { if (location.href === lastHref && document.getElementById('ysp-daily-report-panel-root')) return; lastHref = location.href; queueBootstrap(); };
    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    window.addEventListener('ysp:daily-location-change', onLocationChange);
    const observer = new MutationObserver(() => { if (!isSupportedPage()) return; if (!document.getElementById('ysp-daily-report-panel-root')) queueBootstrap(); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  installRouteHooks();
  runBootstrap();
})();
