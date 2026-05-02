"use client";

import { useTranslation } from "react-i18next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";

const EN_TOC = [
  { id: "introduction",     label: "Introduction"               },
  { id: "data-collected",   label: "Information We Collect"     },
  { id: "data-use",         label: "How We Use Your Information" },
  { id: "ai-processing",    label: "AI & Data Processing"       },
  { id: "data-sharing",     label: "Data Sharing & Disclosure"  },
  { id: "third-parties",    label: "Third-Party Services"       },
  { id: "security",         label: "Data Security"              },
  { id: "retention",        label: "Data Retention"             },
  { id: "your-rights",      label: "Your Rights & Choices"      },
  { id: "cookies",          label: "Cookies & Tracking"         },
  { id: "children",         label: "Children's Privacy"         },
  { id: "international",    label: "International Transfers"    },
  { id: "changes",          label: "Changes to This Policy"     },
  { id: "contact",          label: "Contact Us"                 },
];

const FR_TOC = [
  { id: "introduction",     label: "Introduction"                    },
  { id: "data-collected",   label: "Données collectées"              },
  { id: "data-use",         label: "Utilisation de vos données"      },
  { id: "ai-processing",    label: "IA & Traitement des données"     },
  { id: "data-sharing",     label: "Partage & Divulgation"           },
  { id: "third-parties",    label: "Services tiers"                  },
  { id: "security",         label: "Sécurité des données"            },
  { id: "retention",        label: "Conservation des données"        },
  { id: "your-rights",      label: "Vos droits & Choix"              },
  { id: "cookies",          label: "Cookies & Suivi"                 },
  { id: "children",         label: "Protection des mineurs"          },
  { id: "international",    label: "Transferts internationaux"       },
  { id: "changes",          label: "Modifications de la politique"   },
  { id: "contact",          label: "Nous contacter"                  },
];

function EnglishContent() {
  return (
    <>
      <section className="legal-section" id="introduction">
        <h2>1. Introduction</h2>
        <p>
          This Privacy Policy describes how IntelliConvo collects, uses, and handles your
          information when you use our conversational AI platform ("Service"). We are committed
          to protecting your privacy and ensuring transparency about our data practices.
        </p>
        <div className="legal-callout">
          We do not sell your personal information to third parties — ever.
        </div>
      </section>

      <section className="legal-section" id="data-collected">
        <h2>2. Information We Collect</h2>

        <h3>2.1 Information You Provide</h3>
        <p>We collect information you directly provide to us, including:</p>
        <ul>
          <li>Account information (name, email address, password)</li>
          <li>Payment information (processed securely through our payment processor)</li>
          <li>Website URLs and content you submit for AI training and indexing</li>
          <li>Chat conversations and messages created through the Service</li>
          <li>Support communications and feedback</li>
        </ul>

        <h3>2.2 Automatically Collected Information</h3>
        <p>When you use our Service, we automatically collect certain information, including:</p>
        <ul>
          <li>Usage data (features used, pages visited, time spent)</li>
          <li>Device information (browser type, operating system, IP address)</li>
          <li>Log data (access times, error logs)</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>

        <h3>2.3 Third-Party Data</h3>
        <p>
          We may receive information from third-party services you connect to our Service,
          such as OAuth authentication providers (Google, GitHub, etc.).
        </p>
      </section>

      <section className="legal-section" id="data-use">
        <h2>3. How We Use Your Information</h2>
        <p>We use the collected information for the following purposes:</p>
        <ul>
          <li>To provide, maintain, and improve the Service</li>
          <li>To process your transactions and manage your subscription</li>
          <li>To train AI models for better, more accurate responses on your content</li>
          <li>To generate embeddings and enable semantic search on your content</li>
          <li>To send technical notices, updates, and support messages</li>
          <li>To respond to comments, questions, and customer service requests</li>
          <li>To monitor and analyze usage patterns and trends</li>
          <li>To detect, prevent, and address technical issues and security threats</li>
          <li>To comply with legal obligations</li>
        </ul>
      </section>

      <section className="legal-section" id="ai-processing">
        <h2>4. AI and Data Processing</h2>
        <p>
          Our Service uses artificial intelligence to process and respond to conversations.
          Here is how your data is handled in our AI pipeline:
        </p>
        <ul>
          <li>Your content and conversations may be processed by third-party AI providers (e.g., OpenAI)</li>
          <li>We create embeddings (vector representations) of your content for semantic search</li>
          <li>Embeddings are stored in our vector database (Pinecone) for retrieval</li>
          <li>Chat conversations are stored to provide context and improve responses</li>
          <li>We do not use your data to train public AI models without your explicit consent</li>
        </ul>
      </section>

      <section className="legal-section" id="data-sharing">
        <h2>5. Data Sharing and Disclosure</h2>
        <p>We may share your information in the following circumstances:</p>
        <ul>
          <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (hosting, payment processing, AI processing, analytics)</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and the safety of others</li>
          <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition of all or part of our business</li>
          <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
        </ul>
        <div className="legal-callout">
          We do not sell your personal information to third parties.
        </div>
      </section>

      <section className="legal-section" id="third-parties">
        <h2>6. Third-Party Services</h2>
        <p>Our Service integrates with the following third-party services:</p>
        <ul>
          <li><strong>OpenAI:</strong> For AI-powered chat responses and text embeddings</li>
          <li><strong>Pinecone:</strong> For vector database storage and semantic search</li>
          <li><strong>Stripe:</strong> For payment processing and subscription management</li>
          <li><strong>OAuth Providers:</strong> For authentication (Google, GitHub, etc.)</li>
        </ul>
        <p>
          Each of these services maintains its own privacy policy. We encourage you to review
          them to understand how they handle your data.
        </p>
      </section>

      <section className="legal-section" id="security">
        <h2>7. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your information:
        </p>
        <ul>
          <li>Encryption of data in transit using TLS/SSL</li>
          <li>Encryption of sensitive data at rest</li>
          <li>Secure authentication using JWT tokens</li>
          <li>Regular security audits and dependency updates</li>
          <li>Strict access controls and authentication requirements</li>
        </ul>
        <p>
          However, no method of transmission over the internet or electronic storage is 100%
          secure. We cannot guarantee absolute security and encourage you to use strong, unique
          passwords for your account.
        </p>
      </section>

      <section className="legal-section" id="retention">
        <h2>8. Data Retention</h2>
        <p>We retain your information for as long as necessary to provide the Service:</p>
        <ul>
          <li>Account information is retained while your account is active</li>
          <li>Conversation data is retained to provide historical context and improve responses</li>
          <li>Embeddings are retained to enable search functionality</li>
          <li>Billing information is retained as required for tax and accounting purposes</li>
        </ul>
        <p>
          You can request deletion of your data by contacting us or deleting your account
          through account settings.
        </p>
      </section>

      <section className="legal-section" id="your-rights">
        <h2>9. Your Rights and Choices</h2>
        <p>Depending on your location, you may have the following rights:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of your personal information</li>
          <li><strong>Correction:</strong> Update or correct inaccurate information</li>
          <li><strong>Deletion:</strong> Request deletion of your information</li>
          <li><strong>Data Portability:</strong> Receive your data in a machine-readable format</li>
          <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time</li>
          <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
        </ul>
        <p>To exercise any of these rights, please contact us through our support channels.</p>
      </section>

      <section className="legal-section" id="cookies">
        <h2>10. Cookies and Tracking</h2>
        <p>We use cookies and similar tracking technologies to:</p>
        <ul>
          <li>Maintain your session and authentication state</li>
          <li>Remember your preferences and settings</li>
          <li>Analyze usage patterns and improve the Service</li>
          <li>Enable security features</li>
        </ul>
        <p>
          You can control cookies through your browser settings, but disabling certain cookies
          may affect the functionality of the Service.
        </p>
      </section>

      <section className="legal-section" id="children">
        <h2>11. Children&apos;s Privacy</h2>
        <p>
          Our Service is not intended for children under 13 years of age. We do not knowingly
          collect personal information from children under 13. If you become aware that a child
          has provided us with personal information, please contact us and we will take steps to
          delete such information promptly.
        </p>
      </section>

      <section className="legal-section" id="international">
        <h2>12. International Data Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries other than your own.
          We ensure appropriate safeguards are in place to protect your information in accordance
          with this Privacy Policy, including standard contractual clauses where required.
        </p>
      </section>

      <section className="legal-section" id="changes">
        <h2>13. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any material
          changes by posting the new Privacy Policy on this page and updating the "Last updated"
          date at the top. For significant changes, we will also notify you by email. We encourage
          you to review this policy periodically.
        </p>
      </section>

      <section className="legal-section" id="contact">
        <h2>14. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or our data practices, please
          contact us through our support channels. We aim to respond to all privacy-related
          inquiries within 5 business days.
        </p>
      </section>
    </>
  );
}

