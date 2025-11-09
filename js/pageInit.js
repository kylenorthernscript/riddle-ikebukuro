/**
 * ページ初期化モジュール
 *
 * このモジュールは、ページの読み込み時に実行される初期化処理を管理します。
 * - キャッシュのクリア
 * - LocationCheckerの初期化
 * - イベントリスナーの設定
 *
 * チュートリアル: すべての共通初期化処理をここに集約することで、HTMLファイルの重複を削減します。
 */

import { CONFIG, MESSAGES } from './config.js';
import { LocationChecker } from './locationChecker.js';

/**
 * ページを初期化します
 *
 * @param {Object} locationConfig - ロケーション設定
 * @param {number} locationConfig.targetLat - 目標地点の緯度
 * @param {number} locationConfig.targetLng - 目標地点の経度
 * @param {string} locationConfig.locationName - ロケーション名
 * @param {string} [locationConfig.successRedirectUrl] - 成功時のリダイレクトURL
 * @param {boolean} [locationConfig.requireAltitude] - 高度チェックが必要か
 * @param {number} [locationConfig.targetAltitude] - 目標高度
 */
export function initializePage(locationConfig) {
  if (CONFIG.DEBUG_LOGGING) {
    console.log('ページ初期化開始:', locationConfig);
  }

  // LocationCheckerを作成
  const checker = new LocationChecker(locationConfig);

  // グローバル関数として公開（HTMLから呼び出せるように）
  window.checkLocation = () => checker.checkLocation();

  // DOMContentLoadedイベント
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupPage(checker, locationConfig);
    });
  } else {
    // すでに読み込み済みの場合は即座に実行
    setupPage(checker, locationConfig);
  }

  // pageshowイベント（ブラウザのキャッシュから復元された場合）
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      handlePageRestore(checker);
    }
  });

  // popstateイベント（戻るボタン）
  window.addEventListener('popstate', () => {
    handleBackButton();
  });

  // 定期的なキャッシュクリア
  startPeriodicCacheClear();

  if (CONFIG.DEBUG_LOGGING) {
    console.log('ページ初期化完了');
  }
}

/**
 * ページのセットアップを行います
 *
 * @param {LocationChecker} checker - LocationCheckerインスタンス
 * @param {Object} locationConfig - ロケーション設定
 */
function setupPage(checker, locationConfig) {
  if (CONFIG.DEBUG_LOGGING) {
    console.log('ページセットアップ開始');
  }

  // 結果表示エリアのクリア
  clearResultDisplay();

  // キャッシュをクリア
  clearLocationCache();

  // URLタイムスタンプの更新
  updateURLTimestamp();

  // テストボタンのセットアップ（開発時のみ）
  if (CONFIG.SHOW_TEST_BUTTON) {
    setupTestButton(locationConfig);
  }

  // Service Worker のキャッシュをスキップ
  skipServiceWorkerCache();

  // 初期化完了メッセージを一時的に表示
  showReadyMessage();

  if (CONFIG.DEBUG_LOGGING) {
    console.log('ページセットアップ完了');
  }
}

/**
 * ページがキャッシュから復元された場合の処理
 *
 * @param {LocationChecker} checker - LocationCheckerインスタンス
 */
function handlePageRestore(checker) {
  if (CONFIG.DEBUG_LOGGING) {
    console.log('ページがキャッシュから復元されました');
  }

  // 結果表示をクリア
  clearResultDisplay();

  // 位置情報キャッシュをクリア
  clearLocationCache();

  // URLを更新してページを完全にリロード
  try {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('t', Date.now().toString());
    window.location.replace(url.toString());
  } catch (error) {
    console.error('ページリロードエラー:', error);
    window.location.reload(true);
  }
}

/**
 * 戻るボタンが押された場合の処理
 */
function handleBackButton() {
  if (CONFIG.DEBUG_LOGGING) {
    console.log('戻るボタンが押されました');
  }

  // ページを強制的にリロード
  window.location.reload(true);
}

/**
 * 結果表示エリアをクリアします
 */
function clearResultDisplay() {
  try {
    const resultDiv = document.getElementById('result');
    if (!resultDiv) return;

    resultDiv.innerHTML = '';
    resultDiv.textContent = '';
    resultDiv.style.display = 'none';

    setTimeout(() => {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '';
    }, 100);
  } catch (error) {
    console.error('結果表示クリアエラー:', error);
  }
}

/**
 * 位置情報のキャッシュをクリアします
 */
function clearLocationCache() {
  try {
    // グローバル変数をクリア（古い実装との互換性）
    if (window.lastLocationReading) {
      window.lastLocationReading = null;
    }

    if (CONFIG.DEBUG_LOGGING) {
      console.log('位置情報キャッシュをクリアしました');
    }
  } catch (error) {
    console.error('キャッシュクリアエラー:', error);
  }
}

