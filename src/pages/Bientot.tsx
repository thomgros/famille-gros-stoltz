import { ComingSoon, Page } from "../components/ui";

export function Chat() {
  return (
    <Page tone="rose" title="Chat" subtitle="Aliments et substances">
      <ComingSoon
        step={6}
        title="Aliments et substances pendant la grossesse"
        items={[
          "Poser une question : « Je peux manger des sushis ? », « Le Doliprane, c'est bon ? »",
          "Réponse ✅ autorisé, ⚠️ avec précautions ou ❌ à éviter, avec la source",
          "Basé sur Santé publique France, l'ANSES et le CRAT",
          "Fiche « à éviter » consultable hors connexion",
        ]}
      />
    </Page>
  );
}
