"use client";

import { useTranslation } from "react-i18next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";

const EN_TOC = [
  { id: "acceptance",    label: "Acceptance of Terms"      },
  { id: "license",       label: "Use License"               },
  { id: "accounts",      label: "User Accounts"             },
  { id: "subscription",  label: "Subscription & Payment"    },
  { id: "refunds",       label: "Refunds"                   },
  { id: "conduct",       label: "Content & Conduct"         },
  { id: "ip",            label: "Intellectual Property"     },
  { id: "ai-content",    label: "AI-Generated Content"      },
  { id: "termination",   label: "Termination"               },
  { id: "liability",     label: "Limitation of Liability"   },
  { id: "disclaimer",    label: "Disclaimer"                },
  { id: "governing-law", label: "Governing Law"             },
  { id: "changes",       label: "Changes to Terms"          },
  { id: "contact",       label: "Contact Us"                },
];

const FR_TOC = [
  { id: "acceptance",    label: "Acceptation des conditions"      },
  { id: "license",       label: "Licence d'utilisation"           },
  { id: "accounts",      label: "Comptes utilisateurs"            },
  { id: "subscription",  label: "Abonnement & Paiement"           },
  { id: "refunds",       label: "Remboursements"                  },
  { id: "conduct",       label: "Contenu & Conduite"              },
  { id: "ip",            label: "Propriété intellectuelle"        },
  { id: "ai-content",    label: "Contenu généré par l'IA"         },
  { id: "termination",   label: "Résiliation"                     },
  { id: "liability",     label: "Limitation de responsabilité"    },
  { id: "disclaimer",    label: "Avertissement"                   },
  { id: "governing-law", label: "Droit applicable"                },
  { id: "changes",       label: "Modifications des conditions"    },
  { id: "contact",       label: "Nous contacter"                  },
];

