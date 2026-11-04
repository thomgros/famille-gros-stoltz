import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { HouseholdProvider } from "./lib/store";
import { TabBar } from "./components/TabBar";
import { Accueil } from "./pages/Accueil";
import { Grossesse } from "./pages/Grossesse";
import { Reglages } from "./pages/Reglages";
import { Chat, Comparatifs, Listes } from "./pages/Bientot";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HouseholdProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/grossesse" element={<Grossesse />} />
          <Route path="/listes" element={<Listes />} />
          <Route path="/comparatifs" element={<Comparatifs />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/reglages" element={<Reglages />} />
          <Route path="*" element={<Accueil />} />
        </Routes>
        <TabBar />
      </BrowserRouter>
    </HouseholdProvider>
  </StrictMode>,
);
