// src/theme.ts
import { createTheme } from "@mui/material/styles";
import { blue, green, grey, yellow, blueGrey } from "@mui/material/colors";
import { ptBR } from "@mui/material/locale";
import { ptBR as dataGridPtBR } from "@mui/x-data-grid/locales";
import { gridClasses } from "@mui/x-data-grid";
import { Theme } from "@mui/material";

export const theme = createTheme(
  {
    palette: {
      mode: "light",
      primary: {
        main: blue[700],
      },
      success: {
        main: green[600],
      },
      warning: {
        main: yellow[700],
      },
      background: {
        default: grey[50],
        paper: grey[200],
      },
    },
  },
  ptBR,
  dataGridPtBR
);

export const darkTheme = createTheme(
  {
    palette: {
      mode: "dark",
      primary: {
        main: blue[300],
      },
      success: {
        main: green[300],
      },
      warning: {
        main: yellow[400],
      },
      background: {
        default: grey[900],
        paper: blueGrey[900],
      },
    },
  },
  ptBR,
  dataGridPtBR
);

export const dataGridTheme = {
  maxHeight: "100%",
  [`& .${gridClasses.row}`]: {
    bgcolor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? grey[300]
        : grey[800],
  },
  [`& .${gridClasses.columnHeader}`]: {
    bgcolor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? blue[200]
        : blueGrey[900],
  },
  [`& .${gridClasses.footerContainer}`]: {
    bgcolor: (theme: Theme) =>
      theme.palette.mode === "light"
        ? blue[200]
        : blueGrey[900],
  },
  "& .MuiDataGrid-cell:hover": {
    color: "primary.main",
  },
}
