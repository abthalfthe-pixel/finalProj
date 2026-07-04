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

// האזנה ללחיצה על מבחן ברשימה
examListElement.addEventListener("click", event => {
  const examId = event.target.dataset.id;

  if (event.target.classList.contains("run-btn")) {
    const exam = examService.getExamById(examId);
    
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