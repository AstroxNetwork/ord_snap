export function throwError({ message, stack, code }: { message: string; stack: string; code: number }) {
  const json = {
    message: `Error::${stack}::${message}`,
    stack,
    code,
  };
  const str = JSON.stringify(json);
  console.error(json);
  throw new Error(str);
}
