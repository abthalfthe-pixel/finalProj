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

// 🔒 אבטחה
const currentUser = authService.getCurrentUser();
if (!currentUser || currentUser.role !== "teacher") {
  alert("אזור זה מיועד למורים בלבד!");
  window.location.href = "index.html";
}

document.getElementById("welcomeTitle").textContent = `פאנל מורה - שלום, ${currentUser.username}`;

document.getElementById("logoutBtn").addEventListener("click", () => {
  authService.logout();
  window.location.href = "index.html";
});

// משתני מצב לעריכה ויצירה
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

// 1. הוספת שאלה למבחן (חדש או קיים בעריכה)
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

  // אם אנחנו יוצרים מבחן חדש מאפס
  if (!currentExam) {
    currentExam = new Exam(title, currentUser.username);
  } else {
    currentExam.title = title; // עדכון השם למקרה שהשתנה בתיבה
  }

  const correctAnswerIndex = correctAnswerNumber - 1;
  const question = new Question(questionText, answers, correctAnswerIndex);
  
  // הוספת השאלה למערך השאלות של האובייקט
  currentExam.addQuestion(question);

  examUI.showBuilderMessage(
    `השאלה נוספה בהצלחה! למבחן יש כרגע ${currentExam.getQuestionCount()} שאלות.`,
    "success"
  );

  clearQuestionInputs();
});

// 2. שמירת המבחן ועדכונו האמיתי ב-Storage
saveExamBtn.addEventListener("click", () => {
  const title = examTitleInput.value.trim();
  if (!title) {
    examUI.showBuilderMessage("אנא הזן שם מבחן.", "danger");
    return;
  }

  const allExams = examService.getAllExams();

  if (isEditingExisting && currentExam) {
    // מוד מצב עריכה: מעדכנים את השם ודורסים את הישן ב-Storage
    currentExam.title = title;
    
    const updatedExams = allExams.map(e => e.id === currentExam.id ? currentExam : e);
    localStorage.setItem(examService.storageKey, JSON.stringify(updatedExams));
    examUI.showBuilderMessage("המבחן עודכן בהצלחה בזיכרון המערכת!", "success");
  } else {
    // מוד מבחן חדש: בודקים שיש לפחות שאלה אחת ושומרים
    if (!currentExam) {
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
  refreshDashboard();
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

      // 1. הוספת כפתור "ערוך שאלות ושם" (הכפתור הכחול לטעינה לטופס)
      if (!card.querySelector(".load-to-form-btn")) {
        const loadBtn = document.createElement("button");
        loadBtn.className = "btn btn-sm btn-outline-primary load-to-form-btn me-1";
        loadBtn.textContent = "📝 ערוך שאלות ושם";
        loadBtn.dataset.id = examId;
        deleteBtn.parentNode.insertBefore(loadBtn, deleteBtn);
      }

      // 2. 🎉 הוספת הכפתור הצהוב שמעביר לדף הציונים והפרטים (היה חסר!)
      if (!card.querySelector(".edit-btn")) {
        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-sm btn-warning edit-btn me-1";
        editBtn.textContent = "ציוני סטודנטים ➔";
        editBtn.dataset.id = examId;
        deleteBtn.parentNode.insertBefore(editBtn, deleteBtn);
      }
    }
  });
}

// האזנה מרכזית ללחיצות ברשימת המבחנים
examListElement.addEventListener("click", event => {
  const examId = event.target.dataset.id;
  if (!examId) return;

  // א. כפתור ציונים (מעביר לעמוד הציונים)
  if (event.target.classList.contains("edit-btn")) {
    window.location.href = `exam-details.html?id=${examId}`;
  }

  // ב. כפתור טעינת המבחן חזרה לטופס לצורך הוספת שאלות או עדכון שם
  if (event.target.classList.contains("load-to-form-btn")) {
    const allExams = examService.getAllExams();
    const exam = allExams.find(e => e.id === examId);
    if (!exam) return;

    // שחזור מתודות ה-OOP של המחלקה שנמחקו בגלל ה-JSON
    currentExam = new Exam(exam.title, exam.creator);
    currentExam.id = exam.id;
    currentExam.createdAt = exam.createdAt;
    currentExam.questions = exam.questions || [];
    
    // הפיכת פונקציית addQuestion מחדש לזמינה על האובייקט המשוחזר
    currentExam.addQuestion = function(q) { this.questions.push(q); };
    currentExam.getQuestionCount = function() { return this.questions.length; };

    isEditingExisting = true;

    // עדכון הממשק החזותי של הטופס הימני
    examTitleInput.value = currentExam.title;
    formActionTitle.textContent = `עריכת מבחן קיים: ${currentExam.title}`;
    saveExamBtn.textContent = "עדכן ושמור שינויים במבחן";
    clearEditBtn.classList.remove("d-none");
    
    examUI.showBuilderMessage(`המבחן נטען לטופס! יש לו ${currentExam.getQuestionCount()} שאלות קיימות. כעת את יכולה להוסיף שאלות חדשות או לשנות את שם המבחן, ובסיום ללחוץ על הכפתור הכחול למטה.`, "info");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ג. כפתור מחיקה
  if (event.target.classList.contains("delete-btn")) {
    if (!confirm("האם אתה בטוח שברצונך למחוק מבחן זה?")) return;
    examService.deleteExam(examId);
    if (currentExam && currentExam.id === examId) resetFormState();
    refreshDashboard();
  }
});

function refreshDashboard() {
  examUI.renderExamList();
  addActionButtonsToUI();
}

// הרצה ראשונית
refreshDashboard();