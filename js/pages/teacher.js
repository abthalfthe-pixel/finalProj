import { Exam } from "../models/Exam.js";
import { Question } from "../models/Question.js";
import { ExamService } from "../services/ExamService.js";
import { ExamUI } from "../ui/ExamUI.js";
import { AuthService } from "../services/AuthService.js";

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

// --- חיבור הלוגיקה המקורית מהכיתה ---
let currentExam = null;

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

  if (!currentExam) {
    currentExam = new Exam(title);
  }

  const correctAnswerIndex = correctAnswerNumber - 1;
  const question = new Question(questionText, answers, correctAnswerIndex);
  currentExam.addQuestion(question);

  examUI.showBuilderMessage(
    `השאלה נוספה בהצלחה! למבחן הנוכחי יש ${currentExam.getQuestionCount()} שאלות.`,
    "success"
  );

  clearQuestionInputs();
});

saveExamBtn.addEventListener("click", () => {
  if (!currentExam) {
    examUI.showBuilderMessage("צור מבחן והוסף לפחות שאלה אחת תחילה.", "danger");
    return;
  }
  if (currentExam.getQuestionCount() === 0) {
    examUI.showBuilderMessage("לא ניתן לשמור מבחן ללא שאלות.", "danger");
    return;
  }

  examService.saveExam(currentExam);
  examUI.showBuilderMessage("המבחן נשמר במערכת בהצלחה!", "success");

  currentExam = null;
  examTitleInput.value = "";
  examUI.renderExamList();
});

examListElement.addEventListener("click", event => {
  const examId = event.target.dataset.id;

  if (event.target.classList.contains("run-btn")) {
    document.getElementById("previewContainer").classList.remove("d-none");
    const exam = examService.getExamById(examId);
    examUI.renderExamRunner(exam);
  }

  if (event.target.classList.contains("delete-btn")) {
    const confirmed = confirm("האם אתה בטוח שברצונך למחוק מבחן זה?");
    if (!confirmed) return;

    examService.deleteExam(examId);
    examUI.renderExamList();
  }
});

function clearQuestionInputs() {
  questionTextInput.value = "";
  answer1Input.value = "";
  answer2Input.value = "";
  answer3Input.value = "";
  answer4Input.value = "";
  correctAnswerInput.value = "";
}

// טעינה ראשונית של המבחנים הקיימים
examUI.renderExamList();