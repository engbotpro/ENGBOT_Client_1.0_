import { useEffect } from "react";

export const useKeyDown = (callback: () => void, keys: string[]) => {
  const onKeyDown = (event: KeyboardEvent) => {
    if (keys.includes(event.key)) {
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [callback, keys]); // Dependências corrigidas

};
