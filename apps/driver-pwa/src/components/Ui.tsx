import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { AppIcon, type AppIconName } from "./AppIcon";

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <section className="mobile-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children ? <div className="intro-copy">{children}</div> : null}</section>;
}

export function PrimaryButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`primary-cta ${className}`.trim()} {...props}>{children}</button>;
}

export function SecondaryButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`secondary-cta ${className}`.trim()} {...props}>{children}</button>;
}

export function InfoRow({ icon, label, value, detail }: { icon: AppIconName; label: string; value: ReactNode; detail?: ReactNode }) {
  return <div className="info-row"><span className="info-icon"><AppIcon name={icon} /></span><div><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</div></div>;
}

export function InfoNotice({ children }: { children: ReactNode }) {
  return <aside className="info-notice"><AppIcon name="warning" size={20} /><p>{children}</p></aside>;
}

export function AuthGate({ title, copy }: { title: string; copy: string }) {
  return <section className="empty-state"><span className="empty-icon"><AppIcon name="user" size={32} /></span><h1>{title}</h1><p>{copy}</p><Link className="primary-link" to="/login">Entrar na conta</Link><Link className="secondary-link" to="/signup">Criar conta</Link><Link className="text-link" to="/scan">Continuar como visitante pelo QR</Link></section>;
}
