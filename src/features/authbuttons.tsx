'use client';

import { useAuthStore } from "../store/authStore";



export default function AuthButtons() {
  const { user, login, logout, loading } = useAuthStore();

  if (user) {
    return <button onClick={logout}>Выйти</button>;
  }

  return (
    <button
      disabled={loading}
      onClick={() => login('test@mail.com', '123456')}
    >
      Войти
    </button>
  );
}
