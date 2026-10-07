"use client";

import { useEffect, useRef, useState } from "react";
import { validateAddress, validateName, validatePhone } from "@/lib/validation";
import { reverseGeocode } from "@/lib/reverse-geocode";
import { formatPhone } from "@/lib/format";
import type { Fulfillment } from "@/lib/types";

const CUSTOMER_KEY = "sushi-bar-no1-customer";
const GEO_ADDRESS = "По геолокации (точка на карте)";
const ADDRESS_MAX = 200;
type Field = "name" | "phone" | "address";
type Saved = { name?: string; phone?: string; address?: string; street?: string };
export type GeoPoint = { lat: number; lng: number };
export type GeoStatus = "idle" | "loading" | "done" | "error";

export function useCustomer(table: number | null = null) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddressValue] = useState("");
  const [comment, setComment] = useState("");
  const [trap, setTrap] = useState("");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("delivery");
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geoError, setGeoError] = useState("");
  const [geoSuggestion, setGeoSuggestion] = useState("");
  const [addressFromMap, setAddressFromMap] = useState(false);
  const [geoFilledAt, setGeoFilledAt] = useState(0);
  const addressRef = useRef("");
  useEffect(() => { addressRef.current = address; }, [address]);
  const [touched, setTouched] = useState<Record<Field, boolean>>({ name: false, phone: false, address: false });
  const [submitted, setSubmitted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? "{}") as Saved;
        setName(saved.name ?? ""); setPhone(formatPhone(saved.phone ?? ""));
        setAddressValue((saved.street ?? saved.address ?? "").slice(0, ADDRESS_MAX));
      } catch { /* Continue with empty fields when storage is unavailable. */ }
      finally { setReady(true); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name, phone, address })); } catch { /* Keep fields usable without storage. */ }
  }, [name, phone, address, ready]);

  function setAddress(value: string) { setAddressValue(value); if (addressFromMap) setAddressFromMap(false); }
  const orderAddress = (address.trim() || (location ? GEO_ADDRESS : "")).slice(0, ADDRESS_MAX);
  const dinein = table !== null;
  const delivery = !dinein && fulfillment === "delivery";
  const errors = {
    name: dinein ? (name.trim() && name.trim().length < 2 ? "Укажите имя (минимум 2 символа)." : "") : validateName(name),
    phone: dinein ? "" : validatePhone(phone),
    address: delivery ? validateAddress(address, Boolean(location)) : "",
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
    setGeoStatus("loading"); setGeoError(""); setGeoSuggestion("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = { lat: Math.round(position.coords.latitude * 1e5) / 1e5, lng: Math.round(position.coords.longitude * 1e5) / 1e5 };
        setLocation(point); setGeoStatus("done");
        void reverseGeocode(point.lat, point.lng).then((found) => {
          if (!found) return;
          if (!addressRef.current.trim()) { setAddressValue(found); setAddressFromMap(true); setGeoFilledAt((count) => count + 1); return; }
          setGeoSuggestion(found);
        });
      },
      () => {
        setGeoStatus("error");
        setGeoError("Не получилось определить. Просто напишите адрес.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  function useSuggestion() {
    if (!geoSuggestion) return;
    setAddressValue(geoSuggestion); setGeoSuggestion(""); setAddressFromMap(true); setGeoFilledAt((count) => count + 1);
  }
  function clearLocation() { setLocation(null); setGeoStatus("idle"); setGeoError(""); setGeoSuggestion(""); setAddressFromMap(false); }
  return {
    name, setName, phone, setPhone: (value: string) => setPhone(formatPhone(value)),
    address, setAddress, orderAddress, comment, setComment, trap, setTrap,
    fulfillment, setFulfillment, errors: visibleErrors, blurField, validateForm,
    location, geoStatus, geoError, geoSuggestion, addressFromMap, geoFilledAt, useSuggestion, locate, clearLocation,
  };
}
