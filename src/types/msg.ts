// src/types/msg.ts

export interface MessagePayload {
  chatId: string;
  building: string;
  senderId?: string;
  sender: string;
  text: string;
  timestamp: string;
  // … quaisquer outros campos necessários
}

export interface SendResponse {
  ok: boolean;
  seq: number;   // número de sequência do JetStream, se quiser usar
}



// Payload para enviar o estado de alarme
export interface ButtonsStatePayload {
  // se você tinha outras propriedades (ex.: id, chatId, createdAt…), deixe-as aqui também
  superficie: string;
  aereo: string;
  submarino: string;
}


export interface PresenceUser {
  id:   string;
  name: string;
  foto?: string;
  om?:   string;
}

 export type PlotForm = {
  origem: string;
  navio: string;
  numeroAlvo: string;
  numeroTiro: string;
  conteiraED: string;
  conteiraVal: string;
  elevacaoSinal: string;
  elevacaoVal: string;
};

export interface AlarmConfirmPayload {
  chatId: string;
  text:   string;
  bg:     string;
  senderId: string;
}

export interface ReplyInfo {
  /** id da mensagem original (útil para rolar até ela).  */
  id?: number | string;

  /** Nome do remetente da mensagem original. */
  senderName: string;

  /** Trecho (preview) da mensagem original. */
  message: string;

  /** Horário da mensagem original; opcional para UI simplificada. */
  timestamp?: string;
}