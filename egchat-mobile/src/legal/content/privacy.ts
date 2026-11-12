import type { LegalDocContent, LegalLang } from "../types";

// Política de privacidad — 24 apartados, misma estructura en los cuatro idiomas. Texto revisado el 12-11 (versión 1.1.0): más breve, explicativo y con el mismo alcance.

const es: LegalDocContent = {
  "title": "Política de privacidad",
  "subtitle": "Cómo tratamos y protegemos tus datos personales",
  "preamble": [
    "Esta Política explica qué datos trata EGCHAT, para qué, con quién se comparten y cómo puedes ejercer tus derechos. Se aplica a la app, a sus funciones de mensajería, llamadas, comunidades y monedero.",
    "El responsable del tratamiento es el operador de EGCHAT, con domicilio de contacto en Malabo, República de Guinea Ecuatorial."
  ],
  "sections": [
    {
      "id": "s1",
      "title": "Responsable del tratamiento",
      "paragraphs": [
        "EGCHAT es la marca con la que se presta el servicio. El responsable del tratamiento de tus datos es el operador de EGCHAT, con domicilio de contacto en Malabo, República de Guinea Ecuatorial.",
        "Para cualquier cuestión de privacidad puedes escribir a soporte@egchat.gq indicando el motivo en el asunto."
      ]
    },
    {
      "id": "s2",
      "title": "Información de registro y perfil",
      "paragraphs": [
        "Tratamos el número de teléfono verificado, el nombre, la foto, la descripción del perfil y el idioma elegido. Estos datos permiten crear la cuenta, identificarte ante otros usuarios y mostrarte la app en tu idioma.",
        "Algunos campos son obligatorios para usar el servicio y otros son opcionales. Puedes cambiar o eliminar los opcionales desde Ajustes."
      ]
    },
    {
      "id": "s3",
      "title": "Datos de dispositivos, direcciones IP y registros técnicos",
      "paragraphs": [
        "Recibimos el modelo y sistema del dispositivo, la versión de la app, identificadores de instalación, tokens de notificaciones push, la dirección IP en los registros del servidor, la fecha y hora de las peticiones y los errores técnicos.",
        "Usamos estos datos para seguridad, prevención de abuso, diagnóstico y facturación de infraestructura. El registro de aceptación de documentos legales no almacena direcciones IP."
      ]
    },
    {
      "id": "s4",
      "title": "Contactos, cuando autorizas su acceso",
      "paragraphs": [
        "Si concedes permiso, accedemos a los números de tu agenda para mostrarte qué contactos ya usan EGCHAT. No usamos esa información para publicidad ni la vendemos.",
        "Puedes revocar el permiso en los ajustes del sistema; dejaremos de sincronizar la agenda, sin afectar a los contactos ya añadidos."
      ]
    },
    {
      "id": "s5",
      "title": "Mensajes, archivos y contenido compartido",
      "paragraphs": [
        "Tratamos el contenido de los mensajes privados y de grupo, los archivos adjuntos, las notas de voz, las imágenes, los estados, los momentos y las publicaciones en canales y comunidades, junto con sus metadatos de envío y lectura.",
        "Los mensajes se cifran en tránsito y se almacenan en nuestros servidores para entregarlos y sincronizarlos. La mensajería no aplica cifrado de extremo a extremo de forma general. El respaldo del historial puede cifrarse con una clave que solo tú conoces."
      ]
    },
    {
      "id": "s6",
      "title": "Datos de llamadas de audio y vídeo",
      "paragraphs": [
        "Para las llamadas tratamos los identificadores de los participantes, la hora, la duración y los datos técnicos de conexión. El audio y el vídeo viajan cifrados entre los dispositivos y no se graban por defecto.",
        "Si grabas o difundes una llamada, eres responsable de informar y obtener el consentimiento de los participantes."
      ]
    },
    {
      "id": "s7",
      "title": "Datos de localización, cuando existe autorización",
      "paragraphs": [
        "Algunas funciones, como compartir la ubicación en un chat o buscar servicios cercanos, requieren acceso a tu ubicación. Solo la usamos mientras la función está activa y con tu permiso.",
        "Puedes desactivar la ubicación en los ajustes del sistema. Dejarás de compartirla, aunque el historial de lo ya enviado permanece en la conversación."
      ]
    },
    {
      "id": "s8",
      "title": "Información del monedero y transacciones",
      "paragraphs": [
        "Tratamos el saldo, los movimientos, las referencias de operación, los datos de identidad exigidos por la normativa y la información necesaria para prevenir el fraude.",
        "No almacenamos el PIN de pagos en texto legible ni lo mostramos. Los datos financieros se conservan durante los plazos legales aplicables, incluso después de cerrar la cuenta."
      ]
    },
    {
      "id": "s9",
      "title": "Información de pagos a creadores",
      "paragraphs": [
        "Para pagar a creadores tratamos su identidad verificada, los datos de cobro y la información fiscal necesaria. Estos datos se comparten con la entidad de pago que ejecuta la operación.",
        "El creador debe mantener actualizados sus datos y cumple sus propias obligaciones fiscales."
      ]
    },
    {
      "id": "s10",
      "title": "Datos procesados por funciones de inteligencia artificial",
      "paragraphs": [
        "Cuando usas LIA o funciones similares, tratamos el texto, las imágenes y el contexto que envías para generar la respuesta. Esos datos pueden procesarse mediante proveedores de modelos de terceros.",
        "No envíes información sensible que no quieras que se procese. No usamos tus conversaciones con el asistente para publicidad."
      ]
    },
    {
      "id": "s11",
      "title": "Cookies y tecnologías similares",
      "paragraphs": [
        "La app móvil no usa cookies de navegador. Utiliza almacenamiento local del dispositivo y identificadores técnicos para mantener la sesión, recordar preferencias y proteger el servicio.",
        "Puedes borrar el almacenamiento local desde los ajustes del sistema o cerrando la sesión, según la función."
      ]
    },
    {
      "id": "s12",
      "title": "Finalidades y bases jurídicas del tratamiento",
      "paragraphs": [
        "Tratamos datos para ejecutar el contrato de servicio, cumplir obligaciones legales, proteger la seguridad y prevenir el fraude, y atender intereses legítimos como mejorar la app.",
        "Cuando la ley lo exige, pedimos consentimiento, por ejemplo para acceder a contactos o a la ubicación. Puedes retirarlo en cualquier momento."
      ]
    },
    {
      "id": "s13",
      "title": "Proveedores y encargados del tratamiento",
      "paragraphs": [
        "Nos apoyamos en proveedores que tratan datos por nuestra cuenta: Supabase (base de datos y archivos), Render (API), Expo/EAS (actualizaciones y compilaciones), Firebase (tiempo real), Twilio (SMS), Vercel (web), Groq (modelos de IA) y Apple y Google (notificaciones y distribución).",
        "Estos proveedores actúan bajo contrato y solo pueden usar los datos para prestar el servicio acordado."
      ]
    },
    {
      "id": "s14",
      "title": "Transferencias internacionales de datos",
      "paragraphs": [
        "Algunos proveedores están fuera de Guinea Ecuatorial, principalmente en Estados Unidos y la Unión Europea. Cuando corresponde, aplicamos garantías contractuales y medidas de seguridad para la transferencia.",
        "Puedes solicitar información sobre las garantías aplicables por los canales del apartado 23."
      ]
    },
    {
      "id": "s15",
      "title": "Plazos de conservación",
      "paragraphs": [
        "Conservamos los datos mientras la cuenta esté activa y durante los plazos legales aplicables. Los registros técnicos se guardan el tiempo necesario para seguridad y diagnóstico.",
        "Al eliminar la cuenta suprimimos o anonimizamos los datos personales, salvo los que debamos conservar por obligación legal o para atender reclamaciones."
      ]
    },
    {
      "id": "s16",
      "title": "Seguridad y protección de datos",
      "paragraphs": [
        "Aplicamos cifrado en tránsito, controles de acceso y separación de entornos. Las imágenes de verificación de identidad se cifran en el dispositivo antes de subirse.",
        "Ningún sistema es infalible. Si se produce un incidente relevante, actuamos para contenerlo y lo comunicamos cuando la ley lo exige."
      ]
    },
    {
      "id": "s17",
      "title": "Derechos de los usuarios",
      "paragraphs": [
        "Puedes acceder a tus datos, corregirlos, suprimirlos, limitar u oponerte a su tratamiento, pedir su portabilidad y retirar tu consentimiento cuando sea la base jurídica.",
        "También puedes presentar una reclamación ante la autoridad de protección de datos competente. Para ejercer tus derechos escríbenos a soporte@egchat.gq."
      ]
    },
    {
      "id": "s18",
      "title": "Acceso, rectificación y eliminación de datos",
      "paragraphs": [
        "Puedes consultar y editar los datos de tu perfil desde Ajustes. La eliminación de la cuenta se solicita en la misma sección y suprime el perfil y el contenido asociado.",
        "Algunos registros financieros y de seguridad se conservan durante el plazo legal, aunque la cuenta se haya cerrado."
      ]
    },
    {
      "id": "s19",
      "title": "Exportación y portabilidad de la información",
      "paragraphs": [
        "Puedes solicitar una copia de los datos que nos diste y de tu actividad en un formato legible por máquina.",
        "Atendemos la solicitud en un plazo razonable y, cuando la ley fija uno concreto, dentro de ese plazo."
      ]
    },
    {
      "id": "s20",
      "title": "Protección de menores",
      "paragraphs": [
        "EGCHAT es un servicio para mayores de 18 años. No recopilamos conscientemente datos de menores.",
        "Si detectamos una cuenta de un menor, la suspendemos y eliminamos los datos asociados conforme a esta Política."
      ]
    },
    {
      "id": "s21",
      "title": "Notificación de incidentes de seguridad",
      "paragraphs": [
        "Si se produce una brecha que afecte a tus datos, la investigamos, la contenemos y la notificamos a las autoridades y a los usuarios afectados cuando la ley lo exija.",
        "También publicamos recomendaciones para proteger tu cuenta cuando el incidente lo justifica."
      ]
    },
    {
      "id": "s22",
      "title": "Modificaciones de esta política",
      "paragraphs": [
        "Podemos actualizar esta Política por cambios legales o técnicos. Publicamos la nueva versión con su fecha y avisamos en la app cuando el cambio es relevante.",
        "Si el cambio es sustancial, pedimos una nueva aceptación antes de seguir usando el servicio."
      ]
    },
    {
      "id": "s23",
      "title": "Contacto del responsable de privacidad",
      "paragraphs": [
        "Para consultas, derechos o reclamaciones de privacidad escribe a soporte@egchat.gq indicando el motivo en el asunto.",
        "Respondemos en un plazo razonable y, cuando la ley fija uno concreto, dentro de ese plazo."
      ]
    },
    {
      "id": "s24",
      "title": "Marco jurídico por jurisdicción",
      "paragraphs": [
        "Cuando te encuentres en la Unión Europea aplicamos el Reglamento General de Protección de Datos. En los países africanos en los que operamos aplicamos la legislación nacional de protección de datos y el marco de la CEMAC en lo que resulte aplicable. Para usuarios en Estados Unidos aplicamos las leyes estatales de privacidad que correspondan y, para usuarios en China, la Ley de Protección de Información Personal (PIPL).",
        "Estas normas pueden exigir requisitos adicionales de información, consentimiento o ejercicio de derechos. EGCHAT revisa cada mercado antes de operar y publica avisos específicos cuando corresponde. Esta Política no convierte a EGCHAT en una entidad financiera autorizada."
      ]
    }
  ],
  "closing": [
    "Versión 1.1.0 · Vigente desde el 12 de noviembre de 2026.",
    "Esta Política se redacta para que puedas entenderla sin conocimientos técnicos. Si algo no está claro, escríbenos."
  ]
};

