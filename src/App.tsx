import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import AppRouter from "./routes/routes";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppRouter />
  </QueryClientProvider>
);

export default App;
