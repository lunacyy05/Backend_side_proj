document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 가져오기
    const editor = document.getElementById('post-editor');
    const postBtn = document.getElementById('post-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const feed = document.getElementById('feed');
    const fontFamilySelect = document.getElementById('font-family');
    const fontSizeSelect = document.getElementById('font-size');
    const boldBtn = document.getElementById('bold-btn');
    const aiResultContainer = document.getElementById('ai-result-container');
    const aiAdvice = document.getElementById('ai-advice');
    const loader = document.getElementById('loader');
    
    let stressChartInstance = null;
    let userId = null;

    // 1. 사용자 초기화 및 데이터 로드
    const initializeUser = () => {
        userId = localStorage.getItem('stress-community-userId');
        if (!userId) {
            userId = `user_${crypto.randomUUID()}`;
            localStorage.setItem('stress-community-userId', userId);
        }
        loadPosts();
    };

    const loadPosts = () => {
        const posts = getPostsFromStorage();
        feed.innerHTML = '<h2>나의 글 목록</h2>';
        if(posts.length === 0) {
             const noPostMessage = document.createElement('p');
             noPostMessage.textContent = '아직 작성된 글이 없습니다. 당신의 첫 이야기를 남겨보세요.';
             noPostMessage.style.textAlign = 'center';
             noPostMessage.style.color = '#6e6e73';
             feed.appendChild(noPostMessage);
        } else {
            posts.forEach(post => renderPost(post, false));
        }
    };
    
    // 2. 글 렌더링 및 저장
    const renderPost = (postData, prepend = true) => {
        const postElement = document.createElement('div');
        postElement.classList.add('post');

        const postHeader = document.createElement('div');
        postHeader.classList.add('post-header');
        postHeader.textContent = postData.nickname;

        const postContent = document.createElement('div');
        postContent.classList.add('post-content');
        postContent.innerHTML = postData.content;

        postElement.appendChild(postHeader);
        postElement.appendChild(postContent);

        if (prepend) {
            // '나의 글 목록' 헤더 바로 다음에 삽입
            feed.insertBefore(postElement, feed.children[1]);
            // 만약 '글 없음' 메시지가 있었다면 제거
            if (feed.querySelector('p')) {
                feed.querySelector('p').remove();
            }
        } else {
            feed.appendChild(postElement);
        }
    };

    const getPostsFromStorage = () => {
        return JSON.parse(localStorage.getItem(`posts_${userId}`) || '[]');
    };

    const savePostToStorage = (postData) => {
        const posts = getPostsFromStorage();
        posts.unshift(postData); // 최신 글을 맨 앞에 추가
        localStorage.setItem(`posts_${userId}`, JSON.stringify(posts));
    };

    // 3. 익명 닉네임 생성
    const generateNickname = () => {
        const chars = ['1', 'i', 'I', 'l'];
        const length = Math.floor(Math.random() * 5) + 6; // 6~10자
        let nickname = '';
        for (let i = 0; i < length; i++) {
            nickname += chars[Math.floor(Math.random() * chars.length)];
        }
        return nickname;
    };
    
    // 4. 에디터 툴바 기능
    fontFamilySelect.addEventListener('change', (e) => {
        document.execCommand('fontName', false, e.target.value);
        editor.focus();
    });
    
    fontSizeSelect.addEventListener('change', (e) => {
        const size = e.target.value;
        document.execCommand('fontSize', false, '1'); // execCommand는 1-7만 지원하므로 임시값 사용
        const fontElements = window.getSelection().getRangeAt(0).commonAncestorContainer.getElementsByTagName("font");
        for (let i = 0, len = fontElements.length; i < len; ++i) {
            if (fontElements[i].size === "1") {
                fontElements[i].removeAttribute("size");
                fontElements[i].style.fontSize = size;
            }
        }
        editor.focus();
    });

    boldBtn.addEventListener('click', () => {
        document.execCommand('bold');
        boldBtn.classList.toggle('active');
        editor.focus();
    });

    const updateToolbarState = () => {
        if (document.queryCommandState('bold')) boldBtn.classList.add('active');
        else boldBtn.classList.remove('active');
    };
    editor.addEventListener('keyup', updateToolbarState);
    editor.addEventListener('mouseup', updateToolbarState);

    // 5. 글 게시 처리
    postBtn.addEventListener('click', () => {
        const contentHTML = editor.innerHTML.trim();
        
        if (!contentHTML || contentHTML === '<br>') {
            alert('내용을 입력해주세요.');
            return;
        }

        const postData = {
            nickname: generateNickname(),
            content: contentHTML,
            timestamp: new Date().toISOString()
        };

        savePostToStorage(postData);
        renderPost(postData, true);

        editor.innerHTML = '';
        boldBtn.classList.remove('active');
        fontFamilySelect.selectedIndex = 0;
        fontSizeSelect.selectedIndex = 0;
    });

    // 6. AI 분석 처리
    analyzeBtn.addEventListener('click', async () => {
        const posts = getPostsFromStorage();
        if (posts.length === 0) {
            alert('분석할 글이 없습니다. 먼저 당신의 이야기를 들려주세요.');
            return;
        }

        // 모든 글의 텍스트 콘텐츠를 하나로 합치기
        const allText = posts.map(p => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = p.content;
            return tempDiv.textContent || tempDiv.innerText || '';
        }).join('\n\n');
        
        // UI 업데이트: 로딩 시작
        aiResultContainer.classList.remove('hidden');
        loader.classList.remove('hidden');
        aiResultContainer.querySelector('.analysis-content').classList.add('hidden');
        
        try {
            const apiKey = ""; // API 키는 여기에 직접 넣지 않습니다.
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

            const systemPrompt = `당신은 사용자의 글을 분석하여 정신 건강에 대한 조언을 제공하는 따뜻하고 공감 능력 있는 AI 상담사입니다. 사용자의 감정을 깊이 이해하고, 구체적이고 실용적인 스트레스 해소 방안을 제시해주세요. 분석 결과는 반드시 지정된 JSON 형식으로 반환해야 합니다.`;
            
            const userPrompt = `다음은 사용자가 작성한 글들의 모음입니다. 이 내용을 바탕으로 다음 두 가지 작업을 수행해주세요:
1. 'advice' 필드에 사용자의 현재 심리 상태를 분석하고, 따뜻한 위로와 함께 구체적인 스트레스 해소 방안 또는 상담 권유를 담은 조언을 작성해주세요. (한국어, 마크다운 형식)
2. 'stressAnalysis' 필드에 글 내용에서 드러나는 스트레스의 원인을 #개인, #친구, #가족, #직장, #학업, #건강, #기타 중 하나 이상으로 분류하고, 각 원인이 차지하는 비율(%)을 숫자로 추정하여 객체 형태로 담아주세요. 모든 비율의 합은 100이 되어야 합니다.

사용자 글:
---
${allText}
---
`;

            const payload = {
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                          "advice": { "type": "STRING" },
                          "stressAnalysis": {
                            "type": "OBJECT",
                            "properties": {
                              "#개인": { "type": "NUMBER" }, "#친구": { "type": "NUMBER" },
                              "#가족": { "type": "NUMBER" }, "#직장": { "type": "NUMBER" },
                              "#학업": { "type": "NUMBER" }, "#건강": { "type": "NUMBER" },
                              "#기타": { "type": "NUMBER" }
                            }
                          }
                        },
                        required: ["advice", "stressAnalysis"]
                    }
                }
            };
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.statusText}`);
            }
            
            const result = await response.json();
            const jsonText = result.candidates[0].content.parts[0].text;
            const data = JSON.parse(jsonText);

            displayAIResults(data);

        } catch (error) {
            console.error('AI 분석 중 오류 발생:', error);
            aiAdvice.textContent = 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } finally {
            // UI 업데이트: 로딩 종료
            loader.classList.add('hidden');
            aiResultContainer.querySelector('.analysis-content').classList.remove('hidden');
        }
    });

    const displayAIResults = (data) => {
        aiAdvice.textContent = data.advice;
        renderStressChart(data.stressAnalysis);
    };

    const renderStressChart = (analysisData) => {
        const ctx = document.getElementById('stress-chart').getContext('2d');
        const labels = Object.keys(analysisData).filter(key => analysisData[key] > 0);
        const data = Object.values(analysisData).filter(value => value > 0);

        if (stressChartInstance) {
            stressChartInstance.destroy();
        }

        stressChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: '스트레스 원인 (%)',
                    data: data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
                        'rgba(201, 203, 207, 0.7)'
                    ],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += context.parsed + '%';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    };
    
    // 애플리케이션 시작
    initializeUser();
});
