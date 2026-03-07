"use client";

import { Suspense } from "react";
import { StatusPageInner } from "@/app/status/page";

const t = {
  title: "Estado del Sistema",
  subtitle: "Estado en tiempo real de todos los servicios de Calltide",
  services: "Estado de Componentes",
  activeIncidents: "Incidentes Activos",
  pastIncidents: "Incidentes Pasados",
  uptime90: "Disponibilidad 90 Días",
  subscribe: "Recibe notificaciones",
  subscribeDesc: "Suscríbete a notificaciones por correo cuando Calltide cree, actualice o resuelva un incidente.",
  subscribePlaceholder: "tu@correo.com",
  subscribeBtn: "Suscribirse",
  noActiveIncidents: "No hay incidentes activos — todos los sistemas funcionan con normalidad.",
  noPastIncidents: "No hay incidentes en los últimos 90 días.",
  operational: "Operativo",
  degraded: "Degradado",
  outage: "Interrupción",
  allOperational: "Todos los Sistemas Operativos",
  postmortem: "Informe Post-Incidente",
  loading: "Cargando estado...",
  langToggle: "English",
  langToggleHref: "/status",
  verifiedMsg: "¡Email verificado! Recibirás actualizaciones de estado.",
  unsubscribedMsg: "Te has dado de baja de las actualizaciones de estado.",
  verifyFailedMsg: "La verificación falló. Por favor, inténtalo de nuevo.",
  subscribedMsg: "Revisa tu correo para confirmar tu suscripción.",
  last90: "90 días",
  today: "Hoy",
};

export default function StatusPageEs() {
  return (
    <Suspense>
      <StatusPageInner lang="es" t={t} />
    </Suspense>
  );
}
