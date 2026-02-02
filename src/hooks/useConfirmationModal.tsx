import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

type UseConfirmationModal = [
  (msg: string) => Promise<boolean>, // confirm function
  () => JSX.Element // ConfirmationModal component
];

function useConfirmationModal(): UseConfirmationModal {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);

  const confirm = (msg: string): Promise<boolean> => {
    setMessage(msg);
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolveCallback(() => resolve);
    });
  };

  const handleConfirm = () => {
    setOpen(false);
    if (resolveCallback) resolveCallback(true);
  };

  const handleClose = () => {
    setOpen(false);
    if (resolveCallback) resolveCallback(false);
  };

  const ConfirmationModal = (): JSX.Element => (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Confirmar Ação</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{whiteSpace: 'pre-wrap'}} >{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}  >
          Voltar
        </Button>
        <Button onClick={handleConfirm} variant='contained' color="error">
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );

  return [confirm, ConfirmationModal];
}

export default useConfirmationModal;
