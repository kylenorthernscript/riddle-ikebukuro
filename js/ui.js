/**
 * UI表示ユーティリティ
 *
 * このモジュールには、ユーザーインターフェースの表示を管理する関数が含まれています。
 * - 結果表示
 * - エラー表示
 * - ボタンの状態管理
 *
 * チュートリアル: UIとビジネスロジックを分離することで、テストしやすく保守しやすいコードになります。
 */

import { CONFIG, MESSAGES } from './config.js';
import { formatDistance, getDirectionText, calculateBearing } from './geoUtils.js';

/**
 * テキストテンプレートに値を埋め込みます
 *
 * @param {string} template - テンプレート文字列
 * @param {Object} values - 置換する値のオブジェクト
 * @returns {string} 置換後の文字列
 *
 * @example
 * const result = formatTemplate('こんにちは、{name}さん', { name: '太郎' });
 * console.log(result); // 'こんにちは、太郎さん'
 *
 * @note セキュリティ: 将来的に外部データを扱う可能性を考慮し、
 *       すべての置換値は文字列化されHTMLエスケープされます。
 */
function formatTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (values[key] !== undefined) {
      // 数値や文字列を安全にエスケープ
      const value = String(values[key]);
      return sanitize(value);
    }
    return match;
  });
}

/**
 * 文字列をサニタイズします（XSS対策）
 *
 * @param {string} str - サニタイズする文字列
 * @returns {string} サニタイズ後の文字列
 */
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 位置確認の結果を表示します
 *
 * @param {Object} params - パラメータ
 * @param {number} params.distance - 目標地点までの距離（メートル）
 * @param {number} params.accuracy - GPS精度（メートル）
 * @param {number} params.userLat - ユーザーの緯度
 * @param {number} params.userLng - ユーザーの経度
 * @param {number} params.targetLat - 目標地点の緯度
 * @param {number} params.targetLng - 目標地点の経度
 * @param {string} params.locationName - ロケーション名
 * @param {string} params.successRedirectUrl - 成功時のリダイレクトURL
 * @param {string} [params.debugInfo] - デバッグ情報
 */
