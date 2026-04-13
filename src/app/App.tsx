import { Navigate, Route, Routes } from "react-router-dom";
import LegacyWorkspace from "../legacy/LegacyWorkspace";
import { AuthPage } from "./AuthPage";
import { WorkspaceSelectPage } from "./WorkspaceSelectPage";
import { useAuth } from "../providers/AuthProvider";

export function App() {
  const { user, workspace, loading, login, selectWorkspace, logout } = useAuth();

  // 1. Loading — check token
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
        <p>Загрузка...</p>
      </div>
    );
  }

  // 2. Not logged in — show auth
  if (!user) {
    return <AuthPage onAuth={login} />;
  }

  // 3. Logged in but no workspace selected — show workspace selection
  if (!workspace) {
    return (
      <WorkspaceSelectPage
        userName={user.name}
        onSelect={selectWorkspace}
        onLogout={logout}
      />
    );
  }

  // 4. Logged in + workspace selected — show app
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/messenger" replace />} />
      <Route path="/:route" element={<LegacyWorkspace />} />
      <Route path="*" element={<Navigate to="/messenger" replace />} />
    </Routes>
  );
}