function EnglishContent() {
  return (
    <>
      <section className="legal-section" id="acceptance">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using IntelliConvo ("Service"), you accept and agree to be bound by the
          terms and provisions of this agreement. If you do not agree to abide by these terms,
          please do not use this Service.
        </p>
      </section>

      <section className="legal-section" id="license">
        <h2>2. Use License</h2>
        <p>
          Permission is granted to use the Service for personal or commercial purposes subject to
          your active subscription. This is the grant of a license, not a transfer of title.
          Under this license you may not:
        </p>
        <ul>
          <li>Modify or copy the underlying software or materials</li>
          <li>Use the Service for any commercial purpose without a proper subscription</li>
          <li>Attempt to decompile or reverse engineer any software contained in the Service</li>
          <li>Remove any copyright or other proprietary notations from the materials</li>
          <li>Transfer the materials to another person or mirror them on any other server</li>
        </ul>
      </section>

      <section className="legal-section" id="accounts">
        <h2>3. User Accounts</h2>
        <p>
          When you create an account, you must provide accurate, complete, and current information.
          Failure to do so constitutes a breach of the Terms and may result in immediate termination
          of your account.
        </p>
        <p>
          You are responsible for safeguarding your password and for all activities or actions
          taken under your account. You agree not to disclose your password to any third party and
          to notify us immediately of any unauthorized use of your account.
        </p>
      </section>

      <section className="legal-section" id="subscription">
        <h2>4. Subscription and Payment</h2>
        <p>
          Some parts of the Service are billed on a subscription basis. You will be billed in
          advance on a recurring and periodic basis (monthly or annually) depending on the
          subscription plan you select.
        </p>
        <p>
          A valid payment method is required to process payment for your subscription. You must
          provide accurate and complete billing information including your full name, address,
          and valid payment method details. By submitting payment information you authorize us
          to charge the applicable fees to your payment method.
        </p>
      </section>

      <section className="legal-section" id="refunds">
        <h2>5. Refunds</h2>
        <p>
          Refund requests for subscriptions may be considered on a case-by-case basis at our sole
          discretion. Please contact our support team to request a refund. We aim to resolve all
          requests fairly and promptly.
        </p>
      </section>

      <section className="legal-section" id="conduct">
        <h2>6. Content and Conduct</h2>
        <p>
          You are responsible for all content you submit, upload, or display on or through the
          Service. You agree not to use the Service to:
        </p>
        <ul>
          <li>Upload or transmit content that is unlawful, harmful, threatening, or abusive</li>
          <li>Impersonate any person or entity or misrepresent your affiliation with anyone</li>
          <li>Upload or transmit unsolicited or unauthorized advertising or promotional materials</li>
          <li>Interfere with or disrupt the Service or servers or networks connected to it</li>
          <li>Attempt to gain unauthorized access to any portion of the Service</li>
        </ul>
      </section>

      <section className="legal-section" id="ip">
        <h2>7. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are and will remain
          the exclusive property of IntelliConvo and its licensors. The Service is protected by
          copyright, trademark, and other applicable laws. Our trademarks and trade dress may not
          be used in connection with any product or service without our prior written consent.
        </p>
      </section>

      <section className="legal-section" id="ai-content">
        <h2>8. AI-Generated Content</h2>
        <p>
          Our Service uses artificial intelligence to generate responses based on your website
          content. While we strive for accuracy, AI-generated content may contain errors or
          inaccuracies. You acknowledge that:
        </p>
        <ul>
          <li>AI responses should be reviewed and verified before use in critical applications</li>
          <li>We do not guarantee the accuracy, completeness, or reliability of AI-generated content</li>
          <li>You are solely responsible for how you deploy and use AI-generated content</li>
          <li>The quality of responses depends on the quality of content you provide for training</li>
        </ul>
      </section>

      <section className="legal-section" id="termination">
        <h2>9. Termination</h2>
        <p>
          We may terminate or suspend your account immediately, without prior notice or liability,
          for any reason, including if you breach these Terms. Upon termination, your right to use
          the Service will immediately cease. If you wish to terminate your account, you may
          simply discontinue using the Service or delete your account from account settings.
        </p>
      </section>

      <section className="legal-section" id="liability">
        <h2>10. Limitation of Liability</h2>
        <p>
          In no event shall IntelliConvo, nor its directors, employees, partners, agents,
          suppliers, or affiliates, be liable for any indirect, incidental, special, consequential,
          or punitive damages — including without limitation, loss of profits, data, use, goodwill,
          or other intangible losses — resulting from your access to or use of (or inability to
          access or use) the Service.
        </p>
      </section>

      <section className="legal-section" id="disclaimer">
        <h2>11. Disclaimer</h2>
        <p>
          Your use of the Service is at your sole risk. The Service is provided on an "AS IS"
          and "AS AVAILABLE" basis without warranties of any kind, whether express or implied,
          including but not limited to implied warranties of merchantability, fitness for a
          particular purpose, or non-infringement.
        </p>
      </section>

      <section className="legal-section" id="governing-law">
        <h2>12. Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with applicable laws, without
          regard to conflict of law provisions. Our failure to enforce any right or provision of
          these Terms will not be considered a waiver of those rights.
        </p>
      </section>

      <section className="legal-section" id="changes">
        <h2>13. Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any
          time. If a revision is material, we will provide at least 30 days&apos; notice prior to any
          new terms taking effect. What constitutes a material change will be determined at our
          sole discretion. Continued use of the Service after changes take effect constitutes
          acceptance of the revised terms.
        </p>
      </section>

      <section className="legal-section" id="contact">
        <h2>14. Contact Us</h2>
        <p>
          If you have any questions about these Terms of Service, please contact us through our
          support channels. We&apos;re happy to clarify any points and address your concerns.
        </p>
      </section>
    </>
  );
}