export function showResult(params) {
  const {
    distance,
    accuracy,
    userLat,
    userLng,
    targetLat,
    targetLng,
    locationName,
    successRedirectUrl,
    debugInfo,
  } = params;

  let resultClass, icon, message, details;

  if (CONFIG.DEBUG_LOGGING) {
    console.log('結果表示:', {
      distance,
      successUrl: successRedirectUrl,
      accuracy,
    });
  }

  // 成功: 25m以内
  if (distance <= CONFIG.SUCCESS_DISTANCE_M) {
    resultClass = 'result-success';
    icon = '✅';
    message = MESSAGES.RESULT_SUCCESS;
    details = `${MESSAGES.RESULT_SUCCESS_DETAIL}<br><small>${MESSAGES.RESULT_REDIRECTING}</small>`;

    // 成功時のリダイレクト
    if (successRedirectUrl && successRedirectUrl !== 'undefined') {
      if (CONFIG.DEBUG_LOGGING) {
        console.log('リダイレクト予定:', successRedirectUrl);
      }

      setTimeout(() => {
        if (CONFIG.DEBUG_LOGGING) {
          console.log('リダイレクト実行:', successRedirectUrl);
        }
        window.location.href = successRedirectUrl;
      }, CONFIG.SUCCESS_REDIRECT_DELAY_MS);
    }
  }
  // 警告: 100m以内
  else if (distance <= CONFIG.WARNING_DISTANCE_M) {
    resultClass = 'result-warning';
    icon = '🧭';
    message = MESSAGES.RESULT_CLOSE;

    const bearing = calculateBearing(userLat, userLng, targetLat, targetLng);
    const direction = getDirectionText(bearing);

    details =
      formatTemplate(MESSAGES.RESULT_DIRECTION_TEMPLATE, {
        direction: direction.text,
        distance: formatDistance(distance),
      }) +
      '<br>' +
      `<div style="font-size: 2rem; margin: 0.5rem 0;">${direction.arrow}</div>` +
      MESSAGES.RESULT_CONTINUE_DIRECTION +
      `<br><small>${MESSAGES.RESULT_PAGE_REFRESH}</small>`;

    // ページのリフレッシュをスケジュール
    schedulePageRefresh();
  }
  // その他
  else {
    const bearing = calculateBearing(userLat, userLng, targetLat, targetLng);
    const direction = getDirectionText(bearing);

    // 中距離: 500m以内
    if (distance <= CONFIG.MID_DISTANCE_M) {
      resultClass = 'result-warning';
      icon = '⚠️';
      message = MESSAGES.RESULT_WARMING;
      details =
        formatTemplate(MESSAGES.RESULT_DIRECTION_TEMPLATE, {
          direction: direction.text,
          distance: formatDistance(distance),
        }) +
        '<br>' +
        `<div style="font-size: 2rem; margin: 0.5rem 0;">${direction.arrow}</div>` +
        MESSAGES.RESULT_KEEP_HEADING +
        `<br><small>${MESSAGES.RESULT_PAGE_REFRESH}</small>`;
    }
    // 遠距離: 500m超
    else {
      resultClass = 'result-error';
      icon = '❌';
      message = MESSAGES.RESULT_TOO_FAR;
      details =
        formatTemplate(MESSAGES.RESULT_DIRECTION_TEMPLATE, {
          direction: direction.text,
          distance: formatDistance(distance),
        }) +
        '<br>' +
        `<div style="font-size: 2rem; margin: 0.5rem 0;">${direction.arrow}</div>` +
        MESSAGES.RESULT_KEEP_SEARCHING +
        `<br><small>${MESSAGES.RESULT_PAGE_REFRESH}</small>`;
    }

    // ページのリフレッシュをスケジュール
    schedulePageRefresh();
  }

  // GPS精度の警告
  const accuracyWarning =
    accuracy >= CONFIG.POOR_GPS_ACCURACY_M
      ? `<span style="color: #FFA500; font-weight: bold;"> ${MESSAGES.WARNING_POOR_GPS}</span>`
      : '';

  const gpsWarningBox =
    accuracy >= CONFIG.POOR_GPS_ACCURACY_M
      ? `<div style="background: rgba(255, 255, 255, 0.9); border: 2px solid #FF6B35; border-radius: 6px; padding: 0.75rem; margin: 0.5rem 0; font-size: 0.9rem; color: #000; font-weight: bold;">${MESSAGES.WARNING_GPS_TIPS}</div>`
      : '';

  // デバッグ情報
  const debugDisplay = debugInfo
    ? `<div style="font-size: 0.8rem; margin-top: 1rem; opacity: 0.7; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.5rem;">${MESSAGES.DEBUG_PREFIX}${sanitize(
        debugInfo
      )}</div>`
    : '';

  // 結果を表示
  const resultDiv = document.getElementById('result');
  if (!resultDiv) {
    console.error('結果表示エリアが見つかりません');
    return;
  }

  resultDiv.innerHTML = `
    <div class="result-card ${resultClass}">
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">${icon}</div>
      <div>${message}</div>
      <div class="distance-info">
        ${formatTemplate(MESSAGES.DISTANCE_LABEL, {
          distance: formatDistance(distance),
        })}<br>
        ${details}
      </div>
      <div class="accuracy-info">
        ${formatTemplate(MESSAGES.GPS_ACCURACY_LABEL, {
          accuracy: Math.round(accuracy),
        })}${accuracyWarning}<br>
        ${gpsWarningBox}
        ${formatTemplate(MESSAGES.COORDINATES_LABEL, {
          lat: userLat.toFixed(6),
          lng: userLng.toFixed(6),
        })}
      </div>
      ${debugDisplay}
    </div>
  `;
}

/**
 * 高度チェック付きの結果を表示します（展望台用）
 *
 * @param {Object} params - パラメータ
 */
