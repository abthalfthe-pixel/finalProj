import { initDarkMode } from "../services/ThemeService.js";
import { Exam } from "../models/Exam.js";
import { Question } from "../models/Question.js";
import { ExamService } from "../services/ExamService.js";
import { ExamUI } from "../ui/ExamUI.js";
import { AuthService } from "../services/AuthService.js";

// הפעלת מצב כהה/בהיר
initDarkMode();

const authService = new AuthService();
const examService = new ExamService();
const examUI = new ExamUI(examService);

// 🔒 אבטחה: בדיקה שהמשתמש מחובר והוא אכן מורה
const currentUser = authService.getCurrentUser();
if (!currentUser || currentUser.role !== "teacher") {
  alert("אזור זה מיועד למורים בלבד!");
  window.location.href = "index.html";
}

// עדכון כותרת ברוך הבא
document.getElementById("welcomeTitle").textContent = `פאנל מורה - שלום, ${currentUser.username}`;

// ניתוק מהמערכת
document.getElementById("logoutBtn").addEventListener("click", () => {
  authService.logout();
  window.location.href = "index.html";
});

// משתנה שיחזיק את המבחן שנמצא כרגע בעבודה
let currentExam = null;
let isEditingExisting = false; 

const examTitleInput = document.getElementById("examTitle");
const questionTextInput = document.getElementById("questionText");
const answer1Input = document.getElementById("answer1");
const answer2Input = document.getElementById("answer2");
const answer3Input = document.getElementById("answer3");
const answer4Input = document.getElementById("answer4");
const correctAnswerInput = document.getElementById("correctAnswer");

const addQuestionBtn = document.getElementById("addQuestionBtn");
const saveExamBtn = document.getElementById("saveExamBtn");
const examListElement = document.getElementById("examList");
const formActionTitle = document.getElementById("formActionTitle");
const clearEditBtn = document.getElementById("clearEditBtn");

// הוספת שאלה למבחן הנוכחי
addQuestionBtn.addEventListener("click", () => {
  const title = examTitleInput.value.trim();
  const questionText = questionTextInput.value.trim();
  const answers = [
    answer1Input.value.trim(),
    answer2Input.value.trim(),
    answer3Input.value.trim(),
    answer4Input.value.trim()
  ];
  const correctAnswerNumber = Number(correctAnswerInput.value);

  if (!title) {
    examUI.showBuilderMessage("אנא הכנס שם מבחן.", "danger");
    return;
  }
  if (!questionText) {
    examUI.showBuilderMessage("אנא הכנס את טקסט השאלה.", "danger");
    return;
  }
  if (answers.some(answer => answer === "")) {
    examUI.showBuilderMessage("אנא מלא את כל 4 התשובות.", "danger");
    return;
  }
  if (correctAnswerNumber < 1 || correctAnswerNumber > 4) {
    examUI.showBuilderMessage("מספר התשובה הנכונה חייב להיות בין 1 ל-4.", "danger");
    return;
  }

  // שיוך אוטומטי למרצה המחובר
  if (!currentExam) {
    currentExam = new Exam(title, currentUser.username);
  } else {
    currentExam.title = title;
  }

  const correctAnswerIndex = correctAnswerNumber - 1;
  const question = new Question(questionText, answers, correctAnswerIndex);
  currentExam.addQuestion(question);

  examUI.showBuilderMessage(
    `השאלה נוספה בהצלחה! למבחן יש כרגע ${currentExam.getQuestionCount()} שאלות.`,
    "success"
  );

  clearQuestionInputs();
});

