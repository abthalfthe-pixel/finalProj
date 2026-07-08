export class Exam {
  constructor(title, creator) {
    this.id = crypto.randomUUID();
    this.title = title;
    this.creator = creator; // שם המורה או ה-ID שלו
    this.questions = [];
    this.createdAt = new Date().toISOString();
  }

  addQuestion(question) {
    this.questions.push(question);
  }

  getQuestionCount() {
    return this.questions.length;
  }
}