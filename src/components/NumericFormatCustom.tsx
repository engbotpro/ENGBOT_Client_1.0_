import { forwardRef, useMemo } from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

interface NumericFormatCustomProps
  extends Omit<NumericFormatProps, 'onValueChange' | 'getInputRef' | 'value'> {
  name: string;
  onChange: (event: { target: { name: string; value: string } }) => void;
  value?: number | string;
}

const NumericFormatCustom = forwardRef<
  HTMLInputElement,
  NumericFormatCustomProps
>(function NumericFormatCustom(props, ref) {
  const { onChange, name, value, ...other } = props;
  
  // Converte o valor para string no formato esperado pelo NumericFormat
  // Se for número, converte para string sem formatação
  // Se for string, usa diretamente (já deve estar no formato raw)
  const numericValue = useMemo(() => {
    if (value === undefined || value === null || value === '') return '';
    if (typeof value === 'number') {
      // Converte número para string no formato raw (ex: 1234.56 -> "1234.56")
      return value.toString().replace(',', '.');
    }
    // Se já for string, remove formatação e converte para formato raw
    if (typeof value === 'string') {
      // Remove separadores de milhar e converte vírgula para ponto
      return value.replace(/\./g, '').replace(',', '.');
    }
    return value;
  }, [value]);
  
  // Handler para melhorar a experiência de edição
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Seleciona todo o texto ao focar, facilitando a edição
    // Usa setTimeout para garantir que o valor já foi renderizado
    setTimeout(() => {
      e.target.select();
    }, 0);
  };
  
  // Handler para melhorar o comportamento ao clicar
  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    // Seleciona todo o texto ao clicar, facilitando a edição
    // Usa setTimeout para garantir que o valor já foi renderizado
    setTimeout(() => {
      e.currentTarget.select();
    }, 0);
  };
  
  // Handler para melhorar o comportamento ao tocar (mobile)
  const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
    // Previne o comportamento padrão e seleciona todo o texto
    if (e.detail > 1) {
      e.preventDefault();
    }
  };
  
  return (
    <NumericFormat
      {...other}
      // liga o ref ao <input> interno
      getInputRef={ref}
      // formato PT‑BR
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      allowLeadingZeros={false}
      value={numericValue}
      // Permite valores vazios durante a edição
      isAllowed={(values) => {
        // Permite valores vazios ou valores válidos
        if (!values.value) return true;
        const numValue = parseFloat(values.value);
        return !isNaN(numValue) && numValue >= 0;
      }}
      // quando muda, dispara onChange no padrão do MUI
      onValueChange={(values) => {
        onChange({
          target: {
            name,
            // values.value é a string "raw", ex: "1234.56"
            value: values.value || '0',
          },
        });
      }}
      // Melhora a experiência de edição
      onFocus={handleFocus}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    />
  );
});

// Componente para campos de porcentagem
interface PercentageFormatCustomProps
  extends Omit<NumericFormatProps, 'onValueChange' | 'getInputRef' | 'value'> {
  name: string;
  onChange: (event: { target: { name: string; value: string } }) => void;
}

export const PercentageFormatCustom = forwardRef<
  HTMLInputElement,
  PercentageFormatCustomProps
>(function PercentageFormatCustom(props, ref) {
  const { onChange, name, ...other } = props;
  return (
    <NumericFormat
      {...other}
      getInputRef={ref}
      // formato PT‑BR para porcentagem
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      allowNegative={false}
      // quando muda, dispara onChange no padrão do MUI
      onValueChange={(values) => {
        onChange({
          target: {
            name,
            value: values.value,
          },
        });
      }}
    />
  );
});

export default NumericFormatCustom;
