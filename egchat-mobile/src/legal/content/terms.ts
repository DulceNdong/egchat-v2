import type { LegalDocContent, LegalLang } from "../types";

// Términos de servicio — 24 apartados, misma estructura en los cuatro idiomas. Texto revisado el 12-11 (versión 1.1.0): más breve, explicativo y con el mismo alcance.

const es: LegalDocContent = {
  "title": "Términos de servicio",
  "subtitle": "Condiciones generales de uso de EGCHAT",
  "preamble": [
    "Estos Términos regulan el uso de EGCHAT, la aplicación de mensajería, llamadas, comunidades y monedero electrónico operada bajo esa marca desde Malabo, República de Guinea Ecuatorial.",
    "Al crear una cuenta, iniciar sesión o usar cualquier función aceptas estos Términos y la Política de privacidad. Si no estás de acuerdo, no uses el servicio."
  ],
  "sections": [
    {
      "id": "s1",
      "title": "Identificación del operador",
      "paragraphs": [
        "EGCHAT es la marca comercial con la que se presta este servicio. El operador atiende a los usuarios por los canales oficiales del apartado 24 y tiene su domicilio de contacto en Malabo, República de Guinea Ecuatorial.",
        "EGCHAT no es un banco ni una entidad de dinero electrónico autorizada. Los servicios financieros que requieran licencia se prestan, cuando existan, a través de entidades asociadas autorizadas, que se identifican en la app antes de contratarlos."
      ]
    },
    {
      "id": "s2",
      "title": "Aceptación de los términos",
      "paragraphs": [
        "La aceptación es expresa. Al registrarte, o al continuar usando la app después de una actualización sustancial, aceptas la versión vigente.",
        "Registramos el documento, la versión, el idioma y la fecha y hora de la aceptación, sin almacenar tu dirección IP. Puedes consultar el estado en cualquier momento desde Ajustes."
      ]
    },
    {
      "id": "s3",
      "title": "Edad y capacidad legal",
      "paragraphs": [
        "Debes tener al menos 18 años y capacidad legal para contratar. Si actúas en nombre de una empresa, declaras tener poder suficiente para obligarla.",
        "Si detectamos una cuenta gestionada por un menor, la suspendemos y eliminamos los datos personales asociados conforme a la Política de privacidad."
      ]
    },
    {
      "id": "s4",
      "title": "Creación y seguridad de la cuenta",
      "paragraphs": [
        "Se accede con un número de teléfono verificado y una contraseña. Debes mantener la confidencialidad de la contraseña, del PIN de pagos y de los códigos de verificación, y avisarnos sin demora de cualquier uso no autorizado.",
        "La cuenta es personal: puedes añadir varias en el mismo dispositivo, pero no compartir credenciales ni ceder el acceso a terceros."
      ]
    },
    {
      "id": "s5",
      "title": "Responsabilidades del usuario",
      "paragraphs": [
        "Debes dar información veraz y mantenerla actualizada, cumplir la ley, respetar los derechos de terceros y no suplantar identidades.",
        "No está permitido automatizar el acceso sin autorización escrita. Respondes de la actividad de tu cuenta, salvo el uso no autorizado que hayas notificado a tiempo."
      ]
    },
    {
      "id": "s6",
      "title": "Mensajería privada y grupal",
      "paragraphs": [
        "Los mensajes viajan cifrados en tránsito y se almacenan en nuestros servidores para entregarlos y sincronizarlos entre tus dispositivos. La mensajería no usa cifrado de extremo a extremo de forma general; el respaldo del historial puede cifrarse con una clave que solo tú conoces.",
        "Eres responsable de lo que envías y de moderar los grupos que administras. Los administradores pueden eliminar contenido y expulsar participantes conforme a las reglas del grupo y a estos Términos."
      ]
    },
    {
      "id": "s7",
      "title": "Llamadas de audio y vídeo",
      "paragraphs": [
        "Las llamadas usan WebRTC y el audio y el vídeo viajan cifrados entre los dispositivos participantes. Conservamos metadatos como participantes, hora y duración para el historial y la seguridad.",
        "Solo puedes grabar o difundir una llamada si todos los participantes lo autorizan y la ley lo permite."
      ]
    },
    {
      "id": "s8",
      "title": "Publicaciones, contenidos y comunidades",
      "paragraphs": [
        "En estados, momentos, canales y comunidades puedes publicar texto, imágenes, audio y vídeo. Conservas la titularidad de tu contenido y nos das una licencia limitada, no exclusiva y gratuita para alojarlo, reproducirlo y mostrarlo dentro del servicio.",
        "Puedes limitar la visibilidad y borrar tu contenido cuando quieras. Eso no afecta a las copias que otros hayan guardado ni a los registros que la ley nos obligue a conservar."
      ]
    },
    {
      "id": "s9",
      "title": "Transmisiones y funciones para creadores",
      "paragraphs": [
        "Las transmisiones y herramientas para creadores se ofrecen con las reglas que aparecen en la app. Eres responsable del contenido que emites y de contar con los derechos necesarios sobre la música, las imágenes y el resto del material.",
        "Los ingresos por propinas, suscripciones o pagos a creadores dependen de la demanda y no están garantizados. Sujetos a verificación de identidad, comisiones, impuestos y a la disponibilidad de los medios de pago."
      ]
    },
    {
      "id": "s10",
      "title": "Monedero electrónico y pagos",
      "paragraphs": [
        "El monedero permite consultar el saldo, recibir, pagar, recargar y retirar en francos CFA según los métodos disponibles en tu país. El saldo no es un depósito bancario, no genera intereses y no está cubierto por fondos de garantía bancaria.",
        "Se aplican límites, comisiones y verificaciones de identidad, que se muestran en la app. Si detectas una operación errónea o no autorizada, puedes pedir su revisión; investigamos y, cuando procede, revertimos el asiento con su referencia."
      ]
    },
    {
      "id": "s11",
      "title": "Pagos a influencers y creadores",
      "paragraphs": [
        "Los pagos a creadores requieren identidad verificada y datos de cobro válidos. El importe, las comisiones y el calendario se muestran antes de confirmar cada operación.",
        "Cada creador responde de sus obligaciones fiscales y de la legalidad de lo que promociona. Podemos retener o rechazar pagos relacionados con fraude, contenido prohibido o reclamaciones de terceros."
      ]
    },
    {
      "id": "s12",
      "title": "Servicios comerciales y futuras funciones de marketplace",
      "paragraphs": [
        "EGCHAT puede ofrecer servicios comerciales, reservas y funciones de marketplace. Cuando lo haga, indicará quién vende, quién cobra y qué condiciones se aplican antes de contratar.",
        "Salvo que se diga expresamente, EGCHAT no es vendedor ni garante del producto o servicio ofrecido por terceros. Las disputas comerciales se resuelven con el vendedor y con las autoridades de consumo competentes."
      ]
    },
    {
      "id": "s13",
      "title": "Funciones de inteligencia artificial",
      "paragraphs": [
        "LIA y otras funciones de IA utilizan modelos de terceros. Sus respuestas pueden ser inexactas o incompletas y no constituyen consejo médico, jurídico ni financiero.",
        "No envíes al asistente datos sensibles que no quieras que se procesen. Las decisiones que puedan afectar seriamente a tus derechos no se toman solo de forma automatizada."
      ]
    },
    {
      "id": "s14",
      "title": "Propiedad intelectual",
      "paragraphs": [
        "La marca, el diseño, el software y los textos de EGCHAT pertenecen a sus titulares. Recibes una licencia personal, limitada, revocable y no exclusiva para usar la app conforme a estos Términos.",
        "No puedes copiar, modificar, distribuir ni descompilar el servicio sin autorización. Si envías sugerencias, podemos usarlas sin obligación de compensación."
      ]
    },
    {
      "id": "s15",
      "title": "Contenido prohibido y actividades ilícitas",
      "paragraphs": [
        "No se permite publicar ni compartir contenido ilegal, abusivo o que vulnere derechos de terceros."
      ],
      "bullets": [
        "Explotación o abuso sexual infantil, violencia explícita y amenazas.",
        "Acoso, incitación al odio y discriminación.",
        "Fraude, estafas, suplantación y engaño.",
        "Malware, spam y acceso no autorizado a sistemas.",
        "Violación de la intimidad, de la propiedad intelectual o de datos personales.",
        "Ejercicio de servicios financieros regulados sin autorización."
      ]
    },
    {
      "id": "s16",
      "title": "Moderación y denuncias",
      "paragraphs": [
        "Puedes denunciar contenido o cuentas desde la propia app. Revisamos los avisos y podemos retirar contenido, limitar funciones o suspender cuentas cuando exista un riesgo o un incumplimiento.",
        "Cuando la ley lo exija, colaboramos con las autoridades competentes. Si consideras que una decisión es injusta, puedes pedir una revisión por los canales del apartado 24."
      ]
    },
    {
      "id": "s17",
      "title": "Suspensión y cancelación de cuentas",
      "paragraphs": [
        "Podemos suspender o cancelar una cuenta por incumplimiento grave, fraude, riesgo para otros usuarios o exigencia legal. Cuando sea posible, avisamos antes y explicamos el motivo.",
        "Tú puedes eliminar tu cuenta desde Ajustes en cualquier momento. La cancelación no extingue las obligaciones pendientes ni los registros que debamos conservar por ley."
      ]
    },
    {
      "id": "s18",
      "title": "Limitación de responsabilidad",
      "paragraphs": [
        "El servicio se presta «tal cual» y «según disponibilidad». No garantizamos que esté libre de errores ni que funcione sin interrupciones.",
        "En la medida en que la ley lo permita, no respondemos de daños indirectos o lucro cesante. Nada en estos Términos limita los derechos que la ley reconoce imperativamente al consumidor."
      ]
    },
    {
      "id": "s19",
      "title": "Servicios de terceros",
      "paragraphs": [
        "La app se apoya en servicios de terceros, como tiendas de aplicaciones, operadores de telefonía, entidades de pago, proveedores de infraestructura y enlaces externos. Esos servicios tienen sus propias condiciones y políticas.",
        "No controlamos su disponibilidad ni su contenido. Si un tercero falla, hacemos lo razonable para restablecer el servicio, sin garantizar un plazo concreto."
      ]
    },
    {
      "id": "s20",
      "title": "Disponibilidad del servicio",
      "paragraphs": [
        "Podemos actualizar, mantener o cambiar funciones para mejorar la seguridad y el funcionamiento. Cuando una interrupción programada sea relevante, la anunciamos en la app o por los canales oficiales.",
        "No garantizamos la conservación indefinida de contenidos. Te recomendamos guardar copias de lo que necesites conservar."
      ]
    },
    {
      "id": "s21",
      "title": "Resolución de controversias",
      "paragraphs": [
        "Si tienes una reclamación, escríbenos primero a los canales del apartado 24: intentaremos resolverla de buena fe y en un plazo razonable.",
        "Si no hay acuerdo, puedes acudir a los tribunales competentes de Malabo, sin perjuicio de las normas de consumo que te protejan en tu país de residencia."
      ]
    },
    {
      "id": "s22",
      "title": "Legislación aplicable",
      "paragraphs": [
        "Estos Términos se rigen por la legislación de la República de Guinea Ecuatorial y por las normas imperativas que protejan al consumidor en su país de residencia.",
        "Salvo norma imperativa en contrario, en caso de discrepancia entre versiones lingüísticas prevalece la versión en español."
      ]
    },
    {
      "id": "s23",
      "title": "Modificaciones de los términos",
      "paragraphs": [
        "Podemos modificar estos Términos por cambios legales, técnicos o de negocio. Publicamos la nueva versión con su fecha y avisamos en la app cuando el cambio sea relevante.",
        "Si la modificación es sustancial, pedimos una nueva aceptación. Seguir usando el servicio después de la entrada en vigor implica aceptar la versión vigente."
      ]
    },
    {
      "id": "s24",
      "title": "Canales oficiales de contacto",
      "paragraphs": [
        "El canal de soporte es soporte@egchat.gq. Para asuntos legales y de privacidad puedes usar el mismo buzón indicando el motivo.",
        "Respondemos en un plazo razonable y, cuando la ley fija uno concreto, dentro de ese plazo."
      ]
    }
  ],
  "closing": [
    "Versión 1.1.0 · Vigente desde el 12 de noviembre de 2026.",
    "EGCHAT se compromete a redactar estos Términos con claridad y a revisarlos cuando cambien la ley o el servicio."
  ]
};

