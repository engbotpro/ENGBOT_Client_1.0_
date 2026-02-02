import { Box, Divider, Typography } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridEventListener,
  GridRenderCellParams,
  GridRowEditStopReasons,
  GridRowModel,
  GridRowModesModel,
  GridSlots,
} from "@mui/x-data-grid";
import { useState, useEffect, useMemo } from "react";
import { useGetUsersQuery } from "./userAPI";
import { User } from "../../types";
import { format } from "date-fns";
import EditToolbar from "./UserToolbar";
import EditActions from "./UserActions";
import { dataGridTheme } from "../../theme";
import { RootState } from "../../store";
import { useSelector } from "react-redux";

declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    setUserRows: React.Dispatch<React.SetStateAction<UserRow[]>>;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel
    ) => void;
  }
}

export interface UserRow extends User {
  hasChanged: boolean;
}

const Users = () => {
 // const { userInfo } = useSelector((state: RootState) => state.auth);
  const [usersRow, setUsersRow] = useState<UserRow[]>([]);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [unitList, setUnitList] = useState<string[]>([""]);  
  const { data: users, isLoading, isFetching } = useGetUsersQuery();
  

  useEffect(() => {
    if (!users) return;
    setUsersRow(
      users.map<UserRow>((u) => ({
        ...u,
        // Converter null/undefined para string vazia para o select funcionar
        currentPlan: u.currentPlan || '',
        hasChanged: false,
      }))
    );
  }, [users, isLoading, isFetching]);

  let perfilOptions = ["usuario", "Admin"];
  
  // Opções de planos disponíveis (usando string vazia para representar "Sem plano")
  const planOptions = [
    '', // Sem plano (será convertido para null ao salvar)
    'INICIANTE BLACK',
    'ENTUSIASTA BLACK',
    'ESTRATEGISTA BLACK',
    'PREMIUM BLACK'
  ];

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const processRowUpdate = (newRow: GridRowModel) => {
    // Converter string vazia em null para currentPlan, mas manter o valor se foi selecionado
    const processedRow = {
      ...newRow,
      currentPlan: newRow.currentPlan === '' || newRow.currentPlan === null || newRow.currentPlan === undefined ? null : newRow.currentPlan,
      hasChanged: true
    } as UserRow;
    setUsersRow(
      usersRow.map((row) => (row.id === newRow.id ? processedRow : row))
    );
    return processedRow;
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };



  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "foto",
        headerName: "Foto",
        width: 60,
        
        sortable: false,
        filterable: false,
        editable: true,
      },
      {
        field: "name",
        headerName: "Nome",
        cellClassName: "bold-text",
        width: 170,
        flex: 1,
        editable: true,
      },
      { field: "email", headerName: "E-mail", width: 120, editable: true },     
     
      {
        field: "perfil",
        headerName: "Perfil",
        width: 100,
        type: "singleSelect",
         valueOptions: perfilOptions,
        editable: true,
      },
      {
        field: "currentPlan",
        headerName: "Plano",
        width: 180,
        type: "singleSelect",
        valueOptions: planOptions,
        editable: true,
        valueFormatter: (value?: string | null) => {
          return value || 'Sem plano';
        },
        renderCell: (params) => {
          return params.value || 'Sem plano';
        },
      },
      {
        field: "active",
        headerName: "Situação",
        width: 100,
        type: "boolean",
        editable: true,
      },
      {
        field: "created_at",
        headerName: "Criado em",
        width: 180,
        flex: 1,
        valueFormatter: (value?: string) => {
          if (value) {
            return format(value, "yyyy-MM-dd HH:mm:ss");
          }
        },
      },
      {
        field: "actions",
        width: 200,
        headerName: "Ações",
        flex: 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderCell: (params: GridRenderCellParams<any, any>) => (
          <EditActions
            params={params}
            rowModesModel={rowModesModel}
            setRowModesModel={setRowModesModel}
            rows={usersRow}
            setRows={setUsersRow}
            
            users={users!}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usersRow, rowModesModel]
  );

  return (
    <>
      <Box
        sx={{
          height: 800,
          width: "100%",
          display: "flex",
          px: 1,
          flexDirection: "column",
          "& .bold-text": {
            fontWeight: "600",
          },
        }}
      >
        <Typography
          variant="h4"
          component="h4"
          sx={{ textAlign: "left", m: 3, fontWeight: "bold" }}
        >
          Gerência de Usuários
        </Typography>
        <Divider sx={{ alignSelf: "center", width: "90%", mb: 3 }} />
        {usersRow && (
          <DataGrid
            columns={columns}
            rows={usersRow}
            editMode="row"
            rowModesModel={rowModesModel}
            onRowModesModelChange={handleRowModesModelChange}
            onRowEditStop={handleRowEditStop}
            processRowUpdate={processRowUpdate}
            slots={{
              toolbar: EditToolbar as GridSlots["toolbar"],
            }}
            slotProps={{
              toolbar: { setUserRows: setUsersRow, setRowModesModel },
            }}
            getRowSpacing={(params) => ({
              top: params.isFirstVisible ? 0 : 2,
              bottom: params.isLastVisible ? 0 : 2,
            })}
            sx={dataGridTheme}
          />
        )}
      </Box>
    </>
  );
};

export default Users;