const fr: LegalDocContent = {
  "title": "Politique de confidentialité",
  "subtitle": "Comment nous traitons et protégeons vos données personnelles",
  "preamble": [
    "La présente Politique explique quelles données EGCHAT traite, dans quel but, avec qui elles sont partagées et comment vous pouvez exercer vos droits. Elle s'applique à l'application et à ses fonctions de messagerie, d'appels, de communautés et de portefeuille.",
    "Le responsable du traitement est l'opérateur d'EGCHAT, dont le domicile de contact est situé à Malabo, République de Guinée équatoriale."
  ],
  "sections": [
    {
      "id": "s1",
      "title": "Responsable du traitement",
      "paragraphs": [
        "EGCHAT est la marque sous laquelle le service est fourni. Le responsable du traitement de vos données est l'opérateur d'EGCHAT, dont le domicile de contact est situé à Malabo, République de Guinée équatoriale.",
        "Pour toute question de confidentialité, vous pouvez écrire à soporte@egchat.gq en indiquant le motif dans l'objet."
      ]
    },
    {
      "id": "s2",
      "title": "Informations d'inscription et de profil",
      "paragraphs": [
        "Nous traitons le numéro de téléphone vérifié, le nom, la photo, la description du profil et la langue choisie. Ces données permettent de créer le compte, de vous identifier auprès des autres utilisateurs et de vous présenter l'application dans votre langue.",
        "Certains champs sont obligatoires pour utiliser le service et d'autres sont facultatifs. Vous pouvez modifier ou supprimer les champs facultatifs depuis les Réglages."
      ]
    },
    {
      "id": "s3",
      "title": "Données des appareils, adresses IP et journaux techniques",
      "paragraphs": [
        "Nous recevons le modèle et le système de l'appareil, la version de l'application, les identifiants d'installation, les jetons de notifications push, l'adresse IP dans les journaux du serveur, la date et l'heure des requêtes et les erreurs techniques.",
        "Nous utilisons ces données à des fins de sécurité, de prévention des abus, de diagnostic et de facturation de l'infrastructure. Le registre d'acceptation des documents juridiques ne conserve pas d'adresses IP."
      ]
    },
    {
      "id": "s4",
      "title": "Contacts, lorsque vous en autorisez l'accès",
      "paragraphs": [
        "Si vous accordez l'autorisation, nous accédons aux numéros de votre répertoire afin de vous montrer quels contacts utilisent déjà EGCHAT. Nous n'utilisons pas ces informations à des fins publicitaires et ne les vendons pas.",
        "Vous pouvez révoquer l'autorisation dans les réglages du système ; nous cessons alors de synchroniser le répertoire, sans affecter les contacts déjà ajoutés."
      ]
    },
    {
      "id": "s5",
      "title": "Messages, fichiers et contenus partagés",
      "paragraphs": [
        "Nous traitons le contenu des messages privés et de groupe, les fichiers joints, les notes vocales, les images, les statuts, les moments et les publications dans les canaux et communautés, ainsi que leurs métadonnées d'envoi et de lecture.",
        "Les messages sont chiffrés en transit et stockés sur nos serveurs afin d'être remis et synchronisés. La messagerie n'applique pas de chiffrement de bout en bout de manière générale. La sauvegarde de l'historique peut être chiffrée avec une clé que vous seul connaissez."
      ]
    },
    {
      "id": "s6",
      "title": "Données des appels audio et vidéo",
      "paragraphs": [
        "Pour les appels, nous traitons les identifiants des participants, l'heure, la durée et les données techniques de connexion. L'audio et la vidéo circulent chiffrés entre les appareils et ne sont pas enregistrés par défaut.",
        "Si vous enregistrez ou diffusez un appel, vous êtes responsable d'informer les participants et d'obtenir leur consentement."
      ]
    },
    {
      "id": "s7",
      "title": "Données de localisation, lorsqu'une autorisation existe",
      "paragraphs": [
        "Certaines fonctions, comme le partage de la position dans une conversation ou la recherche de services à proximité, nécessitent l'accès à votre localisation. Nous ne l'utilisons que pendant que la fonction est active et avec votre autorisation.",
        "Vous pouvez désactiver la localisation dans les réglages du système. Vous cesserez de la partager, bien que l'historique de ce qui a déjà été envoyé reste dans la conversation."
      ]
    },
    {
      "id": "s8",
      "title": "Informations du portefeuille et transactions",
      "paragraphs": [
        "Nous traitons le solde, les mouvements, les références d'opération, les données d'identité exigées par la réglementation et les informations nécessaires à la prévention de la fraude.",
        "Nous ne stockons pas le code PIN de paiement en texte lisible et ne l'affichons pas. Les données financières sont conservées pendant les délais légaux applicables, même après la fermeture du compte."
      ]
    },
    {
      "id": "s9",
      "title": "Informations sur les paiements aux créateurs",
      "paragraphs": [
        "Pour payer les créateurs, nous traitons leur identité vérifiée, leurs coordonnées de paiement et les informations fiscales nécessaires. Ces données sont partagées avec l'établissement de paiement qui exécute l'opération.",
        "Le créateur doit tenir ses données à jour et remplit ses propres obligations fiscales."
      ]
    },
    {
      "id": "s10",
      "title": "Données traitées par les fonctions d'intelligence artificielle",
      "paragraphs": [
        "Lorsque vous utilisez LIA ou des fonctions similaires, nous traitons le texte, les images et le contexte que vous envoyez afin de générer la réponse. Ces données peuvent être traitées par des fournisseurs de modèles tiers.",
        "N'envoyez pas d'informations sensibles que vous ne souhaitez pas voir traitées. Nous n'utilisons pas vos conversations avec l'assistant à des fins publicitaires."
      ]
    },
    {
      "id": "s11",
      "title": "Cookies et technologies similaires",
      "paragraphs": [
        "L'application mobile n'utilise pas de cookies de navigateur. Elle recourt au stockage local de l'appareil et à des identifiants techniques pour maintenir la session, mémoriser les préférences et protéger le service.",
        "Vous pouvez effacer le stockage local depuis les réglages du système ou en fermant la session, selon la fonction."
      ]
    },
    {
      "id": "s12",
      "title": "Finalités et bases juridiques du traitement",
      "paragraphs": [
        "Nous traitons des données pour exécuter le contrat de service, respecter des obligations légales, protéger la sécurité et prévenir la fraude, et satisfaire des intérêts légitimes tels que l'amélioration de l'application.",
        "Lorsque la loi l'exige, nous demandons votre consentement, par exemple pour accéder aux contacts ou à la localisation. Vous pouvez le retirer à tout moment."
      ]
    },
    {
      "id": "s13",
      "title": "Fournisseurs et sous-traitants",
      "paragraphs": [
        "Nous nous appuyons sur des fournisseurs qui traitent des données pour notre compte : Supabase (base de données et fichiers), Render (API), Expo/EAS (mises à jour et compilations), Firebase (temps réel), Twilio (SMS), Vercel (web), Groq (modèles d'IA) et Apple et Google (notifications et distribution).",
        "Ces fournisseurs agissent dans le cadre d'un contrat et ne peuvent utiliser les données que pour fournir le service convenu."
      ]
    },
    {
      "id": "s14",
      "title": "Transferts internationaux de données",
      "paragraphs": [
        "Certains fournisseurs se trouvent hors de Guinée équatoriale, principalement aux États-Unis et dans l'Union européenne. Lorsque cela s'applique, nous mettons en œuvre des garanties contractuelles et des mesures de sécurité pour le transfert.",
        "Vous pouvez demander des informations sur les garanties applicables via les canaux de la section 23."
      ]
    },
    {
      "id": "s15",
      "title": "Délais de conservation",
      "paragraphs": [
        "Nous conservons les données tant que le compte est actif et pendant les délais légaux applicables. Les journaux techniques sont conservés le temps nécessaire à la sécurité et au diagnostic.",
        "Lors de la suppression du compte, nous supprimons ou anonymisons les données personnelles, sauf celles que nous devons conserver en vertu d'une obligation légale ou pour traiter des réclamations."
      ]
    },
    {
      "id": "s16",
      "title": "Sécurité et protection des données",
      "paragraphs": [
        "Nous appliquons un chiffrement en transit, des contrôles d'accès et une séparation des environnements. Les images de vérification d'identité sont chiffrées sur l'appareil avant d'être téléversées.",
        "Aucun système n'est infaillible. En cas d'incident significatif, nous agissons pour le contenir et le communiquons lorsque la loi l'exige."
      ]
    },
    {
      "id": "s17",
      "title": "Droits des utilisateurs",
      "paragraphs": [
        "Vous pouvez accéder à vos données, les rectifier, les supprimer, limiter ou vous opposer à leur traitement, demander leur portabilité et retirer votre consentement lorsqu'il constitue la base juridique.",
        "Vous pouvez également introduire une réclamation auprès de l'autorité de protection des données compétente. Pour exercer vos droits, écrivez-nous à soporte@egchat.gq."
      ]
    },
    {
      "id": "s18",
      "title": "Accès, rectification et suppression des données",
      "paragraphs": [
        "Vous pouvez consulter et modifier les données de votre profil depuis les Réglages. La suppression du compte se demande dans la même section et supprime le profil ainsi que le contenu associé.",
        "Certains registres financiers et de sécurité sont conservés pendant le délai légal, même si le compte a été fermé."
      ]
    },
    {
      "id": "s19",
      "title": "Export et portabilité des informations",
      "paragraphs": [
        "Vous pouvez demander une copie des données que vous nous avez fournies et de votre activité dans un format lisible par machine.",
        "Nous traitons la demande dans un délai raisonnable et, lorsque la loi en fixe un précis, dans ce délai."
      ]
    },
    {
      "id": "s20",
      "title": "Protection des mineurs",
      "paragraphs": [
        "EGCHAT est un service destiné aux personnes de plus de 18 ans. Nous ne collectons pas sciemment de données concernant des mineurs.",
        "Si nous détectons le compte d'un mineur, nous le suspendons et supprimons les données associées conformément à la présente Politique."
      ]
    },
    {
      "id": "s21",
      "title": "Notification des incidents de sécurité",
      "paragraphs": [
        "En cas de violation affectant vos données, nous l'examinons, la contenons et la notifions aux autorités et aux utilisateurs concernés lorsque la loi l'exige.",
        "Nous publions également des recommandations pour protéger votre compte lorsque l'incident le justifie."
      ]
    },
    {
      "id": "s22",
      "title": "Modifications de cette politique",
      "paragraphs": [
        "Nous pouvons mettre à jour la présente Politique en raison de changements légaux ou techniques. Nous publions la nouvelle version avec sa date et prévenons dans l'application lorsque le changement est significatif.",
        "Si le changement est substantiel, nous demandons une nouvelle acceptation avant de poursuivre l'utilisation du service."
      ]
    },
    {
      "id": "s23",
      "title": "Contact du responsable de la confidentialité",
      "paragraphs": [
        "Pour les questions, droits ou réclamations en matière de confidentialité, écrivez à soporte@egchat.gq en indiquant le motif dans l'objet.",
        "Nous répondons dans un délai raisonnable et, lorsque la loi en fixe un précis, dans ce délai."
      ]
    },
    {
      "id": "s24",
      "title": "Cadre juridique par juridiction",
      "paragraphs": [
        "Lorsque vous vous trouvez dans l'Union européenne, nous appliquons le Règlement général sur la protection des données (RGPD). Dans les pays africains où nous opérons, nous appliquons la législation nationale de protection des données et le cadre de la CEMAC pour autant qu'il soit applicable. Pour les utilisateurs aux États-Unis, nous appliquons les lois étatiques de confidentialité applicables et, pour les utilisateurs en Chine, la loi sur la protection des informations personnelles (PIPL).",
        "Ces règles peuvent exiger des informations, un consentement ou des modalités d'exercice des droits supplémentaires. EGCHAT examine chaque marché avant d'y opérer et publie des avis spécifiques lorsque cela s'applique. La présente Politique ne fait pas d'EGCHAT une entité financière agréée."
      ]
    }
  ],
  "closing": [
    "Version 1.1.0 · En vigueur depuis le 12 novembre 2026.",
    "La présente Politique est rédigée pour que vous puissiez la comprendre sans connaissances techniques. Si quelque chose n'est pas clair, écrivez-nous."
  ]
};

