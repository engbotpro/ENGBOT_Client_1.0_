import { Box, Container, Typography } from "@mui/material";
import { useParams } from "react-router-dom";

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <Container maxWidth="lg">
      <Box py={5}>
        <Typography variant="h2" gutterBottom>
          Detalhes do Projeto {projectId}
        </Typography>
        {/* Aqui você pode buscar os detalhes do projeto com base no projectId ou passar via props */}
        <Typography>
          Aqui você pode mostrar os detalhes completos do projeto com ID: {projectId}
        </Typography>
      </Box>
    </Container>
  );
};

export default ProjectDetail;
