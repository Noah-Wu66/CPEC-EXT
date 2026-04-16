// ==UserScript==
// @name         YSP 日报采集
// @namespace    https://github.com/Noah-Wu66/CPEC-EXT
// @version      1.1.2
// @description  在标准化系统页面按单日和主品类采集日报并导出 Excel
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

  const SCRIPT_VERSION = (typeof GM_info !== 'undefined' && GM_info && GM_info.script && GM_info.script.version) || '1.1.2';

  const PANEL_STYLE = `
#ysp-daily-panel-root {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 2147483646;
  width: 380px;
  color: #17212b;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

.ysp-daily-panel {
  overflow: hidden;
  border: 1px solid rgba(20, 43, 62, 0.12);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(255, 249, 239, 0.98), rgba(246, 251, 255, 0.98)),
    #ffffff;
  box-shadow: 0 18px 50px rgba(17, 40, 67, 0.18);
  backdrop-filter: blur(12px);
}

.ysp-daily-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  background: linear-gradient(135deg, #18344c, #2b5b80);
  color: #f8fbff;
}

.ysp-daily-panel__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.ysp-daily-panel__subtitle {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(248, 251, 255, 0.78);
}

.ysp-daily-panel__version {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 11px;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.ysp-daily-panel__body {
  padding: 16px 18px 18px;
}

.ysp-daily-panel__section + .ysp-daily-panel__section {
  margin-top: 14px;
}

.ysp-daily-panel__label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #18344c;
}

.ysp-daily-panel__hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: #58708a;
}

.ysp-daily-panel__date {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid rgba(24, 52, 76, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  color: #17212b;
}

.ysp-daily-panel__categories {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  max-height: 248px;
  padding: 4px;
  overflow-y: auto;
  border: 1px solid rgba(24, 52, 76, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.68);
}

.ysp-daily-panel__category {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid rgba(24, 52, 76, 0.08);
  border-radius: 12px;
  background: #ffffff;
  font-size: 13px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.ysp-daily-panel__category:hover {
  border-color: rgba(50, 99, 140, 0.28);
  box-shadow: 0 6px 16px rgba(37, 86, 126, 0.08);
}

.ysp-daily-panel__category input {
  margin: 0;
}

.ysp-daily-panel__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.ysp-daily-panel__button {
  min-height: 42px;
  padding: 10px 12px;
  border: 0;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
}

.ysp-daily-panel__button:disabled {
  cursor: default;
  opacity: 0.56;
  transform: none;
  box-shadow: none;
}

.ysp-daily-panel__button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.ysp-daily-panel__button--primary {
  background: linear-gradient(135deg, #0f7c92, #1f5f87);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(31, 95, 135, 0.2);
}

.ysp-daily-panel__button--secondary {
  background: #edf4fb;
  color: #17344c;
}

.ysp-daily-panel__button--ghost {
  background: #fff6eb;
  color: #8a4b12;
}

.ysp-daily-panel__status {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(24, 52, 76, 0.06);
  font-size: 13px;
  line-height: 1.6;
  color: #28445f;
}

.ysp-daily-panel__status strong {
  color: #17344c;
}

.ysp-daily-panel__summary {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(24, 52, 76, 0.14);
  font-size: 12px;
  color: #46617b;
}

.ysp-daily-panel__logs {
  max-height: 180px;
  overflow-y: auto;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(24, 52, 76, 0.1);
}

.ysp-daily-panel__log {
  font-size: 12px;
  line-height: 1.6;
  color: #39556f;
}

.ysp-daily-panel__log + .ysp-daily-panel__log {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed rgba(24, 52, 76, 0.08);
}

.ysp-daily-panel__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.ysp-daily-panel__toolbar-button {
  border: 0;
  padding: 0;
  background: transparent;
  color: #386282;
  font-size: 12px;
  cursor: pointer;
}

.ysp-daily-panel__toolbar-button:hover {
  color: #14344d;
}

@media (max-width: 1280px) {
  #ysp-daily-panel-root {
    width: 340px;
  }
}
  `;

  const CATEGORY_ORDER = [
    '社会',
    '时政',
    '国际/港澳台',
    '民生',
    '财经',
    '体育',
    '综艺',
    '音乐',
    '舞蹈',
    '文史',
    '电影',
    '电视剧',
    '曲艺',
    '搞笑',
    '动漫',
    '青少',
    '健康',
    '教育',
    '美食',
    '时尚',
    '军事',
    '三农',
    '法治',
    '动物',
    '自然科学',
    '科技',
    '旅游',
    '汽车',
    '游戏',
    '生活方式'
  ];

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
    report: 'yspDailyLastReportV1'
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

  function createEmptyResult(category) {
    return {
      category,
      inboundCount: 0,
      stdPassCount: 0,
      stdRejectCount: 0,
      stdTotalCount: 0,
      stdRejectRate: 0,
      qcPassCount: 0,
      qcRejectCount: 0,
      qcTotalCount: 0,
      qcRejectRate: 0
    };
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

  function buildOrderedResults(job) {
    return job.categories.map((category) => {
      const result = job.results[category] || createEmptyResult(category);
      return {
        category,
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

  function buildColumnsXml(categories) {
    const parts = ['<cols>'];
    const totalColumns = 1 + categories.length * METRIC_HEADERS.length;
    for (let index = 1; index <= totalColumns; index += 1) {
      const width = index === 1 ? 12 : (index - 2) % METRIC_HEADERS.length >= 4 ? 12 : 11;
      parts.push(`<col min="${index}" max="${index}" width="${width}" customWidth="1"/>`);
    }
    parts.push('</cols>');
    return parts.join('');
  }

  function buildWorksheetXml(report) {
    const categories = report.categories;
    const rows = [];
    const merges = ['A1:A2'];

    const topRow = [inlineCell('A1', '时间', 1)];
    let column = 2;
    for (const category of categories) {
      topRow.push(inlineCell(makeCellRef(column, 1), category, 1));
      merges.push(`${makeCellRef(column, 1)}:${makeCellRef(column + METRIC_HEADERS.length - 1, 1)}`);
      column += METRIC_HEADERS.length;
    }
    rows.push(`<row r="1" ht="24" customHeight="1">${topRow.join('')}</row>`);

    const secondRowLabels = [''];
    for (let index = 0; index < categories.length; index += 1) {
      secondRowLabels.push(...METRIC_HEADERS);
    }
    rows.push(`<row r="2" ht="22" customHeight="1">${
      secondRowLabels
        .map((text, index) => inlineCell(makeCellRef(index + 1, 2), text, 2))
        .join('')
    }</row>`);

    const dataValues = [formatDisplayDate(report.date)];
    for (const row of report.rows) {
      dataValues.push(
        row.inboundCount || 0,
        row.stdTotalCount || 0,
        row.stdPassCount || 0,
        row.stdRejectCount || 0,
        row.stdRejectRate || 0,
        row.qcTotalCount || 0,
        row.qcPassCount || 0,
        row.qcRejectCount || 0,
        row.qcRejectRate || 0
      );
    }
    const dataCells = dataValues.map((value, index) => {
      const ref = makeCellRef(index + 1, 3);
      if (index === 0) {
        return inlineCell(ref, value, 3);
      }
      const metricIndex = (index - 1) % METRIC_HEADERS.length;
      if (metricIndex === 4 || metricIndex === 8) {
        return numberCell(ref, Number(value || 0), 5);
      }
      return numberCell(ref, Number(value || 0), 4);
    });
    rows.push(`<row r="3" ht="22" customHeight="1">${dataCells.join('')}</row>`);

    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
      '<sheetViews><sheetView workbookViewId="0"/></sheetViews>',
      '<sheetFormatPr defaultRowHeight="20"/>',
      buildColumnsXml(categories),
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
      '<fills count="4">',
      '<fill><patternFill patternType="none"/></fill>',
      '<fill><patternFill patternType="gray125"/></fill>',
      '<fill><patternFill patternType="solid"><fgColor rgb="FFF7E4"/><bgColor indexed="64"/></patternFill></fill>',
      '<fill><patternFill patternType="solid"><fgColor rgb="FFEAF3FB"/><bgColor indexed="64"/></patternFill></fill>',
      '</fills>',
      '<borders count="2">',
      '<border><left/><right/><top/><bottom/><diagonal/></border>',
      '<border><left style="thin"><color rgb="FFD7E1EA"/></left><right style="thin"><color rgb="FFD7E1EA"/></right><top style="thin"><color rgb="FFD7E1EA"/></top><bottom style="thin"><color rgb="FFD7E1EA"/></bottom><diagonal/></border>',
      '</borders>',
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
      '<cellXfs count="6">',
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
      '<xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>',
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
    anchor.download = `YSP日报_${report.date}.xlsx`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  class DailyReporterApp {
    constructor() {
      this.panel = null;
      this.savedSettings = { date: '', categories: [] };
      this.runtime = {
        running: false,
        stopping: false,
        currentCheckpoint: null,
        lastReport: null,
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
      await this.loadState();
      this.mountPanel();
      await this.tryResume();
    }

    async loadState() {
      const state = await storageGet([
        STORAGE_KEYS.settings,
        STORAGE_KEYS.report,
        this.runtime.activeSessionKey
      ]);
      this.savedSettings = {
        date: state[STORAGE_KEYS.settings] && state[STORAGE_KEYS.settings].date ? state[STORAGE_KEYS.settings].date : '',
        categories: Array.isArray(state[STORAGE_KEYS.settings] && state[STORAGE_KEYS.settings].categories)
          ? state[STORAGE_KEYS.settings].categories
          : []
      };
      this.runtime.lastReport = state[STORAGE_KEYS.report] || null;
      this.runtime.currentCheckpoint = state[this.runtime.activeSessionKey] || null;
      this.runtime.logs = Array.isArray(this.runtime.currentCheckpoint && this.runtime.currentCheckpoint.logs)
        ? this.runtime.currentCheckpoint.logs.slice(0, MAX_LOGS)
        : [];

      if (this.runtime.currentCheckpoint && this.runtime.currentCheckpoint.status === 'running') {
        this.runtime.running = true;
        this.runtime.statusText = this.runtime.currentCheckpoint.statusText || '正在继续上次任务';
      } else if (this.runtime.currentCheckpoint && this.runtime.currentCheckpoint.status === 'error') {
        this.runtime.statusText = this.runtime.currentCheckpoint.statusText || '上次任务停在错误位置';
      } else if (this.runtime.lastReport) {
        this.runtime.statusText = `最近一次结果：${this.runtime.lastReport.date}`;
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
        <div class="ysp-daily-panel">
          <div class="ysp-daily-panel__header">
            <div>
              <div class="ysp-daily-panel__title">YSP 日报采集</div>
              <div class="ysp-daily-panel__subtitle">按单日和主品类顺序自动采集，完成后直接导出 Excel。</div>
            </div>
            <div class="ysp-daily-panel__version">v${SCRIPT_VERSION}</div>
          </div>
          <div class="ysp-daily-panel__body">
            <div class="ysp-daily-panel__section">
              <label class="ysp-daily-panel__label" for="ysp-daily-date">日期</label>
              <input id="ysp-daily-date" class="ysp-daily-panel__date" type="date" />
              <div class="ysp-daily-panel__hint">系统会自动换成当天 00:00 到次日 00:00。</div>
            </div>
            <div class="ysp-daily-panel__section">
              <div class="ysp-daily-panel__toolbar">
                <span class="ysp-daily-panel__label" style="margin-bottom:0;">主品类</span>
                <button type="button" class="ysp-daily-panel__toolbar-button" data-role="toggle-all">全选</button>
              </div>
              <div class="ysp-daily-panel__categories" data-role="categories"></div>
            </div>
            <div class="ysp-daily-panel__section">
              <div class="ysp-daily-panel__actions">
                <button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--primary" data-role="start">开始采集并导出</button>
                <button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--secondary" data-role="export-last">导出最近结果</button>
                <button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--ghost" data-role="stop">停止任务</button>
                <button type="button" class="ysp-daily-panel__button ysp-daily-panel__button--secondary" data-role="clear">清除进度</button>
              </div>
            </div>
            <div class="ysp-daily-panel__section">
              <div class="ysp-daily-panel__label">当前状态</div>
              <div class="ysp-daily-panel__status" data-role="status"></div>
            </div>
            <div class="ysp-daily-panel__section">
              <div class="ysp-daily-panel__toolbar">
                <span class="ysp-daily-panel__label" style="margin-bottom:0;">执行记录</span>
              </div>
              <div class="ysp-daily-panel__logs" data-role="logs"></div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(root);
      this.panel = root;

      this.refs.date = root.querySelector('#ysp-daily-date');
      this.refs.categories = root.querySelector('[data-role="categories"]');
      this.refs.status = root.querySelector('[data-role="status"]');
      this.refs.logs = root.querySelector('[data-role="logs"]');
      this.refs.start = root.querySelector('[data-role="start"]');
      this.refs.exportLast = root.querySelector('[data-role="export-last"]');
      this.refs.stop = root.querySelector('[data-role="stop"]');
      this.refs.clear = root.querySelector('[data-role="clear"]');
      this.refs.toggleAll = root.querySelector('[data-role="toggle-all"]');

      this.renderCategories();
      this.refs.date.value = this.savedSettings.date || '';
      this.bindPanelEvents();
      this.render();
    }

    destroy() {
      if (this.panel && this.panel.isConnected) {
        this.panel.remove();
      }
      this.panel = null;
      this.refs = {};
    }

    renderCategories() {
      this.refs.categories.innerHTML = CATEGORY_ORDER.map((category) => {
        const checked = this.savedSettings.categories.includes(category) ? 'checked' : '';
        return `
          <label class="ysp-daily-panel__category">
            <input type="checkbox" value="${escapeXml(category)}" ${checked} />
            <span>${escapeXml(category)}</span>
          </label>
        `;
      }).join('');
    }

    bindPanelEvents() {
      this.refs.start.addEventListener('click', () => {
        this.startNewJob().catch((error) => this.failJob(error));
      });
      this.refs.exportLast.addEventListener('click', () => this.exportLastReport());
      this.refs.stop.addEventListener('click', () => this.stopCurrentJob());
      this.refs.clear.addEventListener('click', () => {
        this.clearProgress().catch((error) => this.pushLog(`清除进度失败：${error.message}`));
      });
      this.refs.toggleAll.addEventListener('click', () => {
        const checkboxes = this.getCategoryCheckboxes();
        const hasUnchecked = checkboxes.some((checkbox) => !checkbox.checked);
        for (const checkbox of checkboxes) {
          checkbox.checked = hasUnchecked;
        }
        this.refs.toggleAll.textContent = hasUnchecked ? '清空' : '全选';
      });
    }

    getCategoryCheckboxes() {
      return Array.from(this.refs.categories.querySelectorAll('input[type="checkbox"]'));
    }

    getSelectedCategories() {
      const selected = this.getCategoryCheckboxes()
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.value);
      return CATEGORY_ORDER.filter((category) => selected.includes(category));
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
      this.refs.start.disabled = this.runtime.running;
      this.refs.stop.disabled = !this.runtime.running;
      this.refs.exportLast.disabled = !this.runtime.lastReport;
      const summary = this.runtime.currentCheckpoint && this.runtime.currentCheckpoint.status === 'running'
        ? `<div class="ysp-daily-panel__summary"><strong>当前进度：</strong>${escapeXml(this.runtime.currentCheckpoint.summaryText || '')}</div>`
        : this.runtime.lastReport
          ? `<div class="ysp-daily-panel__summary"><strong>最近结果：</strong>${escapeXml(this.runtime.lastReport.date)}，共 ${this.runtime.lastReport.categories.length} 个品类</div>`
          : '';
      this.refs.status.innerHTML = `<strong>${escapeXml(this.runtime.statusText)}</strong>${summary}`;
      this.refs.logs.innerHTML = this.runtime.logs.length
        ? this.runtime.logs.map((log) => `<div class="ysp-daily-panel__log">${escapeXml(log)}</div>`).join('')
        : '<div class="ysp-daily-panel__log">还没有执行记录</div>';
    }

    async persistSettings(date, categories) {
      this.savedSettings = { date, categories: categories.slice() };
      await storageSet({
        [STORAGE_KEYS.settings]: {
          date,
          categories
        }
      });
    }

    async saveCheckpoint() {
      if (!this.runtime.currentCheckpoint) {
        return;
      }
      this.runtime.currentCheckpoint.updatedAt = new Date().toISOString();
      await storageSet({
        [this.runtime.activeSessionKey]: this.runtime.currentCheckpoint
      });
    }

    async clearCheckpoint() {
      await storageRemove(this.runtime.activeSessionKey);
      this.runtime.currentCheckpoint = null;
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
      const date = this.refs.date.value;
      const categories = this.getSelectedCategories();
      if (!date) {
        throw new Error('请先选择日期');
      }
      if (!categories.length) {
        throw new Error('请至少勾选一个主品类');
      }

      await this.persistSettings(date, categories);
      this.runtime.stopping = false;
      this.runtime.running = true;
      this.runtime.logs = [];
      this.runtime.currentCheckpoint = {
        version: 1,
        status: 'running',
        date,
        categories,
        currentIndex: 0,
        phase: 'std',
        results: {},
        logs: [],
        startedAt: new Date().toISOString(),
        statusText: '正在准备页面控件',
        summaryText: ''
      };
      await this.saveCheckpoint();
      this.pushLog(`开始采集：${date}，共 ${categories.length} 个主品类`);
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

      if (checkpoint.phase === 'resume-qc') {
        const category = checkpoint.categories[checkpoint.currentIndex];
        checkpoint.summaryText = `${category}：质检`;
        this.updateCheckpointStatus(`正在继续 ${category} 的质检采集`, `${checkpoint.currentIndex + 1}/${checkpoint.categories.length} · 质检`);
        await this.runQualityCheckForCategory(category);
        checkpoint.currentIndex += 1;
        checkpoint.phase = 'std';
        await this.saveCheckpoint();
      }

      while (checkpoint.currentIndex < checkpoint.categories.length) {
        this.ensureNotStopped();
        const category = checkpoint.categories[checkpoint.currentIndex];
        if (!checkpoint.results[category]) {
          checkpoint.results[category] = createEmptyResult(category);
        }
        checkpoint.phase = 'std';
        checkpoint.summaryText = `${category}：标准化`;
        this.updateCheckpointStatus(`正在采集 ${category}`, `${checkpoint.currentIndex + 1}/${checkpoint.categories.length} · 标准化`);
        await this.saveCheckpoint();
        await this.runStandardizationForCategory(category);

        checkpoint.phase = 'resume-qc';
        checkpoint.summaryText = `${category}：等待刷新后采集质检`;
        this.updateCheckpointStatus(`准备刷新页面继续 ${category} 的质检采集`, `${checkpoint.currentIndex + 1}/${checkpoint.categories.length} · 等待刷新`);
        await this.saveCheckpoint();
        this.pushLog(`${category}：标准化已完成，刷新页面继续质检`);
        window.location.reload();
        return;
      }

      await this.completeJob();
    }

    async runStandardizationForCategory(category) {
      this.ensureNotStopped();
      const checkpoint = this.runtime.currentCheckpoint;
      const result = checkpoint.results[category] || createEmptyResult(category);
      const range = buildDateRange(checkpoint.date);

      await clickResetButton();
      await this.applyCategory(category);
      await setDateRange('创建时间', range.start, range.end);

      this.pushLog(`${category}：读取入库量`);
      result.inboundCount = await clickQueryAndReadCount();
      this.pushLog(`${category}：入库量 ${result.inboundCount}`);

      await this.applySelectByLabel('标准化状态', '标准化通过');
      result.stdPassCount = await clickQueryAndReadCount();
      this.pushLog(`${category}：标准化通过 ${result.stdPassCount}`);

      await this.applySelectByLabel('标准化状态', '标准化拒绝');
      result.stdRejectCount = await clickQueryAndReadCount();
      result.stdTotalCount = result.stdPassCount + result.stdRejectCount;
      result.stdRejectRate = calculateRatio(result.stdRejectCount, result.stdTotalCount);
      this.pushLog(`${category}：标准化拒绝 ${result.stdRejectCount}`);

      checkpoint.results[category] = result;
      await this.saveCheckpoint();
    }

    async runQualityCheckForCategory(category) {
      this.ensureNotStopped();
      const checkpoint = this.runtime.currentCheckpoint;
      const result = checkpoint.results[category] || createEmptyResult(category);
      const range = buildDateRange(checkpoint.date);

      await clickResetButton();
      await this.applyCategory(category);
      await setDateRange('修改时间', range.start, range.end);

      await this.applySelectByLabel('质检状态', '质检通过');
      result.qcPassCount = await clickQueryAndReadCount();
      this.pushLog(`${category}：质检通过 ${result.qcPassCount}`);

      await this.applySelectByLabel('质检状态', '质检拒绝');
      result.qcRejectCount = await clickQueryAndReadCount();
      result.qcTotalCount = result.qcPassCount + result.qcRejectCount;
      result.qcRejectRate = calculateRatio(result.qcRejectCount, result.qcTotalCount);
      this.pushLog(`${category}：质检拒绝 ${result.qcRejectCount}`);

      checkpoint.results[category] = result;
      await this.saveCheckpoint();
    }

    async applyCategory(category) {
      const primary = getCategoryWrapper(0);
      if (!primary) {
        throw new Error('未找到主品类选择器');
      }
      await selectOption(primary, category);
      this.pushLog(`已选择主品类：${category}`);
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
      checkpoint.status = 'done';
      checkpoint.statusText = '采集完成，正在导出 Excel';
      checkpoint.summaryText = `共完成 ${checkpoint.categories.length} 个主品类`;
      await this.saveCheckpoint();

      const report = {
        date: checkpoint.date,
        categories: checkpoint.categories.slice(),
        rows: buildOrderedResults(checkpoint),
        generatedAt: new Date().toISOString()
      };
      this.runtime.lastReport = report;
      await storageSet({
        [STORAGE_KEYS.report]: report
      });

      downloadReport(report);
      this.pushLog('Excel 导出已触发');
      await this.clearCheckpoint();
      this.runtime.running = false;
      this.runtime.stopping = false;
      this.runtime.statusText = '采集完成';
      this.render();
    }

    async failJob(error) {
      const message = error && error.message ? error.message : String(error);
      this.runtime.running = false;
      this.runtime.stopping = false;
      if (this.runtime.currentCheckpoint) {
        this.runtime.currentCheckpoint.status = 'error';
        this.runtime.currentCheckpoint.statusText = `任务中断：${message}`;
        await this.saveCheckpoint();
      }
      this.runtime.statusText = `任务中断：${message}`;
      this.pushLog(`错误：${message}`);
      this.render();
    }

    exportLastReport() {
      if (!this.runtime.lastReport) {
        this.pushLog('当前没有可导出的结果');
        return;
      }
      downloadReport(this.runtime.lastReport);
      this.pushLog(`已重新导出 ${this.runtime.lastReport.date} 的结果`);
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
      console.error('[YSP 日报采集]', error);
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
