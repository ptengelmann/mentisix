import { Nav } from '../../components/Nav';
import { RunViewer } from '../../components/RunViewer';

export default function DojoPage() {
  return (
    <>
      <Nav />
      <main
        style={{
          minHeight: '100dvh',
          padding: 'clamp(112px, 14vh, 160px) clamp(20px, 5vw, 84px) 80px',
          maxWidth: 1240,
          margin: '0 auto',
        }}
      >
        <RunViewer />
      </main>
    </>
  );
}

export const metadata = {
  title: 'Dojo',
  description: 'Drop an LLM into a 12x12 grid and watch it solve.',
};