function FrenchContent() {
  return (
    <>
      <section className="legal-section" id="introduction">
        <h2>1. Introduction</h2>
        <p>
          La présente Politique de Confidentialité décrit la manière dont IntelliConvo collecte,
          utilise et traite vos informations lorsque vous utilisez notre plateforme d&apos;IA
          conversationnelle (le « Service »). Nous nous engageons à protéger votre vie privée et
          à assurer une totale transparence sur nos pratiques en matière de données.
        </p>
        <div className="legal-callout">
          Nous ne vendons jamais vos données personnelles à des tiers — jamais.
        </div>
      </section>

      <section className="legal-section" id="data-collected">
        <h2>2. Données collectées</h2>

        <h3>2.1 Informations que vous nous fournissez</h3>
        <p>Nous collectons les informations que vous nous fournissez directement, notamment :</p>
        <ul>
          <li>Les informations de compte (nom, adresse e-mail, mot de passe)</li>
          <li>Les informations de paiement (traitées de manière sécurisée par notre prestataire de paiement)</li>
          <li>Les URLs et contenus de sites web que vous soumettez pour l&apos;entraînement et l&apos;indexation de l&apos;IA</li>
          <li>Les conversations et messages de chat créés via le Service</li>
          <li>Les communications d&apos;assistance et les retours d&apos;expérience</li>
        </ul>

        <h3>2.2 Informations collectées automatiquement</h3>
        <p>Lors de votre utilisation du Service, nous collectons automatiquement certaines informations, notamment :</p>
        <ul>
          <li>Les données d&apos;utilisation (fonctionnalités utilisées, pages visitées, temps passé)</li>
          <li>Les informations relatives à l&apos;appareil (type de navigateur, système d&apos;exploitation, adresse IP)</li>
          <li>Les journaux de données (heures d&apos;accès, journaux d&apos;erreurs)</li>
          <li>Les cookies et technologies de suivi similaires</li>
        </ul>

        <h3>2.3 Données provenant de tiers</h3>
        <p>
          Nous pouvons recevoir des informations de services tiers que vous connectez à notre
          Service, tels que les fournisseurs d&apos;authentification OAuth (Google, GitHub, etc.).
        </p>
      </section>

      <section className="legal-section" id="data-use">
        <h2>3. Utilisation de vos données</h2>
        <p>Nous utilisons les informations collectées aux fins suivantes :</p>
        <ul>
          <li>Fournir, maintenir et améliorer le Service</li>
          <li>Traiter vos transactions et gérer votre abonnement</li>
          <li>Entraîner les modèles d&apos;IA pour des réponses plus précises sur votre contenu</li>
          <li>Générer des embeddings et activer la recherche sémantique sur votre contenu</li>
          <li>Envoyer des avis techniques, des mises à jour et des messages d&apos;assistance</li>
          <li>Répondre aux commentaires, questions et demandes d&apos;assistance clientèle</li>
          <li>Surveiller et analyser les modes et tendances d&apos;utilisation</li>
          <li>Détecter, prévenir et résoudre les problèmes techniques et les menaces de sécurité</li>
          <li>Respecter nos obligations légales</li>
        </ul>
      </section>

      <section className="legal-section" id="ai-processing">
        <h2>4. IA et traitement des données</h2>
        <p>
          Notre Service utilise l&apos;intelligence artificielle pour traiter les conversations et y
          répondre. Voici comment vos données sont traitées dans notre pipeline IA :
        </p>
        <ul>
          <li>Votre contenu et vos conversations peuvent être traités par des fournisseurs d&apos;IA tiers (par ex. OpenAI)</li>
          <li>Nous créons des embeddings (représentations vectorielles) de votre contenu pour la recherche sémantique</li>
          <li>Les embeddings sont stockés dans notre base de données vectorielle (Pinecone) pour la récupération</li>
          <li>Les conversations de chat sont stockées afin de fournir un contexte et d&apos;améliorer les réponses</li>
          <li>Nous n&apos;utilisons pas vos données pour entraîner des modèles d&apos;IA publics sans votre consentement explicite</li>
        </ul>
      </section>

      <section className="legal-section" id="data-sharing">
        <h2>5. Partage et divulgation des données</h2>
        <p>Nous pouvons partager vos informations dans les circonstances suivantes :</p>
        <ul>
          <li><strong>Prestataires de services :</strong> Fournisseurs tiers réalisant des services en notre nom (hébergement, traitement des paiements, traitement IA, analyses)</li>
          <li><strong>Obligations légales :</strong> Lorsque la loi l&apos;exige ou pour protéger nos droits et la sécurité d&apos;autrui</li>
          <li><strong>Cessions d&apos;entreprise :</strong> Dans le cadre d&apos;une fusion, d&apos;une vente ou d&apos;une acquisition de tout ou partie de notre activité</li>
          <li><strong>Avec votre consentement :</strong> Lorsque vous nous autorisez expressément à partager vos informations</li>
        </ul>
        <div className="legal-callout">
          Nous ne vendons pas vos données personnelles à des tiers.
        </div>
      </section>

      <section className="legal-section" id="third-parties">
        <h2>6. Services tiers</h2>
        <p>Notre Service s&apos;intègre avec les services tiers suivants :</p>
        <ul>
          <li><strong>OpenAI :</strong> Pour les réponses de chat basées sur l&apos;IA et les embeddings textuels</li>
          <li><strong>Pinecone :</strong> Pour le stockage en base de données vectorielle et la recherche sémantique</li>
          <li><strong>Stripe :</strong> Pour le traitement des paiements et la gestion des abonnements</li>
          <li><strong>Fournisseurs OAuth :</strong> Pour l&apos;authentification (Google, GitHub, etc.)</li>
        </ul>
        <p>
          Chacun de ces services dispose de sa propre politique de confidentialité. Nous vous
          encourageons à les consulter pour comprendre comment ils traitent vos données.
        </p>
      </section>

      <section className="legal-section" id="security">
        <h2>7. Sécurité des données</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
          protéger vos informations :
        </p>
        <ul>
          <li>Chiffrement des données en transit via TLS/SSL</li>
          <li>Chiffrement des données sensibles au repos</li>
          <li>Authentification sécurisée via des jetons JWT</li>
          <li>Audits de sécurité réguliers et mises à jour des dépendances</li>
          <li>Contrôles d&apos;accès stricts et exigences d&apos;authentification</li>
        </ul>
        <p>
          Cependant, aucune méthode de transmission sur Internet ou de stockage électronique
          n&apos;est sécurisée à 100 %. Nous ne pouvons pas garantir une sécurité absolue et vous
          encourageons à utiliser des mots de passe forts et uniques pour votre compte.
        </p>
      </section>

      <section className="legal-section" id="retention">
        <h2>8. Conservation des données</h2>
        <p>Nous conservons vos informations aussi longtemps que nécessaire pour fournir le Service :</p>
        <ul>
          <li>Les informations de compte sont conservées pendant toute la durée d&apos;activité de votre compte</li>
          <li>Les données de conversation sont conservées pour fournir un contexte historique et améliorer les réponses</li>
          <li>Les embeddings sont conservés pour permettre la fonctionnalité de recherche</li>
          <li>Les informations de facturation sont conservées conformément aux obligations fiscales et comptables</li>
        </ul>
        <p>
          Vous pouvez demander la suppression de vos données en nous contactant ou en supprimant
          votre compte depuis les paramètres du compte.
        </p>
      </section>

      <section className="legal-section" id="your-rights">
        <h2>9. Vos droits et choix</h2>
        <p>Selon votre lieu de résidence, vous pouvez disposer des droits suivants :</p>
        <ul>
          <li><strong>Accès :</strong> Demander une copie de vos données personnelles</li>
          <li><strong>Rectification :</strong> Mettre à jour ou corriger des informations inexactes</li>
          <li><strong>Suppression :</strong> Demander la suppression de vos informations</li>
          <li><strong>Portabilité des données :</strong> Recevoir vos données dans un format lisible par machine</li>
          <li><strong>Opposition :</strong> Vous désabonner des communications marketing à tout moment</li>
          <li><strong>Retrait du consentement :</strong> Retirer votre consentement au traitement des données, le cas échéant</li>
        </ul>
        <p>Pour exercer l&apos;un de ces droits, veuillez nous contacter via nos canaux d&apos;assistance.</p>
      </section>

      <section className="legal-section" id="cookies">
        <h2>10. Cookies et suivi</h2>
        <p>Nous utilisons des cookies et des technologies de suivi similaires pour :</p>
        <ul>
          <li>Maintenir votre session et votre état d&apos;authentification</li>
          <li>Mémoriser vos préférences et paramètres</li>
          <li>Analyser les modes d&apos;utilisation et améliorer le Service</li>
          <li>Activer les fonctionnalités de sécurité</li>
        </ul>
        <p>
          Vous pouvez contrôler les cookies via les paramètres de votre navigateur, mais la
          désactivation de certains cookies peut affecter les fonctionnalités du Service.
        </p>
      </section>

      <section className="legal-section" id="children">
        <h2>11. Protection des mineurs</h2>
        <p>
          Notre Service n&apos;est pas destiné aux enfants de moins de 13 ans. Nous ne collectons pas
          sciemment des informations personnelles concernant des enfants de moins de 13 ans. Si
          vous apprenez qu&apos;un enfant nous a fourni des informations personnelles, veuillez nous
          contacter et nous prendrons des mesures pour supprimer ces informations dans les
          meilleurs délais.
        </p>
      </section>

      <section className="legal-section" id="international">
        <h2>12. Transferts internationaux de données</h2>
        <p>
          Vos informations peuvent être transférées et traitées dans des pays autres que le vôtre.
          Nous veillons à mettre en place des garanties appropriées pour protéger vos informations
          conformément à la présente Politique de Confidentialité, notamment par le biais de
          clauses contractuelles types lorsque cela est requis.
        </p>
      </section>

      <section className="legal-section" id="changes">
        <h2>13. Modifications de cette politique</h2>
        <p>
          Nous pouvons mettre à jour cette Politique de Confidentialité de temps à autre. Nous
          vous informerons de toute modification substantielle en publiant la nouvelle Politique
          de Confidentialité sur cette page et en mettant à jour la date de « Dernière mise à
          jour » en haut. Pour les modifications significatives, nous vous informerons également
          par e-mail. Nous vous encourageons à consulter cette politique périodiquement.
        </p>
      </section>

      <section className="legal-section" id="contact">
        <h2>14. Nous contacter</h2>
        <p>
          Si vous avez des questions concernant cette Politique de Confidentialité ou nos
          pratiques en matière de données, veuillez nous contacter via nos canaux d&apos;assistance.
          Nous nous efforçons de répondre à toutes les demandes relatives à la vie privée dans
          un délai de 5 jours ouvrés.
        </p>
      </section>
    </>
  );
}

export default function PrivacyPage() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === "fr";

  return (
    <LegalPageLayout
      title={isFr ? "Politique de Confidentialité" : "Privacy Policy"}
      description={
        isFr
          ? "Nous nous engageons à protéger votre vie privée et à assurer une pleine transparence sur la manière dont nous collectons, utilisons et traitons vos données."
          : "We are committed to protecting your privacy and ensuring full transparency about how we collect, use, and handle your data."
      }
      lastUpdated={new Date().toLocaleDateString(isFr ? "fr-FR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
      toc={isFr ? FR_TOC : EN_TOC}
    >
      {isFr ? <FrenchContent /> : <EnglishContent />}
    </LegalPageLayout>
  );
}
