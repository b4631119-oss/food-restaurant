"use client";

import { useEffect, useState } from "react";
import { validateAddress, validateName, validatePhone } from "@/lib/validation";
import { formatPhone } from "@/lib/format";
import type { Fulfillment } from "@/lib/types";

const CUSTOMER_KEY = "sushi-bar-no1-customer";
type Field = "name" | "phone" | "address";

export function useCustomer() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("delivery");
  const [touched, setTouched] = useState<Record<Field, boolean>>({ name: false, phone: false, address: false });
  const [submitted, setSubmitted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? "{}") as { name?: string; phone?: string; address?: string };
        setName(saved.name ?? ""); setPhone(formatPhone(saved.phone ?? "")); setAddress(saved.address ?? "");
      } catch { /* Continue with empty fields when storage is unavailable. */ }
      finally { setReady(true); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name, phone, address })); } catch { /* Keep fields usable without storage. */ }
  }, [name, phone, address, ready]);

  const errors = {
    name: validateName(name), phone: validatePhone(phone),
    address: fulfillment === "delivery" ? validateAddress(address) : "",
  };
  const visibleErrors = {
    name: touched.name || submitted ? errors.name : "",
    phone: touched.phone || submitted ? errors.phone : "",
    address: touched.address || submitted ? errors.address : "",
  };
  function blurField(field: Field) { setTouched((current) => ({ ...current, [field]: true })); }
  function validateForm() {
    setSubmitted(true);
    const first = (Object.keys(errors) as Field[]).find((field) => errors[field]);
    if (first) window.setTimeout(() => document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(), 0);
    return !first;
  }
  return {
    name, setName, phone, setPhone: (value: string) => setPhone(formatPhone(value)),
    address, setAddress, fulfillment, setFulfillment, errors: visibleErrors, blurField, validateForm,
  };
}
