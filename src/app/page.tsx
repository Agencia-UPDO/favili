import Atracao from '@/components/empreend/Atracao';
import ChamadaFinal from '@/components/empreend/ChamadaFinal';
import Empresas from '@/components/empreend/Empresas';
import Footer from '@/components/empreend/Footer';
import Galeria from '@/components/empreend/Galeria';
import Header from '@/components/empreend/Header';
import Hero from '@/components/empreend/Hero';
import Sobre from '@/components/empreend/Sobre';

const page = () => {
  return (
    <>
      <Header />
      <main className="overflow-x-hidden bg-white">
        <Hero />
        <Sobre />
        <Empresas />
        <Atracao />
        <Galeria />
        <ChamadaFinal />
      </main>
      <Footer />
    </>
  );
};

export default page;
