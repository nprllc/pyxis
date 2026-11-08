/* Connexion au service de comptes (Supabase). Ces deux valeurs sont publiques par conception :
   la protection vient des règles d'accès de la base (chacun ne voit que ses propres données).
   Laisser vide tant que le service n'est pas créé : le site marche alors sans compte. */
window.PYXIS_CLOUD = {
  url: "",
  anonKey: "",
};
