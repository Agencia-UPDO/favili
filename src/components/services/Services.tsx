import { IService } from '@/interface';
import getMarkDownData from '@/utils/getMarkDownData';
import RevealAnimation from '../animation/RevealAnimation';
import LinkButton from '../ui/button/LinkButton';

const Services = () => {
  const servicesData: IService[] = getMarkDownData<IService & { [key: string]: unknown }>('src/data/services').slice(
    0,
    9,
  );

  return (
    <section className="pt-32 pb-14 sm:pt-36 md:pt-42 md:pb-16 lg:pb-[88px] xl:pt-[180px] xl:pb-[100px]">
      <div className="main-container">
        <div className="mb-[70px] space-y-3 text-center">
          <RevealAnimation delay={0.2}>
            <span className="badge badge-green">Our services</span>
          </RevealAnimation>
          <RevealAnimation delay={0.3}>
            <h2 className="mx-auto max-w-[600px] xl:max-w-[878px]">
              Leading companies around the globe rely on nexSaas.
            </h2>
          </RevealAnimation>
          <RevealAnimation delay={0.4}>
            <p className="mx-auto max-w-[500px] xl:max-w-[700px]">
              Until recently, the prevailing view assumed lorem ipsum was born as a nonsense text. It&apos;s not Latin,
              though it looks like it
            </p>
          </RevealAnimation>
        </div>
        <div className="grid grid-cols-12 gap-y-12 md:gap-14 lg:gap-[72px]">
          {servicesData.map((service, index) => (
            <RevealAnimation key={service.id} delay={0.5 + index * 0.1}>
              <div className="col-span-12 md:col-span-6 lg:col-span-4">
                <div className="space-y-6">
                  <div className="flex items-center justify-center md:items-start md:justify-start">
                    <span className={`${service.icon} text-secondary dark:text-accent text-[52px]`} />
                  </div>
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-heading-5">{service.title}</h3>
                    <p className="line-clamp-3">{service.description}</p>
                  </div>
                  <div className="text-center md:text-left">
                    <LinkButton
                      href={`/services/${service.slug}`}
                      className="btn btn-white dark:btn-transparent dark:hover:btn-accent hover:btn-secondary btn-md">
                      Read more
                    </LinkButton>
                  </div>
                </div>
              </div>
            </RevealAnimation>
          ))}
        </div>
      </div>
    </section>
  );
};

Services.displayName = 'Services';
export default Services;
