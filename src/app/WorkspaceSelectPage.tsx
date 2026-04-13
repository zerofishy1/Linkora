import { useState, useEffect, FormEvent } from "react";
import { api } from "../services/api";

interface WorkspaceSelectPageProps {
  userName: string;
  onSelect: (workspace: any, token: string) => void;
  onLogout: () => void;
}

interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  role: string;
  memberCount: number;
}

type Mode = "list" | "create" | "join";

export function WorkspaceSelectPage({ userName, onSelect, onLogout }: WorkspaceSelectPageProps) {
  const [mode, setMode] = useState<Mode>("list");
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Create workspace form
  const [wsName, setWsName] = useState("");

  // Join workspace form
  const [inviteToken, setInviteToken] = useState("");

  // Load user's workspaces
  useEffect(() => {
    loadWorkspaces();
  }, []);

  async function loadWorkspaces() {
    try {
      setLoading(true);
      const data = await api.workspaces.list();
      setWorkspaces(data.workspaces);
    } catch {
      // User might not have any workspaces yet — that's OK
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectWorkspace(wsId: string) {
    setError("");
    setActionLoading(true);
    try {
      const data = await api.workspaces.select(wsId);
      onSelect(data.workspace, data.token);
    } catch (err: any) {
      setError(err.error || "Ошибка выбора рабочей области");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateWorkspace(e: FormEvent) {
    e.preventDefault();
    if (!wsName.trim()) {
      setError("Введите название рабочей области");
      return;
    }
    setError("");
    setActionLoading(true);
    try {
      const data = await api.workspaces.create(wsName.trim());
      onSelect(data.workspace, data.token);
    } catch (err: any) {
      setError(err.error || "Ошибка создания рабочей области");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleJoinWorkspace(e: FormEvent) {
    e.preventDefault();
    if (!inviteToken.trim()) {
      setError("Введите токен приглашения");
      return;
    }
    setError("");
    setActionLoading(true);
    try {
      const data = await api.workspaces.join(inviteToken.trim());
      onSelect(data.workspace, data.token);
    } catch (err: any) {
      setError(err.error || "Ошибка присоединения к рабочей области");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
        <p>Загрузка рабочих областей...</p>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="ws-select-card">
        {/* Header */}
        <div className="ws-select-header">
          <div className="auth-logo-icon">LK</div>
          <h1>Рабочая область</h1>
          <p className="ws-select-greeting">
            Привет, {userName}!
            {workspaces.length > 0
              ? " Выберите рабочую область или создайте новую."
              : " Создайте рабочую область или присоединитесь по приглашению."}
          </p>
        </div>

        {/* Mode tabs */}
        <div className="ws-select-tabs">
          {workspaces.length > 0 && (
            <button
              className={`ws-select-tab ${mode === "list" ? "active" : ""}`}
              onClick={() => { setMode("list"); setError(""); }}
            >
              Мои области
              <span className="ws-select-tab-count">{workspaces.length}</span>
            </button>
          )}
          <button
            className={`ws-select-tab ${mode === "create" ? "active" : ""}`}
            onClick={() => { setMode("create"); setError(""); }}
          >
            Создать
          </button>
          <button
            className={`ws-select-tab ${mode === "join" ? "active" : ""}`}
            onClick={() => { setMode("join"); setError(""); }}
          >
            Присоединиться
          </button>
        </div>

        {/* Content */}
        <div className="ws-select-content">
          {error && <div className="auth-error">{error}</div>}

          {/* List of existing workspaces */}
          {mode === "list" && workspaces.length > 0 && (
            <div className="ws-list">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  className="ws-list-item"
                  onClick={() => handleSelectWorkspace(ws.id)}
                  disabled={actionLoading}
                >
                  <div className="ws-list-item-icon">
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ws-list-item-info">
                    <strong>{ws.name}</strong>
                    <span>
                      {ws.role === "admin" ? "Администратор" : ws.role === "member" ? "Участник" : "Наблюдатель"}
                      {" \u00b7 "}
                      {ws.memberCount} {getMemberWord(ws.memberCount)}
                    </span>
                  </div>
                  <div className="ws-list-item-arrow">\u2192</div>
                </button>
              ))}
            </div>
          )}

          {/* No workspaces message */}
          {mode === "list" && workspaces.length === 0 && (
            <div className="ws-empty">
              <div className="ws-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <p>У вас пока нет рабочих областей</p>
              <p className="ws-empty-hint">Создайте новую или присоединитесь по приглашению</p>
              <div className="ws-empty-actions">
                <button className="auth-submit" onClick={() => setMode("create")}>
                  Создать рабочую область
                </button>
                <button className="ws-empty-join-btn" onClick={() => setMode("join")}>
                  У меня есть приглашение
                </button>
              </div>
            </div>
          )}

          {/* Create workspace form */}
          {mode === "create" && (
            <form onSubmit={handleCreateWorkspace} className="auth-form">
              <div className="ws-create-hint">
                Рабочая область — это пространство для вашей команды: задачи, чаты, документы и календарь.
              </div>
              <div className="auth-field">
                <label htmlFor="ws-name">Название</label>
                <input
                  id="ws-name"
                  type="text"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="Моя компания"
                  autoFocus
                  required
                />
              </div>
              <button type="submit" className="auth-submit" disabled={actionLoading}>
                {actionLoading ? "Создание..." : "Создать и войти"}
              </button>
            </form>
          )}

          {/* Join workspace form */}
          {mode === "join" && (
            <form onSubmit={handleJoinWorkspace} className="auth-form">
              <div className="ws-create-hint">
                Попросите администратора рабочей области создать токен-приглашение и введите его ниже.
              </div>
              <div className="auth-field">
                <label htmlFor="ws-invite">Токен приглашения</label>
                <input
                  id="ws-invite"
                  type="text"
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                  placeholder="abc123-def456-..."
                  autoFocus
                  required
                />
              </div>
              <button type="submit" className="auth-submit" disabled={actionLoading}>
                {actionLoading ? "Присоединение..." : "Присоединиться"}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="ws-select-footer">
          <button className="auth-link" onClick={onLogout}>
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
}

function getMemberWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "участник";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "участника";
  return "участников";
}
