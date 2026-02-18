/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { sendSuccess, sendError } from "../features/notificationSlice";
import { QueryStatus } from "@reduxjs/toolkit/query";

interface MutationResult {
  status?: QueryStatus | string;
  isError?: boolean;
  isSuccess?: boolean;
  data?: any;
  error?: any;
}

const useMutationAlert = (mutationResult: MutationResult) => {
  const dispatch = useDispatch();
  const processedErrorsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Debug: log para verificar a estrutura do erro
    if (mutationResult.isError || mutationResult.error) {
      console.log('🔍 useMutationAlert - Erro detectado:', {
        isError: mutationResult.isError,
        status: mutationResult.status,
        error: mutationResult.error,
        errorData: mutationResult.error?.data,
        errorStatus: mutationResult.error?.status,
      });
    }

    // Verifica sucesso - usando isSuccess ou status === 'fulfilled'
    const isSuccess = mutationResult.isSuccess || 
      mutationResult.status === QueryStatus.fulfilled || 
      mutationResult.status === 'fulfilled';
    
    if (isSuccess && mutationResult.data) {
      // Tenta usar message ou msg para mensagens de sucesso
      const successMessage = mutationResult.data.message || mutationResult.data.msg;
      if (successMessage) {
        dispatch(sendSuccess(successMessage));
      }
    }
    
    // Verifica erro - usando isError, status === 'rejected', ou se error existe
    const isError = mutationResult.isError || 
      mutationResult.status === QueryStatus.rejected || 
      mutationResult.status === 'rejected' ||
      (mutationResult.error && mutationResult.status !== QueryStatus.fulfilled && mutationResult.status !== 'fulfilled');
    
    if (isError && mutationResult.error) {
      // Cria uma chave única para o erro para evitar processar o mesmo erro múltiplas vezes
      const errorKey = JSON.stringify({
        status: mutationResult.error?.status,
        data: mutationResult.error?.data,
      });
      
      // Se já processou este erro, pula
      if (processedErrorsRef.current.has(errorKey)) {
        return;
      }
      
      // Marca como processado
      processedErrorsRef.current.add(errorKey);
      
      // Tenta várias possibilidades de formato de erro
      let errorMessage = 
        mutationResult.error?.data?.error ||  // Backend retorna { error: "..." }
        mutationResult.error?.data?.msg ||    // Alguns endpoints retornam { msg: "..." }
        mutationResult.error?.message ||      // Erro padrão do fetch
        (typeof mutationResult.error === 'string' ? mutationResult.error : null) || // Se error é string direta
        "Usuário ou senha incorretos";
      const debug = mutationResult.error?.data?._debug;
      if (debug?.message) {
        errorMessage += ` (${debug.code || ""}: ${debug.message})`;
      }
      
      // Adiciona detalhes se existirem
      const details = mutationResult.error?.data?.details 
        ? `: ${mutationResult.error.data.details.join(', ')}`
        : "";
      
      console.log('📢 useMutationAlert - Disparando notificação de erro:', errorMessage + details);
      dispatch(sendError(errorMessage + details));
    } else {
      // Limpa o Set quando não há erro para permitir novos erros
      processedErrorsRef.current.clear();
    }
  }, [mutationResult, dispatch]);
};

export default useMutationAlert;
