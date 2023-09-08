import { Typography, Box, Link } from "@mui/material";

const Success = () => {
  return (
    <Box sx={{ mt: 3, ml: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold" }}>
        Spreadsheet successfully uploaded!
      </Typography>

      <Link href="/">
        <Typography>Return to home page</Typography>
      </Link>
    </Box>
  );
};

export default Success;
