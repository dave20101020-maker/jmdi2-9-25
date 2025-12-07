import fs from "fs";
import path from "path";
import { generateKeyPairSync } from "crypto";

let cachedKeys = null;

const resolveFileInput = (filePath) => {
  if (!filePath) return null;
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    console.warn(
      `[jwtKeys] File at ${resolved} was not found. Falling back to other sources.`
    );
    return null;
  }
  return fs.readFileSync(resolved, "utf8");
};

const loadKeyPair = () => {
  if (cachedKeys) {
    return cachedKeys;
  }

  const inlinePrivate = process.env.AUTH_PRIVATE_KEY?.trim();
  const inlinePublic = process.env.AUTH_PUBLIC_KEY?.trim();
  const privateFile =
    process.env.AUTH_PRIVATE_KEY_FILE || process.env.JWT_PRIVATE_KEY_FILE;
  const publicFile =
    process.env.AUTH_PUBLIC_KEY_FILE || process.env.JWT_PUBLIC_KEY_FILE;

  let privateKey = inlinePrivate || resolveFileInput(privateFile);
  let publicKey = inlinePublic || resolveFileInput(publicFile);

  if (!privateKey || !publicKey) {
    const { privateKey: generatedPrivate, publicKey: generatedPublic } =
      generateKeyPairSync("rsa", { modulusLength: 2048 });
    privateKey = generatedPrivate.export({ type: "pkcs1", format: "pem" });
    publicKey = generatedPublic.export({ type: "spki", format: "pem" });
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[jwtKeys] AUTH_PRIVATE_KEY/AUTH_PUBLIC_KEY not configured. Generated ephemeral keys for this process."
      );
    }
  }

  cachedKeys = { privateKey, publicKey, loadedAt: Date.now() };
  return cachedKeys;
};

export const getPrivateKey = () => loadKeyPair().privateKey;
export const getPublicKey = () => loadKeyPair().publicKey;
export const reloadSigningKeys = () => {
  cachedKeys = null;
  return loadKeyPair();
};

export default {
  getPrivateKey,
  getPublicKey,
  reloadSigningKeys,
};