const fr: LegalDocContent = {
  "title": "Conditions de service",
  "subtitle": "Conditions générales d'utilisation d'EGCHAT",
  "preamble": [
    "Les présentes Conditions régissent l'utilisation d'EGCHAT, l'application de messagerie, d'appels, de communautés et de portefeuille électronique exploitée sous cette marque depuis Malabo, République de Guinée équatoriale.",
    "En créant un compte, en vous connectant ou en utilisant une quelconque fonction, vous acceptez les présentes Conditions et la Politique de confidentialité. Si vous n'êtes pas d'accord, n'utilisez pas le service."
  ],
  "sections": [
    {
      "id": "s1",
      "title": "Identification de l'opérateur",
      "paragraphs": [
        "EGCHAT est la marque commerciale sous laquelle ce service est fourni. L'opérateur répond aux utilisateurs par les canaux officiels de la section 24 et a son domicile de contact à Malabo, République de Guinée équatoriale.",
        "EGCHAT n'est pas une banque ni un établissement de monnaie électronique agréé. Les services financiers nécessitant une licence sont fournis, lorsqu'ils existent, par l'intermédiaire d'entités partenaires agréées, identifiées dans l'application avant leur souscription."
      ]
    },
    {
      "id": "s2",
      "title": "Acceptation des conditions",
      "paragraphs": [
        "L'acceptation est expresse. En vous inscrivant, ou en continuant à utiliser l'application après une mise à jour substantielle, vous acceptez la version en vigueur.",
        "Nous enregistrons le document, la version, la langue ainsi que la date et l'heure de l'acceptation, sans conserver votre adresse IP. Vous pouvez consulter cet état à tout moment depuis les Réglages."
      ]
    },
    {
      "id": "s3",
      "title": "Âge et capacité juridique",
      "paragraphs": [
        "Vous devez avoir au moins 18 ans et la capacité juridique de contracter. Si vous agissez au nom d'une entreprise, vous déclarez disposer du pouvoir suffisant pour l'engager.",
        "Si nous détectons un compte géré par un mineur, nous le suspendons et supprimons les données personnelles associées conformément à la Politique de confidentialité."
      ]
    },
    {
      "id": "s4",
      "title": "Création et sécurité du compte",
      "paragraphs": [
        "L'accès se fait au moyen d'un numéro de téléphone vérifié et d'un mot de passe. Vous devez préserver la confidentialité du mot de passe, du code PIN de paiement et des codes de vérification, et nous signaler sans délai toute utilisation non autorisée.",
        "Le compte est personnel : vous pouvez en ajouter plusieurs sur le même appareil, mais vous ne pouvez ni partager vos identifiants ni céder l'accès à des tiers."
      ]
    },
    {
      "id": "s5",
      "title": "Responsabilités de l'utilisateur",
      "paragraphs": [
        "Vous devez fournir des informations exactes et les tenir à jour, respecter la loi, respecter les droits des tiers et ne pas usurper d'identité.",
        "L'automatisation de l'accès sans autorisation écrite n'est pas autorisée. Vous êtes responsable de l'activité de votre compte, à l'exception de l'utilisation non autorisée que vous avez signalée à temps."
      ]
    },
    {
      "id": "s6",
      "title": "Messagerie privée et de groupe",
      "paragraphs": [
        "Les messages circulent chiffrés en transit et sont stockés sur nos serveurs afin d'être remis et synchronisés entre vos appareils. La messagerie n'utilise pas de chiffrement de bout en bout de manière générale ; la sauvegarde de l'historique peut être chiffrée avec une clé que vous seul connaissez.",
        "Vous êtes responsable de ce que vous envoyez et de la modération des groupes que vous administrez. Les administrateurs peuvent supprimer du contenu et exclure des participants conformément aux règles du groupe et aux présentes Conditions."
      ]
    },
    {
      "id": "s7",
      "title": "Appels audio et vidéo",
      "paragraphs": [
        "Les appels utilisent WebRTC et l'audio et la vidéo circulent chiffrés entre les appareils participants. Nous conservons des métadonnées telles que les participants, l'heure et la durée, pour l'historique et la sécurité.",
        "Vous ne pouvez enregistrer ou diffuser un appel que si tous les participants l'autorisent et si la loi le permet."
      ]
    },
    {
      "id": "s8",
      "title": "Publications, contenus et communautés",
      "paragraphs": [
        "Dans les statuts, les moments, les canaux et les communautés, vous pouvez publier du texte, des images, de l'audio et de la vidéo. Vous conservez la titularité de votre contenu et nous accordez une licence limitée, non exclusive et gratuite pour l'héberger, le reproduire et l'afficher au sein du service.",
        "Vous pouvez limiter la visibilité et supprimer votre contenu à tout moment. Cela n'affecte ni les copies que d'autres ont pu conserver, ni les registres que la loi nous oblige à conserver."
      ]
    },
    {
      "id": "s9",
      "title": "Diffusions et fonctions pour créateurs",
      "paragraphs": [
        "Les diffusions et les outils destinés aux créateurs sont proposés selon les règles figurant dans l'application. Vous êtes responsable du contenu que vous diffusez et de disposer des droits nécessaires sur la musique, les images et le reste du matériel.",
        "Les revenus issus de pourboires, d'abonnements ou de paiements aux créateurs dépendent de la demande et ne sont pas garantis. Ils sont soumis à la vérification d'identité, aux commissions, aux taxes et à la disponibilité des moyens de paiement."
      ]
    },
    {
      "id": "s10",
      "title": "Portefeuille électronique et paiements",
      "paragraphs": [
        "Le portefeuille permet de consulter le solde, de recevoir, de payer, de recharger et de retirer en francs CFA, selon les méthodes disponibles dans votre pays. Le solde n'est pas un dépôt bancaire, ne produit pas d'intérêts et n'est pas couvert par des fonds de garantie bancaire.",
        "Des limites, des commissions et des vérifications d'identité s'appliquent ; elles sont indiquées dans l'application. Si vous constatez une opération erronée ou non autorisée, vous pouvez en demander l'examen ; nous enquêtons et, le cas échéant, annulons l'écriture avec sa référence."
      ]
    },
    {
      "id": "s11",
      "title": "Paiements aux influenceurs et aux créateurs",
      "paragraphs": [
        "Les paiements aux créateurs exigent une identité vérifiée et des coordonnées de paiement valides. Le montant, les commissions et le calendrier sont affichés avant la confirmation de chaque opération.",
        "Chaque créateur répond de ses obligations fiscales et de la légalité de ce qu'il promeut. Nous pouvons retenir ou refuser des paiements liés à une fraude, à un contenu interdit ou à des réclamations de tiers."
      ]
    },
    {
      "id": "s12",
      "title": "Services commerciaux et futures fonctions de marketplace",
      "paragraphs": [
        "EGCHAT peut proposer des services commerciaux, des réservations et des fonctions de marketplace. Le cas échéant, elle indiquera qui vend, qui encaisse et quelles conditions s'appliquent avant la souscription.",
        "Sauf mention expresse, EGCHAT n'est ni vendeur ni garant du produit ou du service proposé par des tiers. Les litiges commerciaux se règlent avec le vendeur et avec les autorités de consommation compétentes."
      ]
    },
    {
      "id": "s13",
      "title": "Fonctions d'intelligence artificielle",
      "paragraphs": [
        "LIA et d'autres fonctions d'intelligence artificielle utilisent des modèles de tiers. Leurs réponses peuvent être inexactes ou incomplètes et ne constituent pas un conseil médical, juridique ou financier.",
        "N'envoyez pas à l'assistant des données sensibles que vous ne souhaitez pas voir traitées. Les décisions susceptibles d'affecter sérieusement vos droits ne sont pas prises uniquement de manière automatisée."
      ]
    },
    {
      "id": "s14",
      "title": "Propriété intellectuelle",
      "paragraphs": [
        "La marque, le design, le logiciel et les textes d'EGCHAT appartiennent à leurs titulaires. Vous recevez une licence personnelle, limitée, révocable et non exclusive pour utiliser l'application conformément aux présentes Conditions.",
        "Vous ne pouvez pas copier, modifier, distribuer ni décompiler le service sans autorisation. Si vous nous envoyez des suggestions, nous pouvons les utiliser sans obligation de compensation."
      ]
    },
    {
      "id": "s15",
      "title": "Contenu interdit et activités illicites",
      "paragraphs": [
        "La publication ou le partage de contenu illégal, abusif ou portant atteinte aux droits de tiers n'est pas autorisé."
      ],
      "bullets": [
        "Exploitation ou abus sexuel d'enfants, violence explicite et menaces.",
        "Harcèlement, incitation à la haine et discrimination.",
        "Fraude, escroqueries, usurpation d'identité et tromperie.",
        "Logiciels malveillants, spam et accès non autorisé à des systèmes.",
        "Atteinte à la vie privée, à la propriété intellectuelle ou aux données personnelles.",
        "Exercice de services financiers réglementés sans autorisation."
      ]
    },
    {
      "id": "s16",
      "title": "Modération et signalements",
      "paragraphs": [
        "Vous pouvez signaler du contenu ou des comptes directement depuis l'application. Nous examinons les signalements et pouvons retirer du contenu, limiter des fonctions ou suspendre des comptes en cas de risque ou de manquement.",
        "Lorsque la loi l'exige, nous coopérons avec les autorités compétentes. Si vous estimez qu'une décision est injuste, vous pouvez en demander le réexamen par les canaux de la section 24."
      ]
    },
    {
      "id": "s17",
      "title": "Suspension et fermeture de comptes",
      "paragraphs": [
        "Nous pouvons suspendre ou fermer un compte en cas de manquement grave, de fraude, de risque pour d'autres utilisateurs ou d'exigence légale. Lorsque cela est possible, nous prévenons au préalable et expliquons le motif.",
        "Vous pouvez supprimer votre compte depuis les Réglages à tout moment. La fermeture n'éteint ni les obligations en cours ni les registres que nous devons conserver en vertu de la loi."
      ]
    },
    {
      "id": "s18",
      "title": "Limitation de responsabilité",
      "paragraphs": [
        "Le service est fourni « en l'état » et « selon disponibilité ». Nous ne garantissons pas qu'il soit exempt d'erreurs ni qu'il fonctionne sans interruption.",
        "Dans la mesure permise par la loi, nous ne répondons pas des dommages indirects ni de la perte de bénéfices. Rien dans les présentes Conditions ne limite les droits que la loi reconnaît impérativement au consommateur."
      ]
    },
    {
      "id": "s19",
      "title": "Services de tiers",
      "paragraphs": [
        "L'application s'appuie sur des services de tiers, tels que des magasins d'applications, des opérateurs de téléphonie, des établissements de paiement, des fournisseurs d'infrastructure et des liens externes. Ces services ont leurs propres conditions et politiques.",
        "Nous ne contrôlons ni leur disponibilité ni leur contenu. Si un tiers défaille, nous faisons le raisonnable pour rétablir le service, sans garantir de délai précis."
      ]
    },
    {
      "id": "s20",
      "title": "Disponibilité du service",
      "paragraphs": [
        "Nous pouvons mettre à jour, maintenir ou modifier des fonctions afin d'améliorer la sécurité et le fonctionnement. Lorsqu'une interruption programmée est significative, nous l'annonçons dans l'application ou par les canaux officiels.",
        "Nous ne garantissons pas la conservation indéfinie des contenus. Nous vous recommandons de conserver des copies de ce que vous devez garder."
      ]
    },
    {
      "id": "s21",
      "title": "Résolution des litiges",
      "paragraphs": [
        "Si vous avez une réclamation, écrivez-nous d'abord via les canaux de la section 24 : nous nous efforcerons de la résoudre de bonne foi et dans un délai raisonnable.",
        "À défaut d'accord, vous pouvez saisir les tribunaux compétents de Malabo, sans préjudice des règles de consommation qui vous protègent dans votre pays de résidence."
      ]
    },
    {
      "id": "s22",
      "title": "Droit applicable",
      "paragraphs": [
        "Les présentes Conditions sont régies par la législation de la République de Guinée équatoriale et par les règles impératives qui protègent le consommateur dans son pays de résidence.",
        "Sauf disposition impérative contraire, en cas de divergence entre versions linguistiques, la version espagnole prévaut."
      ]
    },
    {
      "id": "s23",
      "title": "Modifications des conditions",
      "paragraphs": [
        "Nous pouvons modifier les présentes Conditions en raison de changements légaux, techniques ou commerciaux. Nous publions la nouvelle version avec sa date et prévenons dans l'application lorsque le changement est significatif.",
        "Si la modification est substantielle, nous demandons une nouvelle acceptation. Continuer à utiliser le service après l'entrée en vigueur implique l'acceptation de la version en vigueur."
      ]
    },
    {
      "id": "s24",
      "title": "Canaux officiels de contact",
      "paragraphs": [
        "Le canal d'assistance est soporte@egchat.gq. Pour les questions juridiques et de confidentialité, vous pouvez utiliser la même boîte en indiquant le motif.",
        "Nous répondons dans un délai raisonnable et, lorsque la loi en fixe un précis, dans ce délai."
      ]
    }
  ],
  "closing": [
    "Version 1.1.0 · En vigueur depuis le 12 novembre 2026.",
    "EGCHAT s'engage à rédiger les présentes Conditions avec clarté et à les réviser lorsque la loi ou le service évoluent."
  ]
};

