// src/features/auth/GoogleRedirectHandler.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from './authSlice';

export default function GoogleRedirectHandler() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // roda só 1x na montagem
    const params = new URLSearchParams(window.location.search);
    const token = params.get('googleToken');

    console.log('🚩 GoogleRedirectHandler recebeu token:', token);

    if (token) {
      // 1) grava + despacha
      dispatch(login({ token }));
      // 2) leva pra home
      navigate('/home', { replace: true });
    } else {
      // se quiser, redirecione quem acessou /login/google-redirect sem token
      navigate('/login', { replace: true });
    }
  }, []); // <-- deps vazias

  return null; // ou um <Spinner />
}
