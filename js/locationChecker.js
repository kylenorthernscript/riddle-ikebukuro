/**
 * 位置情報チェッカー
 *
 * このモジュールは、位置情報ゲームのメインロジックを担当します。
 * - GPS位置情報の取得
 * - キャッシュ検出と再試行
 * - テストモードのシミュレーション
 * - 結果の判定
 *
 * チュートリアル: このクラスは、複雑なビジネスロジックをカプセル化する良い例です。
 */

import { CONFIG, MESSAGES } from './config.js';
import {
  calculateDistance,
  getCoordinateKey,
  isLocalhost,
  isValidCoordinate,
} from './geoUtils.js';
import { showResult, showAltitudeResult, showError, updateButtonState } from './ui.js';

/**
 * LocationCheckerクラス
 *
 * 位置情報のチェックを管理するクラスです。
 * シングルトンパターンを使用して、複数のインスタンスが作成されないようにします。
 */
export class LocationChecker {
  /**
   * コンストラクタ
   *
   * @param {Object} options - 設定オプション
   * @param {number} options.targetLat - 目標地点の緯度
   * @param {number} options.targetLng - 目標地点の経度
   * @param {string} options.locationName - ロケーション名
   * @param {string} [options.successRedirectUrl] - 成功時のリダイレクトURL
   * @param {boolean} [options.requireAltitude=false] - 高度チェックが必要か
   * @param {number} [options.targetAltitude] - 目標高度（高度チェックが必要な場合）
   */
  constructor(options) {
    this.targetLat = options.targetLat;
    this.targetLng = options.targetLng;
    this.locationName = options.locationName;
    this.successRedirectUrl = options.successRedirectUrl || null;
    this.requireAltitude = options.requireAltitude || false;
    this.targetAltitude = options.targetAltitude || CONFIG.MIN_ALTITUDE_M;

    // 入力値の検証
    if (!isValidCoordinate(this.targetLat, this.targetLng)) {
      throw new Error('無効な目標座標が指定されました');
    }

    // 前回の読み取り情報を保存（キャッシュ検出用）
    this.lastCoordinateKey = null;
    this.lastTimestamp = null;

    // ログ出力
    if (CONFIG.DEBUG_LOGGING) {
      console.log('LocationChecker初期化:', {
        target: `${this.targetLat}, ${this.targetLng}`,
        location: this.locationName,
        requireAltitude: this.requireAltitude,
      });
    }
  }

  /**
   * 位置情報のチェックを開始します
   *
   * @returns {Promise<void>}
   */
  async checkLocation() {
    try {
      // ジオロケーションAPIの対応チェック
      if (!navigator.geolocation) {
        showError(MESSAGES.ERROR_NO_GEOLOCATION);
        updateButtonState('ready');
        return;
      }

      // URL更新（履歴スタック更新）
      this.updateURLTimestamp();

      // DOM初期化
      this.clearResultDisplay();
      this.lastCoordinateKey = null;
      this.lastTimestamp = null;

      // ボタンの状態を更新
      if (isLocalhost() && CONFIG.TEST_MODE_ENABLED) {
        updateButtonState('simulating');
      } else {
        updateButtonState('loading');
      }

      // 位置情報取得（リトライ込み）
      if (this.requireAltitude) {
        await this.checkLocationWithAltitude();
      } else {
        await this.checkLocationSimple();
      }
    } catch (error) {
      // 予期しないエラーのハンドリング
      console.error('位置情報チェックで予期しないエラーが発生:', error);

      const errorMessage = error.message || '不明なエラー';
      const errorDetails = CONFIG.DEBUG_LOGGING
        ? `<br><small>詳細: ${errorMessage}</small>`
        : '';

      showError(
        MESSAGES.ERROR_UNKNOWN.replace('{code}', error.code || 'UNKNOWN') + errorDetails
      );
      updateButtonState('ready');
    }
  }

  /**
   * 通常の位置情報チェック（高度なし）
   *
   * @param {number} [attempt=1] - 試行回数
   * @returns {Promise<void>}
   */
  async checkLocationSimple(attempt = 1) {
    if (CONFIG.DEBUG_LOGGING) {
      console.log(`位置情報取得試行: ${attempt}回目`);
    }

    // テストモード: localhostで実行している場合は自動的に成功
    if (isLocalhost() && CONFIG.TEST_MODE_ENABLED) {
      this.simulateSuccess();
      return;
    }

    try {
      const position = await this.getCurrentPosition(attempt);

      // 位置情報の処理
      await this.processPosition(position, attempt);
    } catch (error) {
      await this.handlePositionError(error, attempt, false);
    }
  }

  /**
   * 高度チェック付きの位置情報チェック
   *
   * @param {number} [attempt=1] - 試行回数
   * @returns {Promise<void>}
   */
  async checkLocationWithAltitude(attempt = 1) {
    if (CONFIG.DEBUG_LOGGING) {
      console.log(`高度チェック付き位置情報取得試行: ${attempt}回目`);
    }

    // テストモード
    if (isLocalhost() && CONFIG.TEST_MODE_ENABLED) {
      this.simulateSuccessWithAltitude();
      return;
    }

    try {
      const position = await this.getCurrentPosition(attempt, true);

      // 位置情報の処理（高度あり）
      await this.processPositionWithAltitude(position, attempt);
    } catch (error) {
      await this.handlePositionError(error, attempt, true);
    }
  }

  /**
   * Geolocation APIから現在位置を取得します
   *
   * このメソッドは、navigator.geolocation.getCurrentPositionをPromise化したラッパーです。
   * コールバックベースのAPIをasync/awaitで扱いやすくするために使用されます。
   *
   * @param {number} attempt - 試行回数（1回目は設定に応じた精度、2回目以降は常に高精度）
   * @param {boolean} [highAccuracy=false] - 高精度モードを使用するか（1回目のみ有効）
   * @returns {Promise<GeolocationPosition>} 位置情報を含むPromise
   *
   * @throws {GeolocationPositionError} 位置情報の取得に失敗した場合
   *
   * @example
   * try {
   *   const position = await this.getCurrentPosition(1, true);
   *   console.log(position.coords.latitude, position.coords.longitude);
   * } catch (error) {
   *   console.error('位置情報取得失敗:', error);
   * }
   *
   * @note オプション説明:
   *   - enableHighAccuracy: trueでGPS使用、falseでネットワーク位置情報使用
   *   - timeout: CONFIG.GPS_TIMEOUT_MS (デフォルト60秒)
   *   - maximumAge: 0 = キャッシュを使用せず常に新しい位置情報を要求
   *     ※ただしiOS Safariでは無視されることがあるため、別途キャッシュ検出を実装
   */
  getCurrentPosition(attempt, highAccuracy = false) {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: attempt === 1 ? highAccuracy : true,
        timeout: CONFIG.GPS_TIMEOUT_MS,
        maximumAge: 0, // 常に新しい位置情報を取得
      };

      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        options
      );
    });
  }

  /**
   * 取得した位置情報を処理します
   *
   * @param {GeolocationPosition} position - 位置情報
   * @param {number} attempt - 試行回数
   * @returns {Promise<void>}
   */
  async processPosition(position, attempt) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    const positionTimestamp = position.timestamp;

    if (CONFIG.DEBUG_LOGGING) {
      console.log('位置情報取得成功:', { userLat, userLng, accuracy, timestamp: positionTimestamp });
    }

    // iOSのGPSキャッシュ問題への対応
    // タイムスタンプベースの検出: timestampが同じ = 確実にキャッシュ
    // 座標ベースの検出は補助的に使用（ユーザーが静止している場合との区別のため）
    const coordKey = getCoordinateKey(userLat, userLng);
    const isCachedByTimestamp = positionTimestamp === this.lastTimestamp;
    const isCachedByCoordinate = coordKey === this.lastCoordinateKey;

    // タイムスタンプが同じ、または初回で座標が完全一致する場合はキャッシュと判定
    if (attempt === 1 && (isCachedByTimestamp || (isCachedByCoordinate && this.lastTimestamp !== null))) {
      console.warn('キャッシュされた位置情報を検出しました:', {
        timestamp: positionTimestamp,
        lastTimestamp: this.lastTimestamp,
        coordKey,
        detectionMethod: isCachedByTimestamp ? 'timestamp' : 'coordinate'
      });

      updateButtonState('cache');

      // 遅延後に再試行
      await new Promise(resolve =>
        setTimeout(resolve, CONFIG.CACHE_RETRY_DELAY_MS)
      );

      return this.checkLocationSimple(attempt + 1);
    }

    // 位置情報を記録（次回のキャッシュ検出用）
    this.lastCoordinateKey = coordKey;
    this.lastTimestamp = positionTimestamp;

    // 距離を計算
    const distance = calculateDistance(
      userLat,
      userLng,
      this.targetLat,
      this.targetLng
    );

    // デバッグ情報
    const displayTime = new Date().toLocaleTimeString();
    const debugInfo = `位置取得時刻: ${displayTime} (試行: ${attempt}回目)`;

    // 結果を表示
    showResult({
      distance,
      accuracy,
      userLat,
      userLng,
      targetLat: this.targetLat,
      targetLng: this.targetLng,
      locationName: this.locationName,
      successRedirectUrl: this.successRedirectUrl,
      debugInfo,
    });

    // ボタンを元に戻す
    updateButtonState('ready');
  }

  /**
   * 高度情報を含む位置情報を処理します
   *
   * @param {GeolocationPosition} position - 位置情報
   * @param {number} attempt - 試行回数
   * @returns {Promise<void>}
   */
  async processPositionWithAltitude(position, attempt) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    const altitude = position.coords.altitude;
    const altitudeAccuracy = position.coords.altitudeAccuracy;
    const positionTimestamp = position.timestamp;

    if (CONFIG.DEBUG_LOGGING) {
      console.log('位置情報取得成功（高度あり）:', {
        userLat,
        userLng,
        accuracy,
        altitude,
        altitudeAccuracy,
        timestamp: positionTimestamp,
      });

      // 高度データが取得できない場合の警告
      if (altitude === null || altitude === undefined) {
        console.warn('⚠️ 高度データが取得できませんでした。GPS信号が弱いか、屋内にいる可能性があります。');
      }
    }

    // キャッシュ検出（タイムスタンプベース）
    const coordKey = getCoordinateKey(userLat, userLng);
    const isCachedByTimestamp = positionTimestamp === this.lastTimestamp;
    const isCachedByCoordinate = coordKey === this.lastCoordinateKey;

    if (attempt === 1 && (isCachedByTimestamp || (isCachedByCoordinate && this.lastTimestamp !== null))) {
      console.warn('キャッシュされた位置情報を検出しました:', {
        timestamp: positionTimestamp,
        lastTimestamp: this.lastTimestamp,
        coordKey,
        detectionMethod: isCachedByTimestamp ? 'timestamp' : 'coordinate'
      });

      updateButtonState('cache');

      await new Promise(resolve =>
        setTimeout(resolve, CONFIG.CACHE_RETRY_DELAY_MS)
      );

      return this.checkLocationWithAltitude(attempt + 1);
    }

    this.lastCoordinateKey = coordKey;
    this.lastTimestamp = positionTimestamp;

    // 距離を計算
    const distance = calculateDistance(
      userLat,
      userLng,
      this.targetLat,
      this.targetLng
    );

    // デバッグ情報
    const displayTime = new Date().toLocaleTimeString();
    const debugInfo = `位置取得時刻: ${displayTime} (試行: ${attempt}回目, 高度: ${altitude}m)`;

    // 結果を表示
    showAltitudeResult({
      distance,
      accuracy,
      userLat,
      userLng,
      altitude,
      altitudeAccuracy,
      targetLat: this.targetLat,
      targetLng: this.targetLng,
      targetAltitude: this.targetAltitude,
      locationName: this.locationName,
      successRedirectUrl: this.successRedirectUrl,
      debugInfo,
    });

    updateButtonState('ready');
  }

  /**
   * 位置情報取得エラーを処理します
   *
   * @param {GeolocationPositionError} error - エラー
   * @param {number} attempt - 試行回数
   * @param {boolean} withAltitude - 高度チェック付きか
   * @returns {Promise<void>}
   */
  async handlePositionError(error, attempt, withAltitude) {
    console.error(`位置情報取得エラー (試行: ${attempt}):`, error);

    // 最大試行回数未満ならリトライ
    if (attempt < CONFIG.MAX_GPS_RETRY_ATTEMPTS) {
      if (CONFIG.DEBUG_LOGGING) {
        console.log(`リトライします... (${attempt + 1}/${CONFIG.MAX_GPS_RETRY_ATTEMPTS})`);
      }

      updateButtonState('retrying');

      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS));

      try {
        if (withAltitude) {
          return await this.checkLocationWithAltitude(attempt + 1);
        } else {
          return await this.checkLocationSimple(attempt + 1);
        }
      } catch (retryError) {
        // リトライ中のエラーも適切にハンドリング
        console.error('リトライ中のエラー:', retryError);
        return this.handlePositionError(retryError, attempt + 1, withAltitude);
      }
    }

    // 最終的なエラー表示（すべてのリトライが失敗）
    let message;
    let debugInfo = '';

    if (error && error.code !== undefined) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = MESSAGES.ERROR_ACCESS_DENIED;
          debugInfo = 'エラーコード: PERMISSION_DENIED (1)';
          break;
        case error.POSITION_UNAVAILABLE:
          message = MESSAGES.ERROR_POSITION_UNAVAILABLE;
          debugInfo = 'エラーコード: POSITION_UNAVAILABLE (2)';
          break;
        case error.TIMEOUT:
          message = MESSAGES.ERROR_TIMEOUT;
          debugInfo = 'エラーコード: TIMEOUT (3)';
          break;
        default:
          message = MESSAGES.ERROR_UNKNOWN.replace('{code}', error.code);
          debugInfo = `エラーコード: ${error.code}`;
      }
    } else {
      // error.codeが存在しない場合のフォールバック
      message = MESSAGES.ERROR_UNKNOWN.replace('{code}', 'UNKNOWN');
      debugInfo = `エラー: ${error?.message || '不明'}`;
    }

    if (CONFIG.DEBUG_LOGGING) {
      console.error('最終的なエラー:', debugInfo);
    }

    showError(message, CONFIG.DEBUG_LOGGING ? debugInfo : '');
    updateButtonState('ready');
  }

  /**
   * 成功状態をシミュレートします（テストモード用）
   */
  simulateSuccess() {
    console.log('🧪 テストモード: 成功をシミュレート');

    setTimeout(() => {
      const timestamp = new Date().toLocaleTimeString();
      const debugInfo = `${MESSAGES.TEST_MODE_PREFIX}${formatTemplate(
        MESSAGES.TEST_MODE_SIMULATED,
        { time: timestamp }
      )}`;

      showResult({
        distance: 0,
        accuracy: 5,
        userLat: this.targetLat,
        userLng: this.targetLng,
        targetLat: this.targetLat,
        targetLng: this.targetLng,
        locationName: this.locationName,
        successRedirectUrl: this.successRedirectUrl,
        debugInfo,
      });

      updateButtonState('ready');
    }, 1000);
  }

  /**
   * 高度チェック付きの成功状態をシミュレートします（テストモード用）
   */
  simulateSuccessWithAltitude() {
    console.log('🧪 テストモード: 高度チェック付き成功をシミュレート');

    setTimeout(() => {
      const timestamp = new Date().toLocaleTimeString();
      const debugInfo = `${MESSAGES.TEST_MODE_PREFIX}${formatTemplate(
        MESSAGES.TEST_MODE_SIMULATED,
        { time: timestamp }
      )}`;

      showAltitudeResult({
        distance: 0,
        accuracy: 5,
        userLat: this.targetLat,
        userLng: this.targetLng,
        altitude: 180, // 160m以上
        altitudeAccuracy: 10,
        targetLat: this.targetLat,
        targetLng: this.targetLng,
        targetAltitude: this.targetAltitude,
        locationName: this.locationName,
        successRedirectUrl: this.successRedirectUrl,
        debugInfo,
      });

      updateButtonState('ready');
    }, 1000);
  }

  /**
   * URL のタイムスタンプを更新します（履歴スタック更新用）
   *
   * 注意: この関数はブラウザのHTTPキャッシュを無効化しません。
   * URL履歴を更新することで、「戻る」ボタンで戻った際に
   * 異なるURLとして認識させることが目的です。
   */
  updateURLTimestamp() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('t', Date.now().toString());
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      console.error('URL更新エラー:', error);
    }
  }

  /**
   * 結果表示エリアをクリアします
   */
  clearResultDisplay() {
    try {
      const resultDiv = document.getElementById('result');
      if (resultDiv) {
        resultDiv.innerHTML = '';
        resultDiv.textContent = '';

        // DOM reflow を強制（キャッシュ対策）
        resultDiv.style.display = 'none';
        resultDiv.offsetHeight; // reflow trigger
        resultDiv.style.display = 'block';
      }
    } catch (error) {
      console.error('結果表示クリアエラー:', error);
    }
  }
}

/**
 * ヘルパー関数: テンプレート文字列のフォーマット
 */
function formatTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key] !== undefined ? values[key] : match;
  });
}

/**
 * グローバルに checkLocation 関数をエクスポート（後方互換性のため）
 * この関数は、既存のHTMLから呼び出されます
 */
window.checkLocation = null; // ページ初期化時に設定されます