const en: LegalDocContent = {
  "title": "Terms of Service",
  "subtitle": "General conditions of use of EGCHAT",
  "preamble": [
    "These Terms govern the use of EGCHAT, the messaging, calling, communities and electronic wallet application operated under that brand from Malabo, Equatorial Guinea.",
    "By creating an account, signing in or using any feature you accept these Terms and the Privacy Policy. If you do not agree, do not use the service."
  ],
  "sections": [
    {
      "id": "s1",
      "title": "Identification of the operator",
      "paragraphs": [
        "EGCHAT is the trade mark under which this service is provided. The operator serves users through the official channels in section 24 and has its contact address in Malabo, Equatorial Guinea.",
        "EGCHAT is not a bank or an authorised electronic money institution. Financial services requiring a licence are provided, where they exist, through authorised partner entities, which are identified in the app before you contract them."
      ]
    },
    {
      "id": "s2",
      "title": "Acceptance of the terms",
      "paragraphs": [
        "Acceptance is express. By registering, or by continuing to use the app after a substantial update, you accept the version in force.",
        "We record the document, the version, the language and the date and time of acceptance, without storing your IP address. You can check the status at any time from Settings."
      ]
    },
    {
      "id": "s3",
      "title": "Age and legal capacity",
      "paragraphs": [
        "You must be at least 18 years old and have legal capacity to contract. If you act on behalf of a company, you declare that you have sufficient authority to bind it.",
        "If we detect an account managed by a minor, we suspend it and delete the associated personal data in accordance with the Privacy Policy."
      ]
    },
    {
      "id": "s4",
      "title": "Creating and securing your account",
      "paragraphs": [
        "Access is by means of a verified phone number and a password. You must keep the password, the payments PIN and the verification codes confidential, and notify us without delay of any unauthorised use.",
        "The account is personal: you may add several accounts on the same device, but you may not share credentials or transfer access to third parties."
      ]
    },
    {
      "id": "s5",
      "title": "User responsibilities",
      "paragraphs": [
        "You must provide accurate information and keep it up to date, comply with the law, respect the rights of third parties and not impersonate anyone.",
        "Automating access without written authorisation is not permitted. You are responsible for the activity on your account, except for unauthorised use that you have reported in time."
      ]
    },
    {
      "id": "s6",
      "title": "Private and group messaging",
      "paragraphs": [
        "Messages travel encrypted in transit and are stored on our servers in order to deliver and synchronise them across your devices. Messaging does not use end-to-end encryption as a general rule; chat backup may be encrypted with a key that only you know.",
        "You are responsible for what you send and for moderating the groups you administer. Administrators may remove content and expel participants in accordance with the rules of the group and with these Terms."
      ]
    },
    {
      "id": "s7",
      "title": "Audio and video calls",
      "paragraphs": [
        "Calls use WebRTC and audio and video travel encrypted between the participating devices. We retain metadata such as participants, time and duration for history and security purposes.",
        "You may record or broadcast a call only if all participants authorise it and the law permits it."
      ]
    },
    {
      "id": "s8",
      "title": "Posts, content and communities",
      "paragraphs": [
        "In status updates, moments, channels and communities you may publish text, images, audio and video. You retain ownership of your content and grant us a limited, non-exclusive, free-of-charge licence to host, reproduce and display it within the service.",
        "You may limit visibility and delete your content whenever you wish. This does not affect copies that others have saved or records that the law requires us to keep."
      ]
    },
    {
      "id": "s9",
      "title": "Live broadcasts and creator features",
      "paragraphs": [
        "Live broadcasts and creator tools are offered under the rules shown in the app. You are responsible for the content you transmit and for holding the necessary rights to the music, images and other material.",
        "Revenue from tips, subscriptions or payments to creators depends on demand and is not guaranteed. It is subject to identity verification, commissions, taxes and the availability of payment methods."
      ]
    },
    {
      "id": "s10",
      "title": "Electronic wallet and payments",
      "paragraphs": [
        "The wallet allows you to check your balance, receive, pay, top up and withdraw in CFA francs according to the methods available in your country. The balance is not a bank deposit, does not earn interest and is not covered by bank guarantee funds.",
        "Limits, commissions and identity checks apply, and are shown in the app. If you detect an erroneous or unauthorised transaction, you may request a review; we investigate and, where appropriate, reverse the entry with its reference."
      ]
    },
    {
      "id": "s11",
      "title": "Payments to influencers and creators",
      "paragraphs": [
        "Payments to creators require verified identity and valid payout details. The amount, the commissions and the schedule are shown before confirming each transaction.",
        "Each creator is responsible for their tax obligations and for the legality of what they promote. We may withhold or reject payments related to fraud, prohibited content or third-party claims."
      ]
    },
    {
      "id": "s12",
      "title": "Commercial services and future marketplace features",
      "paragraphs": [
        "EGCHAT may offer commercial services, bookings and marketplace features. When it does so, it will state who sells, who collects payment and which conditions apply before you contract.",
        "Unless expressly stated otherwise, EGCHAT is not the seller or guarantor of the product or service offered by third parties. Commercial disputes are resolved with the seller and with the competent consumer authorities."
      ]
    },
    {
      "id": "s13",
      "title": "Artificial intelligence features",
      "paragraphs": [
        "LIA and other AI features use third-party models. Their responses may be inaccurate or incomplete and do not constitute medical, legal or financial advice.",
        "Do not send the assistant sensitive data that you do not want processed. Decisions that may seriously affect your rights are not taken by automated means alone."
      ]
    },
    {
      "id": "s14",
      "title": "Intellectual property",
      "paragraphs": [
        "The EGCHAT brand, design, software and texts belong to their owners. You receive a personal, limited, revocable and non-exclusive licence to use the app in accordance with these Terms.",
        "You may not copy, modify, distribute or decompile the service without authorisation. If you send suggestions, we may use them without any obligation to compensate you."
      ]
    },
    {
      "id": "s15",
      "title": "Prohibited content and unlawful activities",
      "paragraphs": [
        "Publishing or sharing illegal or abusive content, or content that infringes the rights of third parties, is not permitted."
      ],
      "bullets": [
        "Child sexual exploitation or abuse, explicit violence and threats.",
        "Harassment, incitement to hatred and discrimination.",
        "Fraud, scams, impersonation and deception.",
        "Malware, spam and unauthorised access to systems.",
        "Violation of privacy, of intellectual property or of personal data.",
        "Provision of regulated financial services without authorisation."
      ]
    },
    {
      "id": "s16",
      "title": "Moderation and reports",
      "paragraphs": [
        "You can report content or accounts from within the app. We review reports and may remove content, restrict features or suspend accounts where there is a risk or a breach.",
        "Where the law requires it, we cooperate with the competent authorities. If you consider a decision to be unfair, you may request a review through the channels in section 24."
      ]
    },
    {
      "id": "s17",
      "title": "Suspension and cancellation of accounts",
      "paragraphs": [
        "We may suspend or cancel an account for serious breach, fraud, risk to other users or legal requirement. Where possible, we give notice beforehand and explain the reason.",
        "You may delete your account from Settings at any time. Cancellation does not extinguish outstanding obligations or the records that we must keep by law."
      ]
    },
    {
      "id": "s18",
      "title": "Limitation of liability",
      "paragraphs": [
        "The service is provided 'as is' and 'as available'. We do not warrant that it is free from errors or that it operates without interruption.",
        "To the extent permitted by law, we are not liable for indirect loss or loss of profit. Nothing in these Terms limits the rights that the law mandatorily grants to consumers."
      ]
    },
    {
      "id": "s19",
      "title": "Third-party services",
      "paragraphs": [
        "The app relies on third-party services, such as app stores, telephone operators, payment entities, infrastructure providers and external links. Those services have their own terms and policies.",
        "We do not control their availability or their content. If a third party fails, we do what is reasonable to restore the service, without guaranteeing a specific time frame."
      ]
    },
    {
      "id": "s20",
      "title": "Service availability",
      "paragraphs": [
        "We may update, maintain or change features in order to improve security and operation. Where a scheduled interruption is significant, we announce it in the app or through the official channels.",
        "We do not guarantee the indefinite retention of content. We recommend that you keep copies of anything you need to preserve."
      ]
    },
    {
      "id": "s21",
      "title": "Dispute resolution",
      "paragraphs": [
        "If you have a complaint, write to us first through the channels in section 24: we will try to resolve it in good faith and within a reasonable period.",
        "If no agreement is reached, you may bring the matter before the competent courts of Malabo, without prejudice to the consumer rules that protect you in your country of residence."
      ]
    },
    {
      "id": "s22",
      "title": "Governing law",
      "paragraphs": [
        "These Terms are governed by the law of the Republic of Equatorial Guinea and by the mandatory rules that protect consumers in their country of residence.",
        "Save for a mandatory provision to the contrary, in the event of a discrepancy between language versions the Spanish version prevails."
      ]
    },
    {
      "id": "s23",
      "title": "Amendments to the terms",
      "paragraphs": [
        "We may amend these Terms because of legal, technical or business changes. We publish the new version with its date and give notice in the app where the change is significant.",
        "If the amendment is substantial, we ask for a new acceptance. Continuing to use the service after it takes effect implies acceptance of the version in force."
      ]
    },
    {
      "id": "s24",
      "title": "Official contact channels",
      "paragraphs": [
        "The support channel is soporte@egchat.gq. For legal and privacy matters you may use the same mailbox, stating the reason.",
        "We respond within a reasonable period and, where the law sets a specific one, within that period."
      ]
    }
  ],
  "closing": [
    "Version 1.1.0 · In force from 12 November 2026.",
    "EGCHAT undertakes to draft these Terms clearly and to review them when the law or the service changes."
  ]
};