/**
 * URLのタイムスタンプを更新します
 *
 * 注意: この関数はURL履歴スタックを更新しますが、
 * ブラウザのHTTPキャッシュを無効化するわけではありません。
 * あくまでブラウザの「戻る」ボタンで戻った際に、
 * 異なるURLとして認識させるための処理です。
 */
function updateURLTimestamp() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('t', Date.now().toString());
    window.history.replaceState({}, '', url.toString());

    if (CONFIG.DEBUG_LOGGING) {
      console.log('URLタイムスタンプを更新しました');
    }
  } catch (error) {
    console.error('URL更新エラー:', error);
  }
}

/**
 * Service Worker のキャッシュをスキップします
 */
function skipServiceWorkerCache() {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.active) {
          registration.active.postMessage({ command: 'SKIP_WAITING' });
        }
      });
    }
  } catch (error) {
    console.error('Service Worker 制御エラー:', error);
  }
}

/**
 * 定期的なキャッシュクリアを開始します
 */
function startPeriodicCacheClear() {
  setInterval(() => {
    try {
      if (window.performance && window.performance.getEntriesByType) {
        const resources = window.performance.getEntriesByType('resource');
        const locationResources = resources.filter(entry =>
          entry.name.includes('location')
        );

        if (locationResources.length > 0) {
          window.performance.clearResourceTimings();

          if (CONFIG.DEBUG_LOGGING) {
            console.log('リソースキャッシュをクリアしました');
          }
        }
      }
    } catch (error) {
      // エラーは無視（重要ではない処理）
    }
  }, 5000); // 5秒ごと
}

/**
 * 「準備完了」メッセージを一時的に表示します
 */
function showReadyMessage() {
  try {
    const resultDiv = document.getElementById('result');
    if (!resultDiv) return;

    setTimeout(() => {
      resultDiv.innerHTML = `<div style="color: #666; font-size: 0.9rem;">${MESSAGES.READY_FOR_CHECK}</div>`;

      setTimeout(() => {
        resultDiv.innerHTML = '';
      }, 1000);
    }, 200);
  } catch (error) {
    console.error('準備完了メッセージ表示エラー:', error);
  }
}

/**
 * テストボタンをセットアップします（開発用）
 *
 * @param {Object} locationConfig - ロケーション設定
 */
function setupTestButton(locationConfig) {
  try {
    const testBtn = document.getElementById('testSuccessBtn');
    if (!testBtn) return;

    // テストボタンを表示
    testBtn.style.opacity = '0.5';

    testBtn.addEventListener('click', () => {
      if (CONFIG.DEBUG_LOGGING) {
        console.log('テストボタンがクリックされました');
      }

      // テスト用の成功結果を表示
      const { showResult, showAltitudeResult } = require('./ui.js');

      if (locationConfig.requireAltitude) {
        showAltitudeResult({
          distance: 20,
          accuracy: 10,
          userLat: locationConfig.targetLat + 0.0001,
          userLng: locationConfig.targetLng + 0.0001,
          altitude: 180,
          altitudeAccuracy: 10,
          targetLat: locationConfig.targetLat,
          targetLng: locationConfig.targetLng,
          targetAltitude: locationConfig.targetAltitude || CONFIG.MIN_ALTITUDE_M,
          locationName: locationConfig.locationName,
          successRedirectUrl: locationConfig.successRedirectUrl,
          debugInfo: 'テストモードシミュレーション',
        });
      } else {
        showResult({
          distance: 20,
          accuracy: 10,
          userLat: locationConfig.targetLat + 0.0001,
          userLng: locationConfig.targetLng + 0.0001,
          targetLat: locationConfig.targetLat,
          targetLng: locationConfig.targetLng,
          locationName: locationConfig.locationName,
          successRedirectUrl: locationConfig.successRedirectUrl,
          debugInfo: 'テストモードシミュレーション',
        });
      }
    });

    if (CONFIG.DEBUG_LOGGING) {
      console.log('テストボタンをセットアップしました');
    }
  } catch (error) {
    console.error('テストボタンセットアップエラー:', error);
  }
}

/**
 * エラーハンドラーをグローバルに設定します
 */
window.addEventListener('error', event => {
  console.error('グローバルエラー:', event.error);

  // ユーザーには表示しない（技術的なエラーのため）
  if (CONFIG.DEBUG_LOGGING) {
    console.error('エラー詳細:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  }
});

/**
 * 未処理のPromise拒否を処理します
 */
window.addEventListener('unhandledrejection', event => {
  console.error('未処理のPromise拒否:', event.reason);

  if (CONFIG.DEBUG_LOGGING) {
    console.error('Promise拒否詳細:', event);
  }
});
