// HTML 요소 가져오기
const amountInput = document.getElementById('amount');
const fromCurrencySelect = document.getElementById('from-currency');
const toCurrencySelect = document.getElementById('to-currency');
const swapButton = document.querySelector('.swap');
const convertButton = document.getElementById('convert-btn');
const resultText = document.getElementById('result-text');
const chartCanvas = document.getElementById('exchange-rate-chart');
const chartLoadingText = document.getElementById('chart-loading-text');

// 가상화폐와 법정화폐 목록 정의 (API 호출 시 구분하기 위함)
const CRYPTO_CURRENCIES = ['BTC', 'ETH', 'XRP'];
const COINGECKO_IDS = { // CoinGecko API에서 사용하는 ID
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'XRP': 'ripple'
};

let chartInstance = null; // 차트 객체를 저장할 변수

/**
 * 메인 계산 함수
 */
async function calculate() {
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;
    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) {
        resultText.textContent = '유효한 금액을 입력해주세요.';
        return;
    }

    if (fromCurrency === toCurrency) {
        resultText.textContent = `${new Intl.NumberFormat().format(amount)} ${fromCurrency}`;
        updateChart(); // 같은 통화라도 차트는 업데이트
        return;
    }

    resultText.textContent = '환율 정보를 가져오는 중...';

    try {
        let rate;
        const isFromCrypto = CRYPTO_CURRENCIES.includes(fromCurrency);
        const isToCrypto = CRYPTO_CURRENCIES.includes(toCurrency);

        // API 라우팅 로직
        if (!isFromCrypto && !isToCrypto) { // 법정화폐 -> 법정화폐
            const response = await fetch(`https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`);
            const data = await response.json();
            rate = data.rates[toCurrency];
        } else { // 가상화폐 관련 계산 (CoinGecko API 사용)
            let fromId = isFromCrypto ? COINGECKO_IDS[fromCurrency] : fromCurrency.toLowerCase();
            let toId = isToCrypto ? COINGECKO_IDS[toCurrency] : toCurrency.toLowerCase();

            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${fromId}&vs_currencies=${toId}`);
            const data = await response.json();
            rate = data[fromId][toId];
        }

        if (!rate) {
            throw new Error('환율 정보를 가져올 수 없습니다.');
        }

        const convertedAmount = amount * rate;
        
        // 결과 텍스트 포맷팅
        const fromAmountFormatted = new Intl.NumberFormat('en-US').format(amount);
        const toAmountFormatted = new Intl.NumberFormat('en-US', {
            maximumFractionDigits: isToCrypto ? 8 : 2 // 가상화폐는 소수점 길게 표시
        }).format(convertedAmount);
        
        resultText.textContent = `${fromAmountFormatted} ${fromCurrency} ≈ ${toAmountFormatted} ${toCurrency}`;

        // 계산 성공 후 차트 업데이트
        updateChart();

    } catch (error) {
        console.error('계산 오류:', error);
        resultText.textContent = '오류가 발생했습니다. 통화 쌍을 확인해주세요.';
        // 차트 초기화
        if (chartInstance) chartInstance.destroy();
        chartLoadingText.textContent = '환율 데이터를 불러올 수 없습니다.';
    }
}

/**
 * 환율 변동 그래프를 업데이트하는 함수
 */
async function updateChart() {
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;
    const isFromCrypto = CRYPTO_CURRENCIES.includes(fromCurrency);
    const isToCrypto = CRYPTO_CURRENCIES.includes(toCurrency);

    // 기존 차트가 있으면 파괴
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    chartLoadingText.textContent = '그래프 데이터를 로딩 중입니다...';

    if (fromCurrency === toCurrency) {
        chartLoadingText.textContent = '같은 통화는 그래프를 표시할 수 없습니다.';
        return;
    }

    try {
        let labels = [];
        let dataPoints = [];

        // 30일 전 날짜 계산
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        const startDateString = startDate.toISOString().split('T')[0];

        if (!isFromCrypto && !isToCrypto) { // 법정화폐 간 그래프
            const response = await fetch(`https://api.frankfurter.app/${startDateString}..?from=${fromCurrency}&to=${toCurrency}`);
            const data = await response.json();
            
            labels = Object.keys(data.rates).sort();
            labels.forEach(date => {
                dataPoints.push(data.rates[date][toCurrency]);
            });

        } else { // 가상화폐 관련 그래프
            let fromId = isFromCrypto ? COINGECKO_IDS[fromCurrency] : fromCurrency;
            let toId = isToCrypto ? COINGECKO_IDS[toCurrency] : toCurrency;
            
            // CoinGecko는 Fiat을 vs_currency로 요구하므로, 둘 다 Crypto인 경우는 지원이 복잡함.
            // 여기서는 Crypto <-> Fiat 케이스만 정확히 지원.
            if(isFromCrypto && isToCrypto) {
                chartLoadingText.textContent = '가상화폐 간의 직접적인 이력 그래프는 현재 지원되지 않습니다.';
                return;
            }

            const cryptoId = isFromCrypto ? fromId : toId;
            const fiatId = isFromCrypto ? toId : fromId;

            const response = await fetch(`https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=${fiatId}&days=30&interval=daily`);
            const data = await response.json();
            
            data.prices.forEach(priceData => {
                labels.push(new Date(priceData[0]).toLocaleDateString());
                dataPoints.push(priceData[1]);
            });
            
            // Crypto -> Fiat 이면 1/rate 로 환율을 뒤집어줘야 함
            if (isToCrypto) {
                dataPoints = dataPoints.map(p => 1 / p);
            }
        }
        
        chartLoadingText.textContent = ''; // 로딩 완료 후 텍스트 제거

        // Chart.js를 사용하여 그래프 생성
        const ctx = chartCanvas.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${fromCurrency} 대비 ${toCurrency} 환율`,
                    data: dataPoints,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });

    } catch (error) {
        console.error('차트 오류:', error);
        chartLoadingText.textContent = '그래프 데이터를 불러오는 데 실패했습니다.';
    }
}


// 이벤트 리스너 설정
convertButton.addEventListener('click', calculate);
swapButton.addEventListener('click', () => {
    const temp = fromCurrencySelect.value;
    fromCurrencySelect.value = toCurrencySelect.value;
    toCurrencySelect.value = temp;
    calculate();
});

// 페이지 로드 시 초기 계산 실행
calculate();