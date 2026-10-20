export const inputClass =
  'border-stroke-3 bg-background-1 text-tagline-1 placeholder:text-secondary/50 focus:border-emp-blue text-secondary h-12 w-full rounded-full border px-5 font-normal focus:outline-none';

export const pillClass =
  'text-tagline-2 border-stroke-3 text-secondary/80 hover:border-emp-blue flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full border bg-white font-medium transition-colors duration-200';

export const pillActive = 'border-emp-blue bg-emp-blue hover:border-emp-blue text-white';

export const formatPhone = (value: string) => {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
