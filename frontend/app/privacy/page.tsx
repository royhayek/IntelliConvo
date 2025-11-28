import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for our conversational AI platform",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="inline-block">
              <BrandLogo size="md" showText={true} href={null} animated={false} />
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="prose dark:prose-invert max-w-none p-8">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4">
                This Privacy Policy describes how we collect, use, and handle your information when you use our conversational AI platform ("Service"). We are committed to protecting your privacy and ensuring transparency about our data practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Information You Provide</h3>
              <p className="mb-4">
                We collect information you directly provide to us, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Account information (name, email address, password)</li>
                <li>Payment information (processed securely through our payment processor)</li>
                <li>Website URLs and content you submit for AI training and indexing</li>
                <li>Chat conversations and messages you create through the Service</li>
                <li>Support communications and feedback</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Automatically Collected Information</h3>
              <p className="mb-4">
                When you use our Service, we automatically collect certain information, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Usage data (features used, pages visited, time spent)</li>
                <li>Device information (browser type, operating system, IP address)</li>
                <li>Log data (access times, error logs)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">2.3 Third-Party Data</h3>
              <p className="mb-4">
                We may receive information from third-party services you connect to our Service, such as OAuth authentication providers (Google, GitHub, etc.).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p className="mb-4">
                We use the collected information for various purposes:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>To provide, maintain, and improve our Service</li>
                <li>To process your transactions and manage your subscription</li>
                <li>To train and improve our AI models for better responses</li>
                <li>To generate embeddings and enable semantic search on your content</li>
                <li>To send you technical notices, updates, and support messages</li>
                <li>To respond to your comments, questions, and customer service requests</li>
                <li>To monitor and analyze usage patterns and trends</li>
                <li>To detect, prevent, and address technical issues and security threats</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. AI and Data Processing</h2>
              <p className="mb-4">
                Our Service uses artificial intelligence to process and respond to conversations:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Your content and conversations may be processed by third-party AI providers (e.g., OpenAI)</li>
                <li>We create embeddings (vector representations) of your content for semantic search</li>
                <li>Embeddings are stored in our vector database (Pinecone) for retrieval</li>
                <li>Chat conversations are stored to provide context and improve responses</li>
                <li>We do not use your data to train public AI models without your explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
              <p className="mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (hosting, payment processing, AI processing, analytics)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
              </ul>
              <p className="mb-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Third-Party Services</h2>
              <p className="mb-4">
                Our Service integrates with the following third-party services:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>OpenAI:</strong> For AI-powered chat responses and text embeddings</li>
                <li><strong>Pinecone:</strong> For vector database storage and semantic search</li>
                <li><strong>Stripe:</strong> For payment processing and subscription management</li>
                <li><strong>OAuth Providers:</strong> For authentication (Google, GitHub, etc.)</li>
              </ul>
              <p className="mb-4">
                These services have their own privacy policies, and we encourage you to review them.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Data Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your information:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Encryption of data in transit using TLS/SSL</li>
                <li>Encryption of sensitive data at rest</li>
                <li>Secure authentication using JWT tokens</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication requirements</li>
              </ul>
              <p className="mb-4">
                However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
              <p className="mb-4">
                We retain your information for as long as necessary to provide the Service and fulfill the purposes outlined in this policy:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Account information is retained while your account is active</li>
                <li>Conversation data is retained to provide historical context</li>
                <li>Embeddings are retained to enable search functionality</li>
                <li>Billing information is retained as required for tax and accounting purposes</li>
              </ul>
              <p className="mb-4">
                You can request deletion of your data by contacting us or deleting your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Your Rights and Choices</h2>
              <p className="mb-4">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct your information</li>
                <li><strong>Deletion:</strong> Request deletion of your information</li>
                <li><strong>Data Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
              </ul>
              <p className="mb-4">
                To exercise these rights, please contact us through our support channels.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Cookies and Tracking</h2>
              <p className="mb-4">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Maintain your session and authentication state</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze usage patterns and improve the Service</li>
                <li>Enable security features</li>
              </ul>
              <p className="mb-4">
                You can control cookies through your browser settings, but disabling cookies may affect functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
              <p className="mb-4">
                Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us, and we will take steps to delete such information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. International Data Transfers</h2>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us through our support channels.
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/auth/signup" className="text-primary hover:underline">
            Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
