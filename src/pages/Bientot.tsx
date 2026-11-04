import { ComingSoon, Page } from "../components/ui";

export function Comparatifs() {
  return (
    <Page tone="sky" title="Comparatifs" subtitle="Nos choix d'équipement">
      <ComingSoon
        step={5}
        title="Tous les comparatifs du projet"
        items={[
          "Poussette et cosy, lait, cododo, porte-bébé, lit évolutif, couches, doudou, babyphone, clim, mode de garde",
          "Reco, alternatives, écartés, avec prix modifiables",
          "Statut « à décider / choisi / acheté », bouton « Choisir » qui l'ajoute aux achats",
          "Ajouter un nouveau comparatif",
        ]}
      />
    </Page>
  );
}

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
