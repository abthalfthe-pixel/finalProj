import { AuthService } from "../services/AuthService.js";

const authService = new AuthService();

const registerForm = document.getElementById("registerForm");
const alertMessage = document.getElementById("alertMessage");

registerForm.addEventListener("submit", (event) => {
  event.preventDefault(); // מניעת רענון הדף האוטומטי של הטופס

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  try {
    // הפעלת שירות ההרשמה שיוצר את המשתמש ושומר ב-localStorage
    authService.register(username, password, role);

    // הצגת הודעת הצלחה
    alertMessage.className = "alert alert-success";
    alertMessage.textContent = "ההרשמה בוצעה בהצלחה! מעביר אותך לדף הבית...";
    alertMessage.classList.remove("d-none");

    // מעבר אוטומטי לדף הבית אחרי 2 שניות כדי שהמשתמש יוכל להתחבר
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);

  } catch (error) {
    // הצגת שגיאה במידה ושם המשתמש כבר תפוס
    alertMessage.className = "alert alert-danger";
    alertMessage.textContent = error.message;
    alertMessage.classList.remove("d-none");
  }
});