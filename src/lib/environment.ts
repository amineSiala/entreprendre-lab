export const online = process.env.NEXT_PUBLIC_SESSION_MODE === "online";
export const connectionHint = online
  ? "Partagez le lien : Wi-Fi ou données mobiles, chacun peut rejoindre la partie."
  : "Utilisez le même Wi-Fi que le présentateur.";
export const storageHint = online
  ? "Vos réponses sont conservées dans la base de données du site. Aucun compte personnel n’est nécessaire."
  : "Vos réponses restent sur l’ordinateur du présentateur.";
