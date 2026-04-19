import { getBlogPosts, getBlogPost, markdownToHtml } from '@/lib/content';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BlogPostNav from '@/components/BlogPostNav';

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
    <BlogPostNav>
      <article className="px-4 pt-16 pb-10 max-w-2xl mx-auto">
        <header className="mb-10">
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
        <footer className="mt-16 pt-6 border-t border-cream-ghost flex items-center justify-between">
          <Link href="/blog" className="font-mono text-[10px] text-cream-dim tracking-wider uppercase hover:text-[var(--gold)] transition-colors">← More posts</Link>
          <Link href="/?s=6" className="font-mono text-[10px] text-cream-dim/60 tracking-wider uppercase hover:text-[var(--gold)] transition-colors">Wavelength ↗</Link>
        </footer>
      </article>
    </BlogPostNav>
  );
}