const zh: LegalDocContent = {
  "title": "服务条款",
  "subtitle": "EGCHAT 使用的一般条件",
  "preamble": [
    "本条款规范 EGCHAT 的使用。EGCHAT 是以该品牌在赤道几内亚共和国马拉博运营的即时通讯、通话、社区及电子钱包应用。",
    "创建账户、登录或使用任何功能，即表示你接受本条款及《隐私政策》。如不同意，请勿使用本服务。"
  ],
  "sections": [
    {
      "id": "s1",
      "title": "运营方的标识",
      "paragraphs": [
        "EGCHAT 是提供本服务的商业品牌。运营方通过第 24 条所列的官方渠道为用户提供服务，联系地址位于赤道几内亚共和国马拉博。",
        "EGCHAT 不是银行，也不是经授权的电子货币机构。需要牌照的金融服务（如存在）通过经授权的合作机构提供，并在订购前于应用内标明该机构。"
      ]
    },
    {
      "id": "s2",
      "title": "条款的接受",
      "paragraphs": [
        "接受须明示作出。注册时，或在重大更新后继续使用本应用，即表示你接受现行版本。",
        "我们记录所接受的文档、版本、语言以及接受的日期和时间，但不存储你的 IP 地址。你可随时在“设置”中查看该状态。"
      ]
    },
    {
      "id": "s3",
      "title": "年龄与法律行为能力",
      "paragraphs": [
        "你须年满 18 周岁，并具有订立合同的法律行为能力。如你代表企业行事，则声明拥有足以约束该企业的授权。",
        "如我们发现由未成年人管理的账户，将予以停用，并依《隐私政策》删除相关个人数据。"
      ]
    },
    {
      "id": "s4",
      "title": "账户的创建与安全",
      "paragraphs": [
        "以经核验的手机号码和密码登录。你须对密码、支付 PIN 及验证码保密，并在发生任何未经授权的使用时立即通知我们。",
        "账户为个人专属：你可在同一设备上添加多个账户，但不得共享凭据，也不得将访问权转让给第三方。"
      ]
    },
    {
      "id": "s5",
      "title": "用户的责任",
      "paragraphs": [
        "你须提供真实信息并保持其更新，遵守法律，尊重第三方权利，且不得冒用他人身份。",
        "未经书面授权，不得将访问行为自动化。你对账户活动负责，但已及时通知我们的未经授权使用除外。"
      ]
    },
    {
      "id": "s6",
      "title": "私人与群组消息",
      "paragraphs": [
        "消息在传输过程中加密，并存储于我们的服务器，以便投递并在你的各设备之间同步。本通讯服务一般不采用端到端加密；聊天记录备份可使用仅你本人知晓的密钥加密。",
        "你对自己发送的内容以及你所管理群组的管理负责。群组管理员可依据群组规则和本条款删除内容并移除参与者。"
      ]
    },
    {
      "id": "s7",
      "title": "语音与视频通话",
      "paragraphs": [
        "通话使用 WebRTC，音频和视频在参与通话的设备之间加密传输。我们为记录与安全目的保留参与者、时间与时长等元数据。",
        "只有在所有参与者均予授权且法律允许的情况下，你方可录制或转播通话。"
      ]
    },
    {
      "id": "s8",
      "title": "发布内容与社区",
      "paragraphs": [
        "你可在状态、动态、频道和社区中发布文字、图片、音频和视频。你保留对自己内容的所有权，并授予我们一项有限、非独占、免费的许可，以便在本服务内托管、复制和展示该内容。",
        "你可随时限制可见范围并删除自己的内容。这既不影响他人已保存的副本，也不影响法律要求我们保留的记录。"
      ]
    },
    {
      "id": "s9",
      "title": "直播与创作者功能",
      "paragraphs": [
        "直播及创作者工具按应用内所示规则提供。你对自己播出的内容负责，并须确保拥有音乐、图片及其他素材所需的各项权利。",
        "来自打赏、订阅或创作者付款的收入取决于需求，不获保证。此类收入须经身份验证、扣除佣金与税费，并取决于支付渠道的可用性。"
      ]
    },
    {
      "id": "s10",
      "title": "电子钱包与支付",
      "paragraphs": [
        "钱包可用于查询余额、收款、付款、充值及提现，以 CFA（中非法郎）计，具体取决于你所在国家/地区可用的方式。余额不是银行存款，不产生利息，也不受银行保障基金的保护。",
        "适用限额、费用和身份验证，并在应用内显示。如你发现错误或未经授权的交易，可申请复核；我们会进行调查，并在适当情况下按相应流水号冲正该笔分录。"
      ]
    },
    {
      "id": "s11",
      "title": "向网红与创作者付款",
      "paragraphs": [
        "向创作者付款须经身份验证并提供有效的收款信息。金额、费用与时间表在确认每笔交易前显示。",
        "每位创作者自行承担其纳税义务及其推广内容的合法性。对于涉及欺诈、违禁内容或第三方索赔的付款，我们可暂扣或拒绝支付。"
      ]
    },
    {
      "id": "s12",
      "title": "商业服务与未来的 marketplace 功能",
      "paragraphs": [
        "EGCHAT 可提供商业服务、预订及 marketplace 功能。届时将在订购前说明由谁销售、由谁收款以及适用何种条件。",
        "除明确说明外，EGCHAT 既非第三方所提供的产品或服务的销售方，亦不为其提供担保。商业争议由卖方及主管消费者事务的机构解决。"
      ]
    },
    {
      "id": "s13",
      "title": "人工智能功能",
      "paragraphs": [
        "LIA 及其他 AI 功能使用第三方模型。其回答可能不准确或不完整，不构成医疗、法律或财务建议。",
        "请勿向助手发送你不希望被处理的敏感数据。可能严重影响你权利的决定，不会仅以自动化方式作出。"
      ]
    },
    {
      "id": "s14",
      "title": "知识产权",
      "paragraphs": [
        "EGCHAT 的商标、设计、软件和文本归其权利人所有。你获得一项个人、有限、可撤销且非独占的许可，以便按本条款使用本应用。",
        "未经授权，你不得复制、修改、分发或反编译本服务。如你提交建议，我们可使用该建议而无需承担任何补偿义务。"
      ]
    },
    {
      "id": "s15",
      "title": "禁止内容与非法活动",
      "paragraphs": [
        "不得发布或分享违法、滥用性或侵害第三方权利的内容。"
      ],
      "bullets": [
        "儿童性剥削或性虐待、露骨暴力及威胁。",
        "骚扰、煽动仇恨与歧视。",
        "欺诈、诈骗、冒名与欺骗。",
        "恶意软件、垃圾信息及未经授权侵入系统。",
        "侵犯隐私、知识产权或个人数据。",
        "未经授权从事受监管的金融服务。"
      ]
    },
    {
      "id": "s16",
      "title": "内容管理与举报",
      "paragraphs": [
        "你可直接在应用内举报内容或账户。我们会审核举报，并在存在风险或违规情形时移除内容、限制功能或停用账户。",
        "在法律要求时，我们与主管机关合作。如你认为某项决定不公，可通过第 24 条所列渠道申请复核。"
      ]
    },
    {
      "id": "s17",
      "title": "账户的停用与注销",
      "paragraphs": [
        "对于严重违规、欺诈、对其他用户构成风险或法律要求的情形，我们可停用或注销账户。在可能的情况下，我们会事先通知并说明理由。",
        "你可随时在“设置”中删除账户。注销并不消灭尚未履行的义务，也不影响我们依法应保留的记录。"
      ]
    },
    {
      "id": "s18",
      "title": "责任限制",
      "paragraphs": [
        "本服务按“现状”及“可用”状态提供。我们不保证其无错误，也不保证其运行不中断。",
        "在法律允许的范围内，我们不对间接损失或利润损失承担责任。本条款中的任何内容均不限制法律强制赋予消费者的权利。"
      ]
    },
    {
      "id": "s19",
      "title": "第三方服务",
      "paragraphs": [
        "本应用依赖第三方服务，例如应用商店、电信运营商、支付机构、基础设施提供商及外部链接。这些服务适用其自身的条款与政策。",
        "我们不控制其可用性及内容。如第三方发生故障，我们将采取合理措施恢复服务，但不保证具体时限。"
      ]
    },
    {
      "id": "s20",
      "title": "服务的可用性",
      "paragraphs": [
        "我们可更新、维护或变更功能，以提升安全性与运行。对于影响较大的计划性中断，我们会在应用内或通过官方渠道公告。",
        "我们不保证内容永久保留。建议你自行备份需要保存的内容。"
      ]
    },
    {
      "id": "s21",
      "title": "争议解决",
      "paragraphs": [
        "如你有投诉，请先通过第 24 条所列渠道联系我们：我们将本着善意，在合理期限内尽力解决。",
        "如未能达成一致，你可向马拉博有管辖权的法院提起诉讼，但不影响你居住国保护你的消费者规则。"
      ]
    },
    {
      "id": "s22",
      "title": "适用法律",
      "paragraphs": [
        "本条款受赤道几内亚共和国法律以及你居住国保护消费者的强制性规范约束。",
        "除强制性规范另有规定外，如各语言版本之间存在歧义，以西班牙语版本为准。"
      ]
    },
    {
      "id": "s23",
      "title": "条款的修改",
      "paragraphs": [
        "我们可因法律、技术或业务变化修改本条款。我们将发布带有日期的新版本，并在变更较为重要时于应用内通知。",
        "如修改属重大，我们会要求重新接受。在生效后继续使用本服务，即视为接受现行版本。"
      ]
    },
    {
      "id": "s24",
      "title": "官方联系渠道",
      "paragraphs": [
        "支持渠道为 soporte@egchat.gq。就法律及隐私事项，你可使用同一邮箱并注明事由。",
        "我们在合理期限内答复；如法律规定了具体期限，则在该期限内答复。"
      ]
    }
  ],
  "closing": [
    "版本 1.1.0 · 自 2026 年 11 月 12 日起生效。",
    "EGCHAT 承诺以清晰的方式撰写本条款，并在法律或服务发生变化时进行修订。"
  ]
};

export const TERMS: Record<LegalLang, LegalDocContent> = { es, fr, en, zh };
