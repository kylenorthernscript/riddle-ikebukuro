# Riddle Ikebukuro - 位置情報ゲーム

池袋を舞台にした位置情報ベースのミステリーゲームです。GPSを使用して実際の場所を訪れ、謎を解いていくインタラクティブな体験を提供します。

## 🎯 プロジェクト概要

このプロジェクトは、Geolocation APIを活用した位置情報ゲームの実装例です。プレイヤーは池袋周辺の特定の場所（チェックポイント）を訪れ、その位置を確認することでゲームを進行します。

### 主な機能

- **GPS位置情報の取得と検証**: Geolocation APIを使用して現在地を取得
- **距離計算**: Haversine公式による高精度な距離計算
- **高度チェック**: 展望台などの高層階での位置確認（オプション）
- **キャッシュ検出**: iOSのGPSキャッシュ問題を自動検出して再試行
- **テストモード**: localhost環境で自動的に成功をシミュレート
- **リトライ機構**: GPS取得失敗時の自動再試行
- **レスポンシブデザイン**: モバイルファースト設計

## 📁 プロジェクト構造

```
riddle-ikebukuro/
├── index.html                    # トップページ
├── location01.html - location06.html  # 各チェックポイントのページ
├── sunshine-observatory.html     # 展望台専用ページ（高度チェック付き）
├── location-styles.css           # 統一スタイルシート
├── js/
│   ├── config.js                 # 設定と定数
│   ├── geoUtils.js               # 位置情報計算ユーティリティ
│   ├── ui.js                     # UI表示ロジック
│   ├── locationChecker.js        # メインビジネスロジック
│   └── pageInit.js               # ページ初期化
└── README.md                     # このファイル
```

## 🏗️ アーキテクチャ

このプロジェクトは、モジュール化された設計を採用しています：

### 1. **config.js** - 設定管理
すべての定数、メッセージ、ロケーション情報を一元管理します。

```javascript
export const CONFIG = {
  SUCCESS_DISTANCE_M: 25,        // 成功判定距離
  WARNING_DISTANCE_M: 100,       // 警告表示距離
  GPS_TIMEOUT_MS: 60000,         // GPSタイムアウト
  MAX_GPS_RETRY_ATTEMPTS: 3,     // 最大リトライ回数
  // ...その他の設定
};
```

### 2. **geoUtils.js** - 地理計算
位置情報に関する計算を担当します。

- `calculateDistance()`: Haversine公式による2点間の距離計算
- `calculateBearing()`: 方角の計算
- `getDirectionText()`: 方角テキストの取得
- `formatDistance()`: 距離の表示フォーマット
- `isValidCoordinate()`: 座標の妥当性検証

### 3. **ui.js** - UI表示
すべてのUI表示ロジックを分離し、ビジネスロジックとの結合を疎にします。

- `showResult()`: 通常の結果表示
- `showAltitudeResult()`: 高度チェック結果表示
- `showError()`: エラー表示
- `updateButtonState()`: ボタンの状態管理

### 4. **locationChecker.js** - ビジネスロジック
位置情報チェックのメインロジックをカプセル化します。

```javascript
export class LocationChecker {
  constructor(options) { /* ... */ }
  async checkLocation() { /* ... */ }
  async processPosition(position, attempt) { /* ... */ }
  async handlePositionError(error, attempt, withAltitude) { /* ... */ }
}
```

### 5. **pageInit.js** - 初期化
ページの初期化処理とキャッシュ管理を統括します。

- キャッシュクリア
- イベントリスナーの設定
- Service Worker制御
- URL タイムスタンプ管理

## 🚀 セットアップ

### 必要条件

- モダンブラウザ（ES6 Modules対応）
- HTTPS環境（Geolocation APIの要件）
  - または localhost での実行

### ローカル開発

```bash
# 簡易HTTPサーバーの起動（Python 3の場合）
python -m http.server 8000

# または Node.js の http-server を使用
pnpm dev

# ブラウザでアクセス
open http://localhost:8000
```

**重要**:
- Geolocation APIは**HTTPSまたはlocalhostでのみ動作**します
- file:// プロトコルでHTMLファイルを直接開いても動作しません
- ES6 Modulesを使用しているため、必ずHTTPサーバー経由でアクセスしてください

**テストモード**:
- デフォルトではテストモードは無効です
- 開発時に位置情報なしでテストする場合は、`js/config.js` の `TEST_MODE_ENABLED` を `true` に変更してください
- テストモードが有効な場合、localhostで実行すると自動的にすべての位置チェックが成功します

### プロダクション環境

HTTPS環境にデプロイしてください。Geolocation APIはHTTPSまたはlocalhostでのみ動作します。

## 🎮 使い方

### 基本的な使い方

1. HTMLファイルで `initializePage()` を呼び出します：