const en: LegalDocContent = {
  "title": "Privacy Policy",
  "subtitle": "How we process and protect your personal data",
  "preamble": [
    "This Policy explains what data EGCHAT processes, for what purposes, with whom it is shared and how you can exercise your rights. It applies to the app and to its messaging, calling, communities and wallet features.",
    "The controller of the processing is the EGCHAT operator, with its contact address in Malabo, Equatorial Guinea."
  ],
  "sections": [
    {
      "id": "s1",
      "title": "Data controller",
      "paragraphs": [
        "EGCHAT is the brand under which the service is provided. The controller of your data is the EGCHAT operator, with its contact address in Malabo, Equatorial Guinea.",
        "For any privacy matter you may write to soporte@egchat.gq, stating the reason in the subject line."
      ]
    },
    {
      "id": "s2",
      "title": "Registration and profile information",
      "paragraphs": [
        "We process your verified phone number, your name, your photo, your profile description and the language you have chosen. This data allows us to create the account, identify you to other users and display the app in your language.",
        "Some fields are mandatory in order to use the service and others are optional. You can change or delete the optional ones from Settings."
      ]
    },
    {
      "id": "s3",
      "title": "Device data, IP addresses and technical logs",
      "paragraphs": [
        "We receive the model and system of the device, the app version, installation identifiers, push notification tokens, the IP address in server logs, the date and time of requests and technical errors.",
        "We use this data for security, abuse prevention, diagnostics and infrastructure billing. The record of acceptance of legal documents does not store IP addresses."
      ]
    },
    {
      "id": "s4",
      "title": "Contacts, when you authorise access",
      "paragraphs": [
        "If you grant permission, we access the numbers in your address book in order to show you which contacts already use EGCHAT. We do not use that information for advertising or sell it.",
        "You can revoke the permission in your system settings; we will stop synchronising your address book, without affecting the contacts already added."
      ]
    },
    {
      "id": "s5",
      "title": "Messages, files and shared content",
      "paragraphs": [
        "We process the content of private and group messages, attachments, voice notes, images, status updates, moments and posts in channels and communities, together with their sending and reading metadata.",
        "Messages are encrypted in transit and stored on our servers in order to deliver and synchronise them. Messaging does not apply end-to-end encryption as a general rule. Chat backup may be encrypted with a key that only you know."
      ]
    },
    {
      "id": "s6",
      "title": "Audio and video call data",
      "paragraphs": [
        "For calls we process the identifiers of the participants, the time, the duration and technical connection data. Audio and video travel encrypted between the devices and are not recorded by default.",
        "If you record or broadcast a call, you are responsible for informing the participants and obtaining their consent."
      ]
    },
    {
      "id": "s7",
      "title": "Location data, where authorisation exists",
      "paragraphs": [
        "Some features, such as sharing your location in a chat or searching for nearby services, require access to your location. We use it only while the feature is active and with your permission.",
        "You can turn off location in your system settings. You will stop sharing it, although the history of what has already been sent remains in the conversation."
      ]
    },
    {
      "id": "s8",
      "title": "Wallet and transaction information",
      "paragraphs": [
        "We process your balance, your transactions, transaction references, the identity data required by regulation and the information necessary to prevent fraud.",
        "We do not store the payments PIN in readable form or display it. Financial data is retained for the applicable legal periods, including after the account is closed."
      ]
    },
    {
      "id": "s9",
      "title": "Payment information for creators",
      "paragraphs": [
        "In order to pay creators we process their verified identity, their payout details and the necessary tax information. This data is shared with the payment entity that executes the transaction.",
        "Creators must keep their data up to date and meet their own tax obligations."
      ]
    },
    {
      "id": "s10",
      "title": "Data processed by artificial intelligence features",
      "paragraphs": [
        "When you use LIA or similar features, we process the text, the images and the context you send in order to generate the response. That data may be processed by third-party model providers.",
        "Do not send sensitive information that you do not want processed. We do not use your conversations with the assistant for advertising."
      ]
    },
    {
      "id": "s11",
      "title": "Cookies and similar technologies",
      "paragraphs": [
        "The mobile app does not use browser cookies. It uses local storage on the device and technical identifiers to maintain the session, remember preferences and protect the service.",
        "You can clear local storage from your system settings or by signing out, depending on the feature."
      ]
    },
    {
      "id": "s12",
      "title": "Purposes and legal bases of the processing",
      "paragraphs": [
        "We process data in order to perform the service contract, comply with legal obligations, protect security and prevent fraud, and pursue legitimate interests such as improving the app.",
        "Where the law requires it, we ask for consent, for example to access contacts or location. You may withdraw it at any time."
      ]
    },
    {
      "id": "s13",
      "title": "Providers and data processors",
      "paragraphs": [
        "We rely on providers that process data on our behalf: Supabase (database and files), Render (API), Expo/EAS (updates and builds), Firebase (real time), Twilio (SMS), Vercel (web), Groq (AI models) and Apple and Google (notifications and distribution).",
        "These providers act under contract and may use the data only to provide the agreed service."
      ]
    },
    {
      "id": "s14",
      "title": "International transfers of data",
      "paragraphs": [
        "Some providers are outside Equatorial Guinea, mainly in the United States and the European Union. Where applicable, we apply contractual safeguards and security measures for the transfer.",
        "You may request information about the applicable safeguards through the channels in section 23."
      ]
    },
    {
      "id": "s15",
      "title": "Retention periods",
      "paragraphs": [
        "We retain data while the account is active and for the applicable legal periods. Technical logs are kept for the time necessary for security and diagnostics.",
        "When you delete your account we erase or anonymise personal data, except for data that we must retain under a legal obligation or in order to handle claims."
      ]
    },
    {
      "id": "s16",
      "title": "Security and data protection",
      "paragraphs": [
        "We apply encryption in transit, access controls and separation of environments. Identity verification images are encrypted on the device before being uploaded.",
        "No system is infallible. If a significant incident occurs, we act to contain it and report it where the law requires."
      ]
    },
    {
      "id": "s17",
      "title": "User rights",
      "paragraphs": [
        "You may access your data, rectify it, erase it, restrict or object to its processing, request its portability and withdraw your consent where that is the legal basis.",
        "You may also lodge a complaint with the competent data protection authority. To exercise your rights, write to us at soporte@egchat.gq."
      ]
    },
    {
      "id": "s18",
      "title": "Access to, rectification and deletion of data",
      "paragraphs": [
        "You can view and edit your profile data from Settings. Account deletion is requested in that same section and removes your profile and the associated content.",
        "Some financial and security records are retained for the legal period, even where the account has been closed."
      ]
    },
    {
      "id": "s19",
      "title": "Export and portability of information",
      "paragraphs": [
        "You may request a copy of the data you gave us and of your activity in a machine-readable format.",
        "We deal with the request within a reasonable period and, where the law sets a specific one, within that period."
      ]
    },
    {
      "id": "s20",
      "title": "Protection of minors",
      "paragraphs": [
        "EGCHAT is a service for people over 18 years of age. We do not knowingly collect data from minors.",
        "If we detect an account belonging to a minor, we suspend it and delete the associated data in accordance with this Policy."
      ]
    },
    {
      "id": "s21",
      "title": "Notification of security incidents",
      "paragraphs": [
        "If a breach affects your data, we investigate it, contain it and notify the authorities and the affected users where the law requires.",
        "We also publish recommendations for protecting your account where the incident justifies it."
      ]
    },
    {
      "id": "s22",
      "title": "Amendments to this policy",
      "paragraphs": [
        "We may update this Policy because of legal or technical changes. We publish the new version with its date and give notice in the app where the change is significant.",
        "If the change is substantial, we ask for a new acceptance before you continue using the service."
      ]
    },
    {
      "id": "s23",
      "title": "Contact for the privacy controller",
      "paragraphs": [
        "For privacy queries, rights or complaints, write to soporte@egchat.gq, stating the reason in the subject line.",
        "We respond within a reasonable period and, where the law sets a specific one, within that period."
      ]
    },
    {
      "id": "s24",
      "title": "Legal framework by jurisdiction",
      "paragraphs": [
        "Where you are in the European Union we apply the General Data Protection Regulation. In the African countries in which we operate we apply national data protection law and the CEMAC framework to the extent applicable. For users in the United States we apply the relevant state privacy laws and, for users in China, the Personal Information Protection Law (PIPL).",
        "These rules may impose additional requirements as to information, consent or the exercise of rights. EGCHAT reviews each market before operating and publishes specific notices where appropriate. This Policy does not make EGCHAT an authorised financial institution."
      ]
    }
  ],
  "closing": [
    "Version 1.1.0 · In force from 12 November 2026.",
    "This Policy is written so that you can understand it without technical knowledge. If anything is unclear, write to us."
  ]
};

