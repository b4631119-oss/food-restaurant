"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminLoginPage() {
  const router = useRouter(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setPending(true);
    try { await signInWithEmailAndPassword(auth, email.trim(), password); router.replace("/admin"); }
    catch (cause) { const code = cause && typeof cause === "object" && "code" in cause ? String(cause.code) : ""; setError(code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found") ? "Неверный email или пароль." : code.includes("network") ? "Нет соединения. Проверьте интернет и попробуйте снова." : "Не удалось войти. Проверьте данные и повторите попытку."); }
    finally { setPending(false); }
  }
  return <main className="grid min-h-dvh place-items-center bg-background px-4 py-8 text-text"><form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-line bg-surface p-5 sm:p-7">
    <div><p className="text-sm font-bold text-accent">Sushi Bar №1</p><h1 className="mt-2 text-2xl font-bold">Вход в админку</h1></div>
    <label className="block text-sm font-semibold">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" className="mt-2 h-[52px] w-full rounded-lg border border-line bg-background px-3 outline-none focus:border-accent" /></label>
    <label className="block text-sm font-semibold">Пароль<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-2 h-[52px] w-full rounded-lg border border-line bg-background px-3 outline-none focus:border-accent" /></label>
    {error && <p role="alert" className="text-sm text-accent">{error}</p>}<button type="submit" disabled={pending} className="press min-h-12 w-full rounded-lg bg-accent px-4 font-bold text-background disabled:opacity-50">{pending ? "Входим…" : "Войти"}</button>
  </form></main>;
}
