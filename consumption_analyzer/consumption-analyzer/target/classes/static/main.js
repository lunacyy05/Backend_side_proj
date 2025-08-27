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
            const response = await fetch('/get_summary');
            if (!response.ok) throw new Error('서버에서 요약 정보를 가져오는데 실패했습니다.');
            return await response.json();
        } catch (error) {
            console.error('fetchSummary 에러:', error);
            // 에러 발생 시 기본값 반환
            return { total_income: 0, total_expense: 0, expense_by_category: {} };
        }
    }

    /** 서버에서 특정 날짜의 거래 내역을 가져옵니다. */
    async function fetchTransactions(date) {
        try {
            const response = await fetch(`/get_transactions?date=${date}`);
            if (!response.ok) throw new Error('서버에서 거래 내역을 가져오는데 실패했습니다.');
            return await response.json();
        } catch (error) {
            console.error('fetchTransactions 에러:', error);
            return []; // 에러 발생 시 빈 배열 반환
        }
    }

    /** 서버에 새로운 거래(수입/지출)를 추가합니다. */
    async function addTransaction(type, data) {
        const endpoint = type === 'income' ? '/add_income' : '/add_expense';
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
            const response = await fetch('/reset_data', { method: 'POST' });
            if (!response.ok) throw new Error('데이터 초기화에 실패했습니다.');
            return await response.json();
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
        renderCalendar(); // 달력 먼저 그리기

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
        const totalIncome = summary.total_income || 0;
        const totalExpense = summary.total_expense || 0;
        const remaining = totalIncome - totalExpense;
        const percentage = totalIncome > 0 ? (remaining / totalIncome) * 100 : 0;

        document.querySelector('.progress-section span').textContent = `남은 돈 ${Math.round(percentage)}%`;
        document.querySelector('.progress-bar__fill').style.width = `${percentage < 0 ? 0 : percentage}%`;

        // 범례(Legend) 및 도넛 차트 업데이트
        const expenseByCategory = summary.expense_by_category || {};
        const sortedCategories = Object.keys(expenseByCategory).sort((a,b) => expenseByCategory[b] - expenseByCategory[a]);

        const legendUl = document.querySelector('.legend ul');
        legendUl.innerHTML = ''; // 기존 범례 초기화
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
        eventDetails.innerHTML = `<h4>${dateStr}</h4>`; // 헤더 먼저 설정

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
            const info = CATEGORY_DETAILS[t.category] || { name: t.category, color: '#8E8E93' };
            const amountFormatted = t.amount.toLocaleString();

            // 백엔드에서 'name'을 보내주지 않으므로 'category'로 통일해서 표시
            itemDiv.innerHTML = `<span class="dot" style="background-color: ${info.color};"></span><span class="name">${info.name}</span><span class="amount ${isIncome ? 'income' : 'expense'}">${sign}${amountFormatted}</span>`;
            eventDetails.appendChild(itemDiv);
        });
    }

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
            document.getElementById('income-category').value = '';
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
            document.getElementById('expense-category').value = '';
        }
    }

    /** 데이터 초기화 버튼 클릭 핸들러 */
    async function handleResetData() {
        if (confirm('정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            const result = await resetDataOnServer();
            if (result) {
                location.reload();
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

        // 날짜가 변경되었으므로 해당 날짜의 거래내역을 서버에서 새로 가져옴
        const transactions = await fetchTransactions(selectedDate);
        renderDetailsForDate(selectedDate, transactions);
    }

    /** 달력 월 이동 핸들러 */
    function handleMonthChange(direction) {
        const current = new Date(selectedDate);
        current.setMonth(current.getMonth() + direction);
        selectedDate = formatDate(current);
        renderCalendar();
    }


    // =================================================
    //  6. 이벤트 리스너 설정
    // =================================================

    function setupEventListeners() {
        document.getElementById('save-income-button').addEventListener('click', handleAddIncome);
        document.getElementById('save-expense-button').addEventListener('click', handleAddExpense);
        document.getElementById('reset-data-button').addEventListener('click', handleResetData);

        // 캘린더
        document.querySelector('.calendar-grid').addEventListener('click', handleCalendarClick);
        document.getElementById('prev-month').addEventListener('click', () => handleMonthChange(-1));
        document.getElementById('next-month').addEventListener('click', () => handleMonthChange(1));

        // 금액 입력 필드는 숫자만 입력되도록 처리
        document.getElementById('income-amount').addEventListener('input', (e) => e.target.value = e.target.value.replace(/\D/g, ''));
        document.getElementById('expense-amount').addEventListener('input', (e) => e.target.value = e.target.value.replace(/\D/g, ''));
    }

    // =================================================
    //  7. 헬퍼 함수 및 상수
    // =================================================

    /** Date 객체를 'YYYY-MM-DD' 형식의 문자열로 변환합니다. */
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /** 테마 변경 UI를 설정합니다. */
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

    /** 카테고리별 이름과 색상 정보 */
    const CATEGORY_DETAILS = {
        // 수입
        salary: { name: '월급', color: '#34C759' },
        bonus: { name: '상여', color: '#0A84FF' },
        investment: { name: '투자', color: '#5AC8FA' },
        // 지출
        communication: { name: '통신비', color: '#32D74B' },
        transportation: { name: '교통비', color: '#A964E8' },
        savings: { name: '저축', color: '#5856D6' },
        living: { name: '생활비', color: '#FF9500' },
        food: { name: '식비', color: '#FF453A' },
        medical: { name: '의료비', color: '#FF2D55' },
        etc: { name: '기타', color: '#8E8E93' }
    };
});