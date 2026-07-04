// 1. להוסיף את ה-import הזה ממש בשורה הראשונה למעלה:
import { initDarkMode } from "../services/ThemeService.js";

// 2. להוסיף את השורה הזו בתוך פונקציית הטעינה או בסוף הקובץ:
initDarkMode();
import { AuthService } from "../services/AuthService.js";

const authService = new AuthService();

const loginForm = document.getElementById("loginForm");
const alertMessage = document.getElementById("alertMessage");

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    // ניסיון התחברות דרך השירות שלנו
    const user = authService.login(username, password);

    alertMessage.className = "alert alert-success";
    alertMessage.textContent = `התחברת בהצלחה! ברוך הבא, ${user.username}. טוען דף בית...`;
    alertMessage.classList.remove("d-none");

    // ניתוב דינמי לפי סוג המשתמש (מורה או סטודנט) כפי שנדרש במטלה
    setTimeout(() => {
      if (user.role === "teacher") {
        window.location.href = "teacher-dashboard.html";
      } else {
        window.location.href = "student-dashboard.html";
      }
    }, 1500);

  } catch (error) {
    // הצגת הודעת שגיאה אם הפרטים לא נכונים
    alertMessage.className = "alert alert-danger";
    alertMessage.textContent = error.message;
    alertMessage.classList.remove("d-none");
  }
});