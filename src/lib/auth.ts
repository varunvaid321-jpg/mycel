import { cookies } from "next/headers";

const TOKEN_NAME = "mycel_session";
const TOKEN_VALUE = "authenticated";

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(TOKEN_NAME)?.value === TOKEN_VALUE;
}

export function verifyPassphrase(input: string): boolean {
  return input === process.env.MYCEL_PASSPHRASE;
}

export { TOKEN_NAME, TOKEN_VALUE };
