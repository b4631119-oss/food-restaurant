"use client";

import { useEffect, useRef, useState } from "react";
import { validateAddress, validateName, validatePhone } from "@/lib/validation";
import { formatPhone } from "@/lib/format";
import { ADDRESS_MAX, NAME_MAX, forgetCustomer, readSavedCustomer, saveCustomer } from "@/lib/customer-storage";
import type { Fulfillment } from "@/lib/types";

type Field = "name" | "phone" | "address";

export function useCustomer(table: number | null = null) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [trap, setTrap] = useState("");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("delivery");
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState<Record<Field, boolean>>({ name: false, phone: false, address: false });
  const [submitted, setSubmitted] = useState(false);
  const [ready, setReady] = useState(false);
  const restored = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = readSavedCustomer();
      if (saved) {
        setName((saved.name ?? "").slice(0, NAME_MAX));
        setPhone(formatPhone(saved.phone ?? ""));
        setAddress((saved.street ?? saved.address ?? "").slice(0, ADDRESS_MAX));
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    // Первый прогон — только восстановление: без правок клиента срок хранения не продлеваем.
    if (!restored.current) {
      restored.current = true;
      return;
    }
    // Чекбокс выключен — в браузере не остаётся ничего персонального.
    if (!remember) {
      forgetCustomer();
      return;
    }
    saveCustomer({ name, phone, address });
  }, [name, phone, address, remember, ready]);

  // Адрес заказа — только то, что клиент ввёл вручную в поле «Адрес».
  const orderAddress = address.trim().slice(0, ADDRESS_MAX);
  const dinein = table !== null;
  const delivery = !dinein && fulfillment === "delivery";
  const errors = {
    name: dinein ? (name.trim() && name.trim().length < 2 ? "Укажите имя (минимум 2 символа)." : "") : validateName(name),
    phone: dinein ? "" : validatePhone(phone),
    address: delivery ? validateAddress(address) : "",
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
    address, setAddress, orderAddress, comment, setComment, trap, setTrap,
    fulfillment, setFulfillment, remember, setRemember,
    errors: visibleErrors, blurField, validateForm,
  };
}
