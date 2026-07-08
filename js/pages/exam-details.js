import { initDarkMode } from "../services/ThemeService.js";
import { ExamService } from "../services/ExamService.js";
import { AuthService } from "../services/AuthService.js";

const authService = new AuthService(); // אתחול השירות

// 2. להוסיף את האזנה ללחיצה הזו בכל מקום פנוי בקובץ (למשל בסוף):
document.getElementById("logoutBtn").addEventListener("click", () => {
  authService.logout();
  window.location.href = "index.html"; // חזרה לדף הבית הראשי
});

initDarkMode();
const examService = new ExamService();

// שליפת ה-ID של המבחן מתוך כתובת ה-URL (למשל exam-details.html?id=xxx)
const urlParams = new URLSearchParams(window.location.search);
const examId = urlParams.get("id");

const exam = examService.getExamById(examId);

if (!exam) {
  alert("המבחן לא נמצא במערכת");
  window.location.href = "teacher-dashboard.html";
}

// 1. רינדור כותרות ומידע כללי
document.getElementById("examDetailTitle").textContent = `ניהול מבחן: ${exam.title}`;
document.getElementById("displayTitle").textContent = exam.title;
document.getElementById("displayId").textContent = `קוד (ID) לאיתור מבחן: ${exam.id}`;
document.getElementById("displayDate").textContent = `תאריך יצירה: ${new Date(exam.createdAt).toLocaleString()}`;

// 2. רינדור השאלות של המבחן והצגת התשובה הנכונה למרצה
function renderQuestions() {
  const container = document.getElementById("questionsListContainer");
  container.innerHTML = "";

  if (exam.questions.length === 0) {
    container.innerHTML = "<p class='text-muted text-center'>אין שאלות במבחן זה</p>";
    return;
  }

  exam.questions.forEach((q, index) => {
    const div = document.createElement("div");
    div.className = "p-2 border-bottom mb-2";
    div.innerHTML = `
      <h6><strong>${index + 1}. ${q.text}</strong></h6>
      <ul class="list-unstyled ps-3 small">
        ${q.answers.map((ans, aIdx) => `
          <li class="${aIdx === q.correctAnswerIndex ? 'text-success fw-bold' : 'text-secondary'}">
            ${aIdx === q.correctAnswerIndex ? '✓ ' : '• '} ${ans}
          </li>
        `).join("")}
      </ul>
    `;
    container.appendChild(div);
  });
}

// 3. סינון ורינדור הציונים השייכים למבחן זה בלבד
function loadExamSubmissions() {
  const submissionsData = localStorage.getItem("quiz_submissions");
  const tableBody = document.getElementById("examSubmissionsTable");
  if (!submissionsData || !tableBody) return;

  const submissions = JSON.parse(submissionsData);
  // סינון: לוקחים רק הגשות שה-examId שלהן מתאים למבחן הנוכחי
  const filtered = submissions.filter(sub => sub.examTitle === exam.title); // או לפי ID אם שמרת

  if (filtered.length === 0) return;

  tableBody.innerHTML = "";
  filtered.forEach(sub => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${sub.studentName}</strong></td>
      <td><small>${sub.date}</small></td>
      <td class="fw-bold ${sub.percent >= 60 ? 'text-success' : 'text-danger'}">${sub.percent}%</td>
    `;
    tableBody.appendChild(row);
  });
}

renderQuestions();
loadExamSubmissions();