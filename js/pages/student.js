// 1. להוסיף את ה-import הזה ממש בשורה הראשונה למעלה:
import { initDarkMode } from "../services/ThemeService.js";

// 2. להוסיף את השורה הזו בתוך פונקציית הטעינה או בסוף הקובץ:
initDarkMode();
import { ExamService } from "../services/ExamService.js";
import { ExamUI } from "../ui/ExamUI.js";
import { AuthService } from "../services/AuthService.js";

const authService = new AuthService();
const examService = new ExamService();
const examUI = new ExamUI(examService);

// 🔒 אבטחה: בדיקה שהמשתמש מחובר והוא אכן סטודנט
const currentUser = authService.getCurrentUser();
if (!currentUser || currentUser.role !== "student") {
  alert("אזור זה מיועד לסטודנטים בלבד!");
  window.location.href = "index.html";
}

// עדכון כותרת ברוך הבא
document.getElementById("welcomeTitle").textContent = `פאנל סטודנט - שלום, ${currentUser.username}`;

// ניתוק מהמערכת
document.getElementById("logoutBtn").addEventListener("click", () => {
  authService.logout();
  window.location.href = "index.html";
});

const examListElement = document.getElementById("examList");
const searchBar = document.getElementById("searchBar");

examListElement.addEventListener("click", event => {
  const examId = event.target.dataset.id;

  if (event.target.classList.contains("run-btn")) {
    const exam = examService.getExamById(examId);
    
    // --- שורה חדשה: מציגה את אזור ביצוע המבחן הפעיל ---
    document.getElementById("runnerContainer").classList.remove("d-none");
    // --------------------------------------------------

    // הפעלת רץ המבחנים המקורי מהכיתה בתוך הלוח של הסטודנט
    examUI.renderExamRunner(exam);
    
    // גלילה חלקה למעלה כדי שהסטודנט יראה את השאלות מיד
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// מנגנון סינון וחיפוש מבחנים בזמן אמת
searchBar.addEventListener("input", (e) => {
  const keyword = e.target.value.toLowerCase();
  const examCards = document.querySelectorAll(".exam-card");

  examCards.forEach(card => {
    const title = card.querySelector("h5").textContent.toLowerCase();
    if (title.includes(keyword)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
});

// טעינה ראשונית של המבחנים שהמורה יצר
examUI.renderExamList();

// הסתרת כפתורי המחיקה (Delete) של המורה מהדף של הסטודנט באמצעות CSS דינמי
const style = document.createElement('style');
style.innerHTML = '.delete-btn { display: none !important; }';
document.head.appendChild(style);

// טעינת היסטוריה וסטטיסטיקות לסטודנט
function loadStudentStats() {
  const submissionsData = localStorage.getItem("quiz_submissions");
  if (!submissionsData) return;

  const allSubmissions = JSON.parse(submissionsData);
  // סינון התוצאות השייכות אך ורק לסטודנט המחובר כרגע
  const mySubmissions = allSubmissions.filter(s => s.studentName === currentUser.username);

  if (mySubmissions.length === 0) return;

  document.getElementById("totalTaken").textContent = mySubmissions.length;

  let totalPercent = 0;
  const tableBody = document.getElementById("historyTableBody");
  tableBody.innerHTML = "";

  mySubmissions.forEach(sub => {
    totalPercent += sub.percent;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${sub.examTitle}</td>
      <td>${sub.date}</td>
      <td>${sub.score}/${sub.totalQuestions}</td>
      <td class="fw-bold ${sub.percent >= 60 ? 'text-success' : 'text-danger'}">${sub.percent}%</td>
    `;
    tableBody.appendChild(row);
  });

  const avg = Math.round(totalPercent / mySubmissions.length);
  document.getElementById("averageScore").textContent = `${avg}%`;
}

loadStudentStats();