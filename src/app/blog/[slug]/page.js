import { getBlogPosts, getBlogPost, markdownToHtml } from '@/lib/content';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateStaticParams() {
  return getBlogPosts().map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const post = getBlogPost(params.slug);
  if (!post) return {};
  return { title: `${post.frontmatter.title} — Padmanabha Banerjee` };
}

export default async function BlogPostPage({ params }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();
  const html = await markdownToHtml(post.content);
  const date = post.frontmatter.date ? new Date(post.frontmatter.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <Link href="/blog" className="font-mono text-[9px] text-cream-dim/30 tracking-wider hover:text-[var(--gold)] transition-colors">← All posts</Link>
      <header className="mt-8 mb-10">
        <h1 className="section-title mb-3">{post.frontmatter.title}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {date && <span className="font-mono text-[11px] text-cream-dim/40 tracking-wider">{date}</span>}
          {post.frontmatter.tags?.map(t => (
            <span key={t} className="font-mono text-[9px] tracking-wider uppercase text-[var(--gold)]/30 px-2 py-0.5 rounded-full bg-[var(--gold-ghost)]">{t}</span>
          ))}
        </div>
        <div className="mt-4 w-12 h-px bg-gradient-to-r from-[var(--gold)]/40 to-transparent" />
      </header>
      <div className="prose-custom" dangerouslySetInnerHTML={{ __html: html }} />
      <footer className="mt-16 pt-6 border-t border-cream-ghost">
        <Link href="/blog" className="font-mono text-[9px] text-cream-dim/30 tracking-wider hover:text-[var(--gold)] transition-colors">← More posts</Link>
      </footer>
    </div>
  );
}
