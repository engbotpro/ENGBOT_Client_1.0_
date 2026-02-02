import { GridRowModes, GridRowModesModel, GridRowsProp, GridToolbarContainer, GridToolbarProps, ToolbarPropsOverrides } from "@mui/x-data-grid";
import { Button } from "@mui/material";
import { v4 as uuidv4 } from 'uuid';
import AddIcon from "@mui/icons-material/Add";

interface EditToolbarProps {
    setUserRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel,
    ) => void;
  }
  
function EditToolbar(props: EditToolbarProps & GridToolbarProps & ToolbarPropsOverrides) {
    const { setUserRows, setRowModesModel } = props;

    const handleClick = () => {
        const id = uuidv4();
        setUserRows((oldRows) => [
            ...oldRows, 
            { id, name: '', nip: '', perfil: '', active: true, created_at: '', om: '', currentPlan: '', hasChanged: true }
        ]);
        setRowModesModel((oldModel) => ({
        ...oldModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' },
        }));
    };

    return (
        <GridToolbarContainer sx={{ m: 1 }}>
            <Button color="primary" variant="contained" startIcon={<AddIcon />} onClick={handleClick}>
                Criar Usuário
            </Button>
        </GridToolbarContainer>
    );
}

export default EditToolbar;