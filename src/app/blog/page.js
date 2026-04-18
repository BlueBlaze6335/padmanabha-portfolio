import { getBlogPosts } from '@/lib/content';
import Link from 'next/link';

export const metadata = { title: 'Wavelength — Padmanabha Banerjee' };

export default function BlogPage() {
  const posts = getBlogPosts();
  return (
    <div className="min-h-screen px-4 py-8 max-w-xl mx-auto">
      <Link href="/" className="font-mono text-[9px] text-cream-dim/30 tracking-wider hover:text-[var(--gold)] transition-colors">← Journey</Link>
      <h1 className="section-title mt-6 mb-1">Wavelength</h1>
      <p className="mono-label text-cream-dim/40 mb-8">Writing · Thinking</p>
      {posts.map(post => (
        <Link key={post.slug} href={`/blog/${post.slug}`} className="block py-5 border-b border-cream-ghost hover:pl-2 transition-all group">
          <span className="mono-label text-cream-dim/35">{post.frontmatter.date ? new Date(post.frontmatter.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}</span>
          <h2 className="font-body text-xl text-cream mt-1 group-hover:text-[var(--gold)] transition-colors">{post.frontmatter.title}</h2>
          {post.frontmatter.excerpt && <p className="font-body text-[13px] text-cream-dim mt-1 leading-relaxed">{post.frontmatter.excerpt}</p>}
        </Link>
      ))}
      {posts.length === 0 && <p className="font-body text-cream-dim text-center py-12">Coming soon.</p>}
    </div>
  );
}