// שמירת המבחן (חדש או מעודכן) ב-Storage
saveExamBtn.addEventListener("click", () => {
  const title = examTitleInput.value.trim();
  
  if (isEditingExisting && currentExam) {
    if (title) currentExam.title = title;
    
    const allExams = examService.getAllExams();
    const updatedExams = allExams.map(e => e.id === currentExam.id ? currentExam : e);
    localStorage.setItem(examService.storageKey, JSON.stringify(updatedExams));
    examUI.showBuilderMessage("המבחן עודכן בהצלחה!", "success");
  } else {
    if (!currentExam) {
      if (!title) {
        examUI.showBuilderMessage("אנא הזן שם מבחן תחילה.", "danger");
        return;
      }
      // הוספת שם המרצה גם ביצירה ישירה
      currentExam = new Exam(title, currentUser.username);
    }
    if (currentExam.getQuestionCount() === 0) {
      examUI.showBuilderMessage("לא ניתן לשמור מבחן ללא שאלות.", "danger");
      return;
    }
    examService.saveExam(currentExam);
    examUI.showBuilderMessage("המבחן החדש נשמר בהצלחה!", "success");
  }

  resetFormState();
  examUI.renderExamList();
  loadTeacherSubmissions();
  addActionButtonsToUI();
});

// ביטול מצב עריכה
clearEditBtn.addEventListener("click", resetFormState);

function resetFormState() {
  currentExam = null;
  isEditingExisting = false;
  examTitleInput.value = "";
  formActionTitle.textContent = "יצירת מבחן חדש";
  saveExamBtn.textContent = "שמור מבחן במערכת";
  clearEditBtn.classList.add("d-none");
  examUI.clearBuilderMessage();
  clearQuestionInputs();
}

function clearQuestionInputs() {
  questionTextInput.value = "";
  answer1Input.value = "";
  answer2Input.value = "";
  answer3Input.value = "";
  answer4Input.value = "";
  correctAnswerInput.value = "";
}

// טעינת טבלת ההגשות של התלמידים במערכת
function loadTeacherSubmissions() {
  const submissionsData = localStorage.getItem("quiz_submissions");
  const tableBody = document.getElementById("teacherSubmissionsTable");
  if (!submissionsData || !tableBody) return;

  const submissions = JSON.parse(submissionsData);
  if (submissions.length === 0) return;

  tableBody.innerHTML = "";
  submissions.forEach(sub => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${sub.studentName}</strong></td>
      <td>${sub.examTitle}</td>
      <td><small>${sub.date}</small></td>
      <td class="fw-bold ${sub.percent >= 60 ? 'text-success' : 'text-danger'}">${sub.percent}%</td>
    `;
    tableBody.appendChild(row);
  });
}

// עדכון כפתורי הפעולה וסינון מבחנים של מרצים אחרים
function addActionButtonsToUI() {
  const cards = document.querySelectorAll(".exam-card");
  const allExams = examService.getAllExams();

  cards.forEach(card => {
    const runBtn = card.querySelector(".run-btn");
    if (runBtn) runBtn.remove(); 

    const deleteBtn = card.querySelector(".delete-btn");
    if (deleteBtn) {
      const examId = deleteBtn.dataset.id;
      const currentExamData = allExams.find(e => e.id === examId);

      // 🔒 מנגנון סינון: מראה רק את המבחנים של המרצה הנוכחי
      if (currentExamData && currentExamData.creator !== currentUser.username) {
        card.remove();
        return;
      }

      if (card.querySelector(".edit-btn")) return;

      // יצירת כפתור ניהול וצפייה בציונים
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-sm btn-warning edit-btn me-1";
      editBtn.textContent = "פרטי מבחן וציונים ➔";
      editBtn.dataset.id = examId;
      deleteBtn.parentNode.insertBefore(editBtn, deleteBtn);
    }
  });
}

// 🎯 האזנה אחת מרכזית ותקינה ללחיצות על רשימת המבחנים
examListElement.addEventListener("click", event => {
  const examId = event.target.dataset.id;

  // מעבר לדף הפרטים והציונים החדש
  if (event.target.classList.contains("edit-btn")) {
    window.location.href = `exam-details.html?id=${examId}`;
  }

  // מחיקה
  if (event.target.classList.contains("delete-btn")) {
    const confirmed = confirm("האם אתה בטוח שברצונך למחוק מבחן זה?");
    if (!confirmed) return;

    examService.deleteExam(examId);
    if (currentExam && currentExam.id === examId) {
      resetFormState();
    }
    examUI.renderExamList();
    loadTeacherSubmissions();
    addActionButtonsToUI();
  }
});

// הפעלה ראשונית של הדף
examUI.renderExamList();
loadTeacherSubmissions();
addActionButtonsToUI();