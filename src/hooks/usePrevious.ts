import { useEffect, useRef } from "react";

/**
 * Armazena o valor anterior de uma variável.
 *
 * @param value O valor atual que desejamos rastrear.
 * @returns O valor anterior, ou undefined se ainda não existe anterior.
 */
export default function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
