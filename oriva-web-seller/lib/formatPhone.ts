export function formatPhoneBF(phone: string | null, country: string | null): string {
  if (!phone) return "—";
  const code = country || "+226";
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 8) {
    return `${code} ${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 8)}`;
  }
  return `${code} ${clean}`;
}

export function providerLabel(provider: string | null): string {
  switch (provider) {
    case "ligdicash_orange_bf":
      return "Orange Money";
    case "ligdicash_moov_bf":
      return "Moov Money";
    case "mock":
      return "Test (dev)";
    default:
      return "Non renseigné";
  }
}

export function providerColor(provider: string | null): string {
  switch (provider) {
    case "ligdicash_orange_bf":
      return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    case "ligdicash_moov_bf":
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    case "mock":
      return "bg-gray-500/10 text-gray-400 border-gray-500/30";
    default:
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
  }
}
