// --- データ定義 ---
const PRESET_PERSONAS = [
    {
        id: 'morning_dj',
        name: '朝のハイテンションDJ',
        type: 'preset',
        icon: 'sun',
        color: 'text-orange-400',
        description: '元気いっぱいに朝のニュースやトレンドを紹介するFMラジオ風。',
        systemPrompt: `あなたはFMラジオの朝の帯番組を担当する、非常にハイテンションで元気なDJ「サニー」です。
        音声合成で読み上げるため、以下の点に注意してください。
        1. 役名は「サニー: 」の形式で書いてください。
        2. ト書き（効果音や動作）は必ず丸括弧（ ）で囲んでください。
        3. リスナーに活力を与えるような、読みやすい口調で話してください。
        
        # 出力例
        サニー: 「おはようございます！今日のトピックは...」
        （効果音: 軽快なジングル）
        サニー: 「...」`
    },
    {
        id: 'late_night',
        name: '深夜のチルアウト・トーク',
        type: 'preset',
        icon: 'moon',
        color: 'text-indigo-400',
        description: '落ち着いた声色で、深夜に一人で聴きたくなるような深い語り。',
        systemPrompt: `あなたは深夜2時のラジオ番組「Midnight Blue」のパーソナリティ「ルナ」です。
        音声合成で読み上げるため、以下の点に注意してください。
        1. 役名は「ルナ: 」の形式で書いてください。
        2. ト書き（効果音や動作）は必ず丸括弧（ ）で囲んでください。
        3. 非常に落ち着いた、ささやくような、知的な口調で話してください。
        
        # 出力例
        ルナ: 「こんばんは...起きていますか...」
        （効果音: 静かなジャズピアノ）
        ルナ: 「...」`
    },
    {
        id: 'tech_news',
        name: 'テックニュース解説員',
        type: 'preset',
        icon: 'file-text',
        color: 'text-cyan-400',
        description: 'ITニュースや技術トレンドを分かりやすく解説する専門家。',
        systemPrompt: `あなたはIT技術やガジェットに詳しいテックニュース解説員「ギーク先生」です。
        音声合成で読み上げるため、以下の点に注意してください。
        1. 役名は「ギーク先生: 」の形式で書いてください。
        2. ト書きは丸括弧（ ）で囲んでください。
        3. 専門用語を使いつつも、読み間違いの起きにくい平易な言葉で話してください。
        
        # 出力例
        ギーク先生: 「さて、今日入ってきた注目のニュースはこちらです...」`
    }
];

class RadioApp {
    constructor() {
        this.state = {
            apiUrl: 'http://192.168.10.106:1234/v1',
            apiKey: 'lm-studio',
            modelId: 'local-model',
            // TTS Settings
            ttsUrl: 'http://192.168.10.106:8080',
            ttsKey: '',
            ttsSpeakerId: '1',

            // SE Settings
            searchApiUrl: 'http://192.168.10.106:9000/',

            selectedPersonaId: PRESET_PERSONAS[0].id,
            personalityName: 'パーソナリティもも',
            customPersona: {
                id: 'custom',
                name: 'オリジナル・パーソナリティ',
                type: 'custom',
                iconUrl: null,
                description: '設定を編集して、あなただけのDJを作成します。',
                systemPrompt: `あなたは「（名前）」というラジオパーソナリティです。
音声合成ソフトで読み上げるため、以下の点に注意してください。
1. 役名は「（名前）: 」の形式で書いてください。
2. ト書き（効果音や動作）は必ず丸括弧（ ）で囲んでください。
3. 読み間違いの起きにくい平易な言葉を使ってください。

# 出力例
（名前）: 「...」`
            },
            script: '',
            isLoading: false,
            isPlaying: false, // 再生状態管理
            audioElement: null, // 現在再生中のメイン音声(Personality)
            activeAudios: [],   // 現在再生中のすべての音声要素(Mixer含む)
            discordWebhookUrl: '' // Discord Webhook URL
        };

        // DOM Elements Cache
        this.els = {
            toggleSettingsBtn: document.getElementById('toggleSettingsBtn'),
            settingsPanel: document.getElementById('settingsPanel'),
            apiUrlInput: document.getElementById('apiUrlInput'),
            apiKeyInput: document.getElementById('apiKeyInput'),
            modelIdInput: document.getElementById('modelIdInput'),
            testConnectionBtn: document.getElementById('testConnectionBtn'),
            connectionStatusMsg: document.getElementById('connectionStatusMsg'),
            fetchModelsBtn: document.getElementById('fetchModelsBtn'),
            modelSelectContainer: document.getElementById('modelSelectContainer'),
            modelSelect: document.getElementById('modelSelect'),
            modelFetchErrorMsg: document.getElementById('modelFetchErrorMsg'),
            ttsUrlInput: document.getElementById('ttsUrlInput'),
            ttsKeyInput: document.getElementById('ttsKeyInput'),
            ttsSpeakerSelect: document.getElementById('ttsSpeakerSelect'),
            fetchTtsSpeakersBtn: document.getElementById('fetchTtsSpeakersBtn'),
            ttsSpeakerFetchErrorMsg: document.getElementById('ttsSpeakerFetchErrorMsg'),
            searchApiUrlInput: document.getElementById('searchApiUrlInput'),
            playAudioBtn: document.getElementById('playAudioBtn'),
            audioStatus: document.getElementById('audioStatus'),
            bottomActions: document.getElementById('bottomActions'),
            topicInput: document.getElementById('topicInput'),
            referenceInput: document.getElementById('referenceInput'),
            searchNewsBtn: document.getElementById('searchNewsBtn'),
            personaList: document.getElementById('personaList'),
            customPersonaEditor: document.getElementById('customPersonaEditor'),
            iconFileInput: document.getElementById('iconFileInput'),
            customIconPreview: document.getElementById('customIconPreview'),
            personalityNameInput: document.getElementById('personalityNameInput'),
            customNameInput: document.getElementById('customNameInput'),
            customPromptInput: document.getElementById('customPromptInput'),
            generateBtn: document.getElementById('generateBtn'),
            errorArea: document.getElementById('errorArea'),
            errorText: document.getElementById('errorText'),
            paperIconContainer: document.getElementById('paperIconContainer'),
            paperPersonaName: document.getElementById('paperPersonaName'),
            paperTopic: document.getElementById('paperTopic'),
            emptyState: document.getElementById('emptyState'),
            loadingState: document.getElementById('loadingState'),
            scriptContent: document.getElementById('scriptContent'),
            scriptActions: document.getElementById('scriptActions'),
            copyBtn: document.getElementById('copyBtn'),
            downloadAudioBtn: document.getElementById('downloadAudioBtn'),
            discordWebhookInput: document.getElementById('discordWebhookInput'),
            postDiscordBtn: document.getElementById('postDiscordBtn'),
            syncSettingsBtn: document.getElementById('syncSettingsBtn'),
            testAutomationBtn: document.getElementById('testAutomationBtn'),
            automationStatus: document.getElementById('automationStatus')
        };

        this.init();
    }

