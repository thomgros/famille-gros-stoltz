import { ComingSoon, Page } from "../components/ui";

export function Listes() {
  return (
    <Page title="Listes">
      <ComingSoon
        step={3}
        title="To-do et achats"
        items={[
          "Les 41 tâches du projet, par mois, avec priorité, échéance et responsable",
          "Filtres « en retard », « cette semaine », « ce mois », par catégorie",
          "Les articles du trousseau : à la naissance, plus tard, optionnel",
          "Prix prévu, prix payé, lien d'achat, acheté par qui",
          "Ajouter, modifier, supprimer : Julia et Thomas voient les mêmes cases cochées",
        ]}
      />
    </Page>
  );
}

export function Comparatifs() {
  return (
    <Page title="Comparatifs">
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
    <Page title="Chat">
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
