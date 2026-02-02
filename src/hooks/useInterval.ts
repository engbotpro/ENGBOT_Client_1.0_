import { useEffect, useRef } from "react";

function useInterval(callback: () => void, delay?: number | null) {
  const savedCallback = useRef<() => void>(() => {});

  // Atualiza a referência para a última callback recebida
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Configura o intervalo
  useEffect(() => {
    // Se delay for null ou undefined, não inicia o intervalo
    if (delay === null || delay === undefined) return;

    const id = setInterval(() => savedCallback.current(), delay);

    return () => clearInterval(id);
  }, [delay]);

}

export default useInterval;
