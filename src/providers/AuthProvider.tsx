import { createContext, useContext, useState, useEffect, useCallback, type PropsWithChildren } from "react";
import { api, getToken, setToken } from "../services/api";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  initials: string;
  jobTitle: string | null;
  tag: string | null;
  avatarUrl: string | null;
}

interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  role: string; // admin | member | viewer
}

interface AuthContextValue {
  user: AuthUser | null;
  workspace: WorkspaceInfo | null;
  loading: boolean;
  login: (user: AuthUser, token: string, workspace?: WorkspaceInfo | null) => void;
  selectWorkspace: (workspace: WorkspaceInfo, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  workspace: null,
  loading: true,
  login: () => {},
  selectWorkspace: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Check existing token on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api.auth
      .me()
      .then((data) => {
        setUser(data.user);
        setWorkspace(data.workspace || null);
      })
      .catch(() => {
        // Token expired or invalid
        setToken(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback((authUser: AuthUser, token: string, ws?: WorkspaceInfo | null) => {
    setToken(token);
    setUser(authUser);
    setWorkspace(ws || null);
  }, []);

  const selectWorkspace = useCallback((ws: WorkspaceInfo, token: string) => {
    setToken(token);
    setWorkspace(ws);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
    setWorkspace(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, workspace, loading, login, selectWorkspace, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
