// Matches backend Users entity: { id, username, password (omitted), role }
// No email or createdAt fields exist in the backend Users entity
export interface AppUser {
  id:       number;
  username: string;
  role:     string;
}

// Matches backend AuthRequest: { username, password } — email is not stored
export interface CreateLabTechRequest {
  username: string;
  password: string;
}
