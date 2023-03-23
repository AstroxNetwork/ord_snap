export function throwError({ message, stack, code }: { message: string; stack: string; code: number }) {
  const json = {
    message: message,
    fullMessage: `Error::${stack}::${message}::${code}`,
    stack,
    code,
  };
  const str = JSON.stringify(json);
  console.error(json);
  throw new Error(str);
}

export interface ErrorPaylaod {
  message: string;
  fullMessage: string;
  stack: string;
  code: number;
}