    init() {
        this.loadSettings();
        this.renderPersonaList();
        this.updatePaperHeader();
        this.updateInputsFromState();
        this.bindEvents();

        lucide.createIcons();

        // Set initial selected value for speaker
        if (this.state.ttsSpeakerId) {
            const exists = Array.from(this.els.ttsSpeakerSelect.options).some(opt => opt.value === this.state.ttsSpeakerId);
            if (!exists) {
                const opt = document.createElement('option');
                opt.value = this.state.ttsSpeakerId;
                opt.text = `ID: ${this.state.ttsSpeakerId}`;
                this.els.ttsSpeakerSelect.add(opt);
            }
            this.els.ttsSpeakerSelect.value = this.state.ttsSpeakerId;
        }
    }
    bindEvents() {
        this.els.toggleSettingsBtn.onclick = () => this.els.settingsPanel.classList.toggle('hidden');

        // Settings Inputs
        this.els.apiUrlInput.oninput = (e) => this.updateSetting('apiUrl', e.target.value, 'radio_maker_api_url');
        this.els.apiKeyInput.oninput = (e) => this.updateSetting('apiKey', e.target.value, 'radio_maker_api_key');
        this.els.modelIdInput.oninput = (e) => this.updateSetting('modelId', e.target.value, 'radio_maker_model_id');

        this.els.testConnectionBtn.onclick = () => this.handleTestConnection();
        this.els.fetchModelsBtn.onclick = () => this.handleFetchModels();
        this.els.modelSelect.onchange = (e) => {
            if (e.target.value) {
                this.els.modelIdInput.value = e.target.value;
                this.updateSetting('modelId', e.target.value, 'radio_maker_model_id');
            }
        };

        // TTS Settings
        this.els.ttsUrlInput.oninput = (e) => this.updateSetting('ttsUrl', e.target.value, 'radio_maker_tts_url');
        this.els.ttsKeyInput.oninput = (e) => this.updateSetting('ttsKey', e.target.value, 'radio_maker_tts_key');
        this.els.ttsSpeakerSelect.onchange = (e) => this.updateSetting('ttsSpeakerId', e.target.value, 'radio_maker_tts_speaker');
        this.els.fetchTtsSpeakersBtn.onclick = () => this.handleFetchTtsSpeakers();

        // SE Settings
        this.els.searchApiUrlInput.oninput = (e) => this.updateSetting('searchApiUrl', e.target.value, 'radio_maker_search_api_url');

        // Main Actions
        this.els.playAudioBtn.onclick = () => this.handlePlayAudio();
        this.els.downloadAudioBtn.onclick = () => this.handleExportAudio();
        this.els.postDiscordBtn.onclick = () => this.handlePostToDiscord();
        this.els.generateBtn.onclick = () => this.handleGenerateScript();

        // Inputs
        this.els.topicInput.oninput = (e) => {
            this.state.topic = e.target.value;
            this.updatePaperHeader();
        };
        this.els.personalityNameInput.oninput = (e) => {
            this.updateSetting('personalityName', e.target.value, 'radio_maker_personality_name');
            this.updatePaperHeader();
        };
        this.els.referenceInput.oninput = (e) => {
            this.state.referenceText = e.target.value;
            this.updatePaperHeader();
        };

        // Discord & Automation
        this.els.discordWebhookInput.oninput = (e) => this.updateSetting('discordWebhookUrl', e.target.value, 'radio_maker_discord_webhook');
        this.els.syncSettingsBtn.onclick = () => this.handleSyncSettings();
        this.els.testAutomationBtn.onclick = () => this.handleTestAutomation();
        this.els.searchNewsBtn.onclick = async () => {
            const refText = this.els.referenceInput.value.trim();
            const urlRegex = /(https?:\/\/[^\s]+)/;
            const urlMatch = refText.match(urlRegex);

            if (urlMatch) {
                // If URL is present, fetch its content
                const url = urlMatch[1];
                const originalContent = this.els.searchNewsBtn.innerHTML;

                this.els.searchNewsBtn.disabled = true;
                this.els.searchNewsBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-3 h-3 animate-spin"></i> 取得中...';
                lucide.createIcons();

                try {
                    const response = await fetch('/api/fetch-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: url })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.text) {
                            // NEW: Summarize with LLM
                            let summaryText = "";
                            try {
                                this.els.searchNewsBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-3 h-3 animate-spin"></i> 要約中...';
                                lucide.createIcons();

                                const summaryResponse = await fetch(`${this.cleanUrl(this.state.apiUrl)}/chat/completions`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${this.state.apiKey}`
                                    },
                                    body: JSON.stringify({
                                        model: this.state.modelId,
                                        messages: [
                                            {
                                                role: "system",
                                                content: "あなたは優秀なラジオ放送作家です。提供された記事の内容を元に、(1)ラジオの番組のお題（キャッチーなタイトル）と、(2)台本作成に使いやすい3行程度の箇条書きの要約を作成してください。\n\n出力形式は必ず以下のようにしてください：\nお題：(タイトル)\n要約：(内容...)"
                                            },
                                            { role: "user", content: `以下の記事内容を解析してください：\n\n${data.text}` }
                                        ],
                                        temperature: 0.3
                                    })
                                });

                                if (summaryResponse.ok) {
                                    const summaryData = await summaryResponse.json();
                                    const rawResult = summaryData.choices[0]?.message?.content || "";

                                    // Parse result
                                    const topicMatch = rawResult.match(/お題：\s*(.+)/);
                                    const summaryMatch = rawResult.match(/要約：\s*([\s\S]+)/);

                                    if (topicMatch) {
                                        const generatedTopic = topicMatch[1].trim();
                                        this.els.topicInput.value = generatedTopic;
                                        this.state.topic = generatedTopic;
                                    }

                                    if (summaryMatch) {
                                        summaryText = summaryMatch[1].trim();
                                    } else {
                                        summaryText = rawResult; // Fallback
                                    }
                                }
                            } catch (sumErr) {
                                console.error("Summarization failed:", sumErr);
                            }

                            // Append ONLY the summary to the reference input
                            const summaryHeader = summaryText ? `\n\n--- (AIによる概要) ---\n${summaryText}\n` : "";
                            this.els.referenceInput.value = this.els.referenceInput.value + summaryHeader;

                            // Trigger input event to update state and paper header
                            this.els.referenceInput.dispatchEvent(new Event('input'));
                            this.updatePaperHeader();
                        } else {
                            alert("記事内容の抽出に失敗しました。");
                        }
                    } else {
                        const errorData = await response.json();
                        alert(`エラー: ${errorData.error || '内容の取得に失敗しました。'}`);
                    }
                } catch (err) {
                    console.error(err);
                    alert("通信エラーが発生しました。");
                } finally {
                    this.els.searchNewsBtn.disabled = false;
                    this.els.searchNewsBtn.innerHTML = originalContent;
                    lucide.createIcons();
                }
            } else {
                // Otherwise, perform the usual Google News search
                const query = this.els.topicInput.value || 'ITニュース';
                window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=nws`, '_blank');
            }
        };

        // Custom Persona
        this.els.customIconPreview.onclick = () => this.els.iconFileInput.click();
        this.els.iconFileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    this.state.customPersona.iconUrl = reader.result;
                    this.els.customIconPreview.innerHTML = `<img src="${reader.result}" class="w-full h-full object-cover">`;
                    this.renderPersonaList();
                    this.updatePaperHeader();
                };
                reader.readAsDataURL(file);
            }
        };
        this.els.customNameInput.oninput = (e) => {
            this.state.customPersona.name = e.target.value;
            this.renderPersonaList();
            this.updatePaperHeader();
        };
        this.els.customPromptInput.oninput = (e) => {
            this.state.customPersona.systemPrompt = e.target.value;
        };

        // Copy
        this.els.copyBtn.onclick = () => this.handleCopyScript();
    }

