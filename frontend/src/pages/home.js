import { Box, Typography, Link } from "@mui/material";

const Home = () => {
  return (
    <Box sx={{ ml: 3, mt: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold" }}>
        Main Page
      </Typography>
      <Link href="/upload-excel">
        <Typography>Upload a spreadsheet!</Typography>
      </Link>
    </Box>
  );
};

export default Home;
