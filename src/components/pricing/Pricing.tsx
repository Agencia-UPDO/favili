import { CheckIcon } from '@/icons';
import { cn } from '@/utils/cn';
import gradientImg from '@public/images/ns-img-496.png';
import Image from 'next/image';
import Link from 'next/link';
import RevealAnimation from '../animation/RevealAnimation';

type PlanId = 'essential' | 'advanced' | 'enterprise';
type FeatureId =
  | 'pages'
  | 'customBranding'
  | 'customDesign'
  | 'comprehensiveBranding'
  | 'seoOptimization'
  | 'brandingSupport'
  | 'tailoredAssistance'
  | 'expertGuidance'
  | 'strategicSupport'
  | 'professionalHelp'
  | 'innovativeStrategies'
  | 'effectiveSolutions'
  | 'holisticSupport'
  | 'dynamicOptions'
  | 'insightfulAdvice'
  | 'valueDrivenSupport';

type PricingPlan = {
  id: PlanId;
  title: string;
  priceLabel: string;
  description: string;
  limit: string;
  delay: number;
  variant: 'standard' | 'highlight';
};

type FeatureRow = {
  id: FeatureId;
  label: string;
  availability: Record<PlanId, boolean>;
};

const featureMatrix: FeatureRow[] = [
  {
    id: 'pages',
    label: 'Pages included',
    availability: { essential: true, advanced: true, enterprise: true },
  },
  {
    id: 'customBranding',
    label: 'Customized branding services',
    availability: { essential: true, advanced: true, enterprise: true },
  },
  {
    id: 'customDesign',
    label: 'Custom design',
    availability: { essential: false, advanced: true, enterprise: true },
  },
  {
    id: 'comprehensiveBranding',
    label: 'Comprehensive branding solutions',
    availability: { essential: false, advanced: false, enterprise: true },
  },
  {
    id: 'seoOptimization',
    label: 'SEO optimization',
    availability: { essential: true, advanced: true, enterprise: false },
  },
  {
    id: 'brandingSupport',
    label: 'Branding support',
    availability: { essential: true, advanced: false, enterprise: true },
  },
  {
    id: 'tailoredAssistance',
    label: 'Tailored branding assistance',
    availability: { essential: false, advanced: true, enterprise: true },
  },
  {
    id: 'expertGuidance',
    label: 'Expert branding guidance',
    availability: { essential: true, advanced: false, enterprise: false },
  },
  {
    id: 'strategicSupport',
    label: 'Strategic branding support',
    availability: { essential: true, advanced: true, enterprise: true },
  },
  {
    id: 'professionalHelp',
    label: 'Professional branding help',
    availability: { essential: false, advanced: false, enterprise: true },
  },
  {
    id: 'innovativeStrategies',
    label: 'Innovative branding strategies',
    availability: { essential: false, advanced: true, enterprise: true },
  },
  {
    id: 'effectiveSolutions',
    label: 'Effective branding solutions',
    availability: { essential: true, advanced: true, enterprise: false },
  },
  {
    id: 'holisticSupport',
    label: 'Holistic branding support',
    availability: { essential: false, advanced: false, enterprise: true },
  },
  {
    id: 'dynamicOptions',
    label: 'Dynamic branding options',
    availability: { essential: false, advanced: true, enterprise: true },
  },
  {
    id: 'insightfulAdvice',
    label: 'Insightful branding advice',
    availability: { essential: false, advanced: false, enterprise: true },
  },
  {
    id: 'valueDrivenSupport',
    label: 'Value-driven branding support',
    availability: { essential: false, advanced: false, enterprise: true },
  },
];

const pricingPlans: PricingPlan[] = [
  {
    id: 'essential',
    title: 'Essential',
    priceLabel: 'Free',
    description: 'Free plan for all users',
    limit: 'Up to 5',
    delay: 0.5,
    variant: 'standard',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    priceLabel: '$99',
    description: 'Plans for advanced users',
    limit: 'Up to 10',
    delay: 0.6,
    variant: 'highlight',
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    priceLabel: 'Enterprise',
    description: 'Contact us for enterprise users',
    limit: 'Unlimited',
    delay: 0.7,
    variant: 'standard',
  },
];

