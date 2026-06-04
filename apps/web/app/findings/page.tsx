import { Card, Kicker, Tag } from '@mentisix/ui';
import Link from 'next/link';
import { Nav } from '../../components/Nav';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Post = {
  slug: string;
  title: string;
  date: string;
  dek: string;
  tags: readonly string[];
};

const POSTS: readonly Post[] = [
  {
    slug: '01-llm-spatial-reasoning',
    title: 'I tested seven frontier LLMs on a 12×12 grid. None of them can reliably find treasure.',
    date: '2026-06-04',
    dek: 'gpt-4o-mini and gpt-4o both fail Mentisix Treasure Hunt v0 in the same families of ways. Reasoning traces, charts, and a public dataset to reproduce it.',
    tags: ['Treasure Hunt v0', 'spatial reasoning', 'open dataset'],
  },
];

export default function FindingsIndex() {
  return (
    <>
      <Nav />
      <main
        style={{
          minHeight: '100dvh',
          padding: 'clamp(112px, 14vh, 160px) clamp(20px, 5vw, 84px) 80px',
          maxWidth: 980,
          margin: '0 auto',
        }}
      >
        <Header />

        <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {POSTS.map((p, i) => (
            <PostCard key={p.slug} post={p} index={String(POSTS.length - i).padStart(2, '0')} />
          ))}
        </div>
      </main>
    </>
  );
}

function Header() {
  return (
    <div>
      <Kicker index="07">Findings</Kicker>
      <h1
        style={{
          fontSize: 'clamp(40px, 6vw, 64px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          margin: '14px 0 18px',
          color: 'var(--mx-bone)',
        }}
      >
        Writeups, in real time.
      </h1>
      <p
        style={{
          fontSize: 17,
          color: 'var(--mx-fog)',
          maxWidth: '54ch',
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        What we learn from running models against Mentisix. Every claim links to public replays and
        downloadable trajectory data. Reproduce any number on this site in three commands.
      </p>
    </div>
  );
}

function PostCard({ post, index }: { post: Post; index: string }) {
  return (
    <Card title={`/ ${index}`}>
      <Link href={`/findings/${post.slug}`} style={{ textDecoration: 'none' }}>
        <div
          style={{ padding: '22px 26px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div
            style={{
              fontFamily: 'var(--mx-font-mono)',
              fontSize: 10.5,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--mx-fog-dim)',
            }}
          >
            {post.date}
          </div>
          <h2
            style={{
              fontSize: 'clamp(22px, 2.8vw, 28px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              margin: 0,
              color: 'var(--mx-bone)',
              lineHeight: 1.25,
            }}
          >
            {post.title}
          </h2>
          <p
            style={{
              fontSize: 15,
              color: 'var(--mx-fog)',
              lineHeight: 1.55,
              margin: 0,
              maxWidth: '64ch',
            }}
          >
            {post.dek}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {post.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: 'var(--mx-font-mono)',
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--mx-signal)',
            }}
          >
            Read →
          </div>
        </div>
      </Link>
    </Card>
  );
}

export const metadata = {
  title: 'Findings · Mentisix',
  description:
    'Writeups from the Mentisix lab. Every claim links to public replays and downloadable data.',
};
