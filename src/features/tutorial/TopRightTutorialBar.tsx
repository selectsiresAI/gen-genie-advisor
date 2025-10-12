export function slugFromPath(path: string): string | null {
  const p = path.toLowerCase();
  if (p === "/" || p.startsWith("/home")) return "home";
  if (p.includes("/dashboard")) return "dashboard";
  if (p.includes("/rebanho")) return "rebanho";
  if (p.includes("/auditoria")) return "auditoria";
  if (p.includes("/nexus")) return "nexus";
  return null;
}
