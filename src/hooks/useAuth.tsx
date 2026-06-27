import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserType {
  id: string;
  uid: string; // compatibility with old firebase views
  email: string;
  displayName: string;
  role: 'admin' | 'expert' | 'farmer';
  phoneNumber?: string;
  location?: string;
  photoURL?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserType>;
  register: (email: string, pass: string, name: string, role: string) => Promise<UserType>;
  logout: () => void;
  updateProfile: (profileData: { displayName?: string; phoneNumber?: string; location?: string; role?: string; photoURL?: string }) => Promise<UserType>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => { throw new Error("AuthProvider not loaded"); },
  register: async () => { throw new Error("AuthProvider not loaded"); },
  logout: () => {},
  updateProfile: async () => { throw new Error("AuthProvider not loaded"); }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  // Recover session from JWT on mount
  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem("agrinovia_jwt_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          const mappedUser = { ...data.user, uid: data.user.id };
          setUser(mappedUser);
        } else {
          // Token expired or invalid, clear it
          localStorage.removeItem("agrinovia_jwt_token");
          setUser(null);
        }
      } catch (err) {
        console.error("Session recovery failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (email: string, pass: string): Promise<UserType> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password: pass })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to login");
    }

    localStorage.setItem("agrinovia_jwt_token", data.token);
    const mappedUser = { ...data.user, uid: data.user.id };
    setUser(mappedUser);
    return mappedUser;
  };

  const register = async (email: string, pass: string, name: string, role: string): Promise<UserType> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password: pass, displayName: name, role })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to register");
    }

    localStorage.setItem("agrinovia_jwt_token", data.token);
    const mappedUser = { ...data.user, uid: data.user.id };
    setUser(mappedUser);
    return mappedUser;
  };

  const logout = () => {
    localStorage.removeItem("agrinovia_jwt_token");
    setUser(null);
  };

  const updateProfile = async (profileData: { displayName?: string; phoneNumber?: string; location?: string; role?: string; photoURL?: string }): Promise<UserType> => {
    const token = localStorage.getItem("agrinovia_jwt_token");
    if (!token) throw new Error("Not authenticated");

    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update profile");
    }

    const mappedUser = { ...data.user, uid: data.user.id };
    setUser(mappedUser);
    return mappedUser;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
