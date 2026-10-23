// Regras de validação da inscrição, usadas no formulário e de novo na API

export const soDigitos = (valor: string) => valor.replace(/\D/g, '');

// "12345678909" → "123.456.789-09" (formata enquanto digita)
export const formatarCpf = (valor: string) => {
  const d = soDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
};

// Confere os dois dígitos verificadores; recusa sequências repetidas como 111.111.111-11
export const cpfValido = (valor: string) => {
  const d = soDigitos(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) {
    return false;
  }
  const digito = (base: string, pesoInicial: number) => {
    const soma = [...base].reduce((total, n, i) => total + Number(n) * (pesoInicial - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(d.slice(0, 9), 10) === Number(d[9]) && digito(d.slice(0, 10), 11) === Number(d[10]);
};

export const emailValido = (valor: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());

// Celular com DDD: 11 dígitos começando por 9 depois do DDD
export const celularValido = (valor: string) => /^[1-9]{2}9\d{8}$/.test(soDigitos(valor));

// Idade na data da prova; o vestibular é para quem já concluiu ou conclui o ensino médio
export const idadeEm = (nascimento: string, referencia = new Date('2026-11-21T12:00:00-03:00')) => {
  const n = new Date(`${nascimento}T12:00:00-03:00`);
  if (Number.isNaN(n.getTime())) {
    return NaN;
  }
  let idade = referencia.getFullYear() - n.getFullYear();
  const m = referencia.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && referencia.getDate() < n.getDate())) {
    idade--;
  }
  return idade;
};