const zh: LegalDocContent = {
  "title": "隐私政策",
  "subtitle": "我们如何处理和保护你的个人数据",
  "preamble": [
    "本政策说明 EGCHAT 处理哪些数据、出于何种目的、与谁共享，以及你如何行使自己的权利。本政策适用于本应用及其即时通讯、通话、社区和钱包功能。",
    "处理者是 EGCHAT 的运营方，联系地址位于赤道几内亚共和国马拉博。"
  ],
  "sections": [
    {
      "id": "s1",
      "title": "处理者",
      "paragraphs": [
        "EGCHAT 是提供本服务的品牌。你个人数据的处理者是 EGCHAT 的运营方，联系地址位于赤道几内亚共和国马拉博。",
        "如对隐私有任何疑问，你可致函 soporte@egchat.gq，并在主题中注明事由。"
      ]
    },
    {
      "id": "s2",
      "title": "注册与个人资料信息",
      "paragraphs": [
        "我们处理经核验的手机号码、姓名、照片、个人资料简介以及所选语言。这些数据用于创建账户、在其他用户面前标识你，以及以你的语言显示应用。",
        "部分字段为使用本服务所必需，其他字段为可选。你可在“设置”中更改或删除可选字段。"
      ]
    },
    {
      "id": "s3",
      "title": "设备数据、IP 地址与技术日志",
      "paragraphs": [
        "我们接收设备型号与系统、应用版本、安装标识符、推送通知令牌、服务器日志中的 IP 地址、请求的日期与时间以及技术错误信息。",
        "我们将这些数据用于安全、防止滥用、诊断以及基础设施计费。法律文件接受记录不存储 IP 地址。"
      ]
    },
    {
      "id": "s4",
      "title": "联系人（于你授权访问时）",
      "paragraphs": [
        "如你授予许可，我们将访问你通讯录中的号码，以向你显示哪些联系人已在使用 EGCHAT。我们不会将该信息用于广告，也不会出售该信息。",
        "你可在系统设置中撤销该许可；我们将停止同步通讯录，但不影响已添加的联系人。"
      ]
    },
    {
      "id": "s5",
      "title": "消息、文件与共享内容",
      "paragraphs": [
        "我们处理私聊与群聊的内容、附件、语音消息、图片、状态、动态，以及在频道和社区中的发布内容，连同其发送与已读元数据。",
        "消息在传输过程中加密，并存储于我们的服务器，以便投递和同步。本通讯服务一般不采用端到端加密。聊天记录备份可使用仅你本人知晓的密钥加密。"
      ]
    },
    {
      "id": "s6",
      "title": "语音与视频通话数据",
      "paragraphs": [
        "对于通话，我们处理参与者的标识符、时间、时长及连接技术数据。音频和视频在设备之间加密传输，且默认不予录制。",
        "如你录制或转播通话，你有责任告知参与者并取得其同意。"
      ]
    },
    {
      "id": "s7",
      "title": "位置数据（于存在授权时）",
      "paragraphs": [
        "部分功能，例如在聊天中共享位置或查找附近的服务，需要访问你的位置。我们仅在功能处于活动状态且经你许可时使用该位置。",
        "你可在系统设置中关闭定位。你将停止共享位置，但已发送内容的历史记录仍保留在对话中。"
      ]
    },
    {
      "id": "s8",
      "title": "钱包信息与交易",
      "paragraphs": [
        "我们处理余额、交易明细、操作流水号、法规要求的身份数据以及防范欺诈所需的信息。",
        "我们不以可读文本形式存储支付 PIN，也不会显示该 PIN。财务数据在适用的法定期限内保留，包括在账户关闭之后。"
      ]
    },
    {
      "id": "s9",
      "title": "创作者付款信息",
      "paragraphs": [
        "为向创作者付款，我们处理其经核验的身份、收款信息以及必要的税务信息。这些数据会与执行该笔交易的支付机构共享。",
        "创作者须保持其数据更新，并履行自身的纳税义务。"
      ]
    },
    {
      "id": "s10",
      "title": "人工智能功能处理的数据",
      "paragraphs": [
        "当你使用 LIA 或类似功能时，我们处理你发送的文本、图片和上下文以生成回答。这些数据可能通过第三方模型提供商进行处理。",
        "请勿发送你不希望被处理的敏感信息。我们不会将你与助手的对话用于广告。"
      ]
    },
    {
      "id": "s11",
      "title": "Cookie 及类似技术",
      "paragraphs": [
        "本移动应用不使用浏览器 Cookie。它使用设备本地存储和技术标识符来维持会话、记住偏好并保护本服务。",
        "你可通过系统设置或退出登录（视功能而定）清除本地存储。"
      ]
    },
    {
      "id": "s12",
      "title": "处理目的与法律依据",
      "paragraphs": [
        "我们处理数据是为了履行服务合同、遵守法律义务、保护安全与防范欺诈，以及实现改进应用等正当利益。",
        "在法律要求时，我们会征求同意，例如访问联系人或位置。你可随时撤回同意。"
      ]
    },
    {
      "id": "s13",
      "title": "供应商与处理受托方",
      "paragraphs": [
        "我们依赖代表我们处理数据的供应商：Supabase（数据库与文件）、Render（API）、Expo/EAS（更新与构建）、Firebase（实时）、Twilio（短信）、Vercel（网站）、Groq（AI 模型）以及 Apple 和 Google（通知与分发）。",
        "这些供应商依合同行事，仅可将数据用于提供约定的服务。"
      ]
    },
    {
      "id": "s14",
      "title": "数据的国际传输",
      "paragraphs": [
        "部分供应商位于赤道几内亚境外，主要在美国和欧盟。在适用的情况下，我们为传输采取合同保障与安全措施。",
        "你可通过第 23 条所列渠道索取有关适用保障的信息。"
      ]
    },
    {
      "id": "s15",
      "title": "保留期限",
      "paragraphs": [
        "我们在账户处于活动状态期间以及适用的法定期限内保留数据。技术日志在安全与诊断所需的期间内保存。",
        "删除账户时，我们会删除或匿名化个人数据，但依法必须保留或为处理索赔所需的数据除外。"
      ]
    },
    {
      "id": "s16",
      "title": "安全与数据保护",
      "paragraphs": [
        "我们采用传输加密、访问控制及环境隔离。身份验证图片在上传前于设备上加密。",
        "任何系统都并非万无一失。如发生重大事件，我们将采取措施加以控制，并在法律要求时予以通报。"
      ]
    },
    {
      "id": "s17",
      "title": "用户的权利",
      "paragraphs": [
        "你可访问、更正、删除自己的数据，限制或反对对其的处理，请求数据可携带，并在同意作为法律依据时撤回同意。",
        "你也可向主管数据保护机构提出投诉。行使你的权利，请致函 soporte@egchat.gq。"
      ]
    },
    {
      "id": "s18",
      "title": "数据的访问、更正与删除",
      "paragraphs": [
        "你可在“设置”中查看和编辑个人资料数据。账户删除可在同一部分提出申请，将删除个人资料及相关内容。",
        "部分财务与安全记录在法定期限内保留，即使账户已关闭。"
      ]
    },
    {
      "id": "s19",
      "title": "信息的导出与可携带",
      "paragraphs": [
        "你可请求获取一份你提供给我们的数据以及你的活动记录，以机器可读的格式提供。",
        "我们在合理期限内处理该请求；如法律规定了具体期限，则在该期限内处理。"
      ]
    },
    {
      "id": "s20",
      "title": "未成年人保护",
      "paragraphs": [
        "EGCHAT 是面向 18 岁以上人士的服务。我们不会在知情的情况下收集未成年人的数据。",
        "如我们发现未成年人的账户，将予以停用，并依本政策删除相关数据。"
      ]
    },
    {
      "id": "s21",
      "title": "安全事件的通报",
      "paragraphs": [
        "如发生影响你数据的安全漏洞，我们将进行调查、加以控制，并在法律要求时通知主管机关及受影响用户。",
        "在事件确有需要时，我们也会发布保护你账户的建议。"
      ]
    },
    {
      "id": "s22",
      "title": "本政策的修改",
      "paragraphs": [
        "我们可因法律或技术变化更新本政策。我们将发布带有日期的新版本，并在变更较为重要时于应用内通知。",
        "如变更属重大，我们会在继续使用本服务前要求重新接受。"
      ]
    },
    {
      "id": "s23",
      "title": "隐私负责人的联系方式",
      "paragraphs": [
        "就隐私方面的咨询、权利或投诉，请致函 soporte@egchat.gq，并在主题中注明事由。",
        "我们在合理期限内答复；如法律规定了具体期限，则在该期限内答复。"
      ]
    },
    {
      "id": "s24",
      "title": "按司法管辖区划分的法律框架",
      "paragraphs": [
        "当你位于欧盟时，我们适用《通用数据保护条例》。在我们运营的非洲国家，我们适用各国的数据保护法律以及 CEMAC 框架中适用的部分。对于美国的用户，我们适用相应的州隐私法；对于中国的用户，我们适用《个人信息保护法》（PIPL）。",
        "上述规范可能要求额外的信息告知、同意或权利行使要求。EGCHAT 在进入每个市场前都会进行审查，并在适当的情况下发布专门提示。本政策并不使 EGCHAT 成为经授权的金融机构。"
      ]
    }
  ],
  "closing": [
    "版本 1.1.0 · 自 2026 年 11 月 12 日起生效。",
    "本政策力求让你无需技术背景也能理解。如有任何不清楚之处，请致函我们。"
  ]
};

export const PRIVACY: Record<LegalLang, LegalDocContent> = { es, fr, en, zh };
