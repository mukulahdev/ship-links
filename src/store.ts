import { randomBytes } from "node:crypto";

export interface Link {
  code: string;
  url: string;
  clicks: number;
  createdAt: string;
}

export interface LinkStore {
  create(url: string, code?: string): Promise<Link>;
  get(code: string): Promise<Link | undefined>;
  recordClick(code: string): Promise<Link | undefined>;
}

export class CodeTakenError extends Error {
  constructor(code: string) {
    super(`code "${code}" is already taken`);
    this.name = "CodeTakenError";
  }
}

export class MemoryLinkStore implements LinkStore {
  #links = new Map<string, Link>();

  async create(url: string, code?: string): Promise<Link> {
    const finalCode = code ?? this.#newCode();
    if (this.#links.has(finalCode)) {
      throw new CodeTakenError(finalCode);
    }
    const link: Link = {
      code: finalCode,
      url,
      clicks: 0,
      createdAt: new Date().toISOString(),
    };
    this.#links.set(finalCode, link);
    return { ...link };
  }

  async get(code: string): Promise<Link | undefined> {
    const link = this.#links.get(code);
    return link ? { ...link } : undefined;
  }

  async recordClick(code: string): Promise<Link | undefined> {
    const link = this.#links.get(code);
    if (!link) return undefined;
    link.clicks += 1;
    return { ...link };
  }

  #newCode(): string {
    let code: string;
    do {
      code = randomBytes(6).toString("base64url");
    } while (this.#links.has(code));
    return code;
  }
}