export function showAltitudeResult(params) {
  const {
    distance,
    accuracy,
    userLat,
    userLng,
    altitude,
    altitudeAccuracy,
    targetLat,
    targetLng,
    targetAltitude,
    locationName,
    successRedirectUrl,
    debugInfo,
  } = params;

  let resultClass, icon, message, details;
  let altitudeInfo = '';

  if (CONFIG.DEBUG_LOGGING) {
    console.log('高度チェック結果:', {
      distance,
      altitude,
      targetAltitude,
    });
  }

  // 高度のチェック
  // 注意: altitude は null になることがある（特に屋内やGPS信号が弱い場合）
  let altitudeOk = false;
  let altitudeValue = null;

  // 高度データの検証とフォールバック処理
  if (altitude !== null && altitude !== undefined && !isNaN(altitude)) {
    altitudeValue = altitude;
    altitudeOk = altitude >= CONFIG.MIN_ALTITUDE_M;

    const altitudeStatus = altitudeOk
      ? MESSAGES.ALTITUDE_STATUS_SUCCESS
      : MESSAGES.ALTITUDE_STATUS_FAIL;

    const altitudeAccuracyText =
      (altitudeAccuracy !== null && altitudeAccuracy !== undefined && !isNaN(altitudeAccuracy))
        ? `<br>高度精度: ±${Math.round(altitudeAccuracy)}m`
        : '';

    altitudeInfo = `
      <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.2);">
        ${formatTemplate(MESSAGES.ALTITUDE_LABEL, {
          altitude: Math.round(altitude),
        })}<br>
        ${MESSAGES.ALTITUDE_TARGET}<br>
        ステータス: ${altitudeStatus}${altitudeAccuracyText}
      </div>
    `;
  } else {
    // 高度データが取得できない場合の明確なフィードバック
    if (CONFIG.DEBUG_LOGGING) {
      console.warn('高度データが取得できません:', { altitude, altitudeAccuracy });
    }

    altitudeInfo = `
      <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.2); color: #FFA500;">
        ${MESSAGES.ALTITUDE_UNAVAILABLE}<br>
        ${MESSAGES.ALTITUDE_INDOOR_WARNING}
      </div>
    `;
  }

  // 成功: 距離と高度が両方OK
  if (distance <= CONFIG.ALTITUDE_CHECK_DISTANCE_M && altitudeOk) {
    resultClass = 'result-success';
    icon = '✅';
    message = MESSAGES.RESULT_ALTITUDE_SUCCESS;
    details = `${MESSAGES.RESULT_ALTITUDE_CORRECT}<br><small>${MESSAGES.RESULT_REDIRECTING}</small>`;

    if (successRedirectUrl && successRedirectUrl !== 'undefined') {
      setTimeout(() => {
        window.location.href = successRedirectUrl;
      }, CONFIG.SUCCESS_REDIRECT_DELAY_MS);
    }
  }
  // エリア内だが高度が足りない
  else if (distance <= CONFIG.ALTITUDE_CHECK_DISTANCE_M * 2) {
    resultClass = 'result-warning';
    icon = '🧭';
    message = MESSAGES.RESULT_IN_AREA;

    const bearing = calculateBearing(userLat, userLng, targetLat, targetLng);
    const direction = getDirectionText(bearing);

    if (!altitudeOk && altitude !== null) {
      if (altitude < CONFIG.MIN_ALTITUDE_M) {
        details = `${formatTemplate(MESSAGES.RESULT_CURRENT_ALTITUDE, {
          altitude: Math.round(altitude),
        })}<br>${
          MESSAGES.RESULT_GO_TO_OBSERVATORY
        }<br><small>${MESSAGES.RESULT_PAGE_REFRESH}</small>`;
      } else {
        details =
          formatTemplate(MESSAGES.RESULT_DIRECTION_TEMPLATE, {
            direction: direction.text,
            distance: formatDistance(distance),
          }) +
          '<br>' +
          `<div style="font-size: 2rem; margin: 0.5rem 0;">${direction.arrow}</div>` +
          MESSAGES.RESULT_GOOD_ALTITUDE +
          `<br><small>${MESSAGES.RESULT_PAGE_REFRESH}</small>`;
      }
    } else {
      details =
        formatTemplate(MESSAGES.RESULT_DIRECTION_TEMPLATE, {
          direction: direction.text,
          distance: formatDistance(distance),
        }) +
        '<br>' +
        `<div style="font-size: 2rem; margin: 0.5rem 0;">${direction.arrow}</div>` +
        MESSAGES.RESULT_HEAD_TO_DECK +
        `<br><small>${MESSAGES.RESULT_PAGE_REFRESH}</small>`;
    }

    schedulePageRefresh();
  }
  // 遠い
  else {
    resultClass = 'result-error';
    icon = '❌';
    message = MESSAGES.RESULT_TOO_FAR;

    const bearing = calculateBearing(userLat, userLng, targetLat, targetLng);
    const direction = getDirectionText(bearing);

    details =
      formatTemplate(MESSAGES.RESULT_DIRECTION_TEMPLATE, {
        direction: direction.text,
        distance: formatDistance(distance),
      }) +
      '<br>' +
      `<div style="font-size: 2rem; margin: 0.5rem 0;">${direction.arrow}</div>` +
      MESSAGES.RESULT_KEEP_SEARCHING +
      `<br><small>${MESSAGES.RESULT_PAGE_REFRESH}</small>`;

    schedulePageRefresh();
  }

  // GPS精度の警告
  const accuracyWarning =
    accuracy >= CONFIG.POOR_GPS_ACCURACY_M
      ? `<span style="color: #FFA500; font-weight: bold;"> ${MESSAGES.WARNING_POOR_GPS}</span>`
      : '';

  const gpsWarningBox =
    accuracy >= CONFIG.POOR_GPS_ACCURACY_M
      ? `<div style="background: rgba(255, 255, 255, 0.9); border: 2px solid #FF6B35; border-radius: 6px; padding: 0.75rem; margin: 0.5rem 0; font-size: 0.9rem; color: #000; font-weight: bold;">${MESSAGES.WARNING_GPS_TIPS}</div>`
      : '';

  const debugDisplay = debugInfo
    ? `<div style="font-size: 0.8rem; margin-top: 1rem; opacity: 0.7; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.5rem;">${MESSAGES.DEBUG_PREFIX}${sanitize(
        debugInfo
      )}</div>`
    : '';

  const resultDiv = document.getElementById('result');
  if (!resultDiv) {
    console.error('結果表示エリアが見つかりません');
    return;
  }

  resultDiv.innerHTML = `
    <div class="result-card ${resultClass}">
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">${icon}</div>
      <div>${message}</div>
      <div class="distance-info">
        ${formatTemplate(MESSAGES.DISTANCE_LABEL, {
          distance: formatDistance(distance),
        })}<br>
        ${details}
        ${altitudeInfo}
      </div>
      <div class="accuracy-info">
        ${formatTemplate(MESSAGES.GPS_ACCURACY_LABEL, {
          accuracy: Math.round(accuracy),
        })}${accuracyWarning}<br>
        ${gpsWarningBox}
        ${formatTemplate(MESSAGES.COORDINATES_LABEL, {
          lat: userLat.toFixed(6),
          lng: userLng.toFixed(6),
        })}
      </div>
      ${debugDisplay}
    </div>
  `;
}

/**
 * エラーメッセージを表示します
 *
 * @param {string} message - エラーメッセージ
 * @param {string} [debugInfo] - デバッグ情報
 */
export function showError(message, debugInfo = '') {
  const debugDisplay = debugInfo
    ? `<div style="font-size: 0.8rem; margin-top: 1rem; opacity: 0.7; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.5rem;">${MESSAGES.DEBUG_PREFIX}${sanitize(
        debugInfo
      )}</div>`
    : '';

  const resultDiv = document.getElementById('result');
  if (!resultDiv) {
    console.error('結果表示エリアが見つかりません');
    return;
  }

  resultDiv.innerHTML = `
    <div class="result-card result-error">
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">❌</div>
      <div>${MESSAGES.ERROR_LOCATION_FAILED}</div>
      <div class="distance-info">${message}</div>
      ${debugDisplay}
    </div>
  `;
}

/**
 * ボタンの状態を更新します
 *
 * @param {string} state - ボタンの状態 ('ready', 'loading', 'simulating', 'retrying', 'cache')
 */
export function updateButtonState(state) {
  const btn = document.getElementById('checkLocationBtn');
  if (!btn) {
    console.error('ボタンが見つかりません');
    return;
  }

  switch (state) {
    case 'ready':
      btn.disabled = false;
      btn.innerHTML = MESSAGES.BUTTON_CHECK_LOCATION;
      break;

    case 'loading':
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span>${MESSAGES.BUTTON_ACQUIRING}`;
      break;

    case 'simulating':
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span>${MESSAGES.BUTTON_SIMULATING}`;
      break;

    case 'retrying':
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span>${MESSAGES.BUTTON_RETRYING}`;
      break;

    case 'cache':
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span>${MESSAGES.BUTTON_DETECTING_CACHE}`;
      break;

    default:
      console.warn('不明なボタン状態:', state);
  }
}

/**
 * ページのリフレッシュをスケジュールします（複数のフォールバック方式）
 */
function schedulePageRefresh() {
  let refreshAttempts = 0;

  const attemptRefresh = () => {
    refreshAttempts++;

    if (CONFIG.DEBUG_LOGGING) {
      console.log(`リフレッシュ試行 #${refreshAttempts}`);
    }

    try {
      const url = new URL(window.location.href);
      url.search = '';
      url.searchParams.set('t', Date.now().toString());

      if (refreshAttempts === 1) {
        window.location.replace(url.toString());
      } else if (refreshAttempts === 2) {
        url.searchParams.set('retry', Date.now().toString());
        window.location.href = url.toString();
      } else {
        window.location.reload(true);
      }
    } catch (error) {
      console.error('リフレッシュ失敗:', error);

      // 最後の手段: meta refreshタグを使用
      const meta = document.createElement('meta');
      meta.httpEquiv = 'refresh';
      meta.content = '1';
      document.head.appendChild(meta);
    }
  };

  setTimeout(attemptRefresh, CONFIG.PAGE_REFRESH_DELAY_MS);
  setTimeout(attemptRefresh, CONFIG.PAGE_REFRESH_DELAY_MS + 2000); // バックアップ
}

