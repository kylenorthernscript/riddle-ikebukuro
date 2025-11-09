/**
 * 位置情報計算ユーティリティ
 *
 * このモジュールには、地理的な計算を行う関数が含まれています。
 * - 2点間の距離計算（Haversine公式）
 * - 方角の計算
 * - 距離の表示フォーマット
 *
 * チュートリアル: これらの関数は、GPS座標を扱う際の標準的な計算方法を示しています。
 */

import { CONFIG, DIRECTIONS } from './config.js';

/**
 * 2点間の距離を計算します（Haversine公式）
 *
 * @param {number} lat1 - 始点の緯度
 * @param {number} lng1 - 始点の経度
 * @param {number} lat2 - 終点の緯度
 * @param {number} lng2 - 終点の経度
 * @returns {number} 距離（メートル）
 *
 * @example
 * const distance = calculateDistance(35.73124, 139.71006, 35.73239, 139.70942);
 * console.log(distance); // 約138メートル
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  try {
    // 数値に変換（文字列が渡された場合に備えて）
    lat1 = parseFloat(lat1);
    lng1 = parseFloat(lng1);
    lat2 = parseFloat(lat2);
    lng2 = parseFloat(lng2);

    // 入力値の検証
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      throw new Error('無効な座標が指定されました');
    }

    // 地球の半径（メートル）
    const EARTH_RADIUS_M = 6371000;

    // 度数法からラジアンに変換
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const deltaLatRad = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLngRad = ((lng2 - lng1) * Math.PI) / 180;

    // Haversine公式
    // a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLngRad / 2) *
        Math.sin(deltaLngRad / 2);

    // c = 2 ⋅ atan2( √a, √(1−a) )
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // 距離 = R ⋅ c
    const distance = EARTH_RADIUS_M * c;

    return distance;
  } catch (error) {
    console.error('距離計算エラー:', error);
    return Infinity; // エラー時は無限大を返す（到達不可能を表現）
  }
}

/**
 * 2点間の方角（bearing）を計算します
 *
 * @param {number} lat1 - 始点の緯度
 * @param {number} lng1 - 始点の経度
 * @param {number} lat2 - 終点の緯度
 * @param {number} lng2 - 終点の経度
 * @returns {number} 方角（度数、0-360）
 *
 * @example
 * const bearing = calculateBearing(35.73124, 139.71006, 35.73239, 139.70942);
 * console.log(bearing); // 約320度（北西方向）
 */
export function calculateBearing(lat1, lng1, lat2, lng2) {
  try {
    // 数値に変換
    lat1 = parseFloat(lat1);
    lng1 = parseFloat(lng1);
    lat2 = parseFloat(lat2);
    lng2 = parseFloat(lng2);

    // 入力値の検証
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      throw new Error('無効な座標が指定されました');
    }

    // 度数法からラジアンに変換
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const deltaLngRad = ((lng2 - lng1) * Math.PI) / 180;

    // 方角を計算
    const x = Math.sin(deltaLngRad) * Math.cos(lat2Rad);
    const y =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLngRad);

    const bearing = Math.atan2(x, y) * (180 / Math.PI);

    // 0-360度の範囲に正規化
    return (bearing + 360) % 360;
  } catch (error) {
    console.error('方角計算エラー:', error);
    return 0; // エラー時は北（0度）を返す
  }
}

/**
 * 方角（度数）から方向テキストを取得します
 *
 * @param {number} bearing - 方角（度数、0-360）
 * @returns {Object} 方向情報 { text: '北', arrow: '↑', emoji: '⬆️' }
 *
 * @example
 * const direction = getDirectionText(45);
 * console.log(direction.text); // '北東'
 * console.log(direction.emoji); // '↗️'
 */
export function getDirectionText(bearing) {
  try {
    // 入力値の検証
    if (isNaN(bearing)) {
      throw new Error('無効な方角が指定されました');
    }

    // 0-360度の範囲に正規化
    bearing = ((bearing % 360) + 360) % 360;

    // 方向の境界値を定義（22.5度ごとに8方向）
    const directions = [
      { min: 337.5, max: 360, direction: DIRECTIONS.NORTH },
      { min: 0, max: 22.5, direction: DIRECTIONS.NORTH },
      { min: 22.5, max: 67.5, direction: DIRECTIONS.NORTHEAST },
      { min: 67.5, max: 112.5, direction: DIRECTIONS.EAST },
      { min: 112.5, max: 157.5, direction: DIRECTIONS.SOUTHEAST },
      { min: 157.5, max: 202.5, direction: DIRECTIONS.SOUTH },
      { min: 202.5, max: 247.5, direction: DIRECTIONS.SOUTHWEST },
      { min: 247.5, max: 292.5, direction: DIRECTIONS.WEST },
      { min: 292.5, max: 337.5, direction: DIRECTIONS.NORTHWEST },
    ];

    // 該当する方向を検索
    for (const dir of directions) {
      if (bearing >= dir.min && bearing < dir.max) {
        return dir.direction;
      }
    }

    // デフォルトは北
    return DIRECTIONS.NORTH;
  } catch (error) {
    console.error('方向テキスト取得エラー:', error);
    return DIRECTIONS.NORTH; // エラー時は北を返す
  }
}

