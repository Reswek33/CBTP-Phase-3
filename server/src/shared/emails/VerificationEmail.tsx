import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Heading,
  Hr,
  Preview,
  Tailwind,
} from "react-email";

interface VerificationEmailProps {
  otp: string;
}

export const VerificationEmail = ({ otp }: VerificationEmailProps) => {
  return (
    <Html lang="en">
      <Head />
      <Preview>Verify your BidSync account with code: {otp}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans py-8 px-4">
          <Container className="max-w-[580px] mx-auto bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <Section className="bg-blue-600 px-8 py-6 text-center">
              <Text className="text-white text-2xl font-bold m-0">
                Bid<span className="font-light">Sync</span>
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-8 py-10">
              <Heading className="text-gray-900 text-2xl font-bold text-center m-0 mb-4">
                Verify Your Email Address
              </Heading>

              <Text className="text-gray-600 text-base leading-relaxed mb-6">
                Thank you for joining BidSync! Please use the verification code
                below to complete your registration. This code is valid for{" "}
                <strong className="text-blue-600">10 minutes</strong>.
              </Text>

              {/* OTP Code */}
              <Section className="bg-gray-50 border border-gray-200 rounded-xl my-8 py-6 text-center">
                <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">
                  Your Verification Code
                </Text>
                <Text className="text-4xl font-mono font-bold text-blue-600 tracking-[0.25em] m-0">
                  {otp}
                </Text>
              </Section>

              {/* Alternative Method */}
              <Text className="text-gray-500 text-sm text-center mb-6">
                Or copy this code:{" "}
                <span className="font-mono font-bold text-gray-700">{otp}</span>
              </Text>

              <Hr className="border-gray-200 my-6" />

              <Text className="text-gray-500 text-xs text-center">
                If you didn't create an account with BidSync, you can safely
                ignore this email.
              </Text>
            </Section>

            {/* Footer */}
            <Section className="bg-gray-50 px-8 py-6 border-t border-gray-200">
              <Text className="text-gray-400 text-xs text-center m-0">
                © {new Date().getFullYear()} BidSync Procurement Platform. All
                rights reserved.
              </Text>
              <Text className="text-gray-400 text-xs text-center mt-2">
                Secure, transparent, and fair procurement for everyone.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VerificationEmail;
