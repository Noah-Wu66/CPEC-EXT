// ==UserScript==
// @name         二次质检日报采集
// @namespace    https://github.com/Noah-Wu66/CPEC-EXT
// @version      1.2.23
// @description  在标准化系统页面按日期区间和编组子品类采集日报，并静默缓存到本地
// @author       Noah
// @match        http://std.video.cloud.cctv.com/*
// @match        https://std.video.cloud.cctv.com/*
// @updateURL    https://raw.githubusercontent.com/Noah-Wu66/CPEC-EXT/main/ysp/ysp-daily-report.user.js
// @downloadURL  https://raw.githubusercontent.com/Noah-Wu66/CPEC-EXT/main/ysp/ysp-daily-report.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_info
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  if (window.__YSP_DAILY_REPORTER__) {
    return;
  }
  window.__YSP_DAILY_REPORTER__ = true;

  const SCRIPT_VERSION = (typeof GM_info !== 'undefined' && GM_info && GM_info.script && GM_info.script.version) || '1.2.23';

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
  min-height: 540px;
}

.ysp-daily-panel__main,
.ysp-daily-panel__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
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
    min-height: auto;
    overflow-y: auto;
  }

  .ysp-daily-panel__date-grid {
    grid-template-columns: 1fr;
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
          label: '文史、自然、科技、教育',
          categories: [
            { key: 'knowledge-history', label: '文史', queryLabel: '文史' },
            { key: 'knowledge-nature', label: '自然', queryLabel: '自然科学', exportLabel: '自然' },
            { key: 'knowledge-technology', label: '科技', queryLabel: '科技' },
            { key: 'knowledge-education', label: '教育', queryLabel: '教育' }
          ]
        },
        {
          id: 'knowledge-life',
          label: '生活、健康、美食、青少',
          categories: [
            { key: 'knowledge-life-style', label: '生活', queryLabel: '生活方式', exportLabel: '生活' },
            { key: 'knowledge-health', label: '健康', queryLabel: '健康' },
            { key: 'knowledge-food', label: '美食', queryLabel: '美食' },
            { key: 'knowledge-youth', label: '青少', queryLabel: '青少' }
          ]
        },
        {
          id: 'knowledge-animals',
          label: '动物、法治、时尚',
          categories: [
            { key: 'knowledge-animal', label: '动物', queryLabel: '动物' },
            { key: 'knowledge-law', label: '法治', queryLabel: '法治' },
            { key: 'knowledge-fashion', label: '时尚', queryLabel: '时尚' }
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
          label: '国际、军事、体育',
          categories: [
            { key: 'information-international', label: '国际', queryLabel: '国际/港澳台', exportLabel: '国际/港澳台' },
            { key: 'information-military', label: '军事', queryLabel: '军事' },
            { key: 'information-sports', label: '体育', queryLabel: '体育' }
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
          label: '民生、社会、三农',
          categories: [
            { key: 'information-livelihood', label: '民生', queryLabel: '民生' },
            { key: 'information-society', label: '社会', queryLabel: '社会' },
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
          label: '综艺、曲艺、音乐、舞蹈、搞笑',
          categories: [
            { key: 'culture-variety', label: '综艺', queryLabel: '综艺' },
            { key: 'culture-folk-art', label: '曲艺', queryLabel: '曲艺' },
            { key: 'culture-music', label: '音乐', queryLabel: '音乐' },
            { key: 'culture-dance', label: '舞蹈', queryLabel: '舞蹈' },
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
    settings: 'yspDailySettingsV1',
    report: 'yspDailyLastReportV1',
    resultCache: 'yspDailyResultCacheV1'
  };

  const FALLBACK_PREFIX = 'yspTmFallback:';
  const SESSION_KEY = 'yspDailySessionKey';
  const CHECKPOINT_PREFIX = 'yspDailyCheckpoint:';
  const MAX_LOGS = 50;
  const QUERY_TIMEOUT = 90000;
  const PAGE_READY_TIMEOUT = 60000;

  function injectPanelStyle() {
    if (typeof GM_addStyle === 'function') {
      GM_addStyle(PANEL_STYLE);
      return;
    }
    const style = document.createElement('style');
    style.textContent = PANEL_STYLE;
    document.head.appendChild(style);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
    if (CATEGORY_ENTRY_MAP.has(token)) {
      return CATEGORY_ENTRY_MAP.get(token);
    }
    return CATEGORY_ENTRIES.find((entry) => {
      return [
        entry.key,
        entry.label,
        entry.exportLabel,
        entry.queryLabel,
        entry.subgroupLabel
      ].includes(token);
    }) || null;
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
    if (SUBGROUP_ENTRY_MAP.has(token)) {
      return SUBGROUP_ENTRY_MAP.get(token);
    }
    return SUBGROUP_ENTRIES.find((entry) => {
      return [
        entry.id,
        entry.label
      ].includes(token);
    }) || null;
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
        continue;
      }
      const categoryEntry = getCategoryEntry(value);
      if (categoryEntry) {
        matchedIds.push(categoryEntry.subgroupId);
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
    const entry = getCategoryEntry(rawRow && (rawRow.key || rawRow.category || rawRow.label));
    const base = createEmptyResult(entry || (rawRow && (rawRow.category || rawRow.label || rawRow.key)) || '');
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

  function isStoredMetricRow(rawRow) {
    return Boolean(
      rawRow
      && typeof rawRow === 'object'
      && [
        'inboundCount',
        'stdPassCount',
        'stdRejectCount',
        'stdTotalCount',
        'qcPassCount',
        'qcRejectCount',
        'qcTotalCount'
      ].some((key) => key in rawRow)
    );
  }

  function normalizeStoredReport(report) {
    if (!report || typeof report !== 'object') {
      return null;
    }

    const sourceKeys = normalizeSelectedKeys(
      report.itemKeys || report.columns?.map((column) => column.key || column.label) || report.categories
    );
    const columns = buildReportColumns(getEntriesByKeys(sourceKeys));
    const rawRows = Array.isArray(report.rows) ? report.rows : [];
    const normalizedRows = [];

    if (rawRows.length && rawRows.every((row) => row && typeof row === 'object' && Array.isArray(row.results))) {
      for (const rawRow of rawRows) {
        if (!rawRow.date) {
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
    } else {
      const rowMap = new Map();
      for (const row of rawRows) {
        const normalized = normalizeStoredResultRow(row);
        if (normalized.key) {
          rowMap.set(normalized.key, normalized);
        }
      }
      const singleDate = report.date || report.startDate || '';
      if (singleDate) {
        normalizedRows.push({
          date: singleDate,
          results: columns.map((column) => rowMap.get(column.key) || createEmptyResult(column.key))
        });
      }
    }

    const startDate = report.startDate || (normalizedRows[0] && normalizedRows[0].date) || report.date || '';
    const endDate = report.endDate || (normalizedRows.length ? normalizedRows[normalizedRows.length - 1].date : startDate) || startDate;
    return {
      date: startDate,
      startDate,
      endDate,
      columns,
      rows: normalizedRows,
      generatedAt: report.generatedAt || new Date().toISOString()
    };
  }

  function normalizeStoredCheckpoint(checkpoint) {
    if (!checkpoint || typeof checkpoint !== 'object') {
      return null;
    }
    const groupIds = normalizeSelectedGroupIds(checkpoint.groupIds || checkpoint.itemKeys || checkpoint.categories);
    const itemKeys = normalizeSelectedKeys(checkpoint.itemKeys || checkpoint.categories);
    const startDate = checkpoint.startDate || checkpoint.date || '';
    const endDate = checkpoint.endDate || checkpoint.date || '';
    const dateList = Array.isArray(checkpoint.dateList) && checkpoint.dateList.length
      ? checkpoint.dateList.filter(Boolean)
      : buildDateList(startDate, endDate || startDate);
    const normalizedResults = {};
    if (checkpoint.results && typeof checkpoint.results === 'object') {
      for (const [key, value] of Object.entries(checkpoint.results)) {
        if (isStoredMetricRow(value)) {
          const targetDate = dateList[0] || startDate;
          const entry = getCategoryEntry(key) || getCategoryEntry(value && (value.key || value.category || value.label));
          if (!targetDate || !entry) {
            continue;
          }
          if (!normalizedResults[targetDate]) {
            normalizedResults[targetDate] = {};
          }
          normalizedResults[targetDate][entry.key] = normalizeStoredResultRow({
            ...value,
            key: entry.key
          });
          continue;
        }
        if (!value || typeof value !== 'object') {
          continue;
        }
        const dayResults = {};
        for (const [rowKey, rowValue] of Object.entries(value)) {
          const entry = getCategoryEntry(rowKey) || getCategoryEntry(rowValue && (rowValue.key || rowValue.category || rowValue.label));
          if (!entry) {
            continue;
          }
          dayResults[entry.key] = normalizeStoredResultRow({
            ...rowValue,
            key: entry.key
          });
        }
        if (Object.keys(dayResults).length) {
          normalizedResults[key] = dayResults;
        }
      }
    }
    return {
      ...checkpoint,
      version: 4,
      startDate,
      endDate: endDate || startDate,
      dateList,
      groupIds,
      itemKeys,
      currentDateIndex: Number.isFinite(Number(checkpoint.currentDateIndex)) ? Number(checkpoint.currentDateIndex) : 0,
      currentItemIndex: Number.isFinite(Number(checkpoint.currentItemIndex)) ? Number(checkpoint.currentItemIndex) : Number(checkpoint.currentIndex || 0),
      results: normalizedResults
    };
  }

  function normalizeStoredResultCache(cache) {
    const source = cache && typeof cache === 'object' && cache.rows && typeof cache.rows === 'object'
      ? cache.rows
      : cache;
    if (!source || typeof source !== 'object') {
      return {};
    }
    const normalizedCache = {};
    for (const [date, dayResults] of Object.entries(source)) {
      if (!dayResults || typeof dayResults !== 'object') {
        continue;
      }
      const normalizedDayResults = {};
      for (const [rowKey, rowValue] of Object.entries(dayResults)) {
        const entry = getCategoryEntry(rowKey) || getCategoryEntry(rowValue && (rowValue.key || rowValue.category || rowValue.label));
        if (!entry) {
          continue;
        }
        const normalizedRow = normalizeStoredResultRow({
          ...rowValue,
          key: entry.key
        });
        if (!normalizedRow.collectionCompleted) {
          continue;
        }
        normalizedDayResults[entry.key] = normalizedRow;
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
    const rows = (normalizedReport.rows || []).filter((row) => !isDateExpiredByQuarter(row.date, cutoffDateString));
    if (!rows.length) {
      return null;
    }
    return {
      ...normalizedReport,
      date: rows[0].date,
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
    return location.hostname === 'std.video.cloud.cctv.com' && location.pathname.startsWith('/stdList');
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

  function readFallbackValue(key, fallback) {
    const raw = localStorage.getItem(`${FALLBACK_PREFIX}${key}`);
    if (raw === null) {
      return fallback;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeFallbackValue(key, value) {
    localStorage.setItem(`${FALLBACK_PREFIX}${key}`, JSON.stringify(value));
  }

  function getEventWindow(target) {
    return (target && target.ownerDocument && target.ownerDocument.defaultView) || window;
  }

  function createMouseEvent(target, type, init) {
    const eventWindow = getEventWindow(target);
    const MouseEventCtor = eventWindow.MouseEvent || MouseEvent;
    return new MouseEventCtor(type, {
      bubbles: true,
      cancelable: true,
      view: eventWindow,
      ...(init || {})
    });
  }

  function createKeyboardEvent(target, type, init) {
    const eventWindow = getEventWindow(target);
    const KeyboardEventCtor = eventWindow.KeyboardEvent || KeyboardEvent;
    return new KeyboardEventCtor(type, {
      bubbles: true,
      ...(init || {})
    });
  }

  async function storageGet(keys) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    const result = {};
    for (const key of keyList) {
      if (typeof GM_getValue === 'function') {
        result[key] = GM_getValue(key);
      } else {
        result[key] = readFallbackValue(key, undefined);
      }
    }
    return result;
  }

  async function storageSet(values) {
    for (const [key, value] of Object.entries(values)) {
      if (typeof GM_setValue === 'function') {
        GM_setValue(key, value);
      } else {
        writeFallbackValue(key, value);
      }
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
      if (typeof GM_deleteValue === 'function') {
        GM_deleteValue(key);
      } else {
        localStorage.removeItem(`${FALLBACK_PREFIX}${key}`);
      }
    }
  }

  function triggerMouseClick(element) {
    element.scrollIntoView({ block: 'center', inline: 'center' });
    const events = ['mouseover', 'mousedown', 'mouseup', 'click'];
    for (const type of events) {
      element.dispatchEvent(createMouseEvent(element, type));
    }
  }

  async function waitFor(checker, timeoutMs, message) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
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

  async function openDropdownForOption(wrapper, optionText) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      triggerMouseClick(wrapper);
      const dropdown = await waitFor(() => {
        const candidates = getVisibleSelectDropdowns();
        return candidates.find((candidate) => {
          return getDropdownOptions(candidate).some((option) => normalizeText(option.textContent) === optionText);
        });
      }, 4000, `未找到选项面板：${optionText}`);
      if (dropdown) {
        return dropdown;
      }
    }
    throw new Error(`无法打开下拉框：${optionText}`);
  }

  async function selectOption(wrapper, optionText) {
    if (getSelectedTextFromWrapper(wrapper) === optionText) {
      return;
    }
    const dropdown = await openDropdownForOption(wrapper, optionText);
    const option = getDropdownOptions(dropdown).find((item) => {
      return normalizeText(item.textContent) === optionText && !item.classList.contains('is-disabled');
    });
    if (!option) {
      throw new Error(`未找到选项：${optionText}`);
    }
    triggerMouseClick(option);
    await waitFor(() => getSelectedTextFromWrapper(wrapper) === optionText, 4000, `选项未生效：${optionText}`);
  }

  function setNativeInputValue(input, value) {
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    descriptor.set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function setDateRange(labelText, startDate, endDate) {
    const item = getFormItemByLabel(labelText);
    if (!item) {
      throw new Error(`未找到时间字段：${labelText}`);
    }
    const inputs = Array.from(item.querySelectorAll('input.el-range-input')).filter(isVisible);
    if (inputs.length < 2) {
      throw new Error(`时间字段不可用：${labelText}`);
    }
    const startValue = formatDateTime(startDate);
    const endValue = formatDateTime(endDate);
    inputs[0].focus();
    setNativeInputValue(inputs[0], startValue);
    inputs[0].blur();
    await sleep(120);
    inputs[1].focus();
    setNativeInputValue(inputs[1], endValue);
    inputs[1].dispatchEvent(createKeyboardEvent(inputs[1], 'keydown', { key: 'Enter' }));
    inputs[1].dispatchEvent(createKeyboardEvent(inputs[1], 'keyup', { key: 'Enter' }));
    inputs[1].blur();
    document.body.dispatchEvent(createMouseEvent(document.body, 'click'));
    await waitFor(() => inputs[0].value === startValue && inputs[1].value === endValue, 4000, `${labelText} 未写入成功`);
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

  async function clickQueryAndReadCount() {
    const queryButton = findButtonByText('查询');
    if (!queryButton) {
      throw new Error('未找到查询按钮');
    }
    triggerMouseClick(queryButton);
    const startedAt = Date.now();
    let stableValue = null;
    let stableSince = 0;
    while (Date.now() - startedAt < QUERY_TIMEOUT) {
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
      throw new Error('未找到重置按钮');
    }
    triggerMouseClick(resetButton);
    await sleep(600);
  }

  async function waitForPageReady() {
    await waitFor(() => {
      return findButtonByText('查询')
        && findButtonByText('重置')
        && getCategoryWrapper(0)
        && getFormItemByLabel('创建时间')
        && getFormItemByLabel('修改时间');
    }, PAGE_READY_TIMEOUT, '页面控件未准备完成');
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
    const startDate = report.startDate || report.date || '';
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
    const startDate = report.startDate || report.date || '';
    const endDate = report.endDate || startDate;
    const entries = getEntriesByKeys(report && report.itemKeys);
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
      const startDate = rawSettings.startDate || rawSettings.date || '';
      let endDate = rawSettings.endDate || '';
      const normalizedStartDate = startDate && startDate <= maxDate ? startDate : '';
      if (!normalizedStartDate) {
        endDate = '';
      }
      if (endDate && endDate > maxDate) {
        endDate = '';
      }
      if (normalizedStartDate && endDate && endDate < normalizedStartDate) {
        endDate = '';
      }
      this.savedSettings = {
        startDate: normalizedStartDate,
        endDate,
        groupIds: normalizeSelectedGroupIds(rawSettings.groupIds || rawSettings.itemKeys || rawSettings.categories)
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
        this.runtime.statusText = this.runtime.currentCheckpoint.statusText || '正在继续上次任务';
      } else if (this.runtime.currentCheckpoint && this.runtime.currentCheckpoint.status === 'stopped') {
        this.runtime.statusText = this.runtime.currentCheckpoint.statusText || '上次任务已停止';
      } else if (this.runtime.currentCheckpoint && this.runtime.currentCheckpoint.status === 'error') {
        this.runtime.statusText = this.runtime.currentCheckpoint.statusText || '上次任务停在错误位置';
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
                </div>
              </div>
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
            <h3 class="ysp-daily-panel__report-title">日报结果已就绪</h3>
            <div class="ysp-daily-panel__report-meta">${escapeXml(formatReportPeriod(this.runtime.lastReport))}</div>
          </div>
          <button type="button" class="ysp-daily-panel__download" data-role="download">下载 Excel</button>
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
      this.refs.start.textContent = this.runtime.running ? '采集中' : '开始采集';
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
        throw new Error('任务已停止');
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
      this.runtime.statusText = '进度已清除';
      this.pushLog('已清除当前页签的执行进度');
      this.render();
    }

    stopCurrentJob() {
      if (!this.runtime.running) {
        return;
      }
      this.runtime.stopping = true;
      this.runtime.statusText = '正在停止，当前步骤结束后会退出';
      this.pushLog('收到停止指令');
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
        statusText: '正在准备页面控件',
        summaryText: ''
      };
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
      this.pushLog('检测到未完成任务，继续执行');
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
        throw new Error('当前任务没有可采集的子品类');
      }
      if (!dateList.length) {
        throw new Error('当前任务没有可采集的日期');
      }

      if (checkpoint.phase === 'resume-qc') {
        const currentDate = dateList[checkpoint.currentDateIndex];
        const item = items[checkpoint.currentItemIndex];
        if (currentDate && item) {
          const cachedResult = this.getCachedResult(currentDate, item);
          if (cachedResult) {
            checkpoint.results[currentDate] = checkpoint.results[currentDate] || {};
            checkpoint.results[currentDate][item.key] = cachedResult;
            this.pushLog(`${currentDate} ${this.describeItem(item)}：已复用本地缓存`);
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
          this.pushLog(`${currentDate} ${this.describeItem(item)}：已复用本地缓存`);
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
        checkpoint.summaryText = `${currentDate} ${this.describeItem(item)}：等待刷新后采集质检`;
        this.updateCheckpointStatus(`准备刷新页面继续 ${item.exportLabel}`, `${checkpoint.currentDateIndex + 1}/${dateList.length} · ${checkpoint.currentItemIndex + 1}/${items.length} · 等待刷新`);
        await this.saveCheckpoint();
        this.pushLog(`${currentDate} ${this.describeItem(item)}：标准化已完成，刷新页面继续质检`);
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
        throw new Error('未找到主品类选择器');
      }
      await selectOption(primary, item.queryLabel);
      this.pushLog(`已选择品类：${this.describeItem(item)}`);
    }

    async applySelectByLabel(label, value) {
      const wrapper = getSelectWrapperByLabel(label, 0);
      if (!wrapper) {
        throw new Error(`未找到筛选项：${label}`);
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
      checkpoint.statusText = '采集完成，下载按钮已就绪';
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
      this.runtime.statusText = '采集完成，点击下载 Excel';
      this.render();
    }

    async failJob(error) {
      const message = error && error.message ? error.message : String(error);
      this.runtime.running = false;
      this.runtime.stopping = false;
      const stopped = message === '任务已停止';
      if (this.runtime.currentCheckpoint) {
        this.runtime.currentCheckpoint.status = stopped ? 'stopped' : 'error';
        this.runtime.currentCheckpoint.statusText = stopped ? '任务已停止，可清除后重新开始' : `任务中断：${message}`;
        await this.saveCheckpoint();
      }
      this.runtime.statusText = stopped ? '任务已停止，可清除后重新开始' : `任务中断：${message}`;
      this.pushLog(stopped ? '任务已停止' : `错误：${message}`);
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

  let app = null;
  let booting = false;
  let lastHref = location.href;

  async function ensureAppMounted() {
    if (!isSupportedPage()) {
      if (app) {
        app.destroy();
        app = null;
      }
      return;
    }

    await waitForBodyReady();
    if (!app) {
      app = new DailyReporterApp();
      await app.init();
      return;
    }

    if (!document.getElementById('ysp-daily-panel-root')) {
      app.mountPanel();
      await app.tryResume();
    }
  }

  async function runBootstrap() {
    if (booting) {
      return;
    }
    booting = true;
    try {
      await ensureAppMounted();
    } catch (error) {
      console.error('[二次质检日报采集]', error);
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
      if (typeof original !== 'function') {
        continue;
      }
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
    observer.observe(document.documentElement || document, { childList: true, subtree: true });
  }

  installRouteHooks();
  runBootstrap();
})();
