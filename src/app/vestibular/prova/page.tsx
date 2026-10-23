import ProvaApp from '@/components/vestibular/prova/ProvaApp';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prova · Vestibular Conquista Vidal 2027.1 | Faculdade Vidal',
  robots: { index: false },
};

const page = () => (
  <main className="bg-background-3 min-h-screen px-4 py-6 md:py-10">
    <ProvaApp />
  </main>
);

export default page;
