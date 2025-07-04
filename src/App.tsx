import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import "./App.css";
import AuthButton from "./components/global/auth-button";
import Widget from "./components/global/widget";
import ControlLayer from "./layouts/ControlLayer";

const client = new QueryClient();

function App() {
  const [count, setCount] = useState(0);

  return (
    <QueryClientProvider client={client}>
      <ControlLayer>
        <AuthButton />
        <Widget />
      </ControlLayer>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
