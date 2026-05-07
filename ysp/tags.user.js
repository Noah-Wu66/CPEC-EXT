// ==UserScript==
// @name         央视频标签库采集器
// @namespace    https://github.com/Noah-Wu66/CPEC-EXT
// @version      1.2.8
// @description  通过标准化列表接口采集成品视频标签，并保存在浏览器本地数据库
// @author       Noah
// @match        http://std.video.cloud.cctv.com/*
// @match        https://std.video.cloud.cctv.com/*
// @updateURL    https://gh-proxy.com/https://raw.githubusercontent.com/Noah-Wu66/CPEC-EXT/main/ysp/tags.user.js
// @downloadURL  https://gh-proxy.com/https://raw.githubusercontent.com/Noah-Wu66/CPEC-EXT/main/ysp/tags.user.js
// @grant        GM_addStyle
// @grant        GM_info
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  if (window.__YSP_TAG_LIBRARY_CRAWLER__) {
    return;
  }
  window.__YSP_TAG_LIBRARY_CRAWLER__ = true;

  const DB_NAME = 'YspTagLibraryCrawlerDB';
  const DB_VERSION = 2;
  const TAG_STORE_NAME = 'tags';
  const TAG_SEARCH_API = '/api/taglib/tag/text_box/search';
  const API_PAGE_SIZE = 20;
  const REQUEST_DELAY_MIN_MS = 300;
  const REQUEST_DELAY_MAX_MS = 700;
  const COOLDOWN_EVERY_PAGES = 100;
  const COOLDOWN_MS = 10000;
  const MAX_EMPTY_NEW_PAGES = 50;
  const PANEL_ID = 'ysp-tag-crawler-root';

  const panelStyle = `
#${PANEL_ID} {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2147483647;
  width: 320px;
  color: #17304b;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
}

#${PANEL_ID} .tag-crawler-panel {
  overflow: hidden;
  border: 1px solid rgba(23, 48, 75, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 42px rgba(18, 38, 58, 0.22);
}

#${PANEL_ID} .tag-crawler-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 10px;
  border-bottom: 1px solid rgba(23, 48, 75, 0.08);
}

#${PANEL_ID} .tag-crawler-title {
  font-size: 15px;
  font-weight: 700;
}

#${PANEL_ID} .tag-crawler-version {
  font-size: 12px;
  color: #7b8b9a;
}

#${PANEL_ID} .tag-crawler-body {
  padding: 12px 14px 14px;
}

#${PANEL_ID} .tag-crawler-count {
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: #52687d;
}

#${PANEL_ID} .tag-crawler-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

#${PANEL_ID} .tag-crawler-tools {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

#${PANEL_ID} button {
  min-height: 34px;
  border: 0;
  border-radius: 10px;
  background: #17304b;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

#${PANEL_ID} button.secondary {
  background: #edf3f8;
  color: #17304b;
}

#${PANEL_ID} button.danger {
  background: #f5e6e3;
  color: #b44b3b;
}

#${PANEL_ID} button:disabled {
  opacity: 0.55;
  cursor: default;
}

#${PANEL_ID} .tag-crawler-log {
  min-height: 40px;
  max-height: 96px;
  margin-top: 10px;
  overflow: auto;
  border-radius: 10px;
  background: #f5f8fb;
  padding: 8px 10px;
  color: #43576b;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
}
`;

  function normalizeText(value) {
    return String(value == null ? '' : value)
      .replace(/\s+/g, ' ')
      .replace(/\u00a0/g, ' ')
      .trim();
  }

  function sleep(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function randomDelay(minMs, maxMs) {
    return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
  }

  async function sleepWithStopCheck(ms, shouldStop) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < ms) {
      if (typeof shouldStop === 'function' && shouldStop()) {
        return true;
      }
      await sleep(Math.min(300, ms - (Date.now() - startedAt)));
    }
    return false;
  }

  function parseTagFromText(text) {
    const normalized = normalizeText(text);
    if (!normalized) {
      return null;
    }
    const cleanText = normalized.replace(/×$/g, '').trim();
    const idNameMatch = cleanText.match(/^(\d{3,})\s*[|｜]\s*(.+)$/);
    if (idNameMatch) {
      return {
        id: idNameMatch[1],
        name: normalizeText(idNameMatch[2]),
        rawText: cleanText
      };
    }
    const leadingIdMatch = cleanText.match(/^(\d{3,})\s+(.+)$/);
    if (leadingIdMatch) {
      return {
        id: leadingIdMatch[1],
        name: normalizeText(leadingIdMatch[2]),
        rawText: cleanText
      };
    }
    return {
      id: '',
      name: cleanText,
      rawText: cleanText
    };
  }

  function buildTagKey(tag) {
    return tag.id ? `id:${tag.id}` : `name:${tag.name}`;
  }

  function openTagDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (db.objectStoreNames.contains(TAG_STORE_NAME)) {
          db.deleteObjectStore(TAG_STORE_NAME);
        }
        const store = db.createObjectStore(TAG_STORE_NAME, { keyPath: 'key' });
        store.createIndex('id', 'id', { unique: false });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error || new Error('本地数据库打开失败'));
      };
    });
  }

  function normalizeStoredTag(item) {
    if (!item || typeof item !== 'object') {
      return null;
    }
    const tag = {
      key: normalizeText(item.key),
      id: normalizeText(item.id),
      name: normalizeText(item.name),
      type: normalizeText(item.type),
      comment: normalizeText(item.comment)
    };
    if (!tag.id && !tag.name) {
      return null;
    }
    tag.key = tag.key || buildTagKey(tag);
    return tag;
  }

  async function readStoredTags() {
    const db = await openTagDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TAG_STORE_NAME, 'readonly');
      const store = transaction.objectStore(TAG_STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result.map(normalizeStoredTag).filter(Boolean));
      };
      request.onerror = () => {
        reject(request.error || new Error('本地标签读取失败'));
      };
      transaction.oncomplete = () => {
        db.close();
      };
      transaction.onerror = () => {
        db.close();
      };
    });
  }

  async function countStoredTags() {
    const db = await openTagDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TAG_STORE_NAME, 'readonly');
      const store = transaction.objectStore(TAG_STORE_NAME);
      const request = store.count();
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error || new Error('本地标签数量读取失败'));
      };
      transaction.oncomplete = () => {
        db.close();
      };
      transaction.onerror = () => {
        db.close();
      };
    });
  }

  async function clearStoredTags() {
    const db = await openTagDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TAG_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(TAG_STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error || new Error('本地标签清空失败'));
      };
      transaction.oncomplete = () => {
        db.close();
      };
      transaction.onerror = () => {
        db.close();
      };
    });
  }

  async function mergeTags(incomingTags) {
    const db = await openTagDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TAG_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(TAG_STORE_NAME);
      let addedCount = 0;
      let existingCount = 0;
      let duplicateCount = 0;
      const seenKeys = new Set();
      const normalizedTags = incomingTags
        .map(normalizeStoredTag)
        .filter(Boolean)
        .map((tag) => ({
          ...tag,
          key: buildTagKey(tag)
        }))
        .filter((tag) => {
          if (seenKeys.has(tag.key)) {
            duplicateCount += 1;
            return false;
          }
          seenKeys.add(tag.key);
          return true;
        });

      const saveNext = (index) => {
        if (index >= normalizedTags.length) {
          return;
        }
        const tag = normalizedTags[index];
        const getRequest = store.get(tag.key);
        getRequest.onsuccess = () => {
          const oldTag = normalizeStoredTag(getRequest.result);
          if (oldTag) {
            existingCount += 1;
            saveNext(index + 1);
            return;
          }
          const nextTag = {
            key: tag.key,
            id: tag.id,
            name: tag.name,
            type: tag.type,
            comment: tag.comment
          };
          addedCount += 1;
          const putRequest = store.put(nextTag);
          putRequest.onsuccess = () => {
            saveNext(index + 1);
          };
          putRequest.onerror = () => {
            reject(putRequest.error || new Error('标签保存失败'));
          };
        };
        getRequest.onerror = () => {
          reject(getRequest.error || new Error('标签读取失败'));
        };
      };

      transaction.oncomplete = () => {
        db.close();
        resolve({ addedCount, existingCount, duplicateCount });
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error || new Error('标签保存事务失败'));
      };
      saveNext(0);
    });
  }

  function pickFirstArray(value) {
    const candidates = [
      value && value.data && value.data.list,
      value && value.data && value.data.records,
      value && value.data && value.data.rows,
      value && value.data && value.data.items,
      value && value.result && value.result.list,
      value && value.result && value.result.records,
      value && value.result && value.result.rows,
      value && value.list,
      value && value.records,
      value && value.rows,
      value && value.items,
      value && value.data
    ];
    return candidates.find((candidate) => Array.isArray(candidate)) || [];
  }

  function normalizeApiTag(item) {
    if (!item || typeof item !== 'object') {
      return null;
    }
    const id = normalizeText(
      item.tag_id
      || item.tagId
      || item.tagCode
      || item.id
      || item.value
      || item.code
    );
    const name = normalizeText(
      item.tag_name
      || item.tagName
      || item.name
      || item.label
      || item.text
      || item.title
    );
    const type = [
      normalizeText(item.first_cate || item.firstCate),
      normalizeText(item.second_cate || item.secondCate)
    ].filter(Boolean).join('-');
    const comment = normalizeText(item.comment || item.remark || item.memo);
    const displayText = normalizeText(item.rawText || item.fullName || item.showName || item.displayName);
    const parsed = parseTagFromText(displayText);
    const tag = {
      id: id || (parsed && parsed.id) || '',
      name: name || (parsed && parsed.name) || '',
      type,
      comment
    };
    return tag.id || tag.name ? tag : null;
  }

  function normalizeApiTags(payload) {
    return pickFirstArray(payload).map(normalizeApiTag).filter(Boolean);
  }

  async function fetchTagPage(page, pageSize) {
    const params = new URLSearchParams();
    params.set('page_size', String(pageSize));
    params.set('tag_key_word', '');
    params.set('page', String(page));
    const response = await fetch(`${TAG_SEARCH_API}?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    });
    if (!response.ok) {
      throw new Error(`标签接口请求失败：${response.status}`);
    }
    const payload = await response.json();
    return normalizeApiTags(payload);
  }

  async function crawlTags(limit, onProgress, shouldStop) {
    const pageSize = typeof limit === 'number' && limit > 0 && limit < API_PAGE_SIZE
      ? limit
      : API_PAGE_SIZE;
    let page = 1;
    let savedCount = 0;
    let addedCount = 0;
    let skippedCount = 0;
    let emptyNewPageCount = 0;

    while (true) {
      if (typeof shouldStop === 'function' && shouldStop()) {
        return { savedCount, addedCount, skippedCount, pageCount: page - 1, stopped: true };
      }
      const pageTags = await fetchTagPage(page, pageSize);
      if (!pageTags.length) {
        return { savedCount, addedCount, skippedCount, pageCount: page - 1 };
      }

      const remainingCount = typeof limit === 'number'
        ? Math.max(0, limit - savedCount)
        : pageTags.length;
      const tagsToSave = typeof limit === 'number'
        ? pageTags.slice(0, remainingCount)
        : pageTags;
      const merged = await mergeTags(tagsToSave);
      savedCount += tagsToSave.length;
      addedCount += merged.addedCount;
      skippedCount += merged.existingCount + merged.duplicateCount;
      emptyNewPageCount = merged.addedCount > 0 ? 0 : emptyNewPageCount + 1;

      if (typeof onProgress === 'function') {
        onProgress({
          page,
          savedCount,
          addedCount,
          skippedCount,
          emptyNewPageCount
        });
      }

      if (emptyNewPageCount >= MAX_EMPTY_NEW_PAGES) {
        return {
          savedCount,
          addedCount,
          skippedCount,
          pageCount: page,
          stoppedByDuplicateGuard: true
        };
      }
      if (typeof limit === 'number' && savedCount >= limit) {
        return { savedCount, addedCount, skippedCount, pageCount: page };
      }
      if (pageTags.length < pageSize) {
        return { savedCount, addedCount, skippedCount, pageCount: page };
      }
      if (page % COOLDOWN_EVERY_PAGES === 0) {
        if (typeof onProgress === 'function') {
          onProgress({
            page,
            savedCount,
            addedCount,
            skippedCount,
            emptyNewPageCount,
            cooldownMs: COOLDOWN_MS
          });
        }
        const stoppedDuringCooldown = await sleepWithStopCheck(COOLDOWN_MS, shouldStop);
        if (stoppedDuringCooldown) {
          return { savedCount, addedCount, skippedCount, pageCount: page, stopped: true };
        }
      }
      page += 1;
      const stoppedDuringDelay = await sleepWithStopCheck(
        randomDelay(REQUEST_DELAY_MIN_MS, REQUEST_DELAY_MAX_MS),
        shouldStop
      );
      if (stoppedDuringDelay) {
        return { savedCount, addedCount, skippedCount, pageCount: page - 1, stopped: true };
      }
    }
  }

  function buildCsv(tags) {
    const escapeCsv = (value) => {
      const text = String(value == null ? '' : value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const rows = [
      [
        '标签名',
        'ID',
        '类型',
        '备注'
      ]
    ];
    tags
      .slice()
      .sort((a, b) => Number(a.id) - Number(b.id))
      .forEach((tag) => {
        rows.push([
          tag.name,
          tag.id,
          tag.type,
          tag.comment
        ]);
      });
    return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  }

  function downloadText(fileName, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function createPanel() {
    if (document.getElementById(PANEL_ID)) {
      return;
    }
    GM_addStyle(panelStyle);
    const root = document.createElement('div');
    root.id = PANEL_ID;
    root.innerHTML = `
      <div class="tag-crawler-panel">
        <div class="tag-crawler-head">
          <div class="tag-crawler-title">成品视频标签采集器</div>
          <div class="tag-crawler-version">v${GM_info.script.version}</div>
        </div>
        <div class="tag-crawler-body">
          <div class="tag-crawler-count" data-role="count"></div>
          <div class="tag-crawler-actions">
            <button type="button" data-limit="100">100条</button>
            <button type="button" data-limit="1000">1000条</button>
            <button type="button" data-limit="10000">10000条</button>
            <button type="button" data-limit="all">全部</button>
          </div>
          <div class="tag-crawler-tools">
            <button type="button" class="secondary" data-action="export-csv">导出CSV</button>
          </div>
          <div class="tag-crawler-tools" style="margin-top: 8px;">
            <button type="button" class="danger" data-action="stop">停止采集</button>
            <button type="button" class="danger" data-action="clear">清空本地库</button>
          </div>
          <div class="tag-crawler-tools" style="margin-top: 8px;">
            <button type="button" class="secondary" data-action="refresh">刷新数量</button>
          </div>
          <div class="tag-crawler-log" data-role="log">等待开始</div>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    const refs = {
      count: root.querySelector('[data-role="count"]'),
      log: root.querySelector('[data-role="log"]'),
      buttons: Array.from(root.querySelectorAll('button'))
    };

    const setLog = (text) => {
      refs.log.textContent = text;
    };
    let stopRequested = false;

    const refreshCount = async () => {
      const count = await countStoredTags();
      refs.count.textContent = `本地数据库已保存：${count} 个标签`;
    };

    const setBusy = (busy) => {
      refs.buttons.forEach((button) => {
        button.disabled = busy && button.getAttribute('data-action') !== 'stop';
      });
    };

    const runCrawl = async (limitValue) => {
      const limit = limitValue === 'all' ? 'all' : Number(limitValue);
      stopRequested = false;
      setBusy(true);
      setLog(limit === 'all' ? '正在采集全部标签...' : `正在采集 ${limit} 条标签...`);
      try {
        const result = await crawlTags(
          limit === 'all' ? null : limit,
          (progress) => {
            if (progress.cooldownMs) {
              setLog(`已读取 ${progress.savedCount} 个标签，新增 ${progress.addedCount} 个，重复跳过 ${progress.skippedCount} 个，连续无新增 ${progress.emptyNewPageCount} 页，已读取 ${progress.page} 页，休息 ${Math.round(progress.cooldownMs / 1000)} 秒...`);
              return;
            }
            setLog(
              limit === 'all'
                ? `已读取 ${progress.savedCount} 个标签，新增 ${progress.addedCount} 个，重复跳过 ${progress.skippedCount} 个，连续无新增 ${progress.emptyNewPageCount} 页，正在读取第 ${progress.page} 页...`
                : `已读取 ${progress.savedCount}/${limit} 个标签，新增 ${progress.addedCount} 个，重复跳过 ${progress.skippedCount} 个，连续无新增 ${progress.emptyNewPageCount} 页...`
            );
          },
          () => stopRequested
        );
        await refreshCount();
        setLog(
          result.stoppedByDuplicateGuard
            ? `已自动停止：连续 ${MAX_EMPTY_NEW_PAGES} 页没有新增标签，可能已采完或接口分页异常。本次读取 ${result.savedCount} 个标签，新增 ${result.addedCount} 个，重复跳过 ${result.skippedCount} 个。`
            : result.stopped
            ? `已停止。本次读取 ${result.savedCount} 个标签，新增 ${result.addedCount} 个，重复跳过 ${result.skippedCount} 个。`
            : `采集完成。本次读取 ${result.savedCount} 个标签，新增 ${result.addedCount} 个，重复跳过 ${result.skippedCount} 个。`
        );
      } catch (error) {
        setLog(error && error.message ? error.message : String(error));
      } finally {
        stopRequested = false;
        setBusy(false);
      }
    };

    root.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) {
        return;
      }
      const limit = button.getAttribute('data-limit');
      const action = button.getAttribute('data-action');
      if (limit) {
        runCrawl(limit);
        return;
      }
      if (action === 'stop') {
        stopRequested = true;
        setLog('正在停止，当前页保存完成后结束');
        return;
      }
      if (action === 'refresh') {
        setBusy(true);
        refreshCount()
          .then(() => {
            setLog('数量已刷新');
          })
          .catch((error) => {
            setLog(error && error.message ? error.message : String(error));
          })
          .finally(() => {
            setBusy(false);
          });
        return;
      }
      if (action === 'export-csv') {
        setBusy(true);
        readStoredTags()
          .then((tags) => {
            downloadText('ysp-tag-library.csv', `\ufeff${buildCsv(tags)}`, 'text/csv;charset=utf-8');
            setLog(`已导出 CSV：${tags.length} 个标签`);
          })
          .catch((error) => {
            setLog(error && error.message ? error.message : String(error));
          })
          .finally(() => {
            setBusy(false);
          });
        return;
      }
      if (action === 'clear') {
        if (window.confirm('确认清空标签采集器本地保存的标签吗？')) {
          setBusy(true);
          clearStoredTags()
            .then(() => refreshCount())
            .then(() => {
              setLog('本地标签库已清空');
            })
            .catch((error) => {
              setLog(error && error.message ? error.message : String(error));
            })
            .finally(() => {
              setBusy(false);
            });
        }
      }
    });

    refreshCount().catch((error) => {
      setLog(error && error.message ? error.message : String(error));
    });
  }

  createPanel();
})();
