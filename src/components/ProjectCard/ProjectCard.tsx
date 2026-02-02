import { Typography, Grid, styled } from "@mui/material";
import StyledButton from "../StyledButton/StyledButton";
import { Link } from "react-router-dom";

export interface ProjectCardProps {
  title: string;
 
  srcImg: string;
  description: string;
  
  
}

const StyledImg = styled("img")(({ theme }) => ({
  width: "100%",
  objectFit: "contain",
  height: "80vw",
  padding: "10px 0",
  [theme.breakpoints.up("md")]: {
    height: "45vh",
  },
}));

const StyledCard = styled("div")(({ theme }) => ({
  borderRadius: 3,
  border: `0.5px solid ${theme.palette.primary.contrastText}`,
  backgroundColor: "transparent",
  color: theme.palette.primary.contrastText,
  padding: "20px",
  "&:hover": {
    backgroundColor: theme.palette.primary.light,
  },
}));

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  
  srcImg,
  description,
  
 
}) => {
  

  return (
    <StyledCard>
      <Typography variant="h5">{title}</Typography>
      
      <StyledImg src={srcImg} alt={title} />

      <Typography>{description}</Typography>

      

      {/* Botões ----------------------------------------------------------- */}
      <Grid container spacing={1} pt={2}>
        

       
      </Grid>
    </StyledCard>
  );
};

export default ProjectCard;
