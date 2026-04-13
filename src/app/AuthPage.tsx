import { useState, FormEvent } from "react";
import { api } from "../services/api";

interface AuthPageProps {
  onAuth: (user: any, token: string, workspace?: any) => void;
}

export function AuthPage({ onAuth }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const data = await api.auth.login(email, password);
        // Login may return workspace if user has exactly 1
        onAuth(data.user, data.token, data.workspace);
      } else {
        if (!name.trim()) {
          setError("Введите имя");
          setLoading(false);
          return;
        }
        const data = await api.auth.register(email, password, name);
        // After register, no workspace yet
        onAuth(data.user, data.token, null);
      }
    } catch (err: any) {
      setError(err.error || "Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">LK</div>
          <h1>Linkora</h1>
          <p>Рабочее пространство вашей команды</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Вход
          </button>
          <button
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setError(""); }}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <div className="auth-field">
              <label htmlFor="auth-name">Имя и фамилия</label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иван Иванов"
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Пароль</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? "Загрузка..."
              : mode === "login"
                ? "Войти"
                : "Создать аккаунт"}
          </button>
        </form>

        <div className="auth-footer">
          {mode === "login" ? (
            <p>
              Нет аккаунта?{" "}
              <button className="auth-link" onClick={() => { setMode("register"); setError(""); }}>
                Зарегистрируйтесь
              </button>
            </p>
          ) : (
            <p>
              Уже есть аккаунт?{" "}
              <button className="auth-link" onClick={() => { setMode("login"); setError(""); }}>
                Войдите
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