```html
<script type="module">
  import { initializePage } from './js/pageInit.js';

  initializePage({
    targetLat: 35.73124,              // 目標地点の緯度
    targetLng: 139.71006,             // 目標地点の経度
    locationName: '池袋西口',          // ロケーション名
    successRedirectUrl: 'next.html',  // 成功時のリダイレクトURL
    requireAltitude: false            // 高度チェックの要否
  });
</script>
```

2. HTML内に必要な要素を配置します：

```html
<button id="checkLocationBtn" class="check-btn" onclick="checkLocation()">
  🔍 現在地を確認
</button>
<div id="result" class="result"></div>
```

### 高度チェック付きロケーション

展望台などの高層階で位置確認する場合：

```javascript
initializePage({
  targetLat: 35.72955,
  targetLng: 139.71824,
  locationName: 'サンシャイン60展望台',
  successRedirectUrl: 'success.html',
  requireAltitude: true,    // 高度チェックを有効化
  targetAltitude: 160       // 目標高度（メートル、海抜）
});
```

## ⚙️ 設定のカスタマイズ

`js/config.js` を編集することで、ゲームの動作をカスタマイズできます：

```javascript
export const CONFIG = {
  // 距離判定の調整
  SUCCESS_DISTANCE_M: 25,      // 成功と判定される距離
  WARNING_DISTANCE_M: 100,     // 「近づいています」の範囲

  // タイムアウトとリトライ
  GPS_TIMEOUT_MS: 60000,       // GPS取得のタイムアウト
  MAX_GPS_RETRY_ATTEMPTS: 3,   // 最大リトライ回数

  // 開発設定
  TEST_MODE_ENABLED: true,     // テストモードの有効化
  DEBUG_LOGGING: true,         // デバッグログの出力
  SHOW_TEST_BUTTON: false,     // テストボタンの表示
};
```

## 🔧 技術的な特徴

### iOSのGPSキャッシュ問題への対応

iOSデバイスでは、GPSの座標がキャッシュされる問題があります。本プロジェクトでは以下の方法で対処しています：

1. **タイムスタンプベースの検出**: `position.timestamp` が前回と同一の場合、確実にキャッシュと判定
2. **座標ベースの検出**: 補助的に座標を比較（小数点8桁の精度で）
3. **自動再試行**: キャッシュ検出時に2秒待機後、自動的に再取得
4. **URL履歴更新**: タイムスタンプパラメータによる履歴スタックの更新（注: HTTPキャッシュは無効化しません）
5. **DOM reflow**: 強制的なDOM再描画によるUI状態のクリア

**注意**:
- `maximumAge: 0` を設定していますが、iOS Safariでは無視されることがあります
- URL更新はブラウザの履歴スタックを更新するだけで、HTTPキャッシュは無効化しません
- タイムスタンプ比較により、ユーザーが静止している場合とキャッシュを正確に区別できます

### Haversine公式による距離計算

2点間の距離を高精度に計算するため、Haversine公式を使用：

```javascript
// 地球の半径（メートル）
const EARTH_RADIUS_M = 6371000;

// Haversine公式
const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
          Math.cos(lat1Rad) * Math.cos(lat2Rad) *
          Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
const distance = EARTH_RADIUS_M * c;
```

### セキュリティ

- **XSS対策**: UI出力時のHTMLエスケープ処理
- **入力検証**: すべての座標と設定値の妥当性チェック
- **エラーハンドリング**: 包括的なtry-catch処理

## 📱 ブラウザサポート

- ✅ Chrome (Android/iOS)
- ✅ Safari (iOS)
- ✅ Firefox (Android)
- ✅ Edge (Android)

**注意**: Geolocation APIにはユーザーの位置情報許可が必要です。

## 🐛 トラブルシューティング

### GPS精度が低い

- 開けた場所に移動する
- 高い建物から離れる
- Wi-Fiを有効にする（精度向上）
- しばらく待ってから再試行

### 位置情報が取得できない

- ブラウザの位置情報許可を確認
- デバイスの位置情報サービスが有効か確認
- HTTPSまたはlocalhostで実行しているか確認

### キャッシュされた結果が表示される

- ページを完全にリロード（強制リフレッシュ）
- ブラウザキャッシュをクリア
- URLのタイムスタンプパラメータが更新されているか確認

## 📝 ライセンス

このプロジェクトは教育目的のサンプルコードです。

## 👥 貢献

このプロジェクトはチュートリアル目的で作成されています。改善提案やバグ報告は歓迎します。

## 🔗 関連リソース

- [Geolocation API - MDN](https://developer.mozilla.org/ja/docs/Web/API/Geolocation_API)
- [Haversine formula - Wikipedia](https://en.wikipedia.org/wiki/Haversine_formula)
- [ES6 Modules - MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Modules)
# riddle-ikebukuro
