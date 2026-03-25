"use client";

import { Suspense } from "react";
import { StatusPageInner } from "@/app/status/page";

const t = {
  title: "Estado del Sistema",
  subscribeBtn: "Suscribirse a Actualizaciones",
  subscribeBtnShort: "Suscribirse",
  subscribePlaceholder: "tu@correo.com",
  subscribeHeader: "Suscríbete a Actualizaciones",
  subscribeDesc: "Recibe notificaciones cuando Capta cree, actualice o resuelva un incidente.",
  uptimeHeading: "Disponibilidad en los últimos 90 días.",
  daysAgo: "Hace 90 días",
  uptimeSuffix: " % disponibilidad",
  today: "Hoy",
  subtitle: "Estado en tiempo real de todos los servicios de Capta",
  services: "Estado de Servicios",
  activeIncidents: "Incidentes Activos",
  pastIncidents: "Incidentes Pasados",
  subscribe: "Recibe notificaciones",
  operational: "Operativo",
  degraded: "Degradado",
  outage: "Interrupción",
  allOperational: "Todos los Sistemas Operativos",
  postmortem: "Informe Post-Incidente",
  loading: "Cargando estado...",
  langToggle: "English",
  langToggleHref: "/status",
  noActiveIncidents: "No hay incidentes activos — todos los sistemas funcionan con normalidad.",
  noPastIncidents: "No hay incidentes en los últimos 90 días.",
  verifiedMsg: "¡Email verificado! Recibirás actualizaciones de estado.",
  unsubscribedMsg: "Te has dado de baja de las actualizaciones de estado.",
  verifyFailedMsg: "La verificación falló. Por favor, inténtalo de nuevo.",
  subscribedMsg: "Revisa tu correo para confirmar tu suscripción.",
  categoryDescriptions: {
    "Phone Answering": "Recepción de llamadas e IA de voz",
    "SMS & Notifications": "Mensajes de texto y alertas por correo",
    "Dashboard & CRM": "Portal de cliente, datos e informes",
    "AI Intelligence": "Resúmenes de llamadas y funciones inteligentes",
  } as Record<string, string>,
};

export default function StatusPageEs() {
  return (
    <Suspense>
      <StatusPageInner lang="es" t={t} />
    </Suspense>
  );
}
