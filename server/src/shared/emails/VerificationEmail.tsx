import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Heading,
  Preview,
  Tailwind,
} from "react-email";

interface VerificationEmailProps {
  otp: string;
  name?: string;
}

export const VerificationEmail = ({ otp, name }: VerificationEmailProps) => {
  return (
    <Html lang="en">
      <Tailwind>
        {" "}
        <Head />
        <Preview>Verify your email to start using BidSync</Preview>
        <Body className="bg-gray-900 font-sans my-auto mx-auto py-12 px-4">
          <Container className="max-w-[480px] mx-auto">
            {/* Logo */}
            <Section className="text-center mb-6">
              <Text className="text-2xl font-bold text-white m-0">
                Bid<span className="text-blue-500">Sync</span>
              </Text>
            </Section>

            {/* Main Card */}
            <Section className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <Section className="px-8 pt-8 pb-6">
                {/* Status Indicator */}
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 12V8H4V12M20 12L12 18L4 12M20 12H4"
                        stroke="#3B82F6"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 12V18M4 6H20V12H4V6Z"
                        stroke="#3B82F6"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                <Heading className="text-xl font-semibold text-white text-center m-0 mb-2">
                  Verify your email address
                </Heading>

                <Text className="text-gray-400 text-center text-sm">
                  Enter the code below to confirm your account
                </Text>

                {/* OTP Code - Clean Box */}
                <Section className="my-8">
                  <div className="bg-gray-900 rounded-xl p-5 text-center border border-gray-700">
                    <Text className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">
                      Verification Code
                    </Text>
                    <Text className="text-4xl font-mono font-bold tracking-[0.3em] text-white">
                      {otp}
                    </Text>
                  </div>
                </Section>

                <Text className="text-gray-400 text-xs text-center leading-relaxed">
                  This code will expire in{" "}
                  <span className="text-blue-400">10 minutes</span>. If you
                  didn't request this, please ignore this email.
                </Text>
              </Section>

              <div className="border-t border-gray-700" />

              <Section className="px-8 py-4 bg-gray-800/50">
                <Text className="text-gray-500 text-[11px] text-center">
                  © {new Date().getFullYear()} BidSync. All rights reserved.
                </Text>
                <Text className="text-gray-600 text-[10px] text-center mt-1">
                  123 Commerce Street, Digital City, DC 12345
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VerificationEmail;
