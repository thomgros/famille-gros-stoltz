import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { HouseholdProvider, useHousehold } from "./lib/store";
import { TabBar } from "./components/TabBar";
import { Accueil } from "./pages/Accueil";
import { Grossesse } from "./pages/Grossesse";
import { Reglages } from "./pages/Reglages";
import { Chat, Comparatifs, Listes } from "./pages/Bientot";
import { Chargement, Connexion, Foyer } from "./pages/Connexion";

function App() {
  const { state } = useHousehold();
  if (state.phase === "loading") return <Chargement />;
  if (state.phase === "signed_out") return <Connexion />;
  if (state.phase === "no_household") return <Foyer />;
  return (
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
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HouseholdProvider>
      <App />
    </HouseholdProvider>
  </StrictMode>,
);