function FrenchContent() {
  return (
    <>
      <section className="legal-section" id="acceptance">
        <h2>1. Acceptation des conditions</h2>
        <p>
          En accédant et en utilisant IntelliConvo (le « Service »), vous acceptez d&apos;être lié par
          les termes et dispositions du présent accord. Si vous n&apos;acceptez pas ces conditions,
          veuillez ne pas utiliser ce Service.
        </p>
      </section>

      <section className="legal-section" id="license">
        <h2>2. Licence d&apos;utilisation</h2>
        <p>
          L&apos;utilisation du Service à des fins personnelles ou commerciales est autorisée sous
          réserve de la possession d&apos;un abonnement actif. Il s&apos;agit d&apos;une concession de licence,
          et non d&apos;un transfert de propriété. Dans le cadre de cette licence, vous vous engagez à
          ne pas :
        </p>
        <ul>
          <li>Modifier ou copier le logiciel sous-jacent ou les matériaux fournis</li>
          <li>Utiliser le Service à des fins commerciales sans abonnement approprié</li>
          <li>Tenter de décompiler ou de procéder à une rétro-ingénierie du Service</li>
          <li>Supprimer toute mention de droits d&apos;auteur ou autre notation propriétaire</li>
          <li>Transférer les matériaux à une autre personne ou les reproduire sur un autre serveur</li>
        </ul>
      </section>

      <section className="legal-section" id="accounts">
        <h2>3. Comptes utilisateurs</h2>
        <p>
          Lors de la création de votre compte, vous devez fournir des informations exactes,
          complètes et à jour. Le non-respect de cette obligation constitue une violation des
          présentes Conditions et peut entraîner la résiliation immédiate de votre compte.
        </p>
        <p>
          Vous êtes responsable de la confidentialité de votre mot de passe et de toutes les
          activités effectuées depuis votre compte. Vous vous engagez à ne pas divulguer votre mot
          de passe à des tiers et à nous notifier immédiatement de toute utilisation non autorisée
          de votre compte.
        </p>
      </section>

      <section className="legal-section" id="subscription">
        <h2>4. Abonnement et paiement</h2>
        <p>
          Certaines fonctionnalités du Service sont facturées sur la base d&apos;un abonnement. Vous
          serez facturé à l&apos;avance de manière récurrente (mensuelle ou annuelle) selon le plan
          d&apos;abonnement sélectionné.
        </p>
        <p>
          Un moyen de paiement valide est nécessaire pour traiter le paiement de votre abonnement.
          Vous devez fournir des informations de facturation exactes et complètes, incluant votre
          nom complet, votre adresse et les coordonnées de votre moyen de paiement. En soumettant
          vos informations de paiement, vous nous autorisez à débiter les frais applicables sur
          votre moyen de paiement.
        </p>
      </section>

      <section className="legal-section" id="refunds">
        <h2>5. Remboursements</h2>
        <p>
          Les demandes de remboursement d&apos;abonnement peuvent être examinées au cas par cas, à
          notre seule discrétion. Veuillez contacter notre équipe d&apos;assistance pour formuler une
          demande de remboursement. Nous nous engageons à traiter toutes les demandes de manière
          équitable et rapide.
        </p>
      </section>

      <section className="legal-section" id="conduct">
        <h2>6. Contenu et conduite</h2>
        <p>
          Vous êtes responsable de tout contenu que vous soumettez, téléchargez ou affichez via
          le Service. Vous vous engagez à ne pas utiliser le Service pour :
        </p>
        <ul>
          <li>Télécharger ou transmettre du contenu illégal, nuisible, menaçant ou abusif</li>
          <li>Usurper l&apos;identité de toute personne ou entité, ou vous faire passer pour quelqu&apos;un d&apos;autre</li>
          <li>Télécharger ou transmettre des publicités ou des contenus promotionnels non sollicités</li>
          <li>Perturber ou interférer avec le Service ou les serveurs et réseaux qui y sont connectés</li>
          <li>Tenter d&apos;accéder sans autorisation à toute partie du Service</li>
        </ul>
      </section>

      <section className="legal-section" id="ip">
        <h2>7. Propriété intellectuelle</h2>
        <p>
          Le Service et son contenu original, ses fonctionnalités et sa conception sont et
          demeureront la propriété exclusive d&apos;IntelliConvo et de ses concédants de licence. Le
          Service est protégé par les droits d&apos;auteur, les marques déposées et les autres lois
          applicables. Nos marques et notre habillage commercial ne peuvent pas être utilisés en
          relation avec un produit ou un service sans notre consentement écrit préalable.
        </p>
      </section>

      <section className="legal-section" id="ai-content">
        <h2>8. Contenu généré par l&apos;IA</h2>
        <p>
          Notre Service utilise l&apos;intelligence artificielle pour générer des réponses basées sur le
          contenu de votre site web. Bien que nous nous efforcions de garantir l&apos;exactitude, le
          contenu généré par l&apos;IA peut contenir des erreurs ou des inexactitudes. Vous reconnaissez
          que :
        </p>
        <ul>
          <li>Les réponses de l&apos;IA doivent être examinées et vérifiées avant toute utilisation dans des applications critiques</li>
          <li>Nous ne garantissons pas l&apos;exactitude, l&apos;exhaustivité ou la fiabilité du contenu généré par l&apos;IA</li>
          <li>Vous êtes seul responsable de la manière dont vous déployez et utilisez le contenu généré par l&apos;IA</li>
          <li>La qualité des réponses dépend de la qualité du contenu que vous fournissez pour la formation</li>
        </ul>
      </section>

      <section className="legal-section" id="termination">
        <h2>9. Résiliation</h2>
        <p>
          Nous pouvons résilier ou suspendre votre compte immédiatement, sans préavis ni
          responsabilité, pour toute raison, notamment en cas de violation des présentes
          Conditions. Lors de la résiliation, votre droit d&apos;utiliser le Service cessera
          immédiatement. Si vous souhaitez résilier votre compte, vous pouvez simplement cesser
          d&apos;utiliser le Service ou supprimer votre compte depuis les paramètres du compte.
        </p>
      </section>

      <section className="legal-section" id="liability">
        <h2>10. Limitation de responsabilité</h2>
        <p>
          En aucun cas IntelliConvo, ni ses dirigeants, employés, partenaires, agents,
          fournisseurs ou affiliés, ne pourra être tenu responsable de tout dommage indirect,
          accessoire, spécial, consécutif ou punitif — y compris, sans s&apos;y limiter, la perte de
          profits, de données, d&apos;utilisation, de clientèle ou d&apos;autres pertes immatérielles —
          résultant de votre accès ou de votre utilisation (ou de l&apos;impossibilité d&apos;accéder ou
          d&apos;utiliser) le Service.
        </p>
      </section>

      <section className="legal-section" id="disclaimer">
        <h2>11. Avertissement</h2>
        <p>
          Votre utilisation du Service est à vos seuls risques. Le Service est fourni « TEL QUEL »
          et « TEL QUE DISPONIBLE », sans aucune garantie d&apos;aucune sorte, expresse ou implicite,
          y compris mais sans s&apos;y limiter les garanties implicites de qualité marchande,
          d&apos;adéquation à un usage particulier ou de non-contrefaçon.
        </p>
      </section>

      <section className="legal-section" id="governing-law">
        <h2>12. Droit applicable</h2>
        <p>
          Les présentes Conditions sont régies et interprétées conformément au droit applicable,
          sans égard aux dispositions sur les conflits de lois. Le fait que nous n&apos;exercions pas
          un droit ou une disposition des présentes Conditions ne sera pas considéré comme une
          renonciation à ces droits.
        </p>
      </section>

      <section className="legal-section" id="changes">
        <h2>13. Modifications des conditions</h2>
        <p>
          Nous nous réservons le droit, à notre seule discrétion, de modifier ou de remplacer les
          présentes Conditions à tout moment. Si une modification est substantielle, nous
          fournirons un préavis d&apos;au moins 30 jours avant l&apos;entrée en vigueur des nouvelles
          conditions. Ce qui constitue un changement substantiel sera déterminé à notre seule
          discrétion. La poursuite de l&apos;utilisation du Service après l&apos;entrée en vigueur des
          modifications constitue votre acceptation des conditions révisées.
        </p>
      </section>

      <section className="legal-section" id="contact">
        <h2>14. Nous contacter</h2>
        <p>
          Si vous avez des questions concernant les présentes Conditions Générales d&apos;Utilisation,
          veuillez nous contacter via nos canaux d&apos;assistance. Nous sommes heureux de clarifier
          tout point et de répondre à vos préoccupations.
        </p>
      </section>
    </>
  );
}

export default function TermsPage() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === "fr";

  return (
    <LegalPageLayout
      title={isFr ? "Conditions Générales d'Utilisation" : "Terms of Service"}
      description={
        isFr
          ? "Veuillez lire attentivement ces conditions avant d'utiliser IntelliConvo. En utilisant notre service, vous acceptez d'être lié par ces conditions."
          : "Please read these terms carefully before using IntelliConvo. By using our service, you agree to be bound by these terms."
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
