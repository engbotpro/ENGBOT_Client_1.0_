/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  GridRenderCellParams,
  GridRowId,
  GridRowModes,
  GridRowModesModel,
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import LockResetIcon from "@mui/icons-material/LockReset";
import { Check } from "@mui/icons-material";
import { Fab, IconButton } from "@mui/material";
import { UserRow } from ".";
import { useCreateUserMutation, useDeleteUserMutation, useUpdateUserMutation } from "./userAPI";
import { User } from "../../types";
import useMutationAlert from "../../hooks/useMutationAlert";
import useConfirmationModal from "../../hooks/useConfirmationModal";

interface EditActionsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: GridRenderCellParams<any, any>;
  rowModesModel: GridRowModesModel;
  setRowModesModel: (newModel: GridRowModesModel) => void;
  rows: UserRow[];
  setRows: (newRows: UserRow[]) => void;  
  users: User[];
}

function EditActions(props: EditActionsProps) {
  const { params, rowModesModel, setRowModesModel, rows, setRows, users } = props;
  const [createUser, createResult] = useCreateUserMutation();
  const [updateUser, updateResult] = useUpdateUserMutation();
  const [deleteUser, deleteResult] = useDeleteUserMutation();

  useMutationAlert(createResult);
  useMutationAlert(updateResult);
  useMutationAlert(deleteResult);

  const [confirm, ConfirmationModal] = useConfirmationModal();

  const currentRow = params.row;
  const id = params.row.id;
  const isInEditMode = rowModesModel[currentRow.id]?.mode === GridRowModes.Edit;

  const handleEditClick = (id: GridRowId) => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleCancelClick = (id: GridRowId) => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
  };

  const handleConfirmClick = (id: GridRowId) => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleSaveClick = (id: GridRowId) => {
    // Procura em todos os rows (banco + novos)
    const editedRow = rows.find((row) => row.id === id);
    // Verifica se o row já existia ou não
    const isOldRow = users.findIndex((u) => u.id === id); 
    if (editedRow!.hasChanged) {
      if (isOldRow !== -1) { 
        const { hasChanged, created_at, updated_at, ...newUser } = editedRow!;
        updateUser(newUser); 
      } else {
        const { hasChanged, id, created_at, updated_at, ...newUser } = editedRow!;
        createUser(newUser);
      }
    }
  };

  const handleDeleteClick = async (id: GridRowId) => {
    const editedRow = rows.find((row) => row.id === id);
    if (editedRow!.hasChanged) {
      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      });

      const editedRow = rows.find((row) => row.id === id);
      if (editedRow!.hasChanged) {
        setRows(rows.filter((row) => row.id !== id));
      }
    } else {
      const choice = await confirm('Tem certeza que deseja deletar o usuário: ' + editedRow?.name + '?');
      if (choice) {
        deleteUser(id.toString());
      }
    }
  };

 const handlePasswordReset = async (rowId: string) => {
    const user = users.find((u) => u.id === rowId);
    if (!user) return;

    const ok = await confirm(
      `Tem certeza que deseja redefinir a senha do usuário: ${user.name}?`
    );
    if (ok) await updateUser({ id: rowId, password: 'C@sop' });
  };

  if (isInEditMode) {
    return (
      <>
        <IconButton
          onClick={() => handleConfirmClick(id)}
        >
          <Check />
        </IconButton>
        <IconButton
          onClick={() => handleCancelClick(id)}
        >
          <CancelIcon />
        </IconButton>
      </>
    );
  }

  return (
    <>
      <ConfirmationModal />
      <IconButton
        onClick={() => handleEditClick(id)}
      >
        <EditIcon />
      </IconButton>
      {params.row.hasChanged && 
        <IconButton
          onClick={() => handleSaveClick(id)}
        >
          <SaveIcon />
        </IconButton>
      }
      <Fab
        color="error"
        sx={{ height: 35, width: 35, m: 1}}
        onClick={() => handleDeleteClick(id)}
      >
        <DeleteIcon />
      </Fab>
      <Fab
        color="warning"
        sx={{ height: 35, width: 35}}
        onClick={() => handlePasswordReset(id)}
      >
        <LockResetIcon />
      </Fab>
    </>
  );
}

export default EditActions;