const Pricing = () => {
  return (
    <RevealAnimation delay={0.1}>
      <section className="pt-32 pb-20 sm:pt-36 md:pt-42 md:pb-[100px] lg:pb-[150px] xl:pt-[180px] xl:pb-[200px]">
        <div className="bg-background-1 mx-auto w-full max-w-[1440px] space-y-[70px] rounded-2xl px-5 py-[100px] md:px-6 lg:px-10 xl:px-16 dark:bg-black">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <RevealAnimation delay={0.2}>
              <span className="badge badge-cyan-v2">Our pricing</span>
            </RevealAnimation>
            <RevealAnimation delay={0.3}>
              <h2>Select the pricing plan that best suits your needs.</h2>
            </RevealAnimation>
          </div>
          <div className="grid grid-cols-12 gap-y-8">
            <RevealAnimation delay={0.4}>
              <div className="col-span-12 md:col-span-6 xl:col-span-3">
                <div>
                  <div className="hidden h-[201px] w-[290px] md:block" />
                  <div className="space-y-[10px]">
                    <h3 className="text-heading-6">What’s included</h3>
                    <ul>
                      {featureMatrix.map((feature) => (
                        <li key={feature.id} className="border-b-stroke-4 dark:border-stroke-7 h-14 border-b px-0 py-4">
                          <p className="text-secondary/60 dark:text-accent/60 text-tagline-1 font-normal">
                            {feature.label}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </RevealAnimation>

            {pricingPlans.map((plan) => {
              const isHighlight = plan.variant === 'highlight';
              const isAdvanced = plan.id === 'advanced';

              return (
                <RevealAnimation key={plan.id} delay={plan.delay}>
                  <div className="col-span-12 md:col-span-6 xl:col-span-3">
                    <div>
                      {isHighlight ? (
                        <div className="relative z-10 px-4">
                          <div className="bg-secondary relative overflow-hidden rounded-[20px] px-6 py-8">
                            <div className="absolute -top-28 -right-20 z-20 h-full w-full">
                              <Image src={gradientImg} alt="pricing bg" priority />
                            </div>
                            <div className="relative z-30 space-y-8">
                              <div>
                                <p
                                  className={cn(
                                    'text-tagline-1 mb-3 font-medium',
                                    isHighlight ? 'text-accent/60' : 'text-secondary/60 dark:text-accent/60',
                                  )}>
                                  {plan.title}
                                </p>
                                <h3
                                  className={cn(
                                    'text-heading-5 font-normal',
                                    isHighlight ? 'text-accent' : 'text-secondary dark:text-accent/60',
                                  )}>
                                  {plan.priceLabel}
                                </h3>
                                <p
                                  className={cn(
                                    isHighlight ? 'text-accent/60' : 'text-secondary/60 dark:text-accent/60',
                                  )}>
                                  {plan.description}
                                </p>
                              </div>
                              <Link
                                href="/contact-us"
                                className={cn(
                                  'btn btn-md w-full first-letter:uppercase before:content-none',
                                  isAdvanced
                                    ? 'btn-primary hover:btn-white dark:hover:btn-accent'
                                    : 'btn-white hover:btn-primary dark:btn-white-dark',
                                )}>
                                Get started
                              </Link>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="px-4">
                          <div className="bg-background-3 dark:bg-background-8 space-y-8 rounded-[20px] px-6 py-8">
                            <div>
                              <p
                                className={cn(
                                  'text-tagline-1 mb-3 font-medium',
                                  isHighlight ? 'text-accent/60' : 'text-secondary/60 dark:text-accent/60',
                                )}>
                                {plan.title}
                              </p>
                              <h3
                                className={cn(
                                  'text-heading-5 font-normal',
                                  isHighlight ? 'text-accent' : 'text-secondary dark:text-accent/60',
                                )}>
                                {plan.priceLabel}
                              </h3>
                              <p
                                className={cn(
                                  isHighlight ? 'text-accent/60' : 'text-secondary/60 dark:text-accent/60',
                                )}>
                                {plan.description}
                              </p>
                            </div>
                            <Link
                              href="/contact-us"
                              className={cn(
                                'btn btn-md w-full first-letter:uppercase before:content-none',
                                isAdvanced
                                  ? 'btn-primary hover:btn-white dark:hover:btn-accent'
                                  : 'btn-white hover:btn-primary dark:btn-white-dark',
                              )}>
                              Get started
                            </Link>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col space-y-8 rounded-[20px]">
                        <ul>
                          <li className="border-b-stroke-4 dark:border-stroke-7 h-14 border-b px-6 py-4 text-center">
                            <p className="text-secondary/60 dark:text-accent/60 font-medium">{plan.limit}</p>
                          </li>
                          {featureMatrix.map((feature) => {
                            const isAvailable = feature.availability[plan.id];
                            return (
                              <li
                                key={`${plan.id}-${feature.id}`}
                                className="border-b-stroke-4 dark:border-stroke-7 flex h-14 items-center justify-center border-b px-6 py-4 text-center">
                                <span
                                  className={cn(
                                    'flex size-5 items-center justify-center rounded-full transition-colors',
                                    isAvailable ? 'bg-secondary dark:bg-accent' : 'bg-secondary/30 dark:bg-accent/40',
                                  )}>
                                  <CheckIcon className={cn(!isAvailable && 'opacity-50')} />
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                        <div
                          className={cn(
                            'btn btn-primary hover:btn-white-dark dark:hover:btn-accent btn-md mx-auto w-fit',
                            isHighlight && 'text-center',
                          )}>
                          <Link href="/contact-us">
                            <span>Get started </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </RevealAnimation>
              );
            })}
          </div>
        </div>
      </section>
    </RevealAnimation>
  );
};

Pricing.displayName = 'Pricing';
export default Pricing;
