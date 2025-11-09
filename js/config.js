/**
 * アプリケーション設定ファイル
 *
 * このファイルには、位置情報ゲームで使用されるすべての定数と設定が含まれています。
 * チュートリアル: この設定を変更することで、ゲームの動作をカスタマイズできます。
 */

export const CONFIG = {
  // ===================================
  // 位置情報の精度設定
  // ===================================

  /**
   * 成功と判定される距離（メートル）
   * ユーザーがこの距離以内にいる場合、チェックポイントをクリアしたとみなされます
   */
  SUCCESS_DISTANCE_M: 25,

  /**
   * 警告を表示する距離（メートル）
   * 「近づいています」というメッセージを表示する範囲
   */
  WARNING_DISTANCE_M: 100,

  /**
   * 中距離警告の距離（メートル）
   * 「もう少しです」というメッセージを表示する範囲
   */
  MID_DISTANCE_M: 500,

  /**
   * GPS精度が悪いと判断する閾値（メートル）
   * この値を超えると、GPSの精度が低いという警告を表示します
   */
  POOR_GPS_ACCURACY_M: 100,

  // ===================================
  // 高度チェック設定（サンシャイン60展望台用）
  // ===================================

  /**
   * 展望台の最低高度（メートル、海抜）
   * この高度以上にいる必要があります
   */
  MIN_ALTITUDE_M: 160,

  /**
   * 高度チェック時の許容距離（メートル）
   * 展望台の場合、通常より広い範囲を許容します
   */
  ALTITUDE_CHECK_DISTANCE_M: 100,

  // ===================================
  // リトライとタイムアウト設定
  // ===================================

  /**
   * GPS取得の最大試行回数
   * 位置情報の取得に失敗した場合、この回数まで再試行します
   */
  MAX_GPS_RETRY_ATTEMPTS: 3,

  /**
   * GPS取得のタイムアウト（ミリ秒）
   * この時間内に位置情報を取得できない場合はエラーとします
   */
  GPS_TIMEOUT_MS: 60000,

  /**
   * キャッシュ検出時のリトライ遅延（ミリ秒）
   * iOSのGPSキャッシュ問題に対応するための遅延
   */
  CACHE_RETRY_DELAY_MS: 2000,

  /**
   * 通常のリトライ遅延（ミリ秒）
   */
  RETRY_DELAY_MS: 3000,

  /**
   * ページリフレッシュの遅延（ミリ秒）
   * 目標地点に到達していない場合、自動的にページを更新するまでの時間
   */
  PAGE_REFRESH_DELAY_MS: 8000,

  // ===================================
  // リダイレクト設定
  // ===================================

  /**
   * 成功時のリダイレクト遅延（ミリ秒）
   * チェックポイントをクリアした後、次のページに移動するまでの時間
   */
  SUCCESS_REDIRECT_DELAY_MS: 3000,

  // ===================================
  // キャッシュ検出設定
  // ===================================

  /**
   * 座標の精度（小数点以下の桁数）
   * iOSのGPSキャッシュを検出するために使用します
   * 8桁 = 約1mmの精度（緯度1度≒111km、10^-8度≒1.1mm）
   * 注意: 過度に高精度にすると、端末の揺れで誤検出が増える可能性があります
   */
  COORDINATE_PRECISION: 8,

  // ===================================
  // デバッグ設定
  // ===================================

  /**
   * テストモードを有効にする環境
   * localhostで実行している場合、自動的に成功状態をシミュレートします
   * 本番環境では必ずfalseに設定してください
   *
   * 開発時にテストする場合は、一時的にtrueに変更してください：
   * TEST_MODE_ENABLED: true,
   */
  TEST_MODE_ENABLED: false,

  /**
   * デバッグログを有効にする
   */
  DEBUG_LOGGING: true,

  /**
   * テストボタンを表示する
   * 開発時のみtrueに設定することを推奨します
   */
  SHOW_TEST_BUTTON: false,
};

/**
 * テキストメッセージ
 *
 * UIに表示されるすべてのメッセージをここで管理します。
 * 多言語対応を実装する場合は、このオブジェクトを複数用意します。
 */