    updateSetting(key, value, storageKey) {
        this.state[key] = value;
        if (storageKey) localStorage.setItem(storageKey, value);
    }

    loadSettings() {
        const keys = [
            { s: 'radio_maker_api_url', k: 'apiUrl' },
            { s: 'radio_maker_api_key', k: 'apiKey' },
            { s: 'radio_maker_model_id', k: 'modelId' },
            { s: 'radio_maker_tts_url', k: 'ttsUrl' },
            { s: 'radio_maker_tts_key', k: 'ttsKey' },
            { s: 'radio_maker_tts_speaker', k: 'ttsSpeakerId' },
            { s: 'radio_maker_search_api_url', k: 'searchApiUrl' },
            { s: 'radio_maker_discord_webhook', k: 'discordWebhookUrl' },
            { s: 'radio_maker_personality_name', k: 'personalityName' }
        ];
        keys.forEach(({ s, k }) => {
            const val = localStorage.getItem(s);
            if (val) this.state[k] = val;
        });
    }

    updateInputsFromState() {
        this.els.apiUrlInput.value = this.state.apiUrl;
        this.els.apiKeyInput.value = this.state.apiKey;
        this.els.modelIdInput.value = this.state.modelId;
        this.els.personalityNameInput.value = this.state.personalityName;
        this.els.customNameInput.value = this.state.customPersona.name;
        this.els.customPromptInput.value = this.state.customPersona.systemPrompt;
        this.els.ttsUrlInput.value = this.state.ttsUrl;
        this.els.ttsKeyInput.value = this.state.ttsKey;
        this.els.ttsSpeakerSelect.value = this.state.ttsSpeakerId;
        this.els.searchApiUrlInput.value = this.state.searchApiUrl;
        this.els.discordWebhookInput.value = this.state.discordWebhookUrl;
        this.els.personalityNameInput.value = this.state.personalityName;
    }

    renderPersonaList() {
        this.els.personaList.innerHTML = '';

        // Presets
        PRESET_PERSONAS.forEach(persona => {
            const btn = document.createElement('button');
            const isSelected = this.state.selectedPersonaId === persona.id;

            btn.className = `w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-start gap-3 ${isSelected
                ? 'bg-purple-900/30 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`;
            btn.onclick = () => this.selectPersona(persona.id);

            btn.innerHTML = `
                <div class="mt-1 flex-shrink-0">
                    <i data-lucide="${persona.icon}" class="w-5 h-5 ${persona.color}"></i>
                </div>
                <div>
                    <div class="font-medium text-sm ${isSelected ? 'text-purple-300' : 'text-slate-300'}">
                        ${persona.name}
                    </div>
                    <div class="text-xs text-slate-500 leading-snug mt-1">
                        ${persona.description}
                    </div>
                </div>
            `;
            this.els.personaList.appendChild(btn);
        });

        // Custom Button
        const customBtn = document.createElement('button');
        const isCustomSelected = this.state.selectedPersonaId === 'custom';
        customBtn.className = `w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-start gap-3 ${isCustomSelected
            ? 'bg-purple-900/30 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
            : 'bg-slate-800 border-dashed border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
            }`;
        customBtn.onclick = () => this.selectPersona('custom');

        let iconHtml = '';
        if (this.state.customPersona.iconUrl) {
            iconHtml = `<img src="${this.state.customPersona.iconUrl}" class="w-5 h-5 rounded-full object-cover">`;
        } else {
            iconHtml = `<i data-lucide="plus" class="w-5 h-5 ${isCustomSelected ? 'text-purple-400' : 'text-slate-400'}"></i>`;
        }

        customBtn.innerHTML = `
            <div class="mt-1 flex-shrink-0">${iconHtml}</div>
            <div class="flex-grow">
                <div class="font-medium text-sm ${isCustomSelected ? 'text-purple-300' : 'text-slate-300'}">
                    ${this.state.customPersona.name}
                </div>
                <div class="text-xs text-slate-500 leading-snug mt-1">
                    クリックして設定を編集
                </div>
            </div>
        `;
        this.els.personaList.appendChild(customBtn);
        lucide.createIcons();
    }

    selectPersona(id) {
        this.state.selectedPersonaId = id;
        this.renderPersonaList();

        if (id === 'custom') {
            this.els.customPersonaEditor.classList.remove('hidden');
        } else {
            this.els.customPersonaEditor.classList.add('hidden');
        }
        this.updatePaperHeader();
    }

    getCurrentPersona() {
        if (this.state.selectedPersonaId === 'custom') {
            return this.state.customPersona;
        }
        return PRESET_PERSONAS.find(p => p.id === this.state.selectedPersonaId) || PRESET_PERSONAS[0];
    }

    updatePaperHeader() {
        const persona = this.getCurrentPersona();
        this.els.paperPersonaName.textContent = this.state.personalityName || persona.name;

        const topicText = this.els.topicInput.value.trim();
        const refText = this.els.referenceInput.value.trim();
        this.els.paperTopic.textContent = `Topic: ${topicText || 'フリートーク'} ${refText ? '(+参考資料)' : ''}`;

        this.els.paperIconContainer.innerHTML = '';
        if (persona.type === 'custom' && persona.iconUrl) {
            const img = document.createElement('img');
            img.src = persona.iconUrl;
            img.className = 'w-full h-full object-cover';
            this.els.paperIconContainer.appendChild(img);
        } else if (persona.type === 'custom') {
            const i = document.createElement('i');
            i.setAttribute('data-lucide', 'user');
            i.className = 'w-8 h-8 text-slate-400';
            this.els.paperIconContainer.appendChild(i);
        } else {
            const i = document.createElement('i');
            i.setAttribute('data-lucide', persona.icon);
            i.className = `w-8 h-8 ${persona.color.replace('w-5 h-5', '')}`;
            if (persona.id === 'morning_dj') i.className = 'w-8 h-8 text-orange-400';
            if (persona.id === 'late_night') i.className = 'w-8 h-8 text-indigo-400';
            if (persona.id === 'tech_news') i.className = 'w-8 h-8 text-cyan-400';

            const div = document.createElement('div');
            div.className = 'scale-150 flex items-center justify-center';
            div.appendChild(i);
            this.els.paperIconContainer.appendChild(div);
        }
        lucide.createIcons();
    }

    cleanUrl(url) {
        return url.replace(/\/+$/, '');
    }

