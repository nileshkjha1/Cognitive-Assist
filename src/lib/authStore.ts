import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string; // Stored securely-ish for local prototype
}

interface AuthState {
  users: User[];
  currentUser: User | null;
  register: (user: Omit<User, "id">) => { success: boolean; message: string };
  login: (emailOrUsername: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const loadUsers = (): User[] => {
  const data = localStorage.getItem("aura_users");
  return data ? JSON.parse(data) : [];
};

const saveUsers = (users: User[]) => {
  localStorage.setItem("aura_users", JSON.stringify(users));
};

const loadSession = (): User | null => {
  const data = localStorage.getItem("aura_session");
  return data ? JSON.parse(data) : null;
};

const saveSession = (user: User | null) => {
  if (user) {
    localStorage.setItem("aura_session", JSON.stringify(user));
  } else {
    localStorage.removeItem("aura_session");
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  users: loadUsers(),
  currentUser: loadSession(),

  register: (userData) => {
    const { users } = get();
    
    // Check for existing email or username
    if (users.some(u => u.email === userData.email)) {
      return { success: false, message: "Email is already registered" };
    }
    if (users.some(u => u.username === userData.username)) {
      return { success: false, message: "Username is already taken" };
    }

    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
    };

    const newUsers = [...users, newUser];
    saveUsers(newUsers);
    set({ users: newUsers });

    return { success: true, message: "Registration successful" };
  },

  login: (emailOrUsername, password) => {
    const { users } = get();
    
    const user = users.find(
      u => (u.email === emailOrUsername || u.username === emailOrUsername) && u.password === password
    );

    if (user) {
      saveSession(user);
      set({ currentUser: user });
      return { success: true, message: "Login successful" };
    }

    return { success: false, message: "Invalid credentials" };
  },

  logout: () => {
    saveSession(null);
    set({ currentUser: null });
  },

  updateProfile: (updates) => {
    const { currentUser, users } = get();
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...updates };
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    
    saveUsers(updatedUsers);
    saveSession(updatedUser);
    set({ currentUser: updatedUser, users: updatedUsers });
  }
}));