/**
 * 距離を読みやすい形式にフォーマットします
 *
 * @param {number} meters - 距離（メートル）
 * @returns {string} フォーマットされた距離（例: "150m" または "2.5km"）
 *
 * @example
 * console.log(formatDistance(500));  // "500m"
 * console.log(formatDistance(1500)); // "1.5km"
 *
 * @note 安定性:
 *   - Math.round()を使用して丸め誤差を防止
 *   - toFixed(1)で小数点1桁に固定し、表示の一貫性を確保
 *   - Infinity、NaN、負の値などの異常値を適切にハンドリング
 */
export function formatDistance(meters) {
  try {
    // 入力値の検証
    if (isNaN(meters) || meters < 0) {
      throw new Error('無効な距離が指定されました');
    }

    // Infinityなどの特殊値のチェック
    if (!isFinite(meters)) {
      return '測定不可';
    }

    // 非常に大きな値のチェック（地球一周の距離より大きい場合）
    if (meters > 40075000) {
      return '>40,000km';
    }

    // 1km未満の場合はメートル表示（整数に丸める）
    if (meters < 1000) {
      return Math.round(meters) + 'm';
    }

    // 1km以上の場合はキロメートル表示（小数点1桁）
    return (meters / 1000).toFixed(1) + 'km';
  } catch (error) {
    console.error('距離フォーマットエラー:', error);
    return '---';
  }
}

/**
 * 2つの座標が同じかどうかを判定します
 * iOSのGPSキャッシュ問題を検出するために使用します
 *
 * @param {number} lat1 - 座標1の緯度
 * @param {number} lng1 - 座標1の経度
 * @param {number} lat2 - 座標2の緯度
 * @param {number} lng2 - 座標2の経度
 * @returns {boolean} 同じ座標の場合true
 */
export function areSameCoordinates(lat1, lng1, lat2, lng2) {
  try {
    // 指定された精度で座標を比較
    const key1 = `${lat1.toFixed(CONFIG.COORDINATE_PRECISION)},${lng1.toFixed(
      CONFIG.COORDINATE_PRECISION
    )}`;
    const key2 = `${lat2.toFixed(CONFIG.COORDINATE_PRECISION)},${lng2.toFixed(
      CONFIG.COORDINATE_PRECISION
    )}`;

    return key1 === key2;
  } catch (error) {
    console.error('座標比較エラー:', error);
    return false;
  }
}

/**
 * 座標を一意のキーに変換します
 * キャッシュ検出に使用します
 *
 * @param {number} lat - 緯度
 * @param {number} lng - 経度
 * @returns {string} 座標キー
 */
export function getCoordinateKey(lat, lng) {
  try {
    return `${lat.toFixed(CONFIG.COORDINATE_PRECISION)},${lng.toFixed(
      CONFIG.COORDINATE_PRECISION
    )}`;
  } catch (error) {
    console.error('座標キー生成エラー:', error);
    return '';
  }
}

/**
 * localhostで実行されているかどうかを判定します
 * テストモードの判定に使用します
 *
 * @returns {boolean} localhostの場合true
 */
export function isLocalhost() {
  try {
    const hostname = window.location.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '' ||
      hostname === '::1'
    );
  } catch (error) {
    console.error('localhost判定エラー:', error);
    return false;
  }
}

/**
 * 座標の妥当性を検証します
 *
 * @param {number} lat - 緯度
 * @param {number} lng - 経度
 * @returns {boolean} 妥当な座標の場合true
 */
export function isValidCoordinate(lat, lng) {
  try {
    lat = parseFloat(lat);
    lng = parseFloat(lng);

    // 緯度は-90から90の範囲
    // 経度は-180から180の範囲
    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  } catch (error) {
    console.error('座標検証エラー:', error);
    return false;
  }
}
