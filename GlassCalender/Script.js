const monthYear = document.getElementById("monthYear");
const calendarBody = document.getElementById("calendar-body");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const memoModal = document.getElementById("memoModal");
const closeModal = document.getElementById("closeModal");
const memoDate = document.getElementById("memoDate");
const memoText = document.getElementById("memoText");
const saveMemoBtn = document.getElementById("saveMemo");
const deleteMemoBtn = document.getElementById("deleteMemo");

let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

const months = ["1월","2월","3월","4월","5월","6월",
  "7월","8월","9월","10월","11월","12월"];

let memos = JSON.parse(localStorage.getItem("calendarMemos")) || {};

function renderCalendar(month, year) {
  calendarBody.innerHTML = "";

  monthYear.innerText = `${year}년 ${months[month]}`;

  let firstDay = new Date(year, month).getDay();
  let daysInMonth = new Date(year, month + 1, 0).getDate();

  let date = 1;
  for (let i = 0; i < 6; i++) {
    let row = document.createElement("tr");

    for (let j = 0; j < 7; j++) {
      let cell = document.createElement("td");

      if (i === 0 && j < firstDay) {
        cell.innerText = "";
      } else if (date > daysInMonth) {
        break;
      } else {
        const key = `${year}-${month+1}-${date}`;

        // 날짜 숫자
        let dayDiv = document.createElement("div");
        dayDiv.innerText = date;
        cell.appendChild(dayDiv);

        // 일정 표시
        if (memos[key]) {
          let memoDiv = document.createElement("span");
          memoDiv.classList.add("memo");
          memoDiv.innerText = memos[key];
          cell.appendChild(memoDiv);
        }

        // 오늘 강조
        if (
          date === today.getDate() &&
          year === today.getFullYear() &&
          month === today.getMonth()
        ) {
          cell.classList.add("today");
        }

        // 클릭 이벤트
        cell.addEventListener("click", () => openMemoModal(key));

        date++;
      }
      row.appendChild(cell);
    }
    calendarBody.appendChild(row);
  }
}

// 모달 열기
function openMemoModal(key) {
  memoModal.style.display = "flex";
  memoDate.textContent = key;
  memoText.value = memos[key] || "";
}

// 모달 닫기
closeModal.addEventListener("click", () => {
  memoModal.style.display = "none";
});

// 저장
saveMemoBtn.addEventListener("click", () => {
  const key = memoDate.textContent;
  memos[key] = memoText.value.trim();
  localStorage.setItem("calendarMemos", JSON.stringify(memos));
  memoModal.style.display = "none";
  renderCalendar(currentMonth, currentYear);
});

// 삭제
deleteMemoBtn.addEventListener("click", () => {
  const key = memoDate.textContent;
  delete memos[key];
  localStorage.setItem("calendarMemos", JSON.stringify(memos));
  memoModal.style.display = "none";
  renderCalendar(currentMonth, currentYear);
});

// 이전/다음 달 이동
prevBtn.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar(currentMonth, currentYear);
});
nextBtn.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentMonth, currentYear);
});

// 초기 렌더링
renderCalendar(currentMonth, currentYear);
