// 페이지의 모든 HTML 요소가 로드된 후 JavaScript 코드를 실행하도록 보장합니다.
document.addEventListener('DOMContentLoaded', () => {

    // =================================================
    //  1. 테마 변경 기능 (Theme Toggle Logic)
    // =================================================
    const lightThemeButton = document.getElementById('light-theme-button');
    const darkThemeButton = document.getElementById('dark-theme-button');
    const body = document.body;

    // 헤더의 반투명 배경색을 올바르게 계산하기 위한 함수
    function setHeaderBackground() {
        const computedStyle = getComputedStyle(body);
        let bgColor = computedStyle.getPropertyValue('--bg-color').trim();
        if (bgColor.includes(' ')) { body.style.setProperty('--bg-color-rgb', bgColor); return; }
        if (bgColor.startsWith('#')) {
            const hex = bgColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16), g = parseInt(hex.substring(2, 4), 16), b = parseInt(hex.substring(4, 6), 16);
            body.style.setProperty('--bg-color-rgb', `${r}, ${g}, ${b}`);
        }
    }
    // 테마를 적용하고 localStorage에 저장하는 함수
    function applyTheme(theme) {
        body.classList.toggle('light-theme', theme === 'light');
        lightThemeButton.classList.toggle('active', theme === 'light');
        darkThemeButton.classList.toggle('active', theme !== 'light');
        setHeaderBackground();
        localStorage.setItem('theme', theme);
    }
    // 버튼 클릭 이벤트 리스너
    lightThemeButton.addEventListener('click', () => applyTheme('light'));
    darkThemeButton.addEventListener('click', () => applyTheme('dark'));
    // 페이지 로드 시 저장된 테마 적용
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    
    // =================================================
    //  2. 전역 상태 및 헬퍼 함수 (Global State & Helpers)
    // =================================================
    // 사용자가 현재 선택한 날짜를 저장하는 변수 (YYYY-MM-DD 형식)
    let selectedDate = null; 
    
    // Date 객체를 'YYYY-MM-DD' 형식의 문자열로 변환하는 헬퍼 함수
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // =================================================
    //  3. 달력 기능 (Calendar Logic)
    // =================================================
    const monthYearElement = document.getElementById('month-year');
    const calendarGrid = document.querySelector('.calendar-grid');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    let currentDate = new Date(); // 달력이 현재 보여주고 있는 월

    // 달력의 날짜들을 화면에 그리는 함수
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
        monthYearElement.textContent = `${year}년 ${monthNames[month]}`;
        
        calendarGrid.innerHTML = ''; // 기존 날짜들 초기화
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        dayNames.forEach(day => {
            const dayNameEl = document.createElement('div'); dayNameEl.className = 'day-name'; dayNameEl.textContent = day; calendarGrid.appendChild(dayNameEl);
        });

        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 이번 달 1일의 요일
        const lastDateOfMonth = new Date(year, month + 1, 0).getDate(); // 이번 달의 마지막 날

        // 1일이 시작하기 전까지 빈 div로 채우기
        for (let i = 0; i < firstDayOfMonth; i++) { calendarGrid.appendChild(document.createElement('div')); }
        
        // 1일부터 마지막 날까지 날짜 생성
        for (let day = 1; day <= lastDateOfMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.textContent = day;
            dayDiv.classList.add('day-number');
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayDiv.dataset.date = dateStr;

            if (dateStr === selectedDate) { dayDiv.classList.add('selected'); } // 현재 선택된 날짜에 'selected' 클래스 추가
            
            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayDiv.classList.add('today'); // 오늘 날짜에 'today' 클래스 추가
            }
            calendarGrid.appendChild(dayDiv);
        }
    }
    // 이전/다음 달 버튼 이벤트
    prevMonthButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

    // 날짜 클릭 이벤트
    calendarGrid.addEventListener('click', (event) => {
        const target = event.target;
        if (!target.classList.contains('day-number')) return; // 날짜가 아니면 무시

        const currentSelected = calendarGrid.querySelector('.selected');
        if (currentSelected) { currentSelected.classList.remove('selected'); }
        target.classList.add('selected'); // 새로 클릭된 날짜에 'selected' 클래스 추가
        
        selectedDate = target.dataset.date; // 전역 selectedDate 변수 업데이트
        renderDetailsForDate(selectedDate); // 상세 내역 창 업데이트
    });

    
    // =================================================
    //  4. 대시보드 및 데이터 관리 기능 (Dashboard Logic)
    // =================================================
    // --- DOM 요소 선택 ---
    const incomeNameInput = document.getElementById('income-name');
    const incomeCategoryInput = document.getElementById('income-category');
    const incomeAmountInput = document.getElementById('income-amount');
    const saveIncomeButton = document.getElementById('save-income-button');
    const expenseNameInput = document.getElementById('expense-name');
    const expenseCategoryInput = document.getElementById('expense-category');
    const expenseAmountInput = document.getElementById('expense-amount');
    const saveExpenseButton = document.getElementById('save-expense-button');
    const eventDetails = document.getElementById('event-details');
    const remainingAmountSpan = document.querySelector('.progress-section span');
    const progressBarFill = document.querySelector('.progress-bar__fill');
    const legendUl = document.querySelector('.legend ul');
    const donutChart = document.querySelector('.donut-chart');
    const resetButton = document.getElementById('reset-data-button');

    // --- 애플리케이션 데이터 및 설정 ---
    let transactions = { incomes: [], expenses: [] }; // 모든 수입/지출 데이터를 저장하는 객체
    const INCOME_COLOR = '#0A84FF';
    const CATEGORY_DETAILS = { // 카테고리 이름과 색상을 관리하는 설정 객체
        // 수입
        salary: { name: '월급', color: INCOME_COLOR },
        bonus: { name: '상여', color: INCOME_COLOR },
        investment: { name: '투자', color: INCOME_COLOR },
        // 지출
        communication: { name: '통신비', color: '#32D74B' },
        transportation: { name: '교통비', color: '#A964E8' },
        savings: { name: '저금', color: '#5856D6' },
        living: { name: '생활비', color: '#FF9500' },
        food: { name: '식비', color: '#FF453A' },
        medical: { name: '병원비', color: '#FF2D55' },
        etc: { name: '기타', color: '#8E8E93' }
    };

    // --- 데이터 영속성 함수 ---
    function loadTransactions() { const saved = localStorage.getItem('transactions'); if(saved) transactions = JSON.parse(saved); }
    function saveTransactions() { localStorage.setItem('transactions', JSON.stringify(transactions)); }

    // --- UI 업데이트 함수 ---
    // 메인 대시보드를 업데이트하는 함수
    function updateDashboard() {
        const totalIncome = transactions.incomes.reduce((s, t) => s + t.amount, 0);
        const totalExpense = transactions.expenses.reduce((s, t) => s + t.amount, 0);
        const remaining = totalIncome - totalExpense;
        let percentage = totalIncome > 0 ? (remaining / totalIncome) * 100 : 0;
        
        remainingAmountSpan.textContent = `남은 돈 ${Math.round(percentage)}%`;
        progressBarFill.style.width = `${percentage < 0 ? 0 : percentage}%`;

        // 지출 카테고리별 합계 계산
        const expenseByCategory = {};
        transactions.expenses.forEach(e => { if (!expenseByCategory[e.category]) expenseByCategory[e.category] = 0; expenseByCategory[e.category] += e.amount; });
        
        legendUl.innerHTML = ''; // 범례 초기화
        const sortedCategories = Object.keys(expenseByCategory).sort((a,b)=>expenseByCategory[b]-expenseByCategory[a]);

        // 범례 항목 생성
        sortedCategories.forEach(catKey => {
            const amount = expenseByCategory[catKey];
            const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
            const info = CATEGORY_DETAILS[catKey] || {name: catKey, color:'#8E8E93'};
            const li = document.createElement('li');
            li.innerHTML = `<span class="dot" style="background-color:${info.color};"></span><span class="label">${info.name}</span><span class="dashes"></span><span>${pct.toFixed(1)}%</span>`;
            legendUl.appendChild(li);
        });

        // 원형 그래프 생성
        let gradientString = '', cumulativePct = 0;
        if (totalExpense > 0 && sortedCategories.length > 0) {
            sortedCategories.forEach(catKey => {
                const pct = (expenseByCategory[catKey] / totalExpense) * 100;
                const info = CATEGORY_DETAILS[catKey] || {name: catKey, color:'#8E8E93'};
                gradientString += `${info.color} ${cumulativePct}% ${cumulativePct + pct}%, `;
                cumulativePct += pct;
            });
            gradientString = gradientString.slice(0, -2);
            donutChart.style.background = `conic-gradient(${gradientString})`;
        } else {
            donutChart.style.background = 'var(--subtle-border-color)';
        }
    }

    // 선택된 날짜의 상세 내역을 렌더링하는 함수
    function renderDetailsForDate(dateStr) {
        eventDetails.innerHTML = '';
        const header = document.createElement('h4');
        header.textContent = dateStr;
        eventDetails.appendChild(header);

        const incomesForDate = transactions.incomes.filter(t => t.date === dateStr);
        const expensesForDate = transactions.expenses.filter(t => t.date === dateStr);
        const dayTransactions = [...incomesForDate, ...expensesForDate].sort((a,b) => a.id - b.id);

        if (dayTransactions.length === 0) {
            const p = document.createElement('p'); p.textContent = '해당 날짜에 내역이 없습니다.'; eventDetails.appendChild(p); return;
        }

        dayTransactions.forEach(t => {
            const isIncome = transactions.incomes.some(inc => inc.id === t.id);
            const itemDiv = document.createElement('div'); itemDiv.className = 'transaction-item';
            const sign = isIncome ? '+' : '-';
            const info = CATEGORY_DETAILS[t.category] || { name: t.category, color: '#8E8E93' };
            const amountFormatted = t.amount.toLocaleString();

            itemDiv.innerHTML = `<span class="dot" style="background-color: ${info.color};"></span><span class="name">${t.name}</span><span class="amount ${isIncome ? 'income' : 'expense'}">${sign}${amountFormatted}</span>`;
            eventDetails.appendChild(itemDiv);
        });
    }

    // --- 이벤트 핸들러 함수 ---
    // 수입 추가 함수
    function addIncome() {
        if (!selectedDate) { alert('먼저 달력에서 날짜를 선택해주세요.'); return; }
        const name = incomeNameInput.value, category = incomeCategoryInput.value, amount = parseInt(incomeAmountInput.value, 10);
        if (!name || !category || !amount) { alert('모든 수입 정보를 입력해주세요.'); return; }
        transactions.incomes.push({ id: Date.now(), date: selectedDate, name, category, amount });
        saveTransactions(); updateDashboard(); renderDetailsForDate(selectedDate);
        incomeNameInput.value = ''; incomeCategoryInput.value = ''; incomeAmountInput.value = '';
    }

    // 지출 추가 함수
    function addExpense() {
        if (!selectedDate) { alert('먼저 달력에서 날짜를 선택해주세요.'); return; }
        const name = expenseNameInput.value, category = expenseCategoryInput.value, amount = parseInt(expenseAmountInput.value, 10);
        if (!name || !category || !amount) { alert('모든 지출 정보를 입력해주세요.'); return; }
        transactions.expenses.push({ id: Date.now(), date: selectedDate, name, category, amount });
        saveTransactions(); updateDashboard(); renderDetailsForDate(selectedDate);
        expenseNameInput.value = ''; expenseCategoryInput.value = ''; expenseAmountInput.value = '';
    }
    
    // 모든 데이터 초기화 함수
    function resetAllData() {
        const isConfirmed = confirm('정말로 모든 수입 및 지출 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
        if (isConfirmed) {
            localStorage.removeItem('transactions');
            location.reload(); // 페이지 새로고침
        }
    }

    // 금액 입력칸에 숫자만 입력되도록 강제하는 함수
    function enforceNumericInput(event) { event.target.value = event.target.value.replace(/\D/g, ''); }
    incomeAmountInput.addEventListener('input', enforceNumericInput);
    expenseAmountInput.addEventListener('input', enforceNumericInput);

    // --- 애플리케이션 초기화 ---
    function init() {
        // 모든 버튼에 이벤트 리스너 연결
        saveIncomeButton.addEventListener('click', addIncome);
        saveExpenseButton.addEventListener('click', addExpense);
        resetButton.addEventListener('click', resetAllData);
        
        // 페이지 로드 시 오늘 날짜를 기본으로 선택
        selectedDate = formatDate(new Date());
        
        // 데이터 로드 및 화면 렌더링
        loadTransactions();
        updateDashboard();
        renderCalendar();
        renderDetailsForDate(selectedDate);
    }

    init(); // 초기화 함수 실행
});