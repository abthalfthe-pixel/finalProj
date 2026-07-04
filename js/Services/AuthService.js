import { User } from "../models/User.js";

export class AuthService {
  constructor() {
    this.usersKey = "quiz_users";
    this.sessionKey = "quiz_current_user";
  }

  // שליפת כל המשתמשים הרשומים
  getAllUsers() {
    const data = localStorage.getItem(this.usersKey);
    return data ? JSON.parse(data) : [];
  }

  // הרשמת משתמש חדש
  register(username, password, role) {
    const users = this.getAllUsers();
    
    // בדיקה אם שם המשתמש כבר קיים
    if (users.some(u => u.username === username)) {
      throw new Error("שם המשתמש כבר קיים במערכת");
    }

    const newUser = new User(username, password, role);
    users.push(newUser);
    localStorage.setItem(this.usersKey, JSON.stringify(users));
    return newUser;
  }

  // התחברות למערכת
  login(username, password) {
    const users = this.getAllUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      throw new Error("שם משתמש או סיסמה שגויים");
    }

    // שמירת המשתמש הנוכחי ב-session
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
    return user;
  }

  // ניתוק מהמערכת
  logout() {
    localStorage.removeItem(this.sessionKey);
  }

  // קבלת המשתמש המחובר כרגע
  getCurrentUser() {
    const data = localStorage.getItem(this.sessionKey);
    return data ? JSON.parse(data) : null;
  }
}