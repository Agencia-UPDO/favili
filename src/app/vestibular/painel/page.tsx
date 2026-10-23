import Painel from '@/components/vestibular/painel/Painel';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Painel · Vestibular Conquista Vidal 2027.1',
  robots: { index: false, follow: false },
};

const page = () => (
  <main className="bg-background-3 min-h-screen px-3 py-6 md:px-5">
    <Painel />
  </main>
);

export default page;
