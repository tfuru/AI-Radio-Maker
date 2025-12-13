# AI Radio Maker

AI Radio Maker は、LLM（大規模言語モデル）を使用してラジオ番組の台本を自動生成し、VOICEVOX などの TTS（音声合成）エンジンを使って読み上げを行う Web アプリケーションです。

## 特徴

*   **台本生成**: 指定した「テーマ」や「ニュース記事」を元に、AI がラジオ風の台本を作成します。
*   **パーソナリティ**: 「朝のDJ」「深夜の語り」「お笑いコンビ」「テック解説」などのプリセットや、独自のキャラクター設定が可能です。
*   **音声再生**: 生成された台本を TTS サーバー（VOICEVOX 互換 API）経由で読み上げます。
*   **設定変更**: LLM や TTS の API エンドポイントを UI 上から設定可能です。

## 前提条件

このアプリケーションを完全に動作させるには、以下の外部サービス（サーバー）が必要です。

1.  **LLM サーバー**: OpenAI 互換の API を提供するサーバー（例: [LM Studio](https://lmstudio.ai/) など）。
    *   CORS 設定が許可されている必要があります。
2.  **TTS サーバー**: VOICEVOX 互換の API を提供するサーバー（例: [VOICEVOX](https://voicevox.hiroshiba.jp/)、COEIROINK など）。
    *   CORS 設定が許可されている必要があります。

## 起動方法

Docker (または Podman) を使用して Web サーバーを起動します。

```bash
docker-compose up --build
# または
podman compose up --build
```

起動後、ブラウザで以下の URL にアクセスしてください。

http://localhost:5500

## 設定方法

画面右上の設定ボタン（歯車アイコン）から、接続先の設定を行ってください。

### LLM Server (LM Studio 等)
*   **API Base URL**: 例 `http://127.0.0.1:1234/v1` または `http://192.168.x.x:1234/v1`
*   **Model ID**: 使用するモデルID（LM Studio の場合は通常 `local-model`）

### Voice Synthesis API (VOICEVOX 等)
*   **Voicevox Base URL**: 例 `http://127.0.0.1:50021` または `http://192.168.x.x:50021`
*   **Speaker**: 「リスト更新」ボタンを押して、利用可能な話者を選択してください。

## 使い方

1.  **パーソナリティ選択**: 左側のリストから好きなキャラクターを選びます。
2.  **テーマ入力**: 「番組のテーマ」を入力するか、「参考資料」にニュース記事などを貼り付けます。
3.  **生成**: 「台本を生成」ボタンをクリックします。
4.  **再生**: 台本が表示されたら、下部の「音声を再生」ボタンをクリックします。

## ファイル構成

*   `src/`: フロントエンドのソースコード (HTML, CSS, JS)
*   `Dockerfile`: 配信用の簡易 Web サーバー設定
*   `compose.yml`: コンテナ起動設定

## License
MIT# AI-Radio-Maker
