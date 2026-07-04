export function initDarkMode() {
  // יצירת כפתור המעבר באופן דינמי בראש הדף
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "btn btn-sm btn-outline-warning position-fixed top-0 end-0 m-2";
  toggleBtn.style.zIndex = "9999";
  toggleBtn.innerHTML = "🌓 מצב כהה/בהיר";
  document.body.appendChild(toggleBtn);

  // בדיקה אם המשתמש כבר בחר מצב כהה בעבר
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }

  // האזנה ללחיצה על הכפתור
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    
    // שמירת הבחירה של המשתמש ב-Storage
    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });
}