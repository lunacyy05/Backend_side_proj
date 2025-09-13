// HTML에서 필요한 요소들을 모두 가져옵니다.
const amountInput = document.getElementById('amount');
const fromCurrencySelect = document.getElementById('from-currency');
const toCurrencySelect = document.getElementById('to-currency');
const swapButton = document.querySelector('.swap');
const convertButton = document.getElementById('convert-btn');
const resultText = document.getElementById('result-text');

// 환율 계산 및 결과 표시를 위한 메인 함수
async function calculate() {
    // 선택된 통화와 입력된 금액을 가져옵니다.
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;
    const amount = amountInput.value;

    // 입력 금액이 유효한지 확인합니다.
    if (amount === '' || amount <= 0) {
        resultText.textContent = '유효한 금액을 입력해주세요.';
        return;
    }

    // 사용자에게 API 요청 중임을 알립니다.
    resultText.textContent = '환율 정보를 가져오는 중...';

    try {
        // ❗️ 중요: 아래 API 키는 본인의 키로 교체해야 합니다.
        // ExchangeRate-API (https://www.exchangerate-api.com) 에서 무료 API 키를 발급받으세요.
        const apiKey = '0400c943c967be6b58ef6180'; // <-- 여기에 자신의 API 키를 입력하세요!
        
        // API에 환율 정보를 요청합니다.
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${fromCurrency}`);
        const data = await response.json();

        // API 요청이 실패했을 경우 에러 메시지를 표시합니다.
        if (data.result === 'error') {
            throw new Error('API 요청에 실패했습니다. API 키를 확인해주세요.');
        }

        // '받는 통화'에 해당하는 환율을 가져옵니다.
        const rate = data.conversion_rates[toCurrency];
        
        // 최종 변환된 금액을 계산합니다.
        const convertedAmount = amount * rate;
        
        // 결과를 보기 좋게 포맷팅하여 화면에 표시합니다.
        // Intl.NumberFormat을 사용하면 세 자리마다 콤마(,)를 찍어줍니다.
        const fromAmountFormatted = new Intl.NumberFormat('en-US').format(amount);
        const toAmountFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: toCurrency }).format(convertedAmount);
        
        resultText.textContent = `${fromAmountFormatted} ${fromCurrency} = ${toAmountFormatted}`;

    } catch (error) {
        // 네트워크 오류나 기타 문제가 발생했을 경우 에러 메시지를 표시합니다.
        console.error('Error fetching exchange rate:', error);
        resultText.textContent = '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
}

// '계산하기' 버튼 클릭 시 calculate 함수를 실행합니다.
convertButton.addEventListener('click', calculate);

// 통화 스왑(교환) 아이콘 클릭 시
swapButton.addEventListener('click', () => {
    // '보내는 통화'와 '받는 통화'의 값을 서로 바꿉니다.
    const temp = fromCurrencySelect.value;
    fromCurrencySelect.value = toCurrencySelect.value;
    toCurrencySelect.value = temp;

    // 통화를 바꾼 후 바로 다시 계산하여 결과를 업데이트합니다.
    calculate();
});

// 페이지가 처음 로드될 때 기본값으로 한 번 계산을 실행합니다.
calculate();