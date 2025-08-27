document.addEventListener('DOMContentLoaded', () => {

    // =================================================
    //  1. 전역 변수 및 초기 설정
    // =================================================
    let selectedDate = formatDate(new Date()); // 오늘 날짜로 초기 선택

    // 테마 설정 (기존 코드와 동일)
    setupThemeToggle();

    // 초기 데이터 로드
    initializePage();

    // 이벤트 리스너 설정
    setupEventListeners();


    // =================================================
    //  2. API 호출 함수 (백엔드와 통신)
    // =================================================

    /** 서버에서 월별 요약 정보를 가져옵니다. */
    async function fetchSummary() {
        try {
            const response = await fetch('/api/summary');
            if (!response.ok) throw new Error('서버에서 요약 정보를 가져오는데 실패했습니다.');
            return await response.json();
        } catch (error) {
            console.error('fetchSummary 에러:', error);
            // [수정] 백엔드 DTO의 필드명(camelCase)과 일치시킵니다.
            return { totalIncome: 0, totalExpense: 0, expenseByCategory: {} };
        }
    }

    /** 서버에서 특정 날짜의 거래 내역을 가져옵니다. */
    async function fetchTransactions(date) {
        try {
            const response = await fetch(`/api/transactions?date=${date}`);
            if (!response.ok) throw new Error('서버에서 거래 내역을 가져오는데 실패했습니다.');
            return await response.json();
        } catch (error) {
            console.error('fetchTransactions 에러:', error);
            return []; // 에러 발생 시 빈 배열 반환
        }
    }

    /** 서버에 새로운 거래(수입/지출)를 추가합니다. */
    async function addTransaction(type, data) {
        const endpoint = type === 'income' ? '/api/transactions/income' : '/api/transactions/expense';
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('데이터 추가에 실패했습니다.');
            return await response.json();
        } catch (error) {
            console.error('addTransaction 에러:', error);
            alert('데이터 추가 중 오류가 발생했습니다.');
            return null;
        }
    }

    /** 서버의 모든 데이터를 리셋합니다. */
    async function resetDataOnServer() {
        try {
            const response = await fetch('/api/data/reset', { method: 'POST' });
            // reset API는 본문(body)이 없을 수 있으므로 response.json() 호출을 제거합니다.
            if (!response.ok) throw new Error('데이터 초기화에 실패했습니다.');
            return response; // 성공 여부만 확인
        } catch (error) {
            console.error('resetDataOnServer 에러:', error);
            alert('데이터 초기화 중 오류가 발생했습니다.');
            return null;
        }
    }

    // =================================================
    //  3. 페이지 초기화 및 데이터 리프레시
    // =================================================

    /** 페이지가 처음 로드될 때 필요한 모든 데이터를 가져와 화면을 그립니다. */
    async function initializePage() {
        renderCalendar();

        const summary = await fetchSummary();
        updateDashboard(summary);

        const transactions = await fetchTransactions(selectedDate);
        renderDetailsForDate(selectedDate, transactions);
    }

    /** 데이터 변경 후 화면 전체를 새로고침합니다. */
    async function refreshAllData() {
        const summary = await fetchSummary();
        updateDashboard(summary);

        const transactions = await fetchTransactions(selectedDate);
        renderDetailsForDate(selectedDate, transactions);
    }


    // =================================================
    //  4. UI 업데이트 함수
    // =================================================

    /** 대시보드 UI를 업데이트합니다 (잔액, 프로그레스 바, 도넛 차트 등). */
    function updateDashboard(summary) {
        // [수정] 백엔드 DTO의 필드명(camelCase)과 일치시킵니다.
        const totalIncome = summary.totalIncome || 0;
        const totalExpense = summary.totalExpense || 0;
        const remaining = totalIncome - totalExpense;
        const percentage = totalIncome > 0 ? (remaining / totalIncome) * 100 : 0;

        // [수정] 대시보드 UI에 금액을 올바르게 표시합니다.
        document.getElementById('total-income').textContent = `₩${totalIncome.toLocaleString()}`;
        document.getElementById('total-expense').textContent = `₩${totalExpense.toLocaleString()}`;
        document.getElementById('balance').textContent = `₩${remaining.toLocaleString()}`;

        document.querySelector('.progress-section span').textContent = `남은 돈 ${Math.round(percentage)}%`;
        document.querySelector('.progress-bar__fill').style.width = `${percentage < 0 ? 0 : percentage}%`;

        // [수정] 백엔드 DTO의 필드명(camelCase)과 일치시킵니다.
        const expenseByCategory = summary.expenseByCategory || {};
        const sortedCategories = Object.keys(expenseByCategory).sort((a,b) => expenseByCategory[b] - expenseByCategory[a]);

        const legendUl = document.querySelector('.legend ul');
        legendUl.innerHTML = '';
        sortedCategories.forEach(catKey => {
            const amount = expenseByCategory[catKey];
            const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
            const info = CATEGORY_DETAILS[catKey] || { name: catKey, color: '#8E8E93' };
            const li = document.createElement('li');
            li.innerHTML = `<span class="dot" style="background-color:${info.color};"></span><span class="label">${info.name}</span><span class="dashes"></span><span>${pct.toFixed(1)}%</span>`;
            legendUl.appendChild(li);
        });

        const donutChart = document.querySelector('.donut-chart');
        let gradientString = '', cumulativePct = 0;
        if (totalExpense > 0 && sortedCategories.length > 0) {
            sortedCategories.forEach(catKey => {
                const pct = (expenseByCategory[catKey] / totalExpense) * 100;
                const info = CATEGORY_DETAILS[catKey] || { name: catKey, color: '#8E8E93' };
                gradientString += `${info.color} ${cumulativePct}% ${cumulativePct + pct}%, `;
                cumulativePct += pct;
            });
            gradientString = gradientString.slice(0, -2);
            donutChart.style.background = `conic-gradient(${gradientString})`;
        } else {
            donutChart.style.background = 'var(--subtle-border-color)';
        }
    }

    /** 특정 날짜의 상세 거래 내역 UI를 업데이트합니다. */
    function renderDetailsForDate(dateStr, transactions) {
        const eventDetails = document.getElementById('event-details');
        eventDetails.innerHTML = `<h4>${dateStr}</h4>`;

        if (!transactions || transactions.length === 0) {
            const p = document.createElement('p');
            p.textContent = '해당 날짜에 내역이 없습니다.';
            eventDetails.appendChild(p);
            return;
        }

        transactions.forEach(t => {
            const isIncome = t.type === 'income';
            const itemDiv = document.createElement('div');
            itemDiv.className = 'transaction-item';
            const sign = isIncome ? '+' : '-';
            // [수정] 백엔드에서 받은 category '객체'의 'name' 속성을 사용합니다.
            const info = CATEGORY_DETAILS[t.category.name] || { name: t.category.name, color: '#8E8E93' };
            const amountFormatted = t.amount.toLocaleString();

            itemDiv.innerHTML = `<span class="dot" style="background-color: ${info.color};"></span><span class="name">${info.name}</span><span class="amount ${isIncome ? 'income' : 'expense'}">${sign}${amountFormatted}</span>`;
            eventDetails.appendChild(itemDiv);
        });
    }

    // ... 나머지 코드는 기존과 동일 ...

    // (이 아래로 renderCalendar, 이벤트 핸들러, 헬퍼 함수 등이 위치합니다)
    /** 달력을 렌더링합니다. */
    function renderCalendar() {
        const calendarGrid = document.querySelector('.calendar-grid');
        const monthYearElement = document.getElementById('month-year');
        const currentDate = new Date(selectedDate.substr(0, 7) + '-15'); // 월 이동 계산을 위한 기준 날짜

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
        monthYearElement.textContent = `${year}년 ${monthNames[month]}`;

        calendarGrid.innerHTML = '';
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        dayNames.forEach(day => {
            const dayNameEl = document.createElement('div'); dayNameEl.className = 'day-name'; dayNameEl.textContent = day; calendarGrid.appendChild(dayNameEl);
        });

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const lastDateOfMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) { calendarGrid.appendChild(document.createElement('div')); }

        for (let day = 1; day <= lastDateOfMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.textContent = day;
            dayDiv.classList.add('day-number');
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayDiv.dataset.date = dateStr;

            if (dateStr === selectedDate) {
                dayDiv.classList.add('selected');
            }

            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayDiv.classList.add('today');
            }
            calendarGrid.appendChild(dayDiv);
        }
    }


    // =================================================
    //  5. 이벤트 핸들러 함수
    // =================================================

    /** 수입 추가 버튼 클릭 핸들러 */
    async function handleAddIncome() {
        if (!selectedDate) { alert('먼저 달력에서 날짜를 선택해주세요.'); return; }

        const category = document.getElementById('income-category').value;
        const amountInput = document.getElementById('income-amount');
        const amount = parseInt(amountInput.value, 10);

        if (!category || !amount) { alert('모든 수입 정보를 입력해주세요.'); return; }

        const result = await addTransaction('income', { date: selectedDate, category, amount });
        if (result) {
            await refreshAllData();
            amountInput.value = '';
        }
    }

    /** 지출 추가 버튼 클릭 핸들러 */
    async function handleAddExpense() {
        if (!selectedDate) { alert('먼저 달력에서 날짜를 선택해주세요.'); return; }

        const category = document.getElementById('expense-category').value;
        const amountInput = document.getElementById('expense-amount');
        const amount = parseInt(amountInput.value, 10);

        if (!category || !amount) { alert('모든 지출 정보를 입력해주세요.'); return; }

        const result = await addTransaction('expense', { date: selectedDate, category, amount });
        if (result) {
            await refreshAllData();
            amountInput.value = '';
        }
    }

    /** 데이터 초기화 버튼 클릭 핸들러 */
    async function handleResetData() {
        if (confirm('정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            const result = await resetDataOnServer();
            if (result) {
                // 데이터를 성공적으로 리셋했으므로 화면도 새로고침
                await refreshAllData();
            }
        }
    }

    /** 달력 날짜 클릭 핸들러 */
    async function handleCalendarClick(event) {
        const target = event.target;
        if (!target.classList.contains('day-number')) return;

        const currentSelected = document.querySelector('.calendar-grid .selected');
        if (currentSelected) {
            currentSelected.classList.remove('selected');
        }
        target.classList.add('selected');
        selectedDate = target.dataset.date;

        const transactions = await fetchTransactions(selectedDate);
        renderDetailsForDate(selectedDate, transactions);
    }

    /** 달력 월 이동 핸들러 */
    function handleMonthChange(direction) {
        const current = new Date(selectedDate);
        current.setMonth(current.getMonth() + direction);
        selectedDate = formatDate(current);
        renderCalendar();
        // 월이 바뀌었으니 해당 월의 첫날 거래내역을 불러오도록 refreshAllData 호출
        refreshAllData();
    }


    // =================================================
    //  6. 이벤트 리스너 설정
    // =================================================

    function setupEventListeners() {
        document.getElementById('save-income-button').addEventListener('click', handleAddIncome);
        document.getElementById('save-expense-button').addEventListener('click', handleAddExpense);
        document.getElementById('reset-data-button').addEventListener('click', handleResetData);

        document.querySelector('.calendar-grid').addEventListener('click', handleCalendarClick);
        document.getElementById('prev-month').addEventListener('click', () => handleMonthChange(-1));
        document.getElementById('next-month').addEventListener('click', () => handleMonthChange(1));

        document.getElementById('income-amount').addEventListener('input', (e) => e.target.value = e.target.value.replace(/\D/g, ''));
        document.getElementById('expense-amount').addEventListener('input', (e) => e.target.value = e.target.value.replace(/\D/g, ''));
    }

    // =================================================
    //  7. 헬퍼 함수 및 상수
    // =================================================

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    function setupThemeToggle() {
        const lightThemeButton = document.getElementById('light-theme-button');
        const darkThemeButton = document.getElementById('dark-theme-button');
        const body = document.body;

        const applyTheme = (theme) => {
            body.classList.toggle('light-theme', theme === 'light');
            lightThemeButton.classList.toggle('active', theme === 'light');
            darkThemeButton.classList.toggle('active', theme !== 'light');
            localStorage.setItem('theme', theme);
        };

        lightThemeButton.addEventListener('click', () => applyTheme('light'));
        darkThemeButton.addEventListener('click', () => applyTheme('dark'));
        applyTheme(localStorage.getItem('theme') || 'dark');
    }

    const CATEGORY_DETAILS = {
        salary: { name: '월급', color: '#34C759' },
        bonus: { name: '상여', color: '#0A84FF' },
        investment: { name: '투자', color: '#5AC8FA' },
        communication: { name: '통신비', color: '#32D74B' },
        transportation: { name: '교통비', color: '#A964E8' },
        savings: { name: '저축', color: '#5856D6' },
        living: { name: '생활비', color: '#FF9500' },
        food: { name: '식비', color: '#FF453A' },
        medical: { name: '의료비', color: '#FF2D55' },
        etc: { name: '기타', color: '#8E8E93' }
    };
});