import * as Sentry from "@sentry/nextjs";

export function reportError(
  message: string,
  error: unknown,
  context?: { businessId?: string; extra?: Record<string, unknown> },
) {
  console.error(message, error);

  Sentry.withScope((scope) => {
    if (context?.businessId) {
      scope.setTag("businessId", context.businessId);
    }
    if (context?.extra) {
      scope.setExtras(context.extra);
    }
    scope.setLevel("error");
    if (error instanceof Error) {
      scope.setTransactionName(message);
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(message, { level: "error" });
    }
  });
}

export function reportWarning(
  message: string,
  extra?: Record<string, unknown>,
) {
  console.warn(message, extra);

  Sentry.withScope((scope) => {
    if (extra) {
      scope.setExtras(extra);
    }
    Sentry.captureMessage(message, { level: "warning" });
  });
}
