"use client";

import { useState } from "react";
import { validateAddress, validateName, validatePhone } from "@/lib/validation";
import type { Fulfillment } from "@/lib/types";

export function useCustomer() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("delivery");
  const [formError, setFormError] = useState("");

  function validateForm() {
    const nameError = validateName(name);
    if (nameError) {
      setFormError(nameError);
      return false;
    }
    const phoneError = validatePhone(phone.trim());
    if (phoneError) {
      setFormError(phoneError);
      return false;
    }
    if (fulfillment === "delivery") {
      const addressError = validateAddress(address);
      if (addressError) {
        setFormError(addressError);
        return false;
      }
    }
    return true;
  }

  return {
    name, setName, phone, setPhone, address, setAddress,
    fulfillment, setFulfillment, formError, setFormError, validateForm,
  };
}