    async handleTestConnection() {
        this.state.apiUrl = this.els.apiUrlInput.value;

        this.els.testConnectionBtn.disabled = true;
        this.els.testConnectionBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4 animate-spin"></i>';
        lucide.createIcons();
        this.els.connectionStatusMsg.className = 'text-[10px] text-slate-500 mt-1';
        this.els.connectionStatusMsg.textContent = '接続中...';

        try {
            const baseUrl = this.cleanUrl(this.state.apiUrl);
            const response = await fetch(`${baseUrl}/models`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${this.state.apiKey}` }
            });

            if (response.ok) {
                this.els.testConnectionBtn.className = "px-3 py-2 rounded text-xs font-semibold border bg-green-900/30 border-green-700 text-green-400 transition-all";
                this.els.connectionStatusMsg.className = "text-[10px] text-green-400 mt-1 flex items-center gap-1";
                this.els.connectionStatusMsg.innerHTML = '<i data-lucide="check-circle" class="w-3 h-3"></i> 接続成功';

                const data = await response.json();
                if (Array.isArray(data.data)) {
                    this.updateModelSelect(data.data);
                }
            } else {
                throw new Error(`${response.status} ${response.statusText}`);
            }
        } catch (err) {
            this.els.testConnectionBtn.className = "px-3 py-2 rounded text-xs font-semibold border bg-red-900/30 border-red-700 text-red-400 transition-all";
            this.els.connectionStatusMsg.className = "text-[10px] text-red-400 mt-1 flex items-center gap-1";
            this.els.connectionStatusMsg.innerHTML = `<i data-lucide="alert-circle" class="w-3 h-3"></i> 失敗: ${err.message}`;

            if (window.location.protocol === 'file:' && err.message.includes('Failed to fetch')) {
                alert('注意: HTMLファイルを直接開いているため、CORSエラーが発生している可能性があります。VS CodeのLive Serverなどを使ってWebサーバー経由で開いてください。');
            }
        } finally {
            this.els.testConnectionBtn.disabled = false;
            if (!this.els.testConnectionBtn.innerHTML.includes('wifi')) {
                this.els.testConnectionBtn.innerHTML = '<i data-lucide="wifi" class="w-4 h-4"></i>';
            }
            lucide.createIcons();
        }
    }

    async handleFetchModels() {
        this.state.apiUrl = this.els.apiUrlInput.value;
        this.els.fetchModelsBtn.disabled = true;
        const originalText = this.els.fetchModelsBtn.innerHTML;
        this.els.fetchModelsBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-3 h-3 animate-spin"></i> 取得中...';
        lucide.createIcons();
        this.els.modelFetchErrorMsg.textContent = '';
        this.els.modelFetchErrorMsg.className = 'text-xs text-slate-500 mt-1';

        try {
            const baseUrl = this.cleanUrl(this.state.apiUrl);
            const response = await fetch(`${baseUrl}/models`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${this.state.apiKey}` }
            });

            if (!response.ok) throw new Error(response.statusText);

