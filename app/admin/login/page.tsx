"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DEMO_AUTH_KEY } from "@/lib/demo-store";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== "demo") { setError("Для входа используйте пароль demo."); return; }
    sessionStorage.setItem(DEMO_AUTH_KEY, "1");
    router.replace("/admin");
  }
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-8 text-text">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-line bg-surface p-5 sm:p-7">
        <div><p className="text-sm font-bold text-accent">Sushi Bar №1</p><h1 className="mt-2 text-2xl font-bold">Вход в админку</h1><p className="mt-2 text-sm text-muted">Демо-доступ: любой email, пароль <strong className="text-text">demo</strong>.</p></div>
        <label className="block text-sm font-semibold">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="owner@example.com" className="mt-2 h-[52px] w-full rounded-lg border border-line bg-background px-3 outline-none placeholder:text-muted focus:border-accent" /></label>
        <label className="block text-sm font-semibold">Пароль<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="demo" className="mt-2 h-[52px] w-full rounded-lg border border-line bg-background px-3 outline-none placeholder:text-muted focus:border-accent" /></label>
        {error && <p role="alert" className="text-sm text-accent">{error}</p>}
        <button type="submit" className="press min-h-12 w-full rounded-lg bg-accent px-4 font-bold text-background hover:bg-accent-hover">Войти</button>
      </form>
    </main>
  );
}
