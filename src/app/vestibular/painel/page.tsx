import Painel from '@/components/vestibular/painel/Painel';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Painel · Vestibular Conquista Vidal 2027.1',
  robots: { index: false, follow: false },
};

const page = () => (
  <main className="bg-background-3 min-h-screen px-4 py-8">
    <Painel />
  </main>
);

export default page;
