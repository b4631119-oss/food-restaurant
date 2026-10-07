"use client";

import { useEffect, useRef, useState } from "react";
import { validateAddress, validateName, validatePhone } from "@/lib/validation";
import { reverseGeocode } from "@/lib/reverse-geocode";
import { formatPhone } from "@/lib/format";
import type { Fulfillment } from "@/lib/types";

const CUSTOMER_KEY = "sushi-bar-no1-customer";
const ADDRESS_MAX = 200;
type Field = "name" | "phone" | "address";
type Saved = { name?: string; phone?: string; address?: string; street?: string; entrance?: string; floor?: string; flat?: string; intercom?: string };
export type GeoPoint = { lat: number; lng: number };
export type GeoStatus = "idle" | "loading" | "done" | "error";

function composeAddress(street: string, optional: string[]): { text: string; tooLong: boolean } {
  const base = street.trim();
  let extras = optional.filter(Boolean);
  const join = () => [base, ...extras].filter(Boolean).join(", ");
  while (join().length > ADDRESS_MAX && extras.length) {
    let longest = 0;
    extras.forEach((item, index) => { if (item.length > extras[longest].length) longest = index; });
    extras = extras.filter((_, index) => index !== longest);
  }
  const text = join();
  return text.length > ADDRESS_MAX ? { text: text.slice(0, ADDRESS_MAX), tooLong: true } : { text, tooLong: false };
}

export function useCustomer(table: number | null = null) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [entrance, setEntrance] = useState("");
  const [floor, setFloor] = useState("");
  const [flat, setFlat] = useState("");
  const [intercom, setIntercom] = useState("");
  const [comment, setComment] = useState("");
  const [trap, setTrap] = useState("");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("delivery");
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geoError, setGeoError] = useState("");
  const [geoSuggestion, setGeoSuggestion] = useState("");
  const [geoNote, setGeoNote] = useState("");
  const [geoFilledAt, setGeoFilledAt] = useState(0);
  const streetRef = useRef("");
  useEffect(() => { streetRef.current = street; }, [street]);
  const [touched, setTouched] = useState<Record<Field, boolean>>({ name: false, phone: false, address: false });
  const [submitted, setSubmitted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? "{}") as Saved;
        setName(saved.name ?? ""); setPhone(formatPhone(saved.phone ?? ""));
        setStreet(saved.street ?? saved.address ?? "");
        setEntrance(saved.entrance ?? ""); setFloor(saved.floor ?? ""); setFlat(saved.flat ?? ""); setIntercom(saved.intercom ?? "");
      } catch { /* Continue with empty fields when storage is unavailable. */ }
      finally { setReady(true); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name, phone, street, entrance, floor, flat, intercom })); } catch { /* Keep fields usable without storage. */ }
  }, [name, phone, street, entrance, floor, flat, intercom, ready]);

  const optional = [
    entrance.trim() ? `подъезд ${entrance.trim()}` : "",
    floor.trim() ? `этаж ${floor.trim()}` : "",
    flat.trim() ? `кв. ${flat.trim()}` : "",
    intercom.trim() ? `домофон ${intercom.trim()}` : "",
  ].filter(Boolean);
  const composed = composeAddress(street, optional);
  const address = composed.text;
  const dinein = table !== null;
  const delivery = !dinein && fulfillment === "delivery";
  const errors = {
    name: dinein ? (name.trim() && name.trim().length < 2 ? "Укажите имя (минимум 2 символа)." : "") : validateName(name),
    phone: dinein ? "" : validatePhone(phone),
    address: delivery ? validateAddress(street, Boolean(location)) || (composed.tooLong ? "Слишком длинный адрес" : "") : "",
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
  function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setGeoStatus("loading"); setGeoError(""); setGeoSuggestion(""); setGeoNote("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = { lat: Math.round(position.coords.latitude * 1e5) / 1e5, lng: Math.round(position.coords.longitude * 1e5) / 1e5 };
        setLocation(point); setGeoStatus("done");
        void reverseGeocode(point.lat, point.lng).then((found) => {
          if (!found) { setGeoNote("Местоположение добавлено. Допишите улицу и дом."); return; }
          if (!streetRef.current.trim()) { setStreet(found); setGeoFilledAt((count) => count + 1); setGeoNote("Адрес определён по данным OpenStreetMap, проверьте его"); return; }
          setGeoSuggestion(found);
        });
      },
      () => {
        setGeoStatus("error");
        setGeoError("Не получилось определить. Просто укажите адрес.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  function useSuggestion() {
    if (!geoSuggestion) return;
    setStreet(geoSuggestion); setGeoSuggestion(""); setGeoNote("Адрес определён по данным OpenStreetMap, проверьте его"); setGeoFilledAt((count) => count + 1);
  }
  function clearLocation() { setLocation(null); setGeoStatus("idle"); setGeoError(""); setGeoSuggestion(""); setGeoNote(""); }
  return {
    name, setName, phone, setPhone: (value: string) => setPhone(formatPhone(value)),
    street, setStreet, entrance, setEntrance, floor, setFloor, flat, setFlat, intercom, setIntercom,
    address, comment, setComment, trap, setTrap,
    fulfillment, setFulfillment, errors: visibleErrors, blurField, validateForm,
    location, geoStatus, geoError, geoSuggestion, geoNote, geoFilledAt, useSuggestion, locate, clearLocation,
  };
}
