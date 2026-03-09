"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./booking.module.css";

// ── Types ──

interface BusinessData {
  name: string;
  type: string;
  businessHours: Record<string, { open: string; close: string }>;
  timezone: string;
  defaultLanguage: string;
  receptionistName: string;
  serviceArea: string | null;
}

interface ServiceData {
  id: string;
  serviceName: string;
  priceMin: number | null;
  priceMax: number | null;
  unit: string | null;
  description: string | null;
}

// ── Translations ──

const t = {
  en: {
    loading: "Loading...",
    notFound: "This booking page is not available.",
    notFoundSub: "The link may be incorrect or the business is no longer accepting online bookings.",
    selectService: "Select a Service",
    selectServiceSub: "Choose the service you need",
    pickDate: "Pick a Date",
    pickDateSub: "Select a day that works for you",
    pickTime: "Choose a Time",
    pickTimeSub: "Select an available time slot",
    yourInfo: "Your Information",
    yourInfoSub: "Tell us how to reach you",
    name: "Full Name",
    namePlaceholder: "Your full name",
    phone: "Phone Number",
    phonePlaceholder: "(555) 123-4567",
    email: "Email (optional)",
    emailPlaceholder: "you@example.com",
    notes: "Notes (optional)",
    notesPlaceholder: "Anything we should know before your appointment...",
    back: "Back",
    continue: "Continue",
    confirm: "Confirm Booking",
    confirming: "Confirming...",
    confirmed: "Booking Confirmed!",
    confirmedSub: "You're all set. We look forward to seeing you.",
    appointmentDetails: "Appointment Details",
    service: "Service",
    date: "Date",
    time: "Time",
    bookAnother: "Book Another Appointment",
    poweredBy: "Powered by",
    closed: "Closed",
    errorGeneric: "Something went wrong. Please try again.",
    rateLimited: "Too many bookings. Please try again later.",
    required: "This field is required",
    invalidPhone: "Please enter a valid phone number",
    invalidEmail: "Please enter a valid email",
    noServicesAvailable: "No services available for booking at this time.",
    noDatesAvailable: "No available dates in this month.",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    sun: "Su",
    mon: "Mo",
    tue: "Tu",
    wed: "We",
    thu: "Th",
    fri: "Fr",
    sat: "Sa",
    from: "from",
    perJob: "per job",
    perHour: "per hour",
  },
  es: {
    loading: "Cargando...",
    notFound: "Esta pagina de reservas no esta disponible.",
    notFoundSub: "El enlace puede ser incorrecto o el negocio ya no acepta reservas en linea.",
    selectService: "Seleccionar Servicio",
    selectServiceSub: "Elige el servicio que necesitas",
    pickDate: "Elegir Fecha",
    pickDateSub: "Selecciona un dia que te funcione",
    pickTime: "Elegir Hora",
    pickTimeSub: "Selecciona un horario disponible",
    yourInfo: "Tu Informacion",
    yourInfoSub: "Dinos como contactarte",
    name: "Nombre Completo",
    namePlaceholder: "Tu nombre completo",
    phone: "Numero de Telefono",
    phonePlaceholder: "(555) 123-4567",
    email: "Correo (opcional)",
    emailPlaceholder: "tu@ejemplo.com",
    notes: "Notas (opcional)",
    notesPlaceholder: "Algo que debamos saber antes de tu cita...",
    back: "Atras",
    continue: "Continuar",
    confirm: "Confirmar Reserva",
    confirming: "Confirmando...",
    confirmed: "Reserva Confirmada!",
    confirmedSub: "Todo listo. Esperamos verte pronto.",
    appointmentDetails: "Detalles de la Cita",
    service: "Servicio",
    date: "Fecha",
    time: "Hora",
    bookAnother: "Reservar Otra Cita",
    poweredBy: "Impulsado por",
    closed: "Cerrado",
    errorGeneric: "Algo salio mal. Intenta de nuevo.",
    rateLimited: "Demasiadas reservas. Intenta mas tarde.",
    required: "Este campo es requerido",
    invalidPhone: "Ingresa un numero de telefono valido",
    invalidEmail: "Ingresa un correo valido",
    noServicesAvailable: "No hay servicios disponibles para reservar en este momento.",
    noDatesAvailable: "No hay fechas disponibles este mes.",
    prevMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    sun: "Do",
    mon: "Lu",
    tue: "Ma",
    wed: "Mi",
    thu: "Ju",
    fri: "Vi",
    sat: "Sa",
    from: "desde",
    perJob: "por trabajo",
    perHour: "por hora",
  },
};

