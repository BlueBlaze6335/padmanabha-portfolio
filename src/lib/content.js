import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const CONTENT = path.join(process.cwd(), 'content');

export function getBlogPosts() {
  const dir = path.join(CONTENT, 'blog');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).map(f => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
    return { slug: f.replace('.md', ''), frontmatter: data, content };
  }).sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date));
}

export function getBlogPost(slug) {
  const fp = path.join(CONTENT, 'blog', `${slug}.md`);
  if (!fs.existsSync(fp)) return null;
  const { data, content } = matter(fs.readFileSync(fp, 'utf8'));
  return { slug, frontmatter: data, content };
}

export async function markdownToHtml(md) {
  return (await remark().use(html).process(md)).toString();
}

export function getJSON(subpath) {
  const fp = path.join(CONTENT, subpath);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}
