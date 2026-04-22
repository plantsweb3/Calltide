"use client";

/**
 * Spanish homepage — renders the shared HomeClient with initialLang="es".
 * Keeps /es as a standalone SEO page while avoiding duplicate markup.
 */

import HomeClient from "../HomeClient";

export default function EsHomeClient() {
  return <HomeClient initialLang="es" />;
}
