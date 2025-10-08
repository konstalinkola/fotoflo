import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Fotoflo',
  description: 'Privacy Policy for Fotoflo photo sharing service',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> October 8, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                We collect information you provide directly to us, as well as information about your use of our service. This includes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Account Information:</strong> Email address, name, and profile details.</li>
                <li><strong>Photos and Media:</strong> Images and metadata you upload.</li>
                <li><strong>Usage Information:</strong> How you interact with our service, including access logs and analytics.</li>
                <li><strong>Device Information:</strong> IP address, browser type, and device identifiers.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Provide, maintain, and improve our photo sharing service.</li>
                <li>Process and securely store your uploaded photos and media.</li>
                <li>Send you service-related communications.</li>
                <li>Respond to your comments, questions, and support requests.</li>
                <li>Monitor and analyze usage patterns to improve our service.</li>
                <li>Detect and prevent fraud, abuse, or security issues.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described below:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Service Providers:</strong> We may share information with trusted third-party providers who help operate our service.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights, safety, or property.</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational measures to protect your information, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Encryption of data in transit and at rest.</li>
                <li>Regular security assessments and updates.</li>
                <li>Access controls and authentication measures.</li>
                <li>Secure data storage and backup procedures.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Third-Party Services</h2>
              <p className="text-gray-700 mb-4">
                Our service may contain links to third-party websites or integrate with third-party services (e.g., Google OAuth for authentication). We are not responsible for the privacy practices of these third parties. Please review their privacy policies separately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Access and update your personal information.</li>
                <li>Delete your account and associated data.</li>
                <li>Request a copy of your data.</li>
                <li>Opt out of certain communications.</li>
                <li>Withdraw consent for data processing where applicable.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your information as long as your account is active or as needed to provide our services. Some data may be kept for legitimate business purposes or as required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our service is not intended for children under 13. We do not knowingly collect information from children under 13. If we become aware that we have collected such information, we will promptly delete it.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this policy from time to time. Material changes will be communicated by updating this page and the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this privacy policy or our practices, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> info@fotoflo.co<br />
                  <strong>Website:</strong> https://fotoflo.co
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
