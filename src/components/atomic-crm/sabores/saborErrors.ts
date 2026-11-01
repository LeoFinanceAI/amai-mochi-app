// sabor.nombre is UNIQUE: PostgREST reports a violation as Postgres code 23505.
export const isDuplicateNameError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const { message, body } = error as {
    message?: unknown;
    body?: { code?: unknown; message?: unknown };
  };
  const text = [message, body?.message]
    .filter((part): part is string => typeof part === "string")
    .join(" ");
  return body?.code === "23505" || /duplicate key|sabor_nombre_key/i.test(text);
};

export const saborErrorMessage = (error: unknown): string =>
  isDuplicateNameError(error)
    ? "amai.flavors.duplicate"
    : "ra.notification.http_error";
