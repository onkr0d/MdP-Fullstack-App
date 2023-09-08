import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/home.js";
import NotFound from "./pages/404.js";
import UploadExcel from "./pages/upload-excel.js";
import Success from "./pages/success.js";
import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient();

// Define Routes to each page
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<NotFound />} />
          <Route path="/" element={<Home />} />
          <Route path="/upload-excel" element={<UploadExcel />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