            const data = await response.json();
            if (Array.isArray(data.data)) {
                this.updateModelSelect(data.data);
            }
            this.els.modelFetchErrorMsg.textContent = '取得成功: リストを更新しました';
            this.els.modelFetchErrorMsg.className = 'text-xs text-green-400 mt-1';
        } catch (err) {
            console.error(err);
            this.els.modelFetchErrorMsg.innerHTML = `<span class="flex items-center gap-1"><i data-lucide="alert-circle" class="w-3 h-3"></i> 接続エラー: ${err.message}。CORS設定等を確認してください。</span>`;
            this.els.modelFetchErrorMsg.className = 'text-xs text-red-400 mt-1';
            lucide.createIcons();

            if (window.location.protocol === 'file:' && err.message.includes('Failed to fetch')) {
                alert('注意: CORSエラーの可能性があります。Webサーバー経由で開いてください。');
            }
        } finally {
            this.els.fetchModelsBtn.disabled = false;
            this.els.fetchModelsBtn.innerHTML = originalText;
            lucide.createIcons();
        }
    }

    updateModelSelect(models) {
        this.els.modelSelect.innerHTML = '<option value="">Select...</option>';
        models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.id;
            this.els.modelSelect.appendChild(opt);
        });
        if (models.length > 0) {
            this.els.modelSelectContainer.classList.remove('hidden');
        }
    }

    async handleFetchTtsSpeakers() {
        this.state.ttsUrl = this.els.ttsUrlInput.value;
        this.els.fetchTtsSpeakersBtn.disabled = true;
        const originalText = this.els.fetchTtsSpeakersBtn.innerHTML;
        this.els.fetchTtsSpeakersBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-3 h-3 animate-spin"></i> 取得中...';
        lucide.createIcons();
        this.els.ttsSpeakerFetchErrorMsg.textContent = '';
        this.els.ttsSpeakerFetchErrorMsg.className = 'text-[10px] text-slate-500 mt-1';

        try {
            if (!this.state.ttsUrl) throw new Error("URL未設定");
            const baseUrl = this.cleanUrl(this.state.ttsUrl);
            const endpoint = `${baseUrl}/api/speakers`;

            const headers = {};
            if (this.state.ttsKey) headers['X-API-KEY'] = this.state.ttsKey;

            const response = await fetch(endpoint, { method: 'GET', headers });

            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

            const speakers = await response.json();
            this.updateSpeakerSelect(speakers);

            this.els.ttsSpeakerFetchErrorMsg.textContent = 'リストを更新しました';
            this.els.ttsSpeakerFetchErrorMsg.className = 'text-[10px] text-green-400 mt-1';

        } catch (err) {
            console.error(err);
            let msg = err.message;
            if (window.location.protocol === 'file:' && msg.includes('Failed to fetch')) {
                msg += ' (CORSエラーの可能性)';
            }
            this.els.ttsSpeakerFetchErrorMsg.textContent = `エラー: ${msg}`;
            this.els.ttsSpeakerFetchErrorMsg.className = 'text-[10px] text-red-400 mt-1';
        } finally {
            this.els.fetchTtsSpeakersBtn.disabled = false;
            this.els.fetchTtsSpeakersBtn.innerHTML = originalText;
            lucide.createIcons();
        }
    }

    updateSpeakerSelect(speakers) {
        this.els.ttsSpeakerSelect.innerHTML = '';
        speakers.forEach(char => {
            char.styles.forEach(style => {
                const opt = document.createElement('option');
                opt.value = style.id;
                opt.textContent = `${char.name} (${style.name}) [ID:${style.id}]`;
                this.els.ttsSpeakerSelect.appendChild(opt);
            });
        });

        if (this.state.ttsSpeakerId) {
            this.els.ttsSpeakerSelect.value = this.state.ttsSpeakerId;
        }
        if (!this.els.ttsSpeakerSelect.value && this.els.ttsSpeakerSelect.options.length > 0) {
            this.state.ttsSpeakerId = this.els.ttsSpeakerSelect.options[0].value;
            localStorage.setItem('radio_maker_tts_speaker', this.state.ttsSpeakerId);
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async createAudioBlob(text, isExport = false) {
        if (!this.state.ttsUrl) throw new Error("TTS Endpoint URL is missing");

        const baseUrl = this.cleanUrl(this.state.ttsUrl);
        const headers = { 'Content-Type': 'application/json' };
        if (this.state.ttsKey) headers['X-API-KEY'] = this.state.ttsKey;

        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // 1. Job Creation
                const jobEndpoint = `${baseUrl}/api/tasks/synthesis`;
                const body = JSON.stringify({
                    text: text,
                    speaker: Number(this.state.ttsSpeakerId),
                    format: 'mp3'
                });

                const jobResponse = await fetch(jobEndpoint, { method: 'POST', headers, body });
                if (!jobResponse.ok) {
                    throw new Error(`Job Creation Failed ${jobResponse.status}: ${jobResponse.statusText}`);
                }

                const jobData = await jobResponse.json();
                const jobId = jobData.job_id;
                if (!jobId) throw new Error("Failed to retrieve Job ID");

                // 2. Poll Status
                const statusEndpoint = `${baseUrl}/api/tasks/${jobId}/status`;
                let isComplete = false;
                let pollRetryCount = 0;
                const maxPollRetries = 100;

                while (!isComplete && pollRetryCount < maxPollRetries) {
                    if (!isExport && !this.state.isPlaying) throw new Error("Playback stopped");

                    await this.wait(3000);

                    const statusResponse = await fetch(statusEndpoint, { method: 'GET', headers });
                    if (!statusResponse.ok) {
                        console.warn(`Status check failed: ${statusResponse.status}`);
                        pollRetryCount++;
                        continue;
                    }

                    const statusData = await statusResponse.json();
                    const currentStatus = (statusData.status || '').toUpperCase();

                    if (['COMPLETED', 'DONE', 'SUCCESS', 'FINISHED'].includes(currentStatus)) {
                        isComplete = true;
                    } else if (['FAILED', 'ERROR'].includes(currentStatus)) {
                        throw new Error(`Synthesis Job Failed: ${statusData.error || 'Unknown error'}`);
                    }
                    pollRetryCount++;
                }

                if (!isComplete) throw new Error("Synthesis timed out");

                // 3. Download Audio
                const resultEndpoint = `${baseUrl}/api/tasks/${jobId}/result`;
                const audioResponse = await fetch(resultEndpoint, { method: 'GET', headers });
                if (!audioResponse.ok) throw new Error(`Audio Download Error ${audioResponse.status}`);

                const blob = await audioResponse.blob();
                const blobUrl = URL.createObjectURL(blob);

                return { blobUrl, text };

            } catch (err) {
                console.warn(`Synthesis attempt ${attempt} failed:`, err);
                if (attempt === maxAttempts) {
                    throw err; // Final attempt failed
                }
                // Check if error is a connection error or synthesis failure that might be transient
                const errorMsg = err.message || "";
                if (errorMsg.includes("Failed to fetch") || errorMsg.includes("Synthesis Job Failed") || errorMsg.includes("Job Creation Failed")) {
                    console.log(`Retrying in 2 seconds...`);
                    await this.wait(2000);
                } else {
                    throw err; // Other errors (like "Playback stopped") shouldn't be retried
                }
            }
        }
    }

    async fetchSoundEffect(query) {
        if (!this.state.searchApiUrl) return null;

        try {
            const baseUrl = this.cleanUrl(this.state.searchApiUrl);
            const response = await fetch(`${baseUrl}/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) return null;

            const data = await response.json();
            if (data.results && data.results.length > 0) {
                let url = data.results[0].playback_url;
                // Prepend base URL if it's a relative path
                if (url && !url.startsWith('http')) {
                    const base = baseUrl.replace(/\/$/, ""); // Remove trailing slash
                    url = base + (url.startsWith('/') ? '' : '/') + url;
                }
                console.log(`[SE] Found URL for "${query}":`, url);
                return url;
            }
            console.warn(`[SE] No results found for "${query}"`);
        } catch (err) {
            console.error("[SE] Search API Error:", err);
        }
        return null;
    }

    playAudioFromBlob(blobUrl, isSE = false) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(blobUrl);
            if (!isSE) {
                this.state.audioElement = audio;
            }
            this.state.activeAudios.push(audio);

            let fadeTimer = null;
            let limitTimer = null;

            const cleanup = () => {
                if (fadeTimer) clearInterval(fadeTimer);
                if (limitTimer) clearTimeout(limitTimer);
                this.state.activeAudios = this.state.activeAudios.filter(a => a !== audio);
                if (blobUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(blobUrl);
                }
                if (!isSE && this.state.audioElement === audio) {
                    this.state.audioElement = null;
                }
            };

            audio.onended = () => {
                cleanup();
                console.log(`[Audio] Playback ended: ${blobUrl}`);
                resolve();
            };

            audio.onerror = (e) => {
                cleanup();
                console.error("[Audio] Playback Error", e, blobUrl);
                reject(new Error("Playback failed."));
            };

            audio.play().then(() => {
                if (isSE) {
                    const maxDuration = 8000; // 8 seconds
                    const fadeDuration = 2000; // 2 seconds fade out

                    // Start fade out before the end
                    limitTimer = setTimeout(() => {
                        this.startFadeOut(audio, fadeDuration, () => {
                            audio.pause();
                            audio.onended();
                        });
                    }, maxDuration - fadeDuration);
                }
            }).catch(err => {
                cleanup();
                reject(err);
            });
        });
    }

    startFadeOut(audio, duration, callback) {
        const step = 50; // ms
        const iterations = duration / step;
        const volStep = audio.volume / iterations;

        const fadeTimer = setInterval(() => {
            if (audio.volume > volStep) {
                audio.volume -= volStep;
            } else {
                audio.volume = 0;
                clearInterval(fadeTimer);
                if (callback) callback();
            }
        }, step);

        return fadeTimer;
    }

    cleanTextForTTS(rawText) {
        let ttsText = rawText.replace(/^.+?:/gm, ''); // Remove Name:
        ttsText = ttsText.replace(/（[\s\S]*?）/g, ''); // Remove full-width parens
        ttsText = ttsText.replace(/\([\s\S]*?\)/g, ''); // Remove half-width parens
        ttsText = ttsText.replace(/【[\s\S]*?】/g, ''); // Remove thick brackets
        return ttsText.trim();
    }

    async handlePlayAudio() {
        // STOP logic
        if (this.state.isPlaying) {
            this.state.isPlaying = false;
            // Stop all active audio elements
            this.state.activeAudios.forEach(audio => {
                audio.pause();
                // Logic to trigger cleanup might be needed if playAudioFromBlob isn't handling it on pause
                // But generally pause is safe. Let's force cleanup if needed.
            });
            this.state.activeAudios = [];
            this.state.audioElement = null;

            this.els.playAudioBtn.innerHTML = `<i data-lucide="volume-2" class="w-5 h-5"></i> 音声を再生 (Voicevox)`;
            this.els.audioStatus.textContent = "再生を停止しました";
            this.els.audioStatus.className = "text-center text-xs text-slate-400 mt-2 h-4";
            lucide.createIcons();
            return;
        }

        // START logic
        if (!this.state.script) return;
        if (!this.state.ttsUrl) {
            this.els.audioStatus.textContent = "Error: TTS Endpoint URL is missing. Please check settings.";
            this.els.audioStatus.className = "text-center text-xs text-red-400 mt-2 h-4";
            return;
        }

        this.state.isPlaying = true;
        const originalBtnContent = `<i data-lucide="volume-2" class="w-5 h-5"></i> 音声を再生 (Voicevox)`;
        this.els.playAudioBtn.innerHTML = `<i data-lucide="square" class="w-5 h-5 fill-current"></i> 停止`;
        lucide.createIcons();

        // Parse script into parts (Speech or SE)
        const lines = this.state.script.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const playItems = [];
        const seRegex = /([（\(]効果音[:：]\s*.*?[）\)])/g;

        for (const line of lines) {
            // Split the line by SE tags, keeping the tags in the result
            const segments = line.split(seRegex).filter(s => s.trim().length > 0);

            for (const segment of segments) {
                const seMatch = segment.match(/[（\(]効果音[:：]\s*(.*?)[）\)]/);
                if (seMatch) {
                    playItems.push({ type: 'se', query: seMatch[1], raw: segment });
                } else {
                    const cleaned = this.cleanTextForTTS(segment);
                    if (cleaned) {
                        playItems.push({ type: 'speech', text: cleaned, raw: segment });
                    }
                }
            }
        }

        if (playItems.length === 0) {
            this.els.audioStatus.textContent = "再生可能なセリフがありません";
            this.els.audioStatus.className = "text-center text-xs text-red-400 mt-2 h-4";
            this.state.isPlaying = false;
            this.els.playAudioBtn.innerHTML = originalBtnContent;
            lucide.createIcons();
            return;
        }

        try {
            // Helper to prepare next item
            const prepareItem = async (index) => {
                if (index >= playItems.length) return null;
                const item = playItems[index];
                if (item.type === 'speech') {
                    return await this.createAudioBlob(item.text);
                } else {
                    const url = await this.fetchSoundEffect(item.query);
                    return url ? { blobUrl: url, isDirectUrl: true, text: `効果音: ${item.query}` } : null;
                }
            };

            let nextItemPromise = prepareItem(0);

            for (let i = 0; i < playItems.length; i++) {
                if (!this.state.isPlaying) break;

                this.els.audioStatus.textContent = `準備中 (${i + 1}/${playItems.length})...`;
                this.els.audioStatus.className = "text-center text-xs text-slate-400 mt-2 h-4 animate-pulse";

                const result = await nextItemPromise;

                // Start preparing next
                if (i + 1 < playItems.length) {
                    nextItemPromise = prepareItem(i + 1);
                } else {
                    nextItemPromise = null;
                }

                if (!this.state.isPlaying) break;
                if (!result) {
                    const errorMsg = `Skip: ${playItems[i].type === 'se' ? 'SE' : '音声'}の準備に失敗しました`;
                    console.warn(errorMsg, playItems[i]);
                    this.els.audioStatus.textContent = errorMsg;
                    this.els.audioStatus.className = "text-center text-xs text-orange-400 mt-2 h-4";
                    await this.wait(1500); // Give user time to see the skip message
                    continue;
                }

                const displayNum = i + 1;
                const totalNum = playItems.length;
                const shortText = result.text.substring(0, 15) + (result.text.length > 15 ? '...' : '');

                if (playItems[i].type === 'se') {
                    // MIXER ROLE: Parallel playback
                    console.log(`[Mixer] Triggering SE: ${playItems[i].query}`);
                    this.els.audioStatus.textContent = `[Mixer] 効果音再生中: ${playItems[i].query}`;
                    this.els.audioStatus.className = "text-center text-xs text-yellow-500 mt-2 h-4";
                    // Don't await SE, just start it
                    this.playAudioFromBlob(result.blobUrl, true).catch(err => {
                        console.error("[Mixer] SE Playback failed:", err);
                    });
                    // Small delay to allow SE to start before next line (optional)
                    await this.wait(200);
                } else {
                    // PERSONALITY ROLE: Synchronous playback
                    this.els.audioStatus.textContent = `[DJ] 再生中 (${displayNum}/${totalNum}): ${shortText}`;
                    this.els.audioStatus.className = "text-center text-xs text-cyan-500 mt-2 h-4";
                    await this.playAudioFromBlob(result.blobUrl, false);
                }

                if (this.state.isPlaying && i < playItems.length - 1) {
                    await this.wait(300);
                }
            }

            if (this.state.isPlaying) {
                this.els.audioStatus.textContent = "再生完了";
                this.els.audioStatus.className = "text-center text-xs text-green-400 mt-2 h-4";
            }

        } catch (err) {
            console.error(err);
            let msg = err.message || 'エラーが発生しました。';
            if (this.state.isPlaying) {
                this.els.audioStatus.textContent = `Error: ${msg}`;
                this.els.audioStatus.className = "text-center text-xs text-red-400 mt-2 h-4";
            }
        } finally {
            this.state.isPlaying = false;
            this.state.audioElement = null;
            this.els.playAudioBtn.innerHTML = originalBtnContent;
            lucide.createIcons();
        }
    }

    async handleGenerateScript() {
        const topic = this.els.topicInput.value.trim();
        const refText = this.els.referenceInput.value.trim();

        if (!topic && !refText) {
            this.showError('テーマまたは参考資料を入力してください。');
            return;
        }

        this.hideError();
        this.state.isLoading = true;
        this.updateGenerateBtnState();

        this.els.emptyState.classList.add('hidden');
        this.els.scriptContent.classList.add('hidden');
        this.els.scriptContent.textContent = '';
        this.els.scriptActions.classList.add('hidden');
        this.els.bottomActions.classList.add('hidden');
        this.els.loadingState.classList.remove('hidden');

        try {
            this.state.apiUrl = this.els.apiUrlInput.value;
            this.state.apiKey = this.els.apiKeyInput.value;
            this.state.modelId = this.els.modelIdInput.value;

            const persona = this.getCurrentPersona();
            const nameToUse = this.state.personalityName || persona.name;

            // Search for URLs in reference text
            let fetchedUrlContent = '';
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = refText.match(urlRegex);

            if (urls && urls.length > 0) {
                this.els.audioStatus.textContent = `URLを読み込み中...`;
                this.els.audioStatus.className = "text-center text-xs text-yellow-400 mt-2 h-4 animate-pulse";

                try {
                    const fetchResponse = await fetch('/api/fetch-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: urls[0] }) // Fetch first URL if multiple
                    });
                    if (fetchResponse.ok) {
                        const fetchData = await fetchResponse.json();
                        if (fetchData.text) {
                            fetchedUrlContent = fetchData.text;
                        }
                    }
                } catch (urlErr) {
                    console.error("Failed to fetch URL content:", urlErr);
                }
            }

            // プリセットに含まれる特定の名前を置換するためのマップ
            const replacementMap = {
                'morning_dj': 'サニー',
                'late_night': 'ルナ',
                'tech_news': 'ギーク先生'
            };

            let basePrompt = persona.systemPrompt;
            const originalName = replacementMap[persona.id];
            if (originalName) {
                // 全ての出現箇所を置換（RegExpを使用してグローバル置換）
                basePrompt = basePrompt.replace(new RegExp(originalName, 'g'), nameToUse);
            }

            const systemPromptWithCustomName = `あなたの名前は「${nameToUse}」です。役名も「${nameToUse}: 」として出力してください。\n\n${basePrompt}`;

            let userContent = `今回のラジオのテーマは「${topic}」です。`;
            if (refText || fetchedUrlContent) {
                userContent += `\n\n以下の【参考資料/ニュース記事】の内容を元に、リスナーに分かりやすく紹介・解説する形で台本を作成してください。\n\n【参考資料/ニュース記事】\n${refText}${fetchedUrlContent ? '\n\n（URLから取得した内容）:\n' + fetchedUrlContent : ''}`;
            } else {
                userContent += `\nこのテーマで面白いラジオの台本を作ってください。`;
            }
            userContent += `\n\n尺は3分程度を想定しています。`;
            userContent += `\n\n【重要：音声合成用フォーマット厳守】\n1. 読み間違いを防ぐため、難解な漢字や特殊な記号・絵文字は使わず、平易な日本語で書いてください。\n2. 役名は必ず「名前: 」の形式で書いてください。\n3. ト書き（効果音、動作、感情表現など）は必ず丸括弧（ ）で囲んでください。これらは音声合成時に自動的に除外されます。\n4. 「了解しました」等のAIとしての返答は不要です。`;

            const baseUrl = this.cleanUrl(this.state.apiUrl);
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.state.apiKey}`
                },
                body: JSON.stringify({
                    model: this.state.modelId,
                    messages: [
                        { role: "system", content: systemPromptWithCustomName },
                        { role: "user", content: userContent }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}. LM Studioのサーバーは起動していますか？CORSはONですか？`);
            }

            const data = await response.json();
            let content = data.choices[0]?.message?.content || "生成されたテキストが空でした。";

            if (this.els.ttsSpeakerSelect.selectedIndex >= 0) {
                const speakerText = this.els.ttsSpeakerSelect.options[this.els.ttsSpeakerSelect.selectedIndex].text;
                const nameOnly = speakerText.split(' (')[0];
                content += `\n\nVOICEVOX: ${nameOnly}`;
            }
            content += `\nMODEL: ${this.state.modelId}`;

            this.state.script = content;
            this.els.scriptContent.textContent = content;
            this.els.scriptContent.classList.remove('hidden');
            this.els.scriptActions.classList.remove('hidden');

            this.els.bottomActions.classList.remove('hidden');
            this.els.audioStatus.textContent = "";

        } catch (err) {
            console.error(err);
            let msg = err.message || '台本の生成中にエラーが発生しました。';
            if (window.location.protocol === 'file:' && msg.includes('Failed to fetch')) {
                msg += ' (CORSエラーの可能性があります。HTMLファイルを直接開かず、Webサーバー経由で開いてください)';
            }
            this.showError(msg);
        } finally {
            this.state.isLoading = false;
            this.els.loadingState.classList.add('hidden');
            this.updateGenerateBtnState();
        }
    }

    updateGenerateBtnState() {
        if (this.state.isLoading) {
            this.els.generateBtn.disabled = true;
            this.els.generateBtn.classList.add('bg-slate-700', 'cursor-not-allowed');
            this.els.generateBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-5 h-5 animate-spin"></i> 生成中...';
        } else {
            this.els.generateBtn.disabled = false;
            this.els.generateBtn.classList.remove('bg-slate-700', 'cursor-not-allowed');
            this.els.generateBtn.innerHTML = '<i data-lucide="play" class="w-5 h-5 fill-current"></i> 台本を生成';
        }
        lucide.createIcons();
    }

    showError(msg) {
        this.els.errorText.textContent = msg;
        this.els.errorArea.classList.remove('hidden');
    }

    hideError() {
        this.els.errorArea.classList.add('hidden');
    }

    async handleExportAudio() {
        if (!this.state.script) return;
        this.els.downloadAudioBtn.disabled = true;
        const originalText = this.els.downloadAudioBtn.innerHTML;
        this.els.downloadAudioBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4 animate-spin"></i> 書き出し準備中...';
        lucide.createIcons();

        this.els.audioStatus.textContent = "書き出しの準備をしています...";
        this.els.audioStatus.className = "text-center text-xs text-purple-400 mt-2 h-4";

        try {
            const exportItems = await this.getAudioExportItems();
            if (!exportItems || exportItems.length === 0) throw new Error("書き出し対象の音声がありません");

            this.els.audioStatus.textContent = "ファイルをミックスしてエンコード中...";
            const wavBlob = await this.renderToWavBlob(exportItems);

            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `radio_show_${new Date().getTime()}.wav`;
            a.click();
            URL.revokeObjectURL(url);

            this.els.audioStatus.textContent = "書き出し完了";
            this.els.audioStatus.className = "text-center text-xs text-green-500 mt-2 h-4";
        } catch (error) {
            console.error("Export Error:", error);
            this.els.audioStatus.textContent = `書き出し失敗: ${error.message}`;
            this.els.audioStatus.className = "text-center text-xs text-red-400 mt-2 h-4";
        } finally {
            this.els.downloadAudioBtn.disabled = false;
            this.els.downloadAudioBtn.innerHTML = originalText;
            lucide.createIcons();
        }
    }

    async handlePostToDiscord() {
        if (!this.state.script) return;
        if (!this.state.discordWebhookUrl) {
            alert("Discord Webhook URLが設定されていません。設定パネルから入力してください。");
            this.els.settingsPanel.classList.remove('hidden');
            return;
        }

        this.els.postDiscordBtn.disabled = true;
        const originalText = this.els.postDiscordBtn.innerHTML;
        this.els.postDiscordBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4 animate-spin"></i> 投稿準備中...';
        lucide.createIcons();

        this.els.audioStatus.textContent = "Discord投稿用に音声を生成中...";
        this.els.audioStatus.className = "text-center text-xs text-indigo-400 mt-2 h-4";

        try {
            const exportItems = await this.getAudioExportItems();
            if (!exportItems || exportItems.length === 0) throw new Error("投稿対象の音声がありません");

            this.els.audioStatus.textContent = "音声をミックス中...";
            const wavBlob = await this.renderToWavBlob(exportItems);

            this.els.audioStatus.textContent = "Discordに投稿中...";

            const formData = new FormData();
            formData.append('file', wavBlob, `radio_show_${new Date().getTime()}.wav`);

            // Build message content
            const persona = this.getCurrentPersona();
            const topic = this.state.topic || 'フリートーク';
            const speakerName = this.els.ttsSpeakerSelect.selectedIndex >= 0 ? this.els.ttsSpeakerSelect.options[this.els.ttsSpeakerSelect.selectedIndex].text.split(' (')[0] : 'Unknown';

            let content = `🎙️ **AI Radio Maker - ON AIR**\n`;
            content += `**Theme:** ${topic}\n`;
            content += `**Personality:** ${this.state.personalityName || persona.name}\n`;
            content += `**VOICEVOX:** ${speakerName}\n`;
            content += `**Model:** \`${this.state.modelId}\`\n`;
            content += `\n---\n`;

            formData.append('payload_json', JSON.stringify({
                content: content
            }));

            const response = await fetch(this.state.discordWebhookUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Discord API Error: ${response.status}`);
            }

            this.els.audioStatus.textContent = "Discordに投稿完了！";
            this.els.audioStatus.className = "text-center text-xs text-green-500 mt-2 h-4";
        } catch (error) {
            console.error("Discord Post Error:", error);
            this.els.audioStatus.textContent = `Discord投稿失敗: ${error.message}`;
            this.els.audioStatus.className = "text-center text-xs text-red-400 mt-2 h-4";
        } finally {
            this.els.postDiscordBtn.disabled = false;
            this.els.postDiscordBtn.innerHTML = originalText;
            lucide.createIcons();
        }
    }

    async getAudioExportItems() {
        const lines = this.state.script.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const playItems = [];
        const seRegex = /([（\(]効果音[:：]\s*.*?[）\)])/g;

        for (const line of lines) {
            const segments = line.split(seRegex).filter(s => s.trim().length > 0);
            for (const segment of segments) {
                const seMatch = segment.match(/[（\(]効果音[:：]\s*(.*?)[）\)]/);
                if (seMatch) {
                    playItems.push({ type: 'se', query: seMatch[1] });
                } else {
                    const cleaned = this.cleanTextForTTS(segment);
                    if (cleaned) {
                        playItems.push({ type: 'speech', text: cleaned });
                    }
                }
            }
        }

        const exportItems = [];
        let personalityTime = 0;
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        for (let i = 0; i < playItems.length; i++) {
            const item = playItems[i];
            this.els.audioStatus.textContent = `音声を生成中 (${i + 1}/${playItems.length})...`;

            let blobResult = null;
            if (item.type === 'speech') {
                blobResult = await this.createAudioBlob(item.text, true);
            } else {
                const url = await this.fetchSoundEffect(item.query);
                if (url) {
                    const resp = await fetch(url);
                    if (resp.ok) {
                        const blob = await resp.blob();
                        blobResult = { blobUrl: URL.createObjectURL(blob) };
                    }
                }
            }

            if (blobResult) {
                const arrayBuffer = await fetch(blobResult.blobUrl).then(r => r.arrayBuffer());
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

                let startTime = personalityTime;
                let duration = audioBuffer.duration;

                if (item.type === 'se' && duration > 8) {
                    duration = 8;
                }

                exportItems.push({
                    buffer: audioBuffer,
                    startTime: startTime,
                    duration: duration,
                    isSE: item.type === 'se'
                });

                if (item.type !== 'se') {
                    personalityTime += duration + 0.3;
                }

                if (blobResult.blobUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(blobResult.blobUrl);
                }
            }
        }
        return exportItems;
    }

    async renderToWavBlob(items) {
        const sampleRate = 24000;
        const totalDuration = Math.max(...items.map(it => it.startTime + it.duration));
        const offlineCtx = new OfflineAudioContext(1, Math.ceil(sampleRate * totalDuration), sampleRate);

        for (const item of items) {
            const source = offlineCtx.createBufferSource();
            source.buffer = item.buffer;

            if (item.isSE && item.buffer.duration > 8) {
                const gain = offlineCtx.createGain();
                gain.gain.setValueAtTime(1, item.startTime + 6);
                gain.gain.linearRampToValueAtTime(0, item.startTime + 8);
                source.connect(gain);
                gain.connect(offlineCtx.destination);
                source.start(item.startTime);
                source.stop(item.startTime + 8);
            } else {
                source.connect(offlineCtx.destination);
                source.start(item.startTime);
            }
        }

        const renderedBuffer = await offlineCtx.startRendering();
        return this.audioBufferToWav(renderedBuffer);
    }

    audioBufferToWav(buffer) {
        const numOfChan = buffer.numberOfChannels;
        const length = buffer.length * numOfChan * 2 + 44;
        const bufferArray = new ArrayBuffer(length);
        const view = new DataView(bufferArray);
        const channels = [];
        let i;
        let sample;
        let offset = 0;
        let pos = 0;

        function setUint16(data) {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        function setUint32(data) {
            view.setUint32(pos, data, true);
            pos += 4;
        }

        setUint32(0x46464952);                         // "RIFF"
        setUint32(length - 8);                         // file length - 8
        setUint32(0x45564157);                         // "WAVE"

        setUint32(0x20746d66);                         // "fmt " chunk
        setUint32(16);                                 // length = 16
        setUint16(1);                                  // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * numOfChan);  // avg. bytes/sec
        setUint16(numOfChan * 2);                      // block-align
        setUint16(16);                                 // 16-bit

        setUint32(0x61746164);                         // "data" - chunk
        setUint32(length - pos - 4);                   // chunk length

        for (i = 0; i < buffer.numberOfChannels; i++)
            channels.push(buffer.getChannelData(i));

        while (pos < length) {
            for (i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }

        return new Blob([bufferArray], { type: "audio/wav" });
    }

    async handleSyncSettings() {
        const originalText = this.els.syncSettingsBtn.innerHTML;
        this.els.syncSettingsBtn.disabled = true;
        this.els.syncSettingsBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4 animate-spin"></i> 同期中...';
        lucide.createIcons();

        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiUrl: this.state.apiUrl,
                    apiKey: this.state.apiKey,
                    modelId: this.state.modelId,
                    ttsUrl: this.state.ttsUrl,
                    ttsKey: this.state.ttsKey,
                    ttsSpeakerId: this.state.ttsSpeakerId,
                    searchApiUrl: this.state.searchApiUrl,
                    discordWebhookUrl: this.state.discordWebhookUrl,
                    personalityName: this.state.personalityName
                })
            });

            if (response.ok) {
                this.els.automationStatus.textContent = "設定をサーバーに同期しました";
                this.els.automationStatus.className = "text-[10px] text-green-400 font-bold";
            } else {
                throw new Error("同期失敗");
            }
        } catch (error) {
            console.error("Sync Error:", error);
            alert("設定の同期に失敗しました。");
        } finally {
            this.els.syncSettingsBtn.disabled = false;
            this.els.syncSettingsBtn.innerHTML = originalText;
            lucide.createIcons();
            setTimeout(() => {
                this.els.automationStatus.textContent = "自動生成は 08:00, 12:00, 20:00 (JST) に実行されます";
                this.els.automationStatus.className = "text-[10px] text-slate-500 italic";
            }, 5000);
        }
    }

    async handleTestAutomation() {
        if (!confirm("バックエンドで自動生成とDiscord投稿を開始しますか？")) return;

        const originalText = this.els.testAutomationBtn.innerHTML;
        this.els.testAutomationBtn.disabled = true;
        this.els.testAutomationBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4 animate-spin"></i> 実行中...';
        lucide.createIcons();

        try {
            const response = await fetch('/api/automation/test', { method: 'POST' });
            if (response.ok) {
                alert("バックエンドで自動生成を開始しました。完了まで数分かかります。Discordチャンネルを確認してください。");
            } else {
                throw new Error("実行失敗");
            }
        } catch (error) {
            console.error("Test Automation Error:", error);
            alert("テスト実行の開始に失敗しました。以前の設定同期が完了しているか確認してください。");
        } finally {
            this.els.testAutomationBtn.disabled = false;
            this.els.testAutomationBtn.innerHTML = originalText;
            lucide.createIcons();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RadioApp();
});