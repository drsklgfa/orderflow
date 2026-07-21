import Link from 'next/link';

export function EmptyState({ title, text, action, href }: { title: string; text: string; action?: string; href?: string }) {
  return <div className="empty-state"><div className="empty-icon">◇</div><h2>{title}</h2><p>{text}</p>{action && href && <Link className="button primary" href={href}>{action}</Link>}</div>;
}
