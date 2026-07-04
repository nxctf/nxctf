import * as LucideIcons from "lucide-react";
import { HelpCircle } from "lucide-react";

export type CtfIcon = {
  name: string;
  label: string;
};

export const CTF_ICONS: CtfIcon[] = [
  { name: "Lightbulb", label: "Help / Info" },
  { name: "FolderOpen", label: "Folder / General" },
  { name: "Flag", label: "Flag / Challenge" },
  { name: "Trophy", label: "Trophy / Winner" },
  { name: "Award", label: "Award / Badge" },
  { name: "Zap", label: "Zap / Speed" },
  { name: "Globe", label: "Globe / Web" },
  { name: "Server", label: "Server / Host" },
  { name: "Database", label: "Database / SQL" },
  { name: "Network", label: "Network / Connection" },
  { name: "Cloud", label: "Cloud / AWS" },
  { name: "Lock", label: "Lock / Cipher" },
  { name: "Key", label: "Key / Solution" },
  { name: "Shield", label: "Shield / Defensive" },
  { name: "Skull", label: "Skull / Pwn" },
  { name: "Flame", label: "Flame / Hot" },
  { name: "Bomb", label: "Bomb / Exploit" },
  { name: "Terminal", label: "Terminal / CLI" },
  { name: "FileCode", label: "FileCode / Script" },
  { name: "Search", label: "Search / Audit" },
  { name: "Eye", label: "Eye / Monitor" },
  { name: "Fingerprint", label: "Fingerprint / Forensics" },
  { name: "FileSearch", label: "FileSearch / Logs" },
  { name: "MapPin", label: "MapPin / OSINT" },
  { name: "Brain", label: "Brain / AI" },
  { name: "Cpu", label: "Cpu / Reverse" },
  { name: "Bot", label: "Bot / Agent" },
  { name: "Wrench", label: "Wrench / Hardware" },
  // ── Security / Vulns ──────────────────────────────
  { name: "Bug", label: "Bug / Web Vuln" },
  { name: "ShieldAlert", label: "ShieldAlert / Alert" },
  { name: "ShieldX", label: "ShieldX / Breach" },
  { name: "Unlock", label: "Unlock / Bypass" },
  { name: "Crosshair", label: "Crosshair / Precision" },
  { name: "Target", label: "Target / Targeting" },
  // ── Network / Wireless ────────────────────────────
  { name: "Wifi", label: "Wifi / Wireless" },
  { name: "Radio", label: "Radio / Signal" },
  { name: "Scan", label: "Scan / Recon" },
  // ── Code / Dev ────────────────────────────────────
  { name: "Code", label: "Code / Programming" },
  { name: "Code2", label: "Code2 / Review" },
  { name: "GitBranch", label: "GitBranch / Source" },
  { name: "Package", label: "Package / Dependency" },
  { name: "Hash", label: "Hash / Hashing" },
  // ── Forensics / Analysis ──────────────────────────
  { name: "HardDrive", label: "HardDrive / Storage" },
  { name: "FileText", label: "FileText / Document" },
  { name: "Archive", label: "Archive / Forensics" },
  { name: "Microscope", label: "Microscope / Analysis" },
  // ── Misc ──────────────────────────────────────────
  { name: "Laptop", label: "Laptop / Device" },
  { name: "Layers", label: "Layers / Misc" },
  { name: "Puzzle", label: "Puzzle / Challenge" },
];

export function RenderLucideIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const IconComp = (LucideIcons as Record<string, unknown>)[name] as
    React.ElementType | undefined;
  const Icon = IconComp ?? HelpCircle;
  return <Icon className={className} />;
}
