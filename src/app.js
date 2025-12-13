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
        id: 'comedy_duo',
        name: 'お笑いコンビのラジオ',
        type: 'preset',
        icon: 'volume-2',
        color: 'text-yellow-400',
        description: 'ボケとツッコミの掛け合いで進む、賑やかなトーク番組。',
        systemPrompt: `あなたはお笑いラジオ番組の構成作家です。お笑いコンビ「電光石火」のラジオ台本を書いてください。
        音声合成で読み上げるため、以下の点に注意してください。
        1. 役名は「タケ: 」または「ケン: 」の形式で書いてください。
        2. ト書き（効果音や動作）は必ず丸括弧（ ）で囲んでください。
        3. 絵文字は使わず、言葉で表現してください。

        # 出力例
        タケ: 「どうもー！電光石火のタケです！」
        ケン: 「ケンです。お願いしますー。」
        タケ: 「...」`
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
            
            selectedPersonaId: PRESET_PERSONAS[0].id,
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
            audioElement: null // 現在再生中のAudio要素
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
            copyBtn: document.getElementById('copyBtn')
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

        // Main Actions
        this.els.playAudioBtn.onclick = () => this.handlePlayAudio();
        this.els.generateBtn.onclick = () => this.handleGenerateScript();
        
        // Inputs
        this.els.topicInput.oninput = (e) => {
            this.state.topic = e.target.value;
            this.updatePaperHeader();
        };
        this.els.referenceInput.oninput = (e) => {
            this.state.referenceText = e.target.value;
            this.updatePaperHeader();
        };
        this.els.searchNewsBtn.onclick = () => {
            const query = this.els.topicInput.value || 'ITニュース';
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=nws`, '_blank');
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
            { s: 'radio_maker_tts_speaker', k: 'ttsSpeakerId' }
        ];
        keys.forEach(({s, k}) => {
            const val = localStorage.getItem(s);
            if (val) this.state[k] = val;
        });
    }

    updateInputsFromState() {
        this.els.apiUrlInput.value = this.state.apiUrl;
        this.els.apiKeyInput.value = this.state.apiKey;
        this.els.modelIdInput.value = this.state.modelId;
        this.els.customNameInput.value = this.state.customPersona.name;
        this.els.customPromptInput.value = this.state.customPersona.systemPrompt;
        this.els.ttsUrlInput.value = this.state.ttsUrl;
        this.els.ttsKeyInput.value = this.state.ttsKey;
        this.els.ttsSpeakerSelect.value = this.state.ttsSpeakerId;
    }

    renderPersonaList() {
        this.els.personaList.innerHTML = '';

        // Presets
        PRESET_PERSONAS.forEach(persona => {
            const btn = document.createElement('button');
            const isSelected = this.state.selectedPersonaId === persona.id;
            
            btn.className = `w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-start gap-3 ${
                isSelected 
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
        customBtn.className = `w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-start gap-3 ${
            isCustomSelected
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
        this.els.paperPersonaName.textContent = persona.name;
        
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
            if(persona.id === 'morning_dj') i.className = 'w-8 h-8 text-orange-400';
            if(persona.id === 'late_night') i.className = 'w-8 h-8 text-indigo-400';
            if(persona.id === 'comedy_duo') i.className = 'w-8 h-8 text-yellow-400';
            if(persona.id === 'tech_news') i.className = 'w-8 h-8 text-cyan-400';
            
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
            if(!this.els.testConnectionBtn.innerHTML.includes('wifi')) {
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

    async createAudioBlob(text) {
        if (!this.state.ttsUrl) throw new Error("TTS Endpoint URL is missing");

        const baseUrl = this.cleanUrl(this.state.ttsUrl);
        const headers = { 'Content-Type': 'application/json' };
        if (this.state.ttsKey) headers['X-API-KEY'] = this.state.ttsKey;

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
        let retryCount = 0;
        const maxRetries = 100;

        while (!isComplete && retryCount < maxRetries) {
            if (!this.state.isPlaying) throw new Error("Playback stopped");

            await this.wait(3000);
            
            const statusResponse = await fetch(statusEndpoint, { method: 'GET', headers });
            if (!statusResponse.ok) {
                console.warn(`Status check failed: ${statusResponse.status}`);
                retryCount++;
                continue;
            }

            const statusData = await statusResponse.json();
            const currentStatus = (statusData.status || '').toUpperCase(); 
            
            if (['COMPLETED', 'DONE', 'SUCCESS', 'FINISHED'].includes(currentStatus)) {
                isComplete = true;
            } else if (['FAILED', 'ERROR'].includes(currentStatus)) {
                throw new Error(`Synthesis Job Failed: ${statusData.error || 'Unknown error'}`);
            }
            retryCount++;
        }

        if (!isComplete) throw new Error("Synthesis timed out");

        // 3. Download Audio
        const resultEndpoint = `${baseUrl}/api/tasks/${jobId}/result`;
        const audioResponse = await fetch(resultEndpoint, { method: 'GET', headers });
        if (!audioResponse.ok) throw new Error(`Audio Download Error ${audioResponse.status}`);
        
        const blob = await audioResponse.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        return { blobUrl, text };
    }

    playAudioFromBlob(blobUrl) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(blobUrl);
            this.state.audioElement = audio; 
            
            audio.onended = () => {
                URL.revokeObjectURL(blobUrl);
                this.state.audioElement = null;
                resolve();
            };
            
            audio.onerror = (e) => {
                URL.revokeObjectURL(blobUrl);
                console.error("Audio Playback Error", e);
                reject(new Error("Playback failed."));
            };
            
            audio.play().catch(reject);
        });
    }

    cleanTextForTTS(rawText) {
        let ttsText = rawText.replace(/^.+?:/gm, ''); // Remove Name:
        ttsText = ttsText.replace(/（.*?）/g, ''); // Remove full-width parens
        ttsText = ttsText.replace(/\(.*?\)/g, ''); // Remove half-width parens
        return ttsText.trim();
    }

    async handlePlayAudio() {
        // STOP logic
        if (this.state.isPlaying) {
            this.state.isPlaying = false;
            if (this.state.audioElement) {
                this.state.audioElement.pause();
                this.state.audioElement = null;
            }
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

        const lines = this.state.script.split('\n');
        const validLines = lines.filter(line => this.cleanTextForTTS(line).length > 0);
        
        if (validLines.length === 0) {
            this.els.audioStatus.textContent = "再生可能なセリフがありません";
            this.els.audioStatus.className = "text-center text-xs text-red-400 mt-2 h-4";
            this.state.isPlaying = false;
            this.els.playAudioBtn.innerHTML = originalBtnContent;
            lucide.createIcons();
            return;
        }

        try {
            let nextAudioPromise = this.createAudioBlob(this.cleanTextForTTS(validLines[0]));
            
            for (let i = 0; i < validLines.length; i++) {
                if (!this.state.isPlaying) break;

                this.els.audioStatus.textContent = `準備中 (${i + 1}/${validLines.length})...`;
                this.els.audioStatus.className = "text-center text-xs text-slate-400 mt-2 h-4 animate-pulse";
                
                const { blobUrl, text } = await nextAudioPromise;

                if (i + 1 < validLines.length) {
                    const nextText = this.cleanTextForTTS(validLines[i+1]);
                    nextAudioPromise = this.createAudioBlob(nextText);
                } else {
                    nextAudioPromise = null;
                }

                if (!this.state.isPlaying) break;

                const displayNum = i + 1;
                const totalNum = validLines.length;
                const shortText = text.substring(0, 15) + (text.length > 15 ? '...' : '');
                
                this.els.audioStatus.textContent = `再生中 (${displayNum}/${totalNum}): ${shortText}`;
                this.els.audioStatus.className = "text-center text-xs text-cyan-500 mt-2 h-4 animate-pulse";

                await this.playAudioFromBlob(blobUrl);

                if (this.state.isPlaying && i < validLines.length - 1) {
                    await this.wait(500); 
                }
            }
            
            if (this.state.isPlaying) {
                this.els.audioStatus.textContent = "再生完了";
                this.els.audioStatus.className = "text-center text-xs text-green-400 mt-2 h-4";
            }

        } catch (err) {
            console.error(err);
            let msg = err.message || 'エラーが発生しました。';
            if (window.location.protocol === 'file:' && msg.includes('Failed to fetch')) {
                msg += ' (CORSエラーの可能性があります。Webサーバー経由で開いてください)';
            }

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
            let userContent = `今回のラジオのテーマは「${topic}」です。`;
            if (refText) {
                userContent += `\n\n以下の【参考資料/ニュース記事】の内容を元に、リスナーに分かりやすく紹介・解説する形で台本を作成してください。\n\n【参考資料/ニュース記事】\n${refText}`;
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
                        { role: "system", content: persona.systemPrompt },
                        { role: "user", content: userContent }
                    ],
                    temperature: 0.7,
                    max_tokens: -1,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}. LM Studioのサーバーは起動していますか？CORSはONですか？`);
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content || "生成されたテキストが空でした。";
            
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

    handleCopyScript() {
        const text = this.els.scriptContent.textContent;
        if (text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            const originalText = this.els.copyBtn.innerHTML;
            this.els.copyBtn.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i> コピー完了';
            lucide.createIcons();
            setTimeout(() => {
                this.els.copyBtn.innerHTML = originalText;
                lucide.createIcons();
            }, 2000);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RadioApp();
});