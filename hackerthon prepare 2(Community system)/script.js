document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('post-editor');
    const postBtn = document.getElementById('post-btn');
    const feed = document.getElementById('feed');
    
    // 툴바 컨트롤
    const fontFamilySelect = document.getElementById('font-family');
    const fontSizeSelect = document.getElementById('font-size');
    const boldBtn = document.getElementById('bold-btn');

    // 폰트 변경
    fontFamilySelect.addEventListener('change', (e) => {
        document.execCommand('fontName', false, e.target.value);
        editor.focus();
    });

    // 글자 크기 변경
    fontSizeSelect.addEventListener('change', (e) => {
        // execCommand('fontSize')는 1-7 사이의 값을 사용하므로, 직접 스타일을 적용하는 것이 더 안정적입니다.
        // 여기서는 간단함을 위해 execCommand 대신 선택된 텍스트의 스타일을 바꾸는 방식을 씁니다.
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const span = document.createElement('span');
            span.style.fontSize = e.target.value;
            selection.getRangeAt(0).surroundContents(span);
        }
    });

    // 볼드체 토글
    boldBtn.addEventListener('click', () => {
        document.execCommand('bold');
        boldBtn.classList.toggle('active');
        editor.focus();
    });
    
    // 에디터에서 스타일 변경시 툴바 상태 업데이트
    editor.addEventListener('keyup', updateToolbarState);
    editor.addEventListener('mouseup', updateToolbarState);

    function updateToolbarState() {
        const isBold = document.queryCommandState('bold');
        if (isBold) {
            boldBtn.classList.add('active');
        } else {
            boldBtn.classList.remove('active');
        }
    }


    // 익명 닉네임 생성 함수
    const generateNickname = () => {
        const chars = ['1', 'i', 'I', 'l'];
        const length = Math.floor(Math.random() * 5) + 6; // 6~10자
        let nickname = '';
        for (let i = 0; i < length; i++) {
            nickname += chars[Math.floor(Math.random() * chars.length)];
        }
        return nickname;
    };

    // 글 게시 함수
    postBtn.addEventListener('click', () => {
        const contentHTML = editor.innerHTML.trim();
        
        if (!contentHTML || contentHTML === '<br>') {
            alert('내용을 입력해주세요.');
            return;
        }

        const nickname = generateNickname();

        // 새 게시글 엘리먼트 생성
        const postElement = document.createElement('div');
        postElement.classList.add('post');

        const postHeader = document.createElement('div');
        postHeader.classList.add('post-header');
        postHeader.textContent = nickname;

        const postContent = document.createElement('div');
        postContent.classList.add('post-content');
        postContent.innerHTML = contentHTML;

        postElement.appendChild(postHeader);
        postElement.appendChild(postContent);

        // 피드의 맨 위에 새 게시글 추가
        feed.prepend(postElement);

        // 에디터 초기화
        editor.innerHTML = '';
        boldBtn.classList.remove('active');
        fontFamilySelect.selectedIndex = 0;
        fontSizeSelect.selectedIndex = 0;
    });
});