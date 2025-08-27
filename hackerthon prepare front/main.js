document.addEventListener('DOMContentLoaded', () => {

    // =================================================
    //  Theme Toggle Logic
    // =================================================
    const lightThemeButton = document.getElementById('light-theme-button');
    const darkThemeButton = document.getElementById('dark-theme-button');
    const body = document.body;

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
    function applyTheme(theme) {
        body.classList.toggle('light-theme', theme === 'light');
        lightThemeButton.classList.toggle('active', theme === 'light');
        darkThemeButton.classList.toggle('active', theme !== 'light');
        setHeaderBackground();
        localStorage.setItem('theme', theme);
    }
    lightThemeButton.addEventListener('click', () => applyTheme('light'));
    darkThemeButton.addEventListener('click', () => applyTheme('dark'));
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    
    // =================================================
    //  Dashboard & Calendar Shared State and Helpers
    // =================================================
    let selectedDate = null; 
    
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // =================================================
    //  Calendar Logic
    // =================================================
    const monthYearElement = document.getElementById('month-year');
    const calendarGrid = document.querySelector('.calendar-grid');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    let currentDate = new Date();

    function renderCalendar() {
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
    prevMonthButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

    calendarGrid.addEventListener('click', (event) => {
        const target = event.target;
        if (!target.classList.contains('day-number')) return;

        const currentSelected = calendarGrid.querySelector('.selected');
        if (currentSelected) {
            currentSelected.classList.remove('selected');
        }
        target.classList.add('selected');
        selectedDate = target.dataset.date;
        renderDetailsForDate(selectedDate);
    });

    
    // =================================================
    //  Dashboard Logic
    // =================================================
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

    let transactions = { incomes: [], expenses: [] };
    const INCOME_COLOR = '#0A84FF';
    const CATEGORY_DETAILS = {
        salary: { name: '월급', color: INCOME_COLOR },
        bonus: { name: '상여', color: INCOME_COLOR },
        investment: { name: '투자', color: INCOME_COLOR },
        communication: { name: '통신비', color: '#32D74B' },
        transportation: { name: '교통비', color: '#A964E8' },
        savings: { name: '저금', color: '#5856D6' },
        living: { name: '생활비', color: '#FF9500' },
        food: { name: '식비', color: '#FF453A' },
        medical: { name: '병원비', color: '#FF2D55' },
        etc: { name: '기타', color: '#8E8E93' }
    };

    function loadTransactions() { const saved = localStorage.getItem('transactions'); if(saved) transactions = JSON.parse(saved); }
    function saveTransactions() { localStorage.setItem('transactions', JSON.stringify(transactions)); }

    function updateDashboard() {
        const totalIncome = transactions.incomes.reduce((s, t) => s + t.amount, 0);
        const totalExpense = transactions.expenses.reduce((s, t) => s + t.amount, 0);
        const remaining = totalIncome - totalExpense;
        let percentage = totalIncome > 0 ? (remaining / totalIncome) * 100 : 0;
        
        remainingAmountSpan.textContent = `남은 돈 ${Math.round(percentage)}%`;
        progressBarFill.style.width = `${percentage < 0 ? 0 : percentage}%`;

        const expenseByCategory = {};
        transactions.expenses.forEach(e => { if (!expenseByCategory[e.category]) expenseByCategory[e.category] = 0; expenseByCategory[e.category] += e.amount; });
        
        legendUl.innerHTML = '';
        const sortedCategories = Object.keys(expenseByCategory).sort((a,b)=>expenseByCategory[b]-expenseByCategory[a]);

        sortedCategories.forEach(catKey => {
            const amount = expenseByCategory[catKey];
            const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
            const info = CATEGORY_DETAILS[catKey] || {name: catKey, color:'#8E8E93'};
            const li = document.createElement('li');
            li.innerHTML = `<span class="dot" style="background-color:${info.color};"></span><span class="label">${info.name}</span><span class="dashes"></span><span>${pct.toFixed(1)}%</span>`;
            legendUl.appendChild(li);
        });

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

    function addIncome() {
        if (!selectedDate) { alert('먼저 달력에서 날짜를 선택해주세요.'); return; }
        const name = incomeNameInput.value, category = incomeCategoryInput.value, amount = parseInt(incomeAmountInput.value, 10);
        if (!name || !category || !amount) { alert('모든 수입 정보를 입력해주세요.'); return; }
        transactions.incomes.push({ id: Date.now(), date: selectedDate, name, category, amount });
        saveTransactions(); updateDashboard(); renderDetailsForDate(selectedDate);
        incomeNameInput.value = ''; incomeCategoryInput.value = ''; incomeAmountInput.value = '';
    }

    function addExpense() {
        if (!selectedDate) { alert('먼저 달력에서 날짜를 선택해주세요.'); return; }
        const name = expenseNameInput.value, category = expenseCategoryInput.value, amount = parseInt(expenseAmountInput.value, 10);
        if (!name || !category || !amount) { alert('모든 지출 정보를 입력해주세요.'); return; }
        transactions.expenses.push({ id: Date.now(), date: selectedDate, name, category, amount });
        saveTransactions(); updateDashboard(); renderDetailsForDate(selectedDate);
        expenseNameInput.value = ''; expenseCategoryInput.value = ''; expenseAmountInput.value = '';
    }
    
    function resetAllData() {
        const isConfirmed = confirm('정말로 모든 수입 및 지출 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
        if (isConfirmed) {
            localStorage.removeItem('transactions');
            location.reload();
        }
    }

    function enforceNumericInput(event) { event.target.value = event.target.value.replace(/\D/g, ''); }
    incomeAmountInput.addEventListener('input', enforceNumericInput);
    expenseAmountInput.addEventListener('input', enforceNumericInput);

    function init() {
        saveIncomeButton.addEventListener('click', addIncome);
        saveExpenseButton.addEventListener('click', addExpense);
        resetButton.addEventListener('click', resetAllData);
        
        selectedDate = formatDate(new Date());
        loadTransactions();
        updateDashboard();
        renderCalendar();
        renderDetailsForDate(selectedDate);
    }

    init();
});