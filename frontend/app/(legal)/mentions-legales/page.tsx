"use client";

import { useTranslation } from "react-i18next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";

const EN_TOC = [
  { id: "publisher",      label: "Website Publisher"           },
  { id: "editor",         label: "Publication Director"        },
  { id: "hosting",        label: "Hosting"                     },
  { id: "ip",             label: "Intellectual Property"       },
  { id: "gdpr",           label: "Personal Data (GDPR)"        },
  { id: "cookies",        label: "Cookies"                     },
  { id: "liability",      label: "Limitation of Liability"     },
  { id: "links",          label: "Hyperlinks"                  },
  { id: "governing-law",  label: "Governing Law"               },
  { id: "contact",        label: "Contact"                     },
];

const FR_TOC = [
  { id: "publisher",      label: "Éditeur du site"              },
  { id: "editor",         label: "Directeur de publication"     },
  { id: "hosting",        label: "Hébergement"                  },
  { id: "ip",             label: "Propriété intellectuelle"     },
  { id: "gdpr",           label: "Données personnelles (RGPD)"  },
  { id: "cookies",        label: "Cookies"                      },
  { id: "liability",      label: "Limitation de responsabilité" },
  { id: "links",          label: "Hyperliens"                   },
  { id: "governing-law",  label: "Droit applicable"             },
  { id: "contact",        label: "Contact"                      },
];

function EnglishContent() {
  return (
    <>
      <section className="legal-section" id="publisher">
        <h2>1. Website Publisher</h2>
        <p>
          The website <strong>IntelliConvo</strong> (hereinafter "the Site") is published by:
        </p>
        <ul>
          <li><strong>Company name:</strong> [COMPANY NAME]</li>
          <li><strong>Legal form:</strong> [SAS / SARL / EURL / Sole trader…]</li>
          <li><strong>Share capital:</strong> [AMOUNT] €</li>
          <li><strong>Registered office:</strong> [FULL ADDRESS], [POSTAL CODE] [CITY], France</li>
          <li><strong>SIREN:</strong> [XXX XXX XXX]</li>
          <li><strong>SIRET:</strong> [XXX XXX XXX XXXXX]</li>
          <li><strong>RCS:</strong> [REGISTRATION CITY] [RCS NUMBER]</li>
          <li><strong>EU VAT number:</strong> FR [XX] [XXXXXXXXX]</li>
          <li><strong>Phone:</strong> [+33 X XX XX XX XX]</li>
          <li><strong>Email:</strong> [contact@intelliconvo.com]</li>
        </ul>
        <div className="legal-callout">
          These fields must be completed with your company&apos;s actual details before going live.
        </div>
      </section>

      <section className="legal-section" id="editor">
        <h2>2. Publication Director</h2>
        <p>
          The publication director is: <strong>[FIRST NAME LAST NAME]</strong>, acting as
          [Manager / President / CEO] of [COMPANY NAME].
        </p>
        <p>
          Contact: <strong>[director@intelliconvo.com]</strong>
        </p>
      </section>

      <section className="legal-section" id="hosting">
        <h2>3. Hosting</h2>
        <p>The Site is hosted by:</p>
        <ul>
          <li><strong>Company:</strong> [HOSTING PROVIDER — e.g. Amazon Web Services, OVHcloud, Vercel…]</li>
          <li><strong>Address:</strong> [HOSTING PROVIDER ADDRESS]</li>
          <li><strong>Phone:</strong> [HOSTING PROVIDER PHONE]</li>
          <li><strong>Website:</strong> [HOSTING PROVIDER URL]</li>
        </ul>
        <p>
          In accordance with Article 6 of the LCEN, the hosting provider is required to
          retain user connection data for a period of one year.
        </p>
      </section>

      <section className="legal-section" id="ip">
        <h2>4. Intellectual Property</h2>
        <p>
          All content on the Site — including but not limited to text, graphics, images,
          logos, icons, sounds, software, and databases — is the exclusive property of
          [COMPANY NAME] or its partners, and is protected by French and international
          intellectual property laws.
        </p>
        <p>
          The trademark <strong>IntelliConvo</strong>, along with all associated logos and
          distinctive signs, are registered or pending trademarks of [COMPANY NAME]. Any
          reproduction, representation, modification, publication, or adaptation of any part
          of the Site&apos;s content, by any means or process whatsoever, is prohibited without
          the prior written consent of [COMPANY NAME].
        </p>
        <p>
          Any unauthorized use of the Site or any of its elements will be considered an act
          of infringement and prosecuted in accordance with Articles L.335-2 et seq. of the
          French Intellectual Property Code.
        </p>
      </section>

      <section className="legal-section" id="gdpr">
        <h2>5. Personal Data (GDPR)</h2>
        <p>
          In accordance with the General Data Protection Regulation (GDPR — EU Regulation
          2016/679) and French law n° 78-17 of January 6, 1978 on data processing, files,
          and individual liberties ("Informatique et Libertés"), you have rights over your
          personal data.
        </p>

        <h3>Data Controller</h3>
        <p>
          The data controller for personal data collected on the Site is:
          <strong> [COMPANY NAME]</strong>, [ADDRESS], represented by [FIRST NAME LAST NAME].
        </p>

        <h3>Data Protection Officer (DPO)</h3>
        <p>
          [If applicable] The Data Protection Officer can be reached at:
          <strong> [dpo@intelliconvo.com]</strong>.
        </p>

        <h3>Purposes of Processing</h3>
        <p>Personal data collected is used for the following purposes:</p>
        <ul>
          <li>Creating and managing your user account</li>
          <li>Providing AI-powered conversational assistance services</li>
          <li>Processing payments and managing subscriptions</li>
          <li>Sending service-related communications (updates, security alerts)</li>
          <li>Improving the service and analyzing usage</li>
          <li>Complying with legal and regulatory obligations</li>
        </ul>

        <h3>Legal Bases</h3>
        <ul>
          <li><strong>Contract performance:</strong> processing necessary to deliver the service</li>
          <li><strong>Legitimate interest:</strong> service improvement and security</li>
          <li><strong>Legal obligation:</strong> retention of connection data, invoicing</li>
          <li><strong>Consent:</strong> marketing communications (opt-in)</li>
        </ul>

        <h3>Your Rights</h3>
        <p>Under the GDPR, you have the following rights:</p>
        <ul>
          <li><strong>Right of access (Art. 15 GDPR):</strong> obtain a copy of your personal data</li>
          <li><strong>Right to rectification (Art. 16 GDPR):</strong> correct inaccurate data</li>
          <li><strong>Right to erasure (Art. 17 GDPR):</strong> request deletion of your data</li>
          <li><strong>Right to data portability (Art. 20 GDPR):</strong> receive your data in a structured format</li>
          <li><strong>Right to object (Art. 21 GDPR):</strong> object to certain processing activities</li>
          <li><strong>Right to restriction (Art. 18 GDPR):</strong> request suspension of a processing activity</li>
          <li><strong>Right to withdraw consent:</strong> withdraw your consent at any time</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at: <strong>[privacy@intelliconvo.com]</strong>.
          You also have the right to lodge a complaint with the French data protection
          authority, the Commission Nationale de l&apos;Informatique et des Libertés (CNIL) —{" "}
          <strong>www.cnil.fr</strong> — if you believe that the processing of your personal
          data does not comply with applicable regulations.
        </p>

        <h3>Retention Periods</h3>
        <ul>
          <li>Account data: for the duration of the subscription, then 3 years after termination</li>
          <li>Connection logs: 1 year (legal obligation)</li>
          <li>Billing data: 10 years (accounting obligation)</li>
          <li>Analytics cookies: maximum 13 months (CNIL recommendation)</li>
        </ul>

        <h3>Transfers Outside the EU</h3>
        <p>
          Some data may be transferred to third countries (notably the United States) via our
          sub-processors (OpenAI, Pinecone, Stripe). Such transfers are governed by appropriate
          safeguards, in particular the Standard Contractual Clauses (SCCs) issued by the
          European Commission.
        </p>
        <div className="legal-callout">
          For full details on how we handle your personal data, please read our{" "}
          <a href="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>
            Privacy Policy
          </a>.
        </div>
      </section>

      <section className="legal-section" id="cookies">
        <h2>6. Cookies</h2>
        <p>
          The Site uses cookies and similar technologies. In accordance with CNIL guidelines
          (deliberation n° 2020-091 of September 17, 2020), non-essential cookies are only
          set after obtaining your consent.
        </p>
        <ul>
          <li><strong>Strictly necessary cookies:</strong> authentication, security, session preferences — no consent required</li>
          <li><strong>Analytics cookies:</strong> audience measurement and service improvement — subject to consent</li>
          <li><strong>Third-party cookies:</strong> Stripe (payment), OAuth authentication providers — subject to consent</li>
        </ul>
        <p>
          You can manage your cookie preferences at any time through your browser settings or
          our cookie management banner. The retention period for analytics cookies is limited
          to a maximum of 13 months, in line with CNIL recommendations.
        </p>
      </section>

      <section className="legal-section" id="liability">
        <h2>7. Limitation of Liability</h2>
        <p>
          [COMPANY NAME] endeavors to ensure the accuracy and currency of the information
          published on the Site. However, [COMPANY NAME] cannot guarantee the accuracy,
          precision, or completeness of information available on the Site, and disclaims all
          liability for:
        </p>
        <ul>
          <li>Any inaccuracy, imprecision, or omission relating to information available on the Site</li>
          <li>Any damage resulting from fraudulent third-party intrusion leading to modification of information</li>
          <li>Any damage related to the use of or inability to use the Site</li>
          <li>AI-generated content, which may contain errors or inaccuracies</li>
          <li>Any indirect damage resulting from use of the Site</li>
        </ul>
        <p>
          The Site may contain links to third-party websites. [COMPANY NAME] has no control
          over those sites and accepts no responsibility for their content.
        </p>
      </section>

      <section className="legal-section" id="links">
        <h2>8. Hyperlinks</h2>
        <p>
          Creating hyperlinks to the Site is subject to the prior written consent of
          [COMPANY NAME]. Any such request must be sent to [contact@intelliconvo.com].
        </p>
        <p>
          [COMPANY NAME] accepts no liability for hyperlinks pointing to third-party websites
          accessible from the Site. The existence of a link to another site does not
          constitute an endorsement of that site or its content.
        </p>
      </section>

      <section className="legal-section" id="governing-law">
        <h2>9. Governing Law and Jurisdiction</h2>
        <p>
          This Legal Notice is governed by French law. In the event of a dispute relating to
          its interpretation or execution, and in the absence of an amicable resolution,
          French courts shall have sole jurisdiction.
        </p>
        <p>
          Competent court: <strong>Commercial Court / Civil Court of [REGISTERED CITY]</strong>.
        </p>
        <p>The following applicable texts govern this notice:</p>
        <ul>
          <li>Law n° 2004-575 of June 21, 2004 on confidence in the digital economy (LCEN)</li>
          <li>Regulation (EU) 2016/679 of April 27, 2016 (GDPR)</li>
          <li>Law n° 78-17 of January 6, 1978 on data processing, files, and individual liberties</li>
          <li>French Consumer Code (where applicable)</li>
          <li>French Intellectual Property Code</li>
        </ul>
      </section>

      <section className="legal-section" id="contact">
        <h2>10. Contact</h2>
        <p>
          For any questions regarding this Legal Notice or to exercise your rights, you can
          reach us through the following channels:
        </p>
        <ul>
          <li><strong>By email:</strong> [legal@intelliconvo.com]</li>
          <li><strong>By post:</strong> [COMPANY NAME] — [FULL ADDRESS] — France</li>
          <li><strong>By phone:</strong> [+33 X XX XX XX XX] (Monday to Friday, 9am – 6pm CET)</li>
        </ul>
        <div className="legal-callout">
          We are committed to responding to any personal data request within a maximum of{" "}
          <strong>30 days</strong>, as required by the GDPR (Art. 12).
        </div>
      </section>
    </>
  );
}

function FrenchContent() {
  return (
    <>
      <section className="legal-section" id="publisher">
        <h2>1. Éditeur du site</h2>
        <p>
          Le site web <strong>IntelliConvo</strong> (ci-après « le Site ») est édité par :
        </p>
        <ul>
          <li><strong>Raison sociale :</strong> [NOM DE LA SOCIÉTÉ]</li>
          <li><strong>Forme juridique :</strong> [SAS / SARL / EURL / Entreprise individuelle…]</li>
          <li><strong>Capital social :</strong> [MONTANT] €</li>
          <li><strong>Siège social :</strong> [ADRESSE COMPLÈTE], [CODE POSTAL] [VILLE], France</li>
          <li><strong>SIREN :</strong> [XXX XXX XXX]</li>
          <li><strong>SIRET :</strong> [XXX XXX XXX XXXXX]</li>
          <li><strong>RCS :</strong> [VILLE D&apos;IMMATRICULATION] [NUMÉRO RCS]</li>
          <li><strong>N° TVA intracommunautaire :</strong> FR [XX] [XXXXXXXXX]</li>
          <li><strong>Téléphone :</strong> [+33 X XX XX XX XX]</li>
          <li><strong>E-mail :</strong> [contact@intelliconvo.com]</li>
        </ul>
        <div className="legal-callout">
          Ces champs doivent être complétés avec les informations réelles de votre société avant la mise en ligne.
        </div>
      </section>

      <section className="legal-section" id="editor">
        <h2>2. Directeur de la publication</h2>
        <p>
          Le directeur de la publication est : <strong>[PRÉNOM NOM]</strong>, en qualité de
          [Gérant / Président / Directeur général] de [NOM DE LA SOCIÉTÉ].
        </p>
        <p>
          Contact : <strong>[directeur@intelliconvo.com]</strong>
        </p>
      </section>

      <section className="legal-section" id="hosting">
        <h2>3. Hébergement</h2>
        <p>Le Site est hébergé par :</p>
        <ul>
          <li><strong>Société :</strong> [HÉBERGEUR — ex. Amazon Web Services, OVHcloud, Vercel…]</li>
          <li><strong>Adresse :</strong> [ADRESSE DE L&apos;HÉBERGEUR]</li>
          <li><strong>Téléphone :</strong> [TÉLÉPHONE DE L&apos;HÉBERGEUR]</li>
          <li><strong>Site web :</strong> [URL DE L&apos;HÉBERGEUR]</li>
        </ul>
        <p>
          Conformément à l&apos;article 6 de la loi LCEN, l&apos;hébergeur est tenu de conserver les
          données de connexion des utilisateurs pendant une durée d&apos;un an.
        </p>
      </section>

      <section className="legal-section" id="ip">
        <h2>4. Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des contenus présents sur le Site — incluant notamment les textes, graphiques,
          images, logos, icônes, sons, logiciels et bases de données — est la propriété exclusive
          de [NOM DE LA SOCIÉTÉ] ou de ses partenaires, et est protégé par les lois françaises et
          internationales relatives à la propriété intellectuelle.
        </p>
        <p>
          La marque <strong>IntelliConvo</strong>, ainsi que tous les logos et signes distinctifs
          associés, sont des marques déposées ou en cours d&apos;enregistrement de [NOM DE LA SOCIÉTÉ].
          Toute reproduction, représentation, modification, publication ou adaptation de tout ou
          partie des contenus du Site, par quelque moyen ou procédé que ce soit, est interdite
          sans l&apos;accord écrit préalable de [NOM DE LA SOCIÉTÉ].
        </p>
        <p>
          Toute utilisation non autorisée du Site ou de l&apos;un de ses éléments sera considérée
          comme un acte de contrefaçon et poursuivie conformément aux articles L.335-2 et
          suivants du Code de la Propriété Intellectuelle.
        </p>
      </section>

      <section className="legal-section" id="gdpr">
        <h2>5. Données personnelles (RGPD)</h2>
        <p>
          Conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE
          2016/679) et à la loi française n° 78-17 du 6 janvier 1978 relative à l&apos;informatique,
          aux fichiers et aux libertés (« loi Informatique et Libertés »), vous disposez de droits
          sur vos données personnelles.
        </p>

        <h3>Responsable du traitement</h3>
        <p>
          Le responsable du traitement des données personnelles collectées sur le Site est :
          <strong> [NOM DE LA SOCIÉTÉ]</strong>, [ADRESSE], représenté(e) par [PRÉNOM NOM].
        </p>

        <h3>Délégué à la Protection des Données (DPO)</h3>
        <p>
          [Le cas échéant] Le Délégué à la Protection des Données peut être contacté à l&apos;adresse :
          <strong> [dpo@intelliconvo.com]</strong>.
        </p>

        <h3>Finalités des traitements</h3>
        <p>Les données personnelles collectées sont utilisées aux fins suivantes :</p>
        <ul>
          <li>Création et gestion de votre compte utilisateur</li>
          <li>Fourniture des services d&apos;assistance conversationnelle basés sur l&apos;IA</li>
          <li>Traitement des paiements et gestion des abonnements</li>
          <li>Envoi de communications liées au service (mises à jour, alertes de sécurité)</li>
          <li>Amélioration du service et analyse des usages</li>
          <li>Respect des obligations légales et réglementaires</li>
        </ul>

        <h3>Bases légales</h3>
        <ul>
          <li><strong>Exécution du contrat :</strong> traitement nécessaire à la fourniture du service</li>
          <li><strong>Intérêt légitime :</strong> amélioration du service et sécurité</li>
          <li><strong>Obligation légale :</strong> conservation des données de connexion, facturation</li>
          <li><strong>Consentement :</strong> communications marketing (opt-in)</li>
        </ul>

        <h3>Vos droits</h3>
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul>
          <li><strong>Droit d&apos;accès (art. 15 RGPD) :</strong> obtenir une copie de vos données personnelles</li>
          <li><strong>Droit de rectification (art. 16 RGPD) :</strong> corriger des données inexactes</li>
          <li><strong>Droit à l&apos;effacement (art. 17 RGPD) :</strong> demander la suppression de vos données</li>
          <li><strong>Droit à la portabilité (art. 20 RGPD) :</strong> recevoir vos données dans un format structuré</li>
          <li><strong>Droit d&apos;opposition (art. 21 RGPD) :</strong> vous opposer à certains traitements</li>
          <li><strong>Droit à la limitation (art. 18 RGPD) :</strong> demander la suspension d&apos;un traitement</li>
          <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement à tout moment</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à : <strong>[privacy@intelliconvo.com]</strong>.
          Vous disposez également du droit d&apos;introduire une réclamation auprès de la Commission
          Nationale de l&apos;Informatique et des Libertés (CNIL) — <strong>www.cnil.fr</strong> — si
          vous estimez que le traitement de vos données personnelles n&apos;est pas conforme à la
          réglementation applicable.
        </p>

        <h3>Durées de conservation</h3>
        <ul>
          <li>Données de compte : pendant la durée de l&apos;abonnement, puis 3 ans après résiliation</li>
          <li>Journaux de connexion : 1 an (obligation légale)</li>
          <li>Données de facturation : 10 ans (obligation comptable)</li>
          <li>Cookies analytiques : 13 mois maximum (recommandation CNIL)</li>
        </ul>

        <h3>Transferts hors UE</h3>
        <p>
          Certaines données peuvent être transférées vers des pays tiers (notamment les
          États-Unis) via nos sous-traitants (OpenAI, Pinecone, Stripe). Ces transferts sont
          encadrés par des garanties appropriées, notamment les Clauses Contractuelles Types
          (CCT) adoptées par la Commission européenne.
        </p>
        <div className="legal-callout">
          Pour plus de détails sur la gestion de vos données personnelles, consultez notre{" "}
          <a href="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>
            Politique de Confidentialité
          </a>.
        </div>
      </section>

      <section className="legal-section" id="cookies">
        <h2>6. Cookies</h2>
        <p>
          Le Site utilise des cookies et technologies similaires. Conformément aux lignes
          directrices de la CNIL (délibération n° 2020-091 du 17 septembre 2020), les cookies
          non essentiels ne sont déposés qu&apos;après obtention de votre consentement.
        </p>
        <ul>
          <li><strong>Cookies strictement nécessaires :</strong> authentification, sécurité, préférences de session — pas de consentement requis</li>
          <li><strong>Cookies analytiques :</strong> mesure d&apos;audience et amélioration du service — soumis à consentement</li>
          <li><strong>Cookies tiers :</strong> Stripe (paiement), fournisseurs d&apos;authentification OAuth — soumis à consentement</li>
        </ul>
        <p>
          Vous pouvez gérer vos préférences en matière de cookies à tout moment via les
          paramètres de votre navigateur ou notre bandeau de gestion des cookies. La durée de
          conservation des cookies analytiques est limitée à 13 mois maximum, conformément aux
          recommandations de la CNIL.
        </p>
      </section>

      <section className="legal-section" id="liability">
        <h2>7. Limitation de responsabilité</h2>
        <p>
          [NOM DE LA SOCIÉTÉ] s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations
          publiées sur le Site. Cependant, [NOM DE LA SOCIÉTÉ] ne peut garantir l&apos;exactitude,
          la précision ou l&apos;exhaustivité des informations disponibles sur le Site, et décline
          toute responsabilité pour :
        </p>
        <ul>
          <li>Toute inexactitude, imprécision ou omission portant sur des informations disponibles sur le Site</li>
          <li>Tout dommage résultant d&apos;une intrusion frauduleuse d&apos;un tiers entraînant une modification des informations</li>
          <li>Tout dommage lié à l&apos;utilisation ou à l&apos;impossibilité d&apos;utiliser le Site</li>
          <li>Le contenu généré par l&apos;IA, qui peut contenir des erreurs ou inexactitudes</li>
          <li>Tout dommage indirect résultant de l&apos;utilisation du Site</li>
        </ul>
        <p>
          Le Site peut contenir des liens vers des sites tiers. [NOM DE LA SOCIÉTÉ] n&apos;a aucun
          contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
        </p>
      </section>

      <section className="legal-section" id="links">
        <h2>8. Hyperliens</h2>
        <p>
          La création d&apos;hyperliens vers le Site est soumise à l&apos;accord écrit préalable de
          [NOM DE LA SOCIÉTÉ]. Toute demande en ce sens doit être adressée à
          [contact@intelliconvo.com].
        </p>
        <p>
          [NOM DE LA SOCIÉTÉ] décline toute responsabilité concernant les hyperliens pointant
          vers des sites tiers accessibles depuis le Site. L&apos;existence d&apos;un lien vers un autre
          site ne constitue pas une approbation de ce site ou de son contenu.
        </p>
      </section>

      <section className="legal-section" id="governing-law">
        <h2>9. Droit applicable et juridiction compétente</h2>
        <p>
          Les présentes Mentions Légales sont régies par le droit français. En cas de litige
          relatif à leur interprétation ou à leur exécution, et à défaut de résolution amiable,
          les tribunaux français seront seuls compétents.
        </p>
        <p>
          Tribunal compétent : <strong>Tribunal de Commerce / Tribunal Judiciaire de [VILLE DU SIÈGE SOCIAL]</strong>.
        </p>
        <p>Les textes applicables régissant les présentes mentions sont :</p>
        <ul>
          <li>Loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique (LCEN)</li>
          <li>Règlement (UE) 2016/679 du 27 avril 2016 (RGPD)</li>
          <li>Loi n° 78-17 du 6 janvier 1978 relative à l&apos;informatique, aux fichiers et aux libertés</li>
          <li>Code de la consommation (le cas échéant)</li>
          <li>Code de la Propriété Intellectuelle</li>
        </ul>
      </section>

      <section className="legal-section" id="contact">
        <h2>10. Contact</h2>
        <p>
          Pour toute question relative aux présentes Mentions Légales ou pour exercer vos droits,
          vous pouvez nous joindre par les moyens suivants :
        </p>
        <ul>
          <li><strong>Par e-mail :</strong> [legal@intelliconvo.com]</li>
          <li><strong>Par courrier :</strong> [NOM DE LA SOCIÉTÉ] — [ADRESSE COMPLÈTE] — France</li>
          <li><strong>Par téléphone :</strong> [+33 X XX XX XX XX] (du lundi au vendredi, 9h – 18h CET)</li>
        </ul>
        <div className="legal-callout">
          Nous nous engageons à répondre à toute demande relative aux données personnelles dans
          un délai maximum de <strong>30 jours</strong>, comme l&apos;exige le RGPD (art. 12).
        </div>
      </section>
    </>
  );
}

export default function MentionsLegalesPage() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === "fr";

  return (
    <LegalPageLayout
      title={isFr ? "Mentions Légales" : "Legal Notice"}
      description={
        isFr
          ? "Conformément aux dispositions de la loi française n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN), les informations suivantes sont mises à disposition de tous les utilisateurs de ce site."
          : "In accordance with the provisions of French law n° 2004-575 of June 21, 2004 on confidence in the digital economy (LCEN), the following information is provided to all users of this website."
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
