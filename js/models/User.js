export class User {
  constructor(username, password, role) {
    this.id = crypto.randomUUID();
    this.username = username;
    this.password = password;
    this.role = role; 
  }
}