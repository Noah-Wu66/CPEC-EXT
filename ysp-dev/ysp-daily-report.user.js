// ==UserScript==
// @name         央视频标准化工作台
// @namespace    https://github.com/Noah-Wu66/CPEC-EXT
// @version      2.1.19
// @description  在标准化系统页面执行日报采集与二次质检，并保存结果
// @author       Noah
// @match        http://std.video.cloud.cctv.com/*
// @match        https://std.video.cloud.cctv.com/*
// @updateURL    https://gh-proxy.com/https://raw.githubusercontent.com/Noah-Wu66/CPEC-EXT/main/ysp-dev/ysp-daily-report.user.js
// @downloadURL  https://gh-proxy.com/https://raw.githubusercontent.com/Noah-Wu66/CPEC-EXT/main/ysp-dev/ysp-daily-report.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_info
// @grant        GM_xmlhttpRequest
// @connect      yangshipin.cn
// @connect      dashscope.aliyuncs.com
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
  gap: 8px;
}

.ysp-daily-panel__title {
  margin: 0;
  font-family: "STZhongsong", "Songti SC", "Noto Serif SC", serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.15;
}

.ysp-daily-panel__version {
  flex-shrink: 0;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 11px;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.ysp-daily-panel__minimize {
  position: relative;
  z-index: 3;
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
  box-shadow: 0 8px 18px rgba(22, 51, 78, 0.08);
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

.ysp-daily-panel__module {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ysp-daily-panel__module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ysp-daily-panel__module-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #18344c;
}

.ysp-daily-panel__module-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #5f7284;
}

.ysp-daily-panel__collapse {
  min-width: 72px;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(24, 52, 76, 0.1);
  background: rgba(255, 255, 255, 0.84);
  color: #1c496b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.ysp-daily-panel__module-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ysp-daily-panel__module.is-collapsed .ysp-daily-panel__module-body {
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
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(17, 36, 56, 0.92);
  color: #ffffff;
  font-size: 12px;
  box-shadow: 0 14px 28px rgba(16, 33, 50, 0.22);
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
    settings: 'yspWorkbenchSettingsV1',
    report: 'yspWorkbenchDailyReportV1',
    resultCache: 'yspWorkbenchDailyResultCacheV1',
    secondaryQcReport: 'yspWorkbenchSecondaryQcReportV1',
    dailyCheckpoint: 'yspWorkbenchDailyCheckpointV1',
    secondaryQcCheckpoint: 'yspWorkbenchSecondaryQcCheckpointV1',
    secondaryQcWorkerActiveRequest: 'yspWorkbenchSecondaryQcWorkerActiveRequestV1',
    secondaryQcWorkerRequestPrefix: 'yspWorkbenchSecondaryQcWorkerRequest:',
    secondaryQcWorkerResponsePrefix: 'yspWorkbenchSecondaryQcWorkerResponse:',
    secondaryQcWorkerProgressPrefix: 'yspWorkbenchSecondaryQcWorkerProgress:',
    secondaryQcWorkerStopPrefix: 'yspWorkbenchSecondaryQcWorkerStop:'
  };

  const SESSION_KEY = 'yspWorkbenchSessionKey';
  const CHECKPOINT_PREFIX = 'yspWorkbenchCheckpoint:';
  const MAX_LOGS = 50;
  const QUERY_TIMEOUT = 90000;
  const PAGE_READY_TIMEOUT = 60000;
  const DETAIL_PAGE_TIMEOUT = 60000;
  const DASHSCOPE_REQUEST_TIMEOUT = 90 * 1000;
  const WORKER_START_TIMEOUT = 15000;
  const WORKER_PROGRESS_STALL_TIMEOUT = 90 * 1000;
  const WORKER_RESPONSE_TIMEOUT = 8 * 60 * 1000;
  const DASHSCOPE_CHAT_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
  const YANGSHIPIN_VIDEO_URL = 'https://yangshipin.cn/video/home';

  function injectPanelStyle() {
    GM_addStyle(PANEL_STYLE);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const PAGE_MUTE_CONTROLLER = {
    active: false,
    observer: null,
    mediaStates: new Map(),
    mediaHandlers: new Map()
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
        defaultMuted: Boolean(element.defaultMuted)
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

  function muteMediaElement(element) {
    if (!(element instanceof HTMLMediaElement)) {
      return;
    }
    rememberMediaState(element);
    attachMediaMuteGuard(element);
    element.defaultMuted = true;
    element.muted = true;
  }

  function enforcePageMuted() {
    PAGE_MUTE_CONTROLLER.active = true;
    Array.from(document.querySelectorAll('video, audio')).forEach((element) => {
      muteMediaElement(element);
    });
    if (!PAGE_MUTE_CONTROLLER.observer) {
      PAGE_MUTE_CONTROLLER.observer = new MutationObserver((mutations) => {
        if (!PAGE_MUTE_CONTROLLER.active) {
          return;
        }
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            getMediaElementsFromNode(node).forEach((element) => muteMediaElement(element));
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
    if (PAGE_MUTE_CONTROLLER.observer) {
      PAGE_MUTE_CONTROLLER.observer.disconnect();
      PAGE_MUTE_CONTROLLER.observer = null;
    }
    PAGE_MUTE_CONTROLLER.mediaHandlers.forEach((handler, element) => {
      element.removeEventListener('volumechange', handler, true);
    });
    PAGE_MUTE_CONTROLLER.mediaHandlers.clear();
    PAGE_MUTE_CONTROLLER.mediaStates.forEach((state, element) => {
      if (!(element instanceof HTMLMediaElement)) {
        return;
      }
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

  function createCacheEnvelope(data) {
    return {
      cachedAt: new Date().toISOString(),
      data
    };
  }

  function unwrapCacheEnvelope(value) {
    if (
      value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, 'cachedAt')
      && Object.prototype.hasOwnProperty.call(value, 'data')
    ) {
      return value.data;
    }
    return value;
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
    const base = createEmptyResult(entry || '');
    if (!rawRow || typeof rawRow !== 'object') {
      return base;
    }
    return {
      ...base,
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
    if (!report || typeof report !== 'object' || !Array.isArray(report.itemKeys) || !Array.isArray(report.rows)) {
      return null;
    }

    const sourceKeys = normalizeSelectedKeys(report.itemKeys);
    const columns = buildReportColumns(getEntriesByKeys(sourceKeys));
    const normalizedRows = [];

    for (const rawRow of report.rows) {
      if (!rawRow || typeof rawRow !== 'object' || !rawRow.date || !Array.isArray(rawRow.results)) {
        continue;
      }
      const rowMap = new Map();
      for (const result of rawRow.results) {
        const normalized = normalizeStoredResultRow(result);
        if (normalized.key) {
          rowMap.set(normalized.key, normalized);
        }
      }
      normalizedRows.push({
        date: rawRow.date,
        results: columns.map((column) => rowMap.get(column.key) || createEmptyResult(column.key))
      });
    }

    if (!report.startDate || !report.endDate || !normalizedRows.length) {
      return null;
    }

    return {
      startDate: report.startDate,
      endDate: report.endDate,
      itemKeys: sourceKeys,
      columns,
      rows: normalizedRows,
      generatedAt: report.generatedAt || new Date().toISOString()
    };
  }

  function normalizeStoredCheckpoint(checkpoint) {
    if (!checkpoint || typeof checkpoint !== 'object') {
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
    const normalizedResults = {};
    if (checkpoint.results && typeof checkpoint.results === 'object') {
      for (const [date, dayResults] of Object.entries(checkpoint.results)) {
        if (!dayResults || typeof dayResults !== 'object') {
          continue;
        }
        const normalizedDayResults = {};
        for (const [rowKey, rowValue] of Object.entries(dayResults)) {
          const normalizedRow = normalizeStoredResultRow({
            ...rowValue,
            key: rowKey
          });
          if (!normalizedRow.key) {
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
      currentDateIndex: Number.isFinite(Number(checkpoint.currentDateIndex)) ? Number(checkpoint.currentDateIndex) : 0,
      currentItemIndex: Number.isFinite(Number(checkpoint.currentItemIndex)) ? Number(checkpoint.currentItemIndex) : 0,
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
      for (const [rowKey, rowValue] of Object.entries(dayResults)) {
        const normalizedRow = normalizeStoredResultRow({
          ...rowValue,
          key: rowKey
        });
        if (!normalizedRow.key || !normalizedRow.collectionCompleted) {
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

  function isListPage() {
    return location.pathname.startsWith('/stdList');
  }

  function isDetailPage() {
    return location.pathname.startsWith('/stdDetail/');
  }

  async function waitForBodyReady(timeoutMs) {
    return waitFor(() => document.body, timeoutMs || 15000, '页面主体未准备完成');
  }

  function getSessionToken() {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) {
      return existing;
    }
    const token = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    window.sessionStorage.setItem(SESSION_KEY, token);
    return token;
  }

  function getCheckpointStorageKey() {
    return `${CHECKPOINT_PREFIX}${getSessionToken()}`;
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
    const wrappedValues = {};
    for (const [key, value] of Object.entries(values)) {
      wrappedValues[key] = createCacheEnvelope(value);
    }
    await storageSet(wrappedValues);
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
      ui: {
        dailyCollapsed: true,
        secondaryQcCollapsed: false
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

  function normalizeWorkbenchSettings(rawSettings) {
    const defaults = createDefaultWorkbenchSettings();
    const source = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
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
      ui: {
        dailyCollapsed: source.ui && source.ui.dailyCollapsed !== undefined
          ? Boolean(source.ui.dailyCollapsed)
          : defaults.ui.dailyCollapsed,
        secondaryQcCollapsed: source.ui && source.ui.secondaryQcCollapsed !== undefined
          ? Boolean(source.ui.secondaryQcCollapsed)
          : defaults.ui.secondaryQcCollapsed
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

  function getSecondaryQcWorkerRequestIdFromLocation() {
    const params = new URLSearchParams(location.search);
    return normalizeText(params.get('ysp_qc_request'));
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
    const activeRequestId = normalizeText(unwrapCacheEnvelope(state[STORAGE_KEYS.secondaryQcWorkerActiveRequest]));
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
    const stopSignal = unwrapCacheEnvelope(state[buildSecondaryQcWorkerStopKey(normalizedRequestId)]);
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

  function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = String(text || '');
    return textarea.value;
  }

  function normalizeTagDisplayName(rawValue) {
    const text = normalizeText(rawValue);
    if (!text) {
      return '';
    }
    const parts = text.split('|');
    return normalizeText(parts[parts.length - 1] || text);
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

  async function fetchYangshipinPageHtml(videoVid, cancelCheck) {
    const query = new URLSearchParams({ vid: videoVid });
    const response = await gmXmlhttpRequestPromise({
      method: 'GET',
      url: `${YANGSHIPIN_VIDEO_URL}?${query.toString()}`,
      cancelCheck
    });
    if (!response || response.status >= 400) {
      throw new Error(`央视频页面获取失败：${response ? response.status : '未知状态'}`);
    }
    return response.responseText || '';
  }

  function extractYangshipinVideoUrl(htmlText) {
    const source = String(htmlText || '');
    const matchers = [
      /<video[^>]+src=["']([^"']+\.mp4[^"']*)["']/i,
      /"src"\s*:\s*"([^"]+\.mp4[^"]*)"/i,
      /(https?:\\\/\\\/[^"'\\]+\.mp4[^"'\\]*)/i,
      /(https?:\/\/[^"'<>]+\.mp4[^"'<>]*)/i
    ];
    for (const matcher of matchers) {
      const matched = source.match(matcher);
      if (!matched || !matched[1]) {
        continue;
      }
      const decoded = decodeHtmlEntities(matched[1])
        .replace(/\\u0026/g, '&')
        .replace(/\\\//g, '/');
      if (/\.mp4/i.test(decoded)) {
        return decoded;
      }
    }
    throw new Error('未在央视频页面中找到视频地址');
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
      model: 'qwen3.5-omni-plus',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'video_url',
              video_url: { url: videoUrl }
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

  function getDetailVideoVid() {
    const explicitItem = getDetailFormItemByLabel('VID');
    const explicitInput = explicitItem && explicitItem.querySelector('input');
    const explicitContent = explicitItem ? explicitItem.querySelector('.el-form-item__content') : null;
    const explicitValue = normalizeText(
      explicitInput
        ? explicitInput.value
        : (explicitContent ? explicitContent.textContent : '')
    );
    if (explicitValue && explicitValue !== getDetailPageTaskId()) {
      return explicitValue;
    }
    const consoleValue = normalizeText(document.querySelector('[data-role="txp-ui-console-vid"]')?.textContent);
    if (consoleValue) {
      return consoleValue;
    }
    return explicitValue || '';
  }

  function getDetailFinishedTagsField() {
    const item = getDetailFormItemByLabel('成品标签');
    return item ? item.querySelector('.video-label-select, .moveTag, .el-select') : null;
  }

  function getDetailSelectedTags() {
    const field = getDetailFinishedTagsField();
    if (!field) {
      return [];
    }
    return uniqueTextList(
      Array.from(field.querySelectorAll('.el-select__tags-text')).map((element) => normalizeText(element.textContent))
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
    const options = Array.from(dropdown.querySelectorAll('.el-select-dropdown__item'))
      .filter(isVisible)
      .map((item) => normalizeText(item.textContent))
      .filter(Boolean);
    setNativeInputValue(input, '');
    input.blur();
    document.body.dispatchEvent(createMouseEvent('click'));
    return uniqueTextList(options);
  }

  async function clickDetailExitButton() {
    const button = findButtonByText('退出任务操作');
    if (!button) {
      throw new Error('未找到退出任务操作按钮');
    }
    triggerMouseClick(button);
    await sleep(600);
  }

  function mountWorkerBadge(text) {
    let badge = document.getElementById('ysp-daily-worker-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'ysp-daily-worker-badge';
      badge.className = 'ysp-daily-worker-badge';
      document.body.appendChild(badge);
    }
    badge.textContent = text;
    return badge;
  }

  function unmountWorkerBadge() {
    const badge = document.getElementById('ysp-daily-worker-badge');
    if (badge) {
      badge.remove();
    }
  }

  class DailyReporterApp {
    constructor() {
      this.panel = null;
      this.handleOutsideInteraction = null;
      this.savedSettings = { startDate: '', endDate: '', groupIds: [] };
      this.runtime = {
        running: false,
        minimized: true,
        stopping: false,
        currentCheckpoint: null,
        lastReport: null,
        resultCache: {},
        logs: [],
        statusText: '等待开始',
        activeSessionKey: getCheckpointStorageKey()
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
      await this.tryResume();
    }

    async clearExpiredCache() {
      const state = await storageGet([
        STORAGE_KEYS.report,
        STORAGE_KEYS.resultCache,
        this.runtime.activeSessionKey
      ]);
      const cutoffDate = getQuarterCutoffDateString(new Date());

      const nextReport = trimReportByCutoff(unwrapCacheEnvelope(state[STORAGE_KEYS.report]), cutoffDate);
      if (nextReport) {
        await storageSetCached({
          [STORAGE_KEYS.report]: nextReport
        });
      } else {
        await storageRemove(STORAGE_KEYS.report);
      }

      const cachedResultData = normalizeStoredResultCache(unwrapCacheEnvelope(state[STORAGE_KEYS.resultCache]));
      const nextResultCache = trimResultCacheByCutoff(cachedResultData, cutoffDate);
      if (Object.keys(nextResultCache).length) {
        await storageSetCached({
          [STORAGE_KEYS.resultCache]: nextResultCache
        });
      } else {
        await storageRemove(STORAGE_KEYS.resultCache);
      }

      const checkpoint = unwrapCacheEnvelope(state[this.runtime.activeSessionKey]);
      const checkpointDate = checkpoint && (checkpoint.updatedAt || checkpoint.startedAt || '');
      if (checkpointDate && isDateExpiredByQuarter(String(checkpointDate).slice(0, 10), cutoffDate)) {
        await storageRemove(this.runtime.activeSessionKey);
      }
    }

    async loadState() {
      const state = await storageGet([
        STORAGE_KEYS.settings,
        STORAGE_KEYS.report,
        STORAGE_KEYS.resultCache,
        this.runtime.activeSessionKey
      ]);
      const rawSettings = unwrapCacheEnvelope(state[STORAGE_KEYS.settings]) || {};
      const maxDate = getYesterdayDateString();
      const startDate = rawSettings.startDate || '';
      let endDate = rawSettings.endDate || '';
      const normalizedStartDate = startDate && startDate <= maxDate ? startDate : maxDate;
      if (endDate && endDate > maxDate) {
        endDate = '';
      }
      if (normalizedStartDate && endDate && endDate < normalizedStartDate) {
        endDate = '';
      }
      this.savedSettings = {
        startDate: normalizedStartDate,
        endDate,
        groupIds: normalizeSelectedGroupIds(rawSettings.groupIds)
      };
      this.runtime.lastReport = null;
      this.runtime.resultCache = normalizeStoredResultCache(unwrapCacheEnvelope(state[STORAGE_KEYS.resultCache]));
      this.runtime.currentCheckpoint = normalizeStoredCheckpoint(unwrapCacheEnvelope(state[this.runtime.activeSessionKey]));
      this.runtime.logs = Array.isArray(this.runtime.currentCheckpoint && this.runtime.currentCheckpoint.logs)
        ? this.runtime.currentCheckpoint.logs.slice(0, MAX_LOGS)
        : [];

      if (this.runtime.currentCheckpoint && this.runtime.currentCheckpoint.status === 'running') {
        this.runtime.running = true;
        this.runtime.minimized = false;
        this.runtime.statusText = this.runtime.currentCheckpoint.statusText || '正在继续上次采集';
      } else if (this.runtime.currentCheckpoint && this.runtime.currentCheckpoint.status === 'stopped') {
        this.runtime.statusText = this.runtime.currentCheckpoint.statusText || '上次采集已结束';
      } else if (this.runtime.currentCheckpoint && this.runtime.currentCheckpoint.status === 'error') {
        this.runtime.statusText = this.runtime.currentCheckpoint.statusText || '上次采集未完成';
      }
    }

    mountPanel() {
      let root = document.getElementById('ysp-daily-panel-root');
      if (root) {
        root.remove();
      }

      root = document.createElement('div');
      root.id = 'ysp-daily-panel-root';
      root.innerHTML = `
        <div class="ysp-daily-panel__backdrop"></div>
        <div class="ysp-daily-panel">
          <div class="ysp-daily-panel__header">
            <div class="ysp-daily-panel__header-top">
              <div>
                <div class="ysp-daily-panel__title">二次质检日报采集</div>
              </div>
              <div class="ysp-daily-panel__header-actions">
                <div class="ysp-daily-panel__version">v${SCRIPT_VERSION}</div>
                <button type="button" class="ysp-daily-panel__minimize" data-role="minimize">收起</button>
              </div>
            </div>
          </div>
          <div class="ysp-daily-panel__body">
            <div class="ysp-daily-panel__main">
              <div class="ysp-daily-panel__section ysp-daily-panel__section--fill">
                <div class="ysp-daily-panel__toolbar">
                  <span class="ysp-daily-panel__label">品类编组</span>
                </div>
                <div class="ysp-daily-panel__catalog" data-role="categories"></div>
              </div>
            </div>
            <div class="ysp-daily-panel__side">
              <div class="ysp-daily-panel__section ysp-daily-panel__section--compact">
                <span class="ysp-daily-panel__label">日期</span>
                <div class="ysp-daily-panel__date-grid">
                  <label class="ysp-daily-panel__date-field" for="ysp-daily-start-date">
                    <span class="ysp-daily-panel__date-caption">开始</span>
                    <input id="ysp-daily-start-date" class="ysp-daily-panel__date" type="date" />
                  </label>
                  <label class="ysp-daily-panel__date-field" for="ysp-daily-end-date">
                    <span class="ysp-daily-panel__date-caption">结束</span>
                    <input id="ysp-daily-end-date" class="ysp-daily-panel__date" type="date" />
                  </label>
                </div>
              </div>
              <div class="ysp-daily-panel__section ysp-daily-panel__section--compact">
                <div class="ysp-daily-panel__actions">
                  <button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--primary" data-role="start">开始采集</button>
                  <button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--danger" data-role="clear-data">清除数据</button>
                </div>
              </div>
              <div class="ysp-daily-panel__status" data-role="status"></div>
              <div class="ysp-daily-panel__section ysp-daily-panel__section--compact">
                <div class="ysp-daily-panel__toolbar">
                  <span class="ysp-daily-panel__label">下载中心</span>
                </div>
                <div class="ysp-daily-panel__report" data-role="report"></div>
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="ysp-daily-panel__dock" data-role="dock"><</button>
      `;
      document.body.appendChild(root);
      this.panel = root;

      this.refs.backdrop = root.querySelector('.ysp-daily-panel__backdrop');
      this.refs.surface = root.querySelector('.ysp-daily-panel');
      this.refs.startDate = root.querySelector('#ysp-daily-start-date');
      this.refs.endDate = root.querySelector('#ysp-daily-end-date');
      this.refs.categories = root.querySelector('[data-role="categories"]');
      this.refs.report = root.querySelector('[data-role="report"]');
      this.refs.start = root.querySelector('[data-role="start"]');
      this.refs.clearData = root.querySelector('[data-role="clear-data"]');
      this.refs.status = root.querySelector('[data-role="status"]');
      this.refs.minimize = root.querySelector('[data-role="minimize"]');
      this.refs.dock = root.querySelector('[data-role="dock"]');

      this.renderCategories();
      this.refs.startDate.setAttribute('inputmode', 'none');
      this.refs.endDate.setAttribute('inputmode', 'none');
      this.refs.startDate.value = this.savedSettings.startDate || '';
      this.refs.endDate.value = this.savedSettings.endDate || '';
      this.syncDateInputBounds();
      this.normalizeDateInputs();
      this.bindPanelEvents();
      this.render();
    }

    destroy() {
      if (this.handleOutsideInteraction) {
        document.removeEventListener('pointerdown', this.handleOutsideInteraction, true);
        document.removeEventListener('mousedown', this.handleOutsideInteraction, true);
        document.removeEventListener('touchstart', this.handleOutsideInteraction, true);
        this.handleOutsideInteraction = null;
      }
      if (this.panel && this.panel.isConnected) {
        this.panel.remove();
      }
      this.panel = null;
      this.refs = {};
    }

    renderCategories() {
      const selected = new Set(this.savedSettings.groupIds);
      this.refs.categories.innerHTML = SUBGROUP_ENTRIES.map((subgroup) => {
        const selectedClass = selected.has(subgroup.id) ? ' is-selected' : '';
        return `
          <section
            class="ysp-daily-panel__group${selectedClass}"
            data-theme="${escapeXml(subgroup.theme)}"
            data-group-card="${escapeXml(subgroup.id)}"
            role="button"
            tabindex="${this.runtime.running ? '-1' : '0'}"
            aria-pressed="${selected.has(subgroup.id) ? 'true' : 'false'}"
          >
            <div class="ysp-daily-panel__group-header">
              <h3 class="ysp-daily-panel__group-title">${escapeXml(subgroup.label)}</h3>
            </div>
          </section>
        `;
      }).join('');
    }

    bindPanelEvents() {
      if (this.handleOutsideInteraction) {
        document.removeEventListener('pointerdown', this.handleOutsideInteraction, true);
        document.removeEventListener('mousedown', this.handleOutsideInteraction, true);
        document.removeEventListener('touchstart', this.handleOutsideInteraction, true);
      }
      this.handleOutsideInteraction = (event) => {
        if (this.runtime.minimized) {
          return;
        }
        // 采集流程会脚本化点击页面控件，这类事件不应触发面板收起。
        if (event.isTrusted === false) {
          return;
        }
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }
        if (this.refs.surface && this.refs.surface.contains(target)) {
          return;
        }
        this.setMinimized(true);
      };
      document.addEventListener('pointerdown', this.handleOutsideInteraction, true);
      document.addEventListener('mousedown', this.handleOutsideInteraction, true);
      document.addEventListener('touchstart', this.handleOutsideInteraction, true);
      this.refs.start.addEventListener('click', () => {
        this.startNewJob().catch((error) => this.failJob(error));
      });
      this.refs.clearData.addEventListener('click', () => {
        this.clearAllCachedData().catch((error) => {
          const message = error && error.message ? error.message : String(error);
          this.runtime.statusText = `清除失败：${message}`;
          this.pushLog(`清除失败：${message}`);
          this.render();
        });
      });
      this.refs.backdrop.addEventListener('click', () => {
        if (!this.runtime.minimized) {
          this.setMinimized(true);
        }
      });
      this.refs.minimize.addEventListener('click', () => this.setMinimized(true));
      this.refs.dock.addEventListener('click', () => this.setMinimized(false));
      this.bindDateInput(this.refs.startDate);
      this.bindDateInput(this.refs.endDate);
      this.refs.categories.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const groupCard = target.closest('[data-group-card]');
        if (!groupCard || this.runtime.running) {
          return;
        }
        const groupId = groupCard.getAttribute('data-group-card');
        if (!groupId) {
          return;
        }
        this.setSelectedGroupIds(this.savedSettings.groupIds.includes(groupId) ? [] : [groupId]);
        this.render();
      });
      this.refs.categories.addEventListener('keydown', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement) || this.runtime.running) {
          return;
        }
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }
        const groupCard = target.closest('[data-group-card]');
        if (!groupCard) {
          return;
        }
        event.preventDefault();
        const groupId = groupCard.getAttribute('data-group-card');
        if (!groupId) {
          return;
        }
        this.setSelectedGroupIds(this.savedSettings.groupIds.includes(groupId) ? [] : [groupId]);
        this.render();
      });
      this.refs.report.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const downloadButton = target.closest('[data-role="download"]');
        if (downloadButton) {
          this.exportLastReport();
        }
      });
      const refreshFocus = () => {
        if (this.runtime.minimized) {
          this.panel.classList.remove('is-focused');
          return;
        }
        const surface = this.refs.surface;
        const keepActive = surface.matches(':hover') || surface.contains(document.activeElement);
        this.panel.classList.toggle('is-focused', keepActive);
      };
      this.refs.surface.addEventListener('mouseenter', refreshFocus);
      this.refs.surface.addEventListener('mouseleave', () => window.setTimeout(refreshFocus, 0));
      this.refs.surface.addEventListener('focusin', refreshFocus);
      this.refs.surface.addEventListener('focusout', () => window.setTimeout(refreshFocus, 0));
      this.panel.classList.add('is-focused');
    }

    setMinimized(nextValue) {
      this.runtime.minimized = Boolean(nextValue);
      if (this.runtime.minimized) {
        this.panel.classList.remove('is-focused');
      } else {
        this.panel.classList.add('is-focused');
      }
      this.render();
    }

    bindDateInput(input) {
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
      input.addEventListener('beforeinput', (event) => {
        event.preventDefault();
      });
      input.addEventListener('paste', (event) => {
        event.preventDefault();
      });
      input.addEventListener('drop', (event) => {
        event.preventDefault();
      });
      input.addEventListener('wheel', (event) => {
        event.preventDefault();
      }, { passive: false });
      input.addEventListener('change', () => {
        this.normalizeDateInputs();
        this.persistDraft().catch(() => undefined);
        this.render();
      });
    }

    syncDateInputBounds() {
      const maxDate = getYesterdayDateString();
      this.refs.startDate.max = maxDate;
      this.refs.endDate.max = maxDate;
      this.refs.endDate.min = this.refs.startDate.value || '';
    }

    normalizeDateInputs() {
      this.syncDateInputBounds();
      if (this.refs.startDate.value && this.refs.startDate.value > this.refs.startDate.max) {
        this.refs.startDate.value = this.refs.startDate.max;
      }
      if (!this.refs.startDate.value) {
        this.refs.endDate.value = '';
      }
      if (this.refs.endDate.value && this.refs.endDate.value > this.refs.endDate.max) {
        this.refs.endDate.value = this.refs.endDate.max;
      }
      if (this.refs.endDate.value && this.refs.startDate.value && this.refs.endDate.value < this.refs.startDate.value) {
        this.refs.endDate.value = '';
      }
      this.savedSettings.startDate = this.refs.startDate.value;
      this.savedSettings.endDate = this.refs.endDate.value;
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
          // ignore and fall through to native focus behavior
        }
      }
      input.focus();
    }

    setSelectedGroupIds(groupIds) {
      this.savedSettings.groupIds = normalizeSelectedGroupIds(groupIds);
      this.persistDraft().catch(() => undefined);
    }

    getSelectedGroupEntries() {
      return getSubgroupEntriesByIds(this.savedSettings.groupIds);
    }

    getSelectedEntries() {
      return getEntriesByGroupIds(this.savedSettings.groupIds);
    }

    getCheckpointItems(checkpoint) {
      return getEntriesByKeys(checkpoint && checkpoint.itemKeys);
    }

    async persistDraft() {
      this.normalizeDateInputs();
      await this.persistSettings(this.refs.startDate.value, this.refs.endDate.value, this.savedSettings.groupIds);
    }

    describeItem(item) {
      return item.exportLabel;
    }

    renderSelectionSummary() {
      return;
    }

    renderReport() {
      if (!this.runtime.lastReport) {
        this.refs.report.innerHTML = '<div class="ysp-daily-panel__report-empty">暂无结果</div>';
        return;
      }
      this.refs.report.innerHTML = `
        <div class="ysp-daily-panel__report-top">
          <div>
            <h3 class="ysp-daily-panel__report-title">日报结果已生成</h3>
            <div class="ysp-daily-panel__report-meta">${escapeXml(formatReportPeriod(this.runtime.lastReport))}</div>
          </div>
          <button type="button" class="ysp-daily-panel__download" data-role="download">下载结果</button>
        </div>
      `;
    }

    pushLog(message) {
      const entry = `[${formatClock()}] ${message}`;
      this.runtime.logs.unshift(entry);
      this.runtime.logs = this.runtime.logs.slice(0, MAX_LOGS);
      if (this.runtime.currentCheckpoint) {
        this.runtime.currentCheckpoint.logs = this.runtime.logs.slice();
      }
      this.render();
    }

    render() {
      this.panel.classList.toggle('is-minimized', this.runtime.minimized);
      this.syncDateInputBounds();
      this.refs.startDate.disabled = this.runtime.running;
      this.refs.endDate.disabled = this.runtime.running;
      this.refs.start.disabled = this.runtime.running;
      this.refs.clearData.disabled = this.runtime.running;
      this.refs.start.textContent = this.runtime.running ? '采集中' : '开始采集';
      this.refs.status.textContent = this.runtime.statusText || '等待开始';
      this.refs.minimize.disabled = false;
      for (const groupCard of this.refs.categories.querySelectorAll('[data-group-card]')) {
        const groupId = groupCard.getAttribute('data-group-card');
        const selected = this.savedSettings.groupIds.includes(groupId);
        groupCard.classList.toggle('is-selected', selected);
        groupCard.setAttribute('aria-pressed', selected ? 'true' : 'false');
        groupCard.setAttribute('tabindex', this.runtime.running ? '-1' : '0');
      }
      this.renderSelectionSummary();
      this.renderReport();
    }

    async persistSettings(startDate, endDate, groupIds) {
      this.savedSettings = {
        startDate,
        endDate,
        groupIds: normalizeSelectedGroupIds(groupIds)
      };
      await storageSetCached({
        [STORAGE_KEYS.settings]: {
          startDate,
          endDate,
          groupIds: this.savedSettings.groupIds.slice()
        }
      });
    }

    async saveCheckpoint() {
      if (!this.runtime.currentCheckpoint) {
        return;
      }
      this.runtime.currentCheckpoint.updatedAt = new Date().toISOString();
      await storageSetCached({
        [this.runtime.activeSessionKey]: this.runtime.currentCheckpoint
      });
    }

    async clearCheckpoint() {
      await storageRemove(this.runtime.activeSessionKey);
      this.runtime.currentCheckpoint = null;
    }

    async clearLastCollectedData() {
      this.runtime.lastReport = null;
    }

    async clearAllCachedData() {
      if (this.runtime.running) {
        return;
      }
      const confirmed = window.confirm('这会清除已保存内容，当前界面保持不变。确认清除吗？');
      if (!confirmed) {
        return;
      }
      await storageRemove([
        STORAGE_KEYS.settings,
        STORAGE_KEYS.report,
        STORAGE_KEYS.resultCache,
        this.runtime.activeSessionKey
      ]);
      window.sessionStorage.removeItem(SESSION_KEY);
      this.runtime.activeSessionKey = getCheckpointStorageKey();
      this.runtime.running = false;
      this.runtime.stopping = false;
      this.runtime.currentCheckpoint = null;
      this.runtime.resultCache = {};
      this.runtime.statusText = '已清除已保存内容，当前界面保持不变';
      this.pushLog('已清除已保存内容');
      this.render();
    }

    getCachedResult(date, item) {
      const cachedDayResults = this.runtime.resultCache && this.runtime.resultCache[date];
      if (!cachedDayResults || !cachedDayResults[item.key]) {
        return null;
      }
      const normalized = normalizeStoredResultRow({
        ...cachedDayResults[item.key],
        key: item.key
      });
      return isReusableCachedResult(normalized) ? normalized : null;
    }

    async cacheResult(date, item, result) {
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

    ensureNotStopped() {
      if (this.runtime.stopping) {
        throw new Error('采集已结束');
      }
    }

    updateCheckpointStatus(text, summaryText) {
      if (!this.runtime.currentCheckpoint) {
        return;
      }
      this.runtime.statusText = text;
      this.runtime.currentCheckpoint.statusText = text;
      this.runtime.currentCheckpoint.summaryText = summaryText || this.runtime.currentCheckpoint.summaryText || '';
      this.render();
    }

    async clearProgress() {
      this.runtime.stopping = true;
      this.runtime.running = false;
      await this.clearCheckpoint();
      this.runtime.statusText = '已清除当前进度';
      this.pushLog('已清除当前进度');
      this.render();
    }

    stopCurrentJob() {
      if (!this.runtime.running) {
        return;
      }
      this.runtime.stopping = true;
      this.runtime.statusText = '正在结束本次采集';
      this.pushLog('正在结束本次采集');
      this.render();
    }

    async startNewJob() {
      if (this.runtime.running) {
        return;
      }
      this.normalizeDateInputs();
      const startDate = this.refs.startDate.value;
      const rawEndDate = this.refs.endDate.value;
      const endDate = rawEndDate || startDate;
      const maxDate = getYesterdayDateString();
      const groupIds = this.savedSettings.groupIds.slice();
      const groups = this.getSelectedGroupEntries();
      const items = this.getSelectedEntries();
      if (!startDate) {
        throw new Error('请先选择开始日期');
      }
      if (startDate > maxDate || (rawEndDate && rawEndDate > maxDate)) {
        throw new Error('日期只能选择昨天及以前');
      }
      if (rawEndDate && rawEndDate < startDate) {
        throw new Error('结束日期需大于等于开始日期');
      }
      if (!groups.length) {
        throw new Error('请至少选择一个编组');
      }
      const dateList = buildDateList(startDate, endDate);
      if (!dateList.length) {
        throw new Error('日期范围无效');
      }

      await this.clearLastCollectedData();
      await this.persistSettings(startDate, rawEndDate, groupIds);
      this.runtime.stopping = false;
      this.runtime.running = true;
      this.runtime.logs = [];
      this.runtime.statusText = '正在准备采集';
      this.runtime.currentCheckpoint = {
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
        statusText: '正在准备采集',
        summaryText: ''
      };
      this.render();
      await this.saveCheckpoint();
      this.pushLog(`开始采集：${startDate === endDate ? startDate : `${startDate} 至 ${endDate}`}，共 ${dateList.length} 天，覆盖 ${items.length} 个子品类`);
      await this.runFromCheckpoint();
    }

    async tryResume() {
      if (!this.runtime.currentCheckpoint || this.runtime.currentCheckpoint.status !== 'running') {
        this.render();
        return;
      }
      this.runtime.running = true;
      this.runtime.stopping = false;
      this.pushLog('检测到未完成内容，正在继续');
      await this.runFromCheckpoint();
    }

    async runFromCheckpoint() {
      await waitForPageReady();

      const checkpoint = this.runtime.currentCheckpoint;
      if (!checkpoint || checkpoint.status !== 'running') {
        this.runtime.running = false;
        this.render();
        return;
      }
      const dateList = Array.isArray(checkpoint.dateList) && checkpoint.dateList.length
        ? checkpoint.dateList
        : buildDateList(checkpoint.startDate, checkpoint.endDate || checkpoint.startDate);
      checkpoint.dateList = dateList;
      const items = this.getCheckpointItems(checkpoint);
      if (!items.length) {
        throw new Error('当前选择下没有可采集内容');
      }
      if (!dateList.length) {
        throw new Error('当前日期范围没有可采集内容');
      }

      if (checkpoint.phase === 'resume-qc') {
        const currentDate = dateList[checkpoint.currentDateIndex];
        const item = items[checkpoint.currentItemIndex];
        if (currentDate && item) {
          const cachedResult = this.getCachedResult(currentDate, item);
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
            await this.saveCheckpoint();
            return this.runFromCheckpoint();
          }
          checkpoint.summaryText = `${currentDate} ${this.describeItem(item)}：质检`;
          this.updateCheckpointStatus(`正在继续 ${item.exportLabel}`, `${checkpoint.currentDateIndex + 1}/${dateList.length} · ${checkpoint.currentItemIndex + 1}/${items.length} · 质检`);
          await this.runQualityCheckForItem(currentDate, item);
          checkpoint.currentItemIndex += 1;
          if (checkpoint.currentItemIndex >= items.length) {
            checkpoint.currentDateIndex += 1;
            checkpoint.currentItemIndex = 0;
          }
          checkpoint.phase = 'std';
          await this.saveCheckpoint();
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
        if (!checkpoint.results[currentDate]) {
          checkpoint.results[currentDate] = {};
        }
        if (!checkpoint.results[currentDate][item.key]) {
          checkpoint.results[currentDate][item.key] = createEmptyResult(item);
        }
        const cachedResult = this.getCachedResult(currentDate, item);
        if (cachedResult) {
          checkpoint.results[currentDate][item.key] = cachedResult;
          this.pushLog(`${currentDate} ${this.describeItem(item)}：已使用已保存结果`);
          checkpoint.currentItemIndex += 1;
          if (checkpoint.currentItemIndex >= items.length) {
            checkpoint.currentDateIndex += 1;
            checkpoint.currentItemIndex = 0;
          }
          checkpoint.phase = 'std';
          await this.saveCheckpoint();
          continue;
        }
        checkpoint.phase = 'std';
        checkpoint.summaryText = `${currentDate} ${this.describeItem(item)}：标准化`;
        this.updateCheckpointStatus(`正在采集 ${item.exportLabel}`, `${checkpoint.currentDateIndex + 1}/${dateList.length} · ${checkpoint.currentItemIndex + 1}/${items.length} · 标准化`);
        await this.saveCheckpoint();
        await this.runStandardizationForItem(currentDate, item);

        checkpoint.phase = 'resume-qc';
        checkpoint.summaryText = `${currentDate} ${this.describeItem(item)}：准备继续质检`;
        this.updateCheckpointStatus(`正在继续 ${item.exportLabel}`, `${checkpoint.currentDateIndex + 1}/${dateList.length} · ${checkpoint.currentItemIndex + 1}/${items.length} · 下一步`);
        await this.saveCheckpoint();
        this.pushLog(`${currentDate} ${this.describeItem(item)}：标准化已完成，正在继续质检`);
        window.location.reload();
        return;
      }

      await this.completeJob();
    }

    async runStandardizationForItem(date, item) {
      this.ensureNotStopped();
      const checkpoint = this.runtime.currentCheckpoint;
      if (!checkpoint.results[date]) {
        checkpoint.results[date] = {};
      }
      const dayResults = checkpoint.results[date] || {};
      const result = dayResults[item.key] || createEmptyResult(item);
      const range = buildDateRange(date);

      await clickResetButton();
      await this.applyCategory(item);
      await setDateRange('创建时间', range.start, range.end);

      this.pushLog(`${date} ${this.describeItem(item)}：读取入库量`);
      result.inboundCount = await clickQueryAndReadCount();
      this.pushLog(`${date} ${this.describeItem(item)}：入库量 ${result.inboundCount}`);

      await this.applySelectByLabel('标准化状态', '标准化通过');
      result.stdPassCount = await clickQueryAndReadCount();
      this.pushLog(`${date} ${this.describeItem(item)}：标准化通过 ${result.stdPassCount}`);

      await this.applySelectByLabel('标准化状态', '标准化拒绝');
      result.stdRejectCount = await clickQueryAndReadCount();
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
      await this.saveCheckpoint();
    }

    async runQualityCheckForItem(date, item) {
      this.ensureNotStopped();
      const checkpoint = this.runtime.currentCheckpoint;
      if (!checkpoint.results[date]) {
        checkpoint.results[date] = {};
      }
      const dayResults = checkpoint.results[date] || {};
      const result = dayResults[item.key] || createEmptyResult(item);
      const range = buildDateRange(date);

      await clickResetButton();
      await this.applyCategory(item);
      await setDateRange('修改时间', range.start, range.end);

      await this.applySelectByLabel('质检状态', '质检通过');
      result.qcPassCount = await clickQueryAndReadCount();
      this.pushLog(`${date} ${this.describeItem(item)}：质检通过 ${result.qcPassCount}`);

      await this.applySelectByLabel('质检状态', '质检拒绝');
      result.qcRejectCount = await clickQueryAndReadCount();
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
      await this.cacheResult(date, item, checkpoint.results[date][item.key]);
      await this.saveCheckpoint();
    }

    async applyCategory(item) {
      const primary = getCategoryWrapper(0);
      if (!primary) {
        throw new Error('未找到品类选项');
      }
      await selectOption(primary, item.queryLabel);
      this.pushLog(`已选择品类：${this.describeItem(item)}`);
    }

    async applySelectByLabel(label, value) {
      const wrapper = getSelectWrapperByLabel(label, 0);
      if (!wrapper) {
        throw new Error(`未找到筛选条件：${label}`);
      }
      await selectOption(wrapper, value);
    }

    async completeJob() {
      const checkpoint = this.runtime.currentCheckpoint;
      const items = this.getCheckpointItems(checkpoint);
      const dateList = Array.isArray(checkpoint.dateList) && checkpoint.dateList.length
        ? checkpoint.dateList
        : buildDateList(checkpoint.startDate, checkpoint.endDate || checkpoint.startDate);
      checkpoint.status = 'done';
      checkpoint.statusText = '采集完成，可以下载结果了';
      checkpoint.summaryText = `共完成 ${dateList.length} 天`;
      await this.saveCheckpoint();

      const report = {
        date: checkpoint.startDate,
        startDate: checkpoint.startDate,
        endDate: checkpoint.endDate || checkpoint.startDate,
        itemKeys: items.map((item) => item.key),
        columns: buildReportColumns(items),
        rows: buildDailyReportRows(dateList, items, checkpoint.results),
        generatedAt: new Date().toISOString()
      };
      this.runtime.lastReport = report;
      await storageSetCached({
        [STORAGE_KEYS.report]: report
      });

      this.pushLog(`采集完成，已生成 ${dateList.length} 天结果`);
      await this.clearCheckpoint();
      this.runtime.running = false;
      this.runtime.stopping = false;
      this.runtime.statusText = '采集完成，可以下载结果了';
      this.render();
    }

    async failJob(error) {
      const message = error && error.message ? error.message : String(error);
      this.runtime.running = false;
      this.runtime.stopping = false;
      const stopped = message === '采集已结束';
      if (this.runtime.currentCheckpoint) {
        this.runtime.currentCheckpoint.status = stopped ? 'stopped' : 'error';
        this.runtime.currentCheckpoint.statusText = stopped ? '采集已结束，可以重新开始' : `采集遇到问题：${message}`;
        await this.saveCheckpoint();
      }
      this.runtime.statusText = stopped ? '采集已结束，可以重新开始' : `采集遇到问题：${message}`;
      this.pushLog(stopped ? '采集已结束' : `采集遇到问题：${message}`);
      this.render();
    }

    exportLastReport() {
      if (!this.runtime.lastReport) {
        this.pushLog('当前没有可导出的结果');
        return;
      }
      downloadReport(this.runtime.lastReport);
      this.pushLog(`已重新导出 ${formatReportPeriod(this.runtime.lastReport)} 的结果`);
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
    const fallback = buildSecondaryQcItemTargetCounts(itemCount, targetCount);
    if (!Array.isArray(value) || value.length !== itemCount) {
      return fallback;
    }
    const counts = value.map((count) => Math.max(0, Math.trunc(Number(count) || 0)));
    const total = counts.reduce((sum, count) => sum + count, 0);
    return total === targetCount ? counts : fallback;
  }

  function buildSecondaryQcItemRecordedCountsFromRows(itemKeys, itemTargetCounts, rows) {
    const counts = new Array(itemKeys.length).fill(0);
    const keyIndexMap = new Map(itemKeys.map((key, index) => [key, index]));
    let resolvedCount = 0;
    for (const row of rows) {
      const itemKey = normalizeText(row && row.itemKey);
      const itemIndex = keyIndexMap.get(itemKey);
      if (typeof itemIndex !== 'number') {
        continue;
      }
      counts[itemIndex] += 1;
      resolvedCount += 1;
    }
    let remaining = Math.max(0, rows.length - resolvedCount);
    for (let index = 0; index < counts.length && remaining > 0; index += 1) {
      const maxFill = Math.max(0, (itemTargetCounts[index] || 0) - counts[index]);
      if (!maxFill) {
        continue;
      }
      const fillCount = Math.min(maxFill, remaining);
      counts[index] += fillCount;
      remaining -= fillCount;
    }
    if (remaining > 0 && counts.length) {
      counts[counts.length - 1] += remaining;
    }
    return counts;
  }

  function normalizeSecondaryQcItemRecordedCounts(value, itemKeys, itemTargetCounts, rows) {
    const fallback = buildSecondaryQcItemRecordedCountsFromRows(itemKeys, itemTargetCounts, rows);
    if (!Array.isArray(value) || value.length !== itemKeys.length) {
      return fallback;
    }
    const counts = value.map((count) => Math.max(0, Math.trunc(Number(count) || 0)));
    const total = counts.reduce((sum, count) => sum + count, 0);
    return total === rows.length ? counts : fallback;
  }

  function normalizeSecondaryQcReport(report) {
    if (!report || typeof report !== 'object') {
      return null;
    }
    const startDate = normalizeText(report.startDate);
    const endDate = normalizeText(report.endDate) || startDate;
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
    if (!startDate) {
      return null;
    }
    return {
      ...report,
      startDate,
      endDate,
      targetCount: normalizePositiveInteger(report.targetCount, Math.max(rows.length, 1), 1, 999),
      actualCount: Math.max(0, Math.trunc(Number(report.actualCount) || rows.length || 0)),
      fileName: normalizeText(report.fileName),
      rows,
      generatedAt: report.generatedAt || new Date().toISOString()
    };
  }

  function normalizeSecondaryQcCheckpoint(checkpoint) {
    if (!checkpoint || typeof checkpoint !== 'object') {
      return null;
    }
    const startDate = normalizeText(checkpoint.startDate);
    const endDate = normalizeText(checkpoint.endDate) || startDate;
    const groupIds = normalizeSelectedGroupIds(checkpoint.groupIds);
    const itemKeys = normalizeSelectedKeys(checkpoint.itemKeys);
    const targetCount = normalizePositiveInteger(checkpoint.targetCount, 10, 1, 999);
    if (!startDate || !groupIds.length || !itemKeys.length) {
      return null;
    }
    const rows = Array.isArray(checkpoint.rows)
      ? checkpoint.rows.map(normalizeSecondaryQcDraftRow).filter(Boolean)
      : [];
    const itemTargetCounts = normalizeSecondaryQcItemTargetCounts(checkpoint.itemTargetCounts, itemKeys.length, targetCount);
    return {
      ...checkpoint,
      version: 2,
      startDate,
      endDate,
      groupIds,
      itemKeys,
      currentItemIndex: Number.isFinite(Number(checkpoint.currentItemIndex))
        ? Number(checkpoint.currentItemIndex)
        : 0,
      targetCount,
      itemTargetCounts,
      itemRecordedCounts: normalizeSecondaryQcItemRecordedCounts(checkpoint.itemRecordedCounts, itemKeys, itemTargetCounts, rows),
      processedTaskIds: uniqueTextList(checkpoint.processedTaskIds),
      rows,
      qcOperator: normalizeText(checkpoint.qcOperator),
      status: normalizeText(checkpoint.status) || 'running',
      statusText: normalizeText(checkpoint.statusText),
      summaryText: normalizeText(checkpoint.summaryText),
      logs: Array.isArray(checkpoint.logs) ? checkpoint.logs.slice(0, MAX_LOGS) : [],
      startedAt: checkpoint.startedAt || new Date().toISOString(),
      updatedAt: checkpoint.updatedAt || checkpoint.startedAt || new Date().toISOString()
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
      const progress = unwrapCacheEnvelope(storage[progressKey]);
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
      const response = unwrapCacheEnvelope(storage[responseKey]);
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

  function buildOmniVideoSummaryPrompt() {
    return [
      '你是视频内容理解助手，请完整理解这个视频。',
      '请用中文输出清晰、可复核的内容理解结果。',
      '必须覆盖：视频主体、核心事件、出现的人物、地点、重要物体、动作、画面主题、明显可支撑的标签线索。',
      '如果某个信息不确定，请明确写“无法确认”或“不确定”，不要臆断。'
    ].join('\n');
  }

  function buildFirstTagJudgePrompt(videoSummary, selectedTags) {
    return [
      '你是央视频标准化系统的二次质检助手。',
      '请根据“视频理解结果”和“当前已选成品标签”，判断现有成品标签是否错打，以及是否存在值得去系统里检索验证的缺失标签。',
      '规则：',
      '1. wrong_tags 只填明显错打的标签。',
      '2. missing_tags_candidate 只填可能需要补打、且值得去页面输入框搜索验证的标签。',
      '3. need_record 只要 wrong_tags 或 missing_tags_candidate 任一非空，就返回 true，否则 false。',
      '4. summary 用一句中文说明判断原因。',
      '5. 只能返回 JSON，不要返回其他文字。',
      '',
      `当前已选成品标签：${JSON.stringify(selectedTags || [])}`,
      `视频理解结果：${videoSummary}`,
      '',
      '输出格式：',
      '{"wrong_tags":[],"missing_tags_candidate":[],"need_record":false,"summary":""}'
    ].join('\n');
  }

  function buildFinalTagJudgePrompt(videoSummary, selectedTags, firstJudge, searchResults) {
    return [
      '你是央视频标准化系统的最终二次质检裁定助手。',
      '现在你已经拿到了视频理解结果、当前已选成品标签、第一轮判断结果，以及候选标签在系统中的真实搜索结果。',
      '请给出最终可落表结论。',
      '规则：',
      '1. missing_tags_actionable 只保留“页面真实搜得到”且“确实应该补打”的标签。',
      '2. wrong_tags 只保留明确错打的标签。',
      '3. problem_text 必须按这个格式输出：补打XX、YY 错打AA、BB。',
      '4. 如果没有补打项，就不要写“补打”；如果没有错打项，就不要写“错打”；如果都没有，返回空字符串。',
      '5. 只能返回 JSON，不要返回其他文字。',
      '',
      `视频理解结果：${videoSummary}`,
      `当前已选成品标签：${JSON.stringify(selectedTags || [])}`,
      `第一轮判断：${JSON.stringify(firstJudge || {})}`,
      `候选标签真实搜索结果：${JSON.stringify(searchResults || [])}`,
      '',
      '输出格式：',
      '{"missing_tags_actionable":[],"wrong_tags":[],"problem_text":""}'
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

  async function runSecondaryQcDetailWorker(requestId) {
    const requestKey = buildSecondaryQcWorkerRequestKey(requestId);
    const responseKey = buildSecondaryQcWorkerResponseKey(requestId);
    const cancelCheck = () => JOB_ABORT_CONTROLLER.secondaryQcWorkerStopped;
    const reportProgress = async (text) => {
      mountWorkerBadge(text);
      try {
        await updateSecondaryQcWorkerProgress(requestId, text);
      } catch (error) {
        // ignore progress sync errors
      }
    };
    startSecondaryQcWorkerAbortWatcher(requestId);
    enforcePageMuted();
    await reportProgress('详情页已打开，正在加载内容');
    let responsePayload = null;
    try {
      await ensureSecondaryQcWorkerNotStopped(requestId);
      const requestState = await storageGet(requestKey);
      const request = unwrapCacheEnvelope(requestState[requestKey]);
      if (!request || typeof request !== 'object') {
        throw new Error('未找到二次质检任务上下文');
      }

      await waitForDetailPageReady(cancelCheck);
      await reportProgress('正在读取视频信息');
      await ensureSecondaryQcWorkerNotStopped(requestId);

      const apiKey = normalizeText(request.apiKey);
      if (!apiKey) {
        throw new Error('未配置 DASHSCOPE_API_KEY');
      }

      const listVid = normalizeText(request.taskId || getDetailPageTaskId());
      const videoVid = getDetailVideoVid();
      if (!videoVid) {
        throw new Error('未读取到顶部 VID');
      }

      const yangshipinHtml = await fetchYangshipinPageHtml(videoVid, cancelCheck);
      const videoUrl = extractYangshipinVideoUrl(yangshipinHtml);
      await ensureSecondaryQcWorkerNotStopped(requestId);

      await reportProgress('正在理解视频内容');
      const videoSummary = await requestOmniVideoSummary(apiKey, videoUrl, buildOmniVideoSummaryPrompt(), cancelCheck);
      await ensureSecondaryQcWorkerNotStopped(requestId);

      await reportProgress('正在分析成品标签');
      const selectedTags = getDetailSelectedTags();
      const firstJudgeRaw = await requestTagJudge(apiKey, buildFirstTagJudgePrompt(videoSummary, selectedTags), cancelCheck);
      const firstJudge = JSON.parse(extractFirstJsonObject(firstJudgeRaw));
      const wrongTags = normalizeTagArray(firstJudge.wrong_tags);
      const missingCandidates = normalizeTagArray(firstJudge.missing_tags_candidate);
      await ensureSecondaryQcWorkerNotStopped(requestId);

      await reportProgress(
        missingCandidates.length
          ? `正在验证候选标签（1/${missingCandidates.length}）`
          : '当前没有候选标签需要验证'
      );
      const searchResults = [];
      for (let candidateIndex = 0; candidateIndex < missingCandidates.length; candidateIndex += 1) {
        const candidate = missingCandidates[candidateIndex];
        if (!candidate) {
          continue;
        }
        await reportProgress(`正在验证候选标签（${candidateIndex + 1}/${missingCandidates.length}）`);
        await ensureSecondaryQcWorkerNotStopped(requestId);
        try {
          const options = await searchAvailableTagOptions(candidate, cancelCheck);
          searchResults.push({
            keyword: candidate,
            options
          });
        } catch (error) {
          const message = error && error.message ? error.message : String(error);
          if (message === '采集已结束') {
            throw error;
          }
          searchResults.push({
            keyword: candidate,
            options: [],
            error: message
          });
        }
      }

      await reportProgress('正在生成最终结论');
      const finalJudgeRaw = await requestTagJudge(
        apiKey,
        buildFinalTagJudgePrompt(
          videoSummary,
          selectedTags,
          {
            wrong_tags: wrongTags,
            missing_tags_candidate: missingCandidates,
            need_record: Boolean(firstJudge.need_record),
            summary: normalizeText(firstJudge.summary)
          },
          searchResults
        ),
        cancelCheck
      );
      const finalJudge = JSON.parse(extractFirstJsonObject(finalJudgeRaw));
      const missingTagsActionable = normalizeTagArray(finalJudge.missing_tags_actionable);
      const finalWrongTags = normalizeTagArray(finalJudge.wrong_tags);
      const problemText = normalizeText(finalJudge.problem_text) || formatProblemText(missingTagsActionable, finalWrongTags);

      responsePayload = {
        status: 'completed',
        requestId,
        taskId: listVid,
        videoVid,
        videoUrl,
        needRecord: Boolean(problemText),
        problemText,
        missingTagsActionable,
        wrongTags: finalWrongTags,
        selectedTags,
        searchResults,
        summary: normalizeText(firstJudge.summary),
        completedAt: new Date().toISOString()
      };
      await reportProgress('处理完成，正在返回结果');
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      try {
        await updateSecondaryQcWorkerProgress(requestId, `处理失败：${message}`);
      } catch (syncError) {
        // ignore progress sync errors
      }
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
      if (!isListPage()) {
        return;
      }
      injectPanelStyle();
      await this.clearExpiredCache();
      await this.loadState();
      this.mountPanel();
      await this.tryResume();
    }

    async clearExpiredCache() {
      const state = await storageGet([
        STORAGE_KEYS.report,
        STORAGE_KEYS.resultCache,
        STORAGE_KEYS.dailyCheckpoint,
        STORAGE_KEYS.secondaryQcCheckpoint
      ]);
      const cutoffDate = getQuarterCutoffDateString(new Date());

      const nextReport = trimReportByCutoff(unwrapCacheEnvelope(state[STORAGE_KEYS.report]), cutoffDate);
      if (nextReport) {
        await storageSetCached({ [STORAGE_KEYS.report]: nextReport });
      } else {
        await storageRemove(STORAGE_KEYS.report);
      }

      const nextResultCache = trimResultCacheByCutoff(
        normalizeStoredResultCache(unwrapCacheEnvelope(state[STORAGE_KEYS.resultCache])),
        cutoffDate
      );
      if (Object.keys(nextResultCache).length) {
        await storageSetCached({ [STORAGE_KEYS.resultCache]: nextResultCache });
      } else {
        await storageRemove(STORAGE_KEYS.resultCache);
      }

      const checkpoints = [
        [STORAGE_KEYS.dailyCheckpoint, unwrapCacheEnvelope(state[STORAGE_KEYS.dailyCheckpoint])],
        [STORAGE_KEYS.secondaryQcCheckpoint, unwrapCacheEnvelope(state[STORAGE_KEYS.secondaryQcCheckpoint])]
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
      this.settings = normalizeWorkbenchSettings(unwrapCacheEnvelope(state[STORAGE_KEYS.settings]));
      this.settingsDraft = cloneWorkbenchSettings(this.settings);
      this.runtime.daily.report = normalizeStoredReport(unwrapCacheEnvelope(state[STORAGE_KEYS.report]));
      this.runtime.daily.resultCache = normalizeStoredResultCache(unwrapCacheEnvelope(state[STORAGE_KEYS.resultCache]));
      this.runtime.daily.checkpoint = normalizeStoredCheckpoint(unwrapCacheEnvelope(state[STORAGE_KEYS.dailyCheckpoint]));
      this.runtime.secondaryQc.report = normalizeSecondaryQcReport(unwrapCacheEnvelope(state[STORAGE_KEYS.secondaryQcReport]));
      this.runtime.secondaryQc.checkpoint = normalizeSecondaryQcCheckpoint(unwrapCacheEnvelope(state[STORAGE_KEYS.secondaryQcCheckpoint]));
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
        this.runtime.minimized = false;
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
                <button type="button" class="ysp-daily-panel__button" data-role="open-settings">设置</button>
                <div class="ysp-daily-panel__version">v${SCRIPT_VERSION}</div>
                <button type="button" class="ysp-daily-panel__minimize" data-role="minimize">收起</button>
              </div>
            </div>
          </div>
          <div class="ysp-daily-panel__body">
            <div class="ysp-daily-panel__main">
              <section class="ysp-daily-panel__module" data-role="daily-module">
                <div class="ysp-daily-panel__module-header">
                  <div class="ysp-daily-panel__toolbar">
                    <span class="ysp-daily-panel__label">日报模块</span>
                  </div>
                  <button type="button" class="ysp-daily-panel__collapse" data-role="toggle-daily">展开</button>
                </div>
                <div class="ysp-daily-panel__module-body" data-role="daily-body">
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
                  <div class="ysp-daily-panel__toolbar">
                    <span class="ysp-daily-panel__label">品类编组</span>
                  </div>
                  <div class="ysp-daily-panel__catalog" data-role="daily-groups"></div>
                  <div class="ysp-daily-panel__actions">
                    <button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--primary" data-role="start-daily">开始日报</button>
                  </div>
                </div>
              </section>

              <section class="ysp-daily-panel__module" data-role="secondary-qc-module">
                <div class="ysp-daily-panel__module-header">
                  <div class="ysp-daily-panel__toolbar">
                    <span class="ysp-daily-panel__label">二次质检</span>
                  </div>
                  <button type="button" class="ysp-daily-panel__collapse" data-role="toggle-secondary-qc">收起</button>
                </div>
                <div class="ysp-daily-panel__module-body" data-role="secondary-qc-body">
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
                  <div class="ysp-daily-panel__toolbar">
                    <span class="ysp-daily-panel__label">品类编组</span>
                  </div>
                  <div class="ysp-daily-panel__catalog" data-role="secondary-qc-groups"></div>
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
                <button type="button" class="ysp-daily-panel__button" data-role="pause">暂停任务</button>
                <button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--primary" data-role="resume">继续任务</button>
                <button type="button" class="ysp-daily-panel__button" data-role="stop">结束任务</button>
                <button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--danger" data-role="clear-data">清理缓存</button>
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
        dailyBody: root.querySelector('[data-role="daily-body"]'),
        dailyToggle: root.querySelector('[data-role="toggle-daily"]'),
        dailyStartDate: root.querySelector('#ysp-daily-start-date'),
        dailyEndDate: root.querySelector('#ysp-daily-end-date'),
        dailyGroups: root.querySelector('[data-role="daily-groups"]'),
        startDaily: root.querySelector('[data-role="start-daily"]'),
        secondaryQcModule: root.querySelector('[data-role="secondary-qc-module"]'),
        secondaryQcBody: root.querySelector('[data-role="secondary-qc-body"]'),
        secondaryQcToggle: root.querySelector('[data-role="toggle-secondary-qc"]'),
        secondaryQcStartDate: root.querySelector('#ysp-secondary-qc-start-date'),
        secondaryQcEndDate: root.querySelector('#ysp-secondary-qc-end-date'),
        secondaryQcTargetCount: root.querySelector('#ysp-secondary-qc-target-count'),
        secondaryQcGroups: root.querySelector('[data-role="secondary-qc-groups"]'),
        startSecondaryQc: root.querySelector('[data-role="start-secondary-qc"]'),
        pause: root.querySelector('[data-role="pause"]'),
        resume: root.querySelector('[data-role="resume"]'),
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
          label: '二次质检',
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

      this.refs.dailyToggle.addEventListener('click', () => {
        this.settings.ui.dailyCollapsed = !this.settings.ui.dailyCollapsed;
        this.persistSettings().catch(() => undefined);
        this.render();
      });
      this.refs.secondaryQcToggle.addEventListener('click', () => {
        this.settings.ui.secondaryQcCollapsed = !this.settings.ui.secondaryQcCollapsed;
        this.persistSettings().catch(() => undefined);
        this.render();
      });

      this.refs.dailyGroups.addEventListener('click', (event) => this.handleGroupSelection(event, 'daily'));
      this.refs.secondaryQcGroups.addEventListener('click', (event) => this.handleGroupSelection(event, 'secondaryQc'));
      this.refs.dailyGroups.addEventListener('keydown', (event) => this.handleGroupSelectionKeydown(event, 'daily'));
      this.refs.secondaryQcGroups.addEventListener('keydown', (event) => this.handleGroupSelectionKeydown(event, 'secondaryQc'));

      this.refs.startDaily.addEventListener('click', () => {
        this.startDailyJob().catch((error) => this.failJob(error));
      });
      this.refs.startSecondaryQc.addEventListener('click', () => {
        this.startSecondaryQcJob().catch((error) => this.failJob(error));
      });
      this.refs.pause.addEventListener('click', () => this.pauseCurrentJob());
      this.refs.resume.addEventListener('click', () => {
        this.resumePausedJob().catch((error) => this.failJob(error));
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
      if (!(target instanceof HTMLElement) || this.runtime.running) {
        return;
      }
      const groupCard = target.closest('[data-group-card]');
      if (!groupCard) {
        return;
      }
      const groupId = groupCard.getAttribute('data-group-card');
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

    handleGroupSelectionKeydown(event, moduleType) {
      const target = event.target;
      if (!(target instanceof HTMLElement) || this.runtime.running) {
        return;
      }
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      const groupCard = target.closest('[data-group-card]');
      if (!groupCard) {
        return;
      }
      event.preventDefault();
      this.handleGroupSelection(event, moduleType);
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
      this.render();
    }

    openSettingsModal() {
      this.settingsDraft = cloneWorkbenchSettings(this.settings);
      this.settingsModalOpen = true;
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

    renderGroupCards(container, moduleType) {
      const selected = new Set(this.getModuleSettings(moduleType).groupIds);
      container.innerHTML = SUBGROUP_ENTRIES.map((subgroup) => {
        const selectedClass = selected.has(subgroup.id) ? ' is-selected' : '';
        return `
          <section
            class="ysp-daily-panel__group${selectedClass}"
            data-theme="${escapeXml(subgroup.theme)}"
            data-group-card="${escapeXml(subgroup.id)}"
            role="button"
            tabindex="${this.runtime.running ? '-1' : '0'}"
            aria-pressed="${selected.has(subgroup.id) ? 'true' : 'false'}"
          >
            <div class="ysp-daily-panel__group-header">
              <h3 class="ysp-daily-panel__group-title">${escapeXml(subgroup.label)}</h3>
            </div>
          </section>
        `;
      }).join('');
    }

    renderStatus() {
      const jobLabel = this.runtime.jobType === 'secondaryQc'
        ? '二次质检'
        : this.runtime.jobType === 'daily'
          ? '日报'
          : '空闲';
      this.refs.status.innerHTML = `
        <div class="ysp-daily-panel__status-head">
          <span class="ysp-daily-panel__label">当前状态</span>
        </div>
        <div class="ysp-daily-panel__status-value">${escapeXml(this.runtime.statusText || '等待开始')}</div>
        <div class="ysp-daily-panel__status-subtext">任务类型：${escapeXml(jobLabel)}</div>
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
      if (this.runtime.running) {
        enforcePageMuted();
      } else {
        releasePageMuted();
      }
      this.panel.classList.toggle('is-minimized', this.runtime.minimized);
      this.panel.classList.toggle('is-settings-open', this.settingsModalOpen);
      this.syncSettingsToInputs();
      this.renderGroupCards(this.refs.dailyGroups, 'daily');
      this.renderGroupCards(this.refs.secondaryQcGroups, 'secondaryQc');

      this.refs.dailyModule.classList.toggle('is-collapsed', this.settings.ui.dailyCollapsed);
      this.refs.dailyBody.hidden = this.settings.ui.dailyCollapsed;
      this.refs.dailyToggle.textContent = this.settings.ui.dailyCollapsed ? '展开' : '收起';

      this.refs.secondaryQcModule.classList.toggle('is-collapsed', this.settings.ui.secondaryQcCollapsed);
      this.refs.secondaryQcBody.hidden = this.settings.ui.secondaryQcCollapsed;
      this.refs.secondaryQcToggle.textContent = this.settings.ui.secondaryQcCollapsed ? '展开' : '收起';

      const disabled = this.runtime.running;
      this.refs.dailyStartDate.disabled = disabled;
      this.refs.dailyEndDate.disabled = disabled;
      this.refs.secondaryQcStartDate.disabled = disabled;
      this.refs.secondaryQcEndDate.disabled = disabled;
      this.refs.secondaryQcTargetCount.disabled = disabled;
      this.refs.startDaily.disabled = disabled;
      this.refs.startSecondaryQc.disabled = disabled;
      this.refs.clearData.disabled = disabled;
      this.refs.pause.disabled = !disabled;
      this.refs.stop.disabled = !disabled;
      const pausedTask = this.getPausedTaskMeta();
      this.refs.resume.disabled = disabled || !pausedTask;
      this.refs.resume.textContent = pausedTask ? `继续${pausedTask.label}` : '继续任务';
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
      const activeRequestId = normalizeText(unwrapCacheEnvelope(activeRequestState[STORAGE_KEYS.secondaryQcWorkerActiveRequest]));
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
        const activeRequestId = normalizeText(unwrapCacheEnvelope(activeRequestState[STORAGE_KEYS.secondaryQcWorkerActiveRequest]));
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

    async resumePausedJob() {
      if (this.runtime.running) {
        return;
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
        const rows = parseCurrentListRows().filter((row) => row && row.taskId);
        for (let index = rows.length - 1; index >= 0; index -= 1) {
          if (checkpoint.rows.length >= checkpoint.targetCount || (checkpoint.itemRecordedCounts[itemIndex] || 0) >= itemTargetCount) {
            return;
          }
          const row = rows[index];
          if (!row.taskId || localSeen.has(row.taskId) || checkpoint.processedTaskIds.includes(row.taskId)) {
            continue;
          }
          localSeen.add(row.taskId);
          checkpoint.processedTaskIds.push(row.taskId);
          await this.saveCheckpoint('secondaryQc');
          await this.handleSecondaryQcRow(item, itemIndex, row, pageNumber, totalPages, cancelCheck);
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
          return;
        }
        this.pushLog(`${row.taskId}：${message}，已跳过`);
        return;
      } finally {
        await storageRemove([requestKey, responseKey, progressKey]);
        await clearSecondaryQcWorkerActiveRequest(requestId);
      }

      if (!response) {
        this.pushLog(`${row.taskId}：未收到详情页结果`);
        return;
      }
      if (response.status === 'error') {
        this.pushLog(`${row.taskId}：处理失败，${response.error}`);
        return;
      }

      const problemText = normalizeText(response.problemText);
      if (!problemText) {
        this.pushLog(`${row.taskId}：未发现问题`);
        return;
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
  let activeWorkerRequestId = '';

  async function ensureListWorkbenchMounted() {
    if (!isListPage()) {
      if (app) {
        app.destroy();
        app = null;
      }
      return;
    }
    await waitForBodyReady();
    if (!app) {
      app = new YspWorkbenchApp();
      await app.init();
      return;
    }
    if (!document.getElementById('ysp-daily-panel-root')) {
      app.mountPanel();
      await app.tryResume();
    }
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

  async function runBootstrap() {
    if (booting) {
      return;
    }
    booting = true;
    try {
      if (!isSupportedPage()) {
        if (app) {
          app.destroy();
          app = null;
        }
        return;
      }
      if (isDetailPage()) {
        if (app) {
          app.destroy();
          app = null;
        }
        await ensureDetailWorkerHandled();
        return;
      }
      await ensureListWorkbenchMounted();
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
      if (isListPage() && !document.getElementById('ysp-daily-panel-root')) {
        queueBootstrap();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  installRouteHooks();
  runBootstrap();
})();