export const MESSAGES = {
  // ボタンテキスト
  BUTTON_CHECK_LOCATION: '🔍 現在地を確認',
  BUTTON_ACQUIRING: '位置情報を取得中...',
  BUTTON_SIMULATING: '位置情報をシミュレート中（テストモード）...',
  BUTTON_DETECTING_CACHE: 'キャッシュを検出、再試行中...',
  BUTTON_RETRYING: '位置情報を再取得中...',

  // 結果メッセージ
  RESULT_SUCCESS: '目標地点を確認しました！',
  RESULT_SUCCESS_DETAIL: 'チェックポイントをアンロックしました。',
  RESULT_REDIRECTING: '3秒後にリダイレクトします...',

  RESULT_CLOSE: '目標に接近中！',
  RESULT_WARMING: '近づいています...',
  RESULT_TOO_FAR: '目標から遠すぎます',

  RESULT_DIRECTION_TEMPLATE: '{direction}に{distance}移動してください',
  RESULT_CONTINUE_DIRECTION: 'この方向に進んでチェックポイントに到達してください。',
  RESULT_KEEP_HEADING: 'この方向に進み続けてください。',
  RESULT_KEEP_SEARCHING: 'この方向を探索し続けてください。',

  RESULT_PAGE_REFRESH: '8秒後にページを更新します...',

  // 高度チェック用メッセージ
  RESULT_ALTITUDE_SUCCESS: '展望台チェックポイントを確認しました！',
  RESULT_ALTITUDE_CORRECT: '正しい高度にいます。',
  RESULT_IN_AREA: 'エリア内にいます！',
  RESULT_CURRENT_ALTITUDE: '現在の高度: {altitude}m',
  RESULT_GO_TO_OBSERVATORY: '展望台に行ってください（160m以上必要）。',
  RESULT_GOOD_ALTITUDE: '高度は良好ですが、もう少し近づいてください。',
  RESULT_HEAD_TO_DECK: '展望デッキに向かってください。',

  // エラーメッセージ
  ERROR_NO_GEOLOCATION: 'このブラウザは位置情報をサポートしていません。',
  ERROR_ACCESS_DENIED: '位置情報へのアクセスが拒否されました。<br>ブラウザの設定で位置情報を有効にしてください。',
  ERROR_POSITION_UNAVAILABLE: '位置情報を取得できません。<br>WiFiとGPSの設定を確認してください。<br>室内の場合は屋外でお試しください。',
  ERROR_TIMEOUT: '位置情報の取得がタイムアウトしました。<br>もう一度お試しください。',
  ERROR_UNKNOWN: '不明な位置情報エラー。<br>エラーコード: {code}',
  ERROR_LOCATION_FAILED: '位置情報の取得に失敗しました',

  // GPS精度警告
  WARNING_POOR_GPS: 'GPS信号が弱いです！',
  WARNING_GPS_TIPS: '📡 GPS信号が弱いです。以下をお試しください:<br>• 開けた場所に移動する<br>• 高い建物から離れる<br>• Wi-Fiを有効にして精度を向上させる',

  // 高度情報
  ALTITUDE_LABEL: '高度: {altitude}m (海抜)',
  ALTITUDE_TARGET: '目標: 160m以上',
  ALTITUDE_STATUS_SUCCESS: '✅ 成功 (160m以上)',
  ALTITUDE_STATUS_FAIL: '❌ 低すぎます (160m以上必要)',
  ALTITUDE_UNAVAILABLE: '⚠️ 高度データが取得できません',
  ALTITUDE_INDOOR_WARNING: '室内ではGPSが正常に動作しない場合があります',

  // その他
  DISTANCE_LABEL: '距離: {distance}',
  GPS_ACCURACY_LABEL: 'GPS精度: ±{accuracy}m',
  COORDINATES_LABEL: '座標: {lat}, {lng}',
  DEBUG_PREFIX: 'デバッグ: ',
  READY_FOR_CHECK: '位置情報の確認準備完了...',

  // テストモード
  TEST_MODE_PREFIX: '🧪 テストモード - ',
  TEST_MODE_SIMULATED: 'シミュレーション時刻: {time} (localhost検出)',
};

/**
 * 方角のテキスト表現
 */
export const DIRECTIONS = {
  NORTH: { text: '北', arrow: '↑', emoji: '⬆️' },
  NORTHEAST: { text: '北東', arrow: '↗', emoji: '↗️' },
  EAST: { text: '東', arrow: '→', emoji: '➡️' },
  SOUTHEAST: { text: '南東', arrow: '↘', emoji: '↘️' },
  SOUTH: { text: '南', arrow: '↓', emoji: '⬇️' },
  SOUTHWEST: { text: '南西', arrow: '↙', emoji: '↙️' },
  WEST: { text: '西', arrow: '←', emoji: '⬅️' },
  NORTHWEST: { text: '北西', arrow: '↖', emoji: '↖️' },
};

/**
 * ロケーション情報
 *
 * チュートリアル: 各チェックポイントの情報をここで管理します。
 * 新しいロケーションを追加する場合は、このオブジェクトに追加してください。
 */
export const LOCATIONS = {
  location01: {
    id: 'location01',
    name: '池袋西口',
    lat: 35.73124,
    lng: 139.71006,
    successUrl: 'location01/k9x2m7p4.html',
    requireAltitude: false,
  },
  location02: {
    id: 'location02',
    name: 'ROSAビルエントランス',
    lat: 35.73239,
    lng: 139.70942,
    successUrl: 'location02/h8f5q3z9.html',
    requireAltitude: false,
  },
  location03: {
    id: 'location03',
    name: 'ミステリーチェックポイント L3',
    lat: 35.73405,
    lng: 139.71381,
    successUrl: 'location03/success.html',
    requireAltitude: false,
  },
  location04: {
    id: 'location04',
    name: 'ミステリーチェックポイント L4',
    lat: 35.73166,
    lng: 139.71521,
    successUrl: 'location04/success.html',
    requireAltitude: false,
  },
  location05: {
    id: 'location05',
    name: 'ミステリーチェックポイント L5',
    lat: 35.72955,
    lng: 139.71824,
    successUrl: 'location05/success.html',
    requireAltitude: false,
  },
  location06: {
    id: 'location06',
    name: '巣鴨プリズン跡地',
    lat: 35.730331,
    lng: 139.718617,
    successUrl: 'location06/success.html',
    requireAltitude: false,
  },
  sunshineObservatory: {
    id: 'sunshineObservatory',
    name: 'サンシャイン60展望台',
    lat: 35.72955,
    lng: 139.71824,
    successUrl: 'observatory/success.html',
    requireAltitude: true,
    targetAltitude: 160,
  },
};