// ── Helpers ──

const DAY_KEYS: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

function generateTimeSlots(open: string, close: string): string[] {
  const slots: string[] = [];
  const [openH, openM] = open.split(":").map(Number);
  const [closeH, closeM] = close.split(":").map(Number);
  let h = openH;
  let m = openM;

  while (h < closeH || (h === closeH && m < closeM)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 30;
    if (m >= 60) {
      h++;
      m = 0;
    }
  }
  return slots;
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDateDisplay(dateStr: string, lang: "en" | "es"): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(lang === "es" ? "es-US" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(min: number | null, max: number | null, unit: string | null, lang: "en" | "es"): string {
  const labels = t[lang];
  if (min === null && max === null) return "";
  const unitLabel = unit === "per_hour" ? labels.perHour : labels.perJob;
  if (min !== null && max !== null && min !== max) {
    return `$${min}–$${max} ${unitLabel}`;
  }
  const price = min ?? max;
  return `${labels.from} $${price} ${unitLabel}`;
}

// ── Component ──

export default function BookingClient({ slug }: { slug: string }) {
  const [lang, setLang] = useState<"en" | "es">("en");
  const [step, setStep] = useState(0); // 0: service, 1: date, 2: time, 3: info, 4: confirmed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Data
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);

  // Selections
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Form
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const labels = t[lang];

  // ── Fetch business data ──
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/book/${slug}`);
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setBusiness(data.business);
        setServices(data.services);
        if (data.business.defaultLanguage === "es") {
          setLang("es");
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  // ── Calendar logic ──
  const openDays = useMemo(() => {
    if (!business) return new Set<number>();
    const days = new Set<number>();
    for (const [key, val] of Object.entries(business.businessHours)) {
      if (val && val.open && val.close) {
        const dayIndex = Object.entries(DAY_KEYS).find(([, v]) => v === key)?.[0];
        if (dayIndex !== undefined) days.add(Number(dayIndex));
      }
    }
    return days;
  }, [business]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells: Array<{ day: number; dateStr: string; disabled: boolean } | null> = [];
    // Leading blanks
    for (let i = 0; i < firstDay; i++) cells.push(null);
    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay();
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isPast = date < today;
      const isClosed = !openDays.has(dayOfWeek);
      cells.push({ day: d, dateStr, disabled: isPast || isClosed });
    }
    return cells;
  }, [calendarMonth, openDays]);

  // ── Time slots for selected date ──
  const timeSlots = useMemo(() => {
    if (!selectedDate || !business) return [];
    const [y, m, d] = selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const dayKey = DAY_KEYS[date.getDay()];
    const hours = business.businessHours[dayKey];
    if (!hours) return [];
    return generateTimeSlots(hours.open, hours.close);
  }, [selectedDate, business]);

  // ── Form validation ──
  const validateForm = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!formName.trim()) errs.name = labels.required;
    if (!formPhone.trim() || formPhone.replace(/\D/g, "").length < 7) errs.phone = labels.invalidPhone;
    if (formEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) errs.email = labels.invalidEmail;
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formName, formPhone, formEmail, labels]);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !selectedService || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/book/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || undefined,
          serviceId: selectedService.id,
          serviceName: selectedService.serviceName,
          date: selectedDate,
          time: selectedTime,
          notes: formNotes.trim() || undefined,
        }),
      });

      if (res.status === 429) {
        setError(labels.rateLimited);
        return;
      }
      if (!res.ok) throw new Error("Failed");
      setStep(4);
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, selectedService, selectedDate, selectedTime, slug, formName, formPhone, formEmail, formNotes, labels]);

  // ── Reset for new booking ──
  const resetBooking = useCallback(() => {
    setStep(0);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormNotes("");
    setFormErrors({});
    setError(null);
  }, []);

  // ── Render ──

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>{labels.loading}</p>
        </div>
      </div>
    );
  }

  if (notFound || !business) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.notFound}>
            <div className={styles.notFoundIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <h1 className={styles.notFoundTitle}>{labels.notFound}</h1>
            <p className={styles.notFoundSub}>{labels.notFoundSub}</p>
          </div>
        </div>
      </div>
    );
  }

  const monthLabel = calendarMonth.toLocaleDateString(lang === "es" ? "es-US" : "en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.bizInfo}>
            <h1 className={styles.bizName}>{business.name}</h1>
            {business.serviceArea && (
              <p className={styles.bizArea}>{business.serviceArea}</p>
            )}
          </div>
          <div className={styles.langSwitch}>
            <button
              className={`${styles.langBtn} ${lang === "en" ? styles.langBtnActive : ""}`}
              onClick={() => setLang("en")}
            >
              EN
            </button>
            <span className={styles.langDivider}>|</span>
            <button
              className={`${styles.langBtn} ${lang === "es" ? styles.langBtnActive : ""}`}
              onClick={() => setLang("es")}
            >
              ES
            </button>
          </div>
        </div>
      </header>

      {/* Progress */}
      {step < 4 && (
        <div className={styles.progress}>
          {[0, 1, 2, 3].map((s) => (
            <div
              key={s}
              className={`${styles.progressDot} ${s <= step ? styles.progressDotActive : ""} ${s === step ? styles.progressDotCurrent : ""}`}
            />
          ))}
        </div>
      )}

      <main className={styles.container}>
        {error && (
          <div className={styles.errorBanner}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {/* Step 0: Select Service */}
        {step === 0 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>{labels.selectService}</h2>
            <p className={styles.stepSub}>{labels.selectServiceSub}</p>

            {services.length === 0 ? (
              <p className={styles.emptyState}>{labels.noServicesAvailable}</p>
            ) : (
              <div className={styles.serviceGrid}>
                {services.map((svc) => (
                  <button
                    key={svc.id}
                    className={`${styles.serviceCard} ${selectedService?.id === svc.id ? styles.serviceCardSelected : ""}`}
                    onClick={() => {
                      setSelectedService(svc);
                      setStep(1);
                    }}
                  >
                    <span className={styles.serviceName}>{svc.serviceName}</span>
                    {svc.description && (
                      <span className={styles.serviceDesc}>{svc.description}</span>
                    )}
                    {(svc.priceMin !== null || svc.priceMax !== null) && (
                      <span className={styles.servicePrice}>
                        {formatPrice(svc.priceMin, svc.priceMax, svc.unit, lang)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Pick Date */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>{labels.pickDate}</h2>
            <p className={styles.stepSub}>{labels.pickDateSub}</p>

            <div className={styles.calendar}>
              <div className={styles.calendarHeader}>
                <button
                  className={styles.calendarNav}
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                  aria-label={labels.prevMonth}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className={styles.calendarMonthLabel}>{monthLabel}</span>
                <button
                  className={styles.calendarNav}
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                  aria-label={labels.nextMonth}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              <div className={styles.calendarGrid}>
                {[labels.sun, labels.mon, labels.tue, labels.wed, labels.thu, labels.fri, labels.sat].map((d) => (
                  <div key={d} className={styles.calendarDayLabel}>{d}</div>
                ))}
                {calendarDays.map((cell, i) =>
                  cell === null ? (
                    <div key={`blank-${i}`} className={styles.calendarBlank} />
                  ) : (
                    <button
                      key={cell.dateStr}
                      className={`${styles.calendarDay} ${cell.disabled ? styles.calendarDayDisabled : ""} ${selectedDate === cell.dateStr ? styles.calendarDaySelected : ""}`}
                      disabled={cell.disabled}
                      onClick={() => {
                        setSelectedDate(cell.dateStr);
                        setSelectedTime(null);
                        setStep(2);
                      }}
                    >
                      {cell.day}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className={styles.navBtns}>
              <button className={styles.backBtn} onClick={() => { setStep(0); setSelectedService(null); }}>
                {labels.back}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Pick Time */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>{labels.pickTime}</h2>
            <p className={styles.stepSub}>
              {labels.pickTimeSub} &mdash; {selectedDate && formatDateDisplay(selectedDate, lang)}
            </p>

            <div className={styles.timeGrid}>
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  className={`${styles.timeSlot} ${selectedTime === slot ? styles.timeSlotSelected : ""}`}
                  onClick={() => {
                    setSelectedTime(slot);
                    setStep(3);
                  }}
                >
                  {formatTime12(slot)}
                </button>
              ))}
            </div>

            <div className={styles.navBtns}>
              <button className={styles.backBtn} onClick={() => { setStep(1); setSelectedTime(null); }}>
                {labels.back}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contact Info */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>{labels.yourInfo}</h2>
            <p className={styles.stepSub}>{labels.yourInfoSub}</p>

            {/* Appointment summary */}
            <div className={styles.summaryMini}>
              <span>{selectedService?.serviceName}</span>
              <span className={styles.summaryDot} />
              <span>{selectedDate && formatDateDisplay(selectedDate, lang)}</span>
              <span className={styles.summaryDot} />
              <span>{selectedTime && formatTime12(selectedTime)}</span>
            </div>

            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className={styles.field}>
                <label className={styles.label} htmlFor="book-name">{labels.name} *</label>
                <input
                  id="book-name"
                  className={`${styles.input} ${formErrors.name ? styles.inputError : ""}`}
                  type="text"
                  placeholder={labels.namePlaceholder}
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); setFormErrors((p) => ({ ...p, name: "" })); }}
                  autoComplete="name"
                />
                {formErrors.name && <span className={styles.fieldError}>{formErrors.name}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="book-phone">{labels.phone} *</label>
                <input
                  id="book-phone"
                  className={`${styles.input} ${formErrors.phone ? styles.inputError : ""}`}
                  type="tel"
                  placeholder={labels.phonePlaceholder}
                  value={formPhone}
                  onChange={(e) => { setFormPhone(e.target.value); setFormErrors((p) => ({ ...p, phone: "" })); }}
                  autoComplete="tel"
                />
                {formErrors.phone && <span className={styles.fieldError}>{formErrors.phone}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="book-email">{labels.email}</label>
                <input
                  id="book-email"
                  className={`${styles.input} ${formErrors.email ? styles.inputError : ""}`}
                  type="email"
                  placeholder={labels.emailPlaceholder}
                  value={formEmail}
                  onChange={(e) => { setFormEmail(e.target.value); setFormErrors((p) => ({ ...p, email: "" })); }}
                  autoComplete="email"
                />
                {formErrors.email && <span className={styles.fieldError}>{formErrors.email}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="book-notes">{labels.notes}</label>
                <textarea
                  id="book-notes"
                  className={styles.textarea}
                  placeholder={labels.notesPlaceholder}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className={styles.navBtns}>
                <button type="button" className={styles.backBtn} onClick={() => setStep(2)}>
                  {labels.back}
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={submitting}
                >
                  {submitting ? labels.confirming : labels.confirm}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Confirmed */}
        {step === 4 && (
          <div className={styles.stepContent}>
            <div className={styles.confirmedIcon}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className={styles.confirmedTitle}>{labels.confirmed}</h2>
            <p className={styles.confirmedSub}>{labels.confirmedSub}</p>

            <div className={styles.confirmCard}>
              <h3 className={styles.confirmCardTitle}>{labels.appointmentDetails}</h3>
              <div className={styles.confirmRow}>
                <span className={styles.confirmLabel}>{labels.service}</span>
                <span className={styles.confirmValue}>{selectedService?.serviceName}</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmLabel}>{labels.date}</span>
                <span className={styles.confirmValue}>{selectedDate && formatDateDisplay(selectedDate, lang)}</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmLabel}>{labels.time}</span>
                <span className={styles.confirmValue}>{selectedTime && formatTime12(selectedTime)}</span>
              </div>
            </div>

            <button className={styles.secondaryBtn} onClick={resetBooking}>
              {labels.bookAnother}
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <span className={styles.footerText}>
          {labels.poweredBy}{" "}
          <a href="https://calltide.app" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
            Calltide
          </a>
        </span>
      </footer>
    </div>
  );
}
