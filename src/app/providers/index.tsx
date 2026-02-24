import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "./chakra/provider";
import { queryClient } from "@shared/api/queryClient";

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    return  (<Provider>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
    
    </BrowserRouter>
    </Provider>);
};