export class ExamUI {
  constructor(examService) {
    this.examService = examService;

    this.examListElement = document.getElementById("examList");
    this.examRunnerElement = document.getElementById("examRunner");
    this.builderMessageElement = document.getElementById("builderMessage");
  }

  showBuilderMessage(message, type = "success") {
    this.builderMessageElement.innerHTML = `
      <div class="alert alert-${type}">
        ${message}
      </div>
    `;
  }

  clearBuilderMessage() {
    this.builderMessageElement.innerHTML = "";
  }

  renderExamList() {
    const exams = this.examService.getAllExams();

    this.examListElement.innerHTML = "";

    if (exams.length === 0) {
      this.examListElement.innerHTML = `
        <p class="text-muted">No exams saved yet.</p>
      `;
      return;
    }

    exams.forEach(exam => {
      const div = document.createElement("div");
      div.className = "exam-card";

      div.innerHTML = `
        <h5>${exam.title}</h5>

        <p class="small-muted">
          Questions: ${exam.getQuestionCount()}
        </p>

        <p class="small-muted">
          Created: ${new Date(exam.createdAt).toLocaleString()}
        </p>

        <button
          class="btn btn-sm btn-success run-btn"
          data-id="${exam.id}">
          Run Exam
        </button>

        <button
          class="btn btn-sm btn-danger delete-btn"
          data-id="${exam.id}">
          Delete
        </button>
      `;

      this.examListElement.appendChild(div);
    });
  }

  renderExamRunner(exam) {
    if (!exam) {
      this.examRunnerElement.innerHTML = `
        <div class="alert alert-danger">
          Exam not found.
        </div>
      `;
      return;
    }

    if (exam.questions.length === 0) {
      this.examRunnerElement.innerHTML = `
        <div class="alert alert-warning">
          This exam has no questions.
        </div>
      `;
      return;
    }

    this.examRunnerElement.innerHTML = `
      <h4>${exam.title}</h4>
      <p class="text-muted">
        Answer all questions and submit the exam.
      </p>
    `;

    exam.questions.forEach((question, questionIndex) => {
      const questionDiv = document.createElement("div");
      questionDiv.className = "question-box";

      questionDiv.innerHTML = `
        <h5>${questionIndex + 1}. ${question.text}</h5>

        ${question.answers.map((answer, answerIndex) => `
          <label class="answer-label">
            <input
              type="radio"
              name="question-${questionIndex}"
              value="${answerIndex}">
            ${answer}
          </label>
        `).join("")}
      `;

      this.examRunnerElement.appendChild(questionDiv);
    });

    const submitButton = document.createElement("button");
    submitButton.className = "btn btn-primary";
    submitButton.textContent = "Submit Exam";

    submitButton.addEventListener("click", () => {
      this.checkExam(exam);
    });

    this.examRunnerElement.appendChild(submitButton);
  }

  checkExam(exam) {
    let score = 0;

    exam.questions.forEach((question, questionIndex) => {
      const selectedAnswer = document.querySelector(
        `input[name="question-${questionIndex}"]:checked`
      );

      if (!selectedAnswer) {
        return;
      }

      const userAnswerIndex = Number(selectedAnswer.value);

      if (question.isCorrect(userAnswerIndex)) {
        score++;
      }
    });

    const totalQuestions = exam.questions.length;
    const percent = Math.round((score / totalQuestions) * 100);

    // --- קוד חדש: שמירת התוצאה בהיסטוריה ---
    const currentUserData = localStorage.getItem("quiz_current_user");
    if (currentUserData) {
      const student = JSON.parse(currentUserData);
      
      // יצירת אובייקט תוצאה חדש
      const newSubmission = {
        id: crypto.randomUUID(),
        examTitle: exam.title,
        studentName: student.username,
        score: score,
        totalQuestions: totalQuestions,
        percent: percent,
        date: new Date().toLocaleString()
      };

      // שליפת היסטוריה קיימת או יצירת מערך חדש
      const existingSubmissions = localStorage.getItem("quiz_submissions");
      const submissions = existingSubmissions ? JSON.parse(existingSubmissions) : [];
      
      submissions.push(newSubmission);
      localStorage.setItem("quiz_submissions", JSON.stringify(submissions));
    }
    // ----------------------------------------

    const resultDiv = document.createElement("div");
    resultDiv.className = "alert alert-info mt-3 text-center";

    resultDiv.innerHTML = `
      <h5>סיום מבחן!</h5>
      <p>ציון: ${score} מתוך ${totalQuestions}</p>
      <p>אחוז הצלחה: ${percent}%</p>
      <p class="fw-bold ${percent >= 60 ? 'text-success' : 'text-danger'}">
        ${percent >= 60 ? 'עברת בהצלחה! 🎉' : 'נכשלת במבחן 💔'}
      </p>
    `;

    this.examRunnerElement.appendChild(resultDiv);
    
    // רענון אוטומטי של הדף אחרי 3 שניות כדי לעדכן את טבלת הציונים
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }
}
